// @ts-nocheck
/**
 * DynamicCategoryPage - Backend-Driven Category Page
 *
 * Replaces 12 hardcoded category page components with a single
 * backend-driven component. Fetches page configuration (theme, tabs,
 * sections, service types) from GET /categories/:slug/page-config
 * and renders the same quality UI as the original FoodDiningCategoryPage.
 *
 * Reuses all existing section components for consistency.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import CachedImage from '@/components/ui/CachedImage';
import logger from '@/utils/logger';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Section components
import CategoryHeader from '@/components/CategoryHeader';
import QuickActionBar from '@/components/category/QuickActionBar';
import BrowseCategoryGrid from '@/components/category/BrowseCategoryGrid';
import EnhancedAISuggestionsSection from '@/components/category/EnhancedAISuggestionsSection';
import StreakLoyaltySection from '@/components/category/StreakLoyaltySection';
import FooterTrustSection from '@/components/category/FooterTrustSection';
import OffersSection from '@/components/category/OffersSection';
import ExperiencesSection from '@/components/category/ExperiencesSection';
import OrderAgainSection from '@/components/category/OrderAgainSection';
import EnhancedUGCSocialProofSection from '@/components/category/EnhancedUGCSocialProofSection';
import SkeletonLoader from '@/components/skeletons/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Hooks
import { useCategoryPageConfig } from '@/hooks/useCategoryPageConfig';
import { useCategoryPageData } from '@/hooks/useCategoryPageData';
import { useSavingsInsights, useGetCurrencySymbol, useIsAuthenticated, useAuthLoading } from '@/stores/selectors';

// API services
import { categoriesApi } from '@/services/categoriesApi';
import { storesApi } from '@/services/storesApi';
import ordersApi, { Order } from '@/services/ordersApi';

// Types
import type {
  PageConfigSection,
  PageConfigServiceType,
} from '@/services/categoriesApi';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Per-section error boundary: isolates crashes so one section doesn't blank the whole page
class SectionErrorBoundary extends React.Component<
  { name: string; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    logger.warn(`[DynamicCategoryPage] Section "${this.props.name}" crashed:`, error?.message);
  }
  render() {
    if (this.state.hasError) return null; // Hide crashed section silently
    return this.props.children;
  }
}

// ============================================
// Props
// ============================================
interface DynamicCategoryPageProps {
  slug: string;
}

// Module-level flag: remember which slugs have loaded content (survives component remounts)
const _pageContentLoaded: Record<string, boolean> = {};

// ============================================
// Default sort options (fallback when pageConfig.sortOptions not set)
// ============================================
const DEFAULT_SORT_OPTIONS = [
  { id: 'popularity', label: 'Popularity', icon: 'trending-up-outline', enabled: true, sortOrder: 0 },
  { id: 'rating', label: 'Rating', icon: 'star-outline', enabled: true, sortOrder: 1 },
  { id: 'delivery_time', label: 'Delivery Time', icon: 'time-outline', enabled: true, sortOrder: 2 },
  { id: 'newest', label: 'Newest', icon: 'sparkles-outline', enabled: true, sortOrder: 3 },
];

// Module-level constant — prevents a new array being allocated on every render
// when pageConfig.storeDisplayConfig.tagExclusions is undefined.
const DEFAULT_TAG_EXCLUSIONS = ['halal', 'pure-veg', 'veg', 'non-veg', 'jain'];

// ============================================
// Tab icon fallback mapping (Upgrade 3)
// ============================================
/** Tab icon mapping for service types */
const TAB_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap | undefined> = {
  all: 'grid-outline',
  salon: 'scissors-outline',
  spa: 'leaf-outline',
  barber: 'cut-outline',
  delivery: 'bicycle-outline',
  'dine-in': 'restaurant-outline',
  dinein: 'restaurant-outline',
  restaurant: 'restaurant-outline',
  food: 'fast-food-outline',
  grocery: 'basket-outline',
  beauty: 'sparkles-outline',
  fitness: 'barbell-outline',
  health: 'medkit-outline',
  fashion: 'shirt-outline',
  electronics: 'hardware-chip-outline',
  education: 'book-outline',
  home: 'home-outline',
  travel: 'airplane-outline',
  entertainment: 'film-outline',
  financial: 'wallet-outline',
  offers: 'pricetag-outline',
  experiences: 'rocket-outline',
  trending: 'trending-up-outline',
  new: 'sparkles-outline',
};

// ============================================
// Promo carousel data (Upgrade 2)
// ============================================
const PROMO_CARDS = [
  {
    id: 'promo1',
    title: 'Up to 30% off',
    subtitle: 'On your first booking today',
    cta: 'Book Now',
    icon: 'pricetag-outline' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'promo2',
    title: 'Free Delivery',
    subtitle: 'On orders above ₹500',
    cta: 'Order Now',
    icon: 'bicycle-outline' as keyof typeof Ionicons.glyphMap,
  },
  {
    id: 'promo3',
    title: 'Earn 2x Coins',
    subtitle: 'This week only — don\'t miss out',
    cta: 'Explore',
    icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
  },
];

// ============================================
// Quick filter pills definition (Upgrade 5)
// ============================================
const QUICK_FILTER_PILLS = [
  { id: 'openNow', label: 'Open Now', icon: 'time-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'topRated', label: 'Top Rated', icon: 'star-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'freeDelivery', label: 'Free Delivery', icon: 'bicycle-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'cashback', label: 'Cashback', icon: 'cash-outline' as keyof typeof Ionicons.glyphMap },
  { id: 'new', label: 'New', icon: 'sparkles-outline' as keyof typeof Ionicons.glyphMap },
];

// ============================================
// Skeleton sub-components
// ============================================
const SectionHeaderSkeleton = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
    <SkeletonLoader width={20} height={20} variant="circle" />
    <SkeletonLoader width={150} height={18} borderRadius={6} />
    <View style={{ flex: 1 }} />
    <SkeletonLoader width={60} height={12} borderRadius={4} />
  </View>
);

const StoreCardSkeleton = ({ count = 3, variant = 'default' }: { count?: number; variant?: 'default' | 'compact' }) => {
  const isCompact = variant === 'compact';
  return (
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ backgroundColor: colors.background.primary, borderRadius: 12, overflow: 'hidden' }}>
          {!isCompact && <SkeletonLoader width="100%" height={140} borderRadius={0} />}
          <View style={{ padding: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isCompact && <SkeletonLoader width={48} height={48} borderRadius={8} />}
              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonLoader width="70%" height={14} borderRadius={4} />
                <SkeletonLoader width="50%" height={10} borderRadius={4} />
              </View>
              <SkeletonLoader width={36} height={18} borderRadius={9} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonLoader width={60} height={10} borderRadius={4} />
              <SkeletonLoader width={80} height={10} borderRadius={4} />
              <SkeletonLoader width={50} height={10} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// ============================================
// TYPES
// ============================================

/** Category/subcategory data */
interface CategoryData {
  id?: string;
  slug?: string;
  name?: string;
}

/** Quick action data from page config */
interface QuickActionData {
  id?: string;
  label?: string;
  icon?: string;
  route?: string;
  sortOrder?: number;
  enabled?: boolean;
  serviceFilter?: string;
}

/** Tab data from page config */
interface TabData {
  id?: string;
  label?: string;
  icon?: string;
  sortOrder?: number;
  enabled?: boolean;
  serviceFilter?: string;
  sectionOverride?: string;
}

/** Subcategory data for browse grid */
interface SubcategoryData {
  id?: string;
  _id?: string;
  slug?: string;
  name?: string;
  icon?: string;
}

/** Sort option data */
interface SortOptionData {
  id?: string;
  label?: string;
  icon?: string;
  enabled?: boolean;
  sortOrder?: number;
}

/** Store data from API - normalized shape */
export interface StoreCardData {
  _id?: string;
  id?: string;
  name: string;
  logo?: string;
  banner?: string | string[];
  image?: string;
  slug?: string;
  rating?: number;
  ratings?: {
    average?: number;
    count?: number;
  };
  cashback?: number;
  distance?: number;
  tags?: string[];
  rewardRules?: {
    baseCashbackPercent?: number;
    reviewBonusCoins?: number;
    visitMilestoneRewards?: Array<{ visits: number }>;
  };
  priceForTwo?: number;
  offers?: {
    cashback?: number;
  };
  operationalInfo?: {
    hours?: Record<string, { open?: string; close?: string; closed?: boolean }>;
    deliveryTime?: string;
    deliveryFee?: number;
    minimumOrder?: number;
    freeDeliveryAbove?: number;
  };
  deliveryCategories?: {
    fastDelivery?: boolean;
  };
  location?: {
    city?: string;
  };
  category?: {
    name?: string;
  };
  bookingType?: string;
  isNew?: boolean;
  showNewBadge?: boolean;
  isDineIn?: boolean;
  [key: string]: unknown;
}

// ============================================
// Helper: Check if store is currently open
// ============================================
const isStoreOpen = (store: StoreCardData): { isOpen: boolean; closingTime?: string } => {
  const hours = store.operationalInfo?.hours;
  if (!hours) return { isOpen: true };
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const today = days[now.getDay()];
  const dayHours = hours[today as keyof typeof hours] as { open?: string; close?: string; closed?: boolean } | undefined;
  if (!dayHours || dayHours.closed) return { isOpen: false };
  if (dayHours.open && dayHours.close) {
    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);
    return { isOpen: currentMinutes >= openMinutes && currentMinutes <= closeMinutes, closingTime: dayHours.close };
  }
  return { isOpen: true };
};

// ============================================
// StoreCard Component (replicates RestaurantCard)
// ============================================
const StoreCard = ({
  store,
  variant = 'default',
  userVisitCount = 0,
  showReserveButton = false,
  showNewBadge = false,
  primaryColor,
  categorySlug,
  tagExclusions = ['halal', 'pure-veg', 'veg', 'non-veg', 'jain'],
  coinsMultiplier = 4.5,
  defaultReviewBonus = 20,
  defaultVisitMilestone = 5,
}: {
  store: StoreCardData;
  variant?: 'default' | 'compact';
  userVisitCount?: number;
  showReserveButton?: boolean;
  showNewBadge?: boolean;
  primaryColor: string;
  categorySlug: string;
  tagExclusions?: string[];
  coinsMultiplier?: number;
  defaultReviewBonus?: number;
  defaultVisitMilestone?: number;
}) => {
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const isCompact = variant === 'compact';
  const [imageError, setImageError] = useState(false);
  const isMounted = useIsMounted();

  // Memoize derived values so they aren't recomputed on every parent re-render
  const imageUri = useMemo((): string | undefined => {
    if (store.banner) {
      if (Array.isArray(store.banner) && store.banner.length > 0) return store.banner[0];
      if (typeof store.banner === 'string') return store.banner;
    }
    return store.logo || store.image || undefined;
  }, [store.banner, store.logo, store.image]);

  const isHalal = useMemo(
    () => store.tags?.some((t: string) => t.toLowerCase() === 'halal'),
    [store.tags]
  );
  const isPureVeg = useMemo(
    () => store.tags?.some((t: string) => ['pure-veg', 'veg', 'vegetarian'].includes(t.toLowerCase())),
    [store.tags]
  );
  const openStatus = useMemo(() => isStoreOpen(store), [store]);

  const coinsEarned = useMemo(
    () =>
      store.rewardRules?.baseCashbackPercent
        ? Math.round(store.rewardRules.baseCashbackPercent * 10)
        : Math.round((store.offers?.cashback || 10) * coinsMultiplier),
    [store.rewardRules, store.offers?.cashback, coinsMultiplier]
  );

  const reviewBonus = store.rewardRules?.reviewBonusCoins || defaultReviewBonus;
  const visitMilestone = store.rewardRules?.visitMilestoneRewards?.[0]?.visits || defaultVisitMilestone;

  // Build tag pills for the tags row (Upgrade 1)
  const tagPills = useMemo((): string[] => {
    if (store.tags && Array.isArray(store.tags) && store.tags.length > 0) {
      return store.tags
        .filter((tag: string) => !tagExclusions.includes(tag.toLowerCase()))
        .slice(0, 3)
        .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1));
    }
    return store.category?.name ? [store.category.name] : [];
  }, [store.tags, store.category?.name, tagExclusions]);

  // Price range indicator (Upgrade 1)
  const priceRange = useMemo((): string => {
    const p = store.priceForTwo || 0;
    if (p === 0) return '';
    if (p < 300) return '₹';
    if (p < 700) return '₹₹';
    return '₹₹₹';
  }, [store.priceForTwo]);

  // Rating stars (Upgrade 8)
  const ratingValue = store.ratings?.average || store.rating || 4.5;
  const ratingCount = store.ratings?.count || 0;
  const ratingDisplay = useMemo(
    () =>
      ratingCount >= 1000
        ? `${(ratingCount / 1000).toFixed(1)}k`
        : ratingCount.toString(),
    [ratingCount]
  );

  const storeId = store._id || store.id;
  const handleStorePress = useCallback(
    () => router.push(`/MainStorePage?storeId=${storeId}`),
    [router, storeId]
  );
  const handleBookNowPress = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (showReserveButton) {
        router.push(`/MainCategory/${categorySlug}/book-table?storeId=${storeId}`);
      } else {
        router.push(`/MainStorePage?storeId=${storeId}`);
      }
    },
    [router, storeId, showReserveButton, categorySlug]
  );

  return (
    <Pressable
      style={[styles.storeCard, isCompact ? styles.storeCardCompact : null]}
      onPress={handleStorePress}

    >
      {/* ── Image Area (Upgrade 1: 160px banner) ── */}
      <View style={[styles.storeImageContainer, isCompact ? styles.storeImageContainerCompact : null]}>
        {imageUri && !imageError ? (
          <CachedImage
            source={imageUri}
            style={styles.storeImage}
            contentFit="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.storeImage, styles.storeImagePlaceholder]}>
            <Ionicons name="storefront" size={40} color={colors.neutral[400]} />
            <Text style={styles.storeImagePlaceholderText}>{store.name}</Text>
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          style={styles.storeImageGradient}
        />

        {/* Top-left badges */}
        <View style={styles.storeBadges}>
          {showNewBadge && (
            <View style={[styles.badgeNew, { backgroundColor: primaryColor }]}>
              <Text style={styles.badgeNewText}>NEW</Text>
            </View>
          )}
          <View style={[styles.badgeStatus, { backgroundColor: openStatus.isOpen ? colors.tint.greenLight : colors.errorScale[50] }]}>
            <View style={[styles.statusDot, { backgroundColor: openStatus.isOpen ? colors.success : colors.error }]} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: openStatus.isOpen ? colors.successScale[700] : colors.error }}>
              {openStatus.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
          {store.deliveryCategories?.fastDelivery && (
            <View style={styles.badge60Min}>
              <Ionicons name="flash" size={10} color={colors.text.primary} />
              <Text style={styles.badge60MinText}>60 min</Text>
            </View>
          )}
          {isHalal && (
            <View style={styles.badgeHalal}>
              <Text style={styles.badgeHalalText}>Halal</Text>
            </View>
          )}
          {isPureVeg && (
            <View style={styles.badgePureVeg}>
              <Text style={styles.badgePureVegText}>Pure Veg</Text>
            </View>
          )}
        </View>

        {/* Cashback badge overlaid on image (Upgrade 1 & 7) */}
        {store.offers?.cashback && (
          <View style={styles.cashbackOverlayBadge}>
            <Ionicons name="cash-outline" size={10} color={colors.background.primary} />
            <Text style={styles.cashbackOverlayText}>{store.offers.cashback}% cashback</Text>
          </View>
        )}

        {/* Distance badge overlaid on image (Upgrade 7) */}
        {store.distance && (
          <View style={styles.distanceOverlayBadge}>
            <Ionicons name="location-outline" size={10} color={colors.background.primary} />
            <Text style={styles.distanceOverlayText}>{store.distance} km</Text>
          </View>
        )}

        {/* Rating badge on image bottom-left (Upgrade 8) */}
        <View style={styles.storeRating}>
          <Ionicons name="star" size={11} color={colors.warningScale[400]} />
          <Text style={styles.storeRatingText}>{ratingValue.toFixed(1)}</Text>
          {ratingCount > 0 && (
            <Text style={styles.storeRatingCount}>({ratingDisplay})</Text>
          )}
        </View>
      </View>

      {/* ── Content Area ── */}
      <View style={styles.storeContent}>
        {/* Store name + inline rating stars (Upgrade 8) */}
        <View style={styles.storeNameRow}>
          <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
          <View style={styles.inlineStarRow}>
            {[1,2,3,4,5].map(i => (
              <Ionicons
                key={i}
                name={i <= Math.round(ratingValue) ? 'star' : 'star-outline'}
                size={11}
                color={colors.warningScale[400]}
              />
            ))}
          </View>
        </View>

        {/* Tag pills row — max 2 */}
        {tagPills.length > 0 && (
          <View style={styles.tagPillsRow}>
            {tagPills.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={[styles.tagPill, { backgroundColor: `${primaryColor}18` }]}>
                <Text style={[styles.tagPillText, { color: primaryColor }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Meta row: distance (if no overlay), delivery time, price range */}
        <View style={styles.storeMeta}>
          {!store.distance && (
            <View style={styles.storeMetaItem}>
              <Ionicons name="location-outline" size={12} color={colors.neutral[500]} />
              <Text style={styles.storeMetaText}>{store.location?.city || 'Nearby'}</Text>
            </View>
          )}
          <View style={styles.storeMetaItem}>
            <Ionicons name="time-outline" size={12} color={colors.neutral[500]} />
            <Text style={styles.storeMetaText}>{store.operationalInfo?.deliveryTime || '30-35 min'}</Text>
          </View>
          {priceRange !== '' && (
            <View style={styles.storeMetaItem}>
              <Text style={styles.priceRangeText}>{priceRange}</Text>
            </View>
          )}
        </View>

        {/* Delivery Info */}
        {(store.operationalInfo?.deliveryFee !== undefined || store.operationalInfo?.minimumOrder) && (
          <View style={styles.deliveryInfoRow}>
            {store.operationalInfo?.deliveryFee !== undefined && (
              <View style={styles.storeMetaItem}>
                <Ionicons name="bicycle-outline" size={12} color={colors.neutral[500]} />
                <Text style={styles.storeMetaText}>
                  {store.operationalInfo?.deliveryFee === 0 ? 'Free delivery' : `${currencySymbol}${store.operationalInfo?.deliveryFee} delivery`}
                </Text>
              </View>
            )}
            {store.operationalInfo?.freeDeliveryAbove && store.operationalInfo?.deliveryFee && store.operationalInfo?.deliveryFee > 0 ? (
              <View style={styles.freeDeliveryBadge}>
                <Text style={styles.freeDeliveryText}>Free above {currencySymbol}{store.operationalInfo.freeDeliveryAbove}</Text>
              </View>
            ) : null}
            {store.operationalInfo?.minimumOrder ? (
              <Text style={styles.storeMetaText}>Min {currencySymbol}{store.operationalInfo.minimumOrder}</Text>
            ) : null}
          </View>
        )}

        {/* Bottom row: coins + Book Now button (Upgrade 1) */}
        <View style={styles.storeBottomRow}>
          <View style={styles.storeCoins}>
            <Ionicons name="star" size={13} color={colors.warningScale[400]} />
            <Text style={styles.storeCoinsText}>+{coinsEarned} coins</Text>
            <Text style={styles.reviewBonusText}>  +{reviewBonus} review</Text>
          </View>
          <Pressable
            style={[styles.bookNowButton, { backgroundColor: primaryColor }]}
            onPress={handleBookNowPress}
          >
            <Text style={styles.bookNowText}>{showReserveButton ? 'Reserve' : 'Visit'}</Text>
          </Pressable>
        </View>

        {/* Visit Progress */}
        <View style={styles.visitProgressRow}>
          <Text style={styles.visitProgressText}>{userVisitCount}/{visitMilestone} visits</Text>
          {userVisitCount < visitMilestone && (
            <Pressable onPress={() => router.push('/my-visits')}>
              <Text style={[styles.unlockRewardText, { color: primaryColor }]}>Unlock reward</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const MemoizedStoreCard = React.memo(StoreCard, (prev, next) => {
  return (
    prev.store._id === next.store._id &&
    prev.variant === next.variant &&
    prev.primaryColor === next.primaryColor &&
    prev.categorySlug === next.categorySlug
  );
});

// ============================================
// ServiceTypeCard Component
// ============================================
const ServiceTypeCard = ({ serviceType, onPress }: { serviceType: PageConfigServiceType; onPress: () => void }) => (
  <Pressable style={styles.serviceTypeCard} onPress={onPress}>
    <LinearGradient
      colors={serviceType.gradient?.length >= 2 ? [...serviceType.gradient] : [colors.brand.indigo, '#818CF8']}
      style={styles.serviceTypeGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Ionicons name={serviceType.icon as unknown} size={28} color={colors.background.primary} />
      <Text style={styles.serviceTypeLabel}>{serviceType.label}</Text>
      <Text style={styles.serviceTypeDescription} numberOfLines={2}>{serviceType.description}</Text>
    </LinearGradient>
  </Pressable>
);

const MemoizedServiceTypeCard = React.memo(ServiceTypeCard);

// ============================================
// Main Component
// ============================================
function DynamicCategoryPage({ slug }: DynamicCategoryPageProps) {
  const isMounted = useIsMounted();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();

  // Fetch page configuration
  const {
    pageConfig,
    category,
    childCategories,
    vibes,
    occasions,
    trendingHashtags,
    stats,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useCategoryPageConfig(slug);

  // Fetch stores, products, UGC data (existing hook)
  // Use stable storesPerPage to prevent re-fetch cascade when pageConfig loads
  const stableStoresPerPage = useRef(pageConfig?.storeDisplayConfig?.storesPerPage || 10);
  if (pageConfig?.storeDisplayConfig?.storesPerPage) {
    stableStoresPerPage.current = pageConfig.storeDisplayConfig.storesPerPage;
  }
  const {
    subcategories,
    stores,
    ugcPosts,
    aiPlaceholders,
    isLoading: isDataLoading,
    error: dataError,
    refetch: refetchData,
  } = useCategoryPageData(slug, {
    storesPerPage: stableStoresPerPage.current,
  });

  // Wallet data
  const savingsInsights = useSavingsInsights();
  const savingsThisMonth = savingsInsights?.thisMonth || 0;

  // ============================================
  // Local state
  // ============================================
  const [activeTab, setActiveTab] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Sort & Filter state
  const [sortOption, setSortOption] = useState<string>('popularity');
  const [showSortModal, setShowSortModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ minRating?: number; openNow?: boolean; priceMax?: number }>({});
  const [activeDietary, setActiveDietary] = useState<string[]>([]);

  // Quick filter pills state (Upgrade 5)
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  // Promo carousel dot index (Upgrade 2)
  const [promoIndex, setPromoIndex] = useState(0);

  // User visit counts (storeId -> count)
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});

  // Loyalty stats & social proof ticker
  const [loyaltyStats, setLoyaltyStats] = useState<{ ordersCount: number; brandsCount: number }>({ ordersCount: 0, brandsCount: 0 });
  const [recentOrders, setRecentOrders] = useState<{ userName: string; storeName: string; timeAgo: string }[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  // User's orders for "Order Again"
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Tab-specific stores from backend
  const [tabStores, setTabStores] = useState<unknown[]>([]);
  const [isLoadingTabStores, setIsLoadingTabStores] = useState(false);

  // Pagination
  const [allStoresPage, setAllStoresPage] = useState(1);
  const [extraStores, setExtraStores] = useState<unknown[]>([]);
  const [hasMoreStores, setHasMoreStores] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Store display config from admin (with backward-compatible defaults)
  const displayConfig = pageConfig?.storeDisplayConfig || {};
  const STORES_PER_PAGE = displayConfig.storesPerPage || 10;

  // Animation ref for ticker fade
  const fadeAnim = useSharedValue(1);

  // ============================================
  // Derived values from config
  // ============================================
  const theme = pageConfig?.theme;
  const primaryColor = theme?.primaryColor || '#FF6B35';
  const gradientColors = ((theme?.gradientColors?.length ?? 0) >= 2 ? (theme as unknown)?.gradientColors : null) || [primaryColor, '#FF8C5A', '#FFF0E8'];

  // ============================================
  // Per-category fallback tabs when backend returns empty
  // ============================================
  const FALLBACK_TABS_BY_SLUG: Record<string, unknown[]> = {
    'beauty-wellness': [
      { id: 'all', label: 'All', icon: 'grid-outline', sortOrder: 0, enabled: true },
      { id: 'salon', label: 'Salon', icon: 'scissors-outline', sortOrder: 1, enabled: true, serviceFilter: 'salon' },
      { id: 'spa', label: 'Spa', icon: 'leaf-outline', sortOrder: 2, enabled: true, serviceFilter: 'spa' },
      { id: 'barber', label: 'Barber', icon: 'cut-outline', sortOrder: 3, enabled: true, serviceFilter: 'barber' },
    ],
    'fashion': [
      { id: 'all', label: 'All', icon: 'grid-outline', sortOrder: 0, enabled: true },
      { id: 'men', label: 'Men', icon: 'shirt-outline', sortOrder: 1, enabled: true, serviceFilter: 'men' },
      { id: 'women', label: 'Women', icon: 'rose-outline', sortOrder: 2, enabled: true, serviceFilter: 'women' },
      { id: 'accessories', label: 'Accessories', icon: 'diamond-outline', sortOrder: 3, enabled: true, serviceFilter: 'accessories' },
    ],
  };

  // Per-category fallback sections when backend returns empty
  const FALLBACK_SECTIONS_BY_SLUG: Record<string, unknown[]> = {
    'beauty-wellness': [
      { id: 'ai-search', type: 'ai-search', title: 'Find Beauty Services', sortOrder: 0, enabled: true },
      { id: 'browse-grid', type: 'browse-grid', title: 'Browse Categories', sortOrder: 1, enabled: true },
      { id: 'stores-list', type: 'stores-list', title: 'Beauty & Wellness Near You', sortOrder: 2, enabled: true },
      { id: 'ugc-social', type: 'ugc-social', title: 'Real Reviews', subtitle: 'See what others are saying', sortOrder: 3, enabled: true },
    ],
    'fashion': [
      { id: 'ai-search', type: 'ai-search', title: 'Find Fashion & Apparel', sortOrder: 0, enabled: true },
      { id: 'browse-grid', type: 'browse-grid', title: 'Browse Categories', sortOrder: 1, enabled: true },
      { id: 'stores-list', type: 'stores-list', title: 'Fashion Stores Near You', sortOrder: 2, enabled: true },
      { id: 'ugc-social', type: 'ugc-social', title: 'Style Inspiration', subtitle: 'See what others are wearing', sortOrder: 3, enabled: true },
    ],
  };

  const tabs = useMemo(() => {
    const rawTabs = [...(pageConfig?.tabs || [])].filter((t) => t?.enabled !== false).sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
    // Fall back to per-category defaults when backend returns 0 tabs
    if (rawTabs.length === 0 && FALLBACK_TABS_BY_SLUG[slug]) {
      return FALLBACK_TABS_BY_SLUG[slug];
    }
    return rawTabs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageConfig?.tabs, slug]);

  const sections = useMemo(() => {
    const rawSections = [...(pageConfig?.sections || [])].filter(s => s?.enabled !== false).sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
    // Fall back to per-category defaults when backend returns 0 sections
    if (rawSections.length === 0 && FALLBACK_SECTIONS_BY_SLUG[slug]) {
      return FALLBACK_SECTIONS_BY_SLUG[slug];
    }
    return rawSections;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageConfig?.sections, slug]);

  const FALLBACK_QUICK_ACTIONS_BY_SLUG: Record<string, unknown[]> = {
    'beauty-wellness': [
      { id: 'book', label: 'Book Now', icon: 'calendar-outline', route: `/MainCategory/beauty-wellness/book-appointment`, sortOrder: 0, enabled: true },
      { id: 'offers', label: 'Offers', icon: 'pricetag-outline', route: `/MainCategory/beauty-wellness/offers`, sortOrder: 1, enabled: true },
      { id: 'top-rated', label: 'Top Rated', icon: 'star-outline', route: `/MainCategory/beauty-wellness/top-rated`, sortOrder: 2, enabled: true },
      { id: 'stories', label: 'Stories', icon: 'images-outline', route: `/MainCategory/beauty-wellness/beauty-stories`, sortOrder: 3, enabled: true },
      { id: 'loyalty', label: 'Loyalty', icon: 'trophy-outline', route: `/MainCategory/beauty-wellness/loyalty`, sortOrder: 4, enabled: true },
    ],
    'fashion': [
      { id: 'try-buy', label: 'Try & Buy', icon: 'bag-handle-outline', route: `/MainCategory/fashion/try-and-buy`, sortOrder: 0, enabled: true },
      { id: 'offers', label: 'Offers', icon: 'pricetag-outline', route: `/MainCategory/fashion/offers`, sortOrder: 1, enabled: true },
      { id: 'top-rated', label: 'Top Rated', icon: 'star-outline', route: `/MainCategory/fashion/top-rated`, sortOrder: 2, enabled: true },
      { id: 'stories', label: 'Stories', icon: 'images-outline', route: `/MainCategory/fashion/fashion-stories`, sortOrder: 3, enabled: true },
      { id: 'loyalty', label: 'Loyalty', icon: 'trophy-outline', route: `/MainCategory/fashion/loyalty`, sortOrder: 4, enabled: true },
    ],
  };

  const quickActions = useMemo(() => {
    const rawQA = [...(pageConfig?.quickActions || [])].filter((qa) => qa?.enabled !== false).sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
    if (rawQA.length === 0 && FALLBACK_QUICK_ACTIONS_BY_SLUG[slug]) {
      return FALLBACK_QUICK_ACTIONS_BY_SLUG[slug];
    }
    return rawQA;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageConfig?.quickActions, slug]);
  const serviceTypes = useMemo(() =>
    [...(pageConfig?.serviceTypes || [])].filter((st) => st?.enabled !== false).sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0)),
    [pageConfig?.serviceTypes]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dietaryOptions = pageConfig?.dietaryOptions || [];
  const curatedCollections = pageConfig?.curatedCollections || [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchPlaceholders = pageConfig?.searchPlaceholders || {};
  const valuePropItems = pageConfig?.valuePropItems || [
    { icon: 'cash-outline', text: 'Cashback on every order', color: colors.successScale[400] },
    { icon: 'wallet-outline', text: 'Earn coins to reuse', color: colors.warningScale[400] },
    { icon: 'gift-outline', text: 'Loyalty rewards', color: '#F472B6' },
  ];

  // Admin-configurable sort options (fallback to defaults)
  const sortOptionsConfig = useMemo(() => {
    const config = pageConfig?.sortOptions?.filter((o) => o?.enabled !== false).sort((a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
    return config?.length ? config : DEFAULT_SORT_OPTIONS;
  }, [pageConfig?.sortOptions]);

  // Admin-configurable filter options (fallback to defaults)
  const filterConfig = useMemo(() => {
    const priceMax = pageConfig?.filterOptions?.priceMax ?? 500;
    return {
      priceMax,
      priceLabel: pageConfig?.filterOptions?.priceLabel || `Under ${currencySymbol}${priceMax}`,
      ratingThreshold: pageConfig?.filterOptions?.ratingThreshold ?? 4,
      showPriceFilter: pageConfig?.filterOptions?.showPriceFilter !== false,
      showRatingFilter: pageConfig?.filterOptions?.showRatingFilter !== false,
      showOpenNow: pageConfig?.filterOptions?.showOpenNow !== false,
    };
  }, [pageConfig?.filterOptions, currencySymbol]);

  // Admin-configurable store card defaults
  const coinsMultiplier = displayConfig.defaultCoinsMultiplier || 4.5;
  const defaultReviewBonus = displayConfig.defaultReviewBonus || 20;
  const defaultVisitMilestone = displayConfig.defaultVisitMilestone || 5;
  const tagExclusions = displayConfig.tagExclusions || DEFAULT_TAG_EXCLUSIONS;

  // Set initial active tab once config loads
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  // Current active tab object
  const currentTab = useMemo(() => {
    return tabs.find(t => t.id === activeTab) || tabs[0] || null;
  }, [tabs, activeTab]);

  // ============================================
  // Search placeholders per tab
  // ============================================
  const currentPlaceholders = useMemo(() => {
    const tabPlaceholders = searchPlaceholders[activeTab] || searchPlaceholders['all'] || aiPlaceholders;
    return tabPlaceholders.length > 0 ? tabPlaceholders : [`Search in ${pageConfig?.categoryName || slug}...`];
  }, [activeTab, searchPlaceholders, aiPlaceholders, pageConfig?.categoryName, slug]);

  // Cycle placeholders
  useEffect(() => {
    if (currentPlaceholders.length <= 1) return;
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % currentPlaceholders.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [currentPlaceholders.length]);

  // ============================================
  // Fetch auxiliary data
  // ============================================
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const fetchVisits = async () => {
      try {
        const response = await storesApi.getUserVisitHistory(1, 20);
        if (response.success && response.data?.visits) {
          const counts: Record<string, number> = {};
          response.data.visits.forEach(visit => {
            const storeId = visit.store?.id;
            if (!storeId) return;
            counts[storeId] = (counts[storeId] || 0) + 1;
          });
          if (!isMounted()) return;
          setVisitCounts(counts);
        }
      } catch (err) {
        // silently handle
      }
    };
    fetchVisits();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          categoriesApi.getCategoryLoyaltyStats(slug),
          categoriesApi.getRecentOrders(slug, 5),
        ]);
        if (statsRes.success && statsRes.data) {
          if (!isMounted()) return;
          setLoyaltyStats(statsRes.data);
        }
        if (ordersRes.success && ordersRes.data?.orders) {
          setRecentOrders(ordersRes.data.orders);
        }
      } catch (err) {
        // Silently fail - these are supplementary
      }
    };
    fetchLoyaltyData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const fetchMyOrders = async () => {
      try {
        const res = await ordersApi.getOrders({ limit: 10, sort: 'newest' });
        if (res.success && res.data?.orders) {
          if (!isMounted()) return;
          setMyOrders(res.data.orders);
        }
      } catch (err) {
        // Silently fail
      }
    };
    fetchMyOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // ============================================
  // Ticker animation for social proof
  // ============================================
  useEffect(() => {
    if (recentOrders.length > 1) {
      const timer = setInterval(() => {
        fadeAnim.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(setTickerIndex)((prev: number) => (prev + 1) % recentOrders.length);
            fadeAnim.value = withTiming(1, { duration: 300 });
          }
        });
      }, 4000);
      return () => {
        clearInterval(timer);
      };
    }
  }, [recentOrders.length, fadeAnim]);

  // ============================================
  // Tab-specific store fetching from backend
  // ============================================
  const tabFetchIdRef = useRef(0);
  useEffect(() => {
    if (!currentTab) return;

    // Increment fetch ID to prevent stale responses from overwriting current tab data
    const fetchId = ++tabFetchIdRef.current;

    // If the tab has a serviceFilter, fetch stores from backend by service type
    if (currentTab.serviceFilter) {
      const fetchTabStores = async () => {
        setIsLoadingTabStores(true);
        try {
          const response = await storesApi.getStoresByServiceType(slug, currentTab.serviceFilter!, 1, STORES_PER_PAGE);
          // Bail if tab changed during fetch
          if (fetchId !== tabFetchIdRef.current) return;
          if (response.success && response.data?.stores) {
            const formatted = response.data.stores.map((store) => ({
              id: store._id || store.id,
              _id: store._id || store.id,
              name: store.name,
              slug: store.slug,
              logo: store.logo,
              banner: store.banner,
              rating: store.ratings?.average || 4.5,
              ratings: store.ratings,
              cashback: store.offers?.cashback,
              distance: store.distance,
              tags: store.tags || [],
              rewardRules: store.rewardRules,
              priceForTwo: store.priceForTwo,
              offers: store.offers,
              operationalInfo: store.operationalInfo,
              deliveryCategories: store.deliveryCategories,
              location: store.location,
              category: store.category,
              bookingType: store.bookingType,
              isDineIn: store.bookingType === 'RESTAURANT' || false,
            }));
            if (!isMounted()) return;
            setTabStores(formatted);
          } else {
            setTabStores([]);
          }
        } catch (err) {
          if (fetchId !== tabFetchIdRef.current) return;
          if (!isMounted()) return;
          setTabStores([]);
        } finally {
          if (fetchId === tabFetchIdRef.current) {
            if (!isMounted()) return;
            setIsLoadingTabStores(false);
          }
        }
      };
      fetchTabStores();
    } else {
      // No service filter - use main stores
      setTabStores([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentTab?.serviceFilter, slug]);

  // ============================================
  // Filtering & sorting stores
  // ============================================
  const displayStores = useMemo(() => {
    // If current tab has a serviceFilter and we fetched tabStores, use those
    const baseStores = currentTab?.serviceFilter && tabStores.length > 0 ? tabStores : stores;
    // Include extraStores in the filtering/sorting pipeline so they respect active filters
    let result = [...baseStores, ...extraStores];

    // Dietary filter
    if (activeDietary.length > 0 && dietaryOptions.length > 0) {
      const dietaryTags = activeDietary.flatMap(d => {
        const opt = dietaryOptions.find(o => o.id === d);
        return opt?.tags || [];
      });
      result = result.filter((store) => {
        if (!store.tags || !Array.isArray(store.tags)) return false;
        const storeTags = store.tags.map((t: string) => t.toLowerCase());
        return dietaryTags.some(dt => storeTags.includes(dt.toLowerCase()));
      });
    }

    // Rating filter
    if (activeFilters.minRating) {
      result = result.filter(s => (s.ratings?.average || s.rating || 0) >= activeFilters.minRating!);
    }

    // Price filter
    if (activeFilters.priceMax) {
      result = result.filter(s => (s.priceForTwo || 0) <= activeFilters.priceMax!);
    }

    // Open Now filter (from filter chips or quick pills)
    if (activeFilters.openNow || activeQuickFilters.includes('openNow')) {
      result = result.filter(s => isStoreOpen(s).isOpen);
    }

    // Top Rated quick pill
    if (activeQuickFilters.includes('topRated')) {
      result = result.filter(s => (s.ratings?.average || s.rating || 0) >= 4);
    }

    // Free Delivery quick pill
    if (activeQuickFilters.includes('freeDelivery')) {
      result = result.filter(s => s.operationalInfo?.deliveryFee === 0);
    }

    // Cashback quick pill
    if (activeQuickFilters.includes('cashback')) {
      result = result.filter(s => s.offers?.cashback);
    }

    // New quick pill
    if (activeQuickFilters.includes('new')) {
      result = result.filter(s => s.isNew || s.showNewBadge);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'rating': return (b.ratings?.average || b.rating || 0) - (a.ratings?.average || a.rating || 0);
        case 'delivery_time': {
          const aTime = parseInt(a.operationalInfo?.deliveryTime) || 60;
          const bTime = parseInt(b.operationalInfo?.deliveryTime) || 60;
          return aTime - bTime;
        }
        case 'newest': return 0;
        default: return (b.ratings?.count || 0) - (a.ratings?.count || 0); // popularity
      }
    });

    return result;
  }, [stores, tabStores, extraStores, currentTab, activeDietary, dietaryOptions, activeFilters, activeQuickFilters, sortOption]);

  // ============================================
  // Pagination
  // ============================================
  const loadMoreStores = useCallback(async () => {
    if (isLoadingMore || !hasMoreStores) return;
    setIsLoadingMore(true);
    try {
      const nextPage = allStoresPage + 1;
      const response = await storesApi.getStoresBySubcategorySlug(slug, STORES_PER_PAGE, nextPage);
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        const formatted = response.data.map((store) => ({
          id: store._id || store.id,
          _id: store._id || store.id,
          name: store.name,
          slug: store.slug,
          logo: store.logo,
          banner: store.banner,
          rating: store.ratings?.average || 4.5,
          ratings: store.ratings,
          cashback: store.offers?.cashback,
          distance: store.distance,
          tags: store.tags || [],
          rewardRules: store.rewardRules,
          priceForTwo: store.priceForTwo,
          offers: store.offers,
          operationalInfo: store.operationalInfo,
          deliveryCategories: store.deliveryCategories,
          location: store.location,
          category: store.category,
        }));
        if (!isMounted()) return;
        setExtraStores(prev => [...prev, ...formatted]);
        setAllStoresPage(nextPage);
        if (formatted.length < STORES_PER_PAGE) setHasMoreStores(false);
      } else {
        setHasMoreStores(false);
      }
    } catch (err) {
      // Silently fail
    } finally {
      if (!isMounted()) return;
      setIsLoadingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStoresPage, isLoadingMore, hasMoreStores, slug, STORES_PER_PAGE]);

  // Reset pagination on filter changes
  useEffect(() => {
    setAllStoresPage(1);
    setExtraStores([]);
    setHasMoreStores(true);
  }, [sortOption, activeFilters, activeDietary, activeTab, activeQuickFilters]);

  // ============================================
  // Refresh handler
  // ============================================
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchConfig(), refetchData()]);
    if (!isMounted()) return;
    setRefreshing(false);
  };

  // ============================================
  // Navigation handlers
  // ============================================
  const handleCategoryPress = (category: CategoryData) => {
    const subcategorySlug = category.slug || category.id;
    router.push(`/MainCategory/${slug}/${subcategorySlug}`);
  };

  const handleAISearch = (query: string) => {
    router.push(`/MainCategory/${slug}/search?q=${encodeURIComponent(query)}`);
  };

  // ============================================
  // Section renderer
  // ============================================
  const renderSection = (section: PageConfigSection) => {
    switch (section.type) {
      case 'loyalty-hub':
        return renderLoyaltyHubSection(section);
      case 'browse-grid':
        return renderBrowseGridSection(section);
      case 'stores-list':
        return renderStoresListSection(section);
      case 'ai-search':
        return renderAISearchSection(section);
      case 'order-again':
        return renderOrderAgainSection();
      case 'ugc-social':
        return renderUGCSocialSection(section);
      case 'streak-loyalty':
        return renderStreakLoyaltySection();
      case 'service-types':
        return renderServiceTypesSection(section);
      case 'curated-collections':
        return renderCuratedCollectionsSection(section);
      case 'value-proposition':
        return renderValuePropositionSection();
      case 'popular-items':
        return renderStoresListSection({ ...section, id: section.id || 'popular-items', title: section.title || 'Popular Now' });
      case 'new-stores':
        return renderStoresListSection({ ...section, id: section.id || 'new-stores', title: section.title || 'New Stores' });
      case 'social-proof-ticker':
        // Rendered unconditionally in the header area — skip here to avoid duplication
        return null;
      case 'footer-trust':
        // Rendered unconditionally at the bottom — skip here
        return null;
      case 'offers-section':
        return (
          <SectionErrorBoundary key={section.id || 'offers-section'} name="offers-section">
            <OffersSection key={section.id || 'offers-section'}
              title={section.title || 'Offers & Deals'}
              categorySlug={slug}
            />
          </SectionErrorBoundary>
        );
      case 'experiences-section':
        return (
          <SectionErrorBoundary key={section.id || 'experiences-section'} name="experiences-section">
            <ExperiencesSection key={section.id || 'experiences-section'}
              categorySlug={slug}
            />
          </SectionErrorBoundary>
        );
      default:
        return null;
    }
  };

  // ============================================
  // Section render functions
  // ============================================
  const renderLoyaltyHubSection = (section: PageConfigSection) => {
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || 'loyalty-hub';
    return (
    <Pressable
      key={sectionKey}
      style={styles.loyaltyHub}
      onPress={() => router.push(`/MainCategory/${slug}/loyalty`)}
     
    >
      <LinearGradient
        colors={['rgba(255, 205, 87, 0.2)', 'rgba(26, 58, 82, 0.2)', 'rgba(251, 191, 36, 0.2)']}
        style={styles.loyaltyHubGradient}
      >
        <View style={styles.loyaltyHubHeader}>
          <View style={styles.loyaltyHubIcon}>
            <Ionicons name="trophy" size={24} color={primaryColor} />
          </View>
          <View style={styles.loyaltyHubText}>
            <Text style={styles.loyaltyHubTitle}>{section.title || `${pageConfig?.categoryName} Loyalty Hub`}</Text>
            <Text style={styles.loyaltyHubSubtitle}>{section.subtitle || 'Track streaks, unlock rewards'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[500]} />
        </View>
        <View style={styles.loyaltyHubStats}>
          <View style={styles.loyaltyHubStat}>
            <Text style={styles.loyaltyHubStatLabel}>Total Visits</Text>
            <Text style={styles.loyaltyHubStatValue}>{loyaltyStats.ordersCount}</Text>
          </View>
          <View style={styles.loyaltyHubStat}>
            <Text style={styles.loyaltyHubStatLabel}>Active Brands</Text>
            <Text style={[styles.loyaltyHubStatValue, { color: colors.warningScale[400] }]}>{loyaltyStats.brandsCount}</Text>
          </View>
          <View style={styles.loyaltyHubStat}>
            <Text style={styles.loyaltyHubStatLabel}>Next Reward</Text>
            <Ionicons name="gift" size={20} color={primaryColor} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
    );
  };

  const renderBrowseGridSection = (section: PageConfigSection) => {
    // Only show for tabs that have a serviceFilter (main browsing tabs) or "all"
    if (currentTab?.sectionOverride) return null;
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || 'browse-grid';
    // Map subcategories to CategoryGridItem format
    const gridItems = subcategories.map((sub: SubcategoryData) => ({
      id: sub.id || sub._id || '',
      name: sub.name || sub.slug || '',
      slug: sub.slug,
      icon: sub.icon || 'grid-outline',
      color: colors.brand.purpleLight, // Default color
    }));
    return (
      <BrowseCategoryGrid
        key={sectionKey}
        categories={gridItems}
        title={section.title || 'Browse Categories'}
        onCategoryPress={handleCategoryPress}
        itemCountLabel={section.config?.itemCountLabel || 'places'}
      />
    );
  };

  const renderStoresListSection = (section: PageConfigSection) => {
    if (currentTab?.sectionOverride) return null;
    // Ensure a stable key even for backend sections that use _id instead of id
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || section.type;

    return (
      <View key={sectionKey} style={styles.section}>
        {/* Sort & Filter Bar */}
        <View style={styles.sortFilterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortFilterContent}>
            <Pressable style={styles.sortButton} onPress={() => setShowSortModal(true)}>
              <Ionicons name="swap-vertical-outline" size={16} color={colors.neutral[900]} />
              <Text style={styles.sortButtonText}>{sortOptionsConfig.find((o: SortOptionData) => o.id === sortOption)?.label || 'Sort'}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.neutral[500]} />
            </Pressable>
            {filterConfig.showPriceFilter && (
            <Pressable
              style={[styles.filterChip, activeFilters.priceMax ? styles.filterChipActive : null]}
              onPress={() => setActiveFilters(f => f.priceMax ? { ...f, priceMax: undefined } : { ...f, priceMax: filterConfig.priceMax })}
            >
              <Text style={[styles.filterChipText, activeFilters.priceMax ? styles.filterChipTextActive : null]}>{filterConfig.priceLabel}</Text>
            </Pressable>
            )}
            {filterConfig.showRatingFilter && (
            <Pressable
              style={[styles.filterChip, activeFilters.minRating ? styles.filterChipActive : null]}
              onPress={() => setActiveFilters(f => f.minRating ? { ...f, minRating: undefined } : { ...f, minRating: filterConfig.ratingThreshold })}
            >
              <Ionicons name="star" size={12} color={activeFilters.minRating ? colors.background.primary : colors.warningScale[400]} />
              <Text style={[styles.filterChipText, activeFilters.minRating ? styles.filterChipTextActive : null]}>{filterConfig.ratingThreshold}.0+</Text>
            </Pressable>
            )}
            {filterConfig.showOpenNow && (
            <Pressable
              style={[styles.filterChip, activeFilters.openNow ? styles.filterChipActive : null]}
              onPress={() => setActiveFilters(f => f.openNow ? { ...f, openNow: undefined } : { ...f, openNow: true })}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeFilters.openNow ? colors.background.primary : colors.success }} />
              <Text style={[styles.filterChipText, activeFilters.openNow ? styles.filterChipTextActive : null]}>Open Now</Text>
            </Pressable>
            )}
          </ScrollView>
        </View>

        {/* Dietary Toggles (if category supports them) */}
        {dietaryOptions.length > 0 && (
          <View style={styles.dietaryStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dietaryContent}>
              {dietaryOptions.map(opt => {
                const isActive = activeDietary.includes(opt.id);
                return (
                  <Pressable
                    key={opt.id}
                    style={[styles.dietaryChip, isActive && { backgroundColor: opt.color }]}
                    onPress={() => setActiveDietary(prev => isActive ? prev.filter(d => d !== opt.id) : [...prev, opt.id])}
                  >
                    <Text style={styles.dietaryIcon}>{opt.icon}</Text>
                    <Text style={[styles.dietaryLabel, isActive && { color: colors.background.primary, fontWeight: '600' }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Store Cards Section Header */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Ionicons name="storefront-outline" size={20} color={colors.neutral[500]} />
          <Text style={styles.sectionTitle}>{section.title || `All ${pageConfig?.categoryName || 'Stores'}`}</Text>
          <Text style={styles.sectionCount}>{displayStores.length}+ places</Text>
        </View>

        {/* Quick Filter Pills (Upgrade 5) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterContent} style={styles.quickFilterBar}>
          {QUICK_FILTER_PILLS.map(pill => {
            const isActive = activeQuickFilters.includes(pill.id);
            return (
              <Pressable
                key={pill.id}
                style={[styles.quickFilterPill, isActive && { backgroundColor: primaryColor }]}
                onPress={() => setActiveQuickFilters(prev =>
                  isActive ? prev.filter(f => f !== pill.id) : [...prev, pill.id]
                )}
              >
                <Ionicons name={pill.icon} size={13} color={isActive ? colors.background.primary : colors.neutral[600]} />
                <Text style={[styles.quickFilterPillText, isActive ? styles.quickFilterPillTextActive : null]}>{pill.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Store Cards Grid */}
        <View style={styles.storesGrid}>
          {isDataLoading || isLoadingTabStores ? (
            <StoreCardSkeleton count={3} />
          ) : displayStores.length === 0 ? (
            // Upgrade 6: Category-specific empty state
            <View style={styles.emptyStateContainer}>
              <Ionicons name="storefront-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyStateTitle}>No stores found</Text>
              <Text style={styles.emptyStateMessage}>
                {slug.includes('beauty') || slug.includes('wellness')
                  ? 'No salons found nearby. Try expanding your search area.'
                  : slug.includes('food') || slug.includes('dining') || slug.includes('grocery')
                    ? 'No restaurants found nearby. Try changing your location.'
                    : `No stores found in this category. Try adjusting your filters.`}
              </Text>
              <Pressable
                style={[styles.emptyStateButton, { backgroundColor: primaryColor }]}
                onPress={() => router.push('/location/settings')}
              >
                <Ionicons name="location-outline" size={16} color={colors.background.primary} />
                <Text style={styles.emptyStateButtonText}>Change Location</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {displayStores.map((store) => (
                <MemoizedStoreCard
                  key={store.id || store._id}
                  store={store}
                  userVisitCount={visitCounts[store.id] || 0}
                  showReserveButton={currentTab?.serviceFilter === 'dineIn'}
                  primaryColor={primaryColor}
                  categorySlug={slug}
                  tagExclusions={tagExclusions}
                  coinsMultiplier={coinsMultiplier}
                  defaultReviewBonus={defaultReviewBonus}
                  defaultVisitMilestone={defaultVisitMilestone}
                />
              ))}
              {hasMoreStores && !currentTab?.serviceFilter && (
                <Pressable style={styles.loadMoreButton} onPress={loadMoreStores} disabled={isLoadingMore}>
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <Text style={[styles.loadMoreText, { color: primaryColor }]}>Load More</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Sort Modal */}
        <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sort By</Text>
              {sortOptionsConfig.map((opt: SortOptionData) => (
                <Pressable
                  key={opt.id}
                  style={[styles.modalOption, sortOption === opt.id ? styles.modalOptionActive : null]}
                  onPress={() => { setSortOption(opt.id || ''); setShowSortModal(false); }}
                >
                  <Ionicons name={(opt.icon as keyof typeof Ionicons.glyphMap) || 'swap-vertical-outline'} size={20} color={sortOption === opt.id ? colors.warningScale[400] : colors.neutral[500]} />
                  <Text style={[styles.modalOptionText, sortOption === opt.id ? styles.modalOptionTextActive : null]}>{opt.label}</Text>
                  {sortOption === opt.id && <Ionicons name="checkmark-circle" size={20} color={colors.warningScale[400]} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };

  const renderAISearchSection = (section: PageConfigSection) => {
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || 'ai-search';
    return (
    <EnhancedAISuggestionsSection key={sectionKey}
      categorySlug={slug}
      categoryName={currentTab?.sectionOverride === 'offers'
        ? `${pageConfig?.categoryName} Offers`
        : currentTab?.sectionOverride === 'experiences'
          ? `${pageConfig?.categoryName} Experiences`
          : pageConfig?.categoryName || slug}
      placeholders={currentPlaceholders}
      onSearch={handleAISearch}
    />
    );
  };

  const renderOrderAgainSection = () => {
    if (myOrders.length === 0) return null;
    return <OrderAgainSection key="order-again" orders={myOrders} />;
  };

  const renderUGCSocialSection = (section: PageConfigSection) => {
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || 'ugc-social';
    return (
    <EnhancedUGCSocialProofSection key={sectionKey}
      categorySlug={slug}
      categoryName={pageConfig?.categoryName || slug}
      posts={ugcPosts}
      title={section.title || 'Real Reviews'}
      subtitle={section.subtitle || 'See what others are saying'}
      onPostPress={(post) => router.push(`/ugc/${post.id}`)}
      onSharePress={() => router.push('/share')}
      onViewAllPress={() => {
        // Find stories route from quick actions (each category has a unique stories page name)
        const storiesAction = quickActions.find((qa: QuickActionData) => qa.id?.includes('stories') || qa.route?.includes('stories'));
        const storiesRoute = storiesAction?.route || `/MainCategory/${slug}/search?type=ugc`;
        router.push(storiesRoute);
      }}
    />
    );
  };

  const renderStreakLoyaltySection = () => (
    <StreakLoyaltySection key="streak-loyalty"
      categorySlug={slug}
      primaryColor={primaryColor}
      pageConfig={pageConfig}
    />
  );

  const renderServiceTypesSection = (section: PageConfigSection) => {
    if (serviceTypes.length === 0) return null;
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || 'service-types';
    return (
      <View key={sectionKey} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={section.icon as unknown || 'apps-outline'} size={20} color={primaryColor} />
          <Text style={styles.sectionTitle}>{section.title || 'Service Types'}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceTypesList}>
          {serviceTypes.map(st => {
            const handleServiceTypePress = () => {
              const matchingTab = tabs.find(t => t.serviceFilter === st.serviceFilter);
              if (matchingTab) {
                setActiveTab(matchingTab.id);
              } else {
                router.push(`/MainCategory/${slug}/search?serviceType=${st.serviceFilter}`);
              }
            };
            return (
              <MemoizedServiceTypeCard
                key={st.id}
                serviceType={st}
                onPress={handleServiceTypePress}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderCuratedCollectionsSection = (section: PageConfigSection) => {
    if (curatedCollections.length === 0) return null;
    const sectionKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || 'curated-collections';
    return (
      <View key={sectionKey} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>{section.icon || '\u2728'}</Text>
          <Text style={styles.sectionTitle}>{section.title || 'Curated for You'}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.curatedList}>
          {curatedCollections.map(col => (
            <Pressable
              key={col.id}
              style={styles.curatedCard}
              onPress={() => router.push(`/MainCategory/${slug}/search?tags=${col.tags}`)}
             
            >
              <LinearGradient colors={col.gradient?.length >= 2 ? [...col.gradient] : [colors.brand.indigo, '#818CF8']} style={styles.curatedGradient}>
                <Text style={styles.curatedIconText}>{col.icon}</Text>
                <Text style={styles.curatedTitle}>{col.title}</Text>
                <Text style={styles.curatedSubtitle}>{col.subtitle}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderValuePropositionSection = () => (
    <View key="value-proposition" style={styles.valuePropCard}>
      <LinearGradient
        colors={[colors.nileBlue, '#0f2638']}
        style={styles.valuePropGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.valuePropTitle}>
          Every visit is rewarding with <Text style={styles.valuePropBrand}>Rez</Text>
        </Text>
        <View style={styles.valuePropGrid}>
          {valuePropItems.map((item, i) => (
            <View key={i} style={styles.valuePropItem}>
              <View style={[styles.valuePropIconWrap, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as unknown} size={16} color={item.color} />
              </View>
              <Text style={styles.valuePropText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Savings inline */}
        <View style={styles.savingsRow}>
          <View style={styles.savingsLeft}>
            <Text style={styles.savingsLabel}>Saved this month</Text>
            <Text style={styles.savingsAmount}>{currencySymbol}{savingsThisMonth.toLocaleString()}</Text>
          </View>
          <Pressable
            style={styles.savingsButton}
            onPress={() => router.push(`/MainCategory/${slug}/loyalty/coins`)}
           
          >
            <Text style={styles.savingsButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.nileBlue} />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );

  // ============================================
  // Tab content renderer
  // ============================================
  const renderTabContent = () => {
    if (!currentTab) return null;

    // If the tab has a sectionOverride, render that special section
    if (currentTab.sectionOverride === 'offers') {
      return (
        <View style={styles.tabContent}>
          <OffersSection categorySlug={slug} />
        </View>
      );
    }
    if (currentTab.sectionOverride === 'experiences') {
      return (
        <View style={styles.tabContent}>
          <ExperiencesSection categorySlug={slug} pageConfig={pageConfig} />
        </View>
      );
    }

    // Default: render configured sections (exclude types rendered unconditionally outside tabs)
    const RENDERED_OUTSIDE_TABS = [
      'loyalty-hub', 'ai-search', 'value-proposition', 'streak-loyalty',
      'ugc-social', 'footer-trust', 'social-proof-ticker',
    ];
    return (
      <View style={styles.tabContent}>
        {sections.filter(s => !RENDERED_OUTSIDE_TABS.includes(s.type)).map(section => {
          const secKey = (section as PageConfigSection & { id?: string; _id?: string }).id || (section as PageConfigSection & { id?: string; _id?: string })._id || section.type;
          return (
            <SectionErrorBoundary key={secKey} name={`tab-section-${section.type}`}>{renderSection(section)}</SectionErrorBoundary>
          );
        })}
      </View>
    );
  };

  // ============================================
  // Loading state
  // ============================================
  const isLoading = isConfigLoading || isDataLoading;
  const error = configError || dataError;

  // Once content has loaded for this slug, never go back to loading/empty state
  // Uses module-level flag so it survives component remounts from DeferredProviders
  if (!_pageContentLoaded[slug] && (pageConfig || stores.length > 0)) {
    _pageContentLoaded[slug] = true;
  }

  if (!_pageContentLoaded[slug] && isLoading && !refreshing && stores.length === 0) {
    return <LoadingState message={`Loading ${pageConfig?.categoryName || 'category'}...`} />;
  }

  if (!_pageContentLoaded[slug] && error && stores.length === 0 && !pageConfig) {
    return (
      <EmptyState
        icon="storefront-outline"
        title="Unable to load"
        message={error || 'Something went wrong. Please try again.'}
        actionLabel="Try Again"
        onAction={onRefresh}
      />
    );
  }

  // ============================================
  // Main render
  // ============================================
  return (
    <ErrorBoundary onError={(err, info) => { logger.warn('[DynamicCategoryPage] Render error caught:', err?.message, info?.componentStack?.slice(0, 200)); }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
          />
        }
      >
        {/* Header Banner */}
        <SectionErrorBoundary name="category-header">
        <CategoryHeader
          categoryName={pageConfig?.categoryName || category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          primaryColor={primaryColor}
          banner={pageConfig?.banner || {
            title: category?.name || slug,
            subtitle: 'Explore the best',
            discount: '',
            tag: 'TRENDING',
          }}
          gradientColors={gradientColors}
        />
        </SectionErrorBoundary>

        {/* Social Proof Strip */}
        <SectionErrorBoundary name="social-proof">
        {recentOrders.length > 0 && (
          <View style={styles.socialProofStrip}>
            <Animated.View style={[styles.socialProofContent, { opacity: fadeAnim }]}>
              <Text style={styles.socialProofEmoji}>{'\uD83D\uDC64'}</Text>
              <Text style={styles.socialProofText}>
                <Text style={styles.socialProofUser}>{recentOrders[tickerIndex]?.userName || 'Someone'}</Text>
                <Text> just ordered from </Text>
                <Text style={[styles.socialProofBrand, { color: primaryColor }]}>{recentOrders[tickerIndex]?.storeName || 'a store'}</Text>
              </Text>
              <Text style={styles.socialProofTime}>{recentOrders[tickerIndex]?.timeAgo || 'recently'}</Text>
            </Animated.View>
          </View>
        )}
        </SectionErrorBoundary>

        {/* Loyalty Hub - rendered before tabs (matching FoodDining pattern) */}
        <SectionErrorBoundary name="loyalty-hub">
        {sections.some(s => s.type === 'loyalty-hub') && renderLoyaltyHubSection(
          sections.find(s => s.type === 'loyalty-hub') || { id: 'loyalty-hub', type: 'loyalty-hub', title: 'Loyalty Hub', sortOrder: 0, enabled: true }
        )}
        </SectionErrorBoundary>

        {/* Promo Carousel (Upgrade 2) — only shown when there are stores */}
        {(stores.length > 0 || displayStores.length > 0) && (
          <View style={styles.promoCarouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                setPromoIndex(idx);
              }}
              contentContainerStyle={styles.promoCarouselContent}
            >
              {PROMO_CARDS.map((card) => (
                <LinearGradient
                  key={card.id}
                  colors={[primaryColor, `${primaryColor}CC`, `${primaryColor}99`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.promoCard}
                >
                  <View style={styles.promoCardInner}>
                    <View style={styles.promoIconWrap}>
                      <Ionicons name={card.icon} size={28} color="rgba(255,255,255,0.9)" />
                    </View>
                    <View style={styles.promoTextBlock}>
                      <Text style={styles.promoTitle}>{card.title}</Text>
                      <Text style={styles.promoSubtitle}>{card.subtitle}</Text>
                      <Text style={styles.promoCta}>{card.cta} →</Text>
                    </View>
                  </View>
                </LinearGradient>
              ))}
            </ScrollView>
            {/* Dot indicators */}
            <View style={styles.promoDots}>
              {PROMO_CARDS.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.promoDot,
                    i === promoIndex && [styles.promoDotActive, { backgroundColor: primaryColor }],
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Tabs (Upgrade 3: icon above text, filled active background) */}
        {tabs.length > 0 && (
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                // Resolve icon: use tab.icon from backend, fallback to TAB_ICON_MAP, then grid-outline
                const resolvedIcon: keyof typeof Ionicons.glyphMap =
                  (tab.icon as keyof typeof Ionicons.glyphMap) ||
                  TAB_ICON_MAP[tab.id.toLowerCase()] ||
                  TAB_ICON_MAP[tab.label?.toLowerCase()] ||
                  'grid-outline';
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[
                      styles.tab,
                      isActive && [styles.tabActive, { backgroundColor: primaryColor }],
                    ]}
                  >
                    <Ionicons
                      name={resolvedIcon}
                      size={18}
                      color={isActive ? colors.background.primary : colors.neutral[600]}
                    />
                    <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <SectionErrorBoundary name="quick-actions">
        {quickActions.length > 0 && (
          <QuickActionBar categorySlug={slug} actions={quickActions as unknown} />
        )}
        </SectionErrorBoundary>

        {/* AI Search Section - always render if present in sections */}
        <SectionErrorBoundary name="ai-search">
        {sections.some(s => s.type === 'ai-search') && renderAISearchSection(
          sections.find(s => s.type === 'ai-search') || { id: 'ai-search', type: 'ai-search', title: 'AI Search', sortOrder: 0, enabled: true }
        )}
        </SectionErrorBoundary>

        {/* Tab Content (browse-grid, stores-list, offers, experiences) */}
        <SectionErrorBoundary name="tab-content">
        {renderTabContent()}
        </SectionErrorBoundary>

        {/* Value Proposition - always render at bottom of main content */}
        <SectionErrorBoundary name="value-proposition">
        {renderValuePropositionSection()}
        </SectionErrorBoundary>

        {/* Streak Loyalty */}
        <SectionErrorBoundary name="streak-loyalty">
        <StreakLoyaltySection categorySlug={slug} primaryColor={primaryColor} pageConfig={pageConfig} />
        </SectionErrorBoundary>

        {/* UGC Social Proof */}
        <SectionErrorBoundary name="ugc-social">
        {sections.some(s => s.type === 'ugc-social') && renderUGCSocialSection(
          sections.find(s => s.type === 'ugc-social') || { id: 'ugc-social', type: 'ugc-social', title: 'Reviews', sortOrder: 99, enabled: true }
        )}
        </SectionErrorBoundary>

        {/* Footer Trust */}
        <SectionErrorBoundary name="footer-trust">
        <FooterTrustSection categorySlug={slug} pageConfig={pageConfig} />
        </SectionErrorBoundary>
      </ScrollView>
    </ErrorBoundary>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tint.warmGray,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Social Proof
  socialProofStrip: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  socialProofContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 8,
  },
  socialProofEmoji: {
    fontSize: 16,
  },
  socialProofText: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral[700],
  },
  socialProofUser: {
    fontWeight: '600',
    color: colors.neutral[900],
  },
  socialProofBrand: {
    fontWeight: '500',
  },
  socialProofTime: {
    fontSize: 11,
    color: colors.neutral[500],
  },

  // Loyalty Hub
  loyaltyHub: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loyaltyHubGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.3)',
  },
  loyaltyHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  loyaltyHubIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 205, 87, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyaltyHubText: {
    flex: 1,
  },
  loyaltyHubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  loyaltyHubSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  loyaltyHubStats: {
    flexDirection: 'row',
    gap: 8,
  },
  loyaltyHubStat: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
  },
  loyaltyHubStatLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  loyaltyHubStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
  },

  // ── Promo Carousel (Upgrade 2) ────────────────────────────────────────────
  promoCarouselContainer: {
    marginTop: 14,
    marginHorizontal: 16,
  },
  promoCarouselContent: {
    gap: 0,
  },
  promoCard: {
    width: SCREEN_WIDTH - 32,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 0,
  },
  promoCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  promoIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoTextBlock: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.background.primary,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  promoCta: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  promoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neutral[300],
  },
  promoDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },

  // ── Tabs (Upgrade 3) ──────────────────────────────────────────────────────
  tabsContainer: {
    backgroundColor: colors.background.primary,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    marginTop: 14,
  },
  tabs: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 6,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[600],
  },
  tabLabelActive: {
    color: colors.background.primary,
    fontWeight: '700',
  },
  tabContent: {
    paddingTop: 16,
  },

  // ── Quick Filter Pills (Upgrade 5) ─────────────────────────────────────────
  quickFilterBar: {
    marginBottom: 8,
  },
  quickFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 5,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  quickFilterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  quickFilterPillTextActive: {
    color: colors.background.primary,
  },

  // ── Empty State (Upgrade 6) ────────────────────────────────────────────────
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[700],
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background.primary,
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  sectionCount: {
    fontSize: 12,
    color: colors.neutral[500],
  },

  // Sort & Filter
  sortFilterBar: {
    backgroundColor: colors.background.primary,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sortFilterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 6,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[900],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: colors.warningScale[400],
  },
  filterChipText: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.background.primary,
    fontWeight: '600',
  },

  // Dietary
  dietaryStrip: {
    paddingVertical: 8,
    backgroundColor: colors.background.primary,
  },
  dietaryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 6,
  },
  dietaryIcon: {
    fontSize: 14,
  },
  dietaryLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
  },

  // Stores Grid
  storesGrid: {
    gap: 12,
  },

  // ── Store Card ──────────────────────────────────────────
  storeCard: {
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  storeCardCompact: {
    minWidth: 180,
    marginRight: 12,
    marginBottom: 0,
  },
  storeImageContainer: {
    height: 140,
    position: 'relative',
  },
  storeImageContainerCompact: {
    height: 100,
  },
  storeImage: {
    width: '100%',
    height: '100%',
  },
  storeImagePlaceholder: {
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeImagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.neutral[500],
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  storeImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  storeBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: '70%',
  },
  badge60Min: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.warningScale[400],
    gap: 3,
  },
  badge60MinText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  badgeHalal: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0D9488',
  },
  badgeHalalText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background.primary,
  },
  badgePureVeg: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.success,
  },
  badgePureVegText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background.primary,
  },
  // kept for backward compat (no longer used in new layout but don't remove)
  badgeCashbackPurple: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.brand.purpleLight,
  },
  badgeCashbackPurpleText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background.primary,
  },
  badgeNew: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeNewText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.background.primary,
  },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Cashback overlay badge (Upgrade 1)
  cashbackOverlayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.brand.purpleLight,
    gap: 4,
  },
  cashbackOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background.primary,
  },
  // Distance overlay badge (Upgrade 7)
  distanceOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 3,
  },
  distanceOverlayText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background.primary,
  },
  storeRating: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    gap: 3,
  },
  storeRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  storeRatingCount: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  storeContent: {
    padding: 12,
  },
  // Store name row with inline stars
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  storeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    marginRight: 8,
  },
  inlineStarRow: {
    flexDirection: 'row',
    gap: 1,
  },
  // Tag pills row (max 2 shown)
  tagPillsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 4,
    marginBottom: 6,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  storeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  storeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  storeMetaText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  priceRangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  storePriceForTwo: {
    fontSize: 11,
    color: colors.neutral[500],
    marginLeft: 4,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  freeDeliveryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.tint.greenLight,
  },
  freeDeliveryText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.successScale[700],
  },
  // Bottom row: coins + CTA button
  storeBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: 8,
  },
  storeCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  storeCoinsText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warningScale[500],
  },
  reviewBonusText: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  bookNowButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background.primary,
    letterSpacing: 0.2,
  },
  visitProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  visitProgressText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.neutral[400],
  },
  unlockRewardText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // kept for backward compat (reserve button now replaced by bookNowButton)
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.nileBlue,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  reserveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.background.primary,
  },

  // Service Type Cards
  serviceTypesList: {
    gap: 12,
    paddingRight: 16,
  },
  serviceTypeCard: {
    width: 160,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  serviceTypeGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  serviceTypeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background.primary,
    marginTop: 8,
  },
  serviceTypeDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Curated Collections
  curatedList: {
    gap: 12,
    paddingRight: 16,
  },
  curatedCard: {
    width: 160,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  curatedGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'flex-end',
  },
  curatedIconText: {
    fontSize: 24,
    marginBottom: 4,
  },
  curatedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background.primary,
  },
  curatedSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },

  // Value Proposition
  valuePropCard: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  valuePropGradient: {
    padding: 20,
  },
  valuePropTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  valuePropBrand: {
    color: colors.warningScale[400],
    fontWeight: '800',
  },
  valuePropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  valuePropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 10,
  },
  valuePropIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuePropText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  savingsLeft: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.warningScale[400],
  },
  savingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.warningScale[400],
  },
  savingsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nileBlue,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalOptionActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.neutral[900],
  },
  modalOptionTextActive: {
    fontWeight: '600',
    color: colors.warningScale[400],
  },

  // Pagination
  loadMoreButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(DynamicCategoryPage);
