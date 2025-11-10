/**
 * Custom hook for managing collectible notifications
 * Handles initialization and lifecycle of the notification service
 */

import { useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { collectibleNotificationService } from '@/services/collectibleNotificationService';

export function useCollectibleNotifications() {
  const { address, provider } = useWallet();

  useEffect(() => {
    // Initialize notification service when user connects wallet
    async function initializeNotifications() {
      if (address && provider) {
        // Import the contract service
        const { collectibleContractService } = await import('@/services/collectibleContractService');
        
        // Initialize contract service first if not already initialized
        if (!collectibleContractService.isInitialized()) {
          try {
            await collectibleContractService.initialize(provider);
          } catch (error) {
            console.error('Failed to initialize contract service for notifications:', error);
            return;
          }
        }

        // Now initialize notification service
        collectibleNotificationService.initialize(address);
      }
    }

    initializeNotifications();

    return () => {
      // Stop notification service when component unmounts or wallet disconnects
      if (address) {
        collectibleNotificationService.stop();
      }
    };
  }, [address, provider]);

  return {
    refresh: () => collectibleNotificationService.refresh(),
  };
}
