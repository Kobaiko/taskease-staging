import { Handler } from '@netlify/functions';
import { corsHeaders } from './config';
import { validateEnvironment, validateRequest } from './validation';
import { getYaadSignature } from './yaad';

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Validate request method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate environment and request
    validateEnvironment();
    const params = validateRequest(JSON.parse(event.body || '{}'));

    // Get signature from Yaad
    const signature = await getYaadSignature(params);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature })
    };

  } catch (error) {
    console.error('Payment signature error:', error);

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate payment signature',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};