import OpenAI from 'openai';
import type { SubTask } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string, existingSubtasks: SubTask[] = []) {
  try {
    const response = await fetch('/api/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        existingSubtasks
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate subtasks');
    }

    const data = await response.json();
    return data.subtasks.map((st: any) => ({
      id: crypto.randomUUID(),
      title: st.title,
      estimatedTime: Math.min(st.estimatedTime, 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    throw new Error('Failed to generate subtasks. Please try again.');
  }
}