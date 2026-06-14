// @ts-nocheck
/**
 * EmployeeLunchDealsSection
 *
 * Time-aware lunch deals shown to verified_employee / corporate persona users.
 * - Active window: 11 AM – 2 PM → shows "Lunch hour!" badge + countdown timer
 * - Outside window: shows "Tomorrow's lunch deals" sub-header
 * - Each card: restaurant name, distance, avg meal price, cashback %, Express badge
 *
 * Section title: "Quick Lunch Near Office"
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import employeeHomepageApi, { LunchDeal } from '@/services/employeeHomepageApi';

// ─── Fallback static data (renders before API resolves) ──────────────────────

const STATIC_DEALS: LunchDeal[] = [
  {
    id: 'l1',
    restaurantName: 'The Office Canteen',
    cuisineType: 'North Indian',
    distance: '0.2 km',
    avgMealPrice: 180,
    cashbackPercent: 12,
    isExpress: true,
    category: 'combo',
    nextSlotLabel: 'Open till 3 PM',
    rating: 4.3,
  },
  {
    id: 'l2',
    restaurantName: 'Spice Route Bistro',
    cuisineType: 'Multi-cuisine',
    distance: '0.5 km',
    avgMealPrice: 250,
    cashbackPercent: 15,
    isExpress: false,
    category: 'buffet',
    nextSlotLabel: 'Lunch Buffet 11–3 PM',
    rating: 4.6,
  },
  {
    id: 'l3',
    restaurantName: 'Wrap & Roll',
    cuisineType: 'Continental',
    distance: '0.3 km',
    avgMealPrice: 140,
    cashbackPercent: 10,
    isExpress: true,
    category: 'express',
    nextSlotLabel: 'Ready in 10 min',
    rating: 4.1,
  },
  {
    id: 'l4',
    restaurantName: 'Meal Prep Co.',
    cuisineType: 'Healthy',
    distance: '0.8 km',
    avgMealPrice: 320,
    cashbackPercent: 18,
    isExpress: false,
    category: 'prepaid',
    nextSlotLabel: 'Pre-order by 10:30 AM',
    rating: 4.7,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLunchWindowState(): {
  isLunchHour: boolean;
  isTomorrow: boolean;
  countdownMinutes: number;
} {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const LUNCH_START = 11;
  const LUNCH_END = 14; // 2 PM

  if (hour >= LUNCH_START && hour < LUNCH_END) {
    const minutesLeft = (LUNCH_END - hour) * 60 - minute;
    return { isLunchHour: true, isTomorrow: false, countdownMinutes: minutesLeft };
  }

  return { isLunchHour: false, isTomorrow: true, countdownMinutes: 0 };
}

function formatCountdown(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m > 0 ? `${m}m` : ''} left`;
  }
  return `${minutes}m left`;
}

const CATEGORY_COLORS: Record<LunchDeal['category'], string> = {
  buffet: '#FFC857',
  combo: '#2A5577',
  express: '#16A34A',
  prepaid: '#1a3a52',
};

const CATEGORY_LABELS: Record<LunchDeal['category'], string> = {
  buffet: 'Lunch Buffet',
  combo: 'Office Combo',
  express: 'Express',
  prepaid: 'Prepaid Pack',
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeLunchDealsSection: React.FC = () => {
  const router = useRouter();
  const isMounted = useIsMounted();

  const [deals, setDeals] = useState<LunchDeal[]>(STATIC_DEALS);
  const [isLoading, setIsLoading] = useState(false);
  const [windowState, setWindowState] = useState(getLunchWindowState);

  // Tick the countdown every minute while lunch window is active
  useEffect(() => {
    const tick = () => {
      const state = getLunchWindowState();
      if (isMounted()) setWindowState(state);
    };
    const intervalId = setInterval(tick, 60_000);
    return () => clearInterval(intervalId);
  }, [isMounted]);

  // Fetch live deals
  useEffect(() => {
    let cancelled = false;
    const fetchDeals = async () => {
      try {
        setIsLoading(true);
        const res = await employeeHomepageApi.getLunchDeals(0, 0);
        if (cancelled || !isMounted()) return;
        if (res.success && res.data?.deals?.length) {
          setDeals(res.data.deals);
        }
      } catch {
        // Silently fall back to static data
      } finally {
        if (!cancelled && isMounted()) setIsLoading(false);
      }
    };
    fetchDeals();
    return () => { cancelled = true; };
  }, [isMounted]);

  const handleViewAll = useCallback(() => {
    router.push('/near-u/food' as unknown);
  }, [router]);

  const handleDealPress = useCallback((deal: LunchDeal) => {
    router.push({ pathname: '/store/[id]', params: { id: deal.id } } as unknown);
  }, [router]);

  const { isLunchHour, isTomorrow, countdownMinutes } = windowState;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🍱 Quick Lunch Near Office</Text>
          <Text style={styles.headerSubtitle}>
            {isLunchHour
              ? 'Order now — deals expiring soon'
              : 'Preview tomorrow\'s best lunch deals'}
          </Text>
        </View>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Pressable>
      </View>

      {/* ── Lunch Hour Badge / Tomorrow Banner ── */}
      {isLunchHour && (
        <LinearGradient
          colors={['#1a3a52', '#2A5577']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.lunchBadge}
        >
          <View style={styles.lunchBadgeIcon}>
            <Text style={{ fontSize: 16 }}>⏱️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lunchBadgeTitle}>Lunch hour is ON!</Text>
            <Text style={styles.lunchBadgeSubtitle}>
              {formatCountdown(countdownMinutes)} to grab these deals
            </Text>
          </View>
          <View style={styles.lunchCountdownPill}>
            <Text style={styles.lunchCountdownText}>
              {formatCountdown(countdownMinutes)}
            </Text>
          </View>
        </LinearGradient>
      )}

      {isTomorrow && (
        <View style={styles.tomorrowBanner}>
          <Ionicons name="calendar-outline" size={16} color={colors.neutral[500]} />
          <Text style={styles.tomorrowText}>
            Tomorrow's lunch deals — pre-order for faster service
          </Text>
        </View>
      )}

      {/* ── Cards Row ── */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.nileBlue} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {deals.map((deal) => (
            <Pressable
              key={deal.id}
              style={styles.card}
              onPress={() => handleDealPress(deal)}
            >
              {/* Category colour bar */}
              <View
                style={[
                  styles.cardCategoryBar,
                  { backgroundColor: CATEGORY_COLORS[deal.category] },
                ]}
              />

              <View style={styles.cardBody}>
                {/* Top row: name + badges */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {deal.restaurantName}
                  </Text>
                  {deal.isExpress && (
                    <View style={styles.expressBadge}>
                      <Text style={styles.expressBadgeText}>⚡ Express</Text>
                    </View>
                  )}
                </View>

                {/* Cuisine + rating */}
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardCuisine}>{deal.cuisineType}</Text>
                  {deal.rating && (
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={10} color="#F59E0B" />
                      <Text style={styles.ratingText}>{deal.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                {/* Distance */}
                <View style={styles.cardDistanceRow}>
                  <Ionicons name="location-outline" size={12} color={colors.neutral[500]} />
                  <Text style={styles.cardDistance}>{deal.distance} away</Text>
                </View>

                {/* Price + cashback */}
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>₹{deal.avgMealPrice} avg</Text>
                  <View style={styles.cashbackBadge}>
                    <Text style={styles.cashbackText}>{deal.cashbackPercent}% back</Text>
                  </View>
                </View>

                {/* Category label + next slot */}
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.categoryLabelPill,
                      { backgroundColor: CATEGORY_COLORS[deal.category] + '22' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryLabelText,
                        { color: CATEGORY_COLORS[deal.category] },
                      ]}
                    >
                      {CATEGORY_LABELS[deal.category]}
                    </Text>
                  </View>
                  {deal.nextSlotLabel && (
                    <Text style={styles.nextSlotText} numberOfLines={1}>
                      {deal.nextSlotLabel}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightMustard,
  },

  // Lunch hour badge
  lunchBadge: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  lunchBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lunchBadgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  lunchBadgeSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  lunchCountdownPill: {
    backgroundColor: colors.lightMustard,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lunchCountdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.nileBlue,
  },

  // Tomorrow banner
  tomorrowBanner: {
    marginHorizontal: 16,
    backgroundColor: colors.tint.slate,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tomorrowText: {
    fontSize: 12,
    color: colors.neutral[500],
    flex: 1,
  },

  // Loading
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },

  // Card
  card: {
    width: 190,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCategoryBar: {
    height: 4,
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
    flex: 1,
    marginRight: 6,
  },
  expressBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expressBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCuisine: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  cardDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardDistance: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nileBlue,
  },
  cashbackBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 4,
  },
  categoryLabelPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  nextSlotText: {
    fontSize: 10,
    color: colors.neutral[500],
    flex: 1,
    textAlign: 'right',
  },
});

export default React.memo(EmployeeLunchDealsSection);
