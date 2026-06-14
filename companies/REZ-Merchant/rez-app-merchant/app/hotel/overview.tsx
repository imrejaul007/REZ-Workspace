/**
 * Hotel Overview Screen
 * Hotel operations dashboard with key metrics
 * API: GET /api/merchant/hotel/overview
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';
import { merchantHotelApi, HotelOverview } from '@/lib/api';

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30000;

// Types
interface OccupancyData {
  totalRooms: number;
  occupied: number;
  available: number;
  maintenance: number;
  pendingCheckOut: number;
}

interface TodayData {
  checkIns: number;
  checkOuts: number;
  arrivals: Array<{
    id: string;
    guestName: string;
    room: string;
    time?: string;
  }>;
  departures: Array<{
    id: string;
    guestName: string;
    room: string;
  }>;
}

interface HousekeepingStatus {
  pending: number;
  inProgress: number;
  completed: number;
  rooms: Array<{
    roomNumber: string;
    status: 'dirty' | 'clean' | 'in_progress';
    task?: string;
  }>;
}

interface PendingTask {
  id: string;
  type: string;
  room: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  time?: string;
}

// Default data when API is unavailable
const defaultOccupancy: OccupancyData = {
  totalRooms: 0,
  occupied: 0,
  available: 0,
  maintenance: 0,
  pendingCheckOut: 0,
};

const defaultToday: TodayData = {
  checkIns: 0,
  checkOuts: 0,
  arrivals: [],
  departures: [],
};

const defaultHousekeeping: HousekeepingStatus = {
  pending: 0,
  inProgress: 0,
  completed: 0,
  rooms: [],
};

const defaultPendingTasks: PendingTask[] = [];

const { width } = Dimensions.get('window');

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    urgent: Colors.light.danger,
    high: Colors.light.warning,
    medium: Colors.light.info,
    low: Colors.light.textMuted,
  };
  return colors[priority] || Colors.light.textMuted;
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
    <Card variant="elevated" padding="md" style={styles.metricCard}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </Card>
  </TouchableOpacity>
);

export default function HotelOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [overviewData, setOverviewData] = useState<HotelOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract data from overview or use defaults
  const occupancy = overviewData?.occupancy || defaultOccupancy;
  const today = overviewData?.today || defaultToday;
  const housekeeping = overviewData?.housekeeping || defaultHousekeeping;
  const pendingTasks = overviewData?.pendingTasks || defaultPendingTasks;

  const occupancyRate = occupancy.totalRooms > 0
    ? Math.round((occupancy.occupied / occupancy.totalRooms) * 100)
    : 0;

  // Fetch hotel overview data
  const fetchOverview = useCallback(async (isRefresh = false) => {
    if (!activeStore?._id) return;

    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await merchantHotelApi.getOverview(activeStore._id);
      setOverviewData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load hotel data';
      console.error('[HotelOverview] fetchOverview error:', message);
      setError(message);
      // Keep existing data if available, otherwise show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOverview(true);
  }, [fetchOverview]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchOverview();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchOverview();
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchOverview]);

  const renderOccupancyOverview = () => {
    const roomData = [
      { label: 'Occupied', value: occupancy.occupied, color: Colors.light.success, bgColor: Colors.light.successLight },
      { label: 'Available', value: occupancy.available, color: Colors.light.info, bgColor: Colors.light.infoLight },
      { label: 'Maintenance', value: occupancy.maintenance, color: Colors.light.textMuted, bgColor: Colors.light.backgroundSecondary },
    ];

    return (
      <Animated.View entering={FadeInDown.delay(100)}>
        <Card variant="elevated" padding="lg" style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <View>
              <Text style={styles.occupancyTitle}>Room Occupancy</Text>
              <Text style={styles.occupancyRate}>{occupancyRate}%</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/hotel/rooms')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {/* Occupancy Bar */}
          <View style={styles.occupancyBar}>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barOccupied,
                  { width: `${(occupancy.occupied / occupancy.totalRooms) * 100}%` },
                ]}
              />
            </View>
          </View>

          {/* Room Stats */}
          <View style={styles.roomStatsGrid}>
            {roomData.map((item) => (
              <View key={item.label} style={styles.roomStat}>
                <View style={[styles.roomStatDot, { backgroundColor: item.color }]} />
                <Text style={styles.roomStatValue}>{item.value}</Text>
                <Text style={styles.roomStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderTodayCheckInsOuts = () => (
    <Animated.View entering={FadeInDown.delay(200)}>
      <View style={styles.checkInOutRow}>
        {/* Check-ins */}
        <Card variant="elevated" padding="md" style={styles.checkCard}>
          <View style={styles.checkHeader}>
            <View style={[styles.checkIconContainer, { backgroundColor: Colors.light.successLight }]}>
              <Ionicons name="arrow-down" size={20} color={Colors.light.success} />
            </View>
            <Text style={styles.checkCount}>{today.checkIns}</Text>
          </View>
          <Text style={styles.checkLabel}>Check-ins</Text>
          <View style={styles.guestList}>
            {today.arrivals.slice(0, 2).map((guest) => (
              <View key={guest.id} style={styles.guestItem}>
                <Text style={styles.guestName} numberOfLines={1}>
                  {guest.guestName}
                </Text>
                <Text style={styles.guestRoom}>Room {guest.room}</Text>
              </View>
            ))}
            {today.arrivals.length > 2 && (
              <Text style={styles.moreGuests}>+{today.arrivals.length - 2} more</Text>
            )}
          </View>
        </Card>

        {/* Check-outs */}
        <Card variant="elevated" padding="md" style={styles.checkCard}>
          <View style={styles.checkHeader}>
            <View style={[styles.checkIconContainer, { backgroundColor: Colors.light.warningLight }]}>
              <Ionicons name="arrow-up" size={20} color={Colors.light.warning} />
            </View>
            <Text style={styles.checkCount}>{today.checkOuts}</Text>
          </View>
          <Text style={styles.checkLabel}>Check-outs</Text>
          <View style={styles.guestList}>
            {today.departures.slice(0, 2).map((guest) => (
              <View key={guest.id} style={styles.guestItem}>
                <Text style={styles.guestName} numberOfLines={1}>
                  {guest.guestName}
                </Text>
                <Text style={styles.guestRoom}>Room {guest.room}</Text>
              </View>
            ))}
            {today.departures.length > 2 && (
              <Text style={styles.moreGuests}>+{today.departures.length - 2} more</Text>
            )}
          </View>
        </Card>
      </View>
    </Animated.View>
  );

  const renderHousekeepingStatus = () => (
    <Animated.View entering={FadeInDown.delay(300)}>
      <Card variant="default" padding="md" style={styles.housekeepingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Housekeeping Status</Text>
          <TouchableOpacity onPress={() => router.push('/hotel/housekeeping')}>
            <Text style={styles.cardLink}>View Tasks</Text>
          </TouchableOpacity>
        </View>

        {/* Status Summary */}
        <View style={styles.housekeepingStats}>
          <View style={styles.housekeepingStat}>
            <Text style={[styles.housekeepingStatValue, { color: Colors.light.warning }]}>
              {housekeeping.pending}
            </Text>
            <Text style={styles.housekeepingStatLabel}>Pending</Text>
          </View>
          <View style={styles.housekeepingStat}>
            <Text style={[styles.housekeepingStatValue, { color: Colors.light.info }]}>
              {housekeeping.inProgress}
            </Text>
            <Text style={styles.housekeepingStatLabel}>In Progress</Text>
          </View>
          <View style={styles.housekeepingStat}>
            <Text style={[styles.housekeepingStatValue, { color: Colors.light.success }]}>
              {housekeeping.completed}
            </Text>
            <Text style={styles.housekeepingStatLabel}>Completed</Text>
          </View>
        </View>

        {/* Room List */}
        <View style={styles.roomListContainer}>
          <Text style={styles.roomListTitle}>Room Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {housekeeping.rooms.map((room) => (
              <View
                key={room.roomNumber}
                style={[
                  styles.roomChip,
                  {
                    backgroundColor:
                      room.status === 'clean'
                        ? Colors.light.successLight
                        : room.status === 'dirty'
                          ? Colors.light.errorLight
                          : Colors.light.infoLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roomChipNumber,
                    {
                      color:
                        room.status === 'clean'
                          ? Colors.light.success
                          : room.status === 'dirty'
                            ? Colors.light.danger
                            : Colors.light.info,
                    },
                  ]}
                >
                  {room.roomNumber}
                </Text>
                <Text style={styles.roomChipStatus}>
                  {room.status === 'clean'
                    ? 'Clean'
                    : room.status === 'dirty'
                      ? 'Dirty'
                      : 'In Progress'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Card>
    </Animated.View>
  );

  const renderPendingTasks = () => (
    <Animated.View entering={FadeInDown.delay(400)}>
      <Card variant="default" padding="md" style={styles.tasksCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Pending Tasks</Text>
          <TouchableOpacity>
            <Text style={styles.cardLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {pendingTasks.map((task) => (
          <TouchableOpacity key={task.id} style={styles.taskItem}>
            <View
              style={[
                styles.taskPriorityDot,
                { backgroundColor: getPriorityColor(task.priority) },
              ]}
            />
            <View style={styles.taskInfo}>
              <Text style={styles.taskType}>{task.type}</Text>
              <Text style={styles.taskRoom}>Room {task.room}</Text>
            </View>
            {task.time && (
              <Text
                style={[styles.taskTime, { color: getPriorityColor(task.priority) }]}
              >
                {task.time}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
          </TouchableOpacity>
        ))}
      </Card>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <Animated.View entering={FadeInDown.delay(500)}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/hotel/housekeeping')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.primaryLight2 }]}>
            <Ionicons name="broom" size={24} color={Colors.light.primary} />
          </View>
          <Text style={styles.quickActionText}>New Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/hotel/channel-manager')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.infoLight }]}>
            <Ionicons name="sync" size={24} color={Colors.light.info} />
          </View>
          <Text style={styles.quickActionText}>Sync Channels</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/hotel/guests')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.successLight }]}>
            <Ionicons name="people" size={24} color={Colors.light.success} />
          </View>
          <Text style={styles.quickActionText}>Guests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/hotel/rooms')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.light.warningLight }]}>
            <Ionicons name="bed" size={24} color={Colors.light.warning} />
          </View>
          <Text style={styles.quickActionText}>Rooms</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.light.primaryLight2, Colors.light.background, Colors.light.background]}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hotel Dashboard</Text>
          <Text style={styles.subtitle}>
            {activeStore?.name || 'Grand Hotel'} - Overview
          </Text>
        </View>
        <View style={styles.headerRight}>
          {error && (
            <TouchableOpacity
              style={styles.errorIndicator}
              onPress={handleRefresh}
            >
              <Ionicons name="warning-outline" size={20} color={Colors.light.danger} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.light.textHeading} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading hotel data...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && !overviewData && (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.light.textMuted} />
          <Text style={styles.errorTitle}>Unable to load data</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
          />
        }
      >
        {/* Key Metrics */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.metricsRow}>
          <MetricCard
            title="Occupancy"
            value={`${occupancyRate}%`}
            icon="bed-outline"
            color={Colors.light.primary}
          />
          <MetricCard
            title="Check-ins"
            value={today.checkIns}
            icon="arrow-down-circle-outline"
            color={Colors.light.success}
          />
          <MetricCard
            title="Check-outs"
            value={today.checkOuts}
            icon="arrow-up-circle-outline"
            color={Colors.light.warning}
          />
        </Animated.View>

        {/* Occupancy Overview */}
        {renderOccupancyOverview()}

        {/* Check-ins / Check-outs */}
        {renderTodayCheckInsOuts()}

        {/* Housekeeping Status */}
        {renderHousekeepingStatus()}

        {/* Pending Tasks */}
        {renderPendingTasks()}

        {/* Quick Actions */}
        {renderQuickActions()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.danger,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorIndicator: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  metricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  metricTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  occupancyCard: {
    marginBottom: 16,
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  occupancyTitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  occupancyRate: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginTop: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  occupancyBar: {
    marginBottom: 16,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barOccupied: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: 4,
  },
  roomStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roomStat: {
    alignItems: 'center',
  },
  roomStatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
  },
  roomStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  roomStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  checkInOutRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  checkCard: {
    flex: 1,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  checkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  checkLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  guestList: {
    gap: 8,
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guestName: {
    fontSize: 13,
    color: Colors.light.textHeading,
    fontWeight: '500',
    flex: 1,
  },
  guestRoom: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginLeft: 8,
  },
  moreGuests: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  housekeepingCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  cardLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  housekeepingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  housekeepingStat: {
    alignItems: 'center',
  },
  housekeepingStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  housekeepingStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  roomListContainer: {
    gap: 8,
  },
  roomListTitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  roomChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  roomChipNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomChipStatus: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  tasksCard: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  taskPriorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskType: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  taskRoom: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  taskTime: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    width: (width - 44) / 2,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
});
