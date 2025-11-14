// hooks/useTemplates.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, parseAbiItem } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import type { Template, CreateTemplateParams } from '../types/template';

export interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: Error | null;
  createTemplate: (params: CreateTemplateParams) => Promise<void>;
  pauseTemplate: (templateId: bigint, isPaused: boolean) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  checkEligibility: (templateId: bigint, profileId: bigint) => Promise<boolean>;
}

export function useTemplates(profileId?: bigint | null): UseTemplatesReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all templates
  const fetchTemplates = useCallback(async () => {
    if (!publicClient) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TEMPORARY FIX: Return empty templates to avoid rate limiting
      // TODO: Implement proper solution (Subgraph, Supabase cache, or private RPC)
      console.warn('Template fetching disabled due to RPC rate limits. Please implement Supabase cache or use private RPC.');
      
      const templateCreatedEvents: any[] = [];
      
      // If you have templates, you can manually add them here for testing:
      // const templateCreatedEvents = [
      //   { args: { templateId: 1n } },
      //   { args: { templateId: 2n } },
      // ];

      // Extract unique template IDs
      const templateIds = Array.from(
        new Set(templateCreatedEvents.map(event => event.args.templateId as bigint))
      );

      // Fetch template details for each ID
      const templatePromises = templateIds.map(async (templateId) => {
        try {
          const templateData = await publicClient.readContract({
            address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
            abi: ReputationCardABI,
            functionName: 'templates',
            args: [templateId],
          }) as [Address, bigint, bigint, number, bigint, bigint, boolean];

          const [issuer, maxSupply, currentSupply, tier, startTime, endTime, isPaused] = templateData;

          // Skip templates with zero address issuer (deleted/invalid)
          if (issuer === '0x0000000000000000000000000000000000000000') {
            return null;
          }

          // Check eligibility if profileId is provided
          let hasClaimed = false;
          if (profileId) {
            hasClaimed = await publicClient.readContract({
              address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
              abi: ReputationCardABI,
              functionName: 'hasProfileClaimed',
              args: [templateId, profileId],
            }) as boolean;
          }

          return {
            templateId,
            issuer,
            name: `Template #${templateId}`, // Default name, can be enhanced with metadata
            description: `Tier ${tier} credential`, // Default description
            maxSupply,
            currentSupply,
            tier,
            startTime,
            endTime,
            isPaused,
            hasClaimed, // Add this for filtering
          } as Template & { hasClaimed?: boolean };
        } catch (err) {
          console.error(`Error fetching template ${templateId}:`, err);
          return null;
        }
      });

      const fetchedTemplates = await Promise.all(templatePromises);
      const validTemplates = fetchedTemplates.filter((t): t is Template & { hasClaimed?: boolean } => t !== null);

      // Filter templates by time windows
      const now = BigInt(Math.floor(Date.now() / 1000));
      const activeTemplates = validTemplates.filter(template => {
        // If startTime is 0, template is always active (no start restriction)
        const hasStarted = template.startTime === 0n || now >= template.startTime;
        // If endTime is 0, template never ends
        const hasNotEnded = template.endTime === 0n || now <= template.endTime;
        return hasStarted && hasNotEnded;
      });

      setTemplates(activeTemplates);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [publicClient, profileId]);

  // Initial fetch
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Create template (admin only)
  const createTemplate = useCallback(async (params: CreateTemplateParams) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await walletClient.writeContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'createTemplate',
        args: [
          params.templateId,
          params.issuer,
          params.maxSupply,
          params.tier,
          params.startTime,
          params.endTime,
        ],
        account: address,
      });

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Refresh templates
      await fetchTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
      throw err;
    }
  }, [walletClient, address, publicClient, fetchTemplates]);

  // Pause/unpause template
  const pauseTemplate = useCallback(async (templateId: bigint, isPaused: boolean) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await walletClient.writeContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'setTemplatePaused',
        args: [templateId, isPaused],
        account: address,
      });

      // Wait for transaction confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      // Refresh templates
      await fetchTemplates();
    } catch (err) {
      console.error('Error pausing template:', err);
      throw err;
    }
  }, [walletClient, address, publicClient, fetchTemplates]);

  // Check eligibility for a specific template
  const checkEligibility = useCallback(async (templateId: bigint, checkProfileId: bigint): Promise<boolean> => {
    if (!publicClient) {
      return false;
    }

    try {
      const hasClaimed = await publicClient.readContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'hasProfileClaimed',
        args: [templateId, checkProfileId],
      }) as boolean;

      return !hasClaimed;
    } catch (err) {
      console.error('Error checking eligibility:', err);
      return false;
    }
  }, [publicClient]);

  // Refresh templates
  const refreshTemplates = useCallback(async () => {
    await fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    pauseTemplate,
    refreshTemplates,
    checkEligibility,
  };
}
