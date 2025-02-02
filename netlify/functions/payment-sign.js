const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const params = JSON.parse(event.body);
    console.log('Received params:', params);
    
    if (!process.env.YAAD_API_KEY) {
      throw new Error('YAAD_API_KEY environment variable is not set');
    }

    // Add required APISign parameters
    const signParams = {
      ...params,
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.YAAD_API_KEY
    };

    console.log('Sending to Yaad:', { ...signParams, KEY: '[REDACTED]' });

    // Convert params to URLSearchParams
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(signParams)) {
      searchParams.append(key, value);
    }

    // Make request to Yaad API
    const yaadResponse = await fetch('https://icom.yaad.net/p/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: searchParams.toString()
    });

    if (!yaadResponse.ok) {
      throw new Error(`Yaad API error! status: ${yaadResponse.status}`);
    }

    const data = await yaadResponse.text();
    console.log('Yaad response:', data);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ signature: data })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
