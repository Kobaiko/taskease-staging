import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Basic security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// Configure CORS
app.use(cors({
  origin: isDevelopment 
    ? ['http://localhost:5173', 'http://localhost:3001'] 
    : ['https://app.gettaskease.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Verify OpenAI API key
const apiKey = process.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  console.error('OpenAI API key is missing. Please check your .env file.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

// API Routes
app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both title and description are required'
      });
    }

    const prompt = `Create a detailed breakdown of this task into smaller subtasks, where each subtask takes no more than 60 minutes:
    Task: ${title}
    Description: ${description}
    
    Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
    Example: {"subtasks": [{"title": "Research competitors", "estimatedTime": 45}]}`;

    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "system", 
        content: "You are a task breakdown assistant. Always respond with valid JSON containing subtasks array."
      }, {
        role: "user",
        content: prompt
      }],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    const sanitizedSubtasks = result.subtasks.map(subtask => ({
      title: String(subtask.title),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60)
    }));

    res.json({ subtasks: sanitizedSubtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtasks',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files in production
if (!isDevelopment) {
  const staticPath = join(__dirname, '../dist');
  
  // Serve static files
  app.use(express.static(staticPath, {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'max-age=31536000');
      }
    },
  }));

  // Handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(join(staticPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running in ${isDevelopment ? 'development' : 'production'} mode on port ${port}`);
});