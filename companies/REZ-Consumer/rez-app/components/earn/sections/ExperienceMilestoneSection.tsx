/**
 * ExperienceMilestoneSection — Spending Milestone / Experience Reward Progress banner
 *
 * Displayed on the Play & Earn screen, directly below RendezPartnerSection.
 * Shows the user's progress toward spending-based Experience Rewards that unlock
 * a real date experience credit in the Rendez app (candlelight dinner, etc.).
 *
 * Self-contained: fetches its own data, requires no props.
 * Returns null silently on API failure so it never breaks the screen.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/services/apiClient';

const RENDEZ_SCHEME = 'rendez://';
const RENDEZ_APP_STORE = 'https://apps.apple.com/app/rendez/id0000000000';
const RENDEZ_PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.rendez.app';

const TIER_COLORS: Record<string, string> = {
  SILVER: '#9ca3af',
  GOLD: '#f59e0b',
  PLATINUM: '#7c3aed',
};

const TIER_LADDER = [
  { tier: 'SILVER', emoji: '☕', threshold: 10000, label: 'Coffee & Brunch' },
  { tier: 'GOLD', emoji: '🍽️', threshold: 20000, label: 'Candlelight Dinner' },
  { tier: 'PLATINUM', emoji: '💎', threshold: 50000, label: 'Premium Experience' },
];

// ── Types ────────────────────────────────────────────────────────────────────

interface NextTier {
  tier: string;
  type: string;
  label: string;
  threshold: number;
}

interface CurrentReward {
  tier: string;
  label: string;
  status: string;
}

interface MilestoneProgress {
  spendThisMonth: number;
  nextTier: NextTier | null;
  amountToNextTier: number;
  currentReward: CurrentReward | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openRendez() {
  try {
    const canOpen = await Linking.canOpenURL(RENDEZ_SCHEME);
    if (canOpen) {
      await Linking.openURL(RENDEZ_SCHEME);
    } else {
      const storeUrl = Platform.OS === 'ios' ? RENDEZ_APP_STORE : RENDEZ_PLAY_STORE;
      await Linking.openURL(storeUrl);
    }
  } catch {
    // User cancelled or no handler — ignore
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return '₹' + (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1) + 'K';
  }
  return '₹' + amount.toLocaleString('en-IN');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExperienceMilestoneSection() {
  const [data, setData] = useState<MilestoneProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProgress() {
      try {
        const res = await apiClient.get<MilestoneProgress>('/experience-rewards/progress');
        if (res.success && res.data && !cancelled) setData(res.data);
      } catch {
        // API unavailable — component returns null below
      }
    }

    fetchProgress();
    return () => { cancelled = true; };
  }, []);

  // Don't render if API failed or no relevant state to show
  if (!data) return null;
  if (!data.currentReward && !data.nextTier) return null;

  // ── State A: Reward already granted this month ──
  if (data.currentReward) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.sectionLabel}>Experience Rewards</Text>
        <LinearGradient
          colors={['#1a1a2e', '#78350f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardGrantedTitle}>
              {'\uD83C\uDF81'} You've earned: {data.currentReward.label}!
            </Text>
            <Text style={styles.rewardGrantedSub}>
              Open Rendez to use your Experience Credit →
            </Text>
            <TouchableOpacity onPress={openRendez} activeOpacity={0.85} style={styles.ctaBtn}>
              <Text style={styles.ctaText}>Open Rendez</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rightEmoji}>
            <Text style={{ fontSize: 52 }}>🎁</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // ── State C: Already Platinum / above max tier ──
  if (!data.nextTier) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.sectionLabel}>Experience Rewards</Text>
        <LinearGradient
          colors={['#1a1a2e', '#78350f']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.platinumText}>You're a Platinum member! 💎</Text>
        </LinearGradient>
      </View>
    );
  }

  // ── State B: Working toward the next tier ──
  const { nextTier, spendThisMonth, amountToNextTier } = data;
  const progressRatio = clamp(spendThisMonth / nextTier.threshold, 0, 1);
  const nextTierColor = TIER_COLORS[nextTier.tier] ?? '#f59e0b';

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>Experience Rewards</Text>

      <LinearGradient
        colors={['#1a1a2e', '#78350f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>✨ Experience Rewards</Text>
            <Text style={styles.sub}>Shop more to unlock a real date experience</Text>
          </View>
          <Text style={{ fontSize: 40, marginLeft: 8 }}>🍽️</Text>
        </View>

        {/* Tier ladder */}
        <View style={styles.tierLadder}>
          {TIER_LADDER.map((tier) => {
            const isTarget = tier.tier === nextTier.tier;
            const tierColor = TIER_COLORS[tier.tier] ?? '#9ca3af';
            return (
              <View
                key={tier.tier}
                style={[styles.tierRow, isTarget && styles.tierRowHighlighted]}
              >
                <Text style={styles.tierEmoji}>{tier.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierLabel, { color: tierColor }]}>
                    {tier.tier.charAt(0) + tier.tier.slice(1).toLowerCase()}
                    {' '}
                    <Text style={styles.tierThreshold}>{formatCurrency(tier.threshold)}</Text>
                  </Text>
                  <Text style={styles.tierDesc}>{tier.label}</Text>
                </View>
                {isTarget && (
                  <View style={[styles.targetBadge, { backgroundColor: tierColor }]}>
                    <Text style={styles.targetBadgeText}>TARGET</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressRatio * 100}%` as `${number}%`, backgroundColor: nextTierColor },
            ]}
          />
        </View>

        {/* Progress text */}
        <Text style={styles.progressText}>
          {formatCurrency(spendThisMonth)} spent ·{' '}
          <Text style={{ color: nextTierColor, fontWeight: '700' }}>
            {formatCurrency(amountToNextTier)} more
          </Text>
          {' '}for {nextTier.label}
        </Text>
      </LinearGradient>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper:      { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10,
  },

  card: {
    borderRadius: 20, padding: 20, overflow: 'hidden',
  },

  // State A — reward granted
  rewardGrantedTitle: {
    fontSize: 18, fontWeight: '800', color: '#f59e0b', marginBottom: 8, lineHeight: 26,
  },
  rewardGrantedSub: {
    fontSize: 12, color: '#fde68a', lineHeight: 18, marginBottom: 16,
  },

  // State C — platinum
  platinumText: {
    fontSize: 18, fontWeight: '800', color: '#7c3aed', textAlign: 'center', paddingVertical: 8,
  },

  // State B — progress
  headerRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  title:        { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub:          { fontSize: 12, color: '#c4b5fd', lineHeight: 17 },

  tierLadder:   { gap: 8, marginBottom: 16 },
  tierRow:      {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tierRowHighlighted: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
  },
  tierEmoji:    { fontSize: 18, width: 24, textAlign: 'center' },
  tierLabel:    { fontSize: 13, fontWeight: '700' },
  tierThreshold:{ fontWeight: '500', opacity: 0.85 },
  tierDesc:     { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  targetBadge:  {
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  targetBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  progressTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },

  progressText: { fontSize: 12, color: '#e5e7eb', lineHeight: 18 },

  // Shared CTA
  ctaBtn:  {
    backgroundColor: '#7c3aed', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  rightEmoji: { alignItems: 'center', marginLeft: 12 },
});
