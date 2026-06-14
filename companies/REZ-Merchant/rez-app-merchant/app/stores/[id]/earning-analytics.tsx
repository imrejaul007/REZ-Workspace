import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import earningAnalyticsService, { EarningAnalytics } from '@/services/api/earningAnalytics';
import { logger } from '@/utils/logger';

export default function EarningAnalyticsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = id as string;

  const [analytics, setAnalytics] = useState<EarningAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);
      const data = await earningAnalyticsService.getStoreAnalytics(storeId);
      setAnalytics(data);
    } catch (err) {
      if (__DEV__) console.error('Error loading earning analytics:', err);
      setError(err?.message || 'Failed to load earning analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      loadAnalytics();
    }
  }, [storeId, loadAnalytics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAnalytics();
  }, [loadAnalytics]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Loading State
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earning Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  // Error State
  if (error && !analytics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earning Analytics</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error[400]} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
            <Ionicons name="refresh" size={18} color={Colors.text.inverse} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNav />
      </SafeAreaView>
    );
  }

  const data = analytics;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earning Analytics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Coins Awarded Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.success[50] }]}>
              <Ionicons name="trophy" size={20} color={Colors.success[600]} />
            </View>
            <Text style={styles.sectionTitle}>Coins Awarded</Text>
          </View>
          <View style={styles.cardRow}>
            <StatCard
              label="Total Awarded"
              value={formatNumber(data?.coinsAwarded.total || 0)}
              icon="ribbon"
              color={Colors.success[500]}
              bgColor={Colors.success[50]}
            />
            <StatCard
              label="This Month"
              value={formatNumber(data?.coinsAwarded.thisMonth || 0)}
              icon="calendar"
              color={Colors.success[600]}
              bgColor={Colors.success[50]}
            />
            <StatCard
              label="This Week"
              value={formatNumber(data?.coinsAwarded.thisWeek || 0)}
              icon="time"
              color={Colors.success[700]}
              bgColor={Colors.success[50]}
            />
          </View>
        </View>

        {/* CoinDrop Performance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.primary[50] }]}>
              <Ionicons name="flash" size={20} color={Colors.primary[600]} />
            </View>
            <Text style={styles.sectionTitle}>CoinDrop Performance</Text>
          </View>
          <View style={styles.cardRow}>
            <StatCard
              label="Active Drops"
              value={String(data?.coinDrops.active || 0)}
              icon="radio-button-on"
              color={Colors.primary[500]}
              bgColor={Colors.primary[50]}
            />
            <StatCard
              label="Total Drops"
              value={String(data?.coinDrops.total || 0)}
              icon="layers"
              color={Colors.primary[600]}
              bgColor={Colors.primary[50]}
            />
            <StatCard
              label="Total Usage"
              value={formatNumber(data?.coinDrops.totalUsage || 0)}
              icon="people"
              color={Colors.primary[700]}
              bgColor={Colors.primary[50]}
            />
          </View>
        </View>

        {/* Branded Coins Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.warning[50] }]}>
              <Ionicons name="diamond" size={20} color={Colors.warning[600]} />
            </View>
            <Text style={styles.sectionTitle}>Branded Coins</Text>
          </View>
          <View style={styles.cardRow}>
            <StatCard
              label="In Circulation"
              value={formatNumber(data?.brandedCoins.inCirculation || 0)}
              icon="sync-circle"
              color={Colors.warning[500]}
              bgColor={Colors.warning[50]}
            />
            <StatCard
              label="Total Awarded"
              value={formatNumber(data?.brandedCoins.totalAwarded || 0)}
              icon="arrow-up-circle"
              color={Colors.warning[600]}
              bgColor={Colors.warning[50]}
            />
            <StatCard
              label="Total Redeemed"
              value={formatNumber(data?.brandedCoins.totalRedeemed || 0)}
              icon="arrow-down-circle"
              color={Colors.warning[700]}
              bgColor={Colors.warning[50]}
            />
          </View>
        </View>

        {/* Customer Insights Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: Colors.primary[50] }]}>
              <Ionicons name="people" size={20} color={Colors.primary[600]} />
            </View>
            <Text style={styles.sectionTitle}>Customer Insights</Text>
          </View>

          {/* Total Customers with Coins */}
          <View style={styles.insightCard}>
            <View style={styles.insightRow}>
              <View style={[styles.insightIconContainer, { backgroundColor: Colors.primary[50] }]}>
                <Ionicons name="wallet" size={22} color={Colors.primary[500]} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Customers with Coins</Text>
                <Text style={styles.insightDescription}>Unique customers holding your coins</Text>
              </View>
              <Text style={styles.insightValue}>
                {formatNumber(data?.customers.totalWithCoins || 0)}
              </Text>
            </View>
          </View>

          {/* Repeat Rate */}
          <View style={styles.insightCard}>
            <View style={styles.insightRow}>
              <View style={[styles.insightIconContainer, { backgroundColor: Colors.success[50] }]}>
                <Ionicons name="repeat" size={22} color={Colors.success[500]} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightLabel}>Repeat Rate</Text>
                <Text style={styles.insightDescription}>Customers who ordered more than once</Text>
              </View>
              <Text style={[styles.insightValue, { color: Colors.success[600] }]}>
                {data?.customers.repeatRate || 0}%
              </Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(data?.customers.repeatRate || 0, 100)}%`,
                      backgroundColor:
                        (data?.customers.repeatRate || 0) >= 50
                          ? Colors.success[500]
                          : (data?.customers.repeatRate || 0) >= 25
                            ? Colors.warning[500]
                            : Colors.error[400],
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Top Earners */}
          <View style={styles.topEarnersCard}>
            <View style={styles.topEarnersHeader}>
              <Ionicons name="podium" size={20} color={Colors.primary[500]} />
              <Text style={styles.topEarnersTitle}>Top Earners</Text>
            </View>
            {!data?.customers.topEarners || data.customers.topEarners.length === 0 ? (
              <View style={styles.emptyTopEarners}>
                <Ionicons name="person-outline" size={36} color={Colors.gray[300]} />
                <Text style={styles.emptyTopEarnersText}>No earners yet</Text>
              </View>
            ) : (
              <FlatList
                data={data.customers.topEarners}
                keyExtractor={(item) => item.userId}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={styles.earnerRow}>
                    <View
                      style={[
                        styles.rankBadge,
                        {
                          backgroundColor:
                            index === 0
                              ? '#FFD700'
                              : index === 1
                                ? '#C0C0C0'
                                : index === 2
                                  ? '#CD7F32'
                                  : Colors.gray[200],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rankText,
                          { color: index < 3 ? '#FFFFFF' : Colors.text.secondary },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.earnerInfo}>
                      <Text style={styles.earnerUserId} numberOfLines={1}>
                        {item.userId?.toString().slice(-8) || 'Unknown'}
                      </Text>
                      <Text style={styles.earnerOrders}>
                        {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.earnerCoinsContainer}>
                      <Ionicons name="logo-bitcoin" size={16} color={Colors.warning[500]} />
                      <Text style={styles.earnerCoins}>{formatNumber(item.totalCoins)}</Text>
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.earnerSeparator} />}
              />
            )}
          </View>
        </View>

        <View style={{ height: BOTTOM_NAV_HEIGHT_CONSTANT + Spacing.xl }} />
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}

// Reusable Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    ...Shadows.sm,
  },
  backButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
  },
  errorTitle: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  errorMessage: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.sm,
  },
  retryButton: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  retryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },

  // Section
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },

  // Stat Cards Row
  cardRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extraBold,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.xs,
  },

  // Insight Cards
  insightCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  insightDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  insightValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.primary[600],
    marginLeft: Spacing.sm,
  },

  // Progress Bar
  progressBarContainer: {
    marginTop: Spacing.md,
    paddingLeft: 56, // offset to align with content after icon
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  // Top Earners
  topEarnersCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  topEarnersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  topEarnersTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  emptyTopEarners: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTopEarnersText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
  },
  earnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  earnerInfo: {
    flex: 1,
  },
  earnerUserId: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  earnerOrders: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  earnerCoinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  earnerCoins: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warning[700],
  },
  earnerSeparator: {
    height: 1,
    backgroundColor: Colors.border.light,
  },
});
