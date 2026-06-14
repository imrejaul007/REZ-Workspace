// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Mall Category Page — Premium Product Grid
 *
 * Displays products within a mall category.
 * Design: Amazon/Myntra-grade 2-column product grid with sort, filter chips,
 * gradient hero banner, cashback badges, discount strikethrough, and Add to Cart.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import CachedImage from '@/components/ui/CachedImage';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import apiClient from '@/services/apiClient';
import { mallApi } from '../../../services/mallApi';
import MallEmptyState from '../../../components/mall/pages/MallEmptyState';
import MallLoadingSkeleton from '../../../components/mall/pages/MallLoadingSkeleton';
import { Spacing, BorderRadius } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { useIsMounted } from '@/hooks/useIsMounted';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.base * 2 - Spacing.sm) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  name: string;
  slug?: string;
  images: string[];
  pricing: {
    original: number;
    selling: number;
    discount?: number;
    currency?: string;
  };
  ratings?: { average: number; count: number };
  cashback?: { percentage: number; isActive: boolean };
  store?: { _id: string; name: string; logo?: string; location?: { city: string } };
  category?: { name: string; slug: string };
  isFeatured?: boolean;
  tags?: string[];
}

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'discount';

const SORT_OPTIONS: { key: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'default', label: 'Recommended', icon: 'sparkles-outline' },
  { key: 'price_asc', label: 'Price: Low–High', icon: 'arrow-up-outline' },
  { key: 'price_desc', label: 'Price: High–Low', icon: 'arrow-down-outline' },
  { key: 'discount', label: 'Best Discount', icon: 'pricetag-outline' },
  { key: 'rating', label: 'Top Rated', icon: 'star-outline' },
  { key: 'newest', label: 'New Arrivals', icon: 'time-outline' },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; count?: number }> = ({ rating, count }) => {
  const filled = Math.round(rating);
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : 'star-outline'}
          size={11}
          color={i <= filled ? colors.warningScale[400] : colors.neutral[300]}
        />
      ))}
      {count !== undefined && count > 0 && <Text style={starStyles.count}>({count})</Text>}
    </View>
  );
};

const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: { fontSize: 11, color: colors.neutral[500], marginLeft: 2 },
});

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const { pricing, ratings, cashback } = product;
  const hasDiscount = pricing.discount && pricing.discount > 0;
  const discountPct =
    pricing.discount ??
    (pricing.original > pricing.selling ? Math.round((1 - pricing.selling / pricing.original) * 100) : 0);
  const showCashback = cashback?.isActive && cashback.percentage > 0;
  // Calculate Rez Coins earned (cashback percentage of selling price, 1 coin = ₹1)
  const coinsEarned = showCashback ? Math.round((pricing.selling * cashback!.percentage) / 100) : 0;

  const formattedSelling = `₹${pricing.selling.toLocaleString('en-IN')}`;
  const formattedOriginal = `₹${pricing.original.toLocaleString('en-IN')}`;

  return (
    <Pressable style={productCardStyles.card} onPress={() => onPress(product)}>
      {/* Image Container */}
      <View style={productCardStyles.imageContainer}>
        {!imageError && product.images?.[0] ? (
          <CachedImage
            source={product.images[0]}
            style={productCardStyles.image}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <LinearGradient
            colors={[colors.background.tertiary, colors.background.secondary]}
            style={productCardStyles.imageFallback}
          >
            <Ionicons name="image-outline" size={36} color={colors.neutral[400]} />
          </LinearGradient>
        )}

        {/* Discount Badge */}
        {hasDiscount && discountPct > 0 && (
          <View style={productCardStyles.discountBadge}>
            <Text style={productCardStyles.discountBadgeText}>{discountPct}% OFF</Text>
          </View>
        )}

        {/* Rez Coins Badge */}
        {showCashback && coinsEarned > 0 && (
          <View style={productCardStyles.cashbackBadge}>
            <Ionicons name="diamond" size={10} color={colors.background.primary} />
            <Text style={productCardStyles.cashbackBadgeText}>Earn ₹{coinsEarned}</Text>
          </View>
        )}

        {/* Wishlist Button */}
        <Pressable style={productCardStyles.wishlistBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="heart-outline" size={16} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Info */}
      <View style={productCardStyles.info}>
        {/* Store name */}
        {product.store?.name && (
          <Text style={productCardStyles.storeName} numberOfLines={1}>
            {product.store.name}
          </Text>
        )}

        {/* Product name */}
        <Text style={productCardStyles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating */}
        {ratings && ratings.count > 0 && <StarRating rating={ratings.average} count={ratings.count} />}

        {/* Price Row */}
        <View style={productCardStyles.priceRow}>
          <Text style={productCardStyles.sellingPrice}>{formattedSelling}</Text>
          {hasDiscount && pricing.original > pricing.selling && (
            <Text style={productCardStyles.mrp}>{formattedOriginal}</Text>
          )}
        </View>

        {/* Coin earning preview */}
        {showCashback && coinsEarned > 0 && (
          <View style={productCardStyles.coinEarnRow}>
            <Ionicons name="diamond" size={12} color={colors.nileBlue} />
            <Text style={productCardStyles.coinEarnText}>
              Earn ₹{coinsEarned} {BRAND.COIN_NAME}
            </Text>
          </View>
        )}

        {/* Add to Cart */}
        <Pressable style={productCardStyles.addToCartBtn}>
          <Ionicons name="bag-add-outline" size={13} color={colors.background.primary} />
          <Text style={productCardStyles.addToCartText}>Add to Cart</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const productCardStyles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.nileBlue,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageFallback: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.brand.orange,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  cashbackBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.brand.green,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  cashbackBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background.primary,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 10,
    gap: 4,
  },
  storeName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  mrp: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  coinEarnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(26, 58, 82, 0.06)',
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  coinEarnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.nileBlue,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 6,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
});

// ─── Sort Sheet ───────────────────────────────────────────────────────────────

interface SortSheetProps {
  visible: boolean;
  activeSort: SortOption;
  onSelect: (s: SortOption) => void;
  onClose: () => void;
}

const SortSheet: React.FC<SortSheetProps> = ({ visible, activeSort, onSelect, onClose }) => {
  if (!visible) return null;
  return (
    <Pressable style={sortStyles.overlay} onPress={onClose}>
      <Pressable style={sortStyles.sheet} onPress={() => {}}>
        <View style={sortStyles.handle} />
        <Text style={sortStyles.title}>Sort By</Text>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            style={[sortStyles.option, activeSort === opt.key && sortStyles.optionActive]}
            onPress={() => {
              onSelect(opt.key);
              onClose();
            }}
          >
            <Ionicons
              name={opt.icon}
              size={18}
              color={activeSort === opt.key ? colors.nileBlue : colors.neutral[500]}
            />
            <Text style={[sortStyles.optionText, activeSort === opt.key && sortStyles.optionTextActive]}>
              {opt.label}
            </Text>
            {activeSort === opt.key && (
              <Ionicons name="checkmark" size={18} color={colors.nileBlue} style={{ marginLeft: 'auto' }} />
            )}
          </Pressable>
        ))}
      </Pressable>
    </Pressable>
  );
};

const sortStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 200,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingHorizontal: Spacing.base,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
  },
  optionActive: {
    backgroundColor: colors.background.tertiary,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
  },
  optionTextActive: {
    fontWeight: '700',
    color: colors.nileBlue,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

function CategoryProductsPage() {
  const params = useLocalSearchParams<unknown>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const isMounted = useIsMounted();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<unknown>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<SortOption>('default');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [activeVibe, setActiveVibe] = useState<string | null>(null);

  const LIMIT = 20;

  // Map sort option → API query params
  const getSortParams = (sort: SortOption): string => {
    switch (sort) {
      case 'price_asc':
        return '&sort=price&order=asc';
      case 'price_desc':
        return '&sort=price&order=desc';
      case 'rating':
        return '&sort=rating&order=desc';
      case 'newest':
        return '&sort=createdAt&order=desc';
      case 'discount':
        return '&sort=discount&order=desc';
      default:
        return '';
    }
  };

  const fetchProducts = useCallback(
    async (pageNum: number = 1, append: boolean = false, sort: SortOption = 'default') => {
      if (!slug) return;
      try {
        setError(null);
        const sortParams = getSortParams(sort);
        const response = await apiClient.get(
          `/products?category=${encodeURIComponent(slug)}&page=${pageNum}&limit=${LIMIT}${sortParams}`,
        );
        if (!isMounted()) return;

        const fetchedProducts: Product[] = (response.data as unknown) || [];
        const pagination = response.meta?.pagination;

        if (!isMounted()) return;
        setTotal(pagination?.total ?? fetchedProducts.length);
        if (!isMounted()) return;
        setTotalPages(pagination?.pages ?? 1);

        if (append) {
          if (!isMounted()) return;
          setProducts((prev) => [...prev, ...fetchedProducts]);
        } else {
          if (!isMounted()) return;
          setProducts(fetchedProducts);
        }
      } catch (err) {
        if (!isMounted()) return;
        setError(err.message || 'Failed to load products');
      } finally {
        if (!isMounted()) return;
        setIsLoading(false);
        if (!isMounted()) return;
        setIsRefreshing(false);
        if (!isMounted()) return;
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug],
  );

  const fetchCategory = useCallback(async () => {
    if (!slug) return;
    try {
      const result = await mallApi.getMallStoresByCategorySlug(slug, 1, 1);
      if (!isMounted()) return;
      if (result.category) setCategory(result.category);
    } catch {
      // Non-fatal — category metadata is decorative
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    setIsLoading(true);
    setPage(1);
    fetchCategory();
    fetchProducts(1, false, activeSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    fetchProducts(1, false, activeSort);
  }, [fetchProducts, activeSort]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    const next = page + 1;
    setPage(next);
    fetchProducts(next, true, activeSort);
  }, [page, totalPages, isLoadingMore, fetchProducts, activeSort]);

  const handleSortChange = useCallback(
    (sort: SortOption) => {
      setActiveSort(sort);
      setIsLoading(true);
      setPage(1);
      fetchProducts(1, false, sort);
    },
    [fetchProducts],
  );

  const handleProductPress = useCallback(
    (product: Product) => {
      router.push(`/product-page?cardId=${product._id}&cardType=product` as unknown as string);
    },
    [router],
  );

  // Category vibes (from API) — horizontal quick filter
  const vibes: { id: string; name: string; icon: string; color: string }[] = category?.vibes || [];
  const occasions: { id: string; name: string; icon: string; color: string; tag?: string; discount?: number }[] =
    category?.occasions || [];
  const quickFilters = [...vibes, ...occasions].slice(0, 8);

  // Grid renderer: two columns using numColumns = 2 equivalent via pairs
  const renderItem = useCallback(
    ({ item }: { item: Product | 'spacer' }) => {
      if (item === 'spacer') return <View style={{ width: CARD_WIDTH }} />;
      return <ProductCard product={item} onPress={handleProductPress} />;
    },
    [handleProductPress],
  );

  // Pair products into rows for the grid
  const gridData = useCallback((): (Product | 'spacer')[] => {
    const result: (Product | 'spacer')[] = [...products];
    if (result.length % 2 !== 0) result.push('spacer');
    return result;
  }, [products]);

  const keyExtractor = useCallback((item: Product | 'spacer', index: number) => {
    if (item === 'spacer') return `spacer-${index}`;
    return item._id || `${index}`;
  }, []);

  // ── Hero gradient colours
  const catColor =
    category?.pageConfig?.theme?.primaryColor || category?.metadata?.color || category?.color || colors.nileBlue;

  const heroGradient: [string, string, string] = [catColor, `${catColor}CC`, colors.nileBlue];

  const ListHeader = useCallback(
    () => (
      <View>
        {/* ── Hero Banner ── */}
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[headerStyles.hero, { paddingTop: insets.top + 64 }]}
        >
          {/* Decorative circles */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[headerStyles.circle, headerStyles.circle1]} />
            <View style={[headerStyles.circle, headerStyles.circle2]} />
            <View style={[headerStyles.circle, headerStyles.circle3]} />
          </View>

          {/* Banner image overlay */}
          {category?.bannerImage && (
            <CachedImage source={category.bannerImage} style={headerStyles.bannerImage} contentFit="cover" />
          )}
          <View style={headerStyles.bannerOverlay} />

          {/* Category icon + name */}
          <View style={headerStyles.heroContent}>
            {category?.icon ? (
              <Text style={headerStyles.categoryEmoji}>{category.icon}</Text>
            ) : (
              <View style={headerStyles.iconCircle}>
                <Ionicons name="grid-outline" size={36} color={colors.text.inverse} />
              </View>
            )}
            <Text style={headerStyles.categoryTitle}>
              {category?.name || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : 'Category')}
            </Text>
            {category?.description ? <Text style={headerStyles.categorySubtitle}>{category.description}</Text> : null}

            {/* Stats row */}
            <View style={headerStyles.statsRow}>
              <View style={headerStyles.statPill}>
                <Ionicons name="cube-outline" size={14} color={colors.text.inverse} />
                <Text style={headerStyles.statText}>{total} Products</Text>
              </View>
              {(category?.maxCashback || 0) > 0 && (
                <View style={headerStyles.statPill}>
                  <Ionicons name="gift-outline" size={14} color={colors.text.inverse} />
                  <Text style={headerStyles.statText}>
                    Up to {category.maxCashback}% {BRAND.COIN_NAME}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Filter Vibes ── */}
        {quickFilters.length > 0 && (
          <View style={headerStyles.vibesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={headerStyles.vibesScroll}
            >
              {quickFilters.map((vibe) => {
                const isActive = activeVibe === vibe.id;
                return (
                  <Pressable
                    key={vibe.id}
                    style={[headerStyles.vibeChip, isActive && { backgroundColor: vibe.color || colors.nileBlue }]}
                    onPress={() => setActiveVibe(isActive ? null : vibe.id)}
                  >
                    <Text style={headerStyles.vibeEmoji}>{vibe.icon}</Text>
                    <Text style={[headerStyles.vibeLabel, isActive && headerStyles.vibeLabelActive]}>{vibe.name}</Text>
                    {'discount' in vibe && (vibe as unknown).discount && (
                      <View style={headerStyles.vibeDiscountBadge}>
                        <Text style={headerStyles.vibeDiscountText}>{(vibe as unknown).discount}%</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Sort & Filter Bar ── */}
        <View style={headerStyles.toolbar}>
          <Text style={headerStyles.resultCount}>
            {products.length} of {total} results
          </Text>
          <View style={headerStyles.toolbarRight}>
            <Pressable style={headerStyles.toolbarBtn} onPress={() => setShowSortSheet(true)}>
              <Ionicons name="swap-vertical-outline" size={16} color={colors.nileBlue} />
              <Text style={headerStyles.toolbarBtnText}>
                {SORT_OPTIONS.find((s) => s.key === activeSort)?.label ?? 'Sort'}
              </Text>
            </Pressable>
            <Pressable style={headerStyles.toolbarBtn}>
              <Ionicons name="options-outline" size={16} color={colors.nileBlue} />
              <Text style={headerStyles.toolbarBtnText}>Filter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, total, products.length, insets.top, quickFilters, activeVibe, activeSort, heroGradient],
  );

  const ListFooter = useCallback(() => {
    if (isLoadingMore) {
      return (
        <View style={footerStyles.container}>
          <ActivityIndicator size="small" color={colors.nileBlue} />
          <Text style={footerStyles.text}>Loading more products…</Text>
        </View>
      );
    }
    if (products.length > 0 && products.length >= total) {
      return (
        <View style={footerStyles.endContainer}>
          <Text style={footerStyles.endText}>You've seen all {total} products</Text>
        </View>
      );
    }
    return <View style={{ height: insets.bottom + 100 }} />;
  }, [isLoadingMore, products.length, total, insets.bottom]);

  const ListEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={{ paddingHorizontal: Spacing.base, paddingTop: 40 }}>
        <MallEmptyState
          title="No products yet"
          message="We're adding more products to this category soon!"
          icon="bag-outline"
          actionLabel="Browse Mall"
          onAction={() => router.push('/mall' as unknown as string)}
        />
      </View>
    );
  }, [isLoading, router]);

  // ── Loading State
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={pageStyles.container}>
          <MallLoadingSkeleton count={6} type="grid" />
        </View>
      </>
    );
  }

  // ── Error State
  if (error) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={pageStyles.container}>
          <MallEmptyState
            title="Something went wrong"
            message={error}
            icon="alert-circle-outline"
            actionLabel="Try Again"
            onAction={handleRefresh}
          />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={pageStyles.container}>
        {/* Back Button */}
        <Pressable
          style={[pageStyles.backButton, { top: insets.top + 10 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={pageStyles.backButtonInner}>
            <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
          </View>
        </Pressable>

        {/* Product Grid */}
        <FlashList
          data={gridData()}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          contentContainerStyle={pageStyles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          estimatedItemSize={360}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.nileBlue}
              colors={[colors.nileBlue]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
        />

        {/* Sort Bottom Sheet */}
        <SortSheet
          visible={showSortSheet}
          activeSort={activeSort}
          onSelect={handleSortChange}
          onClose={() => setShowSortSheet(false)}
        />
      </View>
    </>
  );
}

// ─── Page Styles ──────────────────────────────────────────────────────────────

const pageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 120,
  },
});

const headerStyles = StyleSheet.create({
  hero: {
    paddingBottom: 28,
    paddingHorizontal: Spacing.base,
    overflow: 'hidden',
    // negative margin to bleed edge-to-edge (compensate FlashList padding)
    marginHorizontal: -Spacing.base,
    marginBottom: Spacing.base,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle1: { width: 220, height: 220, top: -60, right: -60 },
  circle2: { width: 160, height: 160, bottom: -40, left: -40 },
  circle3: { width: 90, height: 90, top: 70, left: 50 },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  categoryEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  // Vibes
  vibesSection: {
    marginHorizontal: -Spacing.base,
    marginBottom: Spacing.sm,
  },
  vibesScroll: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    gap: 8,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  vibeEmoji: { fontSize: 16 },
  vibeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  vibeLabelActive: {
    color: colors.text.inverse,
  },
  vibeDiscountBadge: {
    backgroundColor: colors.brand.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vibeDiscountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  // Toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: Spacing.sm,
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  toolbarBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.nileBlue,
  },
});

const footerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: 10,
  },
  text: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  endContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  endText: {
    fontSize: 13,
    color: colors.neutral[400],
    fontWeight: '500',
  },
});

export default withErrorBoundary(CategoryProductsPage, 'MallCategorySlug');
