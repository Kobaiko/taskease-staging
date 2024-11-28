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

// Enable CORS for development and staging
app.use(cors({
  origin: ['http://localhost:5173', 'https://staging.gettaskease.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

app.post('/api/payment/sign', async (req, res) => {
  try {
    const params = {
      ...req.body,
      action: 'APISign',
      What: 'SIGN',
      KEY: Date.now().toString(16)
    };

    // Remove sensitive data
    delete params.PassP;
    delete params.Sign;
    delete params.signature;

    // Build URL
    const urlParams = new URLSearchParams(params);
    const signUrl = `https://pay.hyp.co.il/p/?${urlParams.toString()}`;

    console.log('Calling Yaad API:', signUrl); // For debugging

    // Call Yaad API
    const response = await fetch(signUrl);
    const signatureText = await response.text();

    console.log('Yaad Response:', signatureText); // For debugging

    // Extract signature
    const signatureMatch = signatureText.match(/&signature=([^&]+)$/);
    if (!signatureMatch) {
      throw new Error('No signature in response');
    }

    res.json({ signature: signatureMatch[1] });
  } catch (error) {
    console.error('Error getting signature:', error);
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