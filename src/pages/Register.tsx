import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { PaymentModal } from '../components/PaymentModal';
import { addFreeCredits, setSubscription } from '../services/creditService';
import { initiateSubscription } from '../services/payment';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      const user = await signUp(email, password, displayName);
      setShowPaymentModal(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to create an account');
    } finally {
      setLoading(false);
    }
  }

  const handleChooseCredits = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user found');
      
      await addFreeCredits(user.uid);
      navigate('/');
    } catch (err) {
      console.error('Error adding credits:', err);
      setError('Failed to add credits');
    }
  };

  const handleChooseSubscription = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user found');

      const payment = await initiateSubscription(
        user.uid,
        email,
        displayName
      );

      if (payment.CCode === '0') {
        await setSubscription(user.uid, true);
        navigate('/');
      } else {
        throw new Error('Payment failed');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Failed to process subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center">
            <Logo size="lg" />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Sign Up
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
              >
                Log In
              </Link>
            </p>
          </form>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onChooseCredits={handleChooseCredits}
        onChooseSubscription={handleChooseSubscription}
      />
    </div>
  );
}