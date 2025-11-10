/**
 * TimeRemainingBadge - Display component for time-based availability
 * Shows countdown or status for collectible claiming period
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Calendar } from 'lucide-react';

interface TimeRemainingBadgeProps {
  startTime: number;
  endTime: number;
  size?: 'sm' | 'md' | 'lg';
}

export function TimeRemainingBadge({
  startTime,
  endTime,
  size = 'md',
}: TimeRemainingBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [status, setStatus] = useState<'not-started' | 'active' | 'ended'>('active');

  useEffect(() => {
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);

      // Not started yet
      if (startTime > 0 && now < startTime) {
        setStatus('not-started');
        const diff = startTime - now;
        setTimeRemaining(formatTimeRemaining(diff));
        return;
      }

      // Ended
      if (endTime > 0 && now > endTime) {
        setStatus('ended');
        setTimeRemaining('Ended');
        return;
      }

      // Active
      setStatus('active');
      if (endTime > 0) {
        const diff = endTime - now;
        setTimeRemaining(formatTimeRemaining(diff));
      } else {
        setTimeRemaining('No expiration');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';

    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getVariant = () => {
    if (status === 'ended') return 'secondary';
    if (status === 'not-started') return 'outline';
    
    // Active - check urgency
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    
    if (remaining < 24 * 60 * 60) return 'destructive'; // Less than 1 day
    if (remaining < 7 * 24 * 60 * 60) return 'default'; // Less than 7 days
    return 'secondary';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Don't show badge if no time restrictions
  if (startTime === 0 && endTime === 0) {
    return null;
  }

  return (
    <Badge
      variant={getVariant()}
      className={cn('gap-1 font-medium', sizeClasses[size])}
    >
      {status === 'not-started' ? (
        <>
          <Calendar className={iconSizes[size]} />
          Starts in {timeRemaining}
        </>
      ) : status === 'ended' ? (
        <>
          <Clock className={iconSizes[size]} />
          Ended
        </>
      ) : (
        <>
          <Clock className={iconSizes[size]} />
          {endTime > 0 ? `${timeRemaining} left` : 'No expiration'}
        </>
      )}
    </Badge>
  );
}
