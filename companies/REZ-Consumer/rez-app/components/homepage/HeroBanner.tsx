// @ts-nocheck
/**
 * HeroBanner — Bold, time-aware hero section.
 *
 * Design: full-width Nile Blue gradient, large typography, mustard CTA.
 * Inspired by Zomato/Dineout-style hero panels — clean, premium, zero clutter.
 */

import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@/constants/theme';

// ── Brand tokens ────────────────────────────────────────────────────────────
const NILE_BLUE        = '#1a3a52';
const NILE_BLUE_MID    = '#1e4463';
const NILE_BLUE_LIGHT  = '#2a5a7c';
const MUSTARD          = '#FFC857';
const MUSTARD_DARK     = '#E6A800';
const WHITE            = '#FFFFFF';
const WHITE_70         = 'rgba(255,255,255,0.70)';
const WHITE_15         = 'rgba(255,255,255,0.15)';

// ── Time-of-day content ─────────────────────────────────────────────────────
interface TimeSlot {
  greeting: string;
  headline: string;
  subline: string;
}

function getTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) {
    return {
      greeting: 'Good Morning! ☀️',
      headline: 'Start Your Day\nWith Savings',
      subline: 'Best breakfast & coffee deals nearby',
    };
  }
  if (hour >= 11 && hour < 14) {
    return {
      greeting: 'Lunch Time! 🍽️',
      headline: 'Nearby Deals\nWaiting For You',
      subline: 'Up to 40% cashback on lunch orders',
    };
  }
  if (hour >= 14 && hour < 20) {
    return {
      greeting: 'Evening Treats! 🌆',
      headline: 'Explore Cashback\nOffers Near You',
      subline: 'Cafes, shopping & wellness deals',
    };
  }
  return {
    greeting: 'Late Night Cravings? 🌙',
    headline: 'Order Now,\nSave More',
    subline: 'Midnight deals from top restaurants',
  };
}

// ── Props ────────────────────────────────────────────────────────────────────
interface HeroBannerProps {
  totalSaved?: number;
  onScanPayPress?: () => void;
  onViewWalletPress?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
function HeroBanner({ onScanPayPress, onViewWalletPress }: HeroBannerProps) {
  const router = useRouter();
  const slot = useMemo(() => getTimeSlot(), []);

  const handleExploreDeals = () => {
    router.push('/offers' as unknown);
  };

  const handleScanPay = () => {
    if (onScanPayPress) {
      onScanPayPress();
    } else {
      router.push('/pay-in-store/' as unknown);
    }
  };

  return (
    <View style={styles.gradient}>
      {/* No decorative circles — clean flat hero */}

      {/* Greeting pill */}
      <View style={styles.greetingPill}>
        <Text style={styles.greetingText}>{slot.greeting}</Text>
      </View>

      {/* Headline */}
      <Text style={styles.headline}>{slot.headline}</Text>

      {/* Subline */}
      <Text style={styles.subline}>{slot.subline}</Text>

      {/* CTA Row */}
      <View style={styles.ctaRow}>
        {/* Primary CTA — Mustard */}
        <Pressable
          style={({ pressed }) => [styles.ctaPrimary, pressed ? styles.ctaPrimaryPressed : null]}
          onPress={handleExploreDeals}
          accessibilityRole="button"
          accessibilityLabel="Explore deals"
          accessibilityHint="Tap to browse all available cashback deals"
        >
          <Text style={styles.ctaPrimaryText}>Explore Deals →</Text>
        </Pressable>

        {/* Secondary CTA — Scan & Pay */}
        <Pressable
          style={({ pressed }) => [styles.ctaSecondary, pressed && { opacity: 0.75 }]}
          onPress={handleScanPay}
          accessibilityRole="button"
          accessibilityLabel="Scan and pay"
          accessibilityHint="Tap to open QR scanner and pay at a store"
        >
          <Text style={styles.ctaSecondaryText}>Scan & Pay</Text>
        </Pressable>
      </View>

      {/* Bottom trust strip */}
      <View style={styles.trustStrip}>
        <View style={styles.trustDot} />
        <Text style={styles.trustText}>2,400+ stores · Instant cashback · Zero fees</Text>
      </View>
    </View>
  );
}

// ── Styles (CRED Light — one bold dark section) ───────────────────────────────
const styles = StyleSheet.create({
  gradient: {
    // Full-bleed: edge-to-edge Nile Blue — the ONE dark section on the page.
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
    backgroundColor: NILE_BLUE,
    overflow: 'hidden',
  },

  // Greeting pill — subtle white translucent on Nile Blue
  greetingPill: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE_15,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.3,
  },

  // Main headline — large, bold, white
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 10,
  },

  // Subline — softer white
  subline: {
    fontSize: 14,
    fontWeight: '400',
    color: WHITE_70,
    lineHeight: 20,
    marginBottom: 24,
  },

  // CTA Row
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  // Primary mustard CTA — the only mustard on the hero
  ctaPrimary: {
    flex: 1,
    backgroundColor: MUSTARD,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryPressed: {
    backgroundColor: MUSTARD_DARK,
  },
  ctaPrimaryText: {
    fontSize: 14,
    fontWeight: '800',
    color: NILE_BLUE,
    letterSpacing: 0.3,
  },

  // Secondary ghost CTA — white outline on Nile Blue
  ctaSecondary: {
    flex: 1,
    backgroundColor: WHITE_15,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: WHITE,
    letterSpacing: 0.1,
  },

  // Bottom trust strip
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  trustDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
    color: WHITE_70,
    letterSpacing: 0.2,
  },
});

export default memo(HeroBanner);
