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
  try {
    const masof = import.meta.env.VITE_YAAD_MASOF;
    const passp = import.meta.env.VITE_YAAD_PASSP;

    // Convert USD to ILS (1 USD ≈ 3.7 ILS)
    const amountInILS = Math.round(amount * 3.7 * 100);

    // Basic payment parameters
    const params: Record<string, string> = {
      action: 'pay',
      Masof: masof,
      PassP: passp,
      Amount: amountInILS.toString(),
      Info: isSubscription 
        ? `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription` 
        : 'TaskEase Credits',
      UTF8: 'True',
      UTF8out: 'True',
      ClientName: userId, // Add client name
      Coin: '1' // Add currency
    };

    // Add subscription parameters if needed
    if (isSubscription) {
      Object.assign(params, {
        HK: 'True', // Changed from HK_TYPE
        freq: isYearly ? 'yearly' : 'monthly',
        Tash: isYearly ? '12' : '1' // Number of payments
      });
    }

    // Build the URL
    const urlParams = new URLSearchParams(params);
    const paymentUrl = `${YAAD_API_URL}?${urlParams.toString()}`;
    
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

    // According to docs, 0 is success and 800 is postponed (both valid)
    if (CCode === '0' || CCode === '800') {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        isSubscribed: true,
        subscriptionEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        lastUpdated: new Date()
      });

      // Log successful transaction
      console.log('Transaction successful:', {
        transaction_id: paymentResponse.Id,
        amount: paymentResponse.Amount,
        status: paymentResponse.CCode,
        timestamp: new Date().toISOString()
      });

      return true;
    }

    // Log error for debugging
    console.error('Payment error:', getErrorMessage(CCode));
    return false;

  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
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

export async function handleLowCredits(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    showUpgradeModal: true
  });
}
