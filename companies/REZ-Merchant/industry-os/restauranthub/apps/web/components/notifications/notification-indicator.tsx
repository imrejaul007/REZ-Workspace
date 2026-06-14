'use client';

import React, { useState } from 'react';
import { Bell, Wifi, WifiOff, X } from 'lucide-react';
import { useSocket } from '@/lib/socket/socket-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function NotificationIndicator() {
  const { connected, notifications, clearNotifications } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.length;

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="flex items-center gap-2 relative">
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {connected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-xs ${connected ? 'text-green-600' : 'text-red-600'}`}>
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Notifications */}
      <div className="relative">
        <Button
          variant="ghost"
          size="default"
          className="relative"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() => {
                      clearNotifications();
                      setShowDropdown(false);
                    }}
                  >
                    Clear all
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="default"
                  onClick={() => setShowDropdown(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {unreadCount === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No new notifications
                </p>
              ) : (
                <div className="space-y-1">
                  {notifications.slice().reverse().map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0">
                          {notification.type === 'order-update' && <span className="text-lg">📦</span>}
                          {notification.type === 'new-order' && <span className="text-lg">🍽️</span>}
                          {notification.type === 'notification' && <span className="text-lg">🔔</span>}
                          {notification.type === 'pending' && <span className="text-lg">📬</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {getTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}