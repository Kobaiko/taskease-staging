import { PaymentSignatureSchema, type PaymentSignatureRequest } from './config';

export function validateEnvironment(): void {
  const missingVars = ['YAAD_API_KEY', 'YAAD_MASOF', 'YAAD_PASSP'].filter(
    key => !process.env[key]
  );

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export function formatUserId(userId: string): string {
  // For testing, use a valid test ID
  if (process.env.NODE_ENV === 'development') {
    return '000000000';
  }

  // Remove any non-numeric characters
  const cleanId = userId.replace(/\D/g, '');

  // Pad with zeros if needed
  const paddedId = cleanId.padStart(9, '0');

  // Validate the length
  if (paddedId.length !== 9) {
    throw new Error('User ID must be 9 digits');
  }

  return paddedId;
}

export function validateRequest(data: unknown): PaymentSignatureRequest {
  const result = PaymentSignatureSchema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Invalid request parameters: ${result.error.message}`);
  }

  // Format and validate the user ID
  try {
    result.data.UserId = formatUserId(result.data.UserId);
  } catch (error) {
    throw new Error('Invalid User ID format - must be 9 digits');
  }

  return result.data;
}