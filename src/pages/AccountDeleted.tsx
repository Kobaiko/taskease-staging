import React from 'react';
import { Layout } from 'lucide-react';

export function AccountDeleted() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <Layout className="h-12 w-12 text-blue-600" />
            <h1 className="ml-2 text-3xl font-bold">TaskEase</h1>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            We're sorry to see you go
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Your account has been deleted. Feel free to contact us at{' '}
            <a 
              href="mailto:hello@gotaskease.com" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              hello@gotaskease.com
            </a>{' '}
            with any query, and we'd love to see you back in the future.
          </p>
          <a
            href="https://gettaskease.com"
            className="inline-block w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}