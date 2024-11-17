import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, LogOut, Mail, Lock, Layout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { ConfirmDialog } from './ConfirmDialog';
import { deleteUserAccount, updateUserEmail, updateUserPassword } from '../services/userService';
import { isUserAdmin } from '../services/adminService';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.email) {
      checkAdminStatus(currentUser.email);
    }
  }, [currentUser]);

  async function checkAdminStatus(email: string) {
    try {
      const adminStatus = await isUserAdmin(email);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setLoading(true);
      setError('');
      await updateUserEmail(newEmail);
      setSuccess('Email updated successfully');
      setNewEmail('');
    } catch (err) {
      console.error('Failed to update email:', err);
      setError('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      setError('');
      await updateUserPassword(newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to update password:', err);
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      await deleteUserAccount(currentUser.uid);
      onClose();
      navigate('/account-deleted');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Signed in as: {currentUser?.email}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Layout className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Admin Access
                    </p>
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Go to Admin Dashboard
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Update Email
                </h4>
                <form onSubmit={handleUpdateEmail} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="Enter new email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newEmail}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Update Email
                  </button>
                </form>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Update Password
                </h4>
                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:text-white"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    Update Password
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Log Out
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including tasks and preferences."
        confirmText="Delete Account"
        cancelText="Cancel"
        isDangerous
      />
    </>
  );
}