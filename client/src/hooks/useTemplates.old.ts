// hooks/useTemplates.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, parseAbiItem } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from '../lib/contracts';
import ReputationCardABI from '../lib/ReputationCard.abi.json';
import { useDataCache } from '../contexts/DataCacheContext';
import type { Template, CreateTemplateParams } from '../types/template';

const CACHE_KEY = 'templates';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const { getCache, setCache, isCacheValid } = useDataCache();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all templates
  const fetchTemplates = useCallback(async () => {
    if (!publicClient) {
      setLoading(false);
      return;
    }

    // Check cache first
    if (isCacheValid(CACHE_KEY, CACHE_DURATION)) {
      const cachedTemplates = getCache<Template[]>(CACHE_KEY);
      if (cachedTemplates) {
        console.log('Using cached templates');
        setTemplates(cachedTemplates);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Get current block number
      const latestBlock = await publicClient.getBlockNumber();
      
      // Fetch events in smaller chunks to avoid rate limits
      const CHUNK_SIZE = 1000n;
      const allEvents: any[] = [];
      
      // Only fetch last 10k blocks to reduce RPC calls
      const startBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n;
      
      console.log(`Fetching templates from block ${startBlock} to ${latestBlock}`);
      
      for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += CHUNK_SIZE) {
        const toBlock = fromBlock + CHUNK_SIZE > latestBlock ? latestBlock : fromBlock + CHUNK_SIZE;
        
        try {
          const events = await publicClient.getLogs({
            address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
            event: parseAbiItem('event TemplateCreated(uint256 indexed templateId, address indexed issuer, uint256 maxSupply, uint8 tier, uint256 startTime, uint256 endTime)'),
            fromBlock,
            toBlock,
          });
          
          allEvents.push(...events);
          console.log(`Fetched ${events.length} events from blocks ${fromBlock}-${toBlock}`);
        } catch (chunkError) {
          console.warn(`Error fetching events from block ${fromBlock} to ${toBlock}:`, chunkError);
          // Continue with next chunk even if one fails
        }
      }
      
      const templateCreatedEvents = allEvents;

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
      
      // Cache the results
      setCache(CACHE_KEY, activeTemplates, CACHE_DURATION);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [publicClient, profileId, getCache, setCache, isCacheValid]);

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
