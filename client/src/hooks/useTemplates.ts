// hooks/useTemplates.ts - Modern React Query implementation
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

async function fetchTemplatesData(publicClient: any, profileId?: bigint | null, includeAll: boolean = false) {
  // Instead of scanning blocks, we'll try reading templates directly
  // Start from template ID 1 and read until we hit an invalid template (issuer = 0x0)
  const templateIds: bigint[] = [];
  const MAX_TEMPLATES = 100; // Safety limit to prevent infinite loops
  
  // Try reading templates sequentially
  for (let i = 1; i <= MAX_TEMPLATES; i++) {
    try {
      const templateData = await publicClient.readContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'templates',
        args: [BigInt(i)],
      }) as [Address, bigint, bigint, number, bigint, bigint, boolean];

      const [issuer] = templateData;
      
      // If issuer is zero address, this template doesn't exist
      if (issuer === '0x0000000000000000000000000000000000000000') {
        // We've reached the end of templates
        break;
      }
      
      templateIds.push(BigInt(i));
    } catch (error) {
      // If we get an error, assume we've reached the end
      console.log(`Stopped at template ${i}`);
      break;
    }
  }

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
        name: `Template #${templateId}`,
        description: `Tier ${tier} credential`,
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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

  return {
    templates: data || [],
    loading: isLoading,
    error: error as Error | null,
    createTemplate,
    pauseTemplate,
    refreshTemplates,
    checkEligibility,
  };
}
