import { colors } from '@/constants/theme';
/**
 * Privé Campaigns Browse Screen
 * Browse and join active Privé campaigns
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import priveApi, { PriveCampaign } from '@/services/priveApi';
import ErrorState from '@/components/common/ErrorState';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

const FILTER_CHIPS = [
  { id: 'all', label: 'All', category: null },
  { id: 'food', label: 'Food', category: 'food' },
  { id: 'fashion', label: 'Fashion', category: 'fashion' },
  { id: 'fitness', label: 'Fitness', category: 'fitness' },
];

function PriveCampaignsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const priveCampaignsEnabled = useFeatureFlag('priveCampaignsEnabled');

  const {
    data: campaignsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['prive-campaigns', selectedFilter],
    queryFn: () =>
      priveApi.getCampaigns({
        category: selectedFilter === 'all' ? undefined : selectedFilter,
        page: 1,
        limit: 20,
      }),
    enabled: priveCampaignsEnabled,
    select: (res) => (res.success && res.data ? res.data.campaigns : []),
  });

  const campaigns: PriveCampaign[] = campaignsData ?? [];

  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  const handleJoinCampaign = (campaignId: string) => {
    router.push(`/prive/campaigns/${campaignId}`);
  };

  if (!priveCampaignsEnabled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Campaigns</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="sparkles" size={64} color={Colors.primary} />
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonSubtitle}>Exciting campaigns are on the way. Stay tuned!</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Campaigns</Text>
          <View style={{ width: 24 }} />
        </View>
        <ErrorState error="Failed to load campaigns. Please try again" onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Campaigns</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_CHIPS.map((chip) => (
          <Pressable
            key={chip.id}
            onPress={() => handleFilterChange(chip.id)}
            style={[styles.filterChip, selectedFilter === chip.id ? styles.filterChipActive : null]}
          >
            <Text style={[styles.filterChipText, selectedFilter === chip.id ? styles.filterChipTextActive : null]}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Campaigns List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      ) : campaigns.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No campaigns available</Text>
          <Text style={styles.emptySubtitle}>Check back later for new campaigns</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onJoin={() => handleJoinCampaign(campaign.id)} />
          ))}
          <View style={{ height: Spacing.lg }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface CampaignCardProps {
  campaign: PriveCampaign;
  onJoin: () => void;
}

function CampaignCard({ campaign, onJoin }: CampaignCardProps) {
  const deadlineDate = new Date(campaign.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <View style={styles.campaignCard}>
      <LinearGradient
        colors={['rgba(108, 99, 255, 0.1)', 'rgba(108, 99, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.campaignCardGradient}
      >
        {/* Header */}
        <View style={styles.campaignHeader}>
          <View style={styles.campaignBrandInfo}>
            <Text style={styles.campaignBrandName}>{campaign.brandName}</Text>
            <Text style={styles.campaignHashtag}>{campaign.hashtag}</Text>
          </View>
          <View style={styles.campaignBadge}>
            <Text style={styles.campaignBadgeText}>{campaign.category}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.campaignDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="gift" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{campaign.rewardCoins} coins</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{daysLeft} days left</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="chatbubbles" size={16} color={Colors.primary} />
            <Text style={styles.detailText}>{campaign.submissionCount} submissions</Text>
          </View>
        </View>

        {/* Join Button */}
        <Pressable onPress={onJoin} style={styles.joinButton}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.joinButtonGradient}
          >
            <Text style={styles.joinButtonText}>Join Campaign</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

export default withErrorBoundary(PriveCampaignsScreen, 'PriveCampaignsIndex');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: Spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.body1,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  comingSoonTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  comingSoonSubtitle: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  campaignCard: {
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  campaignCardGradient: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  campaignBrandInfo: {
    flex: 1,
  },
  campaignBrandName: {
    ...Typography.heading3,
    color: Colors.text,
  },
  campaignHashtag: {
    ...Typography.body2,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  campaignBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  campaignBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  campaignDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.body2,
    color: Colors.text,
  },
  joinButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  joinButtonText: {
    ...Typography.body1,
    color: Colors.white,
    fontWeight: '600',
  },
});
