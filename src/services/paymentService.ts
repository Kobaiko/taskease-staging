const YAAD_API_URL = 'https://pay.hyp.co.il/p/';
const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8888/.netlify/functions' 
  : 'https://staging.gettaskease.com/.netlify/functions';

interface PaymentResponse {
  Id: string;
  CCode: string;
  Amount: string;
  ACode: string;
  Fild1?: string;
  Fild2?: string;
  Fild3?: string;
  Bank?: string;
  Payments?: string;
  UserId?: string;
  Brand?: string;
  Issuer?: string;
  L4digit?: string;
  Coin?: string;
  Tmonth?: string;
  Tyear?: string;
  Hesh?: string;
  errMsg?: string;
}

async function getPaymentSignature(params: Record<string, string>): Promise<string> {
  const response = await fetch(`${BASE_URL}/payment-sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (!data.signature) {
    throw new Error('No signature received from server');
  }

  return data.signature;
}

export async function processPayment(
  userId: string,
  amount: number,
  isSubscription: boolean = false,
  isYearly: boolean = false
): Promise<string> {
  const masof = import.meta.env.VITE_YAAD_MASOF;
  const passp = import.meta.env.VITE_YAAD_PASSP;

  // Convert USD to ILS (1 USD ≈ 3.7 ILS)
  const amountInILS = Math.round(amount * 3.7 * 100) / 100;

  // Basic payment parameters
  const params: Record<string, string> = {
    Masof: masof,
    PassP: passp,
    action: 'pay',
    Amount: amountInILS.toString(),
    Info: isSubscription 
      ? `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription` 
      : 'TaskEase Credits',
    Order: Date.now().toString(),
    UTF8: 'True',
    UTF8out: 'True',
    Coin: '1',
    MoreData: 'True',
    PageLang: 'ENG',
    tmp: '1',
    J5: 'True',
    sendemail: 'True',
    Sign: 'True',
    UserId: userId
  };

  // Add subscription parameters if needed
  if (isSubscription) {
    Object.assign(params, {
      Tash: isYearly ? '12' : '1',
      HK: 'True',
      freq: isYearly ? 'yearly' : 'monthly',
      OnlyOnApprove: 'True'
    });
  }

  // Get signature from our backend
  const signature = await getPaymentSignature(params);
  params.signature = signature;

  // Build final payment URL
  const urlParams = new URLSearchParams(params);
  return `${YAAD_API_URL}?${urlParams.toString()}`;
}

export async function verifyPayment(paymentResponse: PaymentResponse): Promise<boolean> {
  const { CCode } = paymentResponse;
  return CCode === '0' || CCode === '800';
}

function getErrorMessage(code: string): string {
  const errorCodes: Record<string, string> = {
    '0': 'Success',
    '800': 'Postponed transaction',
    '901': 'No permission',
    '902': 'Authentication error',
    '999': 'Communication error'
  };

  return errorCodes[code] || `Unknown error code: ${code}`;
}