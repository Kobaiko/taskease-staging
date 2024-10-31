import { load } from 'dotenv';

// Load environment variables from the .env file
load();

// Export the OpenAI API key
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
