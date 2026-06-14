/**
 * Applications List - View all pending applications across campaigns
 * Review and manage influencer applications
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { campaignService, applicationService, helpers as influencerHelpers } from '@/services/api/influencer';
import type { CampaignApplication, ApplicationStatus } from '@/types/influencer';

type FilterType = 'all' | 'pending' | 'under_review' | 'accepted' | 'rejected';

export default function ApplicationsList() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all campaigns
  const { data: campaignsData, refetch: refetchCampaigns } = useQuery({
    queryKey: ['campaigns', { status: ['active', 'paused', 'draft'] }],
    queryFn: () => campaignService.listCampaigns({ status: ['active', 'paused', 'draft'], limit: 50 }),
  });

  // Collect all applications from campaigns
  const allApplications = useMemo(() => {
    if (!campaignsData?.items) return [];
    return campaignsData.items.flatMap((campaign) =>
      campaign.applications.map((app) => ({
        ...app,
        campaignId: campaign.id,
        campaignName: campaign.name,
      }))
    );
  }, [campaignsData]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return allApplications;
    return allApplications.filter((app) => app.status === statusFilter);
  }, [allApplications, statusFilter]);

  // Application mutations
  const acceptMutation = useMutation({
    mutationFn: async ({ applicationId, campaignId }: { applicationId: string; campaignId: string }) => {
      return applicationService.decideApplication(campaignId, applicationId, { decision: 'accept' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      Alert.alert('Success', 'Application accepted!');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ applicationId, campaignId, reason }: { applicationId: string; campaignId: string; reason?: string }) => {
      return applicationService.decideApplication(campaignId, applicationId, {
        decision: 'reject',
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      Alert.alert('Success', 'Application rejected.');
    },
  });

  // Counts
  const counts = useMemo(() => ({
    all: allApplications.length,
    pending: allApplications.filter((a) => a.status === 'pending').length,
    under_review: allApplications.filter((a) => a.status === 'under_review').length,
    accepted: allApplications.filter((a) => a.status === 'accepted').length,
    rejected: allApplications.filter((a) => a.status === 'rejected').length,
  }), [allApplications]);

  // Get status color
  const getStatusColor = (status: ApplicationStatus) => {
    const colors: Record<ApplicationStatus, string> = {
      pending: Colors.warning[500],
      under_review: Colors.secondary[500],
      accepted: Colors.success[500],
      rejected: Colors.error[500],
      negotiating: Colors.primary[500],
      withdrawn: Colors.gray[500],
      expired: Colors.gray[400],
    };
    return colors[status] || Colors.gray[500];
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchCampaigns();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchCampaigns]);

  // Loading
  const isLoading = !campaignsData;

  // Render filter tabs
  const renderFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      {(['all', 'pending', 'under_review', 'accepted', 'rejected'] as FilterType[]).map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterChip,
            statusFilter === filter && styles.filterChipActive,
            {
              backgroundColor: statusFilter === filter
                ? Colors.primary[500]
                : scheme === 'dark'
                ? Colors.gray[800]
                : Colors.card,
            },
          ]}
          onPress={() => setStatusFilter(filter)}
        >
          <Text
            style={[
              styles.filterChipText,
              {
                color: statusFilter === filter ? Colors.text.inverse : Colors.text.secondary,
              },
            ]}
          >
            {filter === 'all' ? 'All' : filter.replace('_', ' ')}
          </Text>
          <View
            style={[
              styles.filterCount,
              {
                backgroundColor: statusFilter === filter
                  ? Colors.text.inverse
                  : Colors.gray[200],
              },
            ]}
          >
            <Text
              style={[
                styles.filterCountText,
                {
                  color: statusFilter === filter ? Colors.primary[500] : Colors.text.secondary,
                },
              ]}
            >
              {counts[filter]}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render application card
  const renderApplicationCard = (application) => (
    <View
      key={application.id}
      style={[
        styles.applicationCard,
        { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
      ]}
    >
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => router.push(`/influencer/influencer/${application.influencerId}`)}
      >
        <Image
          source={{ uri: application.influencer?.avatar || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.influencerInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.influencerName, { color: Colors.text.primary }]}
              numberOfLines={1}
            >
              {application.influencer?.name || 'Unknown'}
            </Text>
            {application.influencer?.verified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary[500]} />
            )}
          </View>
          <Text style={[styles.username, { color: Colors.text.secondary }]}>
            @{application.influencer?.username || 'username'}
          </Text>
          <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: Colors.text.tertiary }]}>
              {application.influencer?.followerCount
                ? influencerHelpers.formatFollowerCount(application.influencer.followerCount)
                : '-'}{' '}
              followers
            </Text>
            <Text style={[styles.statDivider, { color: Colors.text.tertiary }]}> | </Text>
            <Text style={[styles.statText, { color: Colors.text.tertiary }]}>
              {application.influencer?.engagementRate
                ? influencerHelpers.formatEngagementRate(application.influencer.engagementRate)
                : '-'}{' '}
              engagement
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(application.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(application.status) }]}>
            {application.status.replace('_', ' ')}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.campaignInfo}
        onPress={() => router.push(`/influencer/${application.campaignId}`)}
      >
        <Ionicons name="megaphone-outline" size={16} color={Colors.text.tertiary} />
        <Text style={[styles.campaignName, { color: Colors.text.secondary }]} numberOfLines={1}>
          {application.campaignName}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
      </TouchableOpacity>

      {application.message && (
        <View
          style={[
            styles.messageBox,
            { backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[50] },
          ]}
        >
          <Text style={[styles.messageText, { color: Colors.text.secondary }]}>
            "{application.message}"
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View>
          <Text style={[styles.priceLabel, { color: Colors.text.tertiary }]}>Proposed</Text>
          <Text style={[styles.priceValue, { color: Colors.primary[500] }]}>
            {influencerHelpers.formatPrice(application.proposedPrice)}
          </Text>
        </View>

        {application.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.rejectBtn, { borderColor: Colors.error[500] }]}
              onPress={() => {
                Alert.prompt(
                  'Reject Application',
                  'Reason (optional):',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reject',
                      style: 'destructive',
                      onPress: (reason) =>
                        rejectMutation.mutate({
                          applicationId: application.id,
                          campaignId: application.campaignId,
                          reason,
                        }),
                    },
                  ],
                  'plain-text'
                );
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.error[500]} />
              ) : (
                <>
                  <Ionicons name="close" size={16} color={Colors.error[500]} />
                  <Text style={[styles.rejectText, { color: Colors.error[500] }]}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: Colors.success[500] }]}
              onPress={() =>
                acceptMutation.mutate({
                  applicationId: application.id,
                  campaignId: application.campaignId,
                })
              }
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
                  <Text style={styles.acceptText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {application.status !== 'pending' && (
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: Colors.primary[50] }]}
            onPress={() => router.push(`/influencer/influencer/${application.influencerId}`)}
          >
            <Text style={[styles.viewBtnText, { color: Colors.primary[600] }]}>View Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.gray[50] }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: scheme === 'dark' ? Colors.gray[900] : Colors.gray[50] },
      ]}
    >
      {renderFilters()}

      {filteredApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="documents-outline" size={64} color={Colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: Colors.text.primary }]}>
            No applications
          </Text>
          <Text style={[styles.emptyMessage, { color: Colors.text.secondary }]}>
            {statusFilter === 'all'
              ? 'Applications will appear when influencers apply to your campaigns'
              : `No ${statusFilter.replace('_', ' ')} applications`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary[500]}
            />
          }
        >
          {filteredApplications.map(renderApplicationCard)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filterScroll: {
    maxHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  filterContent: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
  },
  applicationCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[200],
  },
  influencerInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  influencerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    maxWidth: 150,
  },
  username: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statText: {
    fontSize: Typography.fontSize.xs,
  },
  statDivider: {
    fontSize: Typography.fontSize.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  campaignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    gap: Spacing.xs,
  },
  campaignName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
  },
  messageBox: {
    marginTop: Spacing.base,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  messageText: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  priceLabel: {
    fontSize: Typography.fontSize.xs,
  },
  priceValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  rejectText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  acceptText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.inverse,
  },
  viewBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  viewBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginTop: Spacing.base,
  },
  emptyMessage: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing['2xl'],
  },
});
