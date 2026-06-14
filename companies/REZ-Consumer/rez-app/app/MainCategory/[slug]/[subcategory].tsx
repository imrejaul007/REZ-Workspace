// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Shared Subcategory Page
 * Dynamic route: /MainCategory/[slug]/[subcategory]
 * Renders a filtered store list (theme-driven)
 * Also handles action pages (compare-devices, book-table, etc.) via lazy loading
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { CardGridSkeleton } from '@/components/skeletons';
import CachedImage from '@/components/ui/CachedImage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getCategoryTheme, SHARED_COLORS } from '@/config/categoryThemeConfig';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storesApi } from '@/services/storesApi';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { getCategoryConfig } from '@/config/categoryConfig';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { isStoreOpen } from '@/types/unified/guards';

// Subcategory metadata for icons and colors
const SUBCATEGORY_META: Record<
  string,
  { title: string; description: string; icon: string; color: string; emoji: string; filterTags: string[] }
> = {
  'mobile-phones': {
    title: 'Mobile Phones',
    description: 'Smartphones & feature phones',
    icon: 'phone-portrait-outline',
    color: colors.infoScale[400],
    emoji: '\uD83D\uDCF1',
    filterTags: ['5G', 'Flagship', 'Budget', 'Refurbished', 'Foldable'],
  },
  laptops: {
    title: 'Laptops',
    description: 'Notebooks, ultrabooks & workstations',
    icon: 'laptop-outline',
    color: colors.brand.indigo,
    emoji: '\uD83D\uDCBB',
    filterTags: ['Gaming', 'Business', 'Ultrabook', 'Budget', '2-in-1'],
  },
  televisions: {
    title: 'Televisions',
    description: 'Smart TVs, OLED, QLED & LED',
    icon: 'tv-outline',
    color: colors.brand.purpleLight,
    emoji: '\uD83D\uDCFA',
    filterTags: ['4K', 'OLED', 'QLED', 'Smart TV', 'Budget'],
  },
  cameras: {
    title: 'Cameras',
    description: 'DSLR, mirrorless & action cameras',
    icon: 'camera-outline',
    color: colors.brand.pink,
    emoji: '\uD83D\uDCF7',
    filterTags: ['DSLR', 'Mirrorless', 'Action', 'Instant', 'Drone'],
  },
  'audio-headphones': {
    title: 'Audio & Headphones',
    description: 'Headphones, speakers & soundbars',
    icon: 'headset-outline',
    color: colors.error,
    emoji: '\uD83C\uDFA7',
    filterTags: ['Wireless', 'ANC', 'Earbuds', 'Speakers', 'Soundbar'],
  },
  gaming: {
    title: 'Gaming',
    description: 'Consoles, gaming PCs & accessories',
    icon: 'game-controller-outline',
    color: colors.success,
    emoji: '\uD83C\uDFAE',
    filterTags: ['Console', 'PC Gaming', 'VR', 'Controllers', 'Monitors'],
  },
  accessories: {
    title: 'Accessories',
    description: 'Cases, chargers, cables & more',
    icon: 'hardware-chip-outline',
    color: colors.warningScale[400],
    emoji: '\uD83D\uDD0C',
    filterTags: ['Chargers', 'Cases', 'Cables', 'Adapters', 'Storage'],
  },
  smartwatches: {
    title: 'Smartwatches',
    description: 'Wearables & fitness trackers',
    icon: 'watch-outline',
    color: colors.tealGreen,
    emoji: '\u231A',
    filterTags: ['Fitness', 'Premium', 'Kids', 'Budget', 'LTE'],
  },
  // Food & Dining subcategories
  cafes: {
    title: 'Cafes',
    description: 'Coffee shops & tea houses',
    icon: 'cafe-outline',
    color: colors.warningScale[400],
    emoji: '\u2615',
    filterTags: ['Coffee', 'Tea', 'Brunch', 'WiFi', 'Quiet'],
  },
  'qsr-fast-food': {
    title: 'QSR & Fast Food',
    description: 'Quick service restaurants',
    icon: 'fast-food-outline',
    color: colors.error,
    emoji: '\uD83C\uDF54',
    filterTags: ['Burgers', 'Pizza', 'Wraps', 'Combos', 'Value Meals'],
  },
  'fine-dining': {
    title: 'Fine Dining',
    description: 'Upscale dining experiences',
    icon: 'restaurant-outline',
    color: colors.brand.purpleLight,
    emoji: '\uD83C\uDF7D\uFE0F',
    filterTags: ['Romantic', 'Business', 'Tasting Menu', 'Premium', 'Buffet'],
  },
  'bakery-confectionery': {
    title: 'Bakery & Confectionery',
    description: 'Breads, cakes & sweets',
    icon: 'storefront-outline',
    color: colors.brand.pink,
    emoji: '\uD83C\uDF70',
    filterTags: ['Cakes', 'Pastry', 'Bread', 'Custom Orders', 'Eggless'],
  },
  'cloud-kitchens': {
    title: 'Cloud Kitchens',
    description: 'Delivery-only restaurants',
    icon: 'cloud-outline',
    color: colors.infoScale[400],
    emoji: '\u2601\uFE0F',
    filterTags: ['Fast Delivery', 'Budget', 'Multi-Cuisine', 'Healthy', 'Combos'],
  },
  'ice-cream-dessert': {
    title: 'Ice Cream & Desserts',
    description: 'Ice creams, waffles & more',
    icon: 'ice-cream-outline',
    color: colors.brand.pink,
    emoji: '\uD83C\uDF66',
    filterTags: ['Gelato', 'Waffles', 'Shakes', 'Sundae', 'Vegan'],
  },
  'family-restaurants': {
    title: 'Family Restaurants',
    description: 'Great meals for the whole family',
    icon: 'people-outline',
    color: colors.success,
    emoji: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67',
    filterTags: ['Kids Menu', 'Large Portions', 'Buffet', 'Multi-Cuisine', 'Party Hall'],
  },
  'street-food': {
    title: 'Street Food',
    description: 'Chaats, snacks & local bites',
    icon: 'nutrition-outline',
    color: colors.warningScale[400],
    emoji: '\uD83C\uDF62',
    filterTags: ['Chaat', 'Momos', 'Rolls', 'Pani Puri', 'Bhel'],
  },
  // Beauty & Wellness subcategories
  salons: {
    title: 'Salons',
    description: 'Hair salons',
    icon: 'scissors-outline',
    color: colors.deepPink,
    emoji: '\uD83D\uDC87',
    filterTags: ['Haircut', 'Color', 'Keratin', 'Blowout', 'Ladies'],
  },
  spas: {
    title: 'Spas & Massage',
    description: 'Spa & massage',
    icon: 'leaf-outline',
    color: colors.brand.purpleLight,
    emoji: '\uD83E\uDDD6',
    filterTags: ['Massage', 'Spa Package', 'Aromatherapy', 'Body Wrap', 'Couples'],
  },
  'skin-care': {
    title: 'Skin Care',
    description: 'Skin care clinics',
    icon: 'sparkles-outline',
    color: colors.warningScale[400],
    emoji: '\u2728',
    filterTags: ['Facial', 'HydraFacial', 'Peel', 'Laser', 'Derma'],
  },
  'nail-art': {
    title: 'Nail Art',
    description: 'Nail salons',
    icon: 'color-palette-outline',
    color: colors.brand.pink,
    emoji: '\uD83D\uDC85',
    filterTags: ['Manicure', 'Pedicure', 'Gel Nails', 'Nail Art', 'Acrylic'],
  },
  'barber-shops': {
    title: 'Barber Shops',
    description: 'Barbershops',
    icon: 'cut-outline',
    color: colors.infoScale[400],
    emoji: '\uD83D\uDC88',
    filterTags: ['Haircut', 'Shave', 'Beard Trim', 'Fade', 'Hair Color'],
  },
  ayurvedic: {
    title: 'Ayurvedic & Wellness',
    description: 'Ayurvedic wellness',
    icon: 'fitness-outline',
    color: colors.success,
    emoji: '\uD83E\uDDD8',
    filterTags: ['Panchakarma', 'Abhyanga', 'Herbal', 'Yoga', 'Meditation'],
  },
  'makeup-studio': {
    title: 'Makeup Studios',
    description: 'Makeup studios',
    icon: 'brush-outline',
    color: colors.error,
    emoji: '\uD83D\uDC84',
    filterTags: ['Bridal', 'Party Makeup', 'HD Makeup', 'Airbrush', 'Natural'],
  },
  'men-grooming': {
    title: "Men's Grooming",
    description: "Men's grooming",
    icon: 'man-outline',
    color: colors.brand.indigo,
    emoji: '\uD83E\uDDD4',
    filterTags: ['Haircut', 'Beard', 'Shave', 'Grooming Package', 'Facial'],
  },
  // Fashion subcategories
  'mens-clothing': {
    title: "Men's Fashion",
    description: 'Clothing & apparel for men',
    icon: 'shirt-outline',
    color: colors.brand.indigo,
    emoji: '\uD83D\uDC54',
    filterTags: ['men', 'shirts', 'trousers'],
  },
  'womens-clothing': {
    title: "Women's Fashion",
    description: 'Clothing & apparel for women',
    icon: 'rose-outline',
    color: colors.deepPink,
    emoji: '\uD83D\uDC57',
    filterTags: ['women', 'dresses', 'tops'],
  },
  'kids-clothing': {
    title: 'Kids Fashion',
    description: 'Clothing for kids & children',
    icon: 'happy-outline',
    color: colors.warningScale[400],
    emoji: '\uD83D\uDC76',
    filterTags: ['kids', 'children'],
  },
  footwear: {
    title: 'Footwear',
    description: 'Shoes, sneakers & heels',
    icon: 'footsteps-outline',
    color: colors.tealGreen,
    emoji: '\uD83D\uDC9F',
    filterTags: ['shoes', 'sneakers', 'heels'],
  },
  jewelry: {
    title: 'Jewelry & Accessories',
    description: 'Jewelry, accessories & more',
    icon: 'diamond-outline',
    color: colors.brand.purpleLight,
    emoji: '\uD83D\uDC8E',
    filterTags: ['jewelry', 'accessories'],
  },
  watches: {
    title: 'Watches',
    description: 'Watches & smartwatches',
    icon: 'watch-outline',
    color: colors.infoScale[400],
    emoji: '\u231A',
    filterTags: ['watches', 'smartwatch'],
  },
  'ethnic-wear': {
    title: 'Ethnic & Traditional',
    description: 'Ethnic, traditional & festive wear',
    icon: 'color-palette-outline',
    color: colors.error,
    emoji: '\uD83EDE77',
    filterTags: ['ethnic', 'traditional', 'saree'],
  },
  sportswear: {
    title: 'Sportswear',
    description: 'Sports, gym & activewear',
    icon: 'fitness-outline',
    color: colors.success,
    emoji: '\uD83C\uDFC3',
    filterTags: ['sports', 'gym', 'activewear'],
  },
};

// Sort options
const SORT_OPTIONS = [
  { id: 'rating', label: 'Rating', icon: 'star-outline' },
  { id: 'distance', label: 'Distance', icon: 'location-outline' },
  { id: 'price', label: 'Price', icon: 'pricetag-outline' },
  { id: 'newest', label: 'Newest', icon: 'time-outline' },
];

// Filter chips
const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'open-now', label: 'Open Now', icon: '\uD83D\uDD53' },
  { id: 'premium', label: 'Premium', icon: '\uD83D\uDC8E' },
  { id: 'budget', label: 'Budget', icon: '\uD83D\uDCB0' },
  { id: 'verified', label: 'Verified', icon: '\u2713' },
  { id: 'top-rated', label: 'Top Rated', icon: '\u2B50' },
  { id: 'cashback', label: 'Cashback', icon: '\uD83E\uDE99' },
];

// Store Card (reusable)
function StoreCard({ store, currencySymbol }: { store; currencySymbol: string }) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const imageUri = store.banner?.[0] || store.banner || store.logo || store.image;
  const isPremium = store.tags?.some((t: string) => t.toLowerCase() === 'premium');
  const isBudget = store.tags?.some((t: string) => t.toLowerCase() === 'budget');
  const isOpenNow = store.tags?.some((t: string) => t.toLowerCase() === 'open-now');
  // BUG-097 FIX: Guard against non-numeric cashbackPercent producing NaN coins.
  // store.offers?.cashback may be undefined, a string, or a non-finite number from the API.
  const _rawCashback = Number(store.offers?.cashback);
  const cashbackPercent = Number.isFinite(_rawCashback) && _rawCashback > 0 ? _rawCashback : 0;

  const serviceTags =
    (store.tags || [])
      .filter((t: string) => !['premium', 'budget', 'open-now'].includes(t.toLowerCase()))
      .slice(0, 3)
      .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(' \u2022 ') ||
    store.category?.name ||
    'Store';

  return (
    <Pressable
      style={styles.storeCard}
      onPress={() => router.push(`/MainStorePage?storeId=${store._id || store.id}` as unknown as string)}
    >
      <View style={styles.storeImageContainer}>
        {imageUri && !imageError ? (
          <CachedImage
            source={imageUri}
            style={styles.storeImage}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.storeImage, styles.storeImagePlaceholder]}>
            <Ionicons name="storefront-outline" size={32} color={SHARED_COLORS.textSecondary} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.storeImageGradient} />

        {/* Badges */}
        <View style={styles.storeBadges}>
          {store.deliveryCategories?.fastDelivery && (
            <View style={styles.badge60Min}>
              <Ionicons name="flash" size={10} color={colors.text.primary} />
              <Text style={styles.badge60MinText}>60 min</Text>
            </View>
          )}
          {isOpenNow && (
            <View style={[styles.badgeTag, { backgroundColor: Colors.success }]}>
              <Text style={styles.badgeTagText}>Open Now</Text>
            </View>
          )}
          {isPremium && (
            <View style={[styles.badgeTag, { backgroundColor: Colors.brand.purpleLight }]}>
              <Text style={styles.badgeTagText}>Premium</Text>
            </View>
          )}
          {isBudget && (
            <View style={[styles.badgeTag, { backgroundColor: Colors.success }]}>
              <Text style={styles.badgeTagText}>Budget</Text>
            </View>
          )}
          {cashbackPercent > 0 && (
            <View style={[styles.badgeTag, { backgroundColor: Colors.info }]}>
              <Text style={styles.badgeTagText}>{cashbackPercent}% cashback</Text>
            </View>
          )}
        </View>

        {/* Rating */}
        <View style={styles.storeRating}>
          <Ionicons name="star" size={12} color={Colors.warning} />
          <Text style={styles.storeRatingText}>{(store.ratings?.average || 4.5).toFixed(1)}</Text>
          <Text style={styles.storeRatingCount}>({store.ratings?.count || 0})</Text>
        </View>
      </View>

      <View style={styles.storeContent}>
        <Text style={styles.storeName} numberOfLines={1}>
          {store.name}
        </Text>
        <Text style={styles.storeCuisine} numberOfLines={1}>
          {serviceTags}
        </Text>

        <View style={styles.storeMeta}>
          <View style={styles.storeMetaItem}>
            <Ionicons name="location-outline" size={12} color={SHARED_COLORS.textSecondary} />
            <Text style={styles.storeMetaText}>{store.location?.city || 'Nearby'}</Text>
          </View>
          <View style={styles.storeMetaItem}>
            <Ionicons name="time-outline" size={12} color={SHARED_COLORS.textSecondary} />
            <Text style={styles.storeMetaText}>{store.operationalInfo?.deliveryTime || '30-45 min'}</Text>
          </View>
          {store.priceForTwo && (
            <Text style={styles.storePriceForTwo}>
              {currencySymbol}
              {store.priceForTwo} avg.
            </Text>
          )}
        </View>

        {cashbackPercent > 0 && (
          <View style={styles.storeRewardsRow}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.storeCoinsText}>
              Earn {currencySymbol}
              {Math.round(cashbackPercent * 4.5) || 0} coins
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function SharedCategoryPage() {
  const isMounted = useIsMounted();
  const { subcategory, slug } = useLocalSearchParams<unknown>();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const [stores, setStores] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeSort, setActiveSort] = useState('rating');
  const [activeFilter, setActiveFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);

  const categoryTheme = getCategoryTheme(slug || '');
  const meta = SUBCATEGORY_META[subcategory || ''] || {
    title:
      getCategoryConfig(slug || '')?.subcategories?.find((s) => s.slug === subcategory)?.name ||
      (subcategory?.split('-') || []).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') ||
      categoryTheme.name,
    description: '',
    icon:
      getCategoryConfig(slug || '')?.subcategories?.find((s) => s.slug === subcategory)?.icon ||
      categoryTheme.defaultMissionIcon ||
      'storefront-outline',
    color: categoryTheme.primaryColor,
    emoji: '\uD83C\uDFEA',
    filterTags: [],
  };

  // Format subcategory slug to display name
  const subcategoryName = useMemo(() => {
    if (!subcategory) return getCategoryConfig(slug || '')?.name || 'Browse';
    // Check config for proper name
    const config = getCategoryConfig(slug || 'electronics');
    const sub = config?.subcategories?.find((s) => s.slug === subcategory);
    if (sub) return sub.name;
    // Fallback: check our local meta
    if (SUBCATEGORY_META[subcategory]) return SUBCATEGORY_META[subcategory].title;
    // Last fallback: convert slug to title
    return (subcategory.split('-') as string[]).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [subcategory, slug]);

  const fetchStores = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      if (!subcategory) return;

      try {
        if (pageNum === 1) {
          if (!isMounted()) return;
          setFetchError(null);
          if (!isRefresh) setIsLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await storesApi.getStoresBySubcategorySlug(subcategory, 20, pageNum);

        if (response.success && response.data) {
          const storesData = Array.isArray(response.data) ? response.data : response.data.stores || [];
          const total = response.data.pagination?.total ?? storesData.length;
          if (!isMounted()) return;
          setTotalCount(total);

          if (pageNum === 1) {
            if (!isMounted()) return;
            setStores(storesData);
          } else {
            if (!isMounted()) return;
            setStores((prev) => [...prev, ...storesData]);
          }

          if (!isMounted()) return;
          setHasMore(storesData.length >= 20);
        }
      } catch (err) {
        // BUG-025: surface the error to the user instead of silently swallowing it
        if (!isMounted()) return;
        setFetchError('Unable to load stores. Please check your connection and try again.');
      } finally {
        if (!isMounted()) return;
        setIsLoading(false);
        if (!isMounted()) return;
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subcategory],
  );

  useEffect(() => {
    fetchStores(1);
  }, [fetchStores]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchStores(1, true);
    if (!isMounted()) return;
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchStores(nextPage);
    }
  };

  // Apply client-side filters and sorting
  const filteredStores = useMemo(() => {
    let result = [...stores];

    // Apply filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'open-now':
          result = result.filter((s) => isStoreOpen(s.operationalInfo?.hours || s.hours));
          break;
        case 'premium':
          result = result.filter((s) => s.tags?.some((t: string) => t.toLowerCase() === 'premium'));
          break;
        case 'budget':
          result = result.filter((s) => s.tags?.some((t: string) => t.toLowerCase() === 'budget'));
          break;
        case 'verified':
          result = result.filter((s) => s.isVerified);
          break;
        case 'top-rated':
          result = result.filter((s) => (s.ratings?.average || 0) >= 4.0);
          break;
        case 'cashback':
          result = result.filter((s) => (s.offers?.cashback || 0) > 0);
          break;
      }
    }

    // Apply sort
    switch (activeSort) {
      case 'rating':
        result.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
        break;
      case 'distance':
        result.sort((a, b) => (parseFloat(a.distance) || 999) - (parseFloat(b.distance) || 999));
        break;
      case 'price':
        result.sort((a, b) => (a.priceForTwo || 999) - (b.priceForTwo || 999));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    return result;
  }, [stores, activeFilter, activeSort]);

  const renderStoreItem = useCallback(
    ({ item }: { item: unknown }) => <StoreCard store={item} currencySymbol={currencySymbol} />,
    [currencySymbol],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <CardGridSkeleton />
      </SafeAreaView>
    );
  }

  // BUG-025: Show error state when fetch failed instead of silently showing an empty list
  if (fetchError && stores.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={{ padding: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={SHARED_COLORS.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={48} color={SHARED_COLORS.textSecondary} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: SHARED_COLORS.textPrimary,
              marginTop: 16,
              textAlign: 'center',
            }}
          >
            {fetchError}
          </Text>
          <Pressable
            onPress={() => fetchStores(1)}
            style={{
              marginTop: 16,
              backgroundColor: '#7B3EFF',
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={SHARED_COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerEmoji}>{meta.emoji}</Text>
          <View>
            <Text style={styles.headerTitle}>{subcategoryName}</Text>
            <Text style={styles.headerSubtitle}>{filteredStores.length} stores</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push(`/MainCategory/${slug}/search` as unknown as string)}>
          <Ionicons name="search-outline" size={22} color={SHARED_COLORS.textPrimary} />
        </Pressable>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortList}>
          {SORT_OPTIONS.map((sort) => (
            <Pressable
              key={sort.id}
              style={[styles.sortChip, activeSort === sort.id ? styles.sortChipActive : null]}
              onPress={() => setActiveSort(sort.id)}
            >
              <Ionicons
                name={sort.icon as unknown}
                size={14}
                color={activeSort === sort.id ? SHARED_COLORS.white : SHARED_COLORS.textSecondary}
              />
              <Text style={[styles.sortChipText, activeSort === sort.id ? styles.sortChipTextActive : null]}>
                {sort.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {FILTER_CHIPS.map((filter) => (
            <Pressable
              key={filter.id}
              style={[styles.filterChip, activeFilter === filter.id ? styles.filterChipActive : null]}
              onPress={() => setActiveFilter(filter.id)}
            >
              {filter.icon && <Text style={styles.filterChipIcon}>{filter.icon}</Text>}
              <Text style={[styles.filterChipText, activeFilter === filter.id ? styles.filterChipTextActive : null]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Store List */}
      {filteredStores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{meta.emoji}</Text>
          <Text style={styles.emptyTitle}>No stores found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters or check back later</Text>
          <Pressable style={styles.emptyButton} onPress={() => setActiveFilter('all')}>
            <Text style={styles.emptyButtonText}>Clear Filters</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={filteredStores}
          keyExtractor={(item) => item._id || item.id}
          estimatedItemSize={110}
          renderItem={renderStoreItem}
          contentContainerStyle={styles.storeList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[meta.color]} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={meta.color} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: colors.text.tertiary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEmoji: {
    ...Typography.h1,
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  sortBar: {
    backgroundColor: colors.background.primary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sortList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
    gap: 6,
  },
  sortChipActive: {
    backgroundColor: colors.text.primary,
  },
  sortChipText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: colors.text.inverse,
  },
  filterBar: {
    backgroundColor: colors.background.primary,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: Spacing.xs,
  },
  filterChipActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  filterChipIcon: {
    ...Typography.body,
  },
  filterChipText: {
    ...Typography.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  storeList: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
  },
  storeCard: {
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    ...Shadows.medium,
  },
  storeImageContainer: {
    height: 160,
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeImagePlaceholder: {
    backgroundColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  storeBadges: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  badge60Min: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning,
    gap: 3,
  },
  badge60MinText: {
    ...Typography.overline,
    fontWeight: '700',
    color: colors.text.primary,
  },
  badgeTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  badgeTagText: {
    ...Typography.overline,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  storeRating: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    gap: Spacing.xs,
  },
  storeRatingText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  storeRatingCount: {
    ...Typography.overline,
    color: colors.text.tertiary,
  },
  storeContent: {
    padding: Spacing.md,
  },
  storeName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  storeCuisine: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  storeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  storeMetaText: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  storePriceForTwo: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
  storeRewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
    gap: Spacing.xs,
  },
  storeCoinsText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: Colors.warning,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.info,
  },
  emptyButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  loadMoreContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

export default withErrorBoundary(SharedCategoryPage, 'MainCategorySlugSubcategory');
