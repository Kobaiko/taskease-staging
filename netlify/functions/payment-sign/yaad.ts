import fetch from 'node-fetch';
import { YAAD_CONFIG } from './config';
import type { PaymentSignatureRequest } from './config';

export async function getYaadSignature(params: PaymentSignatureRequest): Promise<string> {
  const signParams = new URLSearchParams({
    action: 'APISign',
    What: 'SIGN',
    KEY: process.env.YAAD_API_KEY!,
    Masof: process.env.YAAD_MASOF!,
    PassP: process.env.YAAD_PASSP!,
    ...params,
    UTF8: 'True',
    UTF8out: 'True'
  });

  const response = await fetch(`${YAAD_CONFIG.API_URL}?${signParams.toString()}`);
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Yaad API error: ${response.status} - ${responseText}`);
  }

  const responseParams = new URLSearchParams(responseText);
  const signature = responseParams.get('signature');

  if (!signature) {
    throw new Error('No signature in Yaad response');
  }

  return signature;
}