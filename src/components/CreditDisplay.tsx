import React from 'react';
import { Coins } from 'lucide-react';

interface CreditDisplayProps {
  credits: number;
  onUpgradeClick?: () => void;
}

export default function CreditDisplay({ credits, onUpgradeClick }: CreditDisplayProps) {
  const isLowCredits = credits < 2;

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isLowCredits 
          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <Coins className="w-4 h-4" />
      <span className="text-sm font-medium">
        {credits} {credits === 1 ? 'Credit' : 'Credits'}
      </span>
      {isLowCredits && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="ml-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}