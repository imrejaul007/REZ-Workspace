/**
 * Hotel OS - Main Entry Point
 * Entry screen for hotel operations features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';
import { merchantHotelApi, HotelOverview } from '@/lib/api';

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30000;

interface HotelFeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  badge?: string;
}

const HotelFeatureCard: React.FC<HotelFeatureCardProps> = ({
  title,
  description,
  icon,
  route,
  color,
  badge,
}) => (
  <TouchableOpacity
    style={styles.featureCard}
    onPress={() => router.push(route)}
    activeOpacity={0.8}
  >
    <Card variant="elevated" padding="md" style={styles.cardContent}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.cardTextContainer}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.light.textMuted} />
    </Card>
  </TouchableOpacity>
);

export default function HotelIndexScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [overviewData, setOverviewData] = useState<HotelOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.error('[HotelIndex] fetchOverview error:', message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchOverview();

    const pollingInterval = setInterval(() => {
      fetchOverview();
    }, POLLING_INTERVAL);

    return () => clearInterval(pollingInterval);
  }, [fetchOverview]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOverview(true);
  }, [fetchOverview]);

  // Calculate stats from overview data
  const occupancyRate = overviewData?.occupancy && overviewData.occupancy.totalRooms > 0
    ? Math.round((overviewData.occupancy.occupied / overviewData.occupancy.totalRooms) * 100)
    : 0;
  const checkIns = overviewData?.today?.checkIns ?? 0;
  const checkOuts = overviewData?.today?.checkOuts ?? 0;

  // Badge count for pending housekeeping tasks
  const housekeepingBadge = overviewData?.housekeeping?.pending?.toString() || undefined;

  const features = [
    {
      title: 'Housekeeping',
      description: 'Manage room cleaning tasks and staff assignments',
      icon: 'broom-outline' as const,
      route: '/hotel/housekeeping',
      color: Colors.light.primary,
      badge: housekeepingBadge,
    },
    {
      title: 'Channel Manager',
      description: 'Manage OTA connections and sync bookings',
      icon: 'git-branch-outline' as const,
      route: '/hotel/channel-manager',
      color: Colors.light.info,
    },
    {
      title: 'Guest Management',
      description: 'Guest profiles, preferences, and history',
      icon: 'people-outline' as const,
      route: '/hotel/guests',
      color: Colors.light.success,
    },
    {
      title: 'Room Management',
      description: 'Room status, availability, and maintenance',
      icon: 'bed-outline' as const,
      route: '/hotel/rooms',
      color: Colors.light.warning,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.light.primaryLight2, Colors.light.background, Colors.light.background]}
        style={styles.backgroundGradient}
      />

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
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.greeting}>Hotel Operations</Text>
          <Text style={styles.subtitle}>
            {activeStore?.name || 'Your Hotel'} - Management Dashboard
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            {loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={styles.statValue}>{occupancyRate}%</Text>
            )}
            <Text style={styles.statLabel}>Occupancy</Text>
          </View>
          <View style={styles.statCard}>
            {loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={styles.statValue}>{checkIns}</Text>
            )}
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            {loading && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Text style={styles.statValue}>{checkOuts}</Text>
            )}
            <Text style={styles.statLabel}>Check-outs</Text>
          </View>
        </Animated.View>

        {/* Feature Cards */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Features</Text>
          {features.map((feature, index) => (
            <HotelFeatureCard key={feature.title} {...feature} />
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.light.primary }]}
              onPress={() => router.push('/hotel/housekeeping')}
            >
              <Ionicons name="broom" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>New Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.light.info }]}
              onPress={() => router.push('/hotel/channel-manager')}
            >
              <Ionicons name="sync" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Sync All</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
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
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
    marginTop: 8,
  },
  featureCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
