// @ts-nocheck
/**
 * EmployeeAfterWorkSection
 *
 * Time-aware after-work dining and social picks for corporate users.
 * - Visible primarily after 5 PM or on weekends (soft hides otherwise)
 * - Categories: Casual Dining, Rooftop Offers, Happy Hour, Date Night, Weekend Specials
 * - Group booking CTA for 4+ people
 *
 * Section title: "After Work Picks"
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import employeeHomepageApi, { AfterWorkPick } from '@/services/employeeHomepageApi';

// ─── Static fallback data ─────────────────────────────────────────────────────

const STATIC_PICKS: AfterWorkPick[] = [
  {
    id: 'aw1',
    name: 'Skyline Rooftop Bar',
    type: 'rooftop',
    discount: '20% off all drinks',
    distance: '1.2 km',
    groupBookingOffer: 'Extra 10% for 4+ people',
    timing: '5 PM – 12 AM',
    rating: 4.5,
  },
  {
    id: 'aw2',
    name: 'The Casual Corner',
    type: 'casual_dining',
    discount: '15% off meals',
    distance: '0.8 km',
    timing: '6 PM – 11 PM',
    rating: 4.2,
  },
  {
    id: 'aw3',
    name: 'Happy Pint Brewhouse',
    type: 'happy_hour',
    discount: 'Buy 1 Get 1 on beverages',
    distance: '0.5 km',
    groupBookingOffer: 'Book for 6+, save 20% on food',
    timing: '5 PM – 8 PM (Happy Hours)',
    rating: 4.4,
  },
  {
    id: 'aw4',
    name: 'Candlelight Bistro',
    type: 'date_night',
    discount: '25% off set menu',
    distance: '2.1 km',
    timing: '7 PM – 11 PM',
    rating: 4.7,
  },
  {
    id: 'aw5',
    name: 'Weekend Grill House',
    type: 'weekend_special',
    discount: '30% off weekend brunch',
    distance: '1.5 km',
    groupBookingOffer: 'Free dessert for 4+',
    timing: 'Sat–Sun 11 AM – 4 PM',
    rating: 4.3,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAfterWorkTime(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;
  const isEvening = hour >= 17; // 5 PM+
  return isWeekend || isEvening;
}

const TYPE_CONFIG: Record<
  AfterWorkPick['type'],
  { emoji: string; label: string; color: string }
> = {
  casual_dining: { emoji: '🍽️', label: 'Casual Dining', color: '#2A5577' },
  rooftop: { emoji: '🌇', label: 'Rooftop', color: '#1a3a52' },
  happy_hour: { emoji: '🍺', label: 'Happy Hour', color: '#FFC857' },
  date_night: { emoji: '🕯️', label: 'Date Night', color: '#DB2777' },
  weekend_special: { emoji: '🎉', label: 'Weekend Special', color: '#16A34A' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmployeeAfterWorkSection: React.FC = () => {
  const router = useRouter();
  const isMounted = useIsMounted();

  const [picks, setPicks] = useState<AfterWorkPick[]>(STATIC_PICKS);
  const [isLoading, setIsLoading] = useState(false);
  const afterWorkActive = isAfterWorkTime();

  // Fetch live picks
  useEffect(() => {
    let cancelled = false;
    const fetchPicks = async () => {
      try {
        setIsLoading(true);
        const res = await employeeHomepageApi.getAfterWorkPicks(0, 0);
        if (cancelled || !isMounted()) return;
        if (res.success && res.data?.picks?.length) {
          setPicks(res.data.picks);
        }
      } catch {
        // Fall back to static data silently
      } finally {
        if (!cancelled && isMounted()) setIsLoading(false);
      }
    };
    fetchPicks();
    return () => { cancelled = true; };
  }, [isMounted]);

  const handleViewAll = useCallback(() => {
    router.push('/going-out' as unknown);
  }, [router]);

  const handlePickPress = useCallback((pick: AfterWorkPick) => {
    router.push({ pathname: '/store/[id]', params: { id: pick.id } } as unknown);
  }, [router]);

  const handleGroupBooking = useCallback(() => {
    router.push('/group-booking' as unknown);
  }, [router]);

  // Show section even outside after-work hours — just with "coming up" copy
  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>🌆 After Work Picks</Text>
          <Text style={styles.headerSubtitle}>
            {afterWorkActive
              ? 'Great deals to wind down today'
              : 'Plan your evening — bookings open now'}
          </Text>
        </View>
        <Pressable onPress={handleViewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Pressable>
      </View>

      {/* ── Group Booking CTA ── */}
      <Pressable style={styles.groupBookingCta} onPress={handleGroupBooking}>
        <LinearGradient
          colors={['#1a3a52', '#2A5577']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.groupBookingGradient}
        >
          <View style={styles.groupBookingIconWrap}>
            <Text style={{ fontSize: 20 }}>👥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupBookingTitle}>
              Team dinner? Book for 4+ and save extra
            </Text>
            <Text style={styles.groupBookingSubtitle}>
              Exclusive group discounts at 200+ restaurants
            </Text>
          </View>
          <View style={styles.groupArrow}>
            <Ionicons name="chevron-forward" size={18} color={colors.lightMustard} />
          </View>
        </LinearGradient>
      </Pressable>

      {/* ── Pick Cards ── */}
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
          {picks.map((pick) => {
            const config = TYPE_CONFIG[pick.type];
            return (
              <Pressable
                key={pick.id}
                style={styles.card}
                onPress={() => handlePickPress(pick)}
              >
                {/* Colour header strip */}
                <LinearGradient
                  colors={[config.color, config.color + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardHeader}
                >
                  <Text style={styles.cardEmoji}>{config.emoji}</Text>
                  <View style={styles.cardTypePill}>
                    <Text style={styles.cardTypeText}>{config.label}</Text>
                  </View>
                </LinearGradient>

                <View style={styles.cardBody}>
                  {/* Name */}
                  <Text style={styles.cardName} numberOfLines={1}>
                    {pick.name}
                  </Text>

                  {/* Distance + rating */}
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={11} color={colors.neutral[500]} />
                      <Text style={styles.metaText}>{pick.distance}</Text>
                    </View>
                    {pick.rating && (
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={styles.metaText}>{pick.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Discount badge */}
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{pick.discount}</Text>
                  </View>

                  {/* Timing */}
                  <View style={styles.timingRow}>
                    <Ionicons name="time-outline" size={11} color={colors.neutral[400]} />
                    <Text style={styles.timingText} numberOfLines={1}>
                      {pick.timing}
                    </Text>
                  </View>

                  {/* Group booking offer */}
                  {pick.groupBookingOffer && (
                    <View style={styles.groupOfferRow}>
                      <Text style={styles.groupOfferText} numberOfLines={2}>
                        👥 {pick.groupBookingOffer}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
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

  // Group booking CTA
  groupBookingCta: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  groupBookingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  groupBookingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupBookingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  groupBookingSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  groupArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading
  loadingContainer: {
    height: 220,
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
    width: 195,
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
  cardHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTypePill: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingText: {
    fontSize: 11,
    color: colors.neutral[400],
    flex: 1,
  },
  groupOfferRow: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 6,
    marginTop: 2,
  },
  groupOfferText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default React.memo(EmployeeAfterWorkSection);
