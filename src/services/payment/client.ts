import { HYP_API, type PaymentParams, type PaymentResponse } from '../../lib/hyp';

export class HypClient {
  private baseUrl: string;
  private masof: string;
  private passP: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = HYP_API.BASE_URL;
    this.masof = import.meta.env.VITE_YAAD_MASOF;
    this.passP = import.meta.env.VITE_YAAD_PASSP;
    this.apiKey = import.meta.env.VITE_YAAD_API_KEY;
  }

  private async getSignature(params: Partial<PaymentParams>): Promise<string> {
    const response = await fetch('/.netlify/functions/payment-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to get signature: ${response.status}`);
    }

    const data = await response.json();
    return data.signature;
  }

  async createPaymentUrl(params: PaymentParams): Promise<string> {
    const signature = await this.getSignature(params);
    const urlParams = new URLSearchParams({
      ...params,
      signature
    });

    return `${this.baseUrl}?${urlParams.toString()}`;
  }

  async verifyPayment(response: PaymentResponse): Promise<boolean> {
    const params = new URLSearchParams({
      action: HYP_API.ACTIONS.API_SIGN,
      What: HYP_API.ACTIONS.VERIFY,
      KEY: this.apiKey,
      PassP: this.passP,
      Masof: this.masof,
      ...response
    });

    const verifyResponse = await fetch(`${this.baseUrl}?${params.toString()}`);
    const data = await verifyResponse.json();
    
    return data.CCode === '0';
  }
}

export const hypClient = new HypClient();