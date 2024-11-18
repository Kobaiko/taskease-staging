import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { title, description } = JSON.parse(event.body);

    if (!title || !description) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'Both title and description are required'
        })
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a task breakdown assistant. Always respond with valid JSON containing subtasks array."
        },
        {
          role: "user",
          content: `Break down this task into smaller subtasks (max 60 minutes each):
            Title: ${title}
            Description: ${description}
            
            Return ONLY a JSON object with a 'subtasks' array containing objects with 'title' and 'estimatedTime' (in minutes) properties.
            Example: {"subtasks": [{"title": "Research competitors", "estimatedTime": 45}]}`
        }
      ],
      response_format: { type: "json_object" }
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subtasks: sanitizedSubtasks })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to generate subtasks',
        details: error.message
      })
    };
  }
};