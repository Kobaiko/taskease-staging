import { PaymentError } from '../../lib/errors';
import { validatePaymentResponse } from './validation';
import type { PaymentResponse } from '../../types/payment';

export async function verifyPayment(paymentResponse: PaymentResponse): Promise<boolean> {
  try {
    return validatePaymentResponse(paymentResponse);
  } catch (error) {
    throw new PaymentError('Failed to verify payment', undefined, error);
  }
}