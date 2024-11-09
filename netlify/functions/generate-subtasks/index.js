import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://app.gettaskease.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  try {
    // Parse the incoming request body
    const { title, description } = JSON.parse(event.body);

    if (!title || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'Both title and description are required'
        })
      };
    }

    const prompt = `Create a detailed breakdown of this task into smaller subtasks, where each subtask takes no more than 60 minutes:
    Task: ${title}
    Description: ${description}
    
    Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
    Example: {"subtasks": [{"title": "Research competitors", "estimatedTime": 45}]}`;

    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "system", 
        content: "You are a task breakdown assistant. Always respond with valid JSON containing subtasks array."
      }, {
        role: "user",
        content: prompt
      }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    if (!result.subtasks || !Array.isArray(result.subtasks)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and sanitize subtasks
    const sanitizedSubtasks = result.subtasks.map(subtask => ({
      title: String(subtask.title).trim(),
      estimatedTime: Math.min(Math.max(1, Number(subtask.estimatedTime)), 60)
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ subtasks: sanitizedSubtasks }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://app.gettaskease.com',
        'Access-Control-Allow-Credentials': 'true'
      }
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate subtasks',
        details: error.message
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://app.gettaskease.com',
        'Access-Control-Allow-Credentials': 'true'
      }
    };
  }
};