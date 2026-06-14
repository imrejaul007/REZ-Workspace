/**
 * Influencer Marketplace - Main List View
 * Browse and search influencers for marketing campaigns
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/react-native-flash-list';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { influencerService, helpers as influencerHelpers } from '@/services/api/influencer';
import type {
  Influencer,
  InfluencerFilters,
  InfluencerNiche,
  InfluencerPlatform,
} from '@/types/influencer';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.base * 2;

const NICHE_OPTIONS: { value: InfluencerNiche; label: string }[] = [
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'tech', label: 'Tech' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'business', label: 'Business' },
];

const PLATFORM_OPTIONS: { value: InfluencerPlatform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { value: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'logo-tiktok' },
  { value: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
];

const FOLLOWER_RANGES = [
  { min: 0, max: 10000, label: 'Under 10K' },
  { min: 10000, max: 50000, label: '10K - 50K' },
  { min: 50000, max: 100000, label: '50K - 100K' },
  { min: 100000, max: 500000, label: '100K - 500K' },
  { min: 500000, max: 1000000, label: '500K - 1M' },
  { min: 1000000, max: Infinity, label: 'Above 1M' },
];

const SORT_OPTIONS = [
  { value: 'followers', label: 'Most Followers' },
  { value: 'engagement_rate', label: 'Highest Engagement' },
  { value: 'rating', label: 'Best Rating' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

export default function InfluencerMarketplace() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<InfluencerNiche[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<InfluencerPlatform[]>([]);
  const [selectedFollowerRange, setSelectedFollowerRange] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>('followers');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Build filters object
  const filters: InfluencerFilters = useMemo(() => {
    const range = selectedFollowerRange !== null ? FOLLOWER_RANGES[selectedFollowerRange] : null;
    return {
      search: searchQuery || undefined,
      niche: selectedNiches.length > 0 ? selectedNiches : undefined,
      platform: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      minFollowers: range?.min,
      maxFollowers: range?.max !== Infinity ? range?.max : undefined,
      sortBy: selectedSort as InfluencerFilters['sortBy'],
      sortOrder: selectedSort.includes('price') ? 'asc' : 'desc',
      limit: 20,
    };
  }, [searchQuery, selectedNiches, selectedPlatforms, selectedFollowerRange, selectedSort]);

  // Fetch influencers
  const {
    data: influencersData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['influencers', filters],
    queryFn: async () => {
      try {
        return await influencerService.listInfluencers(filters);
      } catch (err) {
        logger.error('[InfluencerMarketplace] Failed to fetch influencers', err);
        throw err;
      }
    },
  });

  const influencers = influencersData?.items || [];
  const pagination = influencersData?.pagination;

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Toggle niche selection
  const toggleNiche = useCallback((niche: InfluencerNiche) => {
    setSelectedNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }, []);

  // Toggle platform selection
  const togglePlatform = useCallback((platform: InfluencerPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedNiches([]);
    setSelectedPlatforms([]);
    setSelectedFollowerRange(null);
    setSearchQuery('');
  }, []);

  // Navigate to influencer profile
  const navigateToInfluencer = useCallback(
    (influencer: Influencer) => {
      router.push(`/influencer/influencer/${influencer.id}`);
    },
    [router]
  );

  // Count active filters
  const activeFilterCount =
    selectedNiches.length +
    selectedPlatforms.length +
    (selectedFollowerRange !== null ? 1 : 0);

  // Render influencer card
  const renderInfluencerCard = useCallback(
    ({ item }: { item: Influencer }) => (
      <TouchableOpacity
        style={[
          styles.influencerCard,
          {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
          },
        ]}
        onPress={() => navigateToInfluencer(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <View style={styles.avatarBadge}>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />
            )}
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.influencerName,
                { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.rating >= 4.5 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.username,
              { color: scheme === 'dark' ? Colors.gray[400] : Colors.text.tertiary },
            ]}
            numberOfLines={1}
          >
            @{item.username}
          </Text>

          <View style={styles.nicheContainer}>
            {item.niche.slice(0, 2).map((niche) => (
              <View
                key={niche}
                style={[
                  styles.nicheBadge,
                  { backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.primary[50] },
                ]}
              >
                <Text
                  style={[
                    styles.nicheText,
                    { color: scheme === 'dark' ? Colors.primary[300] : Colors.primary[600] },
                  ]}
                >
                  {influencerHelpers.getNicheDisplayName(niche)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons
                name="people"
                size={14}
                color={scheme === 'dark' ? Colors.gray[400] : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary },
                ]}
              >
                {influencerHelpers.formatFollowerCount(item.followerCount)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="heart"
                size={14}
                color={scheme === 'dark' ? Colors.gray[400] : Colors.text.secondary}
              />
              <Text
                style={[
                  styles.statValue,
                  { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary },
                ]}
              >
                {influencerHelpers.formatEngagementRate(item.engagementRate)}
              </Text>
            </View>
            <View style={styles.platformIcons}>
              {item.platforms.slice(0, 3).map((platform) => (
                <Ionicons
                  key={platform}
                  name={influencerHelpers.getPlatformIcon(platform) as unknown}
                  size={14}
                  color={scheme === 'dark' ? Colors.gray[400] : Colors.text.secondary}
                  style={styles.platformIcon}
                />
              ))}
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text
              style={[
                styles.priceLabel,
                { color: scheme === 'dark' ? Colors.gray[400] : Colors.text.tertiary },
              ]}
            >
              From
            </Text>
            <Text
              style={[
                styles.priceValue,
                { color: scheme === 'dark' ? Colors.primary[300] : Colors.primary[500] },
              ]}
            >
              {influencerHelpers.formatPrice(item.minPricePerPost)}
            </Text>
            <Text
              style={[
                styles.priceLabel,
                { color: scheme === 'dark' ? Colors.gray[400] : Colors.text.tertiary },
              ]}
            >
              /post
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigateToInfluencer, scheme]
  );

  // Loading state
  if (isLoading && !influencers.length) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.gray[50] }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading influencers...</Text>
      </View>
    );
  }

  // Error state
  if (error && !influencers.length) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: Colors.gray[50] }]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.error[500]} />
        <Text style={styles.errorTitle}>Unable to load influencers</Text>
        <Text style={styles.errorMessage}>
          Please check your connection and try again
        </Text>
        <Button title="Try Again" onPress={() => refetch()} />
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
          {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={scheme === 'dark' ? Colors.gray[400] : Colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
            },
          ]}
          placeholder="Search influencers..."
          placeholderTextColor={Colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options"
            size={20}
            color={activeFilterCount > 0 ? Colors.primary[500] : Colors.text.secondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortContainer}
        contentContainerStyle={styles.sortContent}
      >
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortChip,
              selectedSort === option.value && styles.sortChipActive,
              {
                backgroundColor:
                  selectedSort === option.value
                    ? Colors.primary[500]
                    : scheme === 'dark'
                    ? Colors.gray[800]
                    : Colors.card,
              },
            ]}
            onPress={() => setSelectedSort(option.value)}
          >
            <Text
              style={[
                styles.sortChipText,
                {
                  color:
                    selectedSort === option.value
                      ? Colors.text.inverse
                      : scheme === 'dark'
                      ? Colors.gray[300]
                      : Colors.text.secondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {selectedNiches.map((niche) => (
              <TouchableOpacity
                key={niche}
                style={[styles.activeFilterChip, { backgroundColor: Colors.primary[100] }]}
                onPress={() => toggleNiche(niche)}
              >
                <Text style={[styles.activeFilterText, { color: Colors.primary[700] }]}>
                  {influencerHelpers.getNicheDisplayName(niche)}
                </Text>
                <Ionicons name="close" size={14} color={Colors.primary[700]} />
              </TouchableOpacity>
            ))}
            {selectedPlatforms.map((platform) => (
              <TouchableOpacity
                key={platform}
                style={[styles.activeFilterChip, { backgroundColor: Colors.secondary[100] }]}
                onPress={() => togglePlatform(platform)}
              >
                <Text style={[styles.activeFilterText, { color: Colors.secondary[700] }]}>
                  {influencerHelpers.getPlatformDisplayName(platform)}
                </Text>
                <Ionicons name="close" size={14} color={Colors.secondary[700]} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.clearFiltersButton]}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text
          style={[
            styles.resultsText,
            { color: scheme === 'dark' ? Colors.gray[400] : Colors.text.secondary },
          ]}
        >
          {pagination?.total || 0} influencers found
        </Text>
        <TouchableOpacity
          style={styles.createCampaignButton}
          onPress={() => router.push('/influencer/create')}
        >
          <Ionicons name="add" size={18} color={Colors.text.inverse} />
          <Text style={styles.createCampaignText}>Create Campaign</Text>
        </TouchableOpacity>
      </View>

      {/* Influencer List */}
      <FlatList
        data={influencers}
        renderItem={renderInfluencerCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No influencers found"
            message="Try adjusting your filters or search terms"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        }
        onEndReached={() => {
          if (pagination?.hasNext && !isFetching) {
            // Load more logic would go here
          }
        }}
        onEndReachedThreshold={0.5}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: scheme === 'dark' ? Colors.gray[900] : Colors.gray[50] },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary },
              ]}
            >
              Filters
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Niche Filter */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: scheme === 'dark' ? Colors.gray[200] : Colors.text.primary },
                ]}
              >
                Niche
              </Text>
              <View style={styles.filterChips}>
                {NICHE_OPTIONS.map((niche) => (
                  <TouchableOpacity
                    key={niche.value}
                    style={[
                      styles.filterChip,
                      selectedNiches.includes(niche.value) && styles.filterChipActive,
                      {
                        backgroundColor: selectedNiches.includes(niche.value)
                          ? Colors.primary[500]
                          : scheme === 'dark'
                          ? Colors.gray[800]
                          : Colors.card,
                      },
                    ]}
                    onPress={() => toggleNiche(niche.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: selectedNiches.includes(niche.value)
                            ? Colors.text.inverse
                            : scheme === 'dark'
                            ? Colors.gray[300]
                            : Colors.text.secondary,
                        },
                      ]}
                    >
                      {niche.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Platform Filter */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: scheme === 'dark' ? Colors.gray[200] : Colors.text.primary },
                ]}
              >
                Platform
              </Text>
              <View style={styles.filterChips}>
                {PLATFORM_OPTIONS.map((platform) => (
                  <TouchableOpacity
                    key={platform.value}
                    style={[
                      styles.filterChip,
                      selectedPlatforms.includes(platform.value) && styles.filterChipActive,
                      {
                        backgroundColor: selectedPlatforms.includes(platform.value)
                          ? Colors.primary[500]
                          : scheme === 'dark'
                          ? Colors.gray[800]
                          : Colors.card,
                      },
                    ]}
                    onPress={() => togglePlatform(platform.value)}
                  >
                    <Ionicons
                      name={platform.icon as unknown}
                      size={16}
                      color={
                        selectedPlatforms.includes(platform.value)
                          ? Colors.text.inverse
                          : scheme === 'dark'
                          ? Colors.gray[300]
                          : Colors.text.secondary
                      }
                      style={styles.platformChipIcon}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: selectedPlatforms.includes(platform.value)
                            ? Colors.text.inverse
                            : scheme === 'dark'
                            ? Colors.gray[300]
                            : Colors.text.secondary,
                        },
                      ]}
                    >
                      {platform.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Follower Range Filter */}
            <View style={styles.filterSection}>
              <Text
                style={[
                  styles.filterSectionTitle,
                  { color: scheme === 'dark' ? Colors.gray[200] : Colors.text.primary },
                ]}
              >
                Follower Count
              </Text>
              <View style={styles.filterChips}>
                {FOLLOWER_RANGES.map((range, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.filterChip,
                      selectedFollowerRange === index && styles.filterChipActive,
                      {
                        backgroundColor: selectedFollowerRange === index
                          ? Colors.primary[500]
                          : scheme === 'dark'
                          ? Colors.gray[800]
                          : Colors.card,
                      },
                    ]}
                    onPress={() =>
                      setSelectedFollowerRange(
                        selectedFollowerRange === index ? null : index
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: selectedFollowerRange === index
                            ? Colors.text.inverse
                            : scheme === 'dark'
                            ? Colors.gray[300]
                            : Colors.text.secondary,
                        },
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={[
                styles.clearButton,
                { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.gray[100] },
              ]}
              onPress={clearFilters}
            >
              <Text
                style={[
                  styles.clearButtonText,
                  { color: scheme === 'dark' ? Colors.gray[200] : Colors.text.secondary },
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: Colors.primary[500] }]}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    height: '100%',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[50],
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },
  sortContainer: {
    maxHeight: 44,
  },
  sortContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  sortChipActive: {
    backgroundColor: Colors.primary[500],
  },
  sortChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  activeFiltersContainer: {
    marginTop: Spacing.sm,
  },
  activeFiltersContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    gap: 4,
  },
  activeFilterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.error[500],
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
  createCampaignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  createCampaignText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  influencerCard: {
    width: (CARD_WIDTH - Spacing.base) / 2,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardHeader: {
    alignItems: 'center',
    paddingTop: Spacing.base,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray[200],
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: Colors.card,
    borderRadius: 10,
  },
  cardContent: {
    padding: Spacing.base,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  influencerName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.warning[600],
  },
  username: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  nicheContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
    gap: 4,
  },
  nicheBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  nicheText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    gap: Spacing.base,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  platformIcons: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 4,
  },
  platformIcon: {
    opacity: 0.7,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: Spacing.base,
  },
  priceLabel: {
    fontSize: Typography.fontSize.xs,
  },
  priceValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.base,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.base,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  platformChipIcon: {
    marginRight: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  clearButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  clearButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  applyButton: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  applyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },
});
