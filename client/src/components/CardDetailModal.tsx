import React from 'react';
import type { ReputationCard } from '../types/reputationCard';

interface CardDetailModalProps {
  card: ReputationCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, isOpen, onClose }) => {
  // Handle body scroll when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  // Helper function to derive category from achievementType
  const deriveCategory = (achievementType: string): string => {
    const type = achievementType.toLowerCase();
    if (type.includes('education') || type.includes('course') || type.includes('certification')) {
      return 'Education';
    }
    if (type.includes('community') || type.includes('contribution') || type.includes('volunteer')) {
      return 'Community';
    }
    if (type.includes('technical') || type.includes('skill') || type.includes('development')) {
      return 'Technical Skills';
    }
    if (type.includes('leadership') || type.includes('management') || type.includes('lead')) {
      return 'Leadership';
    }
    if (type.includes('professional') || type.includes('work') || type.includes('employment')) {
      return 'Professional';
    }
    return 'General';
  };

  // Helper function to get category color
  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Education': 'bg-blue-100 text-blue-800 border-blue-200',
      'Community': 'bg-green-100 text-green-800 border-green-200',
      'Technical Skills': 'bg-purple-100 text-purple-800 border-purple-200',
      'Leadership': 'bg-orange-100 text-orange-800 border-orange-200',
      'Professional': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Social': 'bg-pink-100 text-pink-800 border-pink-200',
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Helper function to check if card is valid (not expired)
  const isCardValid = (expiryDate: number): boolean => {
    if (expiryDate === 0) return true; // 0 means no expiry
    return expiryDate > Math.floor(Date.now() / 1000);
  };

  // Helper function to parse metadata for description and value
  const parseMetadata = (metadata: string): { description: string; value: number; additionalInfo?: any } => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(metadata);
      return {
        description: parsed.description || 'Achievement earned',
        value: parsed.value || 10,
        additionalInfo: parsed
      };
    } catch {
      // If not JSON, treat as plain text description
      return {
        description: metadata || 'Achievement earned',
        value: 10 // Default value
      };
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatIssuer = (issuer: string): string => {
    return issuer;
  };

  const category = card.category || deriveCategory(card.achievementType);
  const isValid = card.isValid !== undefined ? card.isValid : isCardValid(card.expiryDate);
  const { description, value, additionalInfo } = parseMetadata(card.metadata);
  const displayDescription = card.description || description;
  const displayValue = card.value || value;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span 
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(category)}`}
            >
              {category}
            </span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">
                +{displayValue}
              </span>
              <span className="text-sm text-gray-500 ml-1">pts</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Achievement Type */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {card.achievementType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {displayDescription}
            </p>
          </div>

          {/* Card Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Issuer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Issued By</h3>
              <div className="space-y-1">
                <p className="font-mono text-sm text-gray-700 break-all">
                  {formatIssuer(card.issuer)}
                </p>
                <div className="flex items-center text-xs text-green-600">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  Verified Issuer
                </div>
              </div>
            </div>

            {/* Issuance Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Issued Date</h3>
              <p className="text-gray-700">
                {formatDate(card.timestamp)}
              </p>
            </div>

            {/* Expiry Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Expiry</h3>
              <div className="space-y-1">
                <p className="text-gray-700">
                  {card.expiryDate === 0 ? 'No expiry date' : formatDate(card.expiryDate)}
                </p>
                <div className="flex items-center text-xs">
                  {isValid ? (
                    <div className="flex items-center text-green-600">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      Valid
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path 
                          fillRule="evenodd" 
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                      Expired
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card ID */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Card ID</h3>
              <p className="font-mono text-sm text-gray-700">
                #{card.cardId}
              </p>
            </div>
          </div>

          {/* Additional Information from Metadata */}
          {additionalInfo && Object.keys(additionalInfo).length > 2 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Details</h3>
              <div className="space-y-2">
                {Object.entries(additionalInfo).map(([key, value]) => {
                  // Skip description and value as they're already displayed
                  if (key === 'description' || key === 'value') return null;
                  
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="text-sm text-gray-900">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-green-800">Blockchain Verified</h3>
                <p className="text-xs text-green-700">
                  This credential is stored on the blockchain and cannot be tampered with.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;