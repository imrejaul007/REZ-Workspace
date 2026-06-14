/**
 * Campaigns List - View all merchant campaigns
 * List, filter and manage influencer marketing campaigns
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { campaignService, helpers as influencerHelpers } from '@/services/api/influencer';
import type { Campaign, CampaignStatus, CampaignFilters } from '@/types/influencer';

const STATUS_FILTERS: { value: CampaignStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export default function CampaignsList() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build filters
  const filters: CampaignFilters = useMemo(() => {
    return {
      search: searchQuery || undefined,
      status: statusFilter !== 'all' ? [statusFilter] : undefined,
      limit: 20,
    };
  }, [searchQuery, statusFilter]);

  // Fetch campaigns
  const {
    data: campaignsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => campaignService.listCampaigns(filters),
  });

  const campaigns = campaignsData?.items || [];
  const pagination = campaignsData?.pagination;

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

  // Render campaign card
  const renderCampaignCard = useCallback(
    ({ item }: { item: Campaign }) => (
      <TouchableOpacity
        style={[
          styles.campaignCard,
          { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
        ]}
        onPress={() => router.push(`/influencer/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.campaignDate, { color: Colors.text.tertiary }]}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>

        <Text
          style={[styles.campaignName, { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        <Text
          style={[styles.campaignDescription, { color: Colors.text.secondary }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={14} color={Colors.text.tertiary} />
            <Text style={[styles.statText, { color: Colors.text.secondary }]}>
              {item.applications?.length || 0} applications
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success[500]} />
            <Text style={[styles.statText, { color: Colors.text.secondary }]}>
              {item.acceptedInfluencers?.length || 0} accepted
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.platformRow}>
            {item.platforms.slice(0, 3).map((platform) => (
              <Ionicons
                key={platform}
                name={influencerHelpers.getPlatformIcon(platform) as unknown}
                size={16}
                color={Colors.text.tertiary}
                style={styles.platformIcon}
              />
            ))}
            {item.platforms.length > 3 && (
              <Text style={[styles.morePlatforms, { color: Colors.text.tertiary }]}>
                +{item.platforms.length - 3}
              </Text>
            )}
          </View>
          <Text style={[styles.budgetText, { color: Colors.primary[500] }]}>
            {influencerHelpers.formatPrice(item.budget.total)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [router, scheme]
  );

  // Loading state
  if (isLoading && !campaigns.length) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.gray[50] }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading campaigns...</Text>
      </View>
    );
  }

  // Error state
  if (error && !campaigns.length) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.gray[50] }]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.errorTitle}>Unable to load campaigns</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
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
      {/* Search Bar */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={Colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary },
          ]}
          placeholder="Search campaigns..."
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === item.value && styles.filterChipActive,
                {
                  backgroundColor:
                    statusFilter === item.value
                      ? Colors.primary[500]
                      : scheme === 'dark'
                      ? Colors.gray[800]
                      : Colors.card,
                },
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      statusFilter === item.value
                        ? Colors.text.inverse
                        : Colors.text.secondary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsText, { color: Colors.text.secondary }]}>
          {pagination?.total || 0} campaigns
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: Colors.primary[500] }]}
          onPress={() => router.push('/influencer/create')}
        >
          <Ionicons name="add" size={18} color={Colors.text.inverse} />
          <Text style={styles.createButtonText}>New Campaign</Text>
        </TouchableOpacity>
      </View>

      {/* Campaign List */}
      <FlatList
        data={campaigns}
        renderItem={renderCampaignCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={Colors.text.tertiary} />
            <Text style={[styles.emptyTitle, { color: Colors.text.primary }]}>
              No campaigns found
            </Text>
            <Text style={[styles.emptyMessage, { color: Colors.text.secondary }]}>
              {statusFilter !== 'all'
                ? 'Try changing your filter'
                : 'Create your first influencer campaign'}
            </Text>
            {statusFilter === 'all' && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: Colors.primary[500] }]}
                onPress={() => router.push('/influencer/create')}
              >
                <Text style={styles.emptyButtonText}>Create Campaign</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  retryText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.primary[500],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    height: 48,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
  },
  filterContainer: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  resultsText: {
    fontSize: Typography.fontSize.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  createButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
  },
  campaignCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  campaignDate: {
    fontSize: Typography.fontSize.xs,
  },
  campaignName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.xs,
  },
  campaignDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: Typography.fontSize.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    marginRight: 4,
    opacity: 0.7,
  },
  morePlatforms: {
    fontSize: Typography.fontSize.xs,
  },
  budgetText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
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
  emptyButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
