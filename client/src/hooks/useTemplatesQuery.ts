// hooks/useTemplatesQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, parseAbiItem } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import type { Template, CreateTemplateParams } from '../types/template';
import { queryKeys } from '../lib/queryClient';

// Fetch all templates from contract
async function fetchTemplates(publicClient: any, profileId?: bigint | null): Promise<Template[]> {
  // TEMPORARY FIX: Return empty templates to avoid rate limiting
  // TODO: Implement proper solution (Subgraph, Supabase cache, or private RPC)
  console.warn('Template fetching disabled due to RPC rate limits. Please implement Supabase cache or use private RPC.');
  
  const templateCreatedEvents: any[] = [];
  
  // If you have templates, you can manually add them here for testing:
  // const templateCreatedEvents = [
  //   { args: { templateId: 1n } },
  //   { args: { templateId: 2n } },
  // ];

  const templateIds = Array.from(
    new Set(templateCreatedEvents.map(event => event.args.templateId as bigint))
  );

  const templatePromises = templateIds.map(async (templateId) => {
    try {
      const templateData = await publicClient.readContract({
        address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
        abi: ReputationCardABI,
        functionName: 'templates',
        args: [templateId],
      }) as [Address, bigint, bigint, number, bigint, bigint, boolean];

      const [issuer, maxSupply, currentSupply, tier, startTime, endTime, isPaused] = templateData;

      if (issuer === '0x0000000000000000000000000000000000000000') {
        return null;
      }

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

  // Filter by time windows
  const now = BigInt(Math.floor(Date.now() / 1000));
  return validTemplates.filter(template => {
    const hasStarted = template.startTime === 0n || now >= template.startTime;
    const hasNotEnded = template.endTime === 0n || now <= template.endTime;
    return hasStarted && hasNotEnded;
  });
}

// Check eligibility for a template
async function checkTemplateEligibility(
  templateId: bigint,
  profileId: bigint,
  publicClient: any
): Promise<boolean> {
  const hasClaimed = await publicClient.readContract({
    address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
    abi: ReputationCardABI,
    functionName: 'hasProfileClaimed',
    args: [templateId, profileId],
  }) as boolean;

  return !hasClaimed;
}

export function useTemplatesQuery(profileId?: bigint | null) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  // Query for all templates
  const templatesQuery = useQuery({
    queryKey: queryKeys.templates(),
    queryFn: () => fetchTemplates(publicClient, profileId),
    enabled: !!publicClient,
    staleTime: 1000 * 60 * 3, // 3 minutes for templates
  });

  // Mutation for creating template
  const createTemplateMutation = useMutation({
    mutationFn: async (params: CreateTemplateParams) => {
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

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return hash;
    },
    onSuccess: () => {
      // Invalidate templates query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
    },
  });

  // Mutation for pausing/unpausing template
  const pauseTemplateMutation = useMutation({
    mutationFn: async ({ templateId, isPaused }: { templateId: bigint; isPaused: boolean }) => {
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

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      return hash;
    },
    onSuccess: () => {
      // Invalidate templates query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
    },
  });

  return {
    templates: templatesQuery.data || [],
    loading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate: createTemplateMutation.mutateAsync,
    pauseTemplate: (templateId: bigint, isPaused: boolean) =>
      pauseTemplateMutation.mutateAsync({ templateId, isPaused }),
    refreshTemplates: () => queryClient.invalidateQueries({ queryKey: queryKeys.templates() }),
    checkEligibility: (templateId: bigint, checkProfileId: bigint) =>
      checkTemplateEligibility(templateId, checkProfileId, publicClient),
  };
}
