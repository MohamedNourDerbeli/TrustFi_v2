/**
 * Service for managing collectible notifications
 * Tracks new collectibles user is eligible for and manages notification state
 * Task 16.1: Create notification service
 */

import { collectibleContractService } from './collectibleContractService';
import type { CollectibleTemplate, ClaimStatus } from '@/types/collectible';

export interface CollectibleNotification {
  templateId: number;
  collectible: CollectibleTemplate;
  eligibilityReason: string;
  timestamp: number;
  isRead: boolean;
  isNew: boolean;
}

interface NotificationState {
  notifications: CollectibleNotification[];
  lastChecked: number;
  seenTemplateIds: number[];
}

const STORAGE_KEY = 'trustfi_collectible_notifications';
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class CollectibleNotificationService {
  private listeners: Set<(notifications: CollectibleNotification[]) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;
  private userAddress: string | null = null;

  /**
   * Initialize the notification service for a user
   */
  initialize(userAddress: string): void {
    this.userAddress = userAddress;
    this.startPolling();
  }

  /**
   * Stop the notification service
   */
  stop(): void {
    this.stopPolling();
    this.userAddress = null;
  }

  /**
   * Get current notification state from localStorage
   */
  private getState(): NotificationState {
    if (!this.userAddress) {
      return {
        notifications: [],
        lastChecked: 0,
        seenTemplateIds: [],
      };
    }

    try {
      const key = `${STORAGE_KEY}_${this.userAddress}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return {
          notifications: [],
          lastChecked: 0,
          seenTemplateIds: [],
        };
      }

      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to load notification state:', error);
      return {
        notifications: [],
        lastChecked: 0,
        seenTemplateIds: [],
      };
    }
  }

  /**
   * Save notification state to localStorage
   */
  private saveState(state: NotificationState): void {
    if (!this.userAddress) return;

    try {
      const key = `${STORAGE_KEY}_${this.userAddress}`;
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save notification state:', error);
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): CollectibleNotification[] {
    const state = this.getState();
    return state.notifications;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    const state = this.getState();
    return state.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Mark a notification as read
   */
  markAsRead(templateId: number): void {
    const state = this.getState();
    const notification = state.notifications.find(n => n.templateId === templateId);
    
    if (notification) {
      notification.isRead = true;
      notification.isNew = false;
      this.saveState(state);
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const state = this.getState();
    state.notifications.forEach(n => {
      n.isRead = true;
      n.isNew = false;
    });
    this.saveState(state);
    this.notifyListeners();
  }

  /**
   * Dismiss a notification
   */
  dismissNotification(templateId: number): void {
    const state = this.getState();
    state.notifications = state.notifications.filter(n => n.templateId !== templateId);
    this.saveState(state);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    const state = this.getState();
    state.notifications = [];
    this.saveState(state);
    this.notifyListeners();
  }

  /**
   * Check for new eligible collectibles
   */
  async checkForNewCollectibles(): Promise<void> {
    if (!this.userAddress) return;

    try {
      // Check if contract service is initialized
      if (!collectibleContractService.isInitialized()) {
        console.log('CollectibleNotificationService: Contract service not initialized yet, skipping check');
        return;
      }

      const state = this.getState();
      const activeCollectibles = await collectibleContractService.getActiveCollectibles();
      
      const newNotifications: CollectibleNotification[] = [];
      const currentTime = Date.now();

      for (const collectible of activeCollectibles) {
        // Skip if already seen
        if (state.seenTemplateIds.includes(collectible.templateId)) {
          continue;
        }

        // Check eligibility
        let claimStatus: ClaimStatus;
        try {
          claimStatus = await collectibleContractService.checkEligibility(
            collectible.templateId,
            this.userAddress
          );
        } catch (error) {
          console.warn(`Failed to check eligibility for template ${collectible.templateId}:`, error);
          continue;
        }

        // Only notify if eligible and not claimed
        if (claimStatus.isEligible && !claimStatus.hasClaimed) {
          const eligibilityReason = this.getEligibilityReason(collectible, claimStatus);
          
          newNotifications.push({
            templateId: collectible.templateId,
            collectible,
            eligibilityReason,
            timestamp: currentTime,
            isRead: false,
            isNew: true,
          });

          state.seenTemplateIds.push(collectible.templateId);
        }
      }

      // Add new notifications to state
      if (newNotifications.length > 0) {
        state.notifications = [...newNotifications, ...state.notifications];
        state.lastChecked = currentTime;
        this.saveState(state);
        this.notifyListeners();
      } else {
        // Update last checked time even if no new notifications
        state.lastChecked = currentTime;
        this.saveState(state);
      }
    } catch (error) {
      console.error('Failed to check for new collectibles:', error);
    }
  }

  /**
   * Get human-readable eligibility reason
   */
  private getEligibilityReason(
    collectible: CollectibleTemplate,
    _claimStatus: ClaimStatus
  ): string {
    const reasons: string[] = [];

    // Check eligibility type
    switch (collectible.eligibilityType) {
      case 0: // OPEN
        reasons.push('Open to everyone');
        break;
      case 1: // WHITELIST
        reasons.push('You are on the whitelist');
        break;
      case 2: // TOKEN_HOLDER
        reasons.push('You hold the required tokens');
        break;
      case 3: // PROFILE_REQUIRED
        reasons.push('You have a TrustFi profile');
        break;
    }

    // Add supply info if limited
    if (collectible.maxSupply > 0) {
      const remaining = collectible.maxSupply - collectible.currentSupply;
      if (remaining <= 10) {
        reasons.push(`Only ${remaining} left!`);
      }
    }

    // Add time info if expiring soon
    if (collectible.endTime > 0) {
      const timeRemaining = collectible.endTime - Math.floor(Date.now() / 1000);
      const hoursRemaining = Math.floor(timeRemaining / 3600);
      
      if (hoursRemaining <= 24) {
        reasons.push(`Expires in ${hoursRemaining} hours`);
      }
    }

    return reasons.join(' • ');
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(listener: (notifications: CollectibleNotification[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of notification changes
   */
  private notifyListeners(): void {
    const notifications = this.getNotifications();
    this.listeners.forEach(listener => {
      try {
        listener(notifications);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  /**
   * Start polling for new collectibles
   */
  private startPolling(): void {
    // Check immediately
    this.checkForNewCollectibles();

    // Then check periodically
    this.pollingInterval = setInterval(() => {
      this.checkForNewCollectibles();
    }, CHECK_INTERVAL);
  }

  /**
   * Stop polling for new collectibles
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Manually trigger a check (useful for user-initiated refresh)
   */
  async refresh(): Promise<void> {
    await this.checkForNewCollectibles();
  }
}

// Export singleton instance
export const collectibleNotificationService = new CollectibleNotificationService();
