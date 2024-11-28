import { z } from 'zod';

export const PaymentSignatureSchema = z.object({
  Amount: z.string().min(1),
  Currency: z.string().default('1'),
  Info: z.string().min(1),
  UserId: z.string().min(1)
});

export type PaymentSignatureRequest = z.infer<typeof PaymentSignatureSchema>;

export const YAAD_CONFIG = {
  API_URL: 'https://pay.hyp.co.il/p/',
  REQUIRED_ENV_VARS: ['YAAD_API_KEY', 'YAAD_MASOF', 'YAAD_PASSP'] as const
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};