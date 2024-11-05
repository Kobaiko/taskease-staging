import { 
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { storage, db, auth } from '../lib/firebase';

interface MarketingConsent {
  email: string;
  displayName: string;
  marketingConsent: boolean;
  timestamp: Date;
}

export async function uploadUserPhoto(file: File, userId: string): Promise<string> {
  if (!auth.currentUser) throw new Error('No authenticated user');

  // Create a reference to the new photo
  const fileExtension = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExtension}`;
  const photoRef = ref(storage, `user-photos/${userId}/${fileName}`);

  try {
    // Delete old photo if it exists
    const currentUser = auth.currentUser;
    if (currentUser.photoURL?.includes('firebasestorage')) {
      try {
        const oldPhotoRef = ref(storage, currentUser.photoURL);
        await deleteObject(oldPhotoRef);
      } catch (error) {
        console.error('Error deleting old photo:', error);
      }
    }

    // Upload new photo
    await uploadBytes(photoRef, file);
    const photoURL = await getDownloadURL(photoRef);

    // Update user profile
    await updateProfile(currentUser, { photoURL });

    return photoURL;
  } catch (error) {
    console.error('Error in uploadUserPhoto:', error);
    throw new Error('Failed to upload photo');
  }
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

export async function saveUserTheme(userId: string, isDark: boolean) {
  const userPrefsRef = doc(db, 'userPreferences', userId);
  await setDoc(userPrefsRef, { theme: isDark ? 'dark' : 'light' }, { merge: true });
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