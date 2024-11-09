import { SubTask } from '../types';

interface APIResponse {
  subtasks: Array<{
    title: string;
    estimatedTime: number;
  }>;
}

interface APIError {
  error: string;
  message: string;
}

export async function generateSubtasks(title: string, description: string): Promise<SubTask[]> {
  try {
    const response = await fetch('/api/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description })
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json() as APIError;
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json() as APIResponse;

    if (!data.subtasks || !Array.isArray(data.subtasks)) {
      throw new Error('Invalid response format from server');
    }

    return data.subtasks.map(subtask => ({
      id: crypto.randomUUID(),
      title: subtask.title,
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate subtasks');
  }
}