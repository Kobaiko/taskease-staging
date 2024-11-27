import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const API_URL = import.meta.env.REACT_APP_API_URL;

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
  try {
    const response = await fetch(`${API_URL}/api/payment/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        amount,
        isSubscription,
        isYearly
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate payment URL');
    }

    const data = await response.json();
    return data.paymentUrl;
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
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    showUpgradeModal: true
  });
}
