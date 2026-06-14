'use client';

import React, { useState } from 'react';
import { 
  BellIcon, 
  MagnifyingGlassIcon, 
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useTheme } from 'next-themes';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Security Alert',
    message: 'Multiple failed login attempts detected',
    time: '5 minutes ago',
    type: 'warning',
    read: false,
  },
  {
    id: '2',
    title: 'New Restaurant Registration',
    message: 'Spice Garden has registered and is pending verification',
    time: '15 minutes ago',
    type: 'info',
    read: false,
  },
  {
    id: '3',
    title: 'Payment Gateway Issue',
    message: 'Razorpay webhook endpoint is down',
    time: '1 hour ago',
    type: 'error',
    read: false,
  },
  {
    id: '4',
    title: 'System Update Complete',
    message: 'Database backup completed successfully',
    time: '2 hours ago',
    type: 'success',
    read: true,
  },
];

export const AdminHeader: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users, restaurants, orders..."
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="default"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  color="red" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-500">{unreadCount} unread notifications</p>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        notification.read 
                          ? 'border-transparent' 
                          : notification.type === 'error' 
                          ? 'border-red-500' 
                          : notification.type === 'warning'
                          ? 'border-yellow-500'
                          : notification.type === 'success'
                          ? 'border-green-500'
                          : 'border-blue-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 py-2 border-t border-gray-200">
                  <Button variant="outline" size="default" className="w-full">
                    View All Notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <Button
            variant="outline"
            size="default"
            className="p-2"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </Button>

          {/* Profile */}
          <div className="relative">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 px-3 py-2"
            >
              <UserCircleIcon className="h-5 w-5" />
              <span className="hidden md:block">Admin</span>
            </Button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">Admin User</p>
                  <p className="text-sm text-gray-500">admin@restauranthub.com</p>
                </div>
                
                <div className="py-1">
                  <a href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Profile Settings
                  </a>
                  <a href="/admin/activity" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Activity Log
                  </a>
                  <a href="/admin/help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Help & Support
                  </a>
                </div>
                
                <div className="border-t border-gray-200 py-1">
                  <a href="/logout" className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50">
                    Sign Out
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showNotifications || showProfile) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
};