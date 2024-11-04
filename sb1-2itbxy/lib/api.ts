import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string) {
  try {
    const prompt = `Create a list of subtasks for the following task:
    Title: ${title}
    Description: ${description}
    
    Generate 3-5 subtasks, each with an estimated time in minutes (max 60 minutes per subtask).
    Format the response as a JSON array with objects containing 'title' and 'estimatedTime' properties.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task management assistant that helps break down tasks into smaller subtasks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.subtasks;
  } catch (error) {
    console.error('Error generating subtasks:', error);
    throw error;
  }
}