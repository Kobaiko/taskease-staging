import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3001;

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS configuration
app.use(cors({
  origin: 'https://app.gettaskease.com',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json());

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API endpoint for generating subtasks
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
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response received from OpenAI');
    }

    const result = JSON.parse(completion.choices[0].message.content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and sanitize subtasks
    const sanitizedSubtasks = result.subtasks.map(subtask => ({
      title: String(subtask.title).trim(),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60)
    }));

    res.json({ subtasks: sanitizedSubtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    
    // Send appropriate error response
    if (error instanceof SyntaxError) {
      res.status(500).json({ 
        error: 'Invalid response format',
        details: 'Failed to parse AI response'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate subtasks',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
});

// Static file serving for production
app.use(express.static(join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    details: 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});