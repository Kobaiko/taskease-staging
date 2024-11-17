import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Logo } from './Logo';
import { TypeformModal } from './TypeformModal';

interface CreditsExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditsExhaustedModal({ isOpen, onClose }: CreditsExhaustedModalProps) {
  const [showTypeform, setShowTypeform] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Logo size="sm" />
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Out of Credits
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You've used all your AI-powered task breakdown credits. Would you like to get more credits by sharing your feedback?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setShowTypeform(true)}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Share Feedback for Credits
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <TypeformModal 
        isOpen={showTypeform} 
        onClose={() => setShowTypeform(false)} 
      />
    </>
  );
}