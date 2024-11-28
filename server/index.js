import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://staging.gettaskease.com'
  ],
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

app.post('/api/payment/sign', async (req, res) => {
  try {
    const params = req.body;
    
    // Add required APISign parameters
    const signParams = {
      ...params,
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.YAAD_API_KEY
    };

    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    Object.entries(signParams).forEach(([key, value]) => {
      searchParams.append(key, value);
    });

    // Make request to Yaad Pay
    const response = await fetch(`https://pay.hyp.co.il/p/?${searchParams.toString()}`);
    
    if (!response.ok) {
      console.error('Yaad Pay error:', await response.text());
      throw new Error(`Yaad Pay error: ${response.status}`);
    }

    const data = await response.text();
    console.log('Yaad Pay response:', data);

    // Extract signature from response
    const responseParams = new URLSearchParams(data);
    const signature = responseParams.get('signature');

    if (!signature) {
      throw new Error('No signature in response');
    }

    res.json({ signature });
  } catch (error) {
    console.error('Payment signature error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Handle all other routes by serving the index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});