import { PaymentSignatureSchema, type PaymentSignatureRequest } from './config';

export function validateEnvironment(): void {
  const missingVars = ['YAAD_API_KEY', 'YAAD_MASOF', 'YAAD_PASSP'].filter(
    key => !process.env[key]
  );

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export function validateRequest(data: unknown): PaymentSignatureRequest {
  const result = PaymentSignatureSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Invalid request parameters: ${result.error.message}`);
  }

  return result.data;
}