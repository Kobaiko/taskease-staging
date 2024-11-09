import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadUserPhoto } from '../services/userService';

interface PhotoUploadProps {
  currentPhotoURL?: string | null;
  className?: string;
}

export function PhotoUpload({ currentPhotoURL, className = '' }: PhotoUploadProps) {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setUploading(true);

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewURL(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      await uploadUserPhoto(file, currentUser.uid);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setPreviewURL(null); // Reset preview on error
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {(previewURL || currentPhotoURL) ? (
          <img
            src={previewURL || currentPhotoURL || ''}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Camera size={32} />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Camera size={16} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}