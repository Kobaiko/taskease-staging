import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onClose }: ConfirmDialogProps) {
  if (!isOpen) return null;

  const isLogout = title.toLowerCase().includes('logout');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`btn btn-primary ${isLogout ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {isLogout ? 'Log Out' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}