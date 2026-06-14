import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Pressable,
  Text,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert, showConfirm } from '@/utils/alert';
import Animated, {
  FadeInDown,
  FadeInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Badge,
  Button,
} from '@/components/ui/DesignSystemComponents';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { storeVisitsService } from '@/services/api/storeVisits';
import type { StoreVisit, StoreVisitStats } from '@/services/api/storeVisits';

const { width } = Dimensions.get('window');

type VisitStatusFilter = 'all' | 'pending' | 'checked_in' | 'completed' | 'cancelled';

const visitStatusColors: Record<string, string> = {
  pending: '#10B981',
  checked_in: '#3B82F6',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

const visitStatusLabels: Record<string, string> = {
  pending: 'Pending',
  checked_in: 'Checked In',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

interface StatusTabProps {
  status: VisitStatusFilter;
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}

const StatusTab = ({ status, label, count, active, onPress }: StatusTabProps) => (
  <Pressable
    style={[
      styles.statusTab,
      active && styles.activeStatusTab,
      active && {
        backgroundColor:
          status === 'all' ? Colors.primary[500] : visitStatusColors[status] || Colors.primary[500],
        borderColor: 'transparent',
      },
    ]}
    onPress={onPress}
  >
    <BodyText style={[styles.statusTabText, active && styles.activeStatusTabText]}>
      {label}
    </BodyText>
    <View style={[styles.statusCount, active && styles.activeStatusCount]}>
      <Caption style={[styles.statusCountText, active && styles.activeStatusCountText]}>
        {count}
      </Caption>
    </View>
  </Pressable>
);

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  gradientColors: [string, string];
  index: number;
}

const StatCard = ({ title, value, icon, gradientColors, index }: StatCardProps) => (
  <Animated.View entering={FadeInDown.delay(index * 80).springify()} style={styles.statCardWrapper}>
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCardGradient}
    >
      <View style={styles.statCardIconBg}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color="#fff" />
      </View>
      <Heading2 style={styles.statCardValue}>{value}</Heading2>
      <Caption style={styles.statCardTitle}>{title}</Caption>
    </LinearGradient>
  </Animated.View>
);

interface VisitCardProps {
  visit: StoreVisit;
  onCheckIn: (visitId: string) => void;
  onComplete: (visitId: string) => void;
  onCancel: (visitId: string) => void;
  index: number;
}

const VisitCard = ({ visit, onCheckIn, onComplete, onCancel, index }: VisitCardProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const visitId = visit._id || visit.id || '';
  const statusColor = visitStatusColors[visit.status] || Colors.gray[500];

  const customerName = useMemo(() => {
    if (visit.customerName) return visit.customerName;
    if (visit.userId?.name) return visit.userId.name;
    return 'Unknown Customer';
  }, [visit.customerName, visit.userId]);

  const customerPhone = visit.customerPhone || visit.userId?.phoneNumber || 'No phone';

  const formatDateTime = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      const dateFormatted = date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      if (timeStr) return `${dateFormatted} at ${timeStr}`;
      return dateFormatted;
    } catch {
      return dateStr;
    }
  };

  const handleCallCustomer = () => {
    if (customerPhone && customerPhone !== 'No phone') {
      const phoneUrl = `tel:${customerPhone}`;
      Linking.openURL(phoneUrl).catch((err) => {
        logger.error('Failed to open phone dialer:', err);
      });
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.visitCardContainer, pressed && styles.pressedCard]}
      >
        <Card style={styles.visitCard} padding="md">
          {/* Header with status gradient */}
          <View style={[styles.visitCardHeader, { backgroundColor: `${statusColor}12` }]}>
            {/* Customer Info Row */}
            <View style={styles.customerRow}>
              <Animated.View
                entering={ZoomIn.delay(100)}
                style={[styles.customerAvatar, { backgroundColor: `${statusColor}20` }]}
              >
                <Heading3 style={[styles.customerInitial, { color: statusColor }]}>
                  {customerName.charAt(0).toUpperCase()}
                </Heading3>
              </Animated.View>
              <View style={styles.customerDetails}>
                <BodyText style={styles.customerName}>{customerName}</BodyText>
                <TouchableOpacity
                  onPress={handleCallCustomer}
                  style={styles.phoneRow}
                  activeOpacity={0.7}
                  disabled={customerPhone === 'No phone'}
                >
                  <Ionicons
                    name="call-outline"
                    size={12}
                    color={
                      customerPhone !== 'No phone' ? Colors.primary[500] : Colors.text.secondary
                    }
                  />
                  <Caption
                    style={[
                      styles.customerPhone,
                      customerPhone !== 'No phone' && styles.customerPhoneLink,
                    ]}
                  >
                    {customerPhone}
                  </Caption>
                </TouchableOpacity>
              </View>

              {/* Status Badge */}
              <View style={[styles.visitStatusBadge, { backgroundColor: `${statusColor}18` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <BodyText style={[styles.visitStatusText, { color: statusColor }]}>
                  {visitStatusLabels[visit.status] || visit.status}
                </BodyText>
              </View>
            </View>
          </View>

          {/* Visit Type Badge & Details */}
          <View style={styles.visitDetailsRow}>
            {visit.visitType === 'scheduled' ? (
              <View style={[styles.visitTypeBadge, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="calendar" size={14} color="#9333EA" />
                <BodyText style={[styles.visitTypeText, { color: '#9333EA' }]}>Scheduled</BodyText>
              </View>
            ) : (
              <View style={[styles.visitTypeBadge, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="people" size={14} color="#EA580C" />
                <BodyText style={[styles.visitTypeText, { color: '#EA580C' }]}>Walk-in</BodyText>
              </View>
            )}

            {visit.paymentMethod === 'pay_at_store' && (
              <View style={[styles.paymentBadge, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="cash-outline" size={12} color="#2563EB" />
                <Caption
                  style={{ color: '#2563EB', fontSize: 10, fontWeight: '600', marginLeft: 3 }}
                >
                  Pay at Store
                </Caption>
              </View>
            )}
          </View>

          {/* Date/Time & Queue Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={Colors.text.secondary} />
              <Caption style={styles.infoText}>
                {formatDateTime(visit.visitDate, visit.visitTime)}
              </Caption>
            </View>
            {visit.visitType === 'queue' && visit.queueNumber !== undefined && (
              <View style={styles.queueBadge}>
                <Caption style={styles.queueLabel}>Queue</Caption>
                <BodyText style={styles.queueNumber}>#{visit.queueNumber}</BodyText>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {visit.status === 'pending' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.checkInButton]}
                  onPress={() => onCheckIn(visitId)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-in-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Check In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => onCancel(visitId)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={16} color={Colors.error[500]} />
                  <Text style={[styles.actionButtonText, { color: Colors.error[500] }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {visit.status === 'checked_in' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => onComplete(visitId)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => onCancel(visitId)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
};

export default function VisitsScreen() {
  const { state } = useAuth();
  const { activeStore } = useStore();
  const [visits, setVisits] = useState<StoreVisit[]>([]);
  const [stats, setStats] = useState<StoreVisitStats>({
    totalToday: 0,
    upcoming: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<VisitStatusFilter>('all');

  const storeId = activeStore?._id || '';

  const statusCounts = useMemo(() => {
    const counts: Record<VisitStatusFilter, number> = {
      all: visits.length,
      pending: 0,
      checked_in: 0,
      completed: 0,
      cancelled: 0,
    };

    visits.forEach((visit) => {
      if (counts[visit.status as VisitStatusFilter] !== undefined) {
        counts[visit.status as VisitStatusFilter]++;
      }
    });

    return counts;
  }, [visits]);

  const filteredVisits = useMemo(() => {
    if (activeFilter === 'all') return visits;
    return visits.filter((visit) => visit.status === activeFilter);
  }, [visits, activeFilter]);

  const fetchVisits = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    try {
      const result = await storeVisitsService.getVisits({
        storeId,
        date: new Date().toISOString().split('T')[0],
        limit: 100,
        page: 1,
      });

      const mappedVisits: StoreVisit[] = (result.visits || []).map((v) => ({
        _id: v._id || v.id,
        id: v._id || v.id,
        storeId: v.storeId?._id || v.storeId || '',
        userId: v.userId
          ? {
              _id: v.userId._id || v.userId,
              name: v.userId.name,
              phoneNumber: v.userId.phoneNumber,
              email: v.userId.email,
            }
          : undefined,
        visitType: v.visitType || 'scheduled',
        status: v.status || 'pending',
        visitDate: v.visitDate || v.createdAt,
        visitTime: v.visitTime,
        customerName: v.customerName || v.userId?.name || 'Unknown Customer',
        customerPhone: v.customerPhone || v.userId?.phoneNumber || '',
        customerEmail: v.customerEmail || v.userId?.email,
        queueNumber: v.queueNumber,
        paymentMethod: v.paymentMethod,
        createdAt: v.createdAt || '',
        updatedAt: v.updatedAt || '',
      }));

      setVisits(mappedVisits);
    } catch (error) {
      logger.error('Error fetching visits:', error);
      const errorMessage = error.message || 'Failed to fetch visits. Please try again.';
      showAlert('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  const fetchStats = useCallback(async () => {
    if (!storeId) return;
    try {
      const result = await storeVisitsService.getVisitStats(storeId);
      setStats(result);
    } catch (error) {
      logger.error('Error fetching visit stats:', error);
      // Use fallback stats from the local data
      setStats({
        totalToday: visits.length,
        upcoming: visits.filter((v) => v.status === 'pending').length,
        checkedIn: visits.filter((v) => v.status === 'checked_in').length,
        completed: visits.filter((v) => v.status === 'completed').length,
        cancelled: visits.filter((v) => v.status === 'cancelled').length,
      });
    }
  }, [storeId, visits]);

  const handleCheckIn = useCallback(
    async (visitId: string) => {
      try {
        await storeVisitsService.updateVisitStatus(visitId, 'checked_in');
        showAlert('Success', 'Visit checked in successfully');
        await fetchVisits();
        await fetchStats();
      } catch (error) {
        logger.error('Error checking in visit:', error);
        const msg = error.message || 'Failed to check in visit.';
        showAlert('Error', msg);
      }
    },
    [fetchVisits, fetchStats]
  );

  const handleComplete = useCallback(
    async (visitId: string) => {
      try {
        await storeVisitsService.updateVisitStatus(visitId, 'completed');
        showAlert('Success', 'Visit completed successfully');
        await fetchVisits();
        await fetchStats();
      } catch (error) {
        logger.error('Error completing visit:', error);
        const msg = error.message || 'Failed to complete visit.';
        showAlert('Error', msg);
      }
    },
    [fetchVisits, fetchStats]
  );

  const handleCancel = useCallback(
    async (visitId: string) => {
      const doCancel = async () => {
        try {
          await storeVisitsService.updateVisitStatus(visitId, 'cancelled');
          showAlert('Success', 'Visit cancelled');
          await fetchVisits();
          await fetchStats();
        } catch (error) {
          logger.error('Error cancelling visit:', error);
          const msg = error.message || 'Failed to cancel visit.';
          showAlert('Error', msg);
        }
      };

      showConfirm('Confirm', 'Are you sure you want to cancel this visit?', doCancel);
    },
    [fetchVisits, fetchStats]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchVisits(), fetchStats()]);
    } catch (error) {
      logger.error('Error refreshing visits:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchVisits, fetchStats]);

  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, [fetchVisits, fetchStats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <BodyText>Loading visits...</BodyText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Heading2 style={styles.headerTitle}>Store Visits</Heading2>
          <Caption style={styles.headerSubtitle}>
            {`${filteredVisits.length} ${filteredVisits.length === 1 ? 'visit' : 'visits'} total`}
          </Caption>
        </View>
      </Animated.View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
        >
          <StatCard
            title="Today"
            value={stats.totalToday}
            icon="today"
            gradientColors={['#9333EA', '#7C3AED']}
            index={0}
          />
          <StatCard
            title="Upcoming"
            value={stats.upcoming}
            icon="time-outline"
            gradientColors={['#10B981', '#059669']}
            index={1}
          />
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon="log-in-outline"
            gradientColors={['#3B82F6', '#2563EB']}
            index={2}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon="checkmark-circle-outline"
            gradientColors={['#6B7280', '#4B5563']}
            index={3}
          />
        </ScrollView>
      </View>

      {/* Status Filter Tabs */}
      <View style={{ height: 60 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusTabs}
          contentContainerStyle={styles.statusTabsContent}
        >
          <StatusTab
            status="all"
            label="All"
            count={statusCounts.all}
            active={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <StatusTab
            status="pending"
            label="Pending"
            count={statusCounts.pending}
            active={activeFilter === 'pending'}
            onPress={() => setActiveFilter('pending')}
          />
          <StatusTab
            status="checked_in"
            label="Checked In"
            count={statusCounts.checked_in}
            active={activeFilter === 'checked_in'}
            onPress={() => setActiveFilter('checked_in')}
          />
          <StatusTab
            status="completed"
            label="Completed"
            count={statusCounts.completed}
            active={activeFilter === 'completed'}
            onPress={() => setActiveFilter('completed')}
          />
          <StatusTab
            status="cancelled"
            label="Cancelled"
            count={statusCounts.cancelled}
            active={activeFilter === 'cancelled'}
            onPress={() => setActiveFilter('cancelled')}
          />
        </ScrollView>
      </View>

      {/* Visit Cards List */}
      <FlatList
        data={filteredVisits}
        renderItem={({ item, index }) => (
          <VisitCard
            visit={item}
            index={index}
            onCheckIn={handleCheckIn}
            onComplete={handleComplete}
            onCancel={handleCancel}
          />
        )}
        keyExtractor={(item) => item._id || item.id || `visit-${item.createdAt}`}
        contentContainerStyle={styles.visitsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.gray[300]} />
            <Heading3 style={styles.emptyStateTitle}>No Visits Found</Heading3>
            <BodyText style={styles.emptyStateSubtitle}>
              {activeFilter === 'all'
                ? "You don't have unknown store visits yet"
                : `No ${visitStatusLabels[activeFilter]?.toLowerCase()} visits`}
            </BodyText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 28,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },

  // Stats Row
  statsRow: {
    paddingVertical: Spacing.sm,
  },
  statsScrollContent: {
    paddingHorizontal: Spacing.base,
    gap: 10,
  },
  statCardWrapper: {
    width: (width - Spacing.base * 2 - 30) / 4,
    minWidth: 85,
  },
  statCardGradient: {
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  statCardIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statCardValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  statCardTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Status Tabs
  statusTabs: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  statusTabsContent: {
    gap: 8,
    paddingRight: Spacing.base,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.background.primary,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    gap: 8,
    shadowColor: Colors.gray[300],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeStatusTab: {},
  statusTabText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  activeStatusTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusCount: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeStatusCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  activeStatusCountText: {
    color: '#FFFFFF',
  },

  // Visit List
  visitsList: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: 80,
  },

  // Visit Card
  visitCardContainer: {
    marginBottom: Spacing.md,
  },
  pressedCard: {
    opacity: 0.9,
  },
  visitCard: {
    gap: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background.primary,
    ...Shadows.md,
  },
  visitCardHeader: {
    padding: Spacing.md,
    margin: -Spacing.md,
    marginBottom: Spacing.sm,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[100],
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  customerDetails: {
    flex: 1,
    gap: 3,
  },
  customerName: {
    fontWeight: '700',
    fontSize: 15,
    color: Colors.text.primary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerPhone: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  customerPhoneLink: {
    color: Colors.primary[500],
    textDecorationLine: 'underline',
  },
  visitStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  visitStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Visit Details
  visitDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  visitTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 5,
  },
  visitTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueLabel: {
    color: Colors.text.secondary,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  queueNumber: {
    color: Colors.primary[700],
    fontSize: 14,
    fontWeight: '800',
  },

  // Notes
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  notesText: {
    flex: 1,
    color: Colors.text.tertiary,
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  checkInButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.error[500],
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateTitle: {
    color: Colors.text.primary,
  },
  emptyStateSubtitle: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
