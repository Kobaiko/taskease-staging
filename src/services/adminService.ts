import { collection, doc, getDoc, getDocs, query, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminUser, UserCredits } from '../types';

const ADMINS_COLLECTION = 'admins';
const CREDITS_COLLECTION = 'credits';

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
  credits: number;
  lastUpdated: Date;
}>> {
  const creditsSnapshot = await getDocs(collection(db, CREDITS_COLLECTION));
  
  return creditsSnapshot.docs.map(doc => {
    const data = doc.data() as UserCredits;
    return {
      id: doc.id,
      credits: data.credits,
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated.seconds * 1000) : new Date()
    };
  });
}

export async function setUserCredits(userId: string, credits: number): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  await setDoc(creditRef, {
    userId,
    credits,
    lastUpdated: new Date()
  }, { merge: true });
}