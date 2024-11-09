import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://app.gettaskease.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.static(join(__dirname, '../dist')));

// Initialize OpenAI with fallback for demo mode
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

// Mock response for demo mode
const mockSubtasks = [
  { title: "Research and gather requirements", estimatedTime: 45 },
  { title: "Create initial project setup", estimatedTime: 30 },
  { title: "Implement core functionality", estimatedTime: 60 },
  { title: "Write basic documentation", estimatedTime: 25 },
  { title: "Test and debug", estimatedTime: 40 },
  { title: "Review and finalize", estimatedTime: 30 }
];

app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { title, description, existingSubtasks = [] } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both title and description are required'
      });
    }

    // Use mock data if in demo mode
    if (process.env.OPENAI_API_KEY === 'demo-key') {
      return res.json({ subtasks: mockSubtasks });
    }

    const existingSubtasksText = existingSubtasks.length > 0 
      ? `\n\nExisting subtasks that have already been created:\n${existingSubtasks.map(st => 
          `- ${st.title} (${st.estimatedTime} minutes)`).join('\n')}`
      : '';

    const prompt = `Create a detailed breakdown of this task into smaller subtasks, where each subtask takes no more than 60 minutes. Avoid creating subtasks that are similar to any existing ones:
    Task: ${title}
    Description: ${description}${existingSubtasksText}
    
    Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
    Example: {"subtasks": [{"title": "Research competitors", "estimatedTime": 45}]}
    
    Important:
    - Each subtask should be unique and not overlap with existing subtasks
    - Focus on complementing the existing subtasks if any are provided
    - Ensure logical progression of tasks`;

    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are a task breakdown assistant. Always respond with valid JSON containing subtasks array. Ensure tasks are unique and don't overlap with existing ones."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
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
    // Fallback to mock data in case of any error
    res.json({ subtasks: mockSubtasks });
  }
});

// Handle all other routes by serving the index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  if (process.env.OPENAI_API_KEY === 'demo-key') {
    console.log('Running in demo mode with mock data');
  }
});