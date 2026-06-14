/**
 * Fitness OS - Main Entry Point
 * Entry screen for fitness/gym management features
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

// Polling interval in milliseconds (30 seconds)
const POLLING_INTERVAL = 30000;

// Mock fitness stats interface
interface FitnessStats {
  totalMembers: number;
  activeMembers: number;
  classesToday: number;
  revenueThisMonth: number;
  pendingRenewals: number;
  newMembersThisWeek: number;
}

interface FitnessFeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
  badge?: string;
}

const FitnessFeatureCard: React.FC<FitnessFeatureCardProps> = ({
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

const StatCard: React.FC<{ label: string; value: string | number; color: string; icon: keyof typeof Ionicons.glyphMap }> = ({
  label,
  value,
  color,
  icon,
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

export default function FitnessIndexScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [stats, setStats] = useState<FitnessStats>({
    totalMembers: 0,
    activeMembers: 0,
    classesToday: 0,
    revenueThisMonth: 0,
    pendingRenewals: 0,
    newMembersThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fitness stats
  const fetchStats = useCallback(async (isRefresh = false) => {
    if (!activeStore?._id) return;

    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      // Mock data - replace with actual API call
      // const data = await fitnessApi.getStats(activeStore._id);
      // Simulating API response
      setStats({
        totalMembers: 156,
        activeMembers: 142,
        classesToday: 8,
        revenueThisMonth: 45600,
        pendingRenewals: 12,
        newMembersThisWeek: 8,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fitness data';
      console.error('[FitnessIndex] fetchStats error:', message);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore?._id]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchStats();

    const pollingInterval = setInterval(() => {
      fetchStats();
    }, POLLING_INTERVAL);

    return () => clearInterval(pollingInterval);
  }, [fetchStats]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats(true);
  }, [fetchStats]);

  const features = [
    {
      title: 'Members',
      description: 'Manage gym members and their profiles',
      icon: 'people-outline' as const,
      route: '/fitness/members',
      color: Colors.light.primary,
    },
    {
      title: 'Classes',
      description: 'Schedule and manage fitness classes',
      icon: 'fitness-outline' as const,
      route: '/fitness/classes',
      color: Colors.light.info,
    },
    {
      title: 'Trainers',
      description: 'Manage trainers and their schedules',
      icon: 'person-outline' as const,
      route: '/fitness/trainers',
      color: Colors.light.success,
    },
    {
      title: 'Membership Plans',
      description: 'Create and manage membership tiers',
      icon: 'card-outline' as const,
      route: '/fitness/membership',
      color: Colors.light.warning,
      badge: stats.pendingRenewals > 0 ? stats.pendingRenewals.toString() : undefined,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Fitness Hub</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>
            {activeStore?.name || 'Your Fitness Center'}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats Section */}
      <Animated.View entering={FadeInDown.springify()}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsContainer}
          style={styles.statsScrollView}
        >
          <StatCard
            label="Total Members"
            value={stats.totalMembers}
            color={Colors.light.primary}
            icon="people-outline"
          />
          <StatCard
            label="Active Members"
            value={stats.activeMembers}
            color={Colors.light.success}
            icon="checkmark-circle-outline"
          />
          <StatCard
            label="Classes Today"
            value={stats.classesToday}
            color={Colors.light.info}
            icon="fitness-outline"
          />
          <StatCard
            label="Revenue (Month)"
            value={formatCurrency(stats.revenueThisMonth)}
            color={Colors.light.warning}
            icon="cash-outline"
          />
          <StatCard
            label="New This Week"
            value={stats.newMembersThisWeek}
            color={Colors.light.secondary}
            icon="trending-up-outline"
          />
        </ScrollView>
      </Animated.View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => fetchStats()}
            style={styles.errorRetryButton}
          >
            <Text style={styles.errorRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Features List */}
      <ScrollView
        style={styles.featuresContainer}
        contentContainerStyle={styles.featuresContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Manage Your Fitness Business</Text>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={Colors.light.primary}
            style={styles.loader}
          />
        ) : (
          features.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <FitnessFeatureCard {...feature} />
            </Animated.View>
          ))
        )}

        {/* Quick Stats Summary */}
        <View style={styles.summaryCard}>
          <Card variant="elevated" padding="md" style={styles.summaryCardContent}>
            <View style={styles.summaryHeader}>
              <Ionicons name="analytics-outline" size={24} color={Colors.light.primary} />
              <Text style={styles.summaryTitle}>Monthly Summary</Text>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {Math.round((stats.activeMembers / stats.totalMembers) * 100) || 0}%
                </Text>
                <Text style={styles.summaryStatLabel}>Retention Rate</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{stats.pendingRenewals}</Text>
                <Text style={styles.summaryStatLabel}>Renewals Due</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>
                  {formatCurrency(stats.revenueThisMonth / stats.totalMembers || 0)}
                </Text>
                <Text style={styles.summaryStatLabel}>Avg Revenue/Member</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingTop: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsScrollView: {
    maxHeight: 120,
    marginTop: -12,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 140,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  errorRetryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginLeft: 8,
  },
  errorRetryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    flex: 1,
  },
  featuresContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    marginTop: 24,
  },
  summaryCardContent: {
    backgroundColor: Colors.light.primaryLight2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginLeft: 10,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.light.border,
  },
  loader: {
    marginTop: 40,
  },
});
