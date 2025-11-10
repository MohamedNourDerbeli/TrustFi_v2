/**
 * NotificationBadge component
 * Displays count of unread collectible notifications
 * Task 16.2: Create NotificationBadge component
 */

import { useState, useEffect } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { collectibleNotificationService } from '@/services/collectibleNotificationService';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import CollectibleNotification from './CollectibleNotification';
import type { CollectibleNotification as NotificationType } from '@/services/collectibleNotificationService';

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load initial notifications
    const loadNotifications = () => {
      const allNotifications = collectibleNotificationService.getNotifications();
      setNotifications(allNotifications);
      setUnreadCount(collectibleNotificationService.getUnreadCount());
    };

    loadNotifications();

    // Subscribe to notification updates
    const unsubscribe = collectibleNotificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(collectibleNotificationService.getUnreadCount());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMarkAllAsRead = () => {
    collectibleNotificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    collectibleNotificationService.clearAll();
    setIsOpen(false);
  };

  // Don't show badge if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell className={cn(
            "h-5 w-5 transition-all",
            unreadCount > 0 && "animate-pulse text-purple-500"
          )} />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-lg shadow-purple-500/50 animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
              {/* Pulsing ring effect */}
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-600 animate-ping opacity-75" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold">New Collectibles</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-400">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No new collectibles</p>
              <p className="text-xs mt-1">
                We'll notify you when new collectibles you're eligible for become available
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <CollectibleNotification
                  key={notification.templateId}
                  notification={notification}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
