const YAAD_API_KEY = 'd6a3f9214e28fb431bbfa7eb57ff7f195b9a715d';
const YAAD_MASOF = '0010297222';
const YAAD_BASE_URL = 'https://icom.yaad.net/p/';

interface PaymentResponse {
  Id: string;
  CCode: string;
  Amount: string;
  ACode: string;
}

export async function initiateSubscription(userId: string, email: string, name: string): Promise<PaymentResponse> {
  const params = new URLSearchParams({
    action: 'pay',
    Masof: YAAD_MASOF,
    KEY: YAAD_API_KEY,
    Amount: '8',
    Info: 'TaskEase Monthly Subscription',
    UserId: userId,
    ClientName: name,
    email,
    Coin: '1', // ILS
    Tash: '1', // Single payment
    MoreData: 'True',
    UTF8: 'True',
    UTF8out: 'True',
    Sign: 'True',
    sendemail: 'True',
  });

  const response = await fetch(`${YAAD_BASE_URL}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Payment initiation failed');
  }

  const data = await response.json();
  return data;
}

export async function verifyPayment(paymentId: string): Promise<boolean> {
  const params = new URLSearchParams({
    action: 'APISign',
    What: 'VERIFY',
    KEY: YAAD_API_KEY,
    Masof: YAAD_MASOF,
    Id: paymentId,
  });

  const response = await fetch(`${YAAD_BASE_URL}?${params.toString()}`);
  
  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.CCode === '0';
}
