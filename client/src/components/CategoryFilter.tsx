import React from 'react';
import type { ReputationCard } from '../types/reputationCard';

interface CategoryFilterProps {
  cards: ReputationCard[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  cards,
  selectedCategory,
  onCategoryChange
}) => {
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

  // Get unique categories from cards
  const getUniqueCategories = (): string[] => {
    const categories = cards.map(card => 
      card.category || deriveCategory(card.achievementType)
    );
    return Array.from(new Set(categories)).sort();
  };

  // Get card count for each category
  const getCategoryCount = (category: string): number => {
    return cards.filter(card => {
      const cardCategory = card.category || deriveCategory(card.achievementType);
      return cardCategory === category;
    }).length;
  };

  const categories = getUniqueCategories();
  const totalCards = cards.length;

  // Category colors for consistent styling
  const getCategoryColor = (category: string, isSelected: boolean): string => {
    const baseColors: { [key: string]: string } = {
      'Education': isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Community': isSelected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200',
      'Technical Skills': isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Leadership': isSelected ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      'Professional': isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      'Social': isSelected ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'General': isSelected ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };
    
    return baseColors[category] || (isSelected ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200');
  };

  if (cards.length === 0) {
    return null; // Don't show filter when there are no cards
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {/* All Categories Button */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
            selectedCategory === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          All
          <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-white bg-opacity-20 rounded-full">
            {totalCards}
          </span>
        </button>

        {/* Category Buttons */}
        {categories.map((category) => {
          const count = getCategoryCount(category);
          const isSelected = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${getCategoryColor(category, isSelected)}`}
            >
              {category}
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                isSelected 
                  ? 'bg-white bg-opacity-20' 
                  : 'bg-black bg-opacity-10'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;