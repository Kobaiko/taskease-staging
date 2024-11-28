import fetch from 'node-fetch';
import { YAAD_CONFIG } from './config';
import type { PaymentSignatureRequest } from './config';

export async function getYaadSignature(params: PaymentSignatureRequest): Promise<string> {
  // Create signature request parameters
  const signParams = new URLSearchParams({
    action: 'APISign',
    What: 'SIGN',
    KEY: process.env.YAAD_API_KEY!,
    Masof: process.env.YAAD_MASOF!,
    PassP: process.env.YAAD_PASSP!,
    Amount: params.Amount,
    Info: params.Info,
    UserId: params.UserId,
    Coin: params.Currency || '1',
    UTF8: 'True',
    UTF8out: 'True',
    Sign: 'True',
    MoreData: 'True'
  });

  console.log('Requesting Yaad signature with params:', {
    ...Object.fromEntries(signParams),
    KEY: '[REDACTED]'
  });

  const response = await fetch(`${YAAD_CONFIG.API_URL}?${signParams.toString()}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Yaad API error:', {
      status: response.status,
      response: errorText
    });
    throw new Error(`Yaad API error: ${response.status} - ${errorText}`);
  }

  const responseText = await response.text();
  const responseParams = new URLSearchParams(responseText);
  const signature = responseParams.get('signature');

  if (!signature) {
    console.error('Invalid Yaad response:', responseText);
    throw new Error('No signature in Yaad response');
  }

  return signature;
}