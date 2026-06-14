'use client';

import { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

interface HeaderProps {
  notifications: Notification[];
}

export function Header({ notifications }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-danger-500" />;
      default:
        return <Info className="h-4 w-4 text-primary-500" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success-50';
      case 'warning':
        return 'bg-warning-50';
      case 'error':
        return 'bg-danger-50';
      default:
        return 'bg-primary-50';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search employees, modules, reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button className="text-xs font-medium text-primary-600 hover:text-primary-700">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50',
                          !notification.read && 'bg-primary-50/50'
                        )}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                              getNotificationBg(notification.type)
                            )}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-100 px-4 py-3">
                  <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-sm font-medium text-white">
            KI
          </div>
          <span className="text-sm font-medium text-gray-700">Kavya Iyer</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
