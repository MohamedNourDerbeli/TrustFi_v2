/**
 * KILT Configuration
 * 
 * Runtime configuration for KILT Protocol integration
 */

import type { KiltConfig } from '../../types/kilt';

/**
 * Get KILT configuration from environment variables
 */
export function getKiltConfig(): KiltConfig {
  const network = import.meta.env.VITE_KILT_NETWORK || 'peregrine';
  const wssAddress = import.meta.env.VITE_KILT_WSS_ADDRESS || 'wss://peregrine.kilt.io';
  const enabled = import.meta.env.VITE_KILT_ENABLED === 'true';
  const mode = import.meta.env.VITE_KILT_MODE || 'hybrid';
  
  // Validate network
  if (network !== 'peregrine' && network !== 'spiritnet') {
    console.warn(`Invalid KILT network: ${network}. Defaulting to peregrine.`);
  }
  
  // Validate mode
  if (mode !== 'database-only' && mode !== 'kilt-only' && mode !== 'hybrid') {
    console.warn(`Invalid KILT mode: ${mode}. Defaulting to hybrid.`);
  }
  
  return {
    network: (network === 'spiritnet' ? 'spiritnet' : 'peregrine') as 'peregrine' | 'spiritnet',
    wssAddress,
    enabled,
    mode: (mode === 'database-only' || mode === 'kilt-only' ? mode : 'hybrid') as 'database-only' | 'kilt-only' | 'hybrid',
    fallbackToDatabase: true,
  };
}

/**
 * KILT configuration singleton
 */
export const kiltConfig = getKiltConfig();

/**
 * Check if KILT is enabled
 */
export function isKiltEnabled(): boolean {
  return kiltConfig.enabled;
}

/**
 * Check if KILT mode is hybrid
 */
export function isHybridMode(): boolean {
  return kiltConfig.mode === 'hybrid';
}

/**
 * Check if KILT mode is KILT-only
 */
export function isKiltOnlyMode(): boolean {
  return kiltConfig.mode === 'kilt-only';
}

/**
 * Check if KILT mode is database-only
 */
export function isDatabaseOnlyMode(): boolean {
  return kiltConfig.mode === 'database-only';
}

/**
 * Get WSS address for KILT network
 */
export function getWssAddress(): string {
  return kiltConfig.wssAddress;
}

/**
 * Get KILT network name
 */
export function getNetworkName(): 'peregrine' | 'spiritnet' {
  return kiltConfig.network;
}
