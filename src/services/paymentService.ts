import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const YAAD_API_URL = 'https://pay.hyp.co.il/p/';

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

export async function processPayment(
  userId: string,
  amount: number,
  isSubscription: boolean = false,
  isYearly: boolean = false
): Promise<string> {
  const masof = import.meta.env.VITE_YAAD_MASOF;
  const apiKey = import.meta.env.VITE_YAAD_API_KEY;
  const passp = import.meta.env.VITE_YAAD_PASSP;

  // Step 1: Get API signature
  const signParams = new URLSearchParams({
    action: 'APISign',
    What: 'SIGN',
    KEY: apiKey,
    PassP: passp,
    Masof: masof,
    Amount: amount.toString(),
    Coin: '2', // USD
    UTF8: 'True',
    UTF8out: 'True',
    Info: isSubscription 
      ? `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription` 
      : 'TaskEase Free Credits',
    Sign: 'True',
    MoreData: 'True',
    UserId: userId,
    sendemail: 'True',
    PageLang: 'ENG',
    tmp: '1',
    ...(isSubscription && {
      HK: 'True',
      freq: isYearly ? '12' : '1', // 12 months for yearly, 1 for monthly
      Tash: '999', // Unlimited payments for subscription
      OnlyOnApprove: 'True'
    })
  });

  const signResponse = await fetch(`${YAAD_API_URL}?${signParams.toString()}`);
  const signData = await signResponse.text();
  
  // Extract signature from response
  const responseParams = new URLSearchParams(signData);
  const signature = responseParams.get('signature');

  if (!signature) {
    throw new Error('Failed to get payment signature');
  }

  // Step 2: Create payment URL with signature
  const paymentParams = new URLSearchParams(signData);
  const paymentUrl = `${YAAD_API_URL}?${paymentParams.toString()}`;

  return paymentUrl;
}

export async function verifyPayment(paymentResponse: PaymentResponse, userId: string): Promise<boolean> {
  try {
    const { CCode } = paymentResponse;

    if (CCode === '0') {
      // Payment successful
      const userRef = doc(db, 'credits', userId);
      
      // For free tier or failed payments, give 3 credits
      await updateDoc(userRef, {
        credits: 3,
        lastUpdated: new Date(),
        isSubscribed: true,
        subscriptionEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
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
  const userRef = doc(db, 'credits', userId);
  await updateDoc(userRef, {
    showUpgradeModal: true
  });
}
