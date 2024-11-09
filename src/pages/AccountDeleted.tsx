import React from 'react';
import { Layout, Mail } from 'lucide-react';

export function AccountDeleted() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <Layout className="h-8 w-8 text-blue-600" />
            <h1 className="ml-2 text-2xl font-bold">TaskEase</h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            We're sorry to see you go
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your account has been deleted. Feel free to contact us at{' '}
            <a 
              href="mailto:hello@gotaskease.com"
              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <Mail size={16} />
              hello@gotaskease.com
            </a>
            {' '}with any query, and we'd love to see you back in the future.
          </p>

          <a
            href="https://gettaskease.com"
            className="inline-block w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}