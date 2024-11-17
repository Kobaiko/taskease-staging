import type { SubTask } from '../types';

export async function generateSubtasks(title: string, description: string): Promise<SubTask[]> {
  try {
    const response = await fetch('/.netlify/functions/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to generate subtasks');
    }

    const { subtasks } = await response.json();
    
    if (!subtasks || !Array.isArray(subtasks)) {
      throw new Error('Invalid response format');
    }

    return subtasks.map((st: any) => ({
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