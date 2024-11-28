import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const params = JSON.parse(event.body);

    // Create signature request parameters
    const signParams = new URLSearchParams({
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.VITE_YAAD_API_KEY || '',
      Masof: process.env.VITE_YAAD_MASOF || '',
      PassP: process.env.VITE_YAAD_PASSP || '',
      Amount: params.Amount || '',
      Info: params.Info || '',
      UserId: params.UserId || '',
      UTF8: 'True',
      UTF8out: 'True',
      Sign: 'True',
      MoreData: 'True'
    });

    // Make request to Yaad API
    const response = await fetch(`https://pay.hyp.co.il/p/?${signParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Yaad API error: ${response.status}`);
    }

    const responseText = await response.text();
    const responseParams = new URLSearchParams(responseText);
    const signature = responseParams.get('signature');

    if (!signature) {
      throw new Error('No signature in response');
    }

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