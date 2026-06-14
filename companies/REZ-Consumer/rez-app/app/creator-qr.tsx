/**
 * Creator QR - React Native Consumer App
 * Creator Discovery & Booking Page
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useAuthUser } from '@/stores/selectors';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps' },
  { id: 'fitness', name: 'Fitness', icon: 'fitness' },
  { id: 'consulting', name: 'Consulting', icon: 'business' },
  { id: 'freelance', name: 'Freelance', icon: 'code-slash' },
  { id: 'beauty', name: 'Beauty', icon: 'sparkles' },
  { id: 'coaching', name: 'Coaching', icon: 'school' },
  { id: 'education', name: 'Education', icon: 'library' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
];

const LISTING_TYPES = [
  { id: 'service', name: 'Services', icon: 'construct' },
  { id: 'consulting', name: 'Consulting', icon: 'chatbubbles' },
  { id: 'booking', name: 'Bookings', icon: 'calendar' },
  { id: 'promotion', name: 'Promotions', icon: 'megaphone' },
  { id: 'product', name: 'Products', icon: 'cube' },
];

interface Creator {
  _id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  category: string;
  rating: number;
  reviewCount: number;
  stats: {
    totalViews: number;
    totalBookings: number;
    totalFollowers: number;
  };
  isVerified: boolean;
}

interface Listing {
  _id: string;
  creatorId: Creator;
  type: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  delivery: string;
  duration?: number;
  platform?: string;
  views: number;
  bookings: number;
  rating: number;
}

export default function CreatorQRPage() {
  const router = useRouter();
  const user = useAuthUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch creators
      const creatorsRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/creators?category=${selectedCategory}&limit=20`
      );
      const creatorsData = await creatorsRes.json();
      if (creatorsData.success) {
        setCreators(creatorsData.data.creators || []);
      }

      // Fetch trending listings
      const listingsRes = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/listings/trending?limit=20`
      );
      const listingsData = await listingsRes.json();
      if (listingsData.success) {
        setListings(listingsData.data.listings || []);
      }
    } catch (err) {
      logger.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatPrice = (price: number, currency: string = 'INR') => {
    return `₹${price.toLocaleString()}`;
  };

  const renderCreatorCard = (creator: Creator) => (
    <Pressable
      key={creator._id}
      style={styles.creatorCard}
      onPress={() => router.push(`/creator/${creator._id}`)}
    >
      <View style={styles.creatorHeader}>
        <LinearGradient
          colors={['#9333EA', '#EC4899']}
          style={styles.avatarContainer}
        >
          {creator.avatar ? (
            <View style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={28} color="#fff" />
          )}
        </LinearGradient>
        <View style={styles.creatorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.creatorName} numberOfLines={1}>
              {creator.displayName}
            </Text>
            {creator.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            )}
          </View>
          <Text style={styles.categoryText}>{creator.category}</Text>
          {creator.bio && (
            <Text style={styles.bio} numberOfLines={1}>
              {creator.bio}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.creatorStats}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={14} color={Colors.warning} />
          <Text style={styles.statText}>{creator.rating.toFixed(1)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={14} color={colors.neutral[400]} />
          <Text style={styles.statText}>
            {creator.stats.totalFollowers?.toLocaleString() || 0}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.statText}>
            {creator.stats.totalBookings || 0} bookings
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderListingCard = (listing: Listing) => (
    <Pressable
      key={listing._id}
      style={styles.listingCard}
      onPress={() => router.push(`/listing/${listing._id}`)}
    >
      <View style={styles.listingHeader}>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {listing.title}
          </Text>
          <Text style={styles.listingCreator}>
            by {listing.creatorId?.displayName || 'Creator'}
          </Text>
        </View>
        <View style={styles.listingType}>
          <Ionicons
            name={getListingIcon(listing.type)}
            size={16}
            color={Colors.brand.purple}
          />
        </View>
      </View>

      <View style={styles.listingFooter}>
        <View style={styles.listingPrice}>
          <Text style={styles.priceText}>{formatPrice(listing.price)}</Text>
          {listing.duration && (
            <Text style={styles.durationText}>{listing.duration} min</Text>
          )}
        </View>
        <View style={styles.listingStats}>
          <Text style={styles.listingStatText}>{listing.views} views</Text>
          <Text style={styles.listingStatText}>{listing.bookings} booked</Text>
        </View>
      </View>
    </Pressable>
  );

  const getListingIcon = (type: string) => {
    switch (type) {
      case 'service':
        return 'construct';
      case 'consulting':
        return 'chatbubbles';
      case 'booking':
        return 'calendar';
      case 'promotion':
        return 'megaphone';
      case 'product':
        return 'cube';
      default:
        return 'card';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Creator QR</Text>
          <Pressable
            style={styles.qrButton}
            onPress={() => router.push('/scanner')}
          >
            <Ionicons name="qr-code-scanner" size={24} color={Colors.brand.purple} />
          </Pressable>
        </View>
        <Text style={styles.headerSubtitle}>
          Discover creators, book services, and more
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search creators or services..."
            placeholderTextColor={colors.neutral[400]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryPill,
              selectedCategory === cat.id && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            {selectedCategory === cat.id ? (
              <LinearGradient
                colors={['#9333EA', '#EC4899']}
                style={styles.categoryPillGradient}
              >
                <Ionicons name={cat.icon as unknown} size={14} color="#fff" />
                <Text style={styles.categoryPillTextActive}>{cat.name}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.categoryPillNormal}>
                <Ionicons name={cat.icon as unknown} size={14} color={colors.neutral[400]} />
                <Text style={styles.categoryPillText}>{cat.name}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Listing Types */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typesScroll}
        contentContainerStyle={styles.typesContent}
      >
        {LISTING_TYPES.map((type) => (
          <Pressable
            key={type.id}
            style={[
              styles.typePill,
              selectedType === type.id && styles.typePillActive,
            ]}
            onPress={() =>
              setSelectedType(selectedType === type.id ? null : type.id)
            }
          >
            <Ionicons
              name={type.icon as unknown}
              size={16}
              color={
                selectedType === type.id ? Colors.brand.purple : colors.neutral[500]
              }
            />
            <Text
              style={[
                styles.typePillText,
                selectedType === type.id && styles.typePillTextActive,
              ]}
            >
              {type.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brand.purple} />
          </View>
        ) : (
          <>
            {/* Creators Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Creators</Text>
                <Pressable onPress={() => router.push('/creators')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.creatorsList}
              >
                {creators.map(renderCreatorCard)}
              </ScrollView>
            </View>

            {/* Listings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedType
                    ? LISTING_TYPES.find((t) => t.id === selectedType)?.name
                    : 'Trending'}
                </Text>
                <Pressable onPress={() => router.push('/listings')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              <View style={styles.listingsGrid}>
                {listings
                  .filter(
                    (l) => !selectedType || l.type === selectedType
                  )
                  .map(renderListingCard)}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Hint */}
      <View style={styles.bottomHint}>
        <Ionicons name="scan-outline" size={20} color={Colors.brand.purple} />
        <Text style={styles.bottomHintText}>
          Scan a Creator QR to view their profile
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: Spacing.base,
    paddingTop: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.primary,
  },
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    ...Typography.body,
    color: colors.text.secondary,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.text.primary,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  categoryPill: {
    marginRight: Spacing.sm,
  },
  categoryPillActive: {},
  categoryPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  categoryPillNormal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
  },
  categoryPillText: {
    ...Typography.bodySmall,
    color: colors.neutral[400],
  },
  categoryPillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  typesScroll: {
    maxHeight: 44,
  },
  typesContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
    marginRight: Spacing.sm,
  },
  typePillActive: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderWidth: 1,
    borderColor: Colors.brand.purple,
  },
  typePillText: {
    ...Typography.caption,
    color: colors.neutral[500],
  },
  typePillTextActive: {
    color: Colors.brand.purple,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  section: {
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
  },
  seeAllText: {
    ...Typography.bodySmall,
    color: Colors.brand.purple,
    fontWeight: '600',
  },
  creatorsList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  creatorCard: {
    width: 280,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  creatorHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.neutral[300],
  },
  creatorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  creatorName: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  categoryText: {
    ...Typography.caption,
    color: Colors.brand.purple,
    textTransform: 'capitalize',
  },
  bio: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  creatorStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    ...Typography.caption,
    color: colors.text.secondary,
  },
  listingsGrid: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  listingCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  listingCreator: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  listingType: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  listingPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  priceText: {
    ...Typography.h4,
    fontWeight: '700',
    color: Colors.success,
  },
  durationText: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  listingStats: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  listingStatText: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  bottomHintText: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
});
