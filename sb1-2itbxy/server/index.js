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

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task breakdown assistant. Break down tasks into smaller subtasks, each taking no more than 60 minutes."
        },
        {
          role: "user",
          content: `Break down this task into subtasks:\nTitle: ${title}\nDescription: ${description}\n\nProvide subtasks in JSON format with title and estimatedTime (in minutes) properties.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    res.json({ subtasks: result.subtasks });
  } catch (error) {
    console.error('Error generating subtasks:', error);
    res.status(500).json({ 
      error: 'Failed to generate subtasks',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});