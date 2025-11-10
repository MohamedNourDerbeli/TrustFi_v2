/**
 * Custom hook for issuer collectible management
 * Handles creating, pausing, resuming, updating, and analyzing collectibles
 */

import { useState, useEffect, useCallback } from 'react';
import { collectibleContractService } from '@/services/collectibleContractService';
import type {
  CollectibleTemplate,
  CollectibleFormData,
  CollectibleAnalytics,
  ClaimStats,
} from '@/types/collectible';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';

export interface UseIssuerCollectiblesReturn {
  collectibles: CollectibleTemplate[];
  loading: boolean;
  error: Error | null;
  createCollectible: (data: CollectibleFormData) => Promise<number | null>;
  pauseCollectible: (templateId: number) => Promise<boolean>;
  resumeCollectible: (templateId: number) => Promise<boolean>;
  updateMetadata: (
    templateId: number,
    metadata: { category?: string; description?: string; metadataURI?: string }
  ) => Promise<boolean>;
  getAnalytics: (templateId: number) => Promise<CollectibleAnalytics | null>;
  addToWhitelist: (templateId: number, addresses: string[]) => Promise<boolean>;
  removeFromWhitelist: (templateId: number, addresses: string[]) => Promise<boolean>;
  refetch: () => Promise<void>;
  creating: boolean;
  managing: boolean;
}

export function useIssuerCollectibles(
  issuerAddress?: string
): UseIssuerCollectiblesReturn {
  const { provider, address: walletAddress } = useWallet();
  const { toast } = useToast();
  const effectiveAddress = issuerAddress || walletAddress;
  
  const [collectibles, setCollectibles] = useState<CollectibleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);

  // Fetch collectibles created by the issuer
  const fetchCollectibles = useCallback(async () => {
    if (!effectiveAddress) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize service if needed
      if (provider && !collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      const templates = await collectibleContractService.getCollectiblesByIssuer(
        effectiveAddress
      );
      setCollectibles(templates);
    } catch (err: any) {
      console.error('Failed to fetch issuer collectibles:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [effectiveAddress, provider]);

  // Auto-fetch on mount and when address changes
  useEffect(() => {
    if (effectiveAddress) {
      fetchCollectibles();
    }
  }, [effectiveAddress, fetchCollectibles]);

  // Create a new collectible
  const createCollectible = useCallback(async (
    data: CollectibleFormData
  ): Promise<number | null> => {
    if (!provider) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create collectibles',
        variant: 'destructive',
      });
      return null;
    }

    setCreating(true);
    setError(null);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Handle image upload and metadata creation if image is provided
      let finalData = { ...data };
      
      if (data.image && !data.metadataURI) {
        toast({
          title: 'Uploading Image',
          description: 'Uploading image to IPFS...',
        });

        // Import metadata service
        const { reputationCardMetadataService } = await import('@/services/reputationCardMetadataService');
        
        // Upload image to IPFS
        const imageUrl = await reputationCardMetadataService.uploadImage(data.image);
        
        toast({
          title: 'Creating Metadata',
          description: 'Generating metadata...',
        });

        // Create OpenSea-compatible metadata
        // Note: reputationCardMetadataService expects 'title' field
        const metadata = {
          title: data.title,
          description: data.description,
          image: imageUrl,
          category: data.category,
          externalUrl: `${window.location.origin}/collectibles`,
          attributes: [
            {
              trait_type: 'Category',
              value: data.category,
            },
            {
              trait_type: 'Reputation Value',
              value: data.value,
              display_type: 'number',
            },
            {
              trait_type: 'Rarity',
              value: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][data.rarityTier],
            },
            {
              trait_type: 'Max Supply',
              value: data.maxSupply === 0 ? 'Unlimited' : data.maxSupply,
            },
          ],
        };

        // Upload metadata to IPFS
        const metadataURI = await reputationCardMetadataService.uploadMetadata(metadata);
        
        // Update data with metadata URI
        finalData = {
          ...data,
          metadataURI,
        };
      }

      // Create collectible
      const result = await collectibleContractService.createCollectible(finalData, signer);

      toast({
        title: 'Collectible Created!',
        description: `Successfully created collectible with ID: ${result.templateId}`,
      });

      // Refresh collectibles list
      await fetchCollectibles();

      return result.templateId;
    } catch (err: any) {
      console.error('Failed to create collectible:', err);
      setError(err);

      toast({
        title: 'Creation Failed',
        description: err.message || 'Failed to create collectible',
        variant: 'destructive',
      });

      return null;
    } finally {
      setCreating(false);
    }
  }, [provider, toast, fetchCollectibles]);

  // Pause a collectible
  const pauseCollectible = useCallback(async (templateId: number): Promise<boolean> => {
    if (!provider) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    setManaging(true);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Pause collectible
      await collectibleContractService.pauseCollectible(templateId, signer);

      toast({
        title: 'Collectible Paused',
        description: 'The collectible has been paused successfully',
      });

      // Refresh collectibles list
      await fetchCollectibles();

      return true;
    } catch (err: any) {
      console.error('Failed to pause collectible:', err);

      toast({
        title: 'Pause Failed',
        description: err.message || 'Failed to pause collectible',
        variant: 'destructive',
      });

      return false;
    } finally {
      setManaging(false);
    }
  }, [provider, toast, fetchCollectibles]);

  // Resume a collectible
  const resumeCollectible = useCallback(async (templateId: number): Promise<boolean> => {
    if (!provider) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    setManaging(true);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Resume collectible
      await collectibleContractService.resumeCollectible(templateId, signer);

      toast({
        title: 'Collectible Resumed',
        description: 'The collectible has been resumed successfully',
      });

      // Refresh collectibles list
      await fetchCollectibles();

      return true;
    } catch (err: any) {
      console.error('Failed to resume collectible:', err);

      toast({
        title: 'Resume Failed',
        description: err.message || 'Failed to resume collectible',
        variant: 'destructive',
      });

      return false;
    } finally {
      setManaging(false);
    }
  }, [provider, toast, fetchCollectibles]);

  // Update collectible metadata
  const updateMetadata = useCallback(async (
    templateId: number,
    metadata: { category?: string; description?: string; metadataURI?: string }
  ): Promise<boolean> => {
    if (!provider) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    setManaging(true);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Update metadata
      await collectibleContractService.updateCollectibleMetadata(
        templateId,
        metadata,
        signer
      );

      toast({
        title: 'Metadata Updated',
        description: 'The collectible metadata has been updated successfully',
      });

      // Refresh collectibles list
      await fetchCollectibles();

      return true;
    } catch (err: any) {
      console.error('Failed to update metadata:', err);

      toast({
        title: 'Update Failed',
        description: err.message || 'Failed to update metadata',
        variant: 'destructive',
      });

      return false;
    } finally {
      setManaging(false);
    }
  }, [provider, toast, fetchCollectibles]);

  // Get analytics for a collectible
  const getAnalytics = useCallback(async (
    templateId: number
  ): Promise<CollectibleAnalytics | null> => {
    try {
      // Initialize service if needed
      if (provider && !collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get claim stats
      const stats: ClaimStats = await collectibleContractService.getClaimStats(templateId);
      
      // Get template details
      const template = await collectibleContractService.getCollectibleTemplate(templateId);

      // Calculate supply percentage
      const supplyPercentage = template.maxSupply === 0
        ? 0
        : (stats.totalClaims / template.maxSupply) * 100;

      // Build analytics object
      const analytics: CollectibleAnalytics = {
        templateId,
        totalClaims: stats.totalClaims,
        uniqueClaimers: [], // Would need event parsing to get this
        claimTimeline: [], // Would need event parsing to get this
        supplyPercentage,
        // Additional metrics would require event parsing or indexing
      };

      return analytics;
    } catch (err: any) {
      console.error('Failed to get analytics:', err);
      return null;
    }
  }, [provider]);

  // Add addresses to whitelist
  const addToWhitelist = useCallback(async (
    templateId: number,
    addresses: string[]
  ): Promise<boolean> => {
    if (!provider) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    setManaging(true);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Add to whitelist
      await collectibleContractService.addToWhitelist(templateId, addresses, signer);

      toast({
        title: 'Whitelist Updated',
        description: `Successfully added ${addresses.length} address(es) to whitelist`,
      });

      return true;
    } catch (err: any) {
      console.error('Failed to add to whitelist:', err);

      toast({
        title: 'Whitelist Update Failed',
        description: err.message || 'Failed to add addresses to whitelist',
        variant: 'destructive',
      });

      return false;
    } finally {
      setManaging(false);
    }
  }, [provider, toast]);

  // Remove addresses from whitelist
  const removeFromWhitelist = useCallback(async (
    templateId: number,
    addresses: string[]
  ): Promise<boolean> => {
    if (!provider) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet',
        variant: 'destructive',
      });
      return false;
    }

    setManaging(true);

    try {
      // Initialize service if needed
      if (!collectibleContractService.isInitialized()) {
        await collectibleContractService.initialize(provider);
      }

      // Get signer
      const signer = await provider.getSigner();

      // Remove from whitelist
      await collectibleContractService.removeFromWhitelist(templateId, addresses, signer);

      toast({
        title: 'Whitelist Updated',
        description: `Successfully removed ${addresses.length} address(es) from whitelist`,
      });

      return true;
    } catch (err: any) {
      console.error('Failed to remove from whitelist:', err);

      toast({
        title: 'Whitelist Update Failed',
        description: err.message || 'Failed to remove addresses from whitelist',
        variant: 'destructive',
      });

      return false;
    } finally {
      setManaging(false);
    }
  }, [provider, toast]);

  return {
    collectibles,
    loading,
    error,
    createCollectible,
    pauseCollectible,
    resumeCollectible,
    updateMetadata,
    getAnalytics,
    addToWhitelist,
    removeFromWhitelist,
    refetch: fetchCollectibles,
    creating,
    managing,
  };
}
