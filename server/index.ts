import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://app.gettaskease.com',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ADDED: Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ADDED: Test endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// API endpoint for generating subtasks
app.post('/api/generate-subtasks', async (req: Request, res: Response) => {
  try {
    // ADDED: Log incoming request
    console.log('Received generate-subtasks request:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both title and description are required'
      });
    }

    const prompt = `Break down this task into smaller subtasks (max 60 minutes each):
Title: ${title}
Description: ${description}

Return only a JSON array of objects with 'title' and 'estimatedTime' (in minutes) properties.
Example: [{"title": "Research competitors", "estimatedTime": 45}]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are a task breakdown assistant. Provide detailed subtasks with realistic time estimates." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    
    // ADDED: Log successful response
    console.log('Successfully generated subtasks:', response.subtasks);

    res.json({ subtasks: response.subtasks });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MOVED: Static files serving to the end
app.use(express.static(join(__dirname, '../dist')));

// MOVED: Catch-all route after API routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// ADDED: Global error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message || 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at https://app.gettaskease.com/api/*`);
});