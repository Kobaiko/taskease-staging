import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string) {
  try {
    const prompt = `You are Taskease, a professional project manager. Your task is to receive a high-level project description and break it down into a sequence of 6-12 clear, actionable subtasks. Each subtask should take no longer than 60 minutes to complete. If a task exceeds this limit, divide it further into smaller steps.

For each subtask:
1. Write a precise, professional description.
2. Provide a realistic time estimate for completion, keeping it within the 60-minute threshold.
3. Arrange subtasks in a logical order, considering dependencies or prerequisites as needed.

Task Title: ${title}
Task Description: ${description}

Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.

Example:
{
  "subtasks": [
    {"title": "Research target demographics and industry trends", "estimatedTime": 45},
    {"title": "Outline campaign objectives and goals", "estimatedTime": 30},
    {"title": "Identify key messaging points and themes", "estimatedTime": 40},
    {"title": "Develop a list of potential promotional channels", "estimatedTime": 50},
    {"title": "Draft a budget outline", "estimatedTime": 30},
    {"title": "Review and refine proposal content", "estimatedTime": 60}
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are Taskease, a professional project manager that breaks down tasks into clear, actionable subtasks. Always return valid JSON with realistic time estimates."
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

    return result.subtasks.map((subtask: { title: string; estimatedTime: number }) => ({
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