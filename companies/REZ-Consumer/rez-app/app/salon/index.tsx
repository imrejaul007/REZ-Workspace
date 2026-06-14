// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Salon Listing Page
 * Browse nearby salons with filters and search
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { CardGridSkeleton } from '@/components/skeletons';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import storesApi from '@/services/storesApi';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import SalonCard from './components/SalonCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: colors.brand.pink,
  primaryDark: '#F43F5E',
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray100: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: Colors.success,
  background: colors.background.secondary,
  amber: Colors.warning,
};

export interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distance: string;
  cashback: string;
  priceRange: string;
  image: string;
  isVerified: boolean;
  category: string;
  services: string[];
  openNow: boolean;
  address?: string;
  timing?: string;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'nearby', label: 'Nearby', icon: 'location-outline' },
  { id: 'top-rated', label: 'Top Rated', icon: 'star' },
  { id: 'best-cashback', label: 'Best Cashback', icon: 'wallet-outline' },
  { id: 'open-now', label: 'Open Now', icon: 'time-outline' },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'hair', label: 'Hair' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'spa', label: 'Spa' },
  { id: 'nails', label: 'Nails' },
  { id: 'makeup', label: 'Makeup' },
];

const SalonIndexPage: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [salons, setSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demonstration - replace with API call
  const mockSalons: Salon[] = [
    {
      id: '1',
      name: 'Luxe Hair & Beauty Studio',
      rating: 4.8,
      reviewCount: 234,
      distance: '0.5 km',
      cashback: '25%',
      priceRange: `${currencySymbol}500+`,
      image: '',
      isVerified: true,
      category: 'hair',
      services: ['Haircut', 'Coloring', 'Keratin', 'Styling'],
      openNow: true,
      address: '123 Main Street',
      timing: '9:00 AM - 9:00 PM',
    },
    {
      id: '2',
      name: 'Glow Spa & Wellness',
      rating: 4.9,
      reviewCount: 189,
      distance: '1.2 km',
      cashback: '30%',
      priceRange: `${currencySymbol}1000+`,
      image: '',
      isVerified: true,
      category: 'spa',
      services: ['Massage', 'Facial', 'Body Scrub', 'Aromatherapy'],
      openNow: true,
      address: '456 Wellness Lane',
      timing: '10:00 AM - 8:00 PM',
    },
    {
      id: '3',
      name: 'Nail Artistry by Priya',
      rating: 4.7,
      reviewCount: 156,
      distance: '0.8 km',
      cashback: '20%',
      priceRange: `${currencySymbol}300+`,
      image: '',
      isVerified: false,
      category: 'nails',
      services: ['Manicure', 'Pedicure', 'Nail Art', 'Gel Nails'],
      openNow: false,
      address: '789 Beauty Blvd',
      timing: '10:00 AM - 7:00 PM',
    },
    {
      id: '4',
      name: 'Style Studio Unisex Salon',
      rating: 4.6,
      reviewCount: 312,
      distance: '1.5 km',
      cashback: '15%',
      priceRange: `${currencySymbol}400+`,
      image: '',
      isVerified: true,
      category: 'hair',
      services: ['Haircut', 'Beard Trim', 'Shave', 'Facial'],
      openNow: true,
      address: '321 Style Ave',
      timing: '8:00 AM - 10:00 PM',
    },
    {
      id: '5',
      name: 'Bridal Makeup by Meera',
      rating: 4.9,
      reviewCount: 98,
      distance: '2.0 km',
      cashback: '35%',
      priceRange: `${currencySymbol}5000+`,
      image: '',
      isVerified: true,
      category: 'makeup',
      services: ['Bridal Makeup', 'Party Makeup', 'HD Makeup', 'Airbrush'],
      openNow: true,
      address: '555 Bridal Road',
      timing: '9:00 AM - 6:00 PM',
    },
    {
      id: '6',
      name: 'Radiance Beauty Parlour',
      rating: 4.5,
      reviewCount: 278,
      distance: '0.3 km',
      cashback: '18%',
      priceRange: `${currencySymbol}350+`,
      image: '',
      isVerified: false,
      category: 'beauty',
      services: ['Facial', 'Threading', 'Waxing', 'Bleach'],
      openNow: true,
      address: '67 Glow Street',
      timing: '10:00 AM - 7:00 PM',
    },
  ];

  const fetchSalons = useCallback(async () => {
    try {
      setError(null);

      // In production, use API call:
      // const response = await storesApi.getStores({ tags: ['salon', 'beauty'], limit: 50 });

      // Using mock data for demonstration
      if (!isMounted()) return;
      setSalons(mockSalons);
      if (!isMounted()) return;
      setFilteredSalons(mockSalons);
    } catch (err) {
      if (!isMounted()) return;
      setError(err.message || 'Failed to load salons');
      if (!isMounted()) return;
      setSalons([]);
      if (!isMounted()) return;
      setFilteredSalons([]);
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
      if (!isMounted()) return;
      setIsRefreshing(false);
    }
  }, [isMounted]);

  useEffect(() => {
    setIsLoading(true);
    fetchSalons();
  }, [fetchSalons]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSalons();
  }, [fetchSalons]);

  // Apply filters
  useEffect(() => {
    let result = [...salons];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (salon) =>
          salon.name.toLowerCase().includes(query) ||
          salon.category.toLowerCase().includes(query) ||
          salon.services.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((salon) => salon.category === selectedCategory);
    }

    // Sort filter
    if (selectedFilter === 'nearby') {
      result.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (selectedFilter === 'top-rated') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (selectedFilter === 'best-cashback') {
      result.sort((a, b) => parseFloat(b.cashback) - parseFloat(a.cashback));
    } else if (selectedFilter === 'open-now') {
      result = result.filter((salon) => salon.openNow);
    }

    setFilteredSalons(result);
  }, [selectedFilter, selectedCategory, searchQuery, salons]);

  const handleSalonPress = (salonId: string) => {
    router.push(`/salon/${salonId}` as unknown);
  };

  const handleSearch = () => {
    // Search functionality handled by useEffect
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CardGridSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Hair & Beauty</Text>
            <Text style={styles.headerSubtitle}>Book your perfect look</Text>
          </View>
          <Pressable style={styles.filterButton} onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={24} color={colors.text.inverse} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray600} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search salons, services..."
            placeholderTextColor={COLORS.gray600}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray600} />
            </Pressable>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredSalons.length}</Text>
            <Text style={styles.statLabel}>Salons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>30%</Text>
            <Text style={styles.statLabel}>Max Cashback</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2X</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Category Filters */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORY_FILTERS.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sort Filter */}
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTER_OPTIONS.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[styles.sortChip, selectedFilter === filter.id && styles.sortChipActive]}
            >
              {filter.icon && (
                <Ionicons
                  name={filter.icon as unknown}
                  size={14}
                  color={selectedFilter === filter.id ? colors.text.inverse : COLORS.gray600}
                />
              )}
              <Text
                style={[
                  styles.sortChipText,
                  selectedFilter === filter.id && styles.sortChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.gray600} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Empty State */}
        {!error && filteredSalons.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💇‍♀️</Text>
            <Text style={styles.emptyTitle}>No Salons Found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find unknown salons matching your criteria.
            </Text>
            <Pressable
              style={styles.exploreButton}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedFilter('all');
              }}
            >
              <Text style={styles.exploreButtonText}>Clear Filters</Text>
            </Pressable>
          </View>
        )}

        {/* Salon List */}
        {filteredSalons.length > 0 && (
          <View style={styles.salonList}>
            {filteredSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                currencySymbol={currencySymbol}
                onPress={() => handleSalonPress(salon.id)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView style={styles.filterModalBody}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {FILTER_OPTIONS.map((filter) => (
                <Pressable
                  key={filter.id}
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedFilter(filter.id);
                    setShowFilters(false);
                  }}
                >
                  {filter.icon && (
                    <Ionicons
                      name={filter.icon as unknown}
                      size={20}
                      color={selectedFilter === filter.id ? COLORS.primary : COLORS.gray600}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilter === filter.id && { color: COLORS.primary, fontWeight: '600' },
                    ]}
                  >
                    {filter.label}
                  </Text>
                  {selectedFilter === filter.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}

              <Text style={[styles.filterSectionTitle, { marginTop: 24 }]}>Category</Text>
              {CATEGORY_FILTERS.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setShowFilters(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCategory === cat.id && { color: COLORS.primary, fontWeight: '600' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                  {selectedCategory === cat.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <Pressable
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSelectedFilter('all');
                  setSelectedCategory('all');
                  setShowFilters(false);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </Pressable>
              <Pressable style={styles.applyFiltersButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.nileBlue,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  statValue: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  statLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  categoryContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: COLORS.gray50,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  sortContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: Spacing.md,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: COLORS.gray50,
    marginLeft: Spacing.base,
    gap: 6,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
  },
  sortChipText: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  sortChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
    marginTop: 60,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius['2xl'],
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius['2xl'],
  },
  exploreButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  salonList: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  filterModalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  filterModalBody: {
    padding: Spacing.base,
  },
  filterSectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.nileBlue,
    marginBottom: Spacing.md,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  filterOptionText: {
    flex: 1,
    ...Typography.body,
    color: colors.text.secondary,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  clearFiltersText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyFiltersText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(SalonIndexPage, 'SalonIndex');
