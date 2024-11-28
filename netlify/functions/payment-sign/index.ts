import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const YAAD_API_URL = 'https://pay.hyp.co.il/p/';

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
    if (!process.env.YAAD_API_KEY || !process.env.YAAD_MASOF || !process.env.YAAD_PASSP) {
      throw new Error('Missing required environment variables');
    }

    const params = JSON.parse(event.body || '{}');
    
    const signParams = new URLSearchParams({
      action: 'APISign',
      What: 'SIGN',
      KEY: process.env.YAAD_API_KEY,
      Masof: process.env.YAAD_MASOF,
      PassP: process.env.YAAD_PASSP,
      Amount: params.Amount?.toString() || '',
      Info: params.Info || '',
      UserId: params.UserId || '',
      UTF8: 'True',
      UTF8out: 'True',
      Coin: params.Currency || '1'
    });

    console.log('Requesting signature with params:', {
      ...Object.fromEntries(signParams),
      KEY: '[REDACTED]'
    });

    const yaadResponse = await fetch(`${YAAD_API_URL}?${signParams.toString()}`);
    
    if (!yaadResponse.ok) {
      const errorText = await yaadResponse.text();
      console.error('Yaad API error:', {
        status: yaadResponse.status,
        response: errorText
      });
      throw new Error(`Yaad API error: ${yaadResponse.status}`);
    }

    const responseText = await yaadResponse.text();
    const responseParams = new URLSearchParams(responseText);
    const signature = responseParams.get('signature');

    if (!signature) {
      console.error('Invalid response:', responseText);
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