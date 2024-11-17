// ... previous imports remain the same ...

export function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  // ... previous state and handlers remain the same ...

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Delete user account and all associated data
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

  // ... rest of the component remains the same until the logout button ...

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