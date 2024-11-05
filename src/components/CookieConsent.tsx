import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      // Show the consent popup immediately
      setIsVisible(true);
    }
  }, []);

  const initializeAnalytics = () => {
    // Initialize GA
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-CEDBMXRBYX');
  };

  const handleInteraction = (accepted: boolean) => {
    setIsExiting(true);
    
    localStorage.setItem('cookieConsent', accepted ? 'accepted' : 'declined');
    
    if (accepted) {
      initializeAnalytics();
    } else {
      // Clear cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
    }

    // Hide with animation
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-end sm:items-center justify-center p-4 z-50 transition-all duration-300 ${
        showDetails ? 'bg-black/50 backdrop-blur-sm' : ''
      }`}
    >
      <div
        className={`relative w-full ${
          showDetails ? 'max-w-2xl' : 'max-w-sm sm:absolute sm:bottom-4 sm:left-4'
        } bg-white dark:bg-gray-800 rounded-xl shadow-xl transition-all duration-300 ${
          isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="p-6">
          {!showDetails ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="cookie">
                    🍪
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    We use cookies
                  </h3>
                </div>
                <button
                  onClick={() => handleInteraction(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                We use cookies to enhance your experience and analyze our traffic. You can choose to accept or decline cookies.
              </p>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleInteraction(true)}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Accept all cookies
                  </button>
                  <button
                    onClick={() => handleInteraction(false)}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Decline
                  </button>
                </div>
                <button
                  onClick={() => setShowDetails(true)}
                  className="w-full flex items-center justify-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Cookie Policy
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" role="img" aria-label="cookie">
                    🍪
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Cookie Policy
                  </h3>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Essential Cookies</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are popular and how visitors move around the site.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Rights</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleInteraction(true)}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept all cookies
                </button>
                <button
                  onClick={() => handleInteraction(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Decline
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}