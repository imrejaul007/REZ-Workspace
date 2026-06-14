'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate, cn } from '@/lib/utils';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  data?;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Job Application',
      message: 'John Doe has applied for the Chef position',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      title: 'Order Delivered',
      message: 'Your order #12345 has been delivered successfully',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      title: 'Payment Pending',
      message: 'Invoice #INV-001 payment is due tomorrow',
      type: 'warning',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getNotificationBg = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return 'bg-background';
    
    switch (type) {
      case 'success':
        return 'bg-success-50 dark:bg-success-950';
      case 'warning':
        return 'bg-warning-50 dark:bg-warning-950';
      case 'error':
        return 'bg-destructive/10';
      default:
        return 'bg-primary/5';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96"
            >
              <Card className="shadow-xl border max-h-96 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={handleMarkAllAsRead}
                        className="text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No notifications yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'p-4 hover:bg-accent/50 transition-colors',
                            getNotificationBg(notification.type, notification.isRead)
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className={cn(
                                  'text-sm font-medium truncate',
                                  notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                
                                <div className="flex items-center space-x-1">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="default"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification.id);
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Mark read
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="default"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveNotification(notification.id);
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t text-center">
                    <Button variant="ghost" size="default" className="text-xs" asChild>
                      <Link href="/notifications">
                        View all notifications
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}