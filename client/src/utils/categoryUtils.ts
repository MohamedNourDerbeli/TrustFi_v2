import type { ReputationCard } from '../types/reputationCard';

/**
 * Helper function to derive category from achievementType
 */
export const deriveCategory = (achievementType: string): string => {
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

/**
 * Filter cards by selected category
 */
export const getFilteredCards = (
  cards: ReputationCard[], 
  selectedCategory: string | null
): ReputationCard[] => {
  if (!selectedCategory) {
    return cards;
  }
  
  return cards.filter(card => {
    return card.category === selectedCategory;
  });
};

/**
 * Calculate total reputation points from cards
 */
export const calculateTotalPoints = (cards: ReputationCard[]): number => {
  return cards.reduce((sum, card) => {
    return sum + (card.value || 0);
  }, 0);
};