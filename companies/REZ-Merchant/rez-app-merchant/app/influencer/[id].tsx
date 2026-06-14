/**
 * Campaign Details - View and manage a specific campaign
 * Display campaign information, applications, and metrics
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
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import {
  campaignService,
  applicationService,
  helpers as influencerHelpers,
} from '@/services/api/influencer';
import type {
  Campaign,
  CampaignApplication,
  CampaignStatus,
  ApplicationStatus,
} from '@/types/influencer';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'overview' | 'applications' | 'influencers' | 'analytics';

export default function CampaignDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const scheme = colorScheme ?? 'light';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [applicationFilter, setApplicationFilter] = useState<ApplicationStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch campaign details
  const {
    data: campaign,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!id) throw new Error('Campaign ID is required');
      return campaignService.getCampaign(id);
    },
    enabled: !!id,
  });

  // Fetch campaign metrics
  const { data: metrics } = useQuery({
    queryKey: ['campaign-metrics', id],
    queryFn: async () => {
      if (!id) throw new Error('Campaign ID is required');
      return campaignService.getCampaignMetrics(id);
    },
    enabled: !!id && activeTab === 'analytics',
  });

  // Campaign action mutations
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Campaign ID is required');
      return campaignService.publishCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      Alert.alert('Success', 'Campaign published successfully!');
    },
    onError: (err) => {
      logger.error('[CampaignDetails] Failed to publish campaign', err);
      Alert.alert('Error', 'Failed to publish campaign. Please try again.');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Campaign ID is required');
      return campaignService.pauseCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      Alert.alert('Success', 'Campaign paused successfully!');
    },
    onError: (err) => {
      logger.error('[CampaignDetails] Failed to pause campaign', err);
      Alert.alert('Error', 'Failed to pause campaign. Please try again.');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Campaign ID is required');
      return campaignService.resumeCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      Alert.alert('Success', 'Campaign resumed successfully!');
    },
    onError: (err) => {
      logger.error('[CampaignDetails] Failed to resume campaign', err);
      Alert.alert('Error', 'Failed to resume campaign. Please try again.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Campaign ID is required');
      return campaignService.cancelCampaign(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      Alert.alert('Success', 'Campaign cancelled.');
    },
    onError: (err) => {
      logger.error('[CampaignDetails] Failed to cancel campaign', err);
      Alert.alert('Error', 'Failed to cancel campaign. Please try again.');
    },
  });

  // Application decision mutations
  const acceptApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      if (!id) throw new Error('Campaign ID is required');
      return applicationService.decideApplication(id, applicationId, { decision: 'accept' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      Alert.alert('Success', 'Application accepted!');
    },
    onError: (err) => {
      logger.error('[CampaignDetails] Failed to accept application', err);
      Alert.alert('Error', 'Failed to accept application. Please try again.');
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason?: string }) => {
      if (!id) throw new Error('Campaign ID is required');
      return applicationService.decideApplication(id, applicationId, {
        decision: 'reject',
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      Alert.alert('Success', 'Application rejected.');
    },
    onError: (err) => {
      logger.error('[CampaignDetails] Failed to reject application', err);
      Alert.alert('Error', 'Failed to reject application. Please try again.');
    },
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Get status color
  const getStatusColor = (status: CampaignStatus) => {
    const colors: Record<CampaignStatus, string> = {
      draft: Colors.gray[500],
      pending_approval: Colors.warning[500],
      active: Colors.success[500],
      paused: Colors.secondary[500],
      completed: Colors.primary[500],
      cancelled: Colors.error[500],
      rejected: Colors.error[500],
    };
    return colors[status] || Colors.gray[500];
  };

  // Get application status color
  const getApplicationStatusColor = (status: ApplicationStatus) => {
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

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (!campaign?.applications) return [];
    if (applicationFilter === 'all') return campaign.applications;
    return campaign.applications.filter((app) => app.status === applicationFilter);
  }, [campaign?.applications, applicationFilter]);

  // Application counts
  const applicationCounts = useMemo(() => {
    if (!campaign?.applications) return { all: 0, pending: 0, accepted: 0, rejected: 0 };
    return {
      all: campaign.applications.length,
      pending: campaign.applications.filter((a) => a.status === 'pending').length,
      accepted: campaign.applications.filter((a) => a.status === 'accepted').length,
      rejected: campaign.applications.filter((a) => a.status === 'rejected').length,
    };
  }, [campaign?.applications]);

  // Handle action button
  const handleActionButton = useCallback(() => {
    if (!campaign) return;

    switch (campaign.status) {
      case 'draft':
        Alert.alert(
          'Publish Campaign',
          'Are you sure you want to publish this campaign? It will be visible to influencers.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Publish', onPress: () => publishMutation.mutate() },
          ]
        );
        break;
      case 'active':
        Alert.alert(
          'Pause Campaign',
          'Are you sure you want to pause this campaign? Influencers will be notified.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Pause', onPress: () => pauseMutation.mutate() },
          ]
        );
        break;
      case 'paused':
        Alert.alert(
          'Resume Campaign',
          'Are you sure you want to resume this campaign?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Resume', onPress: () => resumeMutation.mutate() },
          ]
        );
        break;
      default:
        break;
    }
  }, [campaign, publishMutation, pauseMutation, resumeMutation]);

  // Copy share link
  const copyShareLink = useCallback(async () => {
    if (!campaign) return;
    const shareLink = `https://rez.money/influencer/campaign/${campaign.id}`;
    await Clipboard.setStringAsync(shareLink);
    Alert.alert('Copied!', 'Campaign link copied to clipboard');
  }, [campaign]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.gray[50] }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading campaign...</Text>
      </View>
    );
  }

  // Error state
  if (error || !campaign) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.gray[50] }]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.errorTitle}>Unable to load campaign</Text>
        <Text style={styles.errorMessage}>
          Please check your connection and try again
        </Text>
        <Button title="Try Again" onPress={() => refetch()} />
      </View>
    );
  }

  // Action button config
  const getActionButtonConfig = () => {
    switch (campaign.status) {
      case 'draft':
        return { label: 'Publish Campaign', icon: 'rocket-outline', loading: publishMutation.isPending };
      case 'active':
        return { label: 'Pause Campaign', icon: 'pause-outline', loading: pauseMutation.isPending };
      case 'paused':
        return { label: 'Resume Campaign', icon: 'play-outline', loading: resumeMutation.isPending };
      case 'completed':
        return null;
      default:
        return null;
    }
  };

  const actionButtonConfig = getActionButtonConfig();

  // Render tabs
  const renderTabs = () => (
    <View
      style={[
        styles.tabsContainer,
        { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
      ]}
    >
      {(['overview', 'applications', 'influencers', 'analytics'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab ? Colors.primary[500] : Colors.text.secondary },
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {tab === 'applications' && applicationCounts.pending > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{applicationCounts.pending}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render overview tab
  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary[500]}
        />
      }
    >
      {/* Campaign Header Card */}
      <View
        style={[
          styles.headerCard,
          { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
        ]}
      >
        <View style={styles.headerTop}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(campaign.status) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
              {campaign.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={copyShareLink}>
            <Ionicons name="share-social-outline" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.campaignName, { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary }]}
        >
          {campaign.name}
        </Text>

        <Text
          style={[styles.campaignDescription, { color: Colors.text.secondary }]}
          numberOfLines={3}
        >
          {campaign.description}
        </Text>

        <View style={styles.objectivesContainer}>
          {campaign.objectives.map((objective) => (
            <View
              key={objective}
              style={[styles.objectiveBadge, { backgroundColor: Colors.primary[50] }]}
            >
              <Text style={[styles.objectiveText, { color: Colors.primary[600] }]}>
                {objective.replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Ionicons name="people" size={24} color={Colors.primary[500]} />
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {campaign.applications?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Applications</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color={Colors.success[500]} />
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {campaign.acceptedInfluencers?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Accepted</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Ionicons name="wallet" size={24} color={Colors.warning[500]} />
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {influencerHelpers.formatPrice(campaign.budget.total)}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Budget</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <Ionicons name="calendar" size={24} color={Colors.secondary[500]} />
          <Text style={[styles.statValue, { color: Colors.text.primary }]}>
            {new Date(campaign.timeline.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.text.secondary }]}>Ends</Text>
        </View>
      </View>

      {/* Deliverables */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
          Deliverables
        </Text>
        {campaign.deliverables.map((deliverable) => (
          <View
            key={deliverable.id}
            style={[
              styles.deliverableCard,
              { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
            ]}
          >
            <View style={styles.deliverableHeader}>
              <View style={styles.deliverableInfo}>
                <Text
                  style={[
                    styles.deliverableType,
                    { color: Colors.primary[500] },
                  ]}
                >
                  {deliverable.type.replace('_', ' ')}
                </Text>
                <Text
                  style={[
                    styles.deliverableTitle,
                    { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary },
                  ]}
                >
                  {deliverable.title}
                </Text>
              </View>
              <View style={styles.deliverableQuantity}>
                <Text
                  style={[styles.quantityValue, { color: Colors.primary[500] }]}
                >
                  x{deliverable.quantity}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.deliverableDescription, { color: Colors.text.secondary }]}
            >
              {deliverable.description}
            </Text>
            <View style={styles.deliverableFooter}>
              <Text style={[styles.deliverablePrice, { color: Colors.text.primary }]}>
                {influencerHelpers.formatPrice(deliverable.price)}
              </Text>
              {deliverable.isRequired && (
                <View style={[styles.requiredBadge, { backgroundColor: Colors.error[50] }]}>
                  <Text style={[styles.requiredText, { color: Colors.error[600] }]}>
                    Required
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Platforms & Niche */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
          Target Platforms & Niche
        </Text>
        <View style={styles.platformContainer}>
          {campaign.platforms.map((platform) => (
            <View
              key={platform}
              style={[
                styles.platformBadge,
                { backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[100] },
              ]}
            >
              <Ionicons
                name={influencerHelpers.getPlatformIcon(platform) as unknown}
                size={18}
                color={Colors.primary[500]}
              />
              <Text
                style={[styles.platformText, { color: Colors.text.secondary }]}
              >
                {influencerHelpers.getPlatformDisplayName(platform)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.nicheContainer}>
          {campaign.niche.map((niche) => (
            <View
              key={niche}
              style={[
                styles.nicheBadge,
                { backgroundColor: Colors.primary[50] },
              ]}
            >
              <Text style={[styles.nicheText, { color: Colors.primary[600] }]}>
                {influencerHelpers.getNicheDisplayName(niche)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
          Campaign Timeline
        </Text>
        <View
          style={[
            styles.timelineCard,
            { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
          ]}
        >
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: Colors.text.secondary }]}>
                Start Date
              </Text>
              <Text style={[styles.timelineValue, { color: Colors.text.primary }]}>
                {new Date(campaign.timeline.startDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: Colors.primary[500] }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: Colors.text.secondary }]}>
                End Date
              </Text>
              <Text style={[styles.timelineValue, { color: Colors.text.primary }]}>
                {new Date(campaign.timeline.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: Colors.warning[500] }]} />
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: Colors.text.secondary }]}>
                Review Period
              </Text>
              <Text style={[styles.timelineValue, { color: Colors.text.primary }]}>
                {campaign.timeline.reviewPeriod} days after submission
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Render applications tab
  const renderApplicationsTab = () => (
    <View style={styles.tabContent}>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'pending', 'under_review', 'accepted', 'rejected'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              applicationFilter === filter && styles.filterChipActive,
              {
                backgroundColor:
                  applicationFilter === filter
                    ? Colors.primary[500]
                    : scheme === 'dark'
                    ? Colors.gray[800]
                    : Colors.card,
              },
            ]}
            onPress={() => setApplicationFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color:
                    applicationFilter === filter
                      ? Colors.text.inverse
                      : Colors.text.secondary,
                },
              ]}
            >
              {filter === 'all' ? 'All' : filter.replace('_', ' ')}
            </Text>
            {filter !== 'all' && (
              <View
                style={[
                  styles.filterCount,
                  {
                    backgroundColor:
                      applicationFilter === filter
                        ? Colors.text.inverse
                        : Colors.gray[200],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    {
                      color:
                        applicationFilter === filter
                          ? Colors.primary[500]
                          : Colors.text.secondary,
                    },
                  ]}
                >
                  {filter === 'all'
                    ? applicationCounts.all
                    : applicationCounts[filter as keyof typeof applicationCounts]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications list */}
      {filteredApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="documents-outline" size={64} color={Colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: Colors.text.primary }]}>
            No applications yet
          </Text>
          <Text style={[styles.emptyMessage, { color: Colors.text.secondary }]}>
            Applications will appear here when influencers apply to your campaign
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.applicationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary[500]}
            />
          }
        >
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              campaign={campaign}
              onAccept={() => acceptApplicationMutation.mutate(application.id)}
              onReject={() => {
                Alert.prompt(
                  'Reject Application',
                  'Please provide a reason (optional):',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reject',
                      style: 'destructive',
                      onPress: (reason) =>
                        rejectApplicationMutation.mutate({
                          applicationId: application.id,
                          reason,
                        }),
                    },
                  ],
                  'plain-text'
                );
              }}
              onViewProfile={() =>
                router.push(`/influencer/influencer/${application.influencerId}`)
              }
              isAccepting={acceptApplicationMutation.isPending}
              isRejecting={rejectApplicationMutation.isPending}
              scheme={scheme}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Render influencers tab
  const renderInfluencersTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary[500]}
        />
      }
    >
      {campaign.acceptedInfluencers && campaign.acceptedInfluencers.length > 0 ? (
        campaign.acceptedInfluencers.map((influencer) => (
          <InfluencerCard
            key={influencer.id}
            influencer={influencer}
            onViewProfile={() => router.push(`/influencer/influencer/${influencer.id}`)}
            scheme={scheme}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={Colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: Colors.text.primary }]}>
            No accepted influencers yet
          </Text>
          <Text style={[styles.emptyMessage, { color: Colors.text.secondary }]}>
            Accept applications to add influencers to your campaign
          </Text>
        </View>
      )}
    </ScrollView>
  );

  // Render analytics tab
  const renderAnalyticsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary[500]}
        />
      }
    >
      {metrics ? (
        <>
          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Campaign Performance
            </Text>
            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
              >
                <Ionicons name="eye" size={24} color={Colors.primary[500]} />
                <Text style={[styles.metricValue, { color: Colors.text.primary }]}>
                  {(metrics.impressions / 1000).toFixed(1)}K
                </Text>
                <Text style={[styles.metricLabel, { color: Colors.text.secondary }]}>
                  Impressions
                </Text>
              </View>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
              >
                <Ionicons name="people" size={24} color={Colors.success[500]} />
                <Text style={[styles.metricValue, { color: Colors.text.primary }]}>
                  {(metrics.reach / 1000).toFixed(1)}K
                </Text>
                <Text style={[styles.metricLabel, { color: Colors.text.secondary }]}>
                  Reach
                </Text>
              </View>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
              >
                <Ionicons name="heart" size={24} color={Colors.error[500]} />
                <Text style={[styles.metricValue, { color: Colors.text.primary }]}>
                  {(metrics.engagement / 1000).toFixed(1)}K
                </Text>
                <Text style={[styles.metricLabel, { color: Colors.text.secondary }]}>
                  Engagement
                </Text>
              </View>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
              >
                <Ionicons name="cash" size={24} color={Colors.warning[500]} />
                <Text style={[styles.metricValue, { color: Colors.text.primary }]}>
                  {metrics.roi.toFixed(1)}x
                </Text>
                <Text style={[styles.metricLabel, { color: Colors.text.secondary }]}>
                  ROI
                </Text>
              </View>
            </View>
          </View>

          {/* Cost Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Cost Efficiency
            </Text>
            <View
              style={[
                styles.costCard,
                { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
              ]}
            >
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: Colors.text.secondary }]}>
                  Cost per Engagement
                </Text>
                <Text style={[styles.costValue, { color: Colors.text.primary }]}>
                  {influencerHelpers.formatPrice(metrics.costPerEngagement)}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: Colors.text.secondary }]}>
                  Cost per Click
                </Text>
                <Text style={[styles.costValue, { color: Colors.text.primary }]}>
                  {influencerHelpers.formatPrice(metrics.costPerClick)}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: Colors.text.secondary }]}>
                  Cost per Conversion
                </Text>
                <Text style={[styles.costValue, { color: Colors.text.primary }]}>
                  {influencerHelpers.formatPrice(metrics.costPerConversion)}
                </Text>
              </View>
            </View>
          </View>

          {/* Conversion Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Conversions & Revenue
            </Text>
            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
              >
                <Ionicons name="cart" size={24} color={Colors.success[500]} />
                <Text style={[styles.metricValue, { color: Colors.text.primary }]}>
                  {metrics.conversions}
                </Text>
                <Text style={[styles.metricLabel, { color: Colors.text.secondary }]}>
                  Conversions
                </Text>
              </View>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                ]}
              >
                <Ionicons name="trending-up" size={24} color={Colors.primary[500]} />
                <Text style={[styles.metricValue, { color: Colors.success[500] }]}>
                  {influencerHelpers.formatPrice(metrics.revenue)}
                </Text>
                <Text style={[styles.metricLabel, { color: Colors.text.secondary }]}>
                  Revenue
                </Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={64} color={Colors.text.tertiary} />
          <Text style={[styles.emptyTitle, { color: Colors.text.primary }]}>
            Analytics not available
          </Text>
          <Text style={[styles.emptyMessage, { color: Colors.text.secondary }]}>
            Analytics will appear once your campaign is active
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: campaign?.name || 'Campaign Details',
        }}
      />

      {/* Tabs */}
      {renderTabs()}

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'applications' && renderApplicationsTab()}
      {activeTab === 'influencers' && renderInfluencersTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}

      {/* Action Button */}
      {actionButtonConfig && (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
              paddingBottom: insets.bottom + Spacing.base,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary[500] }]}
            onPress={handleActionButton}
            disabled={actionButtonConfig.loading}
          >
            {actionButtonConfig.loading ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <>
                <Ionicons
                  name={actionButtonConfig.icon as unknown}
                  size={20}
                  color={Colors.text.inverse}
                />
                <Text style={styles.actionButtonText}>{actionButtonConfig.label}</Text>
              </>
            )}
          </TouchableOpacity>
          {campaign.status !== 'draft' && (
            <TouchableOpacity
              style={[styles.secondaryActionButton, { borderColor: Colors.error[500] }]}
              onPress={() => {
                Alert.alert(
                  'Cancel Campaign',
                  'Are you sure you want to cancel this campaign? This action cannot be undone.',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Cancel Campaign',
                      style: 'destructive',
                      onPress: () => cancelMutation.mutate(),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color={Colors.error[500]} />
              <Text style={[styles.secondaryActionText, { color: Colors.error[500] }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: CampaignApplication;
  campaign: Campaign;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
  scheme: 'light' | 'dark' | null | undefined;
}

function ApplicationCard({
  application,
  onAccept,
  onReject,
  onViewProfile,
  isAccepting,
  isRejecting,
  scheme,
}: ApplicationCardProps) {
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

  return (
    <View
      style={[
        styles.applicationCard,
        { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
      ]}
    >
      <TouchableOpacity style={styles.applicationHeader} onPress={onViewProfile}>
        <Image
          source={{ uri: application.influencer?.avatar || 'https://i.pravatar.cc/150' }}
          style={styles.applicationAvatar}
        />
        <View style={styles.applicationInfo}>
          <View style={styles.applicationNameRow}>
            <Text
              style={[styles.applicationName, { color: Colors.text.primary }]}
              numberOfLines={1}
            >
              {application.influencer?.name || 'Unknown Influencer'}
            </Text>
            {application.influencer?.verified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary[500]} />
            )}
          </View>
          <Text
            style={[styles.applicationUsername, { color: Colors.text.secondary }]}
          >
            @{application.influencer?.username || 'username'}
          </Text>
          <View style={styles.applicationStats}>
            <Text style={[styles.applicationStatText, { color: Colors.text.tertiary }]}>
              {application.influencer?.followerCount
                ? influencerHelpers.formatFollowerCount(application.influencer.followerCount)
                : '-'}{' '}
              followers
            </Text>
            <Text style={[styles.applicationStatDivider, { color: Colors.text.tertiary }]}>
              {' '}
              |{' '}
            </Text>
            <Text style={[styles.applicationStatText, { color: Colors.text.tertiary }]}>
              {application.influencer?.engagementRate
                ? influencerHelpers.formatEngagementRate(application.influencer.engagementRate)
                : '-'}{' '}
              engagement
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.applicationStatusBadge,
            { backgroundColor: getStatusColor(application.status) + '20' },
          ]}
        >
          <Text
            style={[styles.applicationStatusText, { color: getStatusColor(application.status) }]}
          >
            {application.status.replace('_', ' ')}
          </Text>
        </View>
      </TouchableOpacity>

      {application.message && (
        <View
          style={[
            styles.applicationMessage,
            { backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[50] },
          ]}
        >
          <Text style={[styles.applicationMessageText, { color: Colors.text.secondary }]}>
            "{application.message}"
          </Text>
        </View>
      )}

      <View style={styles.applicationFooter}>
        <View style={styles.applicationPrice}>
          <Text style={[styles.applicationPriceLabel, { color: Colors.text.secondary }]}>
            Proposed Price
          </Text>
          <Text style={[styles.applicationPriceValue, { color: Colors.text.primary }]}>
            {influencerHelpers.formatPrice(application.proposedPrice)}
          </Text>
        </View>

        {application.status === 'pending' && (
          <View style={styles.applicationActions}>
            <TouchableOpacity
              style={[styles.rejectButton, { borderColor: Colors.error[500] }]}
              onPress={onReject}
              disabled={isRejecting}
            >
              {isRejecting ? (
                <ActivityIndicator size="small" color={Colors.error[500]} />
              ) : (
                <>
                  <Ionicons name="close" size={16} color={Colors.error[500]} />
                  <Text style={[styles.rejectButtonText, { color: Colors.error[500] }]}>
                    Reject
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptButton, { backgroundColor: Colors.success[500] }]}
              onPress={onAccept}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {application.status !== 'pending' && (
          <TouchableOpacity
            style={[styles.viewProfileButton, { backgroundColor: Colors.primary[50] }]}
            onPress={onViewProfile}
          >
            <Text style={[styles.viewProfileText, { color: Colors.primary[600] }]}>
              View Profile
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Influencer Card Component
interface InfluencerCardProps {
  influencer;
  onViewProfile: () => void;
  scheme: 'light' | 'dark' | null | undefined;
}

function InfluencerCard({ influencer, onViewProfile, scheme }: InfluencerCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.influencerCard,
        { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
      ]}
      onPress={onViewProfile}
    >
      <Image
        source={{ uri: influencer.avatar || 'https://i.pravatar.cc/150' }}
        style={styles.influencerAvatar}
      />
      <View style={styles.influencerInfo}>
        <View style={styles.influencerNameRow}>
          <Text
            style={[styles.influencerName, { color: Colors.text.primary }]}
            numberOfLines={1}
          >
            {influencer.name}
          </Text>
          {influencer.verified && (
            <Ionicons name="checkmark-circle" size={16} color={Colors.primary[500]} />
          )}
        </View>
        <Text style={[styles.influencerUsername, { color: Colors.text.secondary }]}>
          @{influencer.username}
        </Text>
        <View style={styles.influencerStats}>
          <View style={styles.influencerStatItem}>
            <Ionicons name="people" size={14} color={Colors.text.tertiary} />
            <Text style={[styles.influencerStatText, { color: Colors.text.secondary }]}>
              {influencerHelpers.formatFollowerCount(influencer.followerCount)}
            </Text>
          </View>
          <View style={styles.influencerStatItem}>
            <Ionicons name="star" size={14} color={Colors.warning[500]} />
            <Text style={[styles.influencerStatText, { color: Colors.text.secondary }]}>
              {influencer.rating?.toFixed(1) || '-'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
    </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  errorTitle: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  errorMessage: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[500],
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  tabBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.base,
  },
  headerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  statusBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  campaignName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  campaignDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.base,
    lineHeight: 22,
  },
  objectivesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  objectiveBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  objectiveText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.base * 3) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.base,
  },
  deliverableCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  deliverableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  deliverableInfo: {
    flex: 1,
  },
  deliverableType: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  deliverableTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  deliverableQuantity: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  quantityValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  deliverableDescription: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
  },
  deliverableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliverablePrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  requiredBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  requiredText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  platformContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  platformText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  nicheContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  nicheBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  nicheText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  timelineCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
    marginRight: Spacing.base,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: Typography.fontSize.sm,
  },
  timelineValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.border.default,
    marginLeft: 5,
    marginVertical: Spacing.xs,
  },
  filterScroll: {
    maxHeight: 50,
    marginBottom: Spacing.base,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
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
  applicationsList: {
    flex: 1,
  },
  applicationCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  applicationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[200],
  },
  applicationInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  applicationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applicationName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  applicationUsername: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  applicationStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  applicationStatText: {
    fontSize: Typography.fontSize.xs,
  },
  applicationStatDivider: {
    fontSize: Typography.fontSize.xs,
  },
  applicationStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  applicationStatusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'capitalize',
  },
  applicationMessage: {
    marginTop: Spacing.base,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  applicationMessageText: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  applicationPrice: {},
  applicationPriceLabel: {
    fontSize: Typography.fontSize.xs,
  },
  applicationPriceValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  rejectButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  acceptButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.inverse,
  },
  viewProfileButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  viewProfileText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  influencerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  influencerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[200],
  },
  influencerInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  influencerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  influencerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  influencerUsername: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  influencerStats: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xs,
  },
  influencerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  influencerStatText: {
    fontSize: Typography.fontSize.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: (SCREEN_WIDTH - Spacing.base * 3) / 2,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.xs,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  costCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  costLabel: {
    fontSize: Typography.fontSize.sm,
  },
  costValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
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
  actionBar: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  actionButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  secondaryActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
