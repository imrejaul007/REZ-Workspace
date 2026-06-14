// @ts-nocheck
/**
 * TryBeforeYouBuyCard — "Today's Trial Drop"
 *
 * Redesigned from generic category grid to a daily curiosity trigger.
 * Every day there's a "new drop" — one featured trial experience prominently shown.
 * Category tiles remain below for browsing.
 *
 * Design: white card, mustard left border accent, featured drop hero area,
 * "Today's Drop" badge with date, category tiles below.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MUSTARD      = '#FFC857';
const NAVY         = '#1a3a52';
const BORDER       = '#E2E8F0';
const BODY         = '#475569';
const MUTED        = '#94A3B8';
const LIGHT        = '#F8F9FA';
const AMBER_BG     = '#FFFBEB';
const AMBER_BORDER = '#FDE68A';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrialCounts {
  cafes?:    number;
  grooming?: number;
  fitness?:  number;
  beauty?:   number;
}

export interface FeaturedTrial {
  merchantName: string;
  category:     string;
  description:  string;
  slotsLeft:    number;
  totalSlots:   number;
  emoji:        string;
}

interface TryBeforeYouBuyCardProps {
  trialCounts?:    TrialCounts;
  featuredTrial?:  FeaturedTrial;
  onExplore?:      () => void;
  onFeaturedPress?: () => void;
  onCategoryPress?: (category: keyof TrialCounts) => void;
}

// ─── Default featured trial (shown until real data loads) ─────────────────────
const DEFAULT_TRIAL: FeaturedTrial = {
  merchantName: 'New café near you',
  category:     'Café Experience',
  description:  'Free tasting session — first 20 visitors only',
  slotsLeft:    12,
  totalSlots:   20,
  emoji:        '☕',
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES: { key: keyof TrialCounts; label: string; emoji: string }[] = [
  { key: 'cafes',    label: 'Cafés',    emoji: '☕' },
  { key: 'grooming', label: 'Grooming', emoji: '✂️' },
  { key: 'fitness',  label: 'Fitness',  emoji: '🏋️' },
  { key: 'beauty',   label: 'Beauty',   emoji: '💅' },
];

// ─── Today's date badge ───────────────────────────────────────────────────────
function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Category tile ────────────────────────────────────────────────────────────
const CategoryTile: React.FC<{
  emoji: string;
  label: string;
  count: number;
  onPress?: () => void;
}> = ({ emoji, label, count, onPress }) => (
  <Pressable
    style={({ pressed }) => [tile.wrapper, pressed && { opacity: 0.75 }]}
    onPress={onPress}
    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
  >
    <View style={tile.iconBox}>
      <Text style={tile.emoji}>{emoji}</Text>
    </View>
    <Text style={tile.label}>{label}</Text>
    <Text style={tile.sub}>{count} trial{count !== 1 ? 's' : ''}</Text>
  </Pressable>
);

const tile = StyleSheet.create({
  wrapper:  { flex: 1, alignItems: 'center', gap: 4 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: LIGHT, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4, borderWidth: 1, borderColor: BORDER,
  },
  emoji:  { fontSize: 20 },
  label:  { fontSize: 11, fontWeight: '600', color: NAVY, textAlign: 'center' },
  sub:    { fontSize: 10, color: MUTED, textAlign: 'center' },
});

// ─── Slot bar ─────────────────────────────────────────────────────────────────
const SlotBar: React.FC<{ left: number; total: number }> = ({ left, total }) => {
  const filled = total > 0 ? ((total - left) / total) : 0;
  return (
    <View style={slot.track}>
      <View style={[slot.fill, { width: `${filled * 100}%` as unknown }]} />
    </View>
  );
};
const slot = StyleSheet.create({
  track: { height: 4, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden', flex: 1 },
  fill:  { height: '100%', backgroundColor: MUSTARD, borderRadius: 4 },
});

// ─── Main component ───────────────────────────────────────────────────────────
const TryBeforeYouBuyCard: React.FC<TryBeforeYouBuyCardProps> = ({
  trialCounts    = { cafes: 8, grooming: 5, fitness: 4, beauty: 6 },
  featuredTrial  = DEFAULT_TRIAL,
  onExplore,
  onFeaturedPress,
  onCategoryPress,
}) => {
  const trial = featuredTrial ?? DEFAULT_TRIAL;
  const slotsPercent = trial.totalSlots > 0
    ? Math.round(((trial.totalSlots - trial.slotsLeft) / trial.totalSlots) * 100)
    : 0;

  return (
    <View style={styles.card}>

      {/* ── Section header ── */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>Try Before You Buy</Text>
          <Text style={styles.sectionTitle}>Today's Trial Drop</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.allTrialsBtn, pressed && { opacity: 0.82 }]}
          onPress={onExplore}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="See all trial drops"
        >
          <Text style={styles.allTrialsText}>All trials</Text>
          <Ionicons name="chevron-forward" size={12} color={NAVY} />
        </Pressable>
      </View>

      {/* ── Featured trial hero ── */}
      <Pressable
        style={({ pressed }) => [styles.featuredCard, pressed && { opacity: 0.92 }]}
        onPress={onFeaturedPress ?? onExplore}
        accessibilityRole="button"
        accessibilityLabel={`Try ${trial.merchantName} — ${trial.slotsLeft} slots left`}
      >
        {/* Today badge */}
        <View style={styles.todayBadgeRow}>
          <View style={styles.todayBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.todayBadgeText}>Today · {getTodayLabel()}</Text>
          </View>
          {trial.slotsLeft <= 5 && (
            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>⚡ {trial.slotsLeft} left</Text>
            </View>
          )}
        </View>

        {/* Trial info */}
        <View style={styles.featuredInfo}>
          <View style={styles.featuredEmoji}>
            <Text style={{ fontSize: 28 }}>{trial.emoji}</Text>
          </View>
          <View style={styles.featuredText}>
            <Text style={styles.merchantName}>{trial.merchantName}</Text>
            <Text style={styles.categoryLabel}>{trial.category}</Text>
            <Text style={styles.trialDesc} numberOfLines={2}>{trial.description}</Text>
          </View>
        </View>

        {/* Slots bar */}
        <View style={styles.slotsRow}>
          <Text style={styles.slotsLabel}>{trial.slotsLeft} of {trial.totalSlots} slots free</Text>
          <SlotBar left={trial.slotsLeft} total={trial.totalSlots} />
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.claimBtn, pressed && { opacity: 0.85 }]}
          onPress={onFeaturedPress ?? onExplore}
          accessibilityRole="button"
          accessibilityLabel={`Claim free trial at ${trial.merchantName}`}
        >
          <Text style={styles.claimBtnText}>Claim free trial →</Text>
        </Pressable>
      </Pressable>

      {/* ── Category tiles ── */}
      <View style={styles.divider} />
      <View style={styles.categoriesRow}>
        {CATEGORIES.map(cat => (
          <CategoryTile
            key={cat.key}
            emoji={cat.emoji}
            label={cat.label}
            count={trialCounts[cat.key] ?? 0}
            onPress={() => onCategoryPress?.(cat.key)}
          />
        ))}
      </View>
    </View>
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
    borderLeftColor: MUSTARD,
    padding: 16,
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

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: -0.3,
  },
  allTrialsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  allTrialsText: {
    fontSize: 12,
    fontWeight: '600',
    color: NAVY,
  },

  // ── Featured card ──
  featuredCard: {
    backgroundColor: AMBER_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AMBER_BORDER,
    padding: 12,
    marginBottom: 4,
  },
  todayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: MUSTARD,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveIndicator: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: NAVY,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: NAVY,
  },
  urgencyBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },

  // ── Featured info ──
  featuredInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  featuredEmoji: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featuredText: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 11,
    color: MUTED,
    marginBottom: 4,
  },
  trialDesc: {
    fontSize: 12,
    color: BODY,
    lineHeight: 16,
  },

  // ── Slots bar ──
  slotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  slotsLabel: {
    fontSize: 10,
    color: BODY,
    fontWeight: '600',
    flexShrink: 0,
  },

  // ── CTA ──
  claimBtn: {
    backgroundColor: MUSTARD,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  claimBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },

  // ── Categories ──
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});

export default React.memo(TryBeforeYouBuyCard);
