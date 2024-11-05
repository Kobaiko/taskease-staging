import React, { useState, useEffect } from 'react';
import { X, LogOut, Mail, Lock, AlertCircle, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PhotoUpload } from './PhotoUpload';
import { updateUserProfile, updateUserEmail, updateUserPassword, deleteUserAccount } from '../services/userService';
import { isUserAdmin } from '../services/adminService';
import { ConfirmDialog } from './ConfirmDialog';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  const { currentUser, logout } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.email) {
      checkAdminStatus();
    }
  }, [currentUser]);

  async function checkAdminStatus() {
    if (currentUser?.email) {
      const adminStatus = await isUserAdmin(currentUser.email);
      setIsAdmin(adminStatus);
    }
  }

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError('');
      await updateUserProfile({
        displayName: displayName || currentUser.displayName,
      });
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) return;

    try {
      setIsSaving(true);
      setError('');
      await updateUserEmail(newEmail);
      setSuccess('Email updated successfully');
      setNewEmail('');
      setCurrentPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change your email');
      } else {
        setError('Failed to update email');
      }
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await updateUserPassword(newPassword);
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change your password');
      } else {
        setError('Failed to update password');
      }
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!currentUser) return;
      await deleteUserAccount(currentUser.uid);
      navigate('/account-deleted');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Rest of the profile popup content remains the same until the logout button */}
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-2 flex items-center justify-center gap-2 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 text-sm font-medium"
              >
                <LogOut size={16} />
                Log Out
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 text-xs"
              >
                <Trash2 size={14} />
                Delete my account
              </button>
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
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your TaskEase account? You will lose all your data and tasks, and remaining credits."
        confirmText="Delete my account"
        cancelText="No, I'll keep my account"
        isDangerous={true}
      />
    </>
  );
}