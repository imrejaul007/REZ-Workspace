/**
 * Influencer Marketing Analytics
 * Overview of all influencer marketing performance
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { campaignService, influencerService, helpers as influencerHelpers } from '@/services/api/influencer';
import type { CampaignMetrics, InfluencerAnalytics } from '@/types/influencer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function InfluencerAnalytics() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all campaigns for aggregated metrics
  const { data: campaignsData, refetch: refetchCampaigns, isLoading } = useQuery({
    queryKey: ['campaigns', { limit: 50 }],
    queryFn: () => campaignService.listCampaigns({ limit: 50 }),
  });

  // Calculate aggregated metrics
  const aggregatedMetrics = React.useMemo(() => {
    const campaigns = campaignsData?.items || [];
    const activeCampaigns = campaigns.filter((c) => c.status === 'active' || c.status === 'completed');
    const totalBudget = activeCampaigns.reduce((sum, c) => sum + c.budget.total, 0);
    const totalApplications = activeCampaigns.reduce((sum, c) => sum + (c.applications?.length || 0), 0);
    const totalAccepted = activeCampaigns.reduce(
      (sum, c) => sum + (c.acceptedInfluencers?.length || 0),
      0
    );

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalBudget,
      totalApplications,
      totalAccepted,
      totalReach: 0, // Would come from campaign metrics
      totalEngagement: 0,
      averageROI: 0,
    };
  }, [campaignsData]);

  // Fetch influencer analytics
  const { data: influencerAnalytics } = useQuery({
    queryKey: ['influencer-analytics'],
    queryFn: () => influencerService.getInfluencerAnalytics(),
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchCampaigns();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchCampaigns]);

  // Loading state
  if (isLoading && !campaignsData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.gray[50] }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: scheme === 'dark' ? Colors.gray[900] : Colors.gray[50] },
      ]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary[500]}
        />
      }
    >
      {/* Overview Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View
            style={[
              styles.overviewCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <View style={[styles.overviewIcon, { backgroundColor: Colors.primary[50] }]}>
              <Ionicons name="megaphone" size={24} color={Colors.primary[500]} />
            </View>
            <Text style={[styles.overviewValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.totalCampaigns}
            </Text>
            <Text style={[styles.overviewLabel, { color: Colors.text.secondary }]}>
              Total Campaigns
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <View style={[styles.overviewIcon, { backgroundColor: Colors.success[50] }]}>
              <Ionicons name="play-circle" size={24} color={Colors.success[500]} />
            </View>
            <Text style={[styles.overviewValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.activeCampaigns}
            </Text>
            <Text style={[styles.overviewLabel, { color: Colors.text.secondary }]}>
              Active Campaigns
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <View style={[styles.overviewIcon, { backgroundColor: Colors.warning[50] }]}>
              <Ionicons name="people" size={24} color={Colors.warning[500]} />
            </View>
            <Text style={[styles.overviewValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.totalApplications}
            </Text>
            <Text style={[styles.overviewLabel, { color: Colors.text.secondary }]}>
              Total Applications
            </Text>
          </View>

          <View
            style={[
              styles.overviewCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <View style={[styles.overviewIcon, { backgroundColor: Colors.secondary[50] }]}>
              <Ionicons name="checkmark-done" size={24} color={Colors.secondary[500]} />
            </View>
            <Text style={[styles.overviewValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.totalAccepted}
            </Text>
            <Text style={[styles.overviewLabel, { color: Colors.text.secondary }]}>
              Accepted
            </Text>
          </View>
        </View>
      </View>

      {/* Budget Overview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Budget</Text>
        <View
          style={[
            styles.budgetCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <View style={styles.budgetHeader}>
            <Ionicons name="wallet" size={32} color={Colors.primary[500]} />
            <View style={styles.budgetInfo}>
              <Text style={[styles.budgetLabel, { color: Colors.text.secondary }]}>
                Total Budget Spent
              </Text>
              <Text style={[styles.budgetValue, { color: Colors.text.primary }]}>
                {influencerHelpers.formatPrice(aggregatedMetrics.totalBudget)}
              </Text>
            </View>
          </View>

          <View style={styles.budgetStats}>
            <View style={styles.budgetStat}>
              <Text style={[styles.budgetStatValue, { color: Colors.primary[500] }]}>
                {aggregatedMetrics.totalCampaigns > 0
                  ? influencerHelpers.formatPrice(
                      aggregatedMetrics.totalBudget / aggregatedMetrics.totalCampaigns
                    )
                  : influencerHelpers.formatPrice(0)}
              </Text>
              <Text style={[styles.budgetStatLabel, { color: Colors.text.secondary }]}>
                Avg per Campaign
              </Text>
            </View>
            <View style={styles.budgetStat}>
              <Text style={[styles.budgetStatValue, { color: Colors.success[500] }]}>
                {aggregatedMetrics.totalAccepted > 0
                  ? influencerHelpers.formatPrice(
                      aggregatedMetrics.totalBudget / aggregatedMetrics.totalAccepted
                    )
                  : influencerHelpers.formatPrice(0)}
              </Text>
              <Text style={[styles.budgetStatLabel, { color: Colors.text.secondary }]}>
                Avg per Influencer
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Performance</Text>
        <View style={styles.performanceGrid}>
          <View
            style={[
              styles.performanceCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <Ionicons name="eye" size={28} color={Colors.primary[500]} />
            <Text style={[styles.performanceValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.totalReach > 0
                ? `${(aggregatedMetrics.totalReach / 1000).toFixed(1)}K`
                : '-'}
            </Text>
            <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
              Total Reach
            </Text>
          </View>

          <View
            style={[
              styles.performanceCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <Ionicons name="heart" size={28} color={Colors.error[500]} />
            <Text style={[styles.performanceValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.totalEngagement > 0
                ? `${(aggregatedMetrics.totalEngagement / 1000).toFixed(1)}K`
                : '-'}
            </Text>
            <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
              Total Engagement
            </Text>
          </View>

          <View
            style={[
              styles.performanceCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <Ionicons name="trending-up" size={28} color={Colors.success[500]} />
            <Text style={[styles.performanceValue, { color: Colors.success[500] }]}>
              {aggregatedMetrics.averageROI > 0 ? `${aggregatedMetrics.averageROI.toFixed(1)}x` : '-'}
            </Text>
            <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
              Average ROI
            </Text>
          </View>

          <View
            style={[
              styles.performanceCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <Ionicons name="chatbubbles" size={28} color={Colors.secondary[500]} />
            <Text style={[styles.performanceValue, { color: Colors.text.primary }]}>
              {aggregatedMetrics.totalApplications > 0 && aggregatedMetrics.totalAccepted > 0
                ? `${((aggregatedMetrics.totalAccepted / aggregatedMetrics.totalApplications) * 100).toFixed(0)}%`
                : '-'}
            </Text>
            <Text style={[styles.performanceLabel, { color: Colors.text.secondary }]}>
              Acceptance Rate
            </Text>
          </View>
        </View>
      </View>

      {/* Top Performing Campaigns */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
            Top Campaigns
          </Text>
          <TouchableOpacity onPress={() => router.push('/influencer/campaigns')}>
            <Text style={[styles.seeAllText, { color: Colors.primary[500] }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {campaignsData?.items && campaignsData.items.length > 0 ? (
          campaignsData.items
            .filter((c) => c.status === 'completed' || c.status === 'active')
            .slice(0, 3)
            .map((campaign) => (
              <TouchableOpacity
                key={campaign.id}
                style={[
                  styles.campaignCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
                onPress={() => router.push(`/influencer/${campaign.id}`)}
              >
                <View style={styles.campaignInfo}>
                  <Text
                    style={[styles.campaignName, { color: Colors.text.primary }]}
                    numberOfLines={1}
                  >
                    {campaign.name}
                  </Text>
                  <View style={styles.campaignStats}>
                    <Text style={[styles.campaignStat, { color: Colors.text.secondary }]}>
                      {campaign.applications?.length || 0} applications
                    </Text>
                    <Text style={[styles.campaignStatDivider, { color: Colors.text.tertiary }]}>
                      {' '}
                      |{' '}
                    </Text>
                    <Text style={[styles.campaignStat, { color: Colors.text.secondary }]}>
                      {campaign.acceptedInfluencers?.length || 0} accepted
                    </Text>
                  </View>
                </View>
                <View style={styles.campaignBudget}>
                  <Text style={[styles.campaignBudgetValue, { color: Colors.primary[500] }]}>
                    {influencerHelpers.formatPrice(campaign.budget.total)}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))
        ) : (
          <View style={styles.emptyCampaigns}>
            <Ionicons name="megaphone-outline" size={48} color={Colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: Colors.text.secondary }]}>
              No campaigns yet
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
            onPress={() => router.push('/influencer/create')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.primary[50] }]}>
              <Ionicons name="add-circle" size={28} color={Colors.primary[500]} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.text.primary }]}>
              New Campaign
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
            onPress={() => router.push('/influencer')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.success[50] }]}>
              <Ionicons name="people" size={28} color={Colors.success[500]} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.text.primary }]}>
              Browse Influencers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
            onPress={() => router.push('/influencer/applications')}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.warning[50] }]}>
              <Ionicons name="documents" size={28} color={Colors.warning[500]} />
            </View>
            <Text style={[styles.actionLabel, { color: Colors.text.primary }]}>
              View Applications
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.base,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  overviewCard: {
    width: (SCREEN_WIDTH - Spacing.base * 2 - Spacing.sm) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  overviewValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  overviewLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  budgetCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  budgetInfo: {
    marginLeft: Spacing.base,
  },
  budgetLabel: {
    fontSize: Typography.fontSize.sm,
  },
  budgetValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  budgetStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingTop: Spacing.base,
  },
  budgetStat: {
    flex: 1,
    alignItems: 'center',
  },
  budgetStatValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
  },
  budgetStatLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  performanceCard: {
    width: (SCREEN_WIDTH - Spacing.base * 2 - Spacing.sm) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  performanceValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.xs,
  },
  performanceLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  campaignStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  campaignStat: {
    fontSize: Typography.fontSize.sm,
  },
  campaignStatDivider: {
    fontSize: Typography.fontSize.sm,
  },
  campaignBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  campaignBudgetValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  emptyCampaigns: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
});
