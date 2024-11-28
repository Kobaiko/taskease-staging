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

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

// API Routes
app.post('/api/payment/sign', async (req, res) => {
  try {
    const params = req.body;
    console.log('Received params:', params);
    
    // Add required APISign parameters
    const signParams = {
      ...params,
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.YAAD_API_KEY
    };

    console.log('Sending to Yaad:', signParams);

    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    Object.entries(signParams).forEach(([key, value]) => {
      searchParams.append(key, value);
    });

    const yaadUrl = `https://pay.hyp.co.il/p/?${searchParams.toString()}`;
    console.log('Calling Yaad URL:', yaadUrl);

    // Make request to Yaad Pay
    const response = await fetch(yaadUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yaad Pay error:', errorText);
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

    console.log('Extracted signature:', signature);
    res.json({ signature });
  } catch (error) {
    console.error('Payment signature error:', error);
    res.status(500).json({ error: error.message });
  }
});

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { task } = req.body;
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful task breakdown assistant. Break down the given task into 3-5 concrete, actionable subtasks. Format your response as a JSON array of strings, each string being a subtask."
        },
        {
          role: "user",
          content: task
        }
      ],
      model: "gpt-3.5-turbo",
    });

    const subtasks = JSON.parse(completion.choices[0].message.content);
    res.json({ subtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});