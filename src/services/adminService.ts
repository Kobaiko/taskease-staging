import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminUser, UserCredits, UserProfile } from '../types';

const ADMINS_COLLECTION = 'admins';
const USERS_COLLECTION = 'users';
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

export async function getAllUsers(): Promise<Array<UserProfile & { credits: number }>> {
  const usersQuery = query(collection(db, USERS_COLLECTION));
  const creditsQuery = query(collection(db, CREDITS_COLLECTION));

  const [usersSnapshot, creditsSnapshot] = await Promise.all([
    getDocs(usersQuery),
    getDocs(creditsQuery)
  ]);

  const creditsMap = new Map();
  creditsSnapshot.forEach(doc => {
    creditsMap.set(doc.id, doc.data().credits);
  });

  return usersSnapshot.docs.map(doc => ({
    ...doc.data() as UserProfile,
    credits: creditsMap.get(doc.id) || 0
  }));
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