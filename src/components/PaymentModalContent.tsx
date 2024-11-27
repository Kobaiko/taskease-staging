import React, { useState } from 'react';
import { m as motion } from 'framer-motion';
import { X } from 'lucide-react';
import { processPayment } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';

interface PaymentModalContentProps {
  onClose: () => void;
  onChooseSubscription: () => Promise<void>;
}

export default function PaymentModalContent({
  onClose,
  onChooseSubscription
}: PaymentModalContentProps) {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const handlePayment = async (isYearly: boolean) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Convert USD to ILS (approximate rate 1 USD = 3.7 ILS)
      const amount = isYearly ? 80 : 8;
        
      const paymentUrl = await processPayment(
        currentUser.uid, 
        amount, 
        true,
        isYearly
      );
      
      // Update subscription status locally before redirecting
      await onChooseSubscription();
      
      // Redirect to payment page
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X className="w-6 h-6" />
      </button>

      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Upgrade TaskEase
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
        Unlock unlimited potential with our subscription plans
      </p>

      <div className="space-y-4">
        <button
          onClick={() => handlePayment(false)}
          disabled={loading}
          className="w-full p-6 text-left bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Monthly Plan ⭐️</h3>
            <span className="text-blue-200">$8/month</span>
          </div>
          <p className="text-blue-100">Unlimited tasks + Priority Support</p>
        </button>

        <button
          onClick={() => handlePayment(true)}
          disabled={loading}
          className="w-full p-6 text-left bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group disabled:opacity-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Yearly Plan 💎</h3>
            <div className="text-right">
              <span className="text-green-200">$80/year</span>
              <div className="text-xs text-green-300">Save 17%</div>
            </div>
          </div>
          <p className="text-green-100">Best value! Unlimited tasks + Priority Support</p>
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
        You can upgrade or cancel anytime from your dashboard
      </p>
    </motion.div>
  );
}
