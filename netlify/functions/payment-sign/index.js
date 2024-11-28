import fetch from 'node-fetch';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const YAAD_API_URL = 'https://icom.yaad.net/p/';

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
    if (!process.env.YAAD_API_KEY) {
      throw new Error('YAAD_API_KEY environment variable is not set');
    }

    // Parse and validate request parameters
    const params = JSON.parse(event.body);
    const requiredParams = ['Masof', 'Amount', 'Info'];
    const missingParams = requiredParams.filter(param => !params[param]);
    
    if (missingParams.length > 0) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          details: missingParams
        })
      };
    }

    // Create signature request parameters
    const signParams = new URLSearchParams({
      ...params,
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.YAAD_API_KEY
    });

    // Make request to Yaad API
    const yaadResponse = await fetch(YAAD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: signParams.toString()
    });

    // Handle API errors
    if (!yaadResponse.ok) {
      const errorText = await yaadResponse.text();
      console.error('Yaad API error:', {
        status: yaadResponse.status,
        response: errorText
      });
      
      throw new Error(`Yaad API error: ${yaadResponse.status}`);
    }

    // Parse and validate signature
    const signature = await yaadResponse.text();
    if (!signature || signature.length < 32) {
      throw new Error('Invalid signature received from Yaad');
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