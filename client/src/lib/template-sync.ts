// lib/template-sync.ts
// Utility to sync templates from blockchain to Supabase templates_cache

import { type PublicClient, type Address } from 'viem';
import { REPUTATION_CARD_CONTRACT_ADDRESS } from './contracts';
import ReputationCardABI from './ReputationCard.abi.json';
import { supabase } from './supabase';
import { logger } from './logger';
import { LIMITS } from './constants';

export interface TemplateSyncResult {
  templateId: bigint;
  success: boolean;
  error?: string;
}

/**
 * Sync a single template from blockchain to database
 */
export async function syncTemplateToDatabase(
  publicClient: PublicClient,
  templateId: bigint
): Promise<TemplateSyncResult> {
  try {
    // Fetch template data from blockchain
    const templateData = await publicClient.readContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'templates',
      args: [templateId],
    }) as [Address, bigint, bigint, number, bigint, bigint, boolean];

    const [issuer, maxSupply, currentSupply, tier, startTime, endTime, isPaused] = templateData;

    // Skip if template doesn't exist (issuer is zero address)
    if (issuer === '0x0000000000000000000000000000000000000000') {
      return {
        templateId,
        success: false,
        error: 'Template does not exist on-chain',
      };
    }

    // Insert or update in database
    const { error } = await supabase
      .from('templates_cache')
      .upsert({
        template_id: templateId.toString(),
        issuer: issuer.toLowerCase(),
        name: `Template #${templateId}`,
        description: `Tier ${tier} credential`,
        max_supply: maxSupply.toString(),
        current_supply: currentSupply.toString(),
        tier: tier,
        start_time: startTime.toString(),
        end_time: endTime.toString(),
        is_paused: isPaused,
      }, {
        onConflict: 'template_id',
      });

    if (error) {
      console.error(`[syncTemplateToDatabase] Error syncing template ${templateId}:`, error);
      return {
        templateId,
        success: false,
        error: error.message,
      };
    }

    logger.info(`[syncTemplateToDatabase] Successfully synced template ${templateId}`);
    return {
      templateId,
      success: true,
    };
  } catch (error) {
    console.error(`[syncTemplateToDatabase] Exception syncing template ${templateId}:`, error);
    return {
      templateId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync all templates from blockchain to database
 * Scans template IDs from 1 to maxTemplateId (or until hitting empty templates)
 */
export async function syncAllTemplatesToDatabase(
  publicClient: PublicClient,
  maxTemplateId: number = 100
): Promise<{
  total: number;
  synced: number;
  failed: number;
  results: TemplateSyncResult[];
}> {
  logger.info('[syncAllTemplatesToDatabase] Starting template sync...');
  
  const results: TemplateSyncResult[] = [];
  let consecutiveEmpty = 0;
  const MAX_CONSECUTIVE_EMPTY = LIMITS.MAX_CONSECUTIVE_EMPTY; // Stop after consecutive empty templates

  for (let i = 1; i <= maxTemplateId; i++) {
    const result = await syncTemplateToDatabase(publicClient, BigInt(i));
    results.push(result);

    if (!result.success && result.error?.includes('does not exist')) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= MAX_CONSECUTIVE_EMPTY) {
        logger.info(`[syncAllTemplatesToDatabase] Stopping after ${MAX_CONSECUTIVE_EMPTY} consecutive empty templates`);
        break;
      }
    } else {
      consecutiveEmpty = 0;
    }
  }

  const synced = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.error?.includes('does not exist')).length;

  logger.info(`[syncAllTemplatesToDatabase] Sync complete: ${synced} synced, ${failed} failed, ${results.length} total`);

  return {
    total: results.length,
    synced,
    failed,
    results,
  };
}

/**
 * Update template supply in database (called after card issuance)
 */
export async function updateTemplateSupply(
  publicClient: PublicClient,
  templateId: bigint
): Promise<boolean> {
  try {
    // Fetch current supply from blockchain
    const templateData = await publicClient.readContract({
      address: REPUTATION_CARD_CONTRACT_ADDRESS as Address,
      abi: ReputationCardABI,
      functionName: 'templates',
      args: [templateId],
    }) as [Address, bigint, bigint, number, bigint, bigint, boolean];

    const [, , currentSupply] = templateData;

    // Update in database
    const { error } = await supabase
      .from('templates_cache')
      .update({
        current_supply: currentSupply.toString(),
      })
      .eq('template_id', templateId.toString());

    if (error) {
      console.error(`[updateTemplateSupply] Error updating template ${templateId}:`, error);
      return false;
    }

    logger.info(`[updateTemplateSupply] Updated template ${templateId} supply to ${currentSupply}`);
    return true;
  } catch (error) {
    console.error(`[updateTemplateSupply] Exception updating template ${templateId}:`, error);
    return false;
  }
}
