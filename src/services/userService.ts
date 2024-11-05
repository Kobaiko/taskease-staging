import { 
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { storage, db, auth } from '../lib/firebase';

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

export async function uploadUserPhoto(file: File, userId: string): Promise<string> {
  if (!auth.currentUser) throw new Error('No authenticated user');

  try {
    // Create a reference to the new photo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const photoRef = ref(storage, `user-photos/${userId}/${fileName}`);

    // Delete old photo if it exists
    const currentUser = auth.currentUser;
    if (currentUser.photoURL?.includes('firebasestorage')) {
      try {
        const oldPhotoRef = ref(storage, currentUser.photoURL);
        await deleteObject(oldPhotoRef).catch(() => {
          console.log('Old photo not found or already deleted');
        });
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
  } catch (error: any) {
    console.error('Error in uploadUserPhoto:', error);
    if (error.code === 'storage/unauthorized' || error.code === 'storage/cors-error') {
      throw new Error('Unable to access storage. Please try again later.');
    }
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

async function deleteUserPhotos(userId: string) {
  try {
    const userPhotosRef = ref(storage, `user-photos/${userId}`);
    const photosList = await listAll(userPhotosRef).catch(() => ({ items: [] }));
    
    await Promise.all(
      photosList.items.map(itemRef => 
        deleteObject(itemRef).catch(err => {
          console.log(`Failed to delete photo: ${err.message}`);
        })
      )
    );
  } catch (error) {
    console.log('No user photos to delete or access denied');
  }
}

async function deleteUserDocuments(userId: string) {
  const collections = [
    'tasks',
    'credits',
    'userPreferences',
    'marketing_consent',
    'beta_consent',
    'admins'
  ];

  for (const collectionName of collections) {
    try {
      // Delete documents where userId is a field
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      await Promise.all(
        querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      );

      // Also try to delete document with userId as the document ID
      await deleteDoc(doc(db, collectionName, userId)).catch(() => {});
    } catch (error) {
      console.log(`Error deleting documents from ${collectionName}:`, error);
    }
  }
}

export async function deleteUserAccount(userId: string) {
  if (!auth.currentUser) throw new Error('No authenticated user');

  try {
    // Delete user data in parallel
    await Promise.all([
      deleteUserDocuments(userId),
      deleteUserPhotos(userId)
    ]);

    // Finally, delete the user authentication account
    await deleteUser(auth.currentUser);
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete account. Please try again.');
  }
}