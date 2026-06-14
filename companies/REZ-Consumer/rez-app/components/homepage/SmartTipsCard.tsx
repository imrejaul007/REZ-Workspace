// @ts-nocheck
/**
 * SmartTipsCard
 *
 * Sprint 7 — compact home-feed card.
 * Self-contained: fetches the first result from /api/user/savings/best-nearby,
 * shows store name, cashback %, and expected earning on ₹500 spend.
 * Tapping navigates to /smart-spend.
 * Returns null when data is unavailable.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import apiClient from '@/services/apiClient';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const NAVY = '#0A1628';
const NAVY_LIGHT = '#152540';
const GOLD = '#FFD700';
const WHITE = '#FFFFFF';
const SUCCESS = '#22C55E';
const BORDER = 'rgba(255,215,0,0.2)';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';

// ── Types ────────────────────────────────────────────────────────────────────

interface NearbyStore {
  storeId: string;
  storeName: string;
  cashbackPercent: number;
  expectedSavingPaise: number;
  distanceMetres: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function paise2Rupee(p: number): string {
  return (p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

async function getCoords(): Promise<{ lat: number; lng: number }> {
  try {
    const pos = await Location.getLastKnownPositionAsync();
    if (pos) return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    // fallback
  }
  return { lat: 0, lng: 0 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SmartTipsCard() {
  const router = useRouter();
  const [bestStore, setBestStore] = useState<NearbyStore | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { lat, lng } = await getCoords();
        const res = await apiClient.get<{ data: NearbyStore[] }>(
          `/user/savings/best-nearby?lat=${lat}&lng=${lng}&budgetPaise=50000`,
        );
        if (cancelled) return;
        const arr: NearbyStore[] = (res as unknown)?.data ?? (res as unknown);
        if (Array.isArray(arr) && arr.length > 0) {
          setBestStore(arr[0]);
        }
      } catch {
        // no-op — component stays hidden
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bestStore) return null;

  const savingRupee = paise2Rupee(bestStore.expectedSavingPaise);

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push('/smart-spend' as unknown)}
      accessibilityRole="button"
      accessibilityLabel={`Smart tip: ${bestStore.storeName} offers ${bestStore.cashbackPercent}% cashback`}
    >
      {/* Left: icon */}
      <View style={styles.iconBox}>
        <Ionicons name="flash" size={20} color={GOLD} />
      </View>

      {/* Middle: content */}
      <View style={styles.content}>
        <Text style={styles.label}>Smart Tip</Text>
        <Text style={styles.storeName} numberOfLines={1}>
          {bestStore.storeName}
        </Text>
        <Text style={styles.earning}>Earn up to &#8377;{savingRupee} on &#8377;500 spend</Text>
      </View>

      {/* Right: cashback badge + chevron */}
      <View style={styles.right}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{bestStore.cashbackPercent}%</Text>
          <Text style={styles.badgeSub}>back</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={TEXT_MUTED} style={{ marginTop: 2 }} />
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY_LIGHT,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: GOLD,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  storeName: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
  earning: {
    color: SUCCESS,
    fontSize: 12,
    fontWeight: '600',
  },
  right: {
    alignItems: 'center',
    flexShrink: 0,
    gap: 1,
  },
  badge: {
    alignItems: 'center',
  },
  badgeText: {
    color: GOLD,
    fontSize: 18,
    fontWeight: '900',
  },
  badgeSub: {
    color: TEXT_MUTED,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
