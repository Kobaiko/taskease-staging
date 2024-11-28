import { HYP_API, type PaymentParams, type PaymentResponse } from '../../lib/hyp';
import { API_ENDPOINTS } from '../../lib/constants';
import { PaymentError, SignatureError } from '../../lib/errors';

export class HypClient {
  private baseUrl: string;
  private masof: string;
  private passP: string;

  constructor() {
    this.baseUrl = HYP_API.BASE_URL;
    this.masof = import.meta.env.VITE_YAAD_MASOF;
    this.passP = import.meta.env.VITE_YAAD_PASSP;
  }

  private async getSignature(params: Partial<PaymentParams>): Promise<string> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.PAYMENT.BASE_URL}${API_ENDPOINTS.PAYMENT.SIGNATURE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        throw new SignatureError(`Failed to get signature: ${response.status}`);
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

  async createPaymentUrl(params: PaymentParams): Promise<string> {
    try {
      const signature = await this.getSignature(params);
      const urlParams = new URLSearchParams({
        ...params,
        signature,
        Masof: this.masof,
        PassP: this.passP
      });

      return `${this.baseUrl}?${urlParams.toString()}`;
    } catch (error) {
      throw new PaymentError('Failed to create payment URL', undefined, error);
    }
  }

  async verifyPayment(response: PaymentResponse): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        action: HYP_API.ACTIONS.API_SIGN,
        What: HYP_API.ACTIONS.VERIFY,
        Masof: this.masof,
        PassP: this.passP,
        ...response
      });

      const verifyResponse = await fetch(`${this.baseUrl}?${params.toString()}`);
      if (!verifyResponse.ok) {
        throw new Error(`Verification failed: ${verifyResponse.status}`);
      }

      const data = await verifyResponse.json();
      return data.CCode === '0';
    } catch (error) {
      throw new PaymentError('Failed to verify payment', undefined, error);
    }
  }
}

export const hypClient = new HypClient();