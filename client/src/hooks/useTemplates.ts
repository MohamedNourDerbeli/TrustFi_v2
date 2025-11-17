// hooks/useTemplates.ts - Modern React Query implementation
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import type { Template, CreateTemplateParams } from '../types/template';
import { logger } from '../lib/logger';
import { CACHE_TIMES, LIMITS } from '../lib/constants';

export interface UseTemplatesReturn {
  templates: Template[];
  loading: boolean;
  error: Error | null;
  createTemplate: (params: CreateTemplateParams) => Promise<void>;
  updateTemplate: (templateId: bigint, params: { maxSupply: bigint; startTime: bigint; endTime: bigint }) => Promise<void>;
  pauseTemplate: (templateId: bigint, isPaused: boolean) => Promise<void>;
  refreshTemplates: () => Promise<void>;
  checkEligibility: (templateId: bigint, profileId: bigint) => Promise<boolean>;
  batchIssueDirect: (recipients: Address[], templateId: bigint, tokenURIs: string[]) => Promise<bigint[]>;
}

async function fetchTemplatesData(publicClient: any, profileId?: bigint | null, includeAll: boolean = false) {
  // Use the new getTemplateCount and getAllTemplateIds functions
  try {
    // Get total template count from contract
    const templateCount = await publicClient.readContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'getTemplateCount',
    }) as bigint;

    logger.debug(`[useTemplates] Total templates: ${templateCount}`);

    if (templateCount === 0n) {
      return [];
    }

    // Get all template IDs
    const allTemplateIds = await publicClient.readContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'getAllTemplateIds',
    }) as bigint[];

    logger.debug(`[useTemplates] Fetched ${allTemplateIds.length} template IDs`);

    // Fetch template data for each ID
    const templatePromises = allTemplateIds.map(async (templateId) => {
      try {
        const templateData = await publicClient.readContract({
          address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
          abi: ReputationCardABI,
          functionName: 'templates',
          args: [templateId],
        }) as [Address, bigint, bigint, number, bigint, bigint, boolean, string, string];

      const [issuer, maxSupply, currentSupply, tier, startTime, endTime, isPaused, name, description] = templateData;

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
        name: name || `Template #${templateId}`,
        description: description || `Tier ${tier} credential`,
        maxSupply,
        currentSupply,
        tier,
        startTime,
        endTime,
        isPaused,
        hasClaimed,
      } as Template & { hasClaimed?: boolean };
    } catch (err) {
      console.error(`Error fetching template ${templateId}:`, err);
      return null;
    }
  });

    const fetchedTemplates = await Promise.all(templatePromises);
    const validTemplates = fetchedTemplates.filter((t): t is Template & { hasClaimed?: boolean } => t !== null);

    // Filter templates by time windows (unless includeAll is true)
    if (includeAll) {
      return validTemplates;
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    const activeTemplates = validTemplates.filter(template => {
      const hasStarted = template.startTime === 0n || now >= template.startTime;
      const hasNotEnded = template.endTime === 0n || now <= template.endTime;
      return hasStarted && hasNotEnded;
    });

    return activeTemplates;
  } catch (error) {
    logger.error('[useTemplates] Error fetching templates:', error);
    return [];
  }
}

export function useTemplates(profileId?: bigint | null, includeAll: boolean = false): UseTemplatesReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['templates', profileId?.toString(), includeAll],
    queryFn: () => fetchTemplatesData(publicClient!, profileId, includeAll),
    enabled: !!publicClient,
    staleTime: CACHE_TIMES.TEMPLATES_STALE,
    gcTime: CACHE_TIMES.TEMPLATES_GC,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Create template (admin only)
  const createTemplate = async (params: CreateTemplateParams) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

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
      chain: walletClient.chain,
    });

    // Wait for transaction confirmation
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }

    // Invalidate and refetch templates
    await queryClient.invalidateQueries({ queryKey: ['templates'] });
    await refetch();
  };

  // Pause/unpause template
  const pauseTemplate = async (templateId: bigint, isPaused: boolean) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'setTemplatePaused',
      args: [templateId, isPaused],
      account: address,
      chain: walletClient.chain,
    });

    // Wait for transaction confirmation
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }

    // Invalidate and refetch templates
    await queryClient.invalidateQueries({ queryKey: ['templates'] });
    await refetch();
  };

  // Check eligibility for a specific template
  const checkEligibility = async (templateId: bigint, checkProfileId: bigint): Promise<boolean> => {
    if (!publicClient) {
      return false;
    }

    try {
      // @ts-ignore - wagmi v2 type issue with readContract
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
  };

  // Refresh templates
  const refreshTemplates = async () => {
    await queryClient.invalidateQueries({ queryKey: ['templates'] });
    await refetch();
  };

  // Update template
  const updateTemplate = async (
    templateId: bigint,
    params: { maxSupply: bigint; startTime: bigint; endTime: bigint }
  ) => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    const hash = await walletClient.writeContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'updateTemplate',
      args: [templateId, params.maxSupply, params.startTime, params.endTime],
      account: address,
      chain: walletClient.chain,
    });

    await publicClient?.waitForTransactionReceipt({ hash });

    // Invalidate and refetch templates
    await queryClient.invalidateQueries({ queryKey: ['templates'] });
    await refetch();
  };

  // Batch issue cards
  const batchIssueDirect = async (
    recipients: Address[],
    templateId: bigint,
    tokenURIs: string[]
  ): Promise<bigint[]> => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    if (recipients.length !== tokenURIs.length) {
      throw new Error('Recipients and tokenURIs length mismatch');
    }

    if (recipients.length === 0 || recipients.length > 100) {
      throw new Error('Batch size must be between 1 and 100');
    }

    const hash = await walletClient.writeContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'batchIssueDirect',
      args: [recipients, templateId, tokenURIs],
      account: address,
      chain: walletClient.chain,
    });

    const receipt = await publicClient?.waitForTransactionReceipt({ hash });

    // Extract card IDs from events or return value
    // For now, we'll invalidate templates cache
    await queryClient.invalidateQueries({ queryKey: ['templates'] });
    await refetch();

    // Return empty array for now - in production, parse events to get actual card IDs
    return [];
  };

  return {
    templates: data || [],
    loading: isLoading,
    error: error as Error | null,
    createTemplate,
    updateTemplate,
    pauseTemplate,
    batchIssueDirect,
    refreshTemplates,
    checkEligibility,
  };
}
