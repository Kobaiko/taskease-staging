import type { SubTask } from '../types';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://app.gettaskease.com/api'
  : 'http://localhost:3001/api';

export async function generateSubtasks(title: string, description: string) {
  try {
    const response = await fetch(`${API_URL}/generate-subtasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description
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