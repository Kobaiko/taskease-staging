import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string) {
  try {
    const response = await fetch('/api/generate-subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to generate subtasks');
    }

    const data = await response.json();
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