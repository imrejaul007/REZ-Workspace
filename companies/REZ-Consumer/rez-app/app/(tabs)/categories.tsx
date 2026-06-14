// @ts-nocheck
/**
 * Categories Tab — Discover Everything
 *
 * A comprehensive discovery page that surfaces every section available on the
 * homepage.  The category grid (quick nav) sits at the top, followed by all
 * deal, vertical, store, product, engagement, student, employee, and misc
 * sections — each lazy-loaded via the LazySection viewport pattern.
 *
 * Rules:
 *  - COPY only — NearUTabContent.tsx is never touched.
 *  - Lazy imports use the SAME lazyGroups barrel files as NearUTabContent.
 *  - Student / employee sections are segment-gated via useUserIdentityStore.
 *  - Every heavy section is wrapped in both LazySection and Suspense.
 */

import React, { Suspense, useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput, RefreshControl, Dimensions } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/constants/theme';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import CachedImage from '@/components/ui/CachedImage';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

import { CATEGORY_CONFIGS, SubcategoryItem } from '@/config/categoryConfig';
import { getSubcategoryIcon } from '@/config/categoryIcons';

import LazySection from '@/components/homepage/LazySection';
import { useUserIdentityStore } from '@/stores/userIdentityStore';

// ─── Static imports (lightweight / rendered early) ────────────────────────────
import HomeSavingsSummaryCard from '@/components/homepage/HomeSavingsSummaryCard';
import EarnRezCoinsSection from '@/components/homepage/EarnRezCoinsSection';
import HowRezWorksCard from '@/components/homepage/HowRezWorksCard';
import NewOnRezSection from '@/components/homepage/NewOnRezSection';
import EventsExperiencesSection from '@/components/homepage/EventsExperiencesSection';
import PromoBanner from '@/components/homepage/PromoBanner';
import GlobeBanner from '@/components/homepage/GlobeBanner';

// ─── Student sections (static imports — rendered early for student persona) ───
import CampusHotDealsStrip from '@/components/homepage/sections/CampusHotDealsStrip';
import StudentBudgetFoodGrid from '@/components/homepage/sections/StudentBudgetFoodGrid';
import StudentEntertainmentSection from '@/components/homepage/sections/StudentEntertainmentSection';
import StudentUtilityDealsSection from '@/components/homepage/sections/StudentUtilityDealsSection';
import StudentMicroPrepaidPacks from '@/components/homepage/sections/StudentMicroPrepaidPacks';

// ─── Employee sections ─────────────────────────────────────────────────────────
import EmployeeLunchDealsSection from '@/components/homepage/sections/EmployeeLunchDealsSection';
import EmployeeAfterWorkSection from '@/components/homepage/sections/EmployeeAfterWorkSection';
import EmployeeWellnessBookingSection from '@/components/homepage/sections/EmployeeWellnessBookingSection';
import EmployeeValuePacksSection from '@/components/homepage/sections/EmployeeValuePacksSection';
import EmployeeUtilityServicesSection from '@/components/homepage/sections/EmployeeUtilityServicesSection';

// ─── Group A: Category verticals (1 lazy chunk) ───────────────────────────────
const BeautyWellnessSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.BeautyWellnessSection })),
);
const FitnessSportsSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.FitnessSportsSection })),
);
const GroceryEssentialsSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.GroceryEssentialsSection })),
);
const HealthcareSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.HealthcareSection })),
);
const HomeServicesSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.HomeServicesSection })),
);
const FinancialServicesSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.FinancialServicesSection })),
);
const TravelSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categorySections').then((m) => ({ default: m.TravelSection })),
);

// ─── Group B: Category list sections (1 lazy chunk) ──────────────────────────
const BestDiscountSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categoryListSections').then((m) => ({ default: m.BestDiscountSection })),
);
const BestSellerSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/categoryListSections').then((m) => ({ default: m.BestSellerSection })),
);

// ─── Group C: Store browse sections (1 lazy chunk) ───────────────────────────
const GoingOutSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/storeBrowseSections').then((m) => ({ default: m.GoingOutSection })),
);
const HomeDeliverySection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/storeBrowseSections').then((m) => ({ default: m.HomeDeliverySection })),
);
const ServiceSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/storeBrowseSections').then((m) => ({ default: m.ServiceSection })),
);

// ─── Group D: Gamification sections (1 lazy chunk) ───────────────────────────
const WalletSnapshotCard = React.lazy(() =>
  import('@/components/homepage/lazyGroups/gamificationSections').then((m) => ({ default: m.WalletSnapshotCard })),
);
const LoyaltyRewardsHubCard = React.lazy(() =>
  import('@/components/homepage/lazyGroups/gamificationSections').then((m) => ({ default: m.LoyaltyRewardsHubCard })),
);
const FeatureTryCards = React.lazy(() =>
  import('@/components/homepage/lazyGroups/gamificationSections').then((m) => ({ default: m.FeatureTryCards })),
);
const PlayAndEarnSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/gamificationSections').then((m) => ({ default: m.PlayAndEarnSection })),
);
const SocialProofSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/gamificationSections').then((m) => ({ default: m.SocialProofSection })),
);

// ─── Group E: Deal sections (1 lazy chunk) ────────────────────────────────────
const ExcitingDealsSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/dealSections').then((m) => ({ default: m.ExcitingDealsSection })),
);
const DealsThatSaveMoney = React.lazy(() =>
  import('@/components/homepage/lazyGroups/dealSections').then((m) => ({ default: m.DealsThatSaveMoney })),
);
const FlashSales = React.lazy(() =>
  import('@/components/homepage/lazyGroups/dealSections').then((m) => ({ default: m.FlashSales })),
);
const ShopByExperienceSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/dealSections').then((m) => ({ default: m.ShopByExperienceSection })),
);
const HotDealsSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/dealSections').then((m) => ({ default: m.HotDealsSection })),
);
const PopularProductsSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/dealSections').then((m) => ({ default: m.PopularProductsSection })),
);

// ─── Group F: Discovery sections (1 lazy chunk) ──────────────────────────────
const PickedForYou = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({ default: m.PickedForYou })),
);
const NearbyProductsSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({ default: m.NearbyProductsSection })),
);
const StoresNearYou = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({ default: m.StoresNearYou })),
);
const BrandPartnerships = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({ default: m.BrandPartnerships })),
);
const StoreDiscoverySection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({ default: m.StoreDiscoverySection })),
);
const FeaturedCategoriesContainer = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({
    default: m.FeaturedCategoriesContainer,
  })),
);
const StoreExperiencesSection = React.lazy(() =>
  import('@/components/homepage/lazyGroups/discoverySections').then((m) => ({ default: m.StoreExperiencesSection })),
);

// ─── Standalone lazy imports ──────────────────────────────────────────────────
const TrendingNearYou = React.lazy(() => import('@/components/homepage/TrendingNearYou'));
const RecentlyViewedSection = React.lazy(() => import('@/components/category/RecentlyViewedSection'));
const DiscoverAndShopSection = React.lazy(() => import('@/components/discover/DiscoverAndShopSection'));
const RecommendedStoresSection = React.lazy(() => import('@/components/homepage/RecommendedStoresSection'));

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 4;
const ITEM_WIDTH = (SCREEN_WIDTH - 32) / NUM_COLUMNS;

interface CategorySection {
  id: string;
  name: string;
  color: string;
  subcategories: SubcategoryItem[];
}

const CATEGORY_SECTIONS: CategorySection[] = Object.values(CATEGORY_CONFIGS).map((cat) => ({
  id: cat.slug,
  name: cat.name,
  color: cat.primaryColor,
  subcategories: cat.subcategories,
}));

// ─── Sized Suspense placeholder to prevent layout collapse ───────────────────
// eslint-disable-next-line react/display-name
const SuspensePlaceholder: React.FC<{ height: number }> = React.memo(({ height }) => (
  <View style={{ height, backgroundColor: colors.tint.warmGray }} />
));

// ─── Section group header ─────────────────────────────────────────────────────
const SectionGroupHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={groupHeaderStyles.wrapper}>
    <ThemedText style={groupHeaderStyles.title}>{title}</ThemedText>
    {subtitle ? <ThemedText style={groupHeaderStyles.subtitle}>{subtitle}</ThemedText> : null}
  </View>
);

const groupHeaderStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderTopWidth: 4,
    borderTopColor: colors.background.secondary,
    marginTop: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
function CategoriesScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const { segment, statedIdentity } = useUserIdentityStore();
  const { isDark, themeColors } = useTheme();

  const isStudentUser = segment === 'verified_student' || statedIdentity === 'student';
  const isEmployeeCorporate = segment === 'verified_employee' || statedIdentity === 'corporate';

  // Time-aware flags for employee sections
  const _now = new Date();
  const _currentHour = _now.getHours();
  const _currentDay = _now.getDay();
  const _isWeekend = _currentDay === 0 || _currentDay === 6;
  const _isLunchWindow = _currentHour >= 11 && _currentHour < 14;
  const _isAfterWorkWindow = _isWeekend || _currentHour >= 17;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Allow components to re-mount / re-fetch by briefly toggling state
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // ─── Category grid renderers ────────────────────────────────────────────────
  const handleSubcategoryPress = useCallback(
    (subcategory: SubcategoryItem, parentSlug: string) => {
      router.push({
        pathname: '/StoreListPage',
        params: {
          category: subcategory.slug,
          parentCategory: parentSlug,
          title: subcategory.name,
        },
      } as unknown as string);
    },
    [router],
  );

  const renderSubcategoryItem = (item: SubcategoryItem, parentSlug: string, color: string) => {
    const customIcon = getSubcategoryIcon(item.slug);
    return (
      <Pressable
        key={item.slug}
        style={styles.gridItem}
        onPress={() => handleSubcategoryPress(item, parentSlug)}
        android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <View style={[styles.itemCard, { backgroundColor: colors.background.secondary }]}>
          {customIcon ? (
            <CachedImage
              source={customIcon}
              style={styles.itemImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              recyclingKey={item.slug}
            />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons
                name={(item.icon as keyof typeof Ionicons.glyphMap) || 'grid-outline'}
                size={32}
                color={color}
              />
            </View>
          )}
        </View>
        <ThemedText style={styles.itemName} numberOfLines={2}>
          {item.name}
        </ThemedText>
      </Pressable>
    );
  };

  const renderCategorySection = (section: CategorySection) => (
    <View key={section.id} style={styles.sectionContainer}>
      <ThemedText style={styles.sectionTitle}>{section.name}</ThemedText>
      <View style={styles.gridContainer}>
        {section.subcategories.map((sub) => renderSubcategoryItem(sub, section.id, section.color))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* iOS fix: categories header is dark navy — use light icons to be visible */}
      <ExpoStatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: Colors.brand.purpleLight }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.headerTitle}>Discover Everything</ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[
                styles.headerIcon,
                { backgroundColor: isDark ? themeColors.neutral[700] : 'rgba(255,255,255,0.5)' },
              ]}
              onPress={() => router.push('/wallet-screen')}
              android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true, radius: 20 }}
              accessibilityRole="button"
              accessibilityLabel="Open wallet"
            >
              <Ionicons name="wallet-outline" size={22} color={colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {/* Search bar — tap navigates to /search */}
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/search' as unknown as string)}
          android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
          accessibilityRole="search"
          accessibilityLabel="Search everything"
          accessibilityHint="Tap to open search"
        >
          <Ionicons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deals, stores, products..."
            placeholderTextColor={colors.text.tertiary}
            editable={false}
          />
          <Ionicons name="mic-outline" size={20} color={colors.text.tertiary} />
        </Pressable>
      </View>

      {/* ── Scrollable body ── */}
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — Quick Category Grid
            ════════════════════════════════════════════════════════════════════ */}
        <SectionGroupHeader title="Browse by Category" subtitle="Tap unknown category to explore stores & deals" />
        {CATEGORY_SECTIONS.map((section) => renderCategorySection(section))}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — Deals & Offers
            ════════════════════════════════════════════════════════════════════ */}
        <SectionGroupHeader title="Deals & Offers" subtitle="Savings curated just for you" />

        <LazySection
          sectionId="cat-exciting-deals"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <ExcitingDealsSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-shop-experience"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <ShopByExperienceSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-deals-save"
          scrollY={scrollY}
          height={400}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={400} />}>
              <DealsThatSaveMoney />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-flash-sales"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <FlashSales />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-hot-deals"
          scrollY={scrollY}
          height={280}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={280} />}>
              <HotDealsSection title="Hot Deals" limit={10} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-best-discount"
          scrollY={scrollY}
          height={280}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={280} />}>
              <BestDiscountSection title="Best Discounts" limit={10} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-best-seller"
          scrollY={scrollY}
          height={280}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={280} />}>
              <BestSellerSection title="Best Sellers" limit={10} />
            </Suspense>
          )}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3 — Category Verticals
            ════════════════════════════════════════════════════════════════════ */}
        <SectionGroupHeader title="Explore Verticals" subtitle="Deep-dive into what matters to you" />

        <LazySection
          sectionId="cat-beauty-wellness"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <BeautyWellnessSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-fitness-sports"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <FitnessSportsSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-grocery"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <GroceryEssentialsSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-healthcare"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <HealthcareSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-home-services"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <HomeServicesSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-financial-services"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <FinancialServicesSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-travel"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <TravelSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-events-exp"
          scrollY={scrollY}
          height={300}
          renderSection={() => <EventsExperiencesSection />}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4 — Store Discovery
            ════════════════════════════════════════════════════════════════════ */}
        <SectionGroupHeader title="Stores Near You" subtitle="Discover the best local shops" />

        <LazySection
          sectionId="cat-store-discovery"
          scrollY={scrollY}
          height={350}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={350} />}>
              <StoreDiscoverySection limit={10} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-trending-near-you"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <TrendingNearYou />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-nearby-products"
          scrollY={scrollY}
          height={280}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={280} />}>
              <NearbyProductsSection title="In Your Area" limit={10} radius={10} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-stores-near-you"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <StoresNearYou />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-picked-for-you"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <PickedForYou limit={2} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-recommended-stores"
          scrollY={scrollY}
          height={180}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={180} />}>
              <RecommendedStoresSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-going-out"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <GoingOutSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-home-delivery"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <HomeDeliverySection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-service"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <ServiceSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-store-experiences"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <StoreExperiencesSection />
            </Suspense>
          )}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 5 — Products & Shopping
            ════════════════════════════════════════════════════════════════════ */}
        <SectionGroupHeader title="Products" subtitle="Trending items and new arrivals" />

        <LazySection
          sectionId="cat-popular-products"
          scrollY={scrollY}
          height={280}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={280} />}>
              <PopularProductsSection title="Popular Products" limit={3} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-brand-partnerships"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <BrandPartnerships />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-featured-categories"
          scrollY={scrollY}
          height={400}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={400} />}>
              <FeaturedCategoriesContainer productsPerCategory={10} />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-discover-shop"
          scrollY={scrollY}
          height={600}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={600} />}>
              <View style={{ marginHorizontal: -20, marginTop: 16, marginBottom: 16 }}>
                <DiscoverAndShopSection showHeader={true} showCategories={true} initialTab="reels" maxHeight={600} />
              </View>
            </Suspense>
          )}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 6 — Engagement & Rewards
            ════════════════════════════════════════════════════════════════════ */}
        <SectionGroupHeader title="Rewards & Engagement" subtitle="Earn coins, track savings, unlock perks" />

        <HomeSavingsSummaryCard
          totalSaved={0}
          thisMonthSaved={0}
          currencySymbol="\u20B9"
          onPress={() => router.push('/wallet-screen')}
        />
        <EarnRezCoinsSection />
        <LazySection
          sectionId="cat-play-earn"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <PlayAndEarnSection />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-wallet-snapshot"
          scrollY={scrollY}
          height={200}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={200} />}>
              <WalletSnapshotCard />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-loyalty-hub"
          scrollY={scrollY}
          height={300}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={300} />}>
              <LoyaltyRewardsHubCard />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-feature-try"
          scrollY={scrollY}
          height={250}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={250} />}>
              <FeatureTryCards />
            </Suspense>
          )}
        />
        <LazySection
          sectionId="cat-social-proof"
          scrollY={scrollY}
          height={250}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={250} />}>
              <SocialProofSection />
            </Suspense>
          )}
        />

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 7 — Student Sections (segment-gated)
            ════════════════════════════════════════════════════════════════════ */}
        {isStudentUser && (
          <>
            <SectionGroupHeader title="Student Picks" subtitle="Budget deals, campus offers & entertainment" />
            <LazySection
              sectionId="cat-campus-strip"
              scrollY={scrollY}
              height={240}
              renderSection={() => <CampusHotDealsStrip />}
            />
            <LazySection
              sectionId="cat-student-food"
              scrollY={scrollY}
              height={380}
              renderSection={() => <StudentBudgetFoodGrid />}
            />
            <LazySection
              sectionId="cat-student-entertainment"
              scrollY={scrollY}
              height={280}
              renderSection={() => <StudentEntertainmentSection />}
            />
            <LazySection
              sectionId="cat-student-utility"
              scrollY={scrollY}
              height={320}
              renderSection={() => <StudentUtilityDealsSection />}
            />
            <LazySection
              sectionId="cat-student-prepaid"
              scrollY={scrollY}
              height={220}
              renderSection={() => <StudentMicroPrepaidPacks />}
            />
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 8 — Employee Sections (segment-gated)
            ════════════════════════════════════════════════════════════════════ */}
        {isEmployeeCorporate && (
          <>
            <SectionGroupHeader title="Corporate Perks" subtitle="Lunch, wellness, utilities and after-work deals" />
            {_isLunchWindow && (
              <LazySection
                sectionId="cat-employee-lunch"
                scrollY={scrollY}
                height={340}
                renderSection={() => <EmployeeLunchDealsSection />}
              />
            )}
            {_isAfterWorkWindow && !_isLunchWindow && (
              <LazySection
                sectionId="cat-employee-afterwork"
                scrollY={scrollY}
                height={360}
                renderSection={() => <EmployeeAfterWorkSection />}
              />
            )}
            {!_isLunchWindow && !_isAfterWorkWindow && (
              <LazySection
                sectionId="cat-employee-lunch-preview"
                scrollY={scrollY}
                height={340}
                renderSection={() => <EmployeeLunchDealsSection />}
              />
            )}
            <LazySection
              sectionId="cat-employee-wellness"
              scrollY={scrollY}
              height={380}
              renderSection={() => <EmployeeWellnessBookingSection />}
            />
            <LazySection
              sectionId="cat-employee-value-packs"
              scrollY={scrollY}
              height={480}
              renderSection={() => <EmployeeValuePacksSection />}
            />
            <LazySection
              sectionId="cat-employee-utility"
              scrollY={scrollY}
              height={380}
              renderSection={() => <EmployeeUtilityServicesSection />}
            />
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 9 — Misc
            ════════════════════════════════════════════════════════════════════ */}
        <LazySection
          sectionId="cat-promo-banner"
          scrollY={scrollY}
          height={200}
          renderSection={() => <PromoBanner />}
        />
        <LazySection
          sectionId="cat-globe-banner"
          scrollY={scrollY}
          height={200}
          renderSection={() => <GlobeBanner />}
        />
        <LazySection
          sectionId="cat-new-on-rez"
          scrollY={scrollY}
          height={300}
          renderSection={() => <NewOnRezSection />}
        />
        <LazySection
          sectionId="cat-how-rez-works"
          scrollY={scrollY}
          height={200}
          renderSection={() => <HowRezWorksCard />}
        />
        <LazySection
          sectionId="cat-recently-viewed"
          scrollY={scrollY}
          height={250}
          renderSection={() => (
            <Suspense fallback={<SuspensePlaceholder height={250} />}>
              <RecentlyViewedSection items={[]} isLoading={false} maxItems={10} />
            </Suspense>
          )}
        />

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: Shadows.md.shadowColor,
        shadowOffset: Shadows.md.shadowOffset,
        shadowOpacity: Shadows.md.shadowOpacity,
        shadowRadius: Shadows.md.shadowRadius,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.bodyLarge.fontSize - 1,
    color: colors.text.primary,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.sm,
  },
  // Category grid styles
  sectionContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  itemCard: {
    width: ITEM_WIDTH - Spacing.md,
    height: ITEM_WIDTH - Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  itemImage: {
    width: '85%',
    height: '85%',
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  itemName: {
    ...Typography.caption,
    color: Colors.gray[700],
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
});

export default withErrorBoundary(CategoriesScreen, '(tabs)Categories');
