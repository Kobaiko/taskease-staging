import { API_ENDPOINTS } from '../../lib/constants';
import { PaymentError, ValidationError } from '../../lib/errors';
import { getPaymentSignature } from './signature';
import { createPaymentParams } from './utils';
import type { PaymentOptions } from '../../types/payment';

export async function processPayment(
  userId: string,
  amount: number,
  options: PaymentOptions = {}
): Promise<string> {
  try {
    if (!userId) throw new ValidationError('User ID is required');
    if (amount <= 0) throw new ValidationError('Amount must be greater than 0');

    const params = createPaymentParams(userId, amount, options);
    const signature = await getPaymentSignature(params);
    params.signature = signature;

    const urlParams = new URLSearchParams(params);
    return `${API_ENDPOINTS.PAYMENT.YAAD_URL}?${urlParams.toString()}`;
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }
    throw new PaymentError('Failed to process payment', undefined, error);
  }
}