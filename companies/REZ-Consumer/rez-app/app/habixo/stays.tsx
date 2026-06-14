// @ts-nocheck
// Habixo Stays Screen - Short-term vacation rentals with filter persistence
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  loadStaysFilters,
  saveStaysFilters,
  StaysFilter,
  DEFAULT_STAYS_FILTER,
  getActiveFilterCount,
} from '../services/filterPersistence';
import { withRetry, DEFAULT_RETRY_CONFIG } from '../services/apiRetry';

const MOCK_PROPERTIES = [
  {
    id: '1',
    title: 'Modern Apartment in Koramangala',
    location: 'Koramangala, Bangalore',
    price: 2500,
    rating: 4.8,
    reviews: 127,
    images: ['https://picsum.photos/400/300?random=1'],
    bedrooms: 2,
    bathrooms: 2,
    guests: 4,
    type: 'Entire Apartment',
    amenities: ['WiFi', 'AC', 'Kitchen', 'Pool'],
    host: { name: 'Rahul S.', rating: 4.9, responseRate: 98 },
  },
  {
    id: '2',
    title: 'Cozy Room in Indiranagar',
    location: 'Indiranagar, Bangalore',
    price: 1200,
    rating: 4.9,
    reviews: 89,
    images: ['https://picsum.photos/400/300?random=2'],
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    type: 'Private Room',
    amenities: ['WiFi', 'AC', 'Parking'],
    host: { name: 'Priya M.', rating: 5.0, responseRate: 100 },
  },
  {
    id: '3',
    title: 'Luxury Penthouse with Pool',
    location: 'Bandra, Mumbai',
    price: 8500,
    rating: 4.7,
    reviews: 56,
    images: ['https://picsum.photos/400/300?random=3'],
    bedrooms: 3,
    bathrooms: 3,
    guests: 6,
    type: 'Entire Place',
    amenities: ['WiFi', 'AC', 'Pool', 'Gym', 'Parking'],
    host: { name: 'Vikram J.', rating: 4.8, responseRate: 95 },
  },
  {
    id: '4',
    title: 'Beach Villa in Goa',
    location: 'Anjuna, Goa',
    price: 5500,
    rating: 4.9,
    reviews: 203,
    images: ['https://picsum.photos/400/300?random=4'],
    bedrooms: 4,
    bathrooms: 4,
    guests: 8,
    type: 'Villa',
    amenities: ['WiFi', 'AC', 'Pool', 'Beach Access', 'Kitchen'],
    host: { name: 'Ana G.', rating: 4.9, responseRate: 99 },
  },
];

const FILTERS = [
  { key: 'price', label: 'Price', icon: '💰' },
  { key: 'bedrooms', label: 'Bedrooms', icon: '🛏️' },
  { key: 'amenities', label: 'Amenities', icon: '✨' },
  { key: 'instantBook', label: 'Instant Book', icon: '⚡' },
  { key: 'superhost', label: 'Superhost', icon: '⭐' },
];

const SORT_OPTIONS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'rating', label: 'Rating' },
];

// Simulated API call with retry logic
async function fetchProperties(filters: StaysFilter): Promise<typeof MOCK_PROPERTIES> {
  return withRetry(async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_PROPERTIES;
  }, { maxRetries: 3, baseDelay: 1000 });
}

export default function HabixoStaysScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Filter state
  const [filters, setFilters] = useState<StaysFilter>(DEFAULT_STAYS_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Load saved filters on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await loadStaysFilters();
        setFilters(savedFilters);
        setActiveFilterCount(getActiveFilterCount(savedFilters));
      } catch (err) {
        logger.error('Failed to load filters:', err);
      }
    };
    loadFilters();
  }, []);

  // Fetch properties with retry
  const fetchPropertiesWithRetry = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await fetchProperties(filters);
      setProperties(data);
    } catch (err) {
      logger.error('Failed to fetch properties:', err);
      setError('Failed to load properties. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPropertiesWithRetry();
  }, [fetchPropertiesWithRetry]);

  // Save filters when changed
  const updateFilters = async (newFilters: Partial<StaysFilter>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    setActiveFilterCount(getActiveFilterCount(updated));
    try {
      await saveStaysFilters(updated);
    } catch (err) {
      logger.error('Failed to save filters:', err);
    }
  };

  // Handle filter toggle
  const handleFilterToggle = (filterKey: string) => {
    switch (filterKey) {
      case 'instantBook':
        updateFilters({ instantBook: !filters.instantBook });
        break;
      case 'superhost':
        updateFilters({ superhostOnly: !filters.superhostOnly });
        break;
      case 'price':
        // Open price filter modal
        break;
      case 'bedrooms':
        // Open bedrooms filter modal
        break;
      case 'amenities':
        // Open amenities filter modal
        break;
    }
  };

  // Handle sort change
  const handleSortChange = (sortKey: string) => {
    updateFilters({ sortBy: sortKey as StaysFilter['sortBy'] });
  };

  // Get current sort label
  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === filters.sortBy)?.label || 'Relevance';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Finding properties...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <TouchableOpacity
          style={styles.searchInput}
          onPress={() => router.push('/habixo/search')}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>
            {filters.city || 'Where are you going?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Pills */}
      <View style={styles.dateRow}>
        <TouchableOpacity style={styles.datePill}>
          <Text style={styles.datePillText}>
            {filters.checkIn ? new Date(filters.checkIn).toLocaleDateString() : 'Check-in'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.datePill}>
          <Text style={styles.datePillText}>
            {filters.checkOut ? new Date(filters.checkOut).toLocaleDateString() : 'Check-out'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestPill}>
          <Text style={styles.datePillText}>
            {filters.guests || 1} guest{filters.guests !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {FILTERS.map((filter) => {
            const isActive = filter.key === 'instantBook' && filters.instantBook ||
                           filter.key === 'superhost' && filters.superhostOnly;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleFilterToggle(filter.key)}
              >
                <Text style={styles.filterIcon}>{filter.icon}</Text>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter.label}
                </Text>
                {isActive && <Text style={styles.filterCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => updateFilters(DEFAULT_STAYS_FILTER)}
          >
            <Text style={styles.clearFiltersText}>Clear all ({activeFilterCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{properties.length} properties</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            // Cycle through sort options
            const currentIndex = SORT_OPTIONS.findIndex((s) => s.key === filters.sortBy);
            const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
            handleSortChange(SORT_OPTIONS[nextIndex].key);
          }}
        >
          <Text style={styles.sortText}>Sort: {currentSortLabel}</Text>
          <Text>↓</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPropertiesWithRetry()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Property List */}
      <ScrollView
        style={styles.propertyList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPropertiesWithRetry(true)}
            colors={['#6366f1']}
          />
        }
      >
        {properties.map((property) => (
          <TouchableOpacity
            key={property.id}
            style={styles.propertyCard}
            onPress={() => router.push(`/habixo/property/${property.id}`)}
          >
            <Image
              source={{ uri: property.images[0] }}
              style={styles.propertyImage}
            />
            <View style={styles.wishlistButton}>
              <Text>♡</Text>
            </View>
            <View style={styles.propertyContent}>
              <View style={styles.propertyHeader}>
                <Text style={styles.propertyLocation}>{property.location}</Text>
                <View style={styles.ratingBadge}>
                  <Text>⭐ {property.rating}</Text>
                </View>
              </View>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <Text style={styles.propertyType}>{property.type}</Text>

              {/* Property Details */}
              <View style={styles.propertyDetails}>
                <Text>{property.bedrooms} bed • {property.bathrooms} bath • {property.guests} guests</Text>
              </View>

              {/* Amenities */}
              <View style={styles.amenities}>
                {property.amenities.slice(0, 3).map((amenity, index) => (
                  <View key={index} style={styles.amenityTag}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>

              {/* Host Info */}
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>Hosted by {property.host.name}</Text>
                <Text style={styles.hostStats}>
                  {property.host.responseRate}% response
                </Text>
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  ₹{property.price}
                  <Text style={styles.priceUnit}>/night</Text>
                </Text>
                <Text style={styles.reviews}>{property.reviews} reviews</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map Button */}
      <TouchableOpacity style={styles.mapButton}>
        <Text style={styles.mapButtonText}>🗺️ Map</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  searchHeader: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  dateRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  datePill: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  guestPill: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
  },
  datePillText: {
    fontSize: 14,
    color: '#374151',
  },
  filtersSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#374151',
  },
  filterTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  filterCheck: {
    marginLeft: 4,
    color: '#6366f1',
    fontWeight: 'bold',
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  resultCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    color: '#374151',
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  retryText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginLeft: 12,
  },
  propertyList: {
    flex: 1,
    padding: 16,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  propertyContent: {
    padding: 16,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  propertyDetails: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  amenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amenityTag: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#374151',
  },
  hostInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hostName: {
    fontSize: 13,
    color: '#374151',
  },
  hostStats: {
    fontSize: 13,
    color: '#6b7280',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#6b7280',
  },
  reviews: {
    fontSize: 13,
    color: '#6b7280',
  },
  mapButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
