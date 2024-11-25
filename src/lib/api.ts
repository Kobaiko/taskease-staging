import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generateSubtasks(title: string, description: string) {
  try {
    const prompt = `Analyze and break down the following task into detailed subtasks:

TASK INFORMATION:
Title: ${title}
Description: ${description}

ANALYSIS REQUIREMENTS:
- Generate between 10-20 subtasks
- Each subtask must be:
  • Clearly defined with specific outcomes
  • Self-contained and independently actionable
  • Properly scoped (not too broad or too narrow)
  • Labeled with required skills/resources

For each subtask, provide:
- Clear, action-oriented description
- Estimated time (in minutes, maximum 60 per subtask)
- Complexity level (Low/Medium/High)
- Priority level (1-3, where 1 is highest)
- Dependencies on other subtasks
- Prerequisites (knowledge/tools needed)

Consider including:
- Setup and preparation steps
- Quality assurance and testing
- Documentation requirements
- Review and approval stages
- Potential roadblocks
- Contingency time for issues

Return ONLY a JSON object with the following structure:
{
  "analysis": {
    "totalEstimatedTime": "X-Y hours",
    "recommendedTeamSize": X,
    "keySkills": ["skill1", "skill2"]
  },
  "subtasks": [
    {
      "title": "Subtask title",
      "description": "Clear description",
      "estimatedTime": 30,
      "complexity": "Low/Medium/High",
      "priority": 1,
      "dependencies": ["subtask1", "subtask2"],
      "prerequisites": ["prerequisite1", "prerequisite2"],
      "challenges": ["challenge1", "challenge2"]
    }
  ],
  "criticalPath": ["step1", "step2"],
  "risks": ["risk1", "risk2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional project manager and task analysis expert. Provide detailed, actionable task breakdowns with realistic time estimates and comprehensive analysis."
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
      description: subtask.description,
      estimatedTime: Math.min(subtask.estimatedTime, 60),
      complexity: subtask.complexity,
      priority: subtask.priority,
      dependencies: subtask.dependencies,
      prerequisites: subtask.prerequisites,
      challenges: subtask.challenges,
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