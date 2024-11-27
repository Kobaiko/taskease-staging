import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const YAAD_API_URL = 'https://icom.yaad.net/p/';

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

async function getSignature(params: URLSearchParams): Promise<string | null> {
  try {
    const signParams = new URLSearchParams({
      action: 'APISign',
      What: 'SIGN',
      KEY: params.get('KEY') || '',
      PassP: params.get('PassP') || '',
      Amount: params.get('Amount') || '',
      Coin: params.get('Coin') || '',
      Masof: params.get('Masof') || '',
    });

    const signUrl = `${YAAD_API_URL}?${signParams.toString()}`;
    const response = await fetch(signUrl);
    const data = await response.text();
    return data.trim();
  } catch (error) {
    console.error('Error getting signature:', error);
    return null;
  }
}

export async function processPayment(
  userId: string,
  amount: number,
  isSubscription: boolean = false,
  isYearly: boolean = false
): Promise<string> {
  try {
    const masof = import.meta.env.VITE_YAAD_MASOF;
    const passp = import.meta.env.VITE_YAAD_PASSP;
    const apiKey = import.meta.env.VITE_YAAD_API_KEY;

    // Convert USD to ILS (1 USD ≈ 3.7 ILS)
    const amountInILS = Math.round(amount * 3.7 * 100);

    const params = new URLSearchParams({
      Masof: masof,
      PassP: passp,
      KEY: apiKey,
      Amount: amountInILS.toString(),
      Coin: '1', // ILS
      Info: isSubscription 
        ? `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription` 
        : 'TaskEase Credits',
      UTF8: 'True',
      UTF8out: 'True',
      UserId: userId,
      PageLang: 'ENG',
      MoreData: 'True',
      sendemail: 'True',
      REFURL: 'https://staging.gettaskease.com',
      tmp: Date.now().toString(),
      ...(isSubscription && {
        Tash: '1',
        HK_TYPE: '2', // Subscription
        HK_TIMES: isYearly ? '12' : '1', // Number of payments
        J5: 'TRUE', // Enable subscription
      })
    });

    // Get signature first
    const signature = await getSignature(params);
    if (!signature) {
      throw new Error('Failed to get payment signature');
    }

    // Add signature and payment action
    params.set('action', 'pay');
    params.set('signature', signature);

    // Remove API credentials from payment URL
    params.delete('KEY');
    params.delete('PassP');

    // Remove undefined values
    Array.from(params.entries()).forEach(([key, value]) => {
      if (value === 'undefined') {
        params.delete(key);
      }
    });

    const paymentUrl = `${YAAD_API_URL}?${params.toString()}`;
    console.log('Payment URL:', paymentUrl); // For debugging
    return paymentUrl;

  } catch (error) {
    console.error('Error generating payment URL:', error);
    throw error;
  }
}

export async function verifyPayment(paymentResponse: PaymentResponse, userId: string): Promise<boolean> {
  try {
    const { CCode } = paymentResponse;

    if (CCode === '0') {
      // Payment successful
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        isSubscribed: true,
        subscriptionEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        lastUpdated: new Date()
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

export async function handleLowCredits(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    showUpgradeModal: true
  });
}
