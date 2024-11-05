import React from 'react';
import { Layout, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveBetaConsent } from '../services/userService';

interface CreditsExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsExhaustedModal({ isOpen, onClose }: CreditsExhaustedModalProps) {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleConsent = async (consent: boolean) => {
    if (currentUser) {
      try {
        await saveBetaConsent(currentUser.uid, {
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          betaConsent: consent,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to save beta consent:', error);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Layout className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">TaskEase</h2>
              <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">BETA</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Thank you for using TaskEase beta and helping us improve this product. We'd love to stay in touch as soon as we go live and offer you a special offer for early adopters.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleConsent(true)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              I would love that!
            </button>
            <button
              onClick={() => handleConsent(false)}
              className="w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              No, thank you
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}