// @ts-nocheck
/**
 * Restaurants Screen
 * Browse and search restaurants with menu integration
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRestaurantDiscovery, type Restaurant } from '@/hooks/useREZMerchant';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

// Screen dimensions
const { width } = Dimensions.get('window');

// Cuisine filters
const CUISINES = [
  'All',
  'Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Japanese',
  'Thai',
  'American',
  'Continental',
  'Fast Food',
  'Cafe',
  'Bakery',
  'Desserts',
];

// Price range filters
const PRICE_RANGES = [
  { label: 'All', value: '' },
  { label: '$', value: 'budget' },
  { label: '$$', value: 'mid' },
  { label: '$$$', value: 'premium' },
  { label: '$$$$', value: 'luxury' },
];

// Sort options
const SORT_OPTIONS = [
  { label: 'Top Rated', value: 'rating' },
  { label: 'Fastest', value: 'delivery' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export default function RestaurantsScreen() {
  const router = useRouter();
  const {
    restaurants,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedCuisine,
    setSelectedCuisine,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
  } = useRestaurantDiscovery();

  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleRestaurantPress = useCallback((restaurant: Restaurant) => {
    router.push(`/restaurant/${restaurant.id}`);
  }, [router]);

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Filter by rating
    if (minRating > 0) {
      result = result.filter((r) => (r.rating || 0) >= minRating);
    }

    // Sort would go here

    return result;
  }, [restaurants, minRating]);

  const renderCuisineFilter = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.cuisineChip,
        selectedCuisine === item.toLowerCase() && styles.cuisineChipActive,
      ]}
      onPress={() => setSelectedCuisine(item === 'All' ? '' : item.toLowerCase())}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.cuisineLabel,
          selectedCuisine === item.toLowerCase() && styles.cuisineLabelActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  ), [selectedCuisine, setSelectedCuisine]);

  const renderRestaurantCard = useCallback(({ item }: { item: Restaurant }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => handleRestaurantPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardImageContainer}>
        {item.coverImage || item.logo ? (
          <Image
            source={{ uri: item.coverImage || item.logo }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}
        {item.featured && (
          <View style={styles.promotedBadge}>
            <Text style={styles.promotedText}>Promoted</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount || 0})</Text>
            </View>
          )}
        </View>

        <View style={styles.cuisineRow}>
          {item.cuisine?.slice(0, 3).map((c, index) => (
            <Text key={index} style={styles.cuisineText}>
              {c}{index < Math.min(item.cuisine?.length || 0, 3) - 1 ? ' • ' : ''}
            </Text>
          ))}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🕒</Text>
            <Text style={styles.infoText}>
              {item.deliveryTime ? `${item.deliveryTime} min` : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚴</Text>
            <Text style={styles.infoText}>
              {item.deliveryFee ? `₹${item.deliveryFee}` : 'Free'}
            </Text>
          </View>
          {item.minOrder && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📦</Text>
              <Text style={styles.infoText}>Min ₹{item.minOrder}</Text>
            </View>
          )}
        </View>

        {item.priceRange && (
          <Text style={styles.priceRange}>{item.priceRange}</Text>
        )}

        {item.isOpen !== undefined && (
          <View style={[styles.statusBadge, item.isOpen ? styles.openBadge : styles.closedBadge]}>
            <Text style={[styles.statusText, item.isOpen ? styles.openText : styles.closedText]}>
              {item.isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [handleRestaurantPress]);

  const renderFilters = useCallback(() => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersPanel}>
        <Text style={styles.filterTitle}>Filters</Text>

        {/* Rating Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Minimum Rating</Text>
          <View style={styles.ratingFilters}>
            {[0, 3, 3.5, 4, 4.5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingChip,
                  minRating === rating && styles.ratingChipActive,
                ]}
                onPress={() => setMinRating(rating)}
              >
                <Text
                  style={[
                    styles.ratingChipText,
                    minRating === rating && styles.ratingChipTextActive,
                  ]}
                >
                  {rating === 0 ? 'Any' : `${rating}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Price Range</Text>
          <View style={styles.priceFilters}>
            {PRICE_RANGES.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.priceChip,
                  priceRange === range.value && styles.priceChipActive,
                ]}
                onPress={() => setPriceRange(range.value)}
              >
                <Text
                  style={[
                    styles.priceChipText,
                    priceRange === range.value && styles.priceChipTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => setShowFilters(false)}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    );
  }, [showFilters, minRating, setMinRating, priceRange, setPriceRange]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🍽️</Text>
      <Text style={styles.emptyTitle}>No restaurants found</Text>
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
      <Text style={styles.errorTitle}>Failed to load restaurants</Text>
      <Text style={styles.errorSubtitle}>{error?.message || 'Something went wrong'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  ), [error, refetch]);

  if (isLoading && restaurants.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Finding restaurants...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Restaurants</Text>
        <Text style={styles.subtitle}>Discover great food nearby</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants or cuisines..."
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

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          <Text style={styles.filterLabel}>Filters</Text>
          {(minRating > 0 || priceRange) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {[minRating > 0 && 'Rating', priceRange && 'Price'].filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text style={styles.sortIcon}>⇅</Text>
          <Text style={styles.sortLabel}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      {showSortOptions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortOptionsContainer}
        >
          {SORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => setShowSortOptions(false)}
            >
              <Text style={styles.sortOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Filters Panel */}
      {renderFilters()}

      {/* Cuisine Filters */}
      <FlatList
        data={CUISINES}
        keyExtractor={(item) => item}
        renderItem={renderCuisineFilter}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cuisineFiltersContainer}
        style={styles.cuisineFiltersList}
      />

      {/* Results Count */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCount}>
          {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Restaurant List */}
      {error && filteredRestaurants.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={renderRestaurantCard}
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
        />
      )}
    </View>
  );
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
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
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.xs,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  filterBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.xs,
  },
  sortIcon: {
    fontSize: 14,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  sortOptionsContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  sortOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  filtersPanel: {
    backgroundColor: colors.background.secondary,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.base,
  },
  ratingFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
  },
  ratingChipActive: {
    backgroundColor: colors.primary[500],
  },
  ratingChipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  ratingChipTextActive: {
    color: colors.text.white,
    fontWeight: '600',
  },
  priceFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  priceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
  },
  priceChipActive: {
    backgroundColor: colors.primary[500],
  },
  priceChipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  priceChipTextActive: {
    color: colors.text.white,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cuisineFiltersList: {
    maxHeight: 50,
  },
  cuisineFiltersContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  cuisineChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  cuisineChipActive: {
    backgroundColor: colors.primary[500],
  },
  cuisineLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  cuisineLabelActive: {
    color: colors.text.white,
  },
  resultsInfo: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  listContainer: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  restaurantCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    ...shadows.medium,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.tint.slate,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.tint.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  promotedBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  promotedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 2,
  },
  ratingStar: {
    fontSize: 12,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cuisineText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoIcon: {
    fontSize: 12,
  },
  infoText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  priceRange: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    fontSize: 64,
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