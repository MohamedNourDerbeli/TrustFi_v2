// components/user/AvatarUpload.tsx
import { useState, useRef } from 'react';
import { validateImageFile } from '../../lib/pinata';
import { CircularProgress } from '../shared/ProgressBar';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onUploadComplete: (ipfsUrl: string) => void;
  onError: (error: Error) => void;
}

export function AvatarUpload({ currentAvatarUrl, onUploadComplete, onError }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      onError(new Error(validationError));
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Pinata
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (Pinata doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Import uploadToPinata dynamically to avoid circular dependencies
      const { uploadToPinata } = await import('../../lib/pinata');
      const ipfsUrl = await uploadToPinata(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      onUploadComplete(ipfsUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      onError(err as Error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Profile Avatar
      </label>

      <div
        className={`relative w-32 h-32 mx-auto rounded-full border-4 overflow-hidden cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          <img
            src={preview}
            alt="Avatar preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <CircularProgress 
              progress={uploadProgress} 
              size={64} 
              strokeWidth={6}
              color="#ffffff"
              showPercentage={true}
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-500 text-center">
        Click or drag & drop to upload
        <br />
        Max size: 5MB
      </p>
    </div>
  );
}
