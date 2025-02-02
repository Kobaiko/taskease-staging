import { API_ENDPOINTS } from '../lib/constants';

interface PaymentParams {
  Amount: string;
  Currency?: string;
  Info: string;
  UserId: string;
  [key: string]: string | undefined;
}

interface PaymentOptions {
  isSubscription?: boolean;
  isYearly?: boolean;
}

export class PaymentError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'PaymentError';
  }
}

async function getPaymentSignature(params: PaymentParams): Promise<string> {
  try {
    const response = await fetch(`${API_ENDPOINTS.PAYMENT.BASE_URL}/payment-sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to get signature: ${response.status}`);
    }

    const data = await response.json();
    return data.signature;
  } catch (error) {
    throw new PaymentError('Failed to get payment signature', error);
  }
}

export async function processPayment(
  userId: string,
  amount: number,
  options: PaymentOptions = {}
): Promise<string> {
  try {
    const { isSubscription = false, isYearly = false } = options;

    // Convert amount to ILS (1 USD ≈ 3.7 ILS)
    const amountInILS = Math.round(amount * 3.7 * 100) / 100;

    const params: PaymentParams = {
      Amount: amountInILS.toString(),
      Info: isSubscription 
        ? `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription` 
        : 'TaskEase Credits',
      UserId: userId,
      Currency: '1', // ILS
      UTF8: 'True',
      UTF8out: 'True',
      Sign: 'True',
      MoreData: 'True'
    };

    if (isSubscription) {
      Object.assign(params, {
        HK: 'True',
        Tash: isYearly ? '12' : '1',
        freq: isYearly ? 'yearly' : 'monthly',
        OnlyOnApprove: 'True'
      });
    }

    const signature = await getPaymentSignature(params);
    params.signature = signature;

    const urlParams = new URLSearchParams({
      ...params,
      Masof: import.meta.env.VITE_YAAD_MASOF,
      PassP: import.meta.env.VITE_YAAD_PASSP
    });

    return `${API_ENDPOINTS.PAYMENT.YAAD_URL}?${urlParams.toString()}`;
  } catch (error) {
    throw new PaymentError('Failed to process payment', error);
  }
}

export function verifyPayment(response: any): boolean {
  const validCodes = ['0', '800'];
  return validCodes.includes(response.CCode);
}