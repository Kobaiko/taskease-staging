import React, { useEffect, useCallback, Suspense } from 'react';
import { LazyMotion, domAnimation, m as motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onChooseCredits: () => void;
  onChooseSubscription: () => Promise<void>;
}

const ModalContent = React.lazy(() => import('./PaymentModalContent'));

export function PaymentModal({ isOpen, onChooseCredits, onChooseSubscription }: PaymentModalProps) {
  const launchConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9333EA', '#4F46E5', '#10B981', '#059669']
    });
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Suspense
              fallback={
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                </div>
              }
            >
              <ModalContent
                launchConfetti={launchConfetti}
                onChooseCredits={onChooseCredits}
                onChooseSubscription={onChooseSubscription}
              />
            </Suspense>
          </div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
