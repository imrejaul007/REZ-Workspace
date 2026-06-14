// @ts-nocheck
/**
 * StreakToDealConnector
 *
 * Connects the streak counter to a specific action TODAY.
 * Without this, the streak is just a number — with this it becomes
 * a habit trigger ("your streak earns you THIS deal right now").
 *
 * Shows when:  streak >= 3 AND user hasn't redeemed today's streak deal
 * Hides when:  streak < 3 or already redeemed
 *
 * Design: mustard border, warm amber background, single deal with CTA.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import nearbyEarnApi, { NearbyStore } from '@/services/nearbyEarnApi';
import { useLocationStore } from '@/stores/locationStore';
import type { LocationContextType } from '@/types/location.types';

const NAVY    = '#1a3a52';
const MUSTARD = '#FFC857';
const BORDER  = '#E2E8F0';
const BODY    = '#475569';
const MUTED   = '#94A3B8';
const AMBER_BG   = '#FFFBEB';
const AMBER_BORDER = '#FDE68A';

// Key to track if today's streak deal was tapped
const STREAK_DEAL_KEY = 'streak_deal_date';

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "2026-03-28"
}

function getStreakLabel(streak: number): string {
  if (streak >= 30) return `🔥 ${streak}-day streak — legendary reward!`;
  if (streak >= 14) return `⚡ ${streak}-day streak — bonus deal unlocked`;
  if (streak >= 7)  return `✨ ${streak}-day streak — week reward ready`;
  return `🎁 ${streak}-day streak — your deal today`;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface StreakToDealConnectorProps {
  streakCount: number;
}

const StreakToDealConnector: React.FC<StreakToDealConnectorProps> = ({ streakCount }) => {
  const router = useRouter();
  const locationState = useLocationStore((s: LocationContextType) => s.state);
  const coords = locationState.currentLocation?.coordinates;

  const [dealStore, setDealStore] = useState<NearbyStore | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState(false);

  // Don't show for streaks under 3
  const shouldShow = streakCount >= 3;

  useEffect(() => {
    if (!shouldShow) return;

    // Check if already tapped today
    AsyncStorage.getItem(STREAK_DEAL_KEY)
      .then((val) => {
        if (val === todayStr()) {
          setDismissed(true);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow || dismissed || !checked) return;
    if (!coords?.latitude || !coords?.longitude) return;

    // Pick the best nearby store as today's streak reward
    nearbyEarnApi
      .getStores({ lat: coords.latitude, lng: coords.longitude, radius: 1.5, limit: 3 })
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          // Pick store with highest cashback
          const best = res.data.reduce((a, b) =>
            b.totalCashbackPercent > a.totalCashbackPercent ? b : a
          );
          setDealStore(best);
        }
      })
      .catch(() => {});
  }, [shouldShow, dismissed, checked, coords?.latitude, coords?.longitude]);

  const handleRedeem = async () => {
    await AsyncStorage.setItem(STREAK_DEAL_KEY, todayStr()).catch(() => {});
    setDismissed(true);
    router.push('/explore' as unknown);
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem(STREAK_DEAL_KEY, todayStr()).catch(() => {});
    setDismissed(true);
  };

  if (!shouldShow || dismissed || !checked) return null;
  if (!dealStore) return null; // Only show if we have a real store

  return (
    <View style={styles.card}>
      {/* Top row: streak label + dismiss */}
      <View style={styles.topRow}>
        <Text style={styles.streakLabel}>{getStreakLabel(streakCount)}</Text>
        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss streak deal"
        >
          <Ionicons name="close" size={16} color={MUTED} />
        </Pressable>
      </View>

      {/* Deal row */}
      <View style={styles.dealRow}>
        {/* Deal info */}
        <View style={styles.dealInfo}>
          <Text style={styles.dealName} numberOfLines={1}>{dealStore.name}</Text>
          <Text style={styles.dealSub} numberOfLines={1}>
            {dealStore.earningOpportunities?.[0]?.title ??
              (dealStore.totalCashbackPercent > 0
                ? `${dealStore.totalCashbackPercent}% cashback`
                : 'Earn REZ coins here')}
          </Text>
          <View style={styles.streakBonusPill}>
            <Ionicons name="flame" size={11} color={NAVY} />
            <Text style={styles.streakBonusText}>+{Math.min(streakCount, 15)} RC streak bonus</Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.redeemBtn, pressed && { opacity: 0.85 }]}
          onPress={handleRedeem}
          accessibilityRole="button"
          accessibilityLabel={`Redeem streak deal at ${dealStore.name}`}
        >
          <Text style={styles.redeemText}>Use now</Text>
          <Ionicons name="arrow-forward" size={13} color={NAVY} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: AMBER_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AMBER_BORDER,
    borderLeftWidth: 4,
    borderLeftColor: MUSTARD,
    padding: 13,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
    flex: 1,
    marginRight: 8,
  },

  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dealInfo: {
    flex: 1,
  },
  dealName: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 2,
  },
  dealSub: {
    fontSize: 12,
    color: BODY,
    marginBottom: 6,
  },
  streakBonusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MUSTARD,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  streakBonusText: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
  },

  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: MUSTARD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  redeemText: {
    fontSize: 12,
    fontWeight: '700',
    color: NAVY,
  },
});

export default React.memo(StreakToDealConnector);
