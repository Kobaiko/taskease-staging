import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebase';
import type { AdminUser, UserCredits } from '../types';

const ADMINS_COLLECTION = 'admins';
const CREDITS_COLLECTION = 'credits';
const USERS_COLLECTION = 'users';
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

  // Get all users from the users collection
  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
  const users = usersSnapshot.docs.map(doc => {
    const userData = doc.data();
    return {
      id: doc.id,
      email: userData.email,
      displayName: userData.displayName || null,
      createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
      credits: userCredits.get(doc.id) || 0
    };
  });

  return users;
}

export async function setUserCredits(userId: string, credits: number): Promise<void> {
  const creditRef = doc(db, CREDITS_COLLECTION, userId);
  await setDoc(creditRef, {
    userId,
    credits,
    lastUpdated: new Date()
  }, { merge: true });
}