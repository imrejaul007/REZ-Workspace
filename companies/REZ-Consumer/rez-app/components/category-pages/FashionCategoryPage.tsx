// @ts-nocheck
/**
 * Fashion Category Page - PRODUCTION READY v2
 * Features: Dual-row filter chips (category + preferences), filter propagation to ALL sections,
 * fashion-specific quick actions, trending items, try & buy, enhanced store cards,
 * proper empty states
 * Purple themed to differentiate from other categories
 */

import React, { useState, useMemo, useCallback } from 'react';
import { BRAND } from '@/constants/brand';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import CategoryHeader from '@/components/CategoryHeader';
import { getCategoryConfig } from '@/config/categoryConfig';
import QuickActionBar from '@/components/category/QuickActionBar';
import StreakLoyaltySection from '@/components/category/StreakLoyaltySection';
import FooterTrustSection from '@/components/category/FooterTrustSection';
import BrowseCategoryGrid from '@/components/category/BrowseCategoryGrid';
import EnhancedAISuggestionsSection from '@/components/category/EnhancedAISuggestionsSection';
import EnhancedUGCSocialProofSection from '@/components/category/EnhancedUGCSocialProofSection';
import OffersSection from '@/components/category/OffersSection';
import OrderAgainSection from '@/components/category/OrderAgainSection';
import { useCategoryPageData } from '@/hooks/useCategoryPageData';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import EmptyState from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { fashionCategoryData, fashionServiceFilters, fashionModeFilters, fashionQuickActions } from '@/data/category/fashionCategoryData';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const COLORS = {
  purple: colors.brand.purpleMedium,
  purpleDark: colors.brand.purple,
  purpleLight: '#FAF5FF',
  primaryGold: colors.warningScale[400],
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[500],
  white: colors.background.primary,
  background: colors.tint.warmGray,
  border: colors.neutral[200],
};

// All fashion services with tags for filter matching
const ALL_FASHION_SERVICES = [
  { id: 'try-on', name: 'Try & Buy', emoji: '👗', tags: ['women', 'men'], cashback: 20 },
  { id: 'tailoring', name: 'Tailoring', emoji: '✂️', tags: ['ethnic', 'men'], cashback: 25 },
  { id: 'styling', name: 'Styling', emoji: '💄', tags: ['women', 'premium'], cashback: 18 },
  { id: 'alterations', name: 'Alterations', emoji: '🧵', tags: ['men', 'women'], cashback: 15 },
  { id: 'shoe-care', name: 'Shoe Care', emoji: '👟', tags: ['footwear'], cashback: 12 },
  { id: 'wardrobe-consult', name: 'Wardrobe Help', emoji: '🪄', tags: ['premium', 'women'], cashback: 22 },
  { id: 'fabric-care', name: 'Fabric Care', emoji: '🧺', tags: ['ethnic', 'premium'], cashback: 15 },
  { id: 'gift-wrapping', name: 'Gift Wrap', emoji: '🎁', tags: ['accessories'], cashback: 10 },
];

// Trending items data
const TRENDING_ITEMS = [
  { id: 'ethnic-wear', name: 'Ethnic Wear', emoji: '🪷', tag: 'ethnic', bookings: 680, priceFrom: 1500 },
  { id: 'sneakers', name: 'Sneakers', emoji: '👟', tag: 'footwear', bookings: 520, priceFrom: 2000 },
  { id: 'party-dresses', name: 'Party Dresses', emoji: '👗', tag: 'women', bookings: 450, priceFrom: 1200 },
  { id: 'casual-shirts', name: 'Casual Shirts', emoji: '👔', tag: 'men', bookings: 380, priceFrom: 800 },
  { id: 'watches', name: 'Watches', emoji: '⌚', tag: 'accessories', bookings: 320, priceFrom: 3000 },
  { id: 'streetwear', name: 'Streetwear', emoji: '🧢', tag: 'streetwear', bookings: 290, priceFrom: 900 },
];

// Helper: check if a store matches a given filter
function storeMatchesFilter(store, filterId: string): boolean {
  const tags = ((store.tags || []) as unknown[]).map((t: string) => t.toLowerCase());
  const serviceTypes = ((store.serviceTypes || []) as unknown[]).map((t: string) => t.toLowerCase());
  const allTags = [...tags, ...serviceTypes];

  switch (filterId) {
    case 'men': return allTags.some(t => t.includes('men') || t.includes('male') || t.includes('gents'));
    case 'women': return allTags.some(t => t.includes('women') || t.includes('female') || t.includes('ladies'));
    case 'kids': return allTags.some(t => t.includes('kid') || t.includes('child') || t.includes('baby'));
    case 'footwear': return allTags.some(t => t.includes('shoe') || t.includes('footwear') || t.includes('sneaker'));
    case 'ethnic': return allTags.some(t => t.includes('ethnic') || t.includes('traditional') || t.includes('saree'));
    case 'streetwear': return allTags.some(t => t.includes('street') || t.includes('casual') || t.includes('urban'));
    case 'accessories': return allTags.some(t => t.includes('accessor') || t.includes('watch') || t.includes('bag') || t.includes('jewel'));
    case 'budget': return (store.priceForTwo || 999) < 1000 || store.deliveryCategories?.budgetFriendly;
    case 'premium': return tags.some(t => t.includes('premium') || t.includes('luxury') || t.includes('designer'));
    case 'sustainable': return tags.some(t => t.includes('sustainable') || t.includes('eco') || t.includes('organic'));
    case 'trending': return tags.some(t => t.includes('trending') || t.includes('popular') || t.includes('hot'));
    case 'try-and-buy': return tags.some(t => t.includes('try') || t.includes('60min') || t.includes('trial'));
    case 'pickup': return tags.some(t => t.includes('pickup') || t.includes('store') || t.includes('collect'));
    default: return false;
  }
}

function getPriceTier(priceForTwo?: number): { label: string; color: string } {
  if (!priceForTwo) return { label: '', color: '' };
  if (priceForTwo < 1000) return { label: '$', color: colors.success };
  if (priceForTwo < 3000) return { label: '$$', color: colors.warningScale[400] };
  return { label: '$$$', color: colors.brand.purpleLight };
}

function FashionCategoryPage() {
  const router = useRouter();
  const slug = 'fashion';
  const categoryConfig = getCategoryConfig(slug);
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const {
    subcategories, stores, products, ugcPosts, aiPlaceholders,
    isLoading, error, refetch,
  } = useCategoryPageData(slug);

  const [activeServiceFilters, setActiveServiceFilters] = useState<string[]>([]);
  const [activeLifestyleFilters, setActiveLifestyleFilters] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useIsMounted();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeModes = [...activeServiceFilters, ...activeLifestyleFilters];
  const hasActiveFilters = activeModes.length > 0;

  const onRefresh = async () => { setRefreshing(true); await refetch(); if (isMounted()) setRefreshing(false); };

  const toggleServiceFilter = (filterId: string) => {
    if (!isMounted()) return;
    setActiveServiceFilters(prev =>
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  const toggleLifestyleFilter = (filterId: string) => {
    setActiveLifestyleFilters(prev =>
      prev.includes(filterId) ? prev.filter(f => f !== filterId) : [...prev, filterId]
    );
  };

  const clearAllFilters = () => { setActiveServiceFilters([]); setActiveLifestyleFilters([]); };

  const storeCountsByFilter = useMemo(() => {
    const counts: Record<string, number> = {};
    [...fashionServiceFilters, ...fashionModeFilters].forEach(f => {
      counts[f.id] = stores.filter((s) => storeMatchesFilter(s, f.id)).length;
    });
    return counts;
  }, [stores]);

  const filteredStores = useMemo(() => {
    if (!hasActiveFilters) return stores;
    return stores.filter((store) => {
      const passesService = activeServiceFilters.length === 0 ||
        activeServiceFilters.some(f => storeMatchesFilter(store, f));
      const passesLifestyle = activeLifestyleFilters.length === 0 ||
        activeLifestyleFilters.some(f => storeMatchesFilter(store, f));
      return passesService && passesLifestyle;
    });
  }, [stores, activeServiceFilters, activeLifestyleFilters, hasActiveFilters]);

  const filteredProducts = useMemo(() => {
    if (!hasActiveFilters) return products;
    return products.filter((product) => {
      const tags = (product.tags || []).map((t: string) => t.toLowerCase());
      const name = (product.name || '').toLowerCase();
      const allTags = [...tags, name];
      const passesService = activeServiceFilters.length === 0 ||
        activeServiceFilters.some(f => allTags.some(t => t.includes(f)));
      const passesLifestyle = activeLifestyleFilters.length === 0 ||
        activeLifestyleFilters.some(f => {
          if (f === 'budget') return (product.price || 999) < 1000;
          if (f === 'premium') return allTags.some(t => t.includes('premium'));
          return true;
        });
      return passesService && passesLifestyle;
    });
  }, [products, activeServiceFilters, activeLifestyleFilters, hasActiveFilters]);

  const filteredServices = useMemo(() => {
    if (activeServiceFilters.length === 0) return ALL_FASHION_SERVICES;
    return ALL_FASHION_SERVICES.filter(s => s.tags.some(t => activeServiceFilters.includes(t)));
  }, [activeServiceFilters]);

  const filteredTrending = useMemo(() => {
    if (activeServiceFilters.length === 0) return TRENDING_ITEMS;
    return TRENDING_ITEMS.filter(t => activeServiceFilters.includes(t.tag));
  }, [activeServiceFilters]);

  const activeFilterTags = useMemo(() => {
    if (!hasActiveFilters) return undefined;
    return activeModes;
  }, [activeModes, hasActiveFilters]);

  const handleCategoryPress = useCallback((category) => {
    router.push(`/MainCategory/fashion/${category.slug || category.id}` as unknown);
  }, [router]);

  const handleAISearch = useCallback((query: string) => {
    router.push(`/MainCategory/fashion/search?q=${encodeURIComponent(query)}` as unknown);
  }, [router]);

  if (!categoryConfig) return null;

  if (isLoading && !refreshing && stores.length === 0) {
    return <LoadingState message="Loading fashion..." />;
  }

  if (error && stores.length === 0) {
    return (
      <EmptyState
        icon="👗"
        title="Unable to load fashion"
        message={error || "Something went wrong. Please try again."}
        actionLabel="Try Again"
        onAction={refetch}
      />
    );
  }

  const renderChip = (
    filter: { id: string; label: string; icon: string; color: string },
    isActive: boolean,
    onToggle: (id: string) => void,
  ) => {
    const count = storeCountsByFilter[filter.id] || 0;
    return (
      <Pressable
        key={filter.id}
        onPress={() => onToggle(filter.id)}
        style={[styles.chipBase, isActive && { backgroundColor: filter.color, borderColor: filter.color }]}
       
      >
        <View style={[styles.chipIconCircle, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : `${filter.color}14` }]}>
          {isActive ? <Ionicons name="checkmark" size={14} color={COLORS.white} /> : <Text style={styles.chipIconText}>{filter.icon}</Text>}
        </View>
        <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : null]}>{filter.label}</Text>
        {count > 0 && (
          <View style={[styles.chipCount, isActive ? styles.chipCountActive : null]}>
            <Text style={[styles.chipCountText, isActive ? styles.chipCountTextActive : null]}>{count}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ErrorBoundary onError={() => { /* silently handle */ }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS['purple']]} />}
    >
      <CategoryHeader
        categoryName={categoryConfig.name}
        primaryColor={categoryConfig.primaryColor}
        banner={categoryConfig.banner}
        gradientColors={categoryConfig.gradientColors}
      />

      {/* Rewards Strip */}
      <Pressable style={styles.rewardsStrip} onPress={() => router.push('/MainCategory/fashion/loyalty' as unknown)}>
        <LinearGradient colors={['rgba(168,85,247,0.15)', 'rgba(124,58,237,0.1)']} style={styles.rewardsGradient}>
          <View style={styles.rewardsContent}>
            <Ionicons name="star" size={20} color={COLORS['purple']} />
            <Text style={styles.rewardsText}>{`Earn up to 25% Cashback + ${BRAND.COIN_NAME} on every fashion purchase`}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS['purple']} />
          </View>
          <Text style={styles.rewardsSubtext}>Works at boutiques, brands & online stores</Text>
        </LinearGradient>
      </Pressable>

      {/* Dual-Row Filter Chips */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterRowLabel}>Shop by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {fashionServiceFilters.map(f => renderChip(f, activeServiceFilters.includes(f.id), toggleServiceFilter))}
        </ScrollView>
        <Text style={[styles.filterRowLabel, { marginTop: 10 }]}>Your Preferences</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {fashionModeFilters.map(f => renderChip(f, activeLifestyleFilters.includes(f.id), toggleLifestyleFilter))}
        </ScrollView>
        {hasActiveFilters && (
          <View style={styles.filterSummary}>
            <Text style={styles.filterSummaryText}>
              Showing: {activeModes.map(m => {
                const f = [...fashionServiceFilters, ...fashionModeFilters].find(x => x.id === m);
                return f?.label;
              }).filter(Boolean).join(', ')}
            </Text>
            <Pressable onPress={clearAllFilters} style={styles.clearFilters}>
              <Text style={styles.clearFiltersText}>Clear all</Text>
              <Ionicons name="close-circle" size={14} color={COLORS['purple']} />
            </Pressable>
          </View>
        )}
      </View>

      <QuickActionBar categorySlug={slug} actions={fashionQuickActions as unknown} />

      <EnhancedAISuggestionsSection categorySlug={slug} categoryName={categoryConfig.name} placeholders={aiPlaceholders} onSearch={handleAISearch} />

      <BrowseCategoryGrid categories={subcategories as unknown} title="Shop by Category" onCategoryPress={handleCategoryPress} />

      {/* Trending Items */}
      {filteredTrending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={20} color={colors.error} />
            <Text style={styles.sectionTitle}>Trending This Week</Text>
            <Pressable onPress={() => router.push('/MainCategory/fashion/search?q=trending' as unknown)}>
              <Text style={styles.sectionSeeAll}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
            {filteredTrending.map(w => (
              <Pressable key={w.id} style={styles.trendingCard} onPress={() => router.push(`/MainCategory/fashion/search?q=${w.id}` as unknown)}>
                <LinearGradient colors={[COLORS['purple'], COLORS.purpleDark]} style={styles.trendingGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.trendingEmoji}>{w.emoji}</Text>
                  <Text style={styles.trendingName}>{w.name}</Text>
                  <View style={styles.trendingBadge}>
                    <Ionicons name="trending-up" size={10} color={COLORS['purple']} />
                    <Text style={styles.trendingBadgeText}>{w.bookings}+ sold</Text>
                  </View>
                  <Text style={styles.trendingPrice}>From {currencySymbol}{w.priceFrom}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Fashion Services */}
      {filteredServices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>✨</Text>
            <Text style={styles.sectionTitle}>Fashion Services</Text>
            <Pressable onPress={() => router.push('/MainCategory/fashion/try-and-buy' as unknown)}>
              <Text style={styles.sectionSeeAll}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesList}>
            {filteredServices.map(s => (
              <Pressable key={s.id} style={styles.serviceCard} onPress={() => router.push(`/MainCategory/fashion/try-and-buy` as unknown)}>
                <View style={styles.serviceIcon}><Text style={styles.serviceEmoji}>{s.emoji}</Text></View>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceCashback}>Up to {s.cashback}% cashback</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <OrderAgainSection categorySlug={slug} />

      {/* Fashion Products */}
      {filteredProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>🛍️</Text>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <Pressable onPress={() => router.push('/MainCategory/fashion/search?q=trending' as unknown)}>
              <Text style={styles.sectionSeeAll}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsList}>
            {filteredProducts.slice(0, 6).map((p) => (
              <Pressable key={p.id} style={styles.productCardCompact} onPress={() => router.push(`/product-page?productId=${p.id}` as unknown)}>
                {p.image ? (
                  <CachedImage source={p.image} style={styles.productImageCompact} contentFit="cover" />
                ) : (
                  <View style={[styles.productImageCompact, styles.productPlaceholder]}>
                    <Ionicons name="shirt-outline" size={28} color={COLORS['purple']} />
                  </View>
                )}
                <Text style={styles.productNameCompact} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.productPriceCompact}>{currencySymbol}{p.price?.toLocaleString() || '0'}</Text>
                <Text style={styles.productCashbackCompact}>{p.cashback || 10}% cashback</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Top Stores & Boutiques */}
      {filteredStores.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS['purple']} />
            <Text style={styles.sectionTitle}>Top Stores & Boutiques</Text>
            <Pressable onPress={() => router.push('/MainCategory/fashion/top-rated' as unknown)}>
              <Text style={styles.sectionSeeAll}>View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesList}>
            {filteredStores.slice(0, 5).map((store) => {
              const pt = getPriceTier(store.priceForTwo);
              const cashback = store.offers?.cashback || store.cashback;
              const isNew = store.isNew || store.showNewBadge;
              const rating = store.ratings?.average || store.rating;
              const storeTags = (store.tags || [])
                .filter((t: string) => !['pure-veg','veg','non-veg','halal'].includes(t.toLowerCase()))
                .slice(0, 2)
                .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1));
              const imageSource = store.logo || (Array.isArray(store.banner) ? store.banner[0] : store.banner);
              return (
                <Pressable key={store._id || store.id} style={styles.storeCard} onPress={() => router.push(`/MainStorePage?storeId=${store._id || store.id}` as unknown)}>
                  {/* Store image */}
                  {imageSource ? (
                    <CachedImage source={imageSource} style={styles.storeImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.storeImage, styles.storePlaceholder]}>
                      <Ionicons name="storefront" size={32} color={COLORS['purple']} />
                    </View>
                  )}
                  {/* Badges overlay */}
                  <View style={styles.storeBadgesRow}>
                    {isNew ? (
                      <View style={styles.storeNewBadge}>
                        <Text style={styles.storeNewBadgeText}>NEW</Text>
                      </View>
                    ) : (
                      <View style={styles.storeBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={COLORS.white} />
                        <Text style={styles.storeBadgeText}>Verified</Text>
                      </View>
                    )}
                    {cashback ? (
                      <View style={styles.storeCashbackBadge}>
                        <Text style={styles.storeCashbackBadgeText}>{cashback}% off</Text>
                      </View>
                    ) : null}
                  </View>
                  {/* Content */}
                  <View style={styles.storeCardContent}>
                    <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                    {/* Rating + price tier */}
                    <View style={styles.storeMeta}>
                      {rating ? (
                        <View style={styles.storeRating}>
                          <Ionicons name="star" size={11} color={COLORS.primaryGold} />
                          <Text style={styles.storeRatingText}>{typeof rating === 'number' ? rating.toFixed(1) : rating}</Text>
                        </View>
                      ) : null}
                      {pt.label ? <Text style={[styles.storePriceTier, { color: pt.color }]}>{pt.label}</Text> : null}
                    </View>
                    {/* Tags */}
                    {storeTags.length > 0 && (
                      <View style={styles.storeTagsRow}>
                        {storeTags.map((tag: string, i: number) => (
                          <View key={i} style={styles.storeTag}>
                            <Text style={styles.storeTagText} numberOfLines={1}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* New arrivals pill */}
                    <View style={styles.storeNewArrivalsRow}>
                      <Ionicons name="sparkles-outline" size={11} color={COLORS['purple']} />
                      <Text style={styles.storeNewArrivalsText}>New arrivals this week</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Filter empty state */}
      {hasActiveFilters && filteredStores.length === 0 && filteredProducts.length === 0 && (
        <View style={styles.filterEmptyState}>
          <Ionicons name="search-outline" size={48} color={COLORS.purpleLight} />
          <Text style={styles.filterEmptyTitle}>No fashion stores match your filters</Text>
          <Text style={styles.filterEmptySubtitle}>Try removing some filters to see more results</Text>
          <Pressable onPress={clearAllFilters} style={styles.filterEmptyClearBtn}>
            <Text style={styles.filterEmptyClearText}>Clear all filters</Text>
          </Pressable>
        </View>
      )}

      <OffersSection categorySlug={slug} title="Today's Top Fashion Deals" onSeeAll={() => router.push('/MainCategory/fashion/offers' as unknown)} filterTags={activeFilterTags} />

      {/* 60-min Try & Buy Banner */}
      <View style={styles.section}>
        <Pressable style={styles.ctaBanner} onPress={() => router.push('/MainCategory/fashion/try-and-buy' as unknown)}>
          <LinearGradient colors={[COLORS['purple'], COLORS.purpleDark]} style={styles.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaEmoji}>⚡</Text>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>60-min Try & Buy</Text>
                <Text style={styles.ctaSubtitle}>Try at home, pay only if you love it</Text>
              </View>
              <View style={styles.ctaBtn}><Text style={styles.ctaBtnText}>Try Now</Text></View>
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <StreakLoyaltySection categorySlug={slug} primaryColor={COLORS['purple']} />

      <EnhancedUGCSocialProofSection
        categorySlug={slug} categoryName={categoryConfig.name} posts={ugcPosts}
        title="Real Shoppers, Real Style" subtitle="See how others are shopping!"
        onPostPress={() => router.push('/MainCategory/fashion/fashion-stories' as unknown)}
        onSharePress={() => router.push('/MainCategory/fashion/fashion-stories' as unknown)}
      />

      <FooterTrustSection />
    </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { paddingBottom: 100 },
  rewardsStrip: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  rewardsGradient: { padding: 12 },
  rewardsContent: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  rewardsText: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  rewardsSubtext: { fontSize: 12, color: COLORS.textSecondary },
  filtersContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  filterRowLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterRow: { gap: 8, paddingRight: 8 },
  chipBase: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 22, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, gap: 6 },
  chipIconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  chipIconText: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  chipLabelActive: { color: COLORS.white, fontWeight: '600' },
  chipCount: { backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  chipCountText: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary },
  chipCountTextActive: { color: COLORS.white },
  filterSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  filterSummaryText: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  clearFilters: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearFiltersText: { fontSize: 12, color: COLORS['purple'], fontWeight: '600' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionEmoji: { fontSize: 20 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  sectionSeeAll: { fontSize: 12, color: COLORS['purple'], fontWeight: '500' },
  trendingList: { gap: 12, paddingRight: 16 },
  trendingCard: { width: 140, borderRadius: 16, overflow: 'hidden' },
  trendingGradient: { padding: 14, height: 160, justifyContent: 'space-between' },
  trendingEmoji: { fontSize: 28 },
  trendingName: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginTop: 4 },
  trendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  trendingBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS['purple'] },
  trendingPrice: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  servicesList: { gap: 12, paddingRight: 16 },
  serviceCard: {
    width: 100, alignItems: 'center', padding: 12, borderRadius: 16, backgroundColor: COLORS.white,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 1 }, web: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } }),
  },
  serviceIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.purpleLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceEmoji: { fontSize: 24 },
  serviceName: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  serviceCashback: { fontSize: 11, color: COLORS['purple'], textAlign: 'center' },
  productsList: { gap: 12, paddingRight: 16 },
  productCardCompact: {
    width: 140, padding: 8, borderRadius: 12, backgroundColor: COLORS.white,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 1 }, web: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)' } }),
  },
  productImageCompact: { width: '100%', height: 140, borderRadius: 8, marginBottom: 8 },
  productPlaceholder: { backgroundColor: COLORS.purpleLight, justifyContent: 'center', alignItems: 'center' },
  productNameCompact: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary, marginBottom: 4 },
  productPriceCompact: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  productCashbackCompact: { fontSize: 11, color: COLORS['purple'] },
  storesList: { gap: 12, paddingRight: 16 },
  storeCard: {
    width: 180,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...Platform.select({
      ios: { shadowColor: '#A855F7', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 8px rgba(168,85,247,0.1)' },
    }),
  },
  storeImage: { width: '100%', height: 110 },
  storePlaceholder: { backgroundColor: COLORS.purpleLight, justifyContent: 'center', alignItems: 'center' },
  // Badge overlays on image
  storeBadgesRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: COLORS['purple'],
    gap: 3,
  },
  storeBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.white },
  storeNewBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#FFC857',
  },
  storeNewBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  storeCashbackBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  storeCashbackBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  storeCardContent: { padding: 10 },
  storeName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  storeMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  storeRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  storeRatingText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  storePriceTier: { fontSize: 12, fontWeight: '700' },
  storeTagsRow: { flexDirection: 'row', gap: 4, marginBottom: 6, flexWrap: 'wrap' },
  storeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: `${COLORS['purple']}14`,
  },
  storeTagText: { fontSize: 10, color: COLORS['purple'], fontWeight: '500' },
  storeNewArrivalsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  storeNewArrivalsText: { fontSize: 10, color: COLORS['purple'], fontWeight: '500' },
  storeService: { fontSize: 11, color: COLORS.textSecondary, paddingHorizontal: 8, paddingBottom: 8 },
  filterEmptyState: { alignItems: 'center', padding: 40, marginTop: 24 },
  filterEmptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16 },
  filterEmptySubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  filterEmptyClearBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS['purple'] },
  filterEmptyClearText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  ctaBanner: { borderRadius: 16, overflow: 'hidden' },
  ctaGradient: { padding: 16 },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaEmoji: { fontSize: 32 },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  ctaSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  ctaBtn: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  ctaBtnText: { fontSize: 13, fontWeight: '600', color: COLORS['purple'] },
});

export default React.memo(FashionCategoryPage);
