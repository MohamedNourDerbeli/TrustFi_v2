import React, { useState } from 'react';
import type { ReputationCard } from '../types/reputationCard';
import CardDetailModal from './CardDetailModal';

interface ReputationCardsListProps {
  cards: ReputationCard[];
  loading?: boolean;
}

const ReputationCardsList: React.FC<ReputationCardsListProps> = ({ 
  cards, 
  loading = false 
}) => {
  const [selectedCard, setSelectedCard] = useState<ReputationCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (card: ReputationCard) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <svg 
            className="w-16 h-16 text-gray-400 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reputation Cards Yet</h3>
          <p className="text-gray-600">
            Your verified credentials and achievements will appear here once they are issued.
          </p>
        </div>
      </div>
    );
  }

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

  // Helper function to check if card is valid (not expired)
  const isCardValid = (expiryDate: number): boolean => {
    if (expiryDate === 0) return true; // 0 means no expiry
    return expiryDate > Math.floor(Date.now() / 1000);
  };

  // Helper function to parse metadata for description and value
  const parseMetadata = (metadata: string): { description: string; value: number } => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(metadata);
      return {
        description: parsed.description || 'Achievement earned',
        value: parsed.value || 10
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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatIssuer = (issuer: string): string => {
    if (issuer.length <= 10) return issuer;
    return `${issuer.slice(0, 6)}...${issuer.slice(-4)}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
        const category = card.category || deriveCategory(card.achievementType);
        const isValid = card.isValid !== undefined ? card.isValid : isCardValid(card.expiryDate);
        const { description, value } = parseMetadata(card.metadata);
        const displayDescription = card.description || description;
        const displayValue = card.value || value;

        return (
          <div 
            key={card.cardId} 
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200 cursor-pointer"
            onClick={() => handleCardClick(card)}
          >
            {/* Category Badge */}
            <div className="flex justify-between items-start mb-3">
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}
              >
                {category}
              </span>
              <div className="flex items-center">
                <span className="text-lg font-bold text-blue-600">
                  +{displayValue}
                </span>
                <span className="text-xs text-gray-500 ml-1">pts</span>
              </div>
            </div>

            {/* Achievement Type */}
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {card.achievementType}
              </span>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-gray-900 text-sm font-medium leading-relaxed">
                {displayDescription}
              </p>
            </div>

            {/* Card Footer */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
              <div>
                <span className="block">Issued by</span>
                <span className="font-mono text-gray-700">
                  {formatIssuer(card.issuer)}
                </span>
              </div>
              <div className="text-right">
                <span className="block">Date</span>
                <span className="text-gray-700">
                  {formatDate(card.timestamp)}
                </span>
              </div>
            </div>

            {/* Expiry and Validity Status */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {card.expiryDate === 0 ? (
                  <span>No expiry</span>
                ) : (
                  <span>Expires: {formatDate(card.expiryDate)}</span>
                )}
              </div>
              <div className="flex items-center">
                {isValid ? (
                  <div className="flex items-center text-green-600 text-xs">
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
                  <div className="flex items-center text-red-600 text-xs">
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
        );
      })}
      </div>
      
      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default ReputationCardsList;