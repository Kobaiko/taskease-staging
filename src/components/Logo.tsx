import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBeta?: boolean;
}

export function Logo({ className = '', size = 'md', showBeta = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-xl' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 40, text: 'text-4xl' }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={sizes[size].icon}
          height={sizes[size].icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-400"
        >
          <defs>
            <filter id="inner-shadow">
              <feOffset dx="0" dy="2" />
              <feGaussianBlur stdDeviation="2" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="black" floodOpacity="0.4" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" filter="url(#inner-shadow)" />
        </svg>
        <h1 className={`ml-2 ${sizes[size].text} font-bold text-gray-900 dark:text-white`}>TaskEase</h1>
        {showBeta && (
          <span className="ml-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">BETA</span>
        )}
      </div>
    </div>
  );
}