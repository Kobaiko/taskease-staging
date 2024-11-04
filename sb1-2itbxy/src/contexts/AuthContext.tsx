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
  EmailAuthProvider,
  GoogleAuthProvider
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../lib/firebase';
import { initializeFirstAdmin } from '../services/adminService';
import { initializeUserCredits } from '../services/creditService';

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
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          await initializeFirstAdmin();
          await initializeUserCredits(user.uid);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.includes('google.com')) {
        throw new Error('This email is registered with Google. Please sign in with Google.');
      }
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password');
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
      navigate('/');
    } catch (error) {
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      // Configure Google provider for better popup handling
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      
      if (!user.email) {
        throw new Error('No email found in Google account');
      }

      // Initialize credits for new users
      await initializeUserCredits(user.uid);

      // Update display name if not set
      if (!user.displayName) {
        await updateProfile(user, { 
          displayName: user.email.split('@')[0] 
        });
      }

      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign in was cancelled. Please try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
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
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out');
    }
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