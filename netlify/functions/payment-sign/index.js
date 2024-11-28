import fetch from 'node-fetch';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const YAAD_API_URL = 'https://pay.hyp.co.il/p/';

export const handler = async (event) => {
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
    // Validate environment variables
    if (!process.env.YAAD_API_KEY || !process.env.YAAD_MASOF) {
      throw new Error('Missing required environment variables');
    }

    // Parse and validate request parameters
    const params = JSON.parse(event.body);
    
    // Create signature request parameters
    const signParams = new URLSearchParams({
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.YAAD_API_KEY,
      Masof: process.env.YAAD_MASOF,
      Amount: params.Amount || '',
      Currency: params.Currency || '1',
      Info: params.Info || '',
      UserId: params.UserId || '',
      UTF8: 'True',
      UTF8out: 'True'
    });

    console.log('Requesting signature with params:', {
      ...Object.fromEntries(signParams),
      KEY: '[REDACTED]'
    });

    // Make request to Yaad API
    const yaadResponse = await fetch(`${YAAD_API_URL}?${signParams.toString()}`);
    const responseText = await yaadResponse.text();

    // Handle API errors
    if (!yaadResponse.ok) {
      console.error('Yaad API error:', {
        status: yaadResponse.status,
        response: responseText
      });
      throw new Error(`Yaad API error: ${yaadResponse.status}`);
    }

    // Parse signature from response
    const responseParams = new URLSearchParams(responseText);
    const signature = responseParams.get('signature');

    if (!signature) {
      console.error('Invalid response:', responseText);
      throw new Error('No signature in response');
    }

    console.log('Payment signature generated successfully');

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature })
    };

  } catch (error) {
    console.error('Payment signature error:', {
      message: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate payment signature',
        details: error.message 
      })
    };
  }
};