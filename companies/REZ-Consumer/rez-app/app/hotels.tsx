// @ts-nocheck
/**
 * Hotels Screen
 * Browse and search hotels for booking
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
import { useHotelDiscovery, type Hotel } from '@/hooks/useREZMerchant';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

// Screen dimensions
const { width } = Dimensions.get('window');

// Popular destinations
const DESTINATIONS = [
  'All',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Goa',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Jaipur',
];

// Star ratings
const STAR_RATINGS = [
  { label: 'Any', value: 0 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5', value: 5 },
];

// Price filters
const PRICE_FILTERS = [
  { label: 'Any', min: 0, max: 0 },
  { label: 'Under ₹2,000', min: 0, max: 2000 },
  { label: '₹2,000 - 5,000', min: 2000, max: 5000 },
  { label: '₹5,000 - 10,000', min: 5000, max: 10000 },
  { label: 'Above ₹10,000', min: 10000, max: 0 },
];

export default function HotelsScreen() {
  const router = useRouter();
  const {
    hotels,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    minRating,
    setMinRating,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
  } = useHotelDiscovery();

  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high'>('rating');

  const handleHotelPress = useCallback((hotel: Hotel) => {
    router.push(`/hotel/${hotel.id}`);
  }, [router]);

  const filteredHotels = useMemo(() => {
    let result = [...hotels];

    // Filter by rating
    if (minRating > 0) {
      result = result.filter((h) => (h.rating || 0) >= minRating);
    }

    // Filter by price
    if (minPrice > 0) {
      result = result.filter((h) => (h.priceRange?.min || 0) >= minPrice);
    }
    if (maxPrice > 0) {
      result = result.filter((h) => (h.priceRange?.max || Infinity) <= maxPrice);
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.priceRange?.min || 0) - (b.priceRange?.min || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.priceRange?.min || 0) - (a.priceRange?.min || 0));
        break;
    }

    return result;
  }, [hotels, minRating, minPrice, maxPrice, sortBy]);

  const renderDestinationFilter = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.destinationChip,
        selectedCity === (item === 'All' ? '' : item) && styles.destinationChipActive,
      ]}
      onPress={() => setSelectedCity(item === 'All' ? '' : item)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.destinationLabel,
          selectedCity === (item === 'All' ? '' : item) && styles.destinationLabelActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  ), [selectedCity, setSelectedCity]);

  const renderHotelCard = useCallback(({ item }: { item: Hotel }) => (
    <TouchableOpacity
      style={styles.hotelCard}
      onPress={() => handleHotelPress(item)}
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
            <Text style={styles.placeholderEmoji}>🏨</Text>
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

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.hotelName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingValue}>{item.rating.toFixed(1)}</Text>
              {item.reviewCount && (
                <Text style={styles.reviewCount}>({item.reviewCount})</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {[item.city, item.state].filter(Boolean).join(', ')}
          </Text>
        </View>

        {/* Room Types Preview */}
        {item.roomTypes && item.roomTypes.length > 0 && (
          <View style={styles.roomTypesPreview}>
            <Text style={styles.roomTypesLabel}>
              {item.roomTypes.length} room type{item.roomTypes.length !== 1 ? 's' : ''} available
            </Text>
          </View>
        )}

        {/* Price Range */}
        {item.priceRange && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>
              ₹{item.priceRange.min.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.priceSuffix}>/night</Text>
          </View>
        )}

        {/* Amenities Preview */}
        {item.amenities && item.amenities.length > 0 && (
          <View style={styles.amenitiesPreview}>
            {item.amenities.slice(0, 4).map((amenity, index) => (
              <Text key={index} style={styles.amenityText}>
                {getAmenityEmoji(amenity)} {amenity}
              </Text>
            ))}
            {item.amenities.length > 4 && (
              <Text style={styles.moreAmenities}>
                +{item.amenities.length - 4} more
              </Text>
            )}
          </View>
        )}

        {/* Policies */}
        <View style={styles.policiesRow}>
          {item.checkInTime && (
            <View style={styles.policyItem}>
              <Text style={styles.policyIcon}>🕐</Text>
              <Text style={styles.policyText}>Check-in: {item.checkInTime}</Text>
            </View>
          )}
          {item.checkOutTime && (
            <View style={styles.policyItem}>
              <Text style={styles.policyIcon}>🕐</Text>
              <Text style={styles.policyText}>Check-out: {item.checkOutTime}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [handleHotelPress]);

  const renderFilters = useCallback(() => {
    if (!showFilters) return null;

    return (
      <View style={styles.filtersPanel}>
        <Text style={styles.filterTitle}>Filters</Text>

        {/* Star Rating */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Star Rating</Text>
          <View style={styles.ratingFilters}>
            {STAR_RATINGS.map((rating) => (
              <TouchableOpacity
                key={rating.value}
                style={[
                  styles.ratingChip,
                  minRating === rating.value && styles.ratingChipActive,
                ]}
                onPress={() => setMinRating(rating.value)}
              >
                <Text
                  style={[
                    styles.ratingChipText,
                    minRating === rating.value && styles.ratingChipTextActive,
                  ]}
                >
                  {rating.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Price per Night</Text>
          <View style={styles.priceFilters}>
            {PRICE_FILTERS.map((range, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.priceChip,
                  minPrice === range.min && maxPrice === range.max && styles.priceChipActive,
                ]}
                onPress={() => {
                  setMinPrice(range.min);
                  setMaxPrice(range.max);
                }}
              >
                <Text
                  style={[
                    styles.priceChipText,
                    minPrice === range.min && maxPrice === range.max && styles.priceChipTextActive,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setMinRating(0);
              setMinPrice(0);
              setMaxPrice(0);
            }}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [showFilters, minRating, setMinRating, minPrice, setMinPrice, maxPrice, setMaxPrice]);

  const renderSortOptions = useCallback(() => {
    if (!showSortOptions) return null;

    return (
      <View style={styles.sortOptionsContainer}>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'rating' && styles.sortOptionActive]}
          onPress={() => {
            setSortBy('rating');
            setShowSortOptions(false);
          }}
        >
          <Text style={[styles.sortOptionText, sortBy === 'rating' && styles.sortOptionTextActive]}>
            Top Rated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'price_low' && styles.sortOptionActive]}
          onPress={() => {
            setSortBy('price_low');
            setShowSortOptions(false);
          }}
        >
          <Text style={[styles.sortOptionText, sortBy === 'price_low' && styles.sortOptionTextActive]}>
            Price: Low to High
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortOption, sortBy === 'price_high' && styles.sortOptionActive]}
          onPress={() => {
            setSortBy('price_high');
            setShowSortOptions(false);
          }}
        >
          <Text style={[styles.sortOptionText, sortBy === 'price_high' && styles.sortOptionTextActive]}>
            Price: High to Low
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [showSortOptions, sortBy, setSortBy]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🏨</Text>
      <Text style={styles.emptyTitle}>No hotels found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCity
          ? 'Try adjusting your search or filters'
          : 'Check back later for more options'}
      </Text>
    </View>
  ), [searchQuery, selectedCity]);

  const renderError = useCallback(() => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>Failed to load hotels</Text>
      <Text style={styles.errorSubtitle}>{error?.message || 'Something went wrong'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    </View>
  ), [error, refetch]);

  if (isLoading && hotels.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Finding hotels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Hotels</Text>
        <Text style={styles.subtitle}>Find your perfect stay</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hotels or destinations..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButtonIcon}>
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
          {(minRating > 0 || minPrice > 0 || maxPrice > 0) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {[minRating > 0 && 'Star', (minPrice > 0 || maxPrice > 0) && 'Price'].filter(Boolean).length}
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
      {renderSortOptions()}

      {/* Filters Panel */}
      {renderFilters()}

      {/* Destination Filters */}
      <FlatList
        data={DESTINATIONS}
        keyExtractor={(item) => item}
        renderItem={renderDestinationFilter}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.destinationFiltersContainer}
        style={styles.destinationFiltersList}
      />

      {/* Results Count */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCount}>
          {filteredHotels.length} hotel{filteredHotels.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Hotel List */}
      {error && filteredHotels.length === 0 ? (
        renderError()
      ) : (
        <FlatList
          data={filteredHotels}
          keyExtractor={(item) => item.id}
          renderItem={renderHotelCard}
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

// Helper functions
function getAmenityEmoji(amenity: string): string {
  const amenityMap: Record<string, string> = {
    wifi: '📶',
    pool: '🏊',
    gym: '🏋️',
    spa: '💆',
    restaurant: '🍽️',
    parking: '🅿️',
    ac: '❄️',
    room_service: '🛎️',
    bar: '🍸',
    laundry: '🧺',
    business_center: '💼',
    airport_shuttle: '✈️',
  };
  const lowerAmenity = amenity.toLowerCase();
  for (const [key, emoji] of Object.entries(amenityMap)) {
    if (lowerAmenity.includes(key)) {
      return emoji;
    }
  }
  return '✓';
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
  clearButtonIcon: {
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
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  ratingFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    fontSize: 13,
    color: colors.text.secondary,
  },
  priceChipTextActive: {
    color: colors.text.white,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  clearButton: {
    flex: 1,
    backgroundColor: colors.tint.slate,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  destinationFiltersList: {
    maxHeight: 50,
  },
  destinationFiltersContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  destinationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.tint.slate,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  destinationChipActive: {
    backgroundColor: colors.primary[500],
  },
  destinationLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  destinationLabelActive: {
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
  hotelCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.base,
    ...shadows.medium,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: colors.tint.slate,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: colors.tint.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 14,
    color: colors.text.white,
    fontWeight: '700',
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
  hotelName: {
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  locationText: {
    fontSize: 14,
    color: colors.text.tertiary,
    flex: 1,
  },
  roomTypesPreview: {
    marginBottom: spacing.sm,
  },
  roomTypesLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginRight: spacing.xs,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[600],
  },
  priceSuffix: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft:2,
  },
  amenitiesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  amenityText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  moreAmenities: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  policiesRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  policyIcon: {
    fontSize: 12,
  },
  policyText: {
    fontSize: 12,
    color: colors.text.tertiary,
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
