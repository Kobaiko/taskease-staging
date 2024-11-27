import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserCredits } from '../types';

const CREDITS_COLLECTION = 'credits';
const INITIAL_CREDITS = 3;

interface UserCredits {
  userId: string;
  credits: number;
  lastUpdated: Date;
  isSubscribed?: boolean;
  subscriptionEnds?: Date;
}

export async function initializeUserCredits(userId: string): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    const userCredits: UserCredits = {
      userId,
      credits: 0, // Start with 0 credits until they choose an option
      lastUpdated: new Date(),
      isSubscribed: false
    };
    await setDoc(creditRef, userCredits);
  }
}

export async function getUserCredits(userId: string): Promise<UserCredits> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    await initializeUserCredits(userId);
    return {
      userId,
      credits: 0,
      lastUpdated: new Date(),
      isSubscribed: false
    };
  }

  return creditDoc.data() as UserCredits;
}

export async function deductCredit(userId: string): Promise<number> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    throw new Error('User credits not found');
  }

  const userData = creditDoc.data() as UserCredits;
  
  // If user is subscribed, don't deduct credits
  if (userData.isSubscribed && userData.subscriptionEnds && userData.subscriptionEnds > new Date()) {
    return userData.credits;
  }

  if (userData.credits <= 0) {
    throw new Error('No credits remaining');
  }

  const newCredits = userData.credits - 1;
  await updateDoc(creditRef, {
    credits: newCredits,
    lastUpdated: new Date()
  });

  return newCredits;
}

export async function addFreeCredits(userId: string): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  await updateDoc(creditRef, {
    credits: INITIAL_CREDITS,
    lastUpdated: new Date()
  });
}

export async function setSubscription(userId: string, isSubscribed: boolean): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const subscriptionEnds = new Date();
  subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1); // 1 month subscription

  await updateDoc(creditRef, {
    isSubscribed,
    subscriptionEnds,
    lastUpdated: new Date()
  });
}

export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return !!(credits.isSubscribed && credits.subscriptionEnds && credits.subscriptionEnds > new Date());
}