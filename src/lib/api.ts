import OpenAI from 'openai';

export async function generateSubtasks(title: string, description: string) {
  try {
    const response = await fetch('http://localhost:3001/api/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate subtasks';
      try {
        const errorData = await response.json();
        errorMessage = errorData.details || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.subtasks || !Array.isArray(data.subtasks)) {
      throw new Error('Invalid response format from server');
    }

    return data.subtasks.map((subtask: any) => ({
      id: crypto.randomUUID(),
      title: subtask.title,
      estimatedTime: Math.min(subtask.estimatedTime, 60),
      completed: false
    }));
  } catch (error) {
    console.error('Error generating subtasks:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate subtasks: ${error.message}`);
    }
    throw new Error('Failed to generate subtasks. Please try again.');
  }
}