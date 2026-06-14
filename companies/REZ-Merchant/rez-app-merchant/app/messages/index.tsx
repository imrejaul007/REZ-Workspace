import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { messagingService, MerchantConversation } from '@/services/api/messaging';

type StatusFilter = 'all' | 'active' | 'archived';

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<MerchantConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [unreadTotal, setUnreadTotal] = useState(0);

  const fetchConversations = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1 && !append) setLoading(true);

        const result = await messagingService.getConversations({
          page: pageNum,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search || undefined,
        });

        const items = result.conversations ?? [];
        setConversations((prev) => (append ? [...prev, ...items] : items));
        setHasMore(result.pagination?.current < result.pagination?.pages);
        setUnreadTotal(result.summary?.unreadCount ?? 0);
        setPage(pageNum);
      } catch {
        if (!append) setConversations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, search]
  );

  useEffect(() => {
    fetchConversations(1);
  }, [fetchConversations]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations(1);
  }, [fetchConversations]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchConversations(page + 1, true);
  }, [hasMore, loadingMore, page, fetchConversations]);

  const handleArchive = async (conversationId: string) => {
    try {
      await messagingService.archiveConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
    } catch {
      // silently fail
    }
  };

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
  };

  const renderConversation = useCallback(
    ({ item }: { item: MerchantConversation }) => {
      const customerName = item.customerId?.fullName || item.customerId?.phoneNumber || 'Customer';
      const lastMsg = item.lastMessage?.content || 'No messages yet';
      const isUnread = item.unreadCount > 0;

      return (
        <TouchableOpacity
          style={[styles.conversationItem, isUnread && styles.conversationUnread]}
          onPress={() => router.push(`/messages/${item._id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {customerName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <ThemedText
                style={[styles.customerName, isUnread && styles.textBold]}
                numberOfLines={1}
              >
                {customerName}
              </ThemedText>
              <ThemedText style={styles.timestamp}>
                {item.lastActivityAt ? getTimeAgo(item.lastActivityAt) : ''}
              </ThemedText>
            </View>

            <View style={styles.conversationFooter}>
              <ThemedText
                style={[styles.lastMessage, isUnread && styles.textBold]}
                numberOfLines={1}
              >
                {item.lastMessage?.senderType === 'store' ? 'You: ' : ''}
                {lastMsg}
              </ThemedText>
              {isUnread && (
                <View style={styles.unreadBadge}>
                  <ThemedText style={styles.unreadCount}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [getTimeAgo, handleArchive]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={64} color={Colors.light.textSecondary} />
        <ThemedText style={styles.emptyTitle}>No Conversations</ThemedText>
        <ThemedText style={styles.emptyText}>
          Customer messages will appear here when they contact your store.
        </ThemedText>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Messages</ThemedText>
        {unreadTotal > 0 && (
          <View style={styles.headerBadge}>
            <ThemedText style={styles.headerBadgeText}>{unreadTotal}</ThemedText>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.light.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'archived'] as StatusFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}
            onPress={() => setStatusFilter(f)}
          >
            <ThemedText style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversation List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.light.primary}
                style={{ padding: 16 }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  backButton: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  conversationUnread: {
    backgroundColor: '#F0F7FF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 15,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  textBold: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  unreadBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
});
