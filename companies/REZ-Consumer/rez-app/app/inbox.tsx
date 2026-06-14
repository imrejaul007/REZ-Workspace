// @ts-nocheck
/**
 * /inbox — Smart Inbox for email receipts, travel, food, invoices, subscriptions
 *
 * Unified inbox that connects to REZ-inbox backend service
 * Categories: travel, food, invoice, subscription, banking, social, promotion
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';

// Inbox API URL
const INBOX_API_URL = process.env.EXPO_PUBLIC_INBOX_API_URL || 'http://localhost:3003';

interface Message {
  id: string;
  from: string;
  fromName?: string;
  subject: string;
  body: string;
  category: 'travel' | 'food' | 'invoice' | 'subscription' | 'banking' | 'social' | 'promotion' | 'other';
  date: string;
  status: 'unread' | 'read' | 'archived';
  isStarred: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'mail-outline' as const },
  { id: 'travel', name: 'Travel', icon: 'airplane-outline' as const },
  { id: 'food', name: 'Food', icon: 'restaurant-outline' as const },
  { id: 'invoice', name: 'Invoices', icon: 'document-text-outline' as const },
  { id: 'subscription', name: 'Subscriptions', icon: 'card-outline' as const },
  { id: 'banking', name: 'Banking', icon: 'card-outline' as const },
];

export default function InboxScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = useCallback(async (category?: string) => {
    try {
      const categoryParam = category && category !== 'all' ? `?category=${category}` : '';
      const response = await fetch(`${INBOX_API_URL}/api/messages${categoryParam}`);
      const data = await response.json();

      if (data.success && data.data) {
        setMessages(data.data.items || []);
      }
    } catch (error) {
      logger.error('[inbox] Failed to load messages', error);
      // Fallback to mock data for demo
      setMessages(getMockMessages(selectedCategory));
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    loadMessages(selectedCategory === 'all' ? undefined : selectedCategory);
    setLoading(false);
  }, [selectedCategory, loadMessages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages(selectedCategory === 'all' ? undefined : selectedCategory);
    setRefreshing(false);
  }, [selectedCategory, loadMessages]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${INBOX_API_URL}/api/messages/${id}/read`, { method: 'PATCH' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' as const } : m));
    } catch (error) {
      logger.error('[inbox] Failed to mark as read', error);
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      await fetch(`${INBOX_API_URL}/api/messages/${id}/star`, { method: 'PATCH' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isStarred: !m.isStarred } : m));
    } catch (error) {
      logger.error('[inbox] Failed to toggle star', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || 'mail-outline';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      travel: '#3B82F6',
      food: '#F59E0B',
      invoice: '#10B981',
      subscription: '#8B5CF6',
      banking: '#EC4899',
    };
    return colors[category] || '#6B7280';
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Pressable
      style={[styles.messageCard, item.status === 'unread' && styles.unreadCard]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
        <Ionicons name={getCategoryIcon(item.category)} size={20} color={getCategoryColor(item.category)} />
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={[styles.fromName, item.status === 'unread' && styles.unreadText]} numberOfLines={1}>
            {item.fromName || item.from}
          </Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
        <Text style={[styles.subject, item.status === 'unread' && styles.unreadText]} numberOfLines={1}>
          {item.subject}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>{item.body}</Text>
      </View>
      <Pressable style={styles.starButton} onPress={() => handleToggleStar(item.id)}>
        <Ionicons
          name={item.isStarred ? 'star' : 'star-outline'}
          size={20}
          color={item.isStarred ? '#F59E0B' : '#9CA3AF'}
        />
      </Pressable>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mail-open-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No messages</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === 'all'
          ? 'Your receipts and notifications will appear here'
          : `No ${selectedCategory} messages yet`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REZ Inbox</Text>
        <Text style={styles.headerSubtitle}>Smart email receipts & more</Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={selectedCategory === item.id ? '#fff' : '#6B7280'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// Mock data for demo/fallback
function getMockMessages(category: string): Message[] {
  const allMessages: Message[] = [
    {
      id: '1',
      from: 'bookings@irctc.co.in',
      fromName: 'IRCTC',
      subject: 'Your train ticket is confirmed',
      body: 'Booking ID: 2859476103. Train: NDLS-BBS Rajdhani. Date: 15 Jun 2026. Seat: 3A.',
      category: 'travel',
      date: new Date().toISOString(),
      status: 'unread',
      isStarred: true,
    },
    {
      id: '2',
      from: 'orders@swiggy.in',
      fromName: 'Swiggy',
      subject: 'Order delivered! 🍔',
      body: 'Your order from Biryani Blues has been delivered. ₹487 credited to your REZ wallet.',
      category: 'food',
      date: new Date(Date.now() - 3600000).toISOString(),
      status: 'unread',
      isStarred: false,
    },
    {
      id: '3',
      from: 'billing@airtel.in',
      fromName: 'Airtel',
      subject: 'Bill Payment Receipt',
      body: 'Bill ₹599 paid for Airtel Postpaid. Payment ID: AIRT123456. Thank you!',
      category: 'invoice',
      date: new Date(Date.now() - 86400000).toISOString(),
      status: 'read',
      isStarred: false,
    },
    {
      id: '4',
      from: 'noreply@netflix.com',
      fromName: 'Netflix',
      subject: 'Your receipt from Netflix',
      body: '₹649.00 charged for Netflix Standard. Next billing: 25 Jul 2026.',
      category: 'subscription',
      date: new Date(Date.now() - 172800000).toISOString(),
      status: 'read',
      isStarred: true,
    },
  ];

  if (category === 'all') return allMessages;
  return allMessages.filter(m => m.category === category);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#6366F1',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fromName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  subject: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  preview: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 18,
  },
  starButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});
