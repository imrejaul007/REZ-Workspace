/**
 * VisitStreakCard — Clean white card showing the user's 7-visit streak progress.
 *
 * Design: white card, navy text, mustard for completed dots only.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

const MUSTARD = '#FFC857';
const NAVY    = '#1a3a52';
const BORDER  = '#E2E8F0';
const BODY    = '#475569';
const MUTED   = '#94A3B8';
const LIGHT   = '#F8F9FA';

// ─── Props ────────────────────────────────────────────────────────────────────
interface VisitStreakCardProps {
  currentVisits?: number;
  totalRequired?: number;
  rewardAmount?: number;
  onEarnMore?: () => void;
}

// ─── Dot component ────────────────────────────────────────────────────────────
type DotState = 'done' | 'current' | 'next' | 'reward';

interface DotProps {
  state: DotState;
  isRewardDot: boolean;
  rewardDone: boolean;
}

const StreakDot: React.FC<DotProps> = ({ state, isRewardDot, rewardDone }) => {
  if (isRewardDot) {
    const isDone = rewardDone;
    return (
      <View style={[dot.base, isDone ? dot.done : dot.mustardFilled]}>
        {isDone ? (
          <Text style={dot.checkmark}>✓</Text>
        ) : (
          <Text style={dot.emoji}>🎁</Text>
        )}
      </View>
    );
  }

  switch (state) {
    case 'done':
      return (
        <View style={[dot.base, dot.done]}>
          <Text style={dot.checkmark}>✓</Text>
        </View>
      );
    case 'current':
      return (
        <View style={[dot.base, dot.currentOuter]}>
          <View style={dot.currentInner} />
        </View>
      );
    case 'next':
    default:
      return <View style={[dot.base, dot.next]} />;
  }
};

const dot = StyleSheet.create({
  base: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  done: {
    backgroundColor: MUSTARD,
  },
  mustardFilled: {
    backgroundColor: MUSTARD,
  },
  currentOuter: {
    borderWidth: 2,
    borderColor: MUSTARD,
    backgroundColor: '#FFFBEB',
  },
  currentInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MUSTARD,
  },
  next: {
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  checkmark: {
    fontSize: 11,
    fontWeight: '800',
    color: NAVY,
  },
  emoji: {
    fontSize: 12,
  },
});

// ─── Connector line ───────────────────────────────────────────────────────────
const Connector: React.FC<{ done: boolean }> = ({ done }) => (
  <View
    style={[
      conn.line,
      done
        ? { backgroundColor: MUSTARD }
        : { backgroundColor: BORDER },
    ]}
  />
);

const conn = StyleSheet.create({
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 3,
    borderRadius: 1,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────
const TOTAL_DOTS = 7;

const VisitStreakCard: React.FC<VisitStreakCardProps> = ({
  currentVisits = 3,
  totalRequired = 7,
  rewardAmount  = 200,
  onEarnMore,
}) => {
  const safeVisits    = Math.min(Math.max(currentVisits, 0), TOTAL_DOTS);
  const remaining     = Math.max(totalRequired - safeVisits, 0);
  const rewardReached = safeVisits >= TOTAL_DOTS;

  const getDotState = (index: number): DotState => {
    if (index < safeVisits)   return 'done';
    if (index === safeVisits) return 'current';
    return 'next';
  };

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.topTextBlock}>
          <Text style={styles.topLabel}>Visit Streak</Text>
          <Text style={styles.topMain}>
            {safeVisits} of {totalRequired} visits
            {remaining > 0 ? ` · ${remaining} more → ${rewardAmount} RC` : ' · Reward unlocked!'}
          </Text>
        </View>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>⭐</Text>
        </View>
      </View>

      {/* Progress dots row */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_DOTS }).map((_, i) => {
          const isReward  = i === TOTAL_DOTS - 1;
          const state     = getDotState(i);
          const isLastDot = i === TOTAL_DOTS - 1;

          return (
            <React.Fragment key={i}>
              <StreakDot
                state={state}
                isRewardDot={isReward}
                rewardDone={rewardReached}
              />
              {!isLastDot && <Connector done={i < safeVisits} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>
          This visit counted.{' '}
          {remaining > 0
            ? `${remaining} more unlock${remaining === 1 ? 's' : ''} your bonus.`
            : 'Bonus unlocked — collect it now!'}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.earnPill, pressed && { opacity: 0.8 }]}
          onPress={onEarnMore}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.earnText}>Earn more ›</Text>
        </Pressable>
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
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topTextBlock: {
    flex: 1,
    paddingRight: 10,
  },
  topLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  topMain: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
    lineHeight: 18,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  iconEmoji: {
    fontSize: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MUSTARD,
    flexShrink: 0,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: BODY,
    lineHeight: 15,
  },
  earnPill: {
    backgroundColor: '#FFFBEB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: MUSTARD,
    flexShrink: 0,
  },
  earnText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },
});

export default React.memo(VisitStreakCard);
