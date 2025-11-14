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
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Profile Banner
      </label>

      <div
        className={`relative w-full h-48 rounded-lg border-2 border-dashed overflow-hidden cursor-pointer transition-all ${
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
            alt="Banner preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <svg
              className="w-16 h-16 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-600 text-sm">Click or drag & drop to upload banner</p>
            <p className="text-gray-500 text-xs mt-1">Recommended: 3:1 aspect ratio</p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <ProgressBar 
                progress={uploadProgress} 
                label="Uploading banner..."
                showPercentage={true}
                size="lg"
                color="primary"
                animated={true}
              />
            </div>
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

      <p className="text-xs text-gray-500">
        Max size: 10MB • Recommended aspect ratio: 3:1 (e.g., 1500x500px)
      </p>
    </div>
  );
}
