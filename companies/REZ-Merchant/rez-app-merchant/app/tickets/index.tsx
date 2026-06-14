import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  merchantSupportService,
  MerchantTicket,
  MerchantTicketStats,
} from '@/services/api/support';
import { Colors } from '@/constants/Colors';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'waiting_customer', label: 'Waiting' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#DBEAFE', text: '#2563EB' },
  in_progress: { bg: Colors.light.warningLight, text: Colors.light.warning },
  waiting_customer: { bg: '#EDE9FE', text: '#7C3AED' },
  resolved: { bg: Colors.light.successLight, text: Colors.light.success },
  closed: { bg: '#F3F4F6', text: '#6B7280' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  medium: '#2563EB',
  high: Colors.light.warning,
  urgent: Colors.light.error,
};

const PRIORITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  low: 'remove-circle-outline',
  medium: 'alert-circle-outline',
  high: 'warning-outline',
  urgent: 'flame-outline',
};

export default function MerchantTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<MerchantTicket[]>([]);
  const [stats, setStats] = useState<MerchantTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Detail / reply
  const [selectedTicket, setSelectedTicket] = useState<MerchantTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  const LIMIT = 20;

  const loadTickets = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (!append) setLoading(true);
        const result = await merchantSupportService.listTickets({
          page: pageNum,
          limit: LIMIT,
          status: activeTab !== 'all' ? activeTab : undefined,
        });
        if (append) {
          setTickets((prev) => [...prev, ...result.tickets]);
        } else {
          setTickets(result.tickets);
        }
        setPage(pageNum);
        setHasMore(pageNum < result.pagination.pages);
      } catch (error) {
        logger.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  const loadStats = useCallback(async () => {
    const result = await merchantSupportService.getStatistics();
    if (result) setStats(result);
  }, []);

  useEffect(() => {
    setPage(1);
    loadTickets(1);
  }, [activeTab, loadTickets]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTickets(1);
    loadStats();
  }, [loadTickets, loadStats]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadTickets(page + 1, true);
    }
  }, [loadingMore, hasMore, loading, page, loadTickets]);

  const handleTicketPress = async (ticket: MerchantTicket) => {
    setDetailLoading(true);
    setSelectedTicket(ticket);
    const full = await merchantSupportService.getTicket(ticket._id);
    if (full) setSelectedTicket(full);
    setDetailLoading(false);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setReplySending(true);
    const success = await merchantSupportService.replyToTicket(
      selectedTicket._id,
      replyText.trim()
    );
    if (success) {
      setReplyText('');
      // Reload ticket detail
      const full = await merchantSupportService.getTicket(selectedTicket._id);
      if (full) setSelectedTicket(full);
      loadTickets(1);
    }
    setReplySending(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatsHeader = useCallback(() => {
    if (!stats) return null;
    return (
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.openCount}</Text>
          <Text style={[styles.statLabel, { color: '#2563EB' }]}>Open</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.light.warningLight }]}>
          <Text style={[styles.statValue, { color: Colors.light.warning }]}>
            {stats.inProgressCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.light.warning }]}>In Progress</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.light.successLight }]}>
          <Text style={[styles.statValue, { color: Colors.light.success }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: Colors.light.success }]}>Total</Text>
        </View>
      </View>
    );
  }, [stats]);

  const renderTicketItem = useCallback(({ item }: { item: MerchantTicket }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.closed;
    const priorityColor = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
    const priorityIcon = PRIORITY_ICONS[item.priority] || PRIORITY_ICONS.medium;
    const unreadCount = item.messages.filter((m) => m.senderType === 'user' && !m.isRead).length;

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => handleTicketPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>
        </View>

        <Text style={styles.ticketSubject} numberOfLines={2}>
          {item.subject}
        </Text>

        <View style={styles.ticketMeta}>
          <View style={styles.ticketMetaItem}>
            <Ionicons name="person-outline" size={14} color="#6B7280" />
            <Text style={styles.ticketMetaText}>{item.user?.fullName || 'Customer'}</Text>
          </View>
          <View style={styles.ticketMetaItem}>
            <Ionicons name={priorityIcon} size={14} color={priorityColor} />
            <Text style={[styles.ticketMetaText, { color: priorityColor }]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>
          <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount} new</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, []);

  const renderDetailModal = () => {
    if (!selectedTicket) return null;
    const statusColor = STATUS_COLORS[selectedTicket.status] || STATUS_COLORS.closed;

    return (
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <SafeAreaView style={styles.detailContainer}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedTicket(null)} style={styles.detailBackBtn}>
              <Ionicons name="arrow-back" size={22} color="#111" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>{selectedTicket.ticketNumber}</Text>
              <Text style={styles.detailSubject} numberOfLines={1}>
                {selectedTicket.subject}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {selectedTicket.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* Messages */}
          {detailLoading ? (
            <View style={styles.detailLoading}>
              <ActivityIndicator size="large" color={Colors.light.tint} />
            </View>
          ) : (
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.ticketInfo}>
                <Text style={styles.infoLabel}>
                  Customer:{' '}
                  <Text style={styles.infoValue}>{selectedTicket.user?.fullName || 'N/A'}</Text>
                </Text>
                <Text style={styles.infoLabel}>
                  Category: <Text style={styles.infoValue}>{selectedTicket.category}</Text>
                </Text>
                <Text style={styles.infoLabel}>
                  Priority: <Text style={styles.infoValue}>{selectedTicket.priority}</Text>
                </Text>
                <Text style={styles.infoLabel}>
                  Created:{' '}
                  <Text style={styles.infoValue}>{formatDate(selectedTicket.createdAt)}</Text>
                </Text>
              </View>

              {selectedTicket.messages.map((msg, idx) => {
                const isAgent = msg.senderType === 'agent' || msg.senderType === 'system';
                return (
                  <View
                    key={idx}
                    style={[styles.messageBubble, isAgent ? styles.agentBubble : styles.userBubble]}
                  >
                    <Text
                      style={[styles.messageText, isAgent ? styles.agentText : styles.userText]}
                    >
                      {msg.message}
                    </Text>
                    <Text
                      style={[styles.messageTime, isAgent && { color: 'rgba(255,255,255,0.7)' }]}
                    >
                      {msg.senderType === 'user' ? 'Customer' : 'You'} · {formatDate(msg.timestamp)}
                    </Text>
                  </View>
                );
              })}

              {selectedTicket.resolution && (
                <View style={styles.resolutionBox}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
                  <Text style={styles.resolutionText}>Resolution: {selectedTicket.resolution}</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Reply Input */}
          {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
            <View style={styles.replyContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply..."
                placeholderTextColor="#9CA3AF"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.replyBtn, { opacity: replyText.trim() && !replySending ? 1 : 0.5 }]}
                onPress={handleReply}
                disabled={!replyText.trim() || replySending}
              >
                {replySending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Tickets</Text>
      </View>

      {renderStatsHeader()}

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ticket List */}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item._id}
        renderItem={renderTicketItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.tint}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptySubtitle}>
                Customer support tickets related to your stores will appear here
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.light.tint} />
            </View>
          ) : null
        }
      />

      {loading && tickets.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  tabsContainer: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContent: { paddingHorizontal: 12, alignItems: 'center', gap: 6 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: { backgroundColor: Colors.light.tint },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 100 },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketNumber: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },
  ticketSubject: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 8 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketMetaText: { fontSize: 12, color: '#6B7280' },
  ticketDate: { fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.light.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },

  // Detail modal
  detailContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  detailBackBtn: { marginRight: 4 },
  detailTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  detailSubject: { fontSize: 15, fontWeight: '600', color: '#111' },
  detailLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  ticketInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  infoValue: { fontWeight: '600', color: '#111' },

  messagesContainer: { flex: 1 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
  },
  userBubble: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6' },
  agentBubble: { alignSelf: 'flex-end', backgroundColor: Colors.light.tint },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#111' },
  agentText: { color: '#fff' },
  messageTime: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },

  resolutionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.light.successLight,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },
  resolutionText: { fontSize: 13, color: Colors.light.success, flex: 1 },

  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#111',
  },
  replyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
