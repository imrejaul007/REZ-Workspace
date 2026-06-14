/**
 * Salon Dashboard - Main entry point for salon management
 *
 * Features:
 * - Today's schedule overview
 * - Upcoming appointments
 * - Quick actions (walk-in check-in, block time)
 * - Earnings summary
 * - Push notifications for new bookings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from './components/BookingCard';
import { EarningsChart } from './components/EarningsChart';
import { salonService, SalonBooking, SalonStats } from '@/services/api/salon';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444',
  no_show: '#DC2626',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.light.danger,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statChange: {
    fontSize: 11,
    marginTop: 2,
  },
  positiveChange: {
    color: Colors.light.success,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  walkinBtn: {
    backgroundColor: Colors.light.primary,
  },
  blockTimeBtn: {
    backgroundColor: Colors.light.warning,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  earningsPeriod: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

export default function SalonDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SalonStats | null>(null);
  const [todayBookings, setTodayBookings] = useState<SalonBooking[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<SalonBooking[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId ||
    (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  const fetchDashboardData = useCallback(async () => {
    if (!storeId) return;

    try {
      const [statsData, todayData, upcomingData, notificationsData] = await Promise.all([
        salonService.getStats(storeId),
        salonService.getTodayBookings(storeId),
        salonService.getUpcomingBookings(storeId, { limit: 5 }),
        salonService.getNewBookingNotifications(storeId),
      ]);

      setStats(statsData);
      setTodayBookings(todayData);
      setUpcomingBookings(upcomingData);
      setNotificationCount(notificationsData.count);
    } catch (error) {
      console.error('Error fetching salon dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Poll for new booking notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (storeId) {
        try {
          const notifications = await salonService.getNewBookingNotifications(storeId);
          setNotificationCount(notifications.count);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [storeId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleWalkinCheckin = useCallback(() => {
    router.push('/salon/walkin-checkin');
  }, []);

  const handleBlockTime = useCallback(() => {
    router.push('/salon/block-time');
  }, []);

  const handleBookingPress = useCallback((bookingId: string) => {
    router.push(`/salon/booking/${bookingId}`);
  }, []);

  const handleBookingAction = useCallback(async (bookingId: string, action: string) => {
    try {
      switch (action) {
        case 'confirm':
          await salonService.updateBookingStatus(bookingId, 'confirmed');
          break;
        case 'start':
          await salonService.updateBookingStatus(bookingId, 'in_progress');
          break;
        case 'complete':
          await salonService.updateBookingStatus(bookingId, 'completed');
          break;
        case 'cancel':
          await salonService.updateBookingStatus(bookingId, 'cancelled');
          break;
      }
      fetchDashboardData();
    } catch (error) {
      console.error(`Error performing ${action} on booking:`, error);
    }
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <ThemedText style={styles.headerTitle}>Salon</ThemedText>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => router.push('/salon/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={Colors.light.text} />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <ThemedText style={styles.notificationCount}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Today's Bookings</ThemedText>
            <ThemedText style={styles.statValue}>{stats?.todayBookings || 0}</ThemedText>
            <ThemedText style={[styles.statChange, styles.positiveChange]}>
              {stats?.completedToday || 0} completed
            </ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>This Week</ThemedText>
            <ThemedText style={styles.statValue}>{stats?.weekBookings || 0}</ThemedText>
            <ThemedText style={[styles.statChange, styles.positiveChange]}>
              {stats?.revenueThisWeek || 0} revenue
            </ThemedText>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.walkinBtn]}
              onPress={handleWalkinCheckin}
            >
              <Ionicons name="person-add-outline" size={20} color="#fff" />
              <ThemedText style={styles.quickActionText}>Walk-in Check-in</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.blockTimeBtn]}
              onPress={handleBlockTime}
            >
              <Ionicons name="ban-outline" size={20} color="#fff" />
              <ThemedText style={styles.quickActionText}>Block Time</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Today's Schedule</ThemedText>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/salon/schedule')}
            >
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {todayBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {todayBookings.slice(0, 5).map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onPress={() => handleBookingPress(booking._id)}
                  onAction={(action) => handleBookingAction(booking._id, action)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No bookings today</ThemedText>
              <ThemedText style={styles.emptyText}>
                Your schedule is clear. Add a walk-in or wait for online bookings.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Earnings Overview */}
        {stats?.earnings && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Earnings</ThemedText>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => router.push('/salon/earnings')}
              >
                <ThemedText style={styles.seeAllText}>Details</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            <EarningsChart data={stats.earnings} />
          </View>
        )}

        {/* Upcoming Appointments */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Upcoming</ThemedText>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push('/salon/schedule?filter=upcoming')}
            >
              <ThemedText style={styles.seeAllText}>View All</ThemedText>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>

          {upcomingBookings.length > 0 ? (
            <View style={styles.bookingsList}>
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onPress={() => handleBookingPress(booking._id)}
                  onAction={(action) => handleBookingAction(booking._id, action)}
                  compact
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No upcoming bookings</ThemedText>
              <ThemedText style={styles.emptyText}>
                Share your booking link to get more appointments.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
