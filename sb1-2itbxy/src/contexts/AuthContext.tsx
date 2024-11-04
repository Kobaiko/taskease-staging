import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  linkWithPopup,
  fetchSignInMethodsForEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { initializeFirstAdmin } from '../services/adminService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        if (user) {
          await initializeFirstAdmin();
        }
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Auth state change error:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.includes('google.com')) {
          throw new Error('This email is registered with Google. Please sign in with Google.');
        }
      }
      throw error;
    }
  }

  async function signUp(email: string, password: string, displayName: string) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      
      if (methods.length > 0) {
        if (methods.includes('google.com')) {
          throw new Error('This email is already registered with Google. Please sign in with Google.');
        } else {
          throw new Error('This email is already registered. Please sign in instead.');
        }
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      await initializeUserCredits(user.uid);
    } catch (error) {
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      const email = user.email;

      if (email) {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        
        if (methods.includes('password') && !methods.includes('google.com')) {
          try {
            if (currentUser) {
              await linkWithPopup(currentUser, googleProvider);
            }
          } catch (linkError) {
            console.error('Error linking accounts:', linkError);
          }
        }
      }

      if (!user.displayName && email) {
        await updateProfile(user, { 
          displayName: email.split('@')[0] 
        });
      }

      await initializeUserCredits(user.uid);
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email. Please sign in with email/password.');
      }
      throw error;
    }
  }

  async function reauthenticate(password: string) {
    if (!currentUser?.email) throw new Error('No user email found');
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  }

  async function logout() {
    await signOut(auth);
  }

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    reauthenticate
  };

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}