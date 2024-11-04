import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string) {
  try {
    const prompt = `You are Taskease, an expert project manager. Your role is to take a high-level task description and break it down into multiple, manageable subtasks that each require 60 minutes or less to complete. If a subtask exceeds 60 minutes, split it further into smaller, actionable steps.

Task Title: ${title}
Task Description: ${description}

For each subtask:
1. Provide a clear and concise description
2. Estimate the time required (maximum 60 minutes per subtask)
3. Ensure logical sequencing where tasks are dependent on one another
4. Keep estimates practical, based on typical completion times

Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
Example:
{
  "subtasks": [
    {"title": "Research audience interests and trending topics", "estimatedTime": 45},
    {"title": "Outline key messaging points", "estimatedTime": 30},
    {"title": "Draft initial content ideas", "estimatedTime": 60},
    {"title": "Review and refine drafts", "estimatedTime": 30}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Taskease, an expert project manager that breaks down tasks into practical, actionable subtasks. Always return valid JSON with realistic time estimates."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response content received from OpenAI');
    }

    const result = JSON.parse(content);
    
    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from OpenAI');
    }

    return result.subtasks.map(subtask => ({
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