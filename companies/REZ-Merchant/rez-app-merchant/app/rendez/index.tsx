/**
 * Rendez Social Offers List Screen
 *
 * Displays all social offers (couple/group) with filtering, search,
 * and quick actions for merchants to manage their social dining offers.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Types
export interface RendezOffer {
  id: string;
  name: string;
  description: string;
  type: 'couple' | 'group';
  category: string;
  minPeople: number;
  maxPeople: number;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  isActive: boolean;
  contextRules: ContextRule[];
  bookings: BookingStats;
  analytics: OfferAnalytics;
  validFrom: string;
  validTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextRule {
  id: string;
  type: 'day' | 'date' | 'time';
  value: string;
  label: string;
  isActive: boolean;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

export interface OfferAnalytics {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageRating?: number;
}

type FilterType = 'all' | 'couple' | 'group' | 'active' | 'inactive';
type SortOption = 'newest' | 'oldest' | 'popular' | 'price_low' | 'price_high';

// Mock data for demonstration
const mockOffers: RendezOffer[] = [
  {
    id: '1',
    name: 'Romantic Candlelight Dinner',
    description: 'An intimate candlelit dinner for two with a special menu curated by our chef.',
    type: 'couple',
    category: 'Dining',
    minPeople: 2,
    maxPeople: 2,
    price: 2999,
    originalPrice: 4500,
    discount: 33,
    isActive: true,
    contextRules: [
      { id: 'r1', type: 'day', value: 'friday', label: 'Friday', isActive: true },
      { id: 'r2', type: 'day', value: 'saturday', label: 'Saturday', isActive: true },
      { id: 'r3', type: 'date', value: 'valentines', label: "Valentine's Day", isActive: true },
    ],
    bookings: { total: 45, confirmed: 12, pending: 3, cancelled: 5, completed: 25 },
    analytics: { views: 1234, conversions: 45, conversionRate: 3.6, revenue: 74975, averageRating: 4.8 },
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-05-01T14:30:00Z',
  },
  {
    id: '2',
    name: 'Couples Spa Retreat',
    description: 'Relax and rejuvenate with your partner in our premium couple spa suite.',
    type: 'couple',
    category: 'Wellness',
    minPeople: 2,
    maxPeople: 2,
    price: 5999,
    originalPrice: 8000,
    discount: 25,
    isActive: true,
    contextRules: [
      { id: 'r4', type: 'day', value: 'sunday', label: 'Sunday', isActive: true },
    ],
    bookings: { total: 28, confirmed: 5, pending: 2, cancelled: 3, completed: 18 },
    analytics: { views: 876, conversions: 28, conversionRate: 3.2, revenue: 107982, averageRating: 4.9 },
    validFrom: '2026-01-01',
    validTo: '2026-06-30',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-04-20T11:00:00Z',
  },
  {
    id: '3',
    name: 'Friends Hangout Pack',
    description: 'Perfect for groups of 4-6 friends. Includes shared appetizers and drinks.',
    type: 'group',
    category: 'Dining',
    minPeople: 4,
    maxPeople: 6,
    price: 4999,
    originalPrice: 6500,
    discount: 23,
    isActive: true,
    contextRules: [
      { id: 'r5', type: 'day', value: 'friday', label: 'Friday', isActive: true },
      { id: 'r6', type: 'day', value: 'saturday', label: 'Saturday', isActive: true },
      { id: 'r7', type: 'time', value: 'evening', label: 'Evening (6PM - 10PM)', isActive: true },
    ],
    bookings: { total: 62, confirmed: 15, pending: 5, cancelled: 8, completed: 34 },
    analytics: { views: 2341, conversions: 62, conversionRate: 2.6, revenue: 186938, averageRating: 4.6 },
    validFrom: '2026-03-01',
    validTo: '2026-12-31',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-05-05T16:00:00Z',
  },
  {
    id: '4',
    name: 'Birthday Party Special',
    description: 'Celebrate birthdays with friends! Includes cake, decorations, and special menu.',
    type: 'group',
    category: 'Celebration',
    minPeople: 5,
    maxPeople: 15,
    price: 7999,
    isActive: false,
    contextRules: [
      { id: 'r8', type: 'date', value: 'birthday', label: 'Birthday Week', isActive: true },
    ],
    bookings: { total: 18, confirmed: 0, pending: 0, cancelled: 2, completed: 16 },
    analytics: { views: 567, conversions: 18, conversionRate: 3.2, revenue: 127984, averageRating: 4.7 },
    validFrom: '2026-01-01',
    validTo: '2026-05-31',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
];

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Status Badge Component
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
    <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
      {isActive ? 'Active' : 'Inactive'}
    </Text>
  </View>
);

// Type Badge Component
const TypeBadge: React.FC<{ type: 'couple' | 'group' }> = ({ type }) => (
  <View style={[styles.typeBadge, type === 'couple' ? styles.coupleBadge : styles.groupBadge]}>
    <Ionicons
      name={type === 'couple' ? 'heart' : 'people'}
      size={12}
      color={type === 'couple' ? '#ec4899' : '#8b5cf6'}
    />
    <Text style={[styles.typeText, type === 'couple' ? styles.coupleText : styles.groupText]}>
      {type === 'couple' ? 'Couple' : 'Group'}
    </Text>
  </View>
);

// Context Rules Tags
const ContextRulesTags: React.FC<{ rules: ContextRule[] }> = ({ rules }) => (
  <View style={styles.rulesContainer}>
    {rules.slice(0, 3).map((rule) => (
      <View key={rule.id} style={styles.ruleTag}>
        <Text style={styles.ruleText}>{rule.label}</Text>
      </View>
    ))}
    {rules.length > 3 && (
      <Text style={styles.moreRulesText}>+{rules.length - 3} more</Text>
    )}
  </View>
);

// Analytics Card
const AnalyticsCard: React.FC<{ analytics: OfferAnalytics; bookings: BookingStats }> = ({
  analytics,
  bookings,
}) => (
  <View style={styles.analyticsCard}>
    <View style={styles.analyticsRow}>
      <View style={styles.analyticItem}>
        <Text style={styles.analyticValue}>{bookings.total}</Text>
        <Text style={styles.analyticLabel}>Bookings</Text>
      </View>
      <View style={styles.analyticItem}>
        <Text style={styles.analyticValue}>{analytics.views}</Text>
        <Text style={styles.analyticLabel}>Views</Text>
      </View>
      <View style={styles.analyticItem}>
        <Text style={styles.analyticValue}>{analytics.conversionRate}%</Text>
        <Text style={styles.analyticLabel}>Conv.</Text>
      </View>
      <View style={styles.analyticItem}>
        <Text style={styles.analyticValue}>{formatCurrency(analytics.revenue)}</Text>
        <Text style={styles.analyticLabel}>Revenue</Text>
      </View>
    </View>
  </View>
);

// Offer Card Component
const OfferCard: React.FC<{
  offer: RendezOffer;
  onPress: () => void;
  onToggleStatus: () => void;
}> = ({ offer, onPress, onToggleStatus }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.offerCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <TypeBadge type={offer.type} />
          <StatusBadge isActive={offer.isActive} />
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, { borderColor: colors.border }]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleStatus();
          }}
        >
          <View
            style={[
              styles.toggle,
              offer.isActive ? styles.toggleActive : styles.toggleInactive,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                offer.isActive ? styles.toggleThumbActive : styles.toggleThumbInactive,
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.offerName, { color: colors.text }]}>{offer.name}</Text>
      <Text style={[styles.offerDescription, { color: colors.textSecondary }]} numberOfLines={2}>
        {offer.description}
      </Text>

      <ContextRulesTags rules={offer.contextRules} />

      <View style={styles.priceRow}>
        <View>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatCurrency(offer.price)}
          </Text>
          {offer.originalPrice && (
            <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
              {formatCurrency(offer.originalPrice)}
            </Text>
          )}
        </View>
        <View style={styles.peopleInfo}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.peopleText, { color: colors.textSecondary }]}>
            {offer.minPeople}-{offer.maxPeople} people
          </Text>
        </View>
      </View>

      <AnalyticsCard analytics={offer.analytics} bookings={offer.bookings} />
    </TouchableOpacity>
  );
};

// Filter Pills Component
const FilterPills: React.FC<{
  filters: FilterType[];
  selected: FilterType;
  onSelect: (filter: FilterType) => void;
  colors: typeof Colors.light;
}> = ({ filters, selected, onSelect, colors }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.filterContainer}
  >
    {filters.map((filter) => (
      <TouchableOpacity
        key={filter}
        style={[
          styles.filterPill,
          {
            backgroundColor: selected === filter ? colors.primary : colors.backgroundTertiary,
            borderColor: selected === filter ? colors.primary : colors.border,
          },
        ]}
        onPress={() => onSelect(filter)}
      >
        <Text
          style={[
            styles.filterText,
            { color: selected === filter ? '#fff' : colors.text },
          ]}
        >
          {filter.charAt(0).toUpperCase() + filter.slice(1)}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// Empty State Component
const EmptyState: React.FC<{ colors: typeof Colors.light }> = ({ colors }) => (
  <View style={styles.emptyState}>
    <Ionicons name="heart-outline" size={64} color={colors.textMuted} />
    <Text style={[styles.emptyTitle, { color: colors.text }]}>No offers yet</Text>
    <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
      Create your first social offer to start accepting couple and group bookings.
    </Text>
    <TouchableOpacity
      style={[styles.createButton, { backgroundColor: colors.primary }]}
      onPress={() => router.push('/rendez/create')}
    >
      <Ionicons name="add" size={20} color="#fff" />
      <Text style={styles.createButtonText}>Create Offer</Text>
    </TouchableOpacity>
  </View>
);

export default function RendezIndexScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [offers, setOffers] = useState<RendezOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Fetch offers
  const fetchOffers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setOffers(mockOffers);
    } catch (error) {
      Alert.alert('Error', 'Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Toggle offer status
  const toggleOfferStatus = (offerId: string) => {
    const offer = offers.find((o) => o.id === offerId);
    if (!offer) return;

    Alert.alert(
      offer.isActive ? 'Deactivate Offer' : 'Activate Offer',
      `Are you sure you want to ${offer.isActive ? 'deactivate' : 'activate'} "${offer.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: offer.isActive ? 'Deactivate' : 'Activate',
          style: offer.isActive ? 'destructive' : 'default',
          onPress: () => {
            setOffers((prev) =>
              prev.map((o) => (o.id === offerId ? { ...o, isActive: !o.isActive } : o))
            );
          },
        },
      ]
    );
  };

  // Filter and sort offers
  const filteredOffers = offers
    .filter((offer) => {
      // Search filter
      if (
        searchQuery &&
        !offer.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !offer.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type/status filter
      switch (selectedFilter) {
        case 'couple':
          return offer.type === 'couple';
        case 'group':
          return offer.type === 'group';
        case 'active':
          return offer.isActive;
        case 'inactive':
          return !offer.isActive;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          return b.bookings.total - a.bookings.total;
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  // Stats
  const activeOffers = offers.filter((o) => o.isActive).length;
  const totalBookings = offers.reduce((sum, o) => sum + o.bookings.total, 0);
  const totalRevenue = offers.reduce((sum, o) => sum + o.analytics.revenue, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading offers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Social Offers</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {activeOffers} active offers
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/rendez/create')}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundTertiary }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search offers..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <FilterPills
          filters={['all', 'couple', 'group', 'active', 'inactive']}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
          colors={colors}
        />

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Sort by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'newest', label: 'Newest' },
              { key: 'popular', label: 'Most Popular' },
              { key: 'price_low', label: 'Price: Low to High' },
              { key: 'price_high', label: 'Price: High to Low' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  {
                    backgroundColor:
                      sortBy === option.key ? colors.primaryLight2 : 'transparent',
                    borderColor: sortBy === option.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSortBy(option.key as SortOption)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: sortBy === option.key ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{activeOffers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>{totalBookings}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.indigo }]}>
            {formatCurrency(totalRevenue)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Revenue</Text>
        </View>
      </View>

      {/* Offers List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOffers(true)}
            tintColor={colors.primary}
          />
        }
      >
        {filteredOffers.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onPress={() => router.push(`/rendez/${offer.id}`)}
              onToggleStatus={() => toggleOfferStatus(offer.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
    paddingBottom: 32,
  },
  offerCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#d1fae5',
  },
  inactiveBadge: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#6b7280',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coupleBadge: {
    backgroundColor: '#fce7f3',
  },
  groupBadge: {
    backgroundColor: '#ede9fe',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coupleText: {
    color: '#ec4899',
  },
  groupText: {
    color: '#8b5cf6',
  },
  toggleButton: {
    padding: 4,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#d1fae5',
  },
  toggleInactive: {
    backgroundColor: '#e5e7eb',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  toggleThumbActive: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    backgroundColor: '#9ca3af',
    alignSelf: 'flex-start',
  },
  offerName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  rulesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  ruleTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ruleText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '500',
  },
  moreRulesText: {
    fontSize: 11,
    color: '#6b7280',
    alignSelf: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  peopleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  peopleText: {
    fontSize: 13,
  },
  analyticsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticItem: {
    alignItems: 'center',
  },
  analyticValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  analyticLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
