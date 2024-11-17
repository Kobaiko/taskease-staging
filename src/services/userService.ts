import { 
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface MarketingConsent {
  email: string;
  displayName: string;
  marketingConsent: boolean;
  timestamp: Date;
}

interface BetaConsent {
  email: string;
  displayName: string;
  betaConsent: boolean;
  timestamp: Date;
}

export async function updateUserProfile(data: {
  displayName?: string;
  photoURL?: string;
}) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await updateProfile(auth.currentUser, data);
}

export async function updateUserEmail(newEmail: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await updateEmail(auth.currentUser, newEmail);
}

export async function updateUserPassword(newPassword: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');
  await updatePassword(auth.currentUser, newPassword);
}

export async function reauthenticateUser(password: string) {
  if (!auth.currentUser?.email) throw new Error('No authenticated user');
  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  await reauthenticateWithCredential(auth.currentUser, credential);
}

export async function saveUserTheme(userId: string, theme: 'dark' | 'light') {
  const userPrefsRef = doc(db, 'userPreferences', userId);
  await setDoc(userPrefsRef, { theme }, { merge: true });
}

export async function getUserTheme(userId: string): Promise<'dark' | 'light' | null> {
  const userPrefsRef = doc(db, 'userPreferences', userId);
  const userPrefs = await getDoc(userPrefsRef);
  return userPrefs.exists() ? userPrefs.data().theme : null;
}

export async function saveMarketingConsent(userId: string, data: MarketingConsent) {
  const marketingRef = doc(collection(db, 'marketing_consent'), userId);
  await setDoc(marketingRef, {
    ...data,
    timestamp: new Date()
  });
}

export async function saveBetaConsent(userId: string, data: BetaConsent) {
  const betaRef = doc(collection(db, 'beta_consent'), userId);
  await setDoc(betaRef, {
    ...data,
    timestamp: new Date()
  });
}

async function deleteUserData(userId: string) {
  const batch = writeBatch(db);
  const collections = [
    'tasks',
    'credits',
    'userPreferences',
    'marketing_consent',
    'beta_consent'
  ];

  for (const collectionName of collections) {
    // Delete documents where userId is a field
    const q = query(collection(db, collectionName), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Also try to delete document with userId as the document ID
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      batch.delete(docRef);
    }
  }

  await batch.commit();
}

export async function deleteUserAccount(userId: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');

  try {
    // Delete all user data
    await deleteUserData(userId);
    
    // Delete the user authentication account
    await deleteUser(auth.currentUser);
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete account. Please try again.');
  }
}