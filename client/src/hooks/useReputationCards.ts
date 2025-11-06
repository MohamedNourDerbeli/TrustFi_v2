import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import type { ReputationCard } from '../types/reputationCard';

export interface UseReputationCardsReturn {
  reputationCards: ReputationCard[];
  cardsLoading: boolean;
  loadReputationCards: (profileId: number) => Promise<void>;
  setReputationCards: (cards: ReputationCard[]) => void;
}

export const useReputationCards = (
  contractServiceReady: boolean,
  getCurrentChainId: number | null
): UseReputationCardsReturn => {
  const [reputationCards, setReputationCards] = useState<ReputationCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  const loadReputationCards = useCallback(async (profileId: number) => {
    setCardsLoading(true);
    try {
      if (!contractServiceReady) {
        console.warn('Contract service not ready');
        setReputationCards([]);
        return;
      }

      const chainId = getCurrentChainId;
      if (!chainId || !CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.ReputationCard) {
        console.warn('ReputationCard contract not available');
        setReputationCards([]);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const reputationCardAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES].ReputationCard;
      
      // ReputationCard ABI for reading card data
      const reputationCardABI = [
        "function getCardsByProfile(uint256 profileId) external view returns (uint256[] memory)",
        "function getCard(uint256 cardId) external view returns (tuple(uint256 profileId, string category, string description, uint256 value, uint256 issuedAt, address issuer, bool isValid))"
      ];

      const reputationCardContract = new ethers.Contract(
        reputationCardAddress,
        reputationCardABI,
        provider
      );

      // Get all card IDs for this profile
      const cardIds = await reputationCardContract.getCardsByProfile(profileId);
      
      if (cardIds.length === 0) {
        setReputationCards([]);
        return;
      }

      // Fetch detailed data for each card
      const cards: ReputationCard[] = [];
      for (const cardId of cardIds) {
        try {
          const cardData = await reputationCardContract.getCard(cardId);
          
          // Convert contract data to ReputationCard interface
          const card: ReputationCard = {
            cardId: Number(cardId),
            profileId: Number(cardData.profileId),
            issuer: cardData.issuer,
            achievementType: cardData.category, // Using category as achievementType
            timestamp: Number(cardData.issuedAt),
            expiryDate: 0, // ReputationCard contract doesn't have expiry dates
            metadata: JSON.stringify({
              description: cardData.description,
              value: Number(cardData.value),
              category: cardData.category
            }),
            // Derived fields for UI
            category: cardData.category,
            description: cardData.description,
            value: Number(cardData.value),
            isValid: cardData.isValid
          };
          
          cards.push(card);
        } catch (cardError) {
          console.error(`Error loading card ${cardId}:`, cardError);
          // Continue loading other cards even if one fails
        }
      }

      setReputationCards(cards);
    } catch (error) {
      console.error('Error loading reputation cards:', error);
      setReputationCards([]);
    } finally {
      setCardsLoading(false);
    }
  }, [contractServiceReady, getCurrentChainId]);

  return {
    reputationCards,
    cardsLoading,
    loadReputationCards,
    setReputationCards
  };
};