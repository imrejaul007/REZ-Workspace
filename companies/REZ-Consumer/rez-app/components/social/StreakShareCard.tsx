/**
 * StreakShareCard
 * Phase 3.1 — Social Proof & Sharing
 *
 * Shareable card celebrating a savings streak milestone.
 * "I'm on a {days}-day savings streak on REZ!"
 *
 * Wrap with ViewShot ref to capture as image.
 */

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND } from '@/constants/brand';

const CARD_WIDTH = Dimensions.get('window').width - 48;

const TIER_GRADIENTS: Record<string, [string, string, string]> = {
  'Beginner':     ['#475569', '#64748b', '#0f172a'],
  'Smart Saver':  ['#0369a1', '#0ea5e9', '#0c4a6e'],
  'Super Saver':  ['#1a3a52', '#2d5f87', '#0f2438'],
  'Elite Saver':  ['#b45309', '#d97706', '#451a03'],
  'Legend':       ['#b91c1c', '#dc2626', '#450a0a'],
};

export interface StreakShareCardProps {
  /** Number of consecutive streak days */
  streakDays: number;
  /** Current tier label */
  tier: string;
}

const StreakShareCard = forwardRef<View, StreakShareCardProps>(
  ({ streakDays, tier }, ref) => {
    const gradientColors: [string, string, string] =
      TIER_GRADIENTS[tier] || ['#1a3a52', '#2d5f87', '#0f2438'];

    const milestoneEmoji =
      streakDays >= 100 ? '🏆' :
      streakDays >= 30  ? '💎' :
      streakDays >= 14  ? '🚀' :
      streakDays >= 7   ? '🔥' : '⭐';

    const milestoneMessage =
      streakDays >= 100 ? 'Legendary dedication!' :
      streakDays >= 30  ? 'A whole month of savings!' :
      streakDays >= 14  ? 'Two weeks strong!' :
      streakDays >= 7   ? 'Week warrior!' : 'Off to a great start!';

    return (
      <View ref={ref} style={styles.card}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{BRAND.APP_NAME}</Text>
            <Text style={styles.tagline}>Savings Streak</Text>
          </View>

          {/* Big flame + days */}
          <View style={styles.heroSection}>
            <Text style={styles.bigFlame}>🔥</Text>
            <Text style={styles.daysNumber}>{streakDays}</Text>
            <Text style={styles.daysLabel}>Day Savings Streak</Text>
            <View style={styles.milestoneChip}>
              <Text style={styles.milestoneEmoji}>{milestoneEmoji}</Text>
              <Text style={styles.milestoneText}>{milestoneMessage}</Text>
            </View>
          </View>

          {/* CTA line */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaMain}>
              "I'm on a {streakDays}-day savings streak on {BRAND.APP_NAME}!"
            </Text>
            <Text style={styles.ctaSub}>
              Join me — check REZ before every local spend.
            </Text>
          </View>

          {/* Tier badge + watermark */}
          <View style={styles.bottomRow}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{tier}</Text>
            </View>
            <Text style={styles.watermark}>rezpay.in  •  #StreakGoals</Text>
          </View>
        </LinearGradient>
      </View>
    );
  },
);

StreakShareCard.displayName = 'StreakShareCard';
export default StreakShareCard;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 20,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 1,
  },
  tagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },

  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  bigFlame: {
    fontSize: 72,
    lineHeight: 84,
  },
  daysNumber: {
    color: '#fff',
    fontSize: 88,
    fontWeight: '900',
    letterSpacing: -4,
    lineHeight: 96,
    marginTop: -8,
  },
  daysLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  milestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  milestoneEmoji: { fontSize: 18 },
  milestoneText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  ctaSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  ctaMain: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tierText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  watermark: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
});
