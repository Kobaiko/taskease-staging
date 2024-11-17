import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { AdminUser } from '../types';

const ADMINS_COLLECTION = 'admins';

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
  credits: number;
  lastUpdated: Date;
}>> {
  try {
    const response = await fetch('/.netlify/functions/list-users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    const data = await response.json();
    return data.users.map((user: any) => ({
      ...user,
      lastUpdated: new Date(user.lastUpdated)
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function setUserCredits(userId: string, credits: number): Promise<void> {
  const creditRef = doc(db, 'credits', userId);
  await setDoc(creditRef, {
    userId,
    credits,
    lastUpdated: new Date()
  }, { merge: true });
}