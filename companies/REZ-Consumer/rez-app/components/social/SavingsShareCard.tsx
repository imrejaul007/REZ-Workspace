// @ts-nocheck
/**
 * SavingsShareCard
 * Phase 3.1 — Social Proof & Sharing
 *
 * A beautiful shareable card that can be captured as an image.
 * Shows: monthly savings, REZ Score, streak days, tier badge, referral QR.
 *
 * Usage:
 *   const ref = useRef<ViewShot>(null);
 *   <SavingsShareCard ref={ref} savings={4320} score={640} streakDays={21} tier="Super Saver" referralCode="REZ1234" />
 *   const uri = await ref.current?.capture();
 */

import React, { forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { BRAND } from '@/constants/brand';

const CARD_WIDTH = Dimensions.get('window').width - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.45;

const TIER_COLORS: Record<string, [string, string]> = {
  'Beginner':     ['#64748b', '#94a3b8'],
  'Smart Saver':  ['#0ea5e9', '#38bdf8'],
  'Super Saver':  ['#1a3a52', '#FFC857'],
  'Elite Saver':  ['#d97706', '#fbbf24'],
  'Legend':       ['#dc2626', '#f87171'],
};

const TIER_ICONS: Record<string, string> = {
  'Beginner':     '⭐',
  'Smart Saver':  '💡',
  'Super Saver':  '🚀',
  'Elite Saver':  '👑',
  'Legend':       '🏆',
};

export interface SavingsShareCardProps {
  /** Monthly savings amount in Rs */
  savings: number;
  /** REZ Score (0-999) */
  score: number;
  /** Current savings streak in days */
  streakDays: number;
  /** Tier label e.g. "Super Saver" */
  tier: string;
  /** User's referral code */
  referralCode: string;
}

/**
 * SavingsShareCard rendered as a View that can be captured via react-native-view-shot.
 * Wrap with ViewShot ref in parent to capture it as an image.
 */
const SavingsShareCard = forwardRef<View, SavingsShareCardProps>(
  ({ savings, score, streakDays, tier, referralCode }, ref) => {
    const gradientColors: [string, string] =
      TIER_COLORS[tier] || ['#1a3a52', '#FFC857'];

    const tierIcon = TIER_ICONS[tier] || '✨';
    const referralLink = `https://app.rezpay.in/join?ref=${referralCode}`;

    const formattedSavings = savings.toLocaleString('en-IN');

    return (
      <View ref={ref} style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1], '#1e1b4b']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top branding strip */}
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>{BRAND.APP_NAME}</Text>
            </View>
            <Text style={styles.tagline}>Smart Spending Habit</Text>
          </View>

          {/* Hero savings number */}
          <View style={styles.heroSection}>
            <Text style={styles.heroLabel}>I saved this month</Text>
            <Text style={styles.heroAmount}>
              <Text style={styles.heroCurrency}>Rs.</Text>
              {formattedSavings}
            </Text>
            <Text style={styles.heroSubLabel}>with {BRAND.APP_NAME}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {/* REZ Score */}
            <View style={styles.statBox}>
              <View style={styles.statIconRing}>
                <Ionicons name="stats-chart" size={18} color="#fff" />
              </View>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>REZ Score</Text>
            </View>

            {/* Divider */}
            <View style={styles.statDivider} />

            {/* Streak */}
            <View style={styles.statBox}>
              <View style={styles.statIconRing}>
                <Text style={styles.flameIcon}>🔥</Text>
              </View>
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>

            {/* Divider */}
            <View style={styles.statDivider} />

            {/* Tier */}
            <View style={styles.statBox}>
              <View style={styles.statIconRing}>
                <Text style={styles.tierEmoji}>{tierIcon}</Text>
              </View>
              <Text style={[styles.statValue, styles.tierName]} numberOfLines={1}>
                {tier}
              </Text>
              <Text style={styles.statLabel}>Tier</Text>
            </View>
          </View>

          {/* QR + CTA section */}
          <View style={styles.qrSection}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={referralLink}
                size={96}
                color="#1e1b4b"
                backgroundColor="#ffffff"
              />
            </View>
            <View style={styles.qrTextCol}>
              <Text style={styles.qrHeading}>Scan to join & save!</Text>
              <Text style={styles.qrCode}>Code: {referralCode}</Text>
              <Text style={styles.qrBody}>
                Get instant cashback on every spend at local stores.
              </Text>
            </View>
          </View>

          {/* Bottom watermark */}
          <View style={styles.bottomRow}>
            <Text style={styles.watermark}>rezpay.in</Text>
            <Text style={styles.watermarkRight}>#SaveWithREZ</Text>
          </View>
        </LinearGradient>
      </View>
    );
  },
);

SavingsShareCard.displayName = 'SavingsShareCard';

export default SavingsShareCard;

/**
 * Utility: capture a ViewShot ref and return the URI.
 * Requires react-native-view-shot or expo-view-shot to be installed.
 * Returns null if capture is unavailable.
 */
export async function generateShareImage(
  viewShotRef: React.RefObject<unknown>,
): Promise<string | null> {
  try {
    if (!viewShotRef?.current) return null;
    const uri: string = await viewShotRef.current.capture();
    return uri;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },

  // Brand row
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  brandText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontStyle: 'italic',
  },

  // Hero savings
  heroSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  heroAmount: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 64,
  },
  heroCurrency: {
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    marginTop: 2,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  flameIcon: { fontSize: 18 },
  tierEmoji: { fontSize: 18 },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  tierName: { fontSize: 12 },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // QR section
  qrSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
  },
  qrTextCol: {
    flex: 1,
  },
  qrHeading: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrCode: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 1,
  },
  qrBody: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 16,
  },

  // Bottom watermark
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  watermark: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  watermarkRight: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
});
