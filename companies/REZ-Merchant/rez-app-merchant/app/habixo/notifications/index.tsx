// Habixo Notifications Screen for Merchant
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, FlatList, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getDeliveredNotifications,
  dismissAllDeliveredNotifications,
  MerchantNotification,
} from '../services/notificationService';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: Date;
  type: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New Booking Request',
    body: 'Priya Mehta wants to book Modern Apartment Koramangala',
    date: new Date(Date.now() - 3600000),
    type: 'booking_request',
    read: false,
  },
  {
    id: 'n2',
    title: 'Booking Confirmed',
    body: 'Amit Kumar\'s booking has been paid. Check-in on May 12.',
    date: new Date(Date.now() - 7200000),
    type: 'booking_confirmed',
    read: false,
  },
  {
    id: 'n3',
    title: 'Payout Processed',
    body: 'Your payout of ₹45,000 has been credited to HDFC Bank',
    date: new Date(Date.now() - 86400000),
    type: 'payout',
    read: true,
  },
  {
    id: 'n4',
    title: 'New Review',
    body: 'Rahul Verma rated your Beach Villa Goa 5 stars!',
    date: new Date(Date.now() - 172800000),
    type: 'review',
    read: true,
  },
];

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_ICONS: Record<string, string> = {
  booking_request: '📋',
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  payout: '💰',
  review: '⭐',
  message: '💬',
  alert: '⚠️',
};

export default function HabixoNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to notifications
    const receivedSubscription = addNotificationReceivedListener((notification) => {
      const newNotification: NotificationItem = {
        id: notification.request.identifier,
        title: notification.request.content.title || 'Notification',
        body: notification.request.content.body || '',
        date: new Date(),
        type: notification.request.content.data?.type || 'alert',
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    const responseSubscription = addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await dismissAllDeliveredNotifications();
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.notificationUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>
          {TYPE_ICONS[item.type] || '📢'}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.notificationTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notificationDate}>{formatDate(item.date)}</Text>
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        }
      />

      {/* Push Notification Setup */}
      <View style={styles.setupBanner}>
        <Text style={styles.setupIcon}>🔔</Text>
        <View style={styles.setupContent}>
          <Text style={styles.setupTitle}>Enable Push Notifications</Text>
          <Text style={styles.setupText}>
            Get instant alerts for new bookings, payouts, and reviews.
          </Text>
        </View>
        <TouchableOpacity style={styles.setupButton}>
          <Text style={styles.setupButtonText}>Enable</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 2,
  },
  markAllRead: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationUnread: {
    backgroundColor: '#f0f9ff',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  notificationTitleUnread: {
    color: '#1f2937',
  },
  notificationDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  setupBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  setupIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  setupContent: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  setupText: {
    fontSize: 12,
    color: '#6b7280',
  },
  setupButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
