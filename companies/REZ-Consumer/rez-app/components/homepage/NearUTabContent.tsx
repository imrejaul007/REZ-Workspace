// @ts-nocheck
/**
 * Near-U Tab Content
 *
 * Rebuilt to match the 24-section order from the developer handoff (Section 10).
 * Only Near-U / persona-specific sections are here; category verticals and
 * discovery sections have moved to the categories page.
 *
 * Section order:
 *  1.  TimeAwareContextPill   (Near U only)
 *  2.  DailyCheckInStrip      (Near U only)
 *  3.  CampusLeaderboardTeaser (Student only)
 *  4.  VisitStreakCard         (Near U only)
 *  5.  TryBeforeYouBuyCard    (Near U only)
 *  6.  NearbyOffersCarousel   (Near U only) — with urgency tags
 *  7.  CampusHotDealsStrip    (Student only)
 *  8.  StudentBudgetFoodGrid  (Student only)
 *  9.  StudentEntertainmentSection (Student only)
 *  10. StudentUtilityDealsSection  (Student only)
 *  11. StudentMicroPrepaidPacks    (Student only)
 *  12. EmployeeLunchDealsSection   (Employee only, 11-14h)
 *  13. EmployeeAfterWorkSection    (Employee only, 17h+)
 *  14. EmployeeWellnessBookingSection (Employee only)
 *  15. EmployeeValuePacksSection   (Employee only)
 *  16. StoriesRow / What's New     → moved to index.tsx (was duplicating)
 *  17. PersonalizedHeroBanner      → moved to index.tsx (was duplicating)
 *  18. StreakFireIcon + RezScoreCard → moved to index.tsx (was duplicating)
 *  19. Savings Strip               (Always) — compact single-line, wired with thisMonthSaved/totalSaved
 *  20. QuickReorderSection         (featureLevel >= 3)
 *  21. BonusZoneHighlight + FlashDealCountdown (Always)
 *  22. TrendingNearYou             (Always)
 *  23. EarnRezCoinsSection + PlayAndEarnSectionV2 (Always)
 *  24. GlobeBanner                 (Always)
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

import LazySection from '@/components/homepage/LazySection';
// HomeSavingsSummaryCard replaced by compact inline savings strip below
import CategoryQuickAccess from '@/components/homepage/CategoryQuickAccess';
import EarnRezCoinsSection from '@/components/homepage/EarnRezCoinsSection';
import BonusZoneHighlight from '@/components/homepage/BonusZoneHighlight';
import GlobeBanner from '@/components/homepage/GlobeBanner';
import PlayAndEarnSectionV2 from '@/components/homepage/PlayAndEarnSectionV2';
import QuickReorderSection from '@/components/homepage/QuickReorderSection';

import TrendingNearYou from '@/components/homepage/TrendingNearYou';

// Student-specific sections
import CampusHotDealsStrip from '@/components/homepage/sections/CampusHotDealsStrip';
import StudentBudgetFoodGrid from '@/components/homepage/sections/StudentBudgetFoodGrid';
import StudentEntertainmentSection from '@/components/homepage/sections/StudentEntertainmentSection';
import StudentUtilityDealsSection from '@/components/homepage/sections/StudentUtilityDealsSection';
import StudentMicroPrepaidPacks from '@/components/homepage/sections/StudentMicroPrepaidPacks';

// Employee-specific sections
import EmployeeLunchDealsSection from '@/components/homepage/sections/EmployeeLunchDealsSection';
import EmployeeAfterWorkSection from '@/components/homepage/sections/EmployeeAfterWorkSection';
import EmployeeWellnessBookingSection from '@/components/homepage/sections/EmployeeWellnessBookingSection';
import EmployeeValuePacksSection from '@/components/homepage/sections/EmployeeValuePacksSection';

// New components created by Agent 1 — will be at these paths once generated
import TimeAwareContextPill from '@/components/homepage/TimeAwareContextPill';
import DailyCheckInStrip from '@/components/homepage/DailyCheckInStrip';
import CampusLeaderboardTeaser from '@/components/homepage/CampusLeaderboardTeaser';
import VisitStreakCard from '@/components/homepage/VisitStreakCard';
import TryBeforeYouBuyCard from '@/components/homepage/TryBeforeYouBuyCard';
import NearbyOffersCarousel from '@/components/discovery/NearbyOffersCarousel';
// StoriesRow, PersonalizedHeroBanner, RezScoreCard removed — rendered by index.tsx to avoid duplicates

import PersonaDetectionOnboarding from '@/components/homepage/PersonaDetectionOnboarding';
import MicroMomentDecisionCard from '@/components/homepage/MicroMomentDecisionCard';
import StreakToDealConnector from '@/components/homepage/StreakToDealConnector';
import CoinExpiryUrgencyBanner from '@/components/homepage/CoinExpiryUrgencyBanner';
import type { TimeAwarePersona } from '@/components/homepage/TimeAwareContextPill';

import { useHomePersona } from '@/hooks/useHomePersona';
import { useWalletStore } from '@/stores/walletStore';
import { useGamificationStore, GamificationStoreState } from '@/stores/gamificationStore';
import { useCheckinStatus } from '@/hooks/useCheckinStatus';
import { useVisitStreak } from '@/hooks/useVisitStreak';
import { useLiveContext } from '@/hooks/queries/useLiveContext';
import { useNearbyOffers } from '@/hooks/queries/useNearbyOffers';

// ─── Props ────────────────────────────────────────────────────────────────────

interface NearUTabContentProps {
  state;
  actions;
  handleItemPress: (sectionId: string, item) => void;
  handleAddToCart: (item) => void;
  voucherCount: number;
  userPoints: number;
  newOffersCount: number;
  recentlyViewedItems: unknown[];
  isLoadingRecentlyViewed: boolean;
  loyaltyHub;
  featuredLockProduct;
  trendingService;
  isLoyaltySectionLoading: boolean;
  scrollY: SharedValue<number>;
  totalSaved?: number;
  thisMonthSaved?: number;
  currencySymbol?: string;
  featureLevel?: number;
  hasCompletedFirstOrder?: boolean;
  isAreaServiceable?: boolean;
  areaName?: string;
  onSwitchToMall?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const NearUTabContent: React.FC<NearUTabContentProps> = ({
  state,
  actions,
  handleItemPress,
  handleAddToCart,
  voucherCount,
  userPoints,
  newOffersCount,
  recentlyViewedItems,
  isLoadingRecentlyViewed,
  loyaltyHub,
  featuredLockProduct,
  trendingService,
  isLoyaltySectionLoading,
  scrollY,
  totalSaved,
  thisMonthSaved,
  currencySymbol,
  featureLevel = 1,
  hasCompletedFirstOrder = false,
  isAreaServiceable = true,
  areaName,
  onSwitchToMall,
}) => {
  const router = useRouter();
  const persona = useHomePersona();

  // Derive persona flags from the hook
  const isStudent = persona.id === 'student';
  const isEmployee = persona.id === 'corporate';

  // Time-aware flags for employee sections
  const _now = new Date();
  const _currentHour = _now.getHours();
  const _currentDay = _now.getDay(); // 0 = Sunday, 6 = Saturday
  const _isWeekend = _currentDay === 0 || _currentDay === 6;
  const _isLunchWindow = _currentHour >= 11 && _currentHour < 14;
  const _isAfterWorkWindow = _isWeekend || _currentHour >= 17;

  // Wallet data for unlockAmount (used by other sections)
  const walletData = useWalletStore();
  const unlockAmount = (walletData as unknown)?.unlockAmount ?? (walletData as unknown)?.lockedBalance ?? undefined;

  // Gamification — streak count for StreakToDealConnector
  const dailyStreak = useGamificationStore((s: GamificationStoreState) => s.state.dailyStreak ?? 0);

  // API-backed check-in status and visit streak
  const { data: checkinStatus } = useCheckinStatus();
  const { data: visitStreak } = useVisitStreak();

  // Live context (nearby offer count, time slot) for TimeAwareContextPill
  const { data: liveCtx } = useLiveContext();

  // Real nearby offers for NearbyOffersCarousel — falls back to empty (carousel hides itself)
  const { data: nearbyOffers } = useNearbyOffers();

  // Map homePersona id → TimeAwarePersona for MicroMomentDecisionCard
  const microMomentPersona: TimeAwarePersona =
    persona.id === 'student'   ? 'student'  :
    persona.id === 'corporate' ? 'employee' : 'general';

  // Promo coin expiry — derived from coins of type 'promo' in wallet
  const promoCoinData = React.useMemo(() => {
    const coins = walletData?.walletData?.coins ?? [];
    const promoCoins = coins.filter((c) => c.type === 'promo' && c.amount > 0);
    if (promoCoins.length === 0) return { expiringCount: 0, daysLeft: 99 };
    const totalPromo = promoCoins.reduce((sum: number, c) => sum + c.amount, 0);
    // Find earliest expiry
    const now = new Date();
    const earliest = promoCoins
      .map((c) => c.expiryDate ? new Date(c.expiryDate) : null)
      .filter(Boolean)
      .sort((a: Date | null, b: Date | null) => (a?.getTime() ?? 0) - (b?.getTime() ?? 0))[0];
    if (!earliest) return { expiringCount: 0, daysLeft: 99 };
    const msLeft = earliest.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)));
    return { expiringCount: totalPromo, daysLeft };
  }, [walletData?.walletData?.coins]);

  // Area not-serviceable dismissible banner
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);

  // Safety-net: if something inside the tab throws during render, show a
  // graceful fallback instead of crashing the whole screen.
  if (renderError) {
    return (
      <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#F5F5F0' }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
          Near-U content couldn't load. Please refresh.
        </Text>
      </View>
    );
  }

  try {
  return (
    <>
      {/* Coming-soon banner — shown when user is outside serviceable area */}
      {!isAreaServiceable && !bannerDismissed && (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 0,
          padding: 14,
          marginHorizontal: 0,
          marginTop: 0,
          marginBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderBottomWidth: 1,
          borderColor: 'rgba(0,0,0,0.06)',
        }}>
          <Ionicons name="location-outline" size={22} color="#1a3a52" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1a1a1a' }}>
              Near U is coming soon{areaName ? ` in ${areaName}` : ' in your area'}
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
              Meanwhile, shop from top brands across India on REZ Mall.
            </Text>
          </View>
          {onSwitchToMall && (
            <Pressable
              onPress={onSwitchToMall}
              style={{
                backgroundColor: '#FFC857',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
              android_ripple={{ color: 'rgba(0,0,0,0.2)', borderless: false }}
              accessibilityRole="button"
              accessibilityLabel="Switch to REZ Mall"
            >
              <Text style={{ color: '#1a3a52', fontSize: 12, fontWeight: '700' }}>Mall</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setBannerDismissed(true)}
            style={{ padding: 4 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss banner"
            hitSlop={8}
          >
            <Ionicons name="close" size={16} color="#9CA3AF" />
          </Pressable>
        </View>
      )}

      {/* ── P0 New: PersonaDetectionOnboarding (first-open, statedIdentity=null) ── */}
      <PersonaDetectionOnboarding />

      {/* ── P0 New: MicroMomentDecisionCard — "where should I go right now?" ── */}
      <LazySection sectionId="micro-moment-decision" scrollY={scrollY} height={200}
        renderSection={() => {
          try { return <MicroMomentDecisionCard persona={microMomentPersona} />; }
          catch { return null; }
        }} />

      {/* ── P1 New: CoinExpiryUrgencyBanner (loss-aversion — promo coins expiring) ── */}
      {promoCoinData.expiringCount > 0 && promoCoinData.daysLeft <= 2 && (
        <CoinExpiryUrgencyBanner
          expiringCount={promoCoinData.expiringCount}
          daysLeft={promoCoinData.daysLeft}
          onPress={() => router.push('/wallet-screen' as unknown)}
        />
      )}

      {/* ── Category Quick Access Grid (Always) ─────────────────────────── */}
      <CategoryQuickAccess />

      {/* ── Section 1: TimeAwareContextPill (Near U only) ──────────────────── */}
      <LazySection sectionId="time-aware-context-pill" scrollY={scrollY} height={56}
        renderSection={() => {
          try {
            return (
              <TimeAwareContextPill
                persona={isStudent ? 'student' : isEmployee ? 'employee' : 'general'}
                nearbyOfferCount={liveCtx?.nearbyOfferCount}
              />
            );
          }
          catch { return null; }
        }} />

      {/* ── Section 2: DailyCheckInStrip (Near U only) ─────────────────────── */}
      <LazySection sectionId="daily-check-in-strip" scrollY={scrollY} height={80}
        renderSection={() => {
          try { return <DailyCheckInStrip isClaimed={checkinStatus?.checkedInToday ?? false} />; }
          catch { return null; }
        }} />

      {/* ── P1 New: StreakToDealConnector (streak ≥ 3 → today's best nearby deal) ── */}
      <LazySection sectionId="streak-to-deal" scrollY={scrollY} height={120}
        renderSection={() => {
          try { return <StreakToDealConnector streakCount={dailyStreak} />; }
          catch { return null; }
        }} />

      {/* ── Section 3: NearbyOffersCarousel (Near U only) — with urgency tags ─ */}
      <LazySection sectionId="nearby-offers-carousel" scrollY={scrollY} height={240}
        renderSection={() => (
          <NearbyOffersCarousel
            offers={nearbyOffers ?? []}
            onOfferPress={() => {}}
            onSeeAllPress={() => router.push('/near-u/map' as unknown)}
            showUrgencyTags
          />
        )} />

      {/* ── Section 4: CampusLeaderboardTeaser (Student only) ──────────────── */}
      {isStudent && (
        <LazySection sectionId="campus-leaderboard-teaser" scrollY={scrollY} height={160}
          renderSection={() => <CampusLeaderboardTeaser />} />
      )}

      {/* ── Section 4: VisitStreakCard (Near U only) ────────────────────────── */}
      <LazySection sectionId="visit-streak-card" scrollY={scrollY} height={120}
        renderSection={() => {
          try {
            return (
              <VisitStreakCard
                currentVisits={visitStreak?.totalVisits ?? 0}
                totalRequired={visitStreak?.nextMilestone?.totalRequired ?? 7}
                rewardAmount={visitStreak?.nextMilestone?.reward ?? 200}
              />
            );
          }
          catch { return null; }
        }} />

      {/* ── Section 5: TryBeforeYouBuyCard (Near U only) ───────────────────── */}
      <LazySection sectionId="try-before-you-buy" scrollY={scrollY} height={180}
        renderSection={() => (
          <TryBeforeYouBuyCard
            onExplore={() => router.push('/try' as unknown)}
            onFeaturedPress={() => router.push('/try' as unknown)}
            onCategoryPress={(category) =>
              router.push(`/try?category=${category}` as unknown)
            }
          />
        )} />

      {/* ── Section 7-11: Student persona sections ─────────────────────────── */}
      {isStudent && (
        <>
          {/* Section 7: CampusHotDealsStrip */}
          <LazySection sectionId="campus-hot-deals" scrollY={scrollY} height={240}
            renderSection={() => <CampusHotDealsStrip />} />

          {/* Section 8: StudentBudgetFoodGrid */}
          <LazySection sectionId="student-budget-food" scrollY={scrollY} height={380}
            renderSection={() => <StudentBudgetFoodGrid />} />

          {/* Section 9: StudentEntertainmentSection */}
          <LazySection sectionId="student-entertainment" scrollY={scrollY} height={280}
            renderSection={() => <StudentEntertainmentSection />} />

          {/* Section 10: StudentUtilityDealsSection */}
          <LazySection sectionId="student-utility-deals" scrollY={scrollY} height={320}
            renderSection={() => <StudentUtilityDealsSection />} />

          {/* Section 11: StudentMicroPrepaidPacks */}
          <LazySection sectionId="student-micro-packs" scrollY={scrollY} height={220}
            renderSection={() => <StudentMicroPrepaidPacks />} />
        </>
      )}

      {/* ── Section 12-15: Employee persona sections ───────────────────────── */}
      {isEmployee && (
        <>
          {/* Section 12: EmployeeLunchDealsSection (11-14h) */}
          {_isLunchWindow && (
            <LazySection sectionId="employee-lunch-deals" scrollY={scrollY} height={340}
              renderSection={() => <EmployeeLunchDealsSection />} />
          )}

          {/* Section 13: EmployeeAfterWorkSection (17h+) */}
          {_isAfterWorkWindow && !_isLunchWindow && (
            <LazySection sectionId="employee-after-work" scrollY={scrollY} height={360}
              renderSection={() => <EmployeeAfterWorkSection />} />
          )}

          {/* Outside both windows — show lunch section as preview */}
          {!_isLunchWindow && !_isAfterWorkWindow && (
            <LazySection sectionId="employee-lunch-preview" scrollY={scrollY} height={340}
              renderSection={() => <EmployeeLunchDealsSection />} />
          )}

          {/* Section 14: EmployeeWellnessBookingSection */}
          <LazySection sectionId="employee-wellness-booking" scrollY={scrollY} height={380}
            renderSection={() => <EmployeeWellnessBookingSection />} />

          {/* Section 15: EmployeeValuePacksSection */}
          <LazySection sectionId="employee-value-packs" scrollY={scrollY} height={480}
            renderSection={() => <EmployeeValuePacksSection />} />
        </>
      )}

      {/* ── Section 19: Savings Strip (Always) — compact single-line version ── */}
      {/* NOTE: StoriesRow (16), PersonalizedHeroBanner (17), RezScoreCard (18)
          are rendered by index.tsx above the content area to avoid duplication */}
      <Pressable
        style={savingsStrip.wrapper}
        onPress={() => router.push('/wallet-screen')}
        accessibilityRole="button"
        accessibilityLabel={`You've saved ${currencySymbol ?? '₹'}${(thisMonthSaved ?? 0).toLocaleString()} this month`}
        accessibilityHint="Tap to view your wallet and savings history"
      >
        <Text style={savingsStrip.emoji}>💰</Text>
        <Text style={savingsStrip.text} numberOfLines={1}>
          You've saved{' '}
          <Text style={savingsStrip.amount}>
            {currencySymbol ?? '₹'}{((thisMonthSaved ?? 0) > 0 ? (thisMonthSaved ?? 0) : totalSaved ?? 0).toLocaleString()}
          </Text>
          {' '}this month
        </Text>
        <Text style={savingsStrip.cta}>View →</Text>
      </Pressable>

      {/* ── Section 20: QuickReorderSection (featureLevel >= 3) ────────────── */}
      {(featureLevel >= 3 || hasCompletedFirstOrder) && (
        <QuickReorderSection />
      )}

      {/* ── Section 21: BonusZoneHighlight (Always) ───── */}
      <LazySection sectionId="bonus-zone" scrollY={scrollY} height={260}
        renderSection={() => <BonusZoneHighlight />} />

      {/* ── Section 22: TrendingNearYou (Always) ────────────────────────────── */}
      <LazySection sectionId="trending-near-you" scrollY={scrollY} height={300}
        renderSection={() => <TrendingNearYou />} />

      {/* ── Section 23: EarnRezCoinsSection + PlayAndEarnSectionV2 (Always) ── */}
      <EarnRezCoinsSection />
      {featureLevel >= 5 && (
        <LazySection sectionId="play-and-earn" scrollY={scrollY} height={250}
          renderSection={() => <PlayAndEarnSectionV2 />} />
      )}

      {/* ── Section 24: GlobeBanner (Always) ────────────────────────────────── */}
      <LazySection sectionId="globe-banner" scrollY={scrollY} height={200}
        renderSection={() => <GlobeBanner />} />
    </>
  );
  } catch (e) {
    // Schedule state update outside the render cycle to avoid React warnings
    setTimeout(() => setRenderError(e instanceof Error ? e : new Error(String(e))), 0);
    return null;
  }
};

// ── Savings strip styles (CRED Light) ─────────────────────────────────────
const savingsStrip = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  emoji: {
    fontSize: 15,
    lineHeight: 18,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#1a1a1a',
  },
  amount: {
    fontWeight: '800',
    color: '#1a3a52',
  },
  cta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a3a52',
  },
});

export default React.memo(NearUTabContent);
