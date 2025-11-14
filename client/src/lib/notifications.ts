// lib/notifications.ts
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import type { Hash } from 'viem';

const BLOCK_EXPLORER_URL = 'https://moonbase.moonscan.io';

export interface SuccessNotificationOptions {
  title: string;
  message?: string;
  txHash?: Hash;
  showConfetti?: boolean;
  duration?: number;
}

/**
 * Show a success notification with optional transaction link and confetti
 */
export function showSuccessNotification({
  title,
  message,
  txHash,
  showConfetti: shouldShowConfetti = false,
  duration = 5000,
}: SuccessNotificationOptions) {
  let displayMessage = title;
  if (message) {
    displayMessage += `\n${message}`;
  }
  if (txHash) {
    displayMessage += `\n\nView transaction: ${BLOCK_EXPLORER_URL}/tx/${txHash}`;
  }

  toast.success(displayMessage, {
    duration,
    position: 'top-right',
    style: {
      background: '#f0fdf4',
      border: '1px solid #86efac',
      padding: '16px',
      maxWidth: '500px',
      whiteSpace: 'pre-line',
    },
    icon: '✅',
  });

  // Trigger confetti animation if requested
  if (shouldShowConfetti) {
    triggerConfetti();
  }
}

/**
 * Show an error notification
 */
export function showErrorNotification(title: string, message?: string) {
  let displayMessage = title;
  if (message) {
    displayMessage += `\n${message}`;
  }

  toast.error(displayMessage, {
    duration: 6000,
    position: 'top-right',
    style: {
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      padding: '16px',
      maxWidth: '500px',
      whiteSpace: 'pre-line',
    },
  });
}

/**
 * Show a loading notification
 */
export function showLoadingNotification(message: string) {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#eff6ff',
      border: '1px solid #93c5fd',
      padding: '16px',
    },
  });
}

/**
 * Dismiss a notification by ID
 */
export function dismissNotification(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Trigger confetti animation
 */
export function triggerConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Fire multiple bursts for a more impressive effect
  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

/**
 * Show a profile creation success notification with confetti
 */
export function showProfileCreatedNotification(profileId: bigint, txHash?: Hash) {
  showSuccessNotification({
    title: 'Profile Created! 🎉',
    message: `Your profile has been created successfully. Profile ID: ${profileId.toString()}`,
    txHash,
    showConfetti: true,
    duration: 7000,
  });
}

/**
 * Show a card claim success notification with confetti
 */
export function showCardClaimedNotification(cardId: bigint, txHash?: Hash) {
  showSuccessNotification({
    title: 'Card Claimed! 🎉',
    message: `Reputation card #${cardId.toString()} has been added to your profile.`,
    txHash,
    showConfetti: true,
    duration: 7000,
  });
}

/**
 * Show a score recalculation success notification
 */
export function showScoreUpdatedNotification(
  oldScore: bigint,
  newScore: bigint,
  txHash?: Hash
) {
  const scoreDiff = newScore - oldScore;
  const message =
    scoreDiff > 0n
      ? `Your score increased by ${scoreDiff.toString()} points!`
      : scoreDiff < 0n
      ? `Your score decreased by ${Math.abs(Number(scoreDiff))} points.`
      : 'Your score remains unchanged.';

  showSuccessNotification({
    title: 'Score Updated',
    message,
    txHash,
    duration: 6000,
  });
}
