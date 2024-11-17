import type { SubTask } from '../types';

export async function generateSubtasks(title: string, description: string): Promise<SubTask[]> {
  try {
    console.log('Sending request to generate subtasks:', { title, description });
    
    const response = await fetch('/.netlify/functions/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from server:', errorData);
      throw new Error(errorData.details || 'Failed to generate subtasks');
    }

    const data = await response.json();
    console.log('Received response:', data);
    
    if (!data.subtasks || !Array.isArray(data.subtasks)) {
      throw new Error('Invalid response format');
    }

    return data.subtasks.map((st: any) => ({
      id: crypto.randomUUID(),
      title: st.title,
      estimatedTime: Math.min(st.estimatedTime, 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    throw error;
  }
}