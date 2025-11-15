// components/user/BannerUpload.tsx
import { useState, useRef } from 'react';
import { validateImageFile } from '../../lib/pinata';
import { ProgressBar } from '../shared/ProgressBar';

interface BannerUploadProps {
  currentBannerUrl?: string;
  onUploadComplete: (ipfsUrl: string) => void;
  onError: (error: Error) => void;
}

export function BannerUpload({ currentBannerUrl, onUploadComplete, onError }: BannerUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentBannerUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file
    const validationError = validateImageFile(file, 10);
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
      console.error('Error uploading banner:', err);
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
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        title="Upload banner"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm text-white">Uploading...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-white">Change Banner</span>
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />
    </>
  );
}
