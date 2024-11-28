import { API_ENDPOINTS } from '../../lib/constants';
import { SignatureError } from '../../lib/errors';
import type { PaymentParams } from '../../types/payment';

export async function getPaymentSignature(params: PaymentParams): Promise<string> {
  try {
    const response = await fetch(`${API_ENDPOINTS.PAYMENT.BASE_URL}${API_ENDPOINTS.PAYMENT.SIGNATURE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new SignatureError(
        `Failed to get signature: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    const data = await response.json();
    if (!data.signature) {
      throw new SignatureError('No signature received from server');
    }

    return data.signature;
  } catch (error) {
    if (error instanceof SignatureError) {
      throw error;
    }
    throw new SignatureError('Failed to get payment signature', error);
  }
}