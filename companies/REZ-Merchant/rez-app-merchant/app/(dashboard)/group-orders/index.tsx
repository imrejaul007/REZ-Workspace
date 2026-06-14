/**
 * Group Orders Dashboard
 *
 * Shows active group ordering sessions for the merchant
 * Allows monitoring and managing group orders in real-time
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants/DesignTokens';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

interface GroupMember {
  id: string;
  name: string;
  isHost: boolean;
  items: unknown[];
  totalAmount: number;
}

interface GroupSession {
  id: string;
  code: string;
  storeSlug: string;
  storeName: string;
  hostId: string;
  members: GroupMember[];
  items: unknown[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  totalAmount: number;
  tableNumber?: string;
}

const formatINR = (amount: number): string => {
  return `₹${(amount / 100).toFixed(2)}`;
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatElapsed = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m ago`;
};

export default function GroupOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();
  const { token } = useAuth();

  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch group sessions
  const fetchSessions = useCallback(async () => {
    if (!activeStore?.id) return;

    try {
      const response = await apiClient.get(`/group-orders/store/${activeStore.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      logger.error('[GroupOrders] Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeStore?.id, token]);

  useEffect(() => {
    fetchSessions();

    // Poll every 30 seconds for updates
    const pollInterval = setInterval(fetchSessions, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchSessions]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return session.status === 'active';
    if (selectedFilter === 'completed') return session.status === 'completed';
    return true;
  });

  // Get stats
  const stats = {
    total: sessions.length,
    active: sessions.filter((s) => s.status === 'active').length,
    totalAmount: sessions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + s.totalAmount, 0),
    members: sessions.reduce((sum, s) => sum + s.members.length, 0),
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading group orders...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Group Orders</Text>
          <Text style={styles.headerSubtitle}>{activeStore?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.soundButton}
          onPress={() => setSoundEnabled(!soundEnabled)}
        >
          <Ionicons
            name={soundEnabled ? 'volume-high' : 'volume-mute'}
            size={24}
            color={Colors.primary[500]}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatINR(stats.totalAmount)}</Text>
          <Text style={styles.statLabel}>Total Value</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.members}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'active', 'completed'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sessions list */}
      <ScrollView
        style={styles.sessionsList}
        contentContainerStyle={styles.sessionsListContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No group orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Group orders will appear here when customers start ordering together
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() => router.push(`/group-orders/${session.id}`)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Session Card Component
function SessionCard({
  session,
  onPress,
}: {
  session: GroupSession;
  onPress: () => void;
}) {
  const statusColors = {
    active: Colors.success[500],
    completed: Colors.gray[500],
    cancelled: Colors.error[500],
  };

  return (
    <TouchableOpacity style={styles.sessionCard} onPress={onPress}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionCodeContainer}>
          <Text style={styles.sessionCode}>{session.code}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[session.status] }]}>
            <Text style={styles.statusText}>{session.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.sessionTime}>{formatElapsed(session.createdAt)}</Text>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.sessionDetail}>
          <Ionicons name="people" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{session.members.length} members</Text>
        </View>
        <View style={styles.sessionDetail}>
          <Ionicons name="restaurant" size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{session.items.length} items</Text>
        </View>
        {session.tableNumber && (
          <View style={styles.sessionDetail}>
            <Ionicons name="table" size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>Table {session.tableNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.sessionFooter}>
        <View>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatINR(session.totalAmount)}</Text>
        </View>
        <View style={styles.membersPreview}>
          {session.members.slice(0, 3).map((member, index) => (
            <View key={member.id} style={[styles.memberAvatar, { marginLeft: index > 0 ? -10 : 0 }]}>
              <Text style={styles.memberInitial}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {session.members.length > 3 && (
            <View style={[styles.memberAvatar, styles.memberMore, { marginLeft: -10 }]}>
              <Text style={styles.memberMoreText}>+{session.members.length - 3}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.sessionAction}>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  soundButton: {
    marginLeft: 'auto',
    padding: Spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterTabActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterTabTextActive: {
    color: Colors.text.inverse,
  },
  sessionsList: {
    flex: 1,
  },
  sessionsListContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  sessionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sessionCode: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  sessionTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  membersPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[100] ?? Colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  memberInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  memberMore: {
    backgroundColor: Colors.gray[200],
  },
  memberMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  sessionAction: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
  },
});
