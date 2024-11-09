import type { SubTask } from '../types';

export interface SubTaskResponse {
  title: string;
  estimatedTime: number;
}

export async function generateSubtasks(title: string, description: string): Promise<SubTask[]> {
  try {
    console.log('Generating subtasks for:', { title, description });
    
    const response = await fetch('/api/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description })
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
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }

    console.log('Received subtasks:', data.subtasks);

    return data.subtasks.map(subtask => ({
      id: crypto.randomUUID(),
      title: String(subtask.title),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    throw error instanceof Error ? error : new Error('Failed to generate subtasks');
  }
}

export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/test');
    const data = await response.json();
    console.log('API test response:', data);
    return true;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}