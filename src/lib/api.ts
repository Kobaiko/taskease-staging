import type { SubTask } from '../types';

export async function generateSubtasks(title: string, description: string): Promise<SubTask[]> {
  try {
    const response = await fetch('https://app.gettaskease.com/api/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Unknown error',
        details: `Server responded with status ${response.status}`
      }));
      
      throw new Error(errorData.details || errorData.error || `Failed to generate subtasks: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !data.subtasks || !Array.isArray(data.subtasks)) {
      throw new Error('Invalid response format from server');
    }

    return data.subtasks.map(subtask => ({
      id: crypto.randomUUID(),
      title: String(subtask.title),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    throw new Error(`Failed to generate subtasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}