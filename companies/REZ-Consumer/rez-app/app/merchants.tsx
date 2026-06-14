// @ts-nocheck
/**
 * Merchants Discovery Screen
 * Browse and search merchants across all industries
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMerchantDiscovery, type Merchant, type IndustryType } from '@/hooks/useREZMerchant';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

// Screen dimensions
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.base * 2;

// Industry filters
const INDUSTRIES: { label: string; value: IndustryType | 'all'; icon: string }[] = [
  { label: 'All', value: 'all', icon: '🏪' },
  { label: 'Restaurant', value: 'restaurant', icon: '🍽️' },
  { label: 'Hotel', value: 'hotel', icon: '🏨' },
  { label: 'Retail', value: 'retail', icon: '🛒' },
  { label: 'Grocery', value: 'grocery', icon: '🛍️' },
  { label: 'Salon', value: 'salon', icon: '💇' },
  { label: 'Healthcare', value: 'healthcare', icon: '🏥' },
  { label: 'Fitness', value: 'fitness', icon: '💪' },
];

// Sort options
const SORT_OPTIONS = [
  { label: 'Top Rated', value: 'rating' as const },
  { label: 'Nearby', value: 'distance' as const },
  { label: 'Name A-Z', value: 'name' as const },
];

export default function MerchantsScreen() {
  const router = useRouter();
  const {
    merchants,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedIndustry,
    setSelectedIndustry,
    sortBy,
    setSortBy,
  } = useMerchantDiscovery();

  const [showSortOptions, setShowSortOptions] = useState(false);

  const handleMerchantPress = useCallback((merchant: Merchant) => {
    router.push(`/merchant/${merchant.id}`);
  }, [router]);

  const renderIndustryFilter = useCallback(({ item }: { item: typeof INDUSTRIES[0] }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedIndustry === item.value && styles.filterChipActive,
      ]}
      onPress={() => setSelectedIndustry(item.value)}
      activeOpacity={0.7}
    >
      <Text style={styles.filterIcon}>{item.icon}</Text>
      <Text
        style={[
          styles.filterLabel,
          selectedIndustry === item.value && styles.filterLabelActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  ), [selectedIndustry, setSelectedIndustry]);

  const renderMerchantCard = useCallback(({ item }: { item: Merchant }) => (
    <TouchableOpacity
      style={styles.merchantCard}
      onPress={() => handleMerchantPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Cover Image or Placeholder */}
        <View style={styles.imageContainer}>
          {item.coverImage || item.logo ? (
            <Image
              source={{ uri: item.coverImage || item.logo }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>
                {getIndustryEmoji(item.industry)}
              </Text>
            </View>
          )}
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>

        {/* Merchant Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.merchantName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                {item.reviewCount && (
                  <Text style={styles.reviewCount}>({item.reviewCount})</Text>
                )}
              </View>
            )}
          </View>

          <Text style={styles.industryLabel}>
            {getIndustryLabel(item.industry)}
          </Text>

          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {item.city || item.address || 'Location not available'}
              {item.distance != null && ` • ${item.distance.toFixed(1)} km`}
            </Text>
          </View>

          {item.priceRange && (
            <Text style={styles.priceRange}>{item.priceRange}</Text>
          )}

          {item.isOpen !== undefined && (
            <View style={[styles.statusBadge, item.isOpen ? styles.openBadge : styles.closedBadge]}>
              <Text style={[styles.statusText, item.isOpen ? styles.openText : styles.closedText]}>
                {item.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleMerchantPress]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search merchants..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Button */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortOptions(!showSortOptions)}
      >
        <Text style={styles.sortIcon}>⇅</Text>
        <Text style={styles.sortLabel}>Sort</Text>
      </TouchableOpacity>
    </View>
  ), [searchQuery, setSearchQuery, showSortOptions, setShowSortOptions]);

  const renderSortOptions = useCallback(() => {
    if (!showSortOptions) return null;
    return (
      <View style={styles.sortOptionsContainer}>
        {SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortOption,
              sortBy === option.value && styles.sortOptionActive,
            ]}
            onPress={() => {
              setSortBy(option.value);
              setShowSortOptions(false);
            }}
          >
            <Text
              style={[
                styles.sortOptionText,
                sortBy === option.value && styles.sortOptionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [showSortOptions, sortBy, setSortBy]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No merchants found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : 'Try adjusting your filters'}
      </Text>
    </View>
  ), [searchQuery]);

  const renderError = useCallback(() => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>Failed to load merchants</Text>
      <Text style={styles.errorSubtitle}>{error?.message || 'Something went wrong'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  ), [error, refetch]);

  if (isLoading && merchants.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Finding merchants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find great places nearby</Text>
      </View>

      {/* Search and Sort */}
      {renderHeader()}
      {renderSortOptions()}

      {/* Industry Filters */}
      <FlatList
        data={INDUSTRIES}
        keyExtractor={(item) => item.value}
        renderItem={renderIndustryFilter}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersList}
      />

      {/* Results */}
      {error && merchants.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={merchants}
          keyExtractor={(item) => item.id}
          renderItem={renderMerchantCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          }
          onEndReached={() => {
            // Could implement pagination here
          }}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

// Helper functions
function getIndustryEmoji(industry: IndustryType): string {
  const emojis: Record<string, string> = {
    restaurant: '🍽️',
    hotel: '🏨',
    retail: '🛒',
    grocery: '🛍️',
    salon: '💇',
    healthcare: '🏥',
    fitness: '💪',
    real_estate: '🏠',
    travel: '✈️',
    other: '🏪',
  };
  return emojis[industry] || '🏪';
}

function getIndustryLabel(industry: IndustryType): string {
  const labels: Record<string, string> = {
    restaurant: 'Restaurant',
    hotel: 'Hotel',
    retail: 'Retail Store',
    grocery: 'Grocery',
    salon: 'Salon & Spa',
    healthcare: 'Healthcare',
    fitness: 'Fitness',
    real_estate: 'Real Estate',
    travel: 'Travel',
    other: 'Business',
  };
  return labels[industry] || 'Business';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  titleContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.xs,
  },
  sortIcon: {
    fontSize: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
  },
  sortOptionActive: {
    backgroundColor: colors.primary[500],
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  sortOptionTextActive: {
    color: colors.text.white,
    fontWeight: '600',
  },
  filtersList: {
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary[500],
  },
  filterIcon: {
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterLabelActive: {
    color: colors.text.white,
  },
  listContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  merchantCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    ...shadows.medium,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  coverImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.tint.slate,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.tint.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: colors.text.white,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingStar: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  industryLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 13,
    color: colors.text.tertiary,
    flex: 1,
  },
  priceRange: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  openBadge: {
    backgroundColor: colors.successScale[100],
  },
  closedBadge: {
    backgroundColor: colors.errorScale[100],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  openText: {
    color: colors.success,
  },
  closedText: {
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
