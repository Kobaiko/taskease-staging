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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.details || 'Failed to generate subtasks');
    }

    const data = await response.json();
    console.log('Raw API response:', data);

    // Extract subtasks array from response
    const subtasks = data.subtasks;
    
    if (!Array.isArray(subtasks)) {
      throw new Error('Invalid response format: subtasks is not an array');
    }

    // Return the subtasks array directly
    return subtasks;
  } catch (error) {
    console.error('Error in generateSubtasks:', error);
    throw error;
  }
}