import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS with specific origins
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'https://app.gettaskease.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Initialize OpenAI only if API key is available
let openai;
try {
  if (!process.env.VITE_OPENAI_API_KEY) {
    throw new Error('VITE_OPENAI_API_KEY environment variable is missing');
  }
  openai = new OpenAI({
    apiKey: process.env.VITE_OPENAI_API_KEY
  });
} catch (error) {
  console.error('OpenAI initialization error:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    openai: openai ? 'configured' : 'not configured'
  });
});

// API endpoints
app.post('/api/generate-subtasks', async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'OpenAI service is not configured'
    });
  }

  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both title and description are required'
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Taskease, a professional project manager that breaks down tasks into clear, actionable subtasks. Always return valid JSON with realistic time estimates."
        },
        {
          role: "user",
          content: `Break down this task into smaller subtasks (max 60 minutes each):
            Task: ${title}
            Description: ${description}
            
            Return only a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
            Example: {"subtasks": [{"title": "Research competitors", "estimatedTime": 45}]}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    const result = JSON.parse(content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and sanitize subtasks
    const sanitizedSubtasks = result.subtasks.map(subtask => ({
      title: String(subtask.title),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60)
    }));

    res.json({ subtasks: sanitizedSubtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtasks',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/api/health`);
});