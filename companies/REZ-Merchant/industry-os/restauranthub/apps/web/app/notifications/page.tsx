'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Filter,
  Search,
  Settings,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Star,
  AlertCircle,
  Info,
  Users,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';

interface Notification {
  id: string;
  type: 'job' | 'order' | 'message' | 'review' | 'system' | 'payment' | 'application';
  title: string;
  message: string;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    senderName?: string;
    senderRole?: 'admin' | 'restaurant' | 'employee' | 'vendor';
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/notifications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : data.notifications || []);
        } else if (res.status === 404) {
          // Endpoint doesn't exist yet
          setNotifications([]);
        } else {
          setError('Failed to load notifications.');
        }
      } catch {
        // Network error or endpoint doesn't exist — treat as empty
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const importantCount = notifications.filter(n => n.isImportant && !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'job': return <Briefcase className="h-5 w-5 text-blue-600" />;
      case 'order': return <ShoppingCart className="h-5 w-5 text-green-600" />;
      case 'message': return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'review': return <Star className="h-5 w-5 text-yellow-600" />;
      case 'system': return <Info className="h-5 w-5 text-blue-600" />;
      case 'payment': return <Package className="h-5 w-5 text-green-600" />;
      case 'application': return <Users className="h-5 w-5 text-orange-600" />;
      default: return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReadFilter = !showUnreadOnly || !n.isRead;
    return matchesType && matchesSearch && matchesReadFilter;
  });

  const notificationTypes = [
    { value: 'all', label: 'All Notifications', count: notifications.length },
    { value: 'job', label: 'Jobs', count: notifications.filter(n => n.type === 'job').length },
    { value: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
    { value: 'message', label: 'Messages', count: notifications.filter(n => n.type === 'message').length },
    { value: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead} size="default">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all read
              </Button>
            )}
            <Button variant="outline" size="default">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-foreground">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                  <Star className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Important</p>
                  <p className="text-2xl font-bold text-foreground">{importantCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  {notificationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} ({type.count})
                    </option>
                  ))}
                </select>
                <Button
                  variant={showUnreadOnly ? 'default' : 'outline'}
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Unread Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Recent Notifications ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Could not load notifications</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== 'all' || showUnreadOnly
                    ? 'Try adjusting your filters'
                    : "You're all caught up. New notifications will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 rounded-lg border transition-colors hover:bg-accent/50 cursor-pointer',
                      !notification.isRead ? 'bg-primary/5 border-primary/20' : 'border-border'
                    )}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={cn(
                          'p-2 rounded-lg',
                          notification.isImportant ? 'bg-destructive/10' : 'bg-muted/50'
                        )}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className={cn(
                              'font-medium text-sm',
                              !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                              {notification.title}
                            </h4>
                            {notification.isImportant && (
                              <Star className="h-3 w-3 text-red-500 fill-red-500" />
                            )}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(notification.createdAt, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <div className="flex items-center space-x-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification.id); }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <p className={cn(
                          'text-sm mb-2',
                          !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {notification.message}
                        </p>
                        {notification.actionUrl && (
                          <Button variant="outline" size="default">
                            {notification.actionText || 'View Details'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
