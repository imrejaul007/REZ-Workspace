// @ts-nocheck
/**
 * Offers Screen
 * Route: /offers
 *
 * Lists all available offers that users can browse and claim.
 * Features:
 * - Featured offers carousel
 * - Category filtering
 * - Save/bookmark offers
 * - Pull-to-refresh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/DesignSystem';
import apiClient from '@/services/apiClient';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

// API URL from environment - fallback to empty string (apiClient handles defaults)
const MARKETING_SERVICE = process.env.EXPO_PUBLIC_MARKETING_SERVICE_URL || '';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface Offer {
  id: string;
  title: string;
  description: string;
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  category: string;
  type: 'percentage' | 'flat' | 'bogo' | 'cashback' | 'freebie';
  value?: string;
  maxDiscount?: number;
  minSpend?: number;
  status: 'active' | 'expiring_soon' | 'new';
  expiresAt: string;
  imageUrl?: string;
  isSaved?: boolean;
  isExclusive?: boolean;
  usageLimit?: number;
  usedCount?: number;
  code?: string;
  terms?: string[];
}

type FilterType = 'all' | 'saved' | 'expiring' | 'exclusive';
type CategoryType = 'all' | string;

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant',
  shopping: 'cart',
  beauty: 'sparkles',
  fitness: 'fitness',
  travel: 'airplane',
  entertainment: 'game-controller',
  health: 'medical',
  education: 'school',
  groceries: 'basket',
  default: 'pricetag',
};

const TYPE_LABELS: Record<string, string> = {
  percentage: 'OFF',
  flat: 'FLAT OFF',
  bogo: 'BUY ONE GET ONE',
  cashback: 'CASHBACK',
  freebie: 'FREE',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function OffersListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [featuredOffers, setFeaturedOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');

  const fetchOffers = useCallback(async () => {
    try {
      // Use apiClient's base URL - MARKETING_SERVICE is empty, so it uses apiClient defaults
      const endpoint = MARKETING_SERVICE ? `${MARKETING_SERVICE}/api/v1/offers` : '/v1/offers';
      const response = await apiClient.get(endpoint);

      if (response.success && response.data) {
        const offersList = response.data.offers || response.data;
        setOffers(offersList);
        setFeaturedOffers(
          offersList.filter((o: Offer) => o.isExclusive).slice(0, 5)
        );
      } else {
        const mockData = getMockOffers();
        setOffers(mockData);
        setFeaturedOffers(mockData.filter((o: Offer) => o.isExclusive).slice(0, 5));
      }
    } catch (error) {
      logger.error('Failed to fetch offers:', error);
      const mockData = getMockOffers();
      setOffers(mockData);
      setFeaturedOffers(mockData.filter((o: Offer) => o.isExclusive).slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    filterOffers();
  }, [offers, searchQuery, activeFilter, selectedCategory]);

  const filterOffers = () => {
    let filtered = [...offers];

    if (activeFilter === 'saved') {
      filtered = filtered.filter(o => o.isSaved);
    } else if (activeFilter === 'expiring') {
      filtered = filtered.filter(o => o.status === 'expiring_soon');
    } else if (activeFilter === 'exclusive') {
      filtered = filtered.filter(o => o.isExclusive);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(o => o.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.title.toLowerCase().includes(query) ||
          o.merchantName.toLowerCase().includes(query) ||
          o.description.toLowerCase().includes(query)
      );
    }

    setFilteredOffers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  };

  const toggleSave = (offerId: string) => {
    setOffers(prev =>
      prev.map(o =>
        o.id === offerId ? { ...o, isSaved: !o.isSaved } : o
      )
    );
  };

  const categories = ['all', ...new Set(offers.map(o => o.category))];

  const renderHeader = () => (
    <View>
      {/* Featured Offers Carousel */}
      {featuredOffers.length > 0 && (
        <View style={styles.featuredSection}>
          <ThemedText type="title" style={styles.featuredTitle}>
            Featured Offers
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredCarousel}
          >
            {featuredOffers.map(offer => (
              <FeaturedOfferCard
                key={offer.id}
                offer={offer}
                onPress={() => router.push(`/offers/${offer.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search offers..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: 'all', label: 'All Offers', icon: 'pricetags' },
          { key: 'saved', label: 'Saved', icon: 'heart' },
          { key: 'expiring', label: 'Expiring Soon', icon: 'time' },
          { key: 'exclusive', label: 'Exclusive', icon: 'star' },
        ].map(filter => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(filter.key as FilterType)}
          >
            <Ionicons
              name={filter.icon as unknown}
              size={16}
              color={activeFilter === filter.key ? Colors.primary : Colors.textSecondary}
            />
            <ThemedText
              type="caption"
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(category => (
          <Pressable
            key={category}
            style={[
              styles.categoryPill,
              selectedCategory === category && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Ionicons
              name={CATEGORY_ICONS[category] || CATEGORY_ICONS.default}
              size={14}
              color={selectedCategory === category ? Colors.white : Colors.textSecondary}
            />
            <ThemedText
              type="caption"
              style={[
                styles.categoryPillText,
                selectedCategory === category && styles.categoryPillTextActive,
              ]}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderOfferCard = ({ item }: { item: Offer }) => (
    <OfferCard
      offer={item}
      onPress={() => router.push(`/offers/${item.id}`)}
      onToggleSave={() => toggleSave(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="pricetag" size={48} color={Colors.border} />
      <ThemedText type="body" style={styles.emptyTitle}>
        No offers found
      </ThemedText>
      <ThemedText type="caption" style={styles.emptySubtitle}>
        Try adjusting your filters or check back later
      </ThemedText>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Offers' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="caption" style={styles.loadingText}>
            Loading offers...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Offers' }} />

      <FlatList
        data={filteredOffers}
        renderItem={renderOfferCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FeaturedOfferCardProps {
  offer: Offer;
  onPress: () => void;
}

const FeaturedOfferCard: React.FC<FeaturedOfferCardProps> = ({ offer, onPress }) => (
  <Pressable style={styles.featuredCard} onPress={onPress}>
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.featuredGradient}
    >
      <View style={styles.featuredHeader}>
        <View style={styles.exclusiveBadge}>
          <Ionicons name="star" size={12} color={Colors.primary} />
          <ThemedText type="caption" style={styles.exclusiveText}>
            EXCLUSIVE
          </ThemedText>
        </View>
        <View style={styles.saveButtonSmall}>
          <Ionicons name="bookmark" size={16} color={Colors.white} />
        </View>
      </View>

      <View style={styles.featuredContent}>
        <ThemedText type="hero" style={styles.featuredValue}>
          {offer.value}
        </ThemedText>
        <ThemedText type="caption" style={styles.featuredOfferType}>
          {TYPE_LABELS[offer.type]}
        </ThemedText>
        <Text style={styles.featuredMerchant} numberOfLines={1}>
          {offer.merchantName}
        </Text>
      </View>

      <View style={styles.featuredFooter}>
        <Text style={styles.featuredTitleText} numberOfLines={1}>
          {offer.title}
        </Text>
        <View style={styles.featuredExpiry}>
          <Ionicons name="time" size={12} color={Colors.white} />
          <Text style={styles.expiryTextSmall}>
            {formatExpiryShort(offer.expiresAt)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  </Pressable>
);

interface OfferCardProps {
  offer: Offer;
  onPress: () => void;
  onToggleSave: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress, onToggleSave }) => {
  const getStatusColor = () => {
    if (offer.status === 'expiring_soon') return Colors.warning;
    if (offer.status === 'new') return Colors.success;
    return Colors.primary;
  };

  return (
    <Pressable style={styles.offerCard} onPress={onPress}>
      <View style={styles.offerContent}>
        <View style={styles.offerLeft}>
          <View style={[styles.offerBadge, { backgroundColor: getStatusColor() }]}>
            <ThemedText type="caption" style={styles.offerValue}>
              {offer.value}
            </ThemedText>
            <ThemedText type="caption" style={styles.offerType}>
              {TYPE_LABELS[offer.type]}
            </ThemedText>
          </View>
        </View>

        <View style={styles.offerMiddle}>
          <View style={styles.offerHeader}>
            <Text style={styles.offerTitle} numberOfLines={1}>
              {offer.title}
            </Text>
            {offer.isExclusive && (
              <View style={styles.exclusiveTag}>
                <Ionicons name="star" size={10} color={Colors.warning} />
              </View>
            )}
          </View>
          <Text style={styles.merchantName} numberOfLines={1}>
            {offer.merchantName}
          </Text>
          <View style={styles.offerMeta}>
            {offer.status === 'expiring_soon' && (
              <View style={styles.expiringBadge}>
                <Ionicons name="flash" size={12} color={Colors.warning} />
                <Text style={styles.expiringText}>Expiring Soon</Text>
              </View>
            )}
            {offer.minSpend && (
              <Text style={styles.minSpend}>Min. Rs. {offer.minSpend}</Text>
            )}
          </View>
        </View>

        <View style={styles.offerRight}>
          <Pressable
            style={styles.saveButton}
            onPress={e => {
              e.stopPropagation();
              onToggleSave();
            }}
          >
            <Ionicons
              name={offer.isSaved ? 'heart' : 'heart-outline'}
              size={22}
              color={offer.isSaved ? Colors.error : Colors.textSecondary}
            />
          </Pressable>
          <View style={styles.expiryContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.expiryText}>{formatExpiryShort(offer.expiresAt)}</Text>
          </View>
        </View>
      </View>

      {offer.usageLimit && offer.usedCount !== undefined && (
        <View style={styles.usageSection}>
          <View style={styles.usageBar}>
            <View
              style={[
                styles.usageFill,
                {
                  width: `${Math.min(100, (offer.usedCount / offer.usageLimit) * 100)}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {offer.usageLimit - offer.usedCount} left
          </Text>
        </View>
      )}
    </Pressable>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMockOffers(): Offer[] {
  return [
    {
      id: 'off_1',
      title: 'Summer Sale - Flat 30% Off',
      description: 'Get flat 30% off on all summer collections.',
      merchantId: 'm1',
      merchantName: 'Trendy Fashions',
      category: 'shopping',
      type: 'percentage',
      value: '30%',
      maxDiscount: 500,
      status: 'active',
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      isSaved: false,
      isExclusive: true,
      usageLimit: 100,
      usedCount: 45,
      code: 'SUMMER30',
    },
    {
      id: 'off_2',
      title: 'Flat Rs. 100 Off',
      description: 'Get flat Rs. 100 off on orders above Rs. 500.',
      merchantId: 'm2',
      merchantName: 'Food Paradise',
      category: 'food',
      type: 'flat',
      value: 'Rs. 100',
      minSpend: 500,
      status: 'active',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      isSaved: true,
      isExclusive: false,
      code: 'FOOD100',
    },
    {
      id: 'off_3',
      title: 'Buy 1 Get 1 Free',
      description: 'Buy unknown main course and get another absolutely free!',
      merchantId: 'm3',
      merchantName: 'Pizza Palace',
      category: 'food',
      type: 'bogo',
      value: 'BOGO',
      status: 'expiring_soon',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      isSaved: false,
      isExclusive: true,
      usageLimit: 50,
      usedCount: 42,
    },
    {
      id: 'off_4',
      title: '20% Cashback on All',
      description: 'Get 20% cashback on all purchases.',
      merchantId: 'm4',
      merchantName: 'Tech World',
      category: 'shopping',
      type: 'cashback',
      value: '20%',
      maxDiscount: 1000,
      status: 'new',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      isSaved: false,
      isExclusive: true,
    },
    {
      id: 'off_5',
      title: 'Free Dessert',
      description: 'Order unknown main course and get a free dessert.',
      merchantId: 'm5',
      merchantName: 'Cafe Milano',
      category: 'food',
      type: 'freebie',
      value: 'FREE',
      minSpend: 300,
      status: 'active',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isSaved: true,
      isExclusive: false,
    },
    {
      id: 'off_6',
      title: 'Spa Day - 40% Off',
      description: 'Relax with 40% off on all spa treatments.',
      merchantId: 'm6',
      merchantName: 'Serenity Spa',
      category: 'beauty',
      type: 'percentage',
      value: '40%',
      maxDiscount: 800,
      minSpend: 1000,
      status: 'active',
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      isSaved: false,
      isExclusive: false,
    },
  ];
}

function formatExpiryShort(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  featuredSection: {
    marginBottom: Spacing.lg,
  },
  featuredTitle: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    color: Colors.text,
  },
  featuredCarousel: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  featuredCard: {
    width: SCREEN_WIDTH * 0.65,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  featuredGradient: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exclusiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  exclusiveText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  saveButtonSmall: {
    padding: 4,
  },
  featuredContent: {
    alignItems: 'center',
  },
  featuredValue: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  featuredOfferType: {
    color: Colors.white,
    opacity: 0.9,
    fontSize: 12,
  },
  featuredMerchant: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 4,
  },
  featuredFooter: {
    alignItems: 'center',
  },
  featuredTitleText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expiryTextSmall: {
    color: Colors.white,
    fontSize: 11,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    marginTop: Spacing.sm,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    gap: 6,
    marginRight: Spacing.sm,
  },
  filterTabActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterTabText: {
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  categoryContainer: {
    marginTop: Spacing.md,
  },
  categoryContent: {
    paddingHorizontal: Spacing.lg,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginRight: Spacing.sm,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
  },
  categoryPillText: {
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  offerContent: {
    flexDirection: 'row',
    padding: Spacing.md,
  },
  offerLeft: {
    marginRight: Spacing.md,
  },
  offerBadge: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  offerType: {
    color: Colors.white,
    fontSize: 10,
    opacity: 0.9,
  },
  offerMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  exclusiveTag: {
    padding: 2,
  },
  merchantName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: Spacing.sm,
  },
  expiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  expiringText: {
    color: Colors.warning,
    fontSize: 10,
    fontWeight: '600',
  },
  minSpend: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  offerRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  saveButton: {
    padding: 4,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  usageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  usageBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 2,
  },
  usageText: {
    fontSize: 11,
    color: Colors.textSecondary,
    minWidth: 50,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});

// Wrap with error boundary for production stability
export default withErrorBoundary(OffersListPage, 'Offers');
