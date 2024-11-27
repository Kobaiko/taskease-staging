import React from 'react';
import { m as motion } from 'framer-motion';

interface PaymentModalContentProps {
  launchConfetti: () => void;
  onChooseCredits: () => void;
  onChooseSubscription: () => Promise<void>;
}

export default function PaymentModalContent({
  launchConfetti,
  onChooseCredits,
  onChooseSubscription
}: PaymentModalContentProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
    >
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        🎉 Welcome to TaskEase! 🎉
      </h2>
      
      <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
        Choose your perfect way to get started with TaskEase
      </p>

      <div className="space-y-4">
        <button
          onClick={() => {
            launchConfetti();
            onChooseCredits();
          }}
          className="w-full p-6 text-left bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Try it Free! 🚀</h3>
            <span className="text-purple-200">Best for starters</span>
          </div>
          <p className="text-purple-100">Get 3 tasks credits to experience the magic of TaskEase</p>
        </button>

        <button
          onClick={() => {
            launchConfetti();
            onChooseSubscription();
          }}
          className="w-full p-6 text-left bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Unlimited Access 💫</h3>
            <span className="text-green-200">Most popular</span>
          </div>
          <p className="text-green-100">Unlimited tasks for just $8/month</p>
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
        You can upgrade anytime from your dashboard
      </p>
    </motion.div>
  );
}
