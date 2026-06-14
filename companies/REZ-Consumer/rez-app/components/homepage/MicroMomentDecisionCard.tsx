// @ts-nocheck
/**
 * MicroMomentDecisionCard
 *
 * The #1 habit-loop component. Answers "where should I go right now?" at the
 * top of the home screen — before savings, before gamification.
 *
 * - Reads live nearby stores from nearbyEarnApi
 * - Time-slot-aware header (morning / lunch / evening / night)
 * - Persona-aware copy (student / employee / general)
 * - Shows live count + top 3 stores + single CTA
 * - Color accent changes by time slot
 *
 * Design: white card, colored left border, bold live count, mustard CTA.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocationStore } from '@/stores/locationStore';
import type { LocationContextType } from '@/types/location.types';
import nearbyEarnApi, { NearbyStore } from '@/services/nearbyEarnApi';
import type { TimeAwarePersona } from '@/components/homepage/TimeAwareContextPill';

// ─── Brand colours ────────────────────────────────────────────────────────────
const NAVY    = '#1a3a52';
const MUSTARD = '#FFC857';
const BORDER  = '#E2E8F0';
const MUTED   = '#94A3B8';
const BODY    = '#475569';

// ─── Time slot colours ────────────────────────────────────────────────────────
const SLOT_THEME = {
  morning: { accent: '#059669', bg: '#F0FDF4', border: '#BBF7D0', label: 'Morning deals' },
  lunch:   { accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Lunch deals'   },
  evening: { accent: '#1a3a52', bg: '#EDF3F8', border: '#C8D8E4', label: 'Evening deals' },
  night:   { accent: '#1a3a52', bg: '#EDF3F8', border: '#C8D8E4', label: 'Night deals'   },
} as const;

type TimeSlot = keyof typeof SLOT_THEME;

// ─── Copy map ─────────────────────────────────────────────────────────────────
const COPY: Record<TimeAwarePersona, Record<TimeSlot, { headline: string; sub: string }>> = {
  student: {
    morning: { headline: 'Morning cashback deals near campus', sub: 'Earn cashback on chai, breakfast & quick needs' },
    lunch:   { headline: 'Budget lunch cashback near campus',  sub: 'Top combos from ₹79 · cashback on every order' },
    evening: { headline: 'Cashback on hangouts near campus',   sub: 'Earn at cafés, gaming spots & chill places' },
    night:   { headline: 'Late-night cashback near campus',    sub: 'Open now · earn cashback on snacks & food' },
  },
  employee: {
    morning: { headline: 'Cashback on breakfast near office',  sub: 'Earn on coffee & breakfast · 3-min walk' },
    lunch:   { headline: 'Cashback lunch near office',         sub: 'Earn on every meal · express slots filling' },
    evening: { headline: 'After-work cashback deals',          sub: 'Earn at grooming, gym & dining spots' },
    night:   { headline: 'Weekend cashback deals near you',    sub: 'Earn on dining, home services & more' },
  },
  general: {
    morning: { headline: 'Morning cashback deals near you',    sub: 'Earn cashback from your first visit today' },
    lunch:   { headline: 'Lunch cashback deals near you',      sub: 'Best cashback options within 750m' },
    evening: { headline: 'Evening cashback deals near you',    sub: 'Earn on dining, grooming & more tonight' },
    night:   { headline: 'Cashback deals open now near you',   sub: 'Earn cashback tonight at stores near you' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTimeSlot(): TimeSlot {
  const h = new Date().getHours();
  if (h >= 5  && h <= 11) return 'morning';
  if (h >= 12 && h <= 14) return 'lunch';
  if (h >= 17 && h <= 21) return 'evening';
  return 'night';
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatSaving(store: NearbyStore): string {
  if (store.totalCashbackPercent > 0) return `${store.totalCashbackPercent}% back`;
  const opp = store.earningOpportunities?.[0];
  if (opp) return `+${opp.value} RC`;
  return 'Earn RC';
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MicroMomentDecisionCardProps {
  persona?: TimeAwarePersona;
  /** Override current hour — useful for testing */
  overrideHour?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
const MicroMomentDecisionCard: React.FC<MicroMomentDecisionCardProps> = ({
  persona = 'general',
  overrideHour,
}) => {
  const router = useRouter();
  const locationState = useLocationStore((s: LocationContextType) => s.state);
  const coords = locationState.currentLocation?.coordinates;

  const [stores, setStores]       = useState<NearbyStore[]>([]);
  // Start as loading only if we already have coords — prevents a flash when location is unknown
  const [loading, setLoading]     = useState(() => !!(coords?.latitude && coords?.longitude));
  const [fetchedAt, setFetchedAt] = useState(0);

  const timeSlot = overrideHour != null
    ? (['morning','lunch','evening','night'] as TimeSlot[])[
        overrideHour >= 5 && overrideHour <= 11 ? 0
        : overrideHour >= 12 && overrideHour <= 14 ? 1
        : overrideHour >= 17 && overrideHour <= 21 ? 2 : 3
      ]
    : getTimeSlot();

  const theme = SLOT_THEME[timeSlot];
  const copy  = COPY[persona]?.[timeSlot] ?? COPY.general[timeSlot];

  const fetchNearby = useCallback(async () => {
    if (!coords?.latitude || !coords?.longitude) {
      setLoading(false);
      return;
    }
    // Deduplicate: don't refetch within 5 minutes
    if (Date.now() - fetchedAt < 5 * 60_000 && stores.length > 0) return;

    setLoading(true);
    try {
      const result = await nearbyEarnApi.getStores({
        lat: coords.latitude,
        lng: coords.longitude,
        radius: 0.75,  // 750m radius — hyperlocal
        limit: 5,
      });
      if (result.success && result.data) {
        setStores((result.data as unknown).slice(0, 5));
        setFetchedAt(Date.now());
      }
    } catch (_) {
      // Fail silently — card hides when count = 0
    } finally {
      setLoading(false);
    }
  }, [coords?.latitude, coords?.longitude, fetchedAt, stores.length]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  // Don't render if no location or no stores found (and not loading)
  if (!coords && !loading) return null;
  if (!loading && stores.length === 0) return null;

  const top3 = stores.slice(0, 3);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderLeftColor: theme.accent }, pressed && { opacity: 0.92 }]}
      onPress={() => router.push('/explore' as unknown)}
      accessibilityRole="button"
      accessibilityLabel={`${copy.headline}. ${stores.length} options nearby.`}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.slotBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={[styles.slotDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.slotLabel, { color: theme.accent }]}>{theme.label}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={MUTED} />
        ) : (
          <Text style={styles.countBadge}>{stores.length} nearby</Text>
        )}
      </View>

      {/* Headline */}
      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.sub}>{copy.sub}</Text>

      {/* Top 3 store chips */}
      {top3.length > 0 && (
        <View style={styles.storeRow}>
          {top3.map((store) => (
            <View key={store._id} style={styles.storeChip}>
              <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
              <Text style={styles.storeSave}>{formatSaving(store)}</Text>
              <Text style={styles.storeDist}>{formatDistance(store.distance)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA row */}
      <View style={styles.ctaRow}>
        <Pressable
          style={styles.ctaBtn}
          onPress={() => router.push('/explore' as unknown)}
          accessibilityRole="button"
          accessibilityLabel={`See all ${stores.length} deals`}
        >
          <Text style={styles.ctaText}>See all {stores.length} cashback deals</Text>
          <Ionicons name="arrow-forward" size={13} color={NAVY} />
        </Pressable>
        <Text style={styles.ctaHint}>Tap to explore →</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: MUSTARD,  // overridden per time slot
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },

  // ── Text ──
  headline: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 3,
  },
  sub: {
    fontSize: 12,
    color: BODY,
    marginBottom: 12,
    lineHeight: 17,
  },

  // ── Store chips ──
  storeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  storeChip: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    alignItems: 'center',
  },
  storeName: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 2,
    textAlign: 'center',
  },
  storeSave: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 1,
  },
  storeDist: {
    fontSize: 9,
    color: MUTED,
  },

  // ── CTA ──
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MUSTARD,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
  ctaHint: {
    fontSize: 11,
    color: MUTED,
  },
});

export default React.memo(MicroMomentDecisionCard);
