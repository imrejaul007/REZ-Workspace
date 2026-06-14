// @ts-nocheck
/**
 * CoinExpiryBanner
 *
 * Fetches expiring coins from GET /api/user/coins/expiring?days=7 (with fallback to
 * GET /api/wallet/balance). Shows a dismissible gold banner when coins > 0.
 *
 * Dismissed state is persisted in AsyncStorage for 24 hours so the user isn't
 * nagged every render.
 *
 * Tapping the banner body navigates to /redeem-coins.
 * Returns null if no expiring coins or currently dismissed.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '@/services/apiClient';

// ─── Constants ────────────────────────────────────────────────────────────────

const DISMISS_KEY = 'coin_expiry_banner_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const GOLD_BG = '#FFD700';
const GOLD_BORDER = '#F0C000';
const TEXT_DARK = '#1A1A00';
const TEXT_MUTED = '#5A4A00';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExpiringCoinsData {
  amount: number;
  daysLeft: number;
  expiresAt?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchExpiringCoins(): Promise<ExpiringCoinsData | null> {
  try {
    // Primary: dedicated expiry endpoint
    const res = await apiClient.get<unknown>('/user/coins/expiring?days=7');
    const payload = (res as unknown)?.data ?? res;
    const amount = payload?.amount ?? payload?.expiringCoins ?? payload?.coins ?? 0;
    const daysLeft = payload?.daysLeft ?? payload?.days ?? 7;
    const expiresAt = payload?.expiresAt ?? payload?.expiry ?? undefined;
    if (typeof amount === 'number' && amount > 0) {
      return { amount, daysLeft, expiresAt };
    }
  } catch {
    // Fall through to wallet balance endpoint
  }

  try {
    // Fallback: wallet balance which may include expiring coin info
    const res = await apiClient.get<unknown>('/wallet/balance');
    const payload = (res as unknown)?.data ?? res;
    const amount =
      payload?.expiringCoins ?? payload?.promoCoinBalance ?? payload?.expiringAmount ?? 0;
    const daysLeft = payload?.promoCoinDaysLeft ?? payload?.expiringDaysLeft ?? 7;
    const expiresAt = payload?.expiresAt ?? payload?.promoCoinExpiry ?? undefined;
    if (typeof amount === 'number' && amount > 0) {
      return { amount, daysLeft, expiresAt };
    }
  } catch {
    // Silently ignore
  }

  return null;
}

// ─── Dismiss helpers ──────────────────────────────────────────────────────────

async function isDismissed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    return Date.now() < until;
  } catch {
    return false;
  }
}

async function saveDismiss(): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
  } catch {
    // Silently ignore
  }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatExpiry(data: ExpiringCoinsData): string {
  if (data.expiresAt) {
    try {
      const d = new Date(data.expiresAt);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      // Fall through
    }
  }
  const d = new Date();
  d.setDate(d.getDate() + data.daysLeft);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoinExpiryBanner() {
  const router = useRouter();
  const [data, setData] = useState<ExpiringCoinsData | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden until async checks complete

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const alreadyDismissed = await isDismissed();
      if (cancelled) return;
      if (alreadyDismissed) {
        setDismissed(true);
        return;
      }

      const expiring = await fetchExpiringCoins();
      if (cancelled) return;

      if (expiring && expiring.amount > 0) {
        setData(expiring);
        setDismissed(false);
        setVisible(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(async () => {
    setVisible(false);
    setDismissed(true);
    await saveDismiss();
  }, []);

  const handlePress = useCallback(() => {
    router.push('/redeem-coins' as unknown);
  }, [router]);

  if (!visible || dismissed || !data) {
    return null;
  }

  const expiryDateStr = formatExpiry(data);
  const daysText = data.daysLeft === 0
    ? 'today'
    : data.daysLeft === 1
      ? 'tomorrow'
      : `in ${data.daysLeft} days`;

  return (
    <Pressable
      style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${data.amount} coins expire ${daysText}. Tap to use them.`}
      accessibilityHint="Navigates to redeem coins screen"
    >
      {/* Warning icon */}
      <View style={styles.iconBox}>
        <Ionicons name="warning" size={20} color={TEXT_DARK} />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.headline} numberOfLines={1}>
          {data.amount} coins expire {daysText}
        </Text>
        <Text style={styles.subline} numberOfLines={1}>
          Use them before {expiryDateStr}
        </Text>
      </View>

      {/* Dismiss */}
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          handleDismiss();
        }}
        hitSlop={10}
        style={styles.dismissBtn}
        accessibilityRole="button"
        accessibilityLabel="Dismiss coin expiry reminder"
      >
        <Ionicons name="close" size={18} color={TEXT_DARK} />
      </Pressable>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: GOLD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#B8860B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  bannerPressed: {
    opacity: 0.9,
  },
  iconBox: {
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  headline: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 1,
  },
  subline: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  dismissBtn: {
    flexShrink: 0,
    padding: 2,
  },
});
