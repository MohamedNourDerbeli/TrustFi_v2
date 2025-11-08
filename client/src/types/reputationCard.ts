export interface ReputationCard {
  id?: number;
  cardId?: number;
  profileId: number;
  category: string;
  description: string;
  value: number;
  issuedAt: number;
  issuer: string;
  isValid: boolean;
  metadataURI?: string;
  categoryHash?: string;
  metadata?: {
    title?: string;
    description?: string;
    category?: string;
    image?: string;
    proofDocument?: string;
    issuerName?: string;
    issuerLogo?: string;
    externalUrl?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

export interface ReputationCardsByCategory {
  [category: string]: ReputationCard[];
}

export interface CategoryScore {
  category: string;
  score: number;
  cardCount: number;
}

export interface ReputationBreakdown {
  categories: string[];
  scores: number[];
}

// Helper type for creating cards (matches contract parameters)
export interface CreateReputationCardParams {
  profileId: number;
  category: string;
  description: string;
  value: number;
}