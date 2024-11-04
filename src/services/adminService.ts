import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import type { AdminUser, UserCredits } from '../types';

const ADMINS_COLLECTION = 'admins';
const CREDITS_COLLECTION = 'credits';
const auth = getAuth();

export async function initializeFirstAdmin(): Promise<void> {
  const adminRef = doc(db, ADMINS_COLLECTION, 'kobaiko@gmail.com');
  const adminDoc = await getDoc(adminRef);

  if (!adminDoc.exists()) {
    const admin: AdminUser = {
      email: 'kobaiko@gmail.com',
      addedAt: new Date()
    };
    await setDoc(adminRef, admin);
  }
}

export async function isUserAdmin(email: string): Promise<boolean> {
  if (!email) return false;
  const adminRef = doc(db, ADMINS_COLLECTION, email);
  const adminDoc = await getDoc(adminRef);
  return adminDoc.exists();
}

export async function addAdmin(email: string, addedByEmail: string): Promise<void> {
  const adminRef = doc(db, ADMINS_COLLECTION, email);
  const admin: AdminUser = {
    email,
    addedBy: addedByEmail,
    addedAt: new Date()
  };
  await setDoc(adminRef, admin);
}

export async function getAllUsers(): Promise<Array<{
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  credits: number;
}>> {
  // Get all credits documents
  const creditsSnapshot = await getDocs(collection(db, CREDITS_COLLECTION));
  
  // Create a map of user credits
  const userCredits = new Map<string, number>();
  creditsSnapshot.forEach((doc) => {
    const data = doc.data() as UserCredits;
    userCredits.set(doc.id, data.credits);
  });

  // Get user details from Firebase Auth
  const users = await Promise.all(
    Array.from(userCredits.entries()).map(async ([userId, credits]) => {
      // Get user data from Auth
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data() || {};
      
      return {
        id: userId,
        email: userData.email || 'Unknown Email',
        displayName: userData.displayName || null,
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
        credits
      };
    })
  );

  return users;
}

export async function addCreditsToUser(userId: string, amount: number): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  const creditDoc = await getDoc(creditRef);

  if (!creditDoc.exists()) {
    throw new Error('User credits not found');
  }

  const currentCredits = creditDoc.data().credits;
  await updateDoc(creditRef, {
    credits: currentCredits + amount,
    lastUpdated: new Date()
  });
}