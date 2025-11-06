export interface ReputationCard {
  cardId: number;
  profileId: number;
  issuer: string;
  achievementType: string; // bytes32 converted to string for display
  timestamp: number;
  expiryDate: number;
  metadata: string; // bytes converted to string for display
  // Derived fields for UI
  category?: string; // Derived from achievementType or metadata
  description?: string; // Derived from metadata
  value?: number; // Derived from achievementType or metadata
  isValid?: boolean; // Derived from expiryDate vs current time
}

export interface ReputationCardsByCategory {
  [category: string]: ReputationCard[];
}

// Helper type for creating cards (matches contract parameters)
export interface CreateReputationCardParams {
  profileId: number;
  achievementType: string; // Will be converted to bytes32
  expiryDate: number;
  metadata: string; // Will be converted to bytes
}