/**
 * CampusLeaderboardTeaser — Compact leaderboard nudge shown only for the
 * student persona. Displays the user's campus rank and their closest rival.
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

const MUSTARD = colors.lightMustard;  // #ffcd57
const NAVY    = colors.nileBlue;       // #1a3a52

// ─── Props ────────────────────────────────────────────────────────────────────
interface CampusLeaderboardTeaserProps {
  /** Current user rank on campus this week */
  rank?: number;
  /** Display name of the user ranked just above */
  nextUser?: string;
  /** RC points gap between this user and nextUser */
  pointsGap?: number;
  onPress?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const CampusLeaderboardTeaser: React.FC<CampusLeaderboardTeaserProps> = ({
  rank      = 14,
  nextUser  = 'Rohit',
  pointsGap = 40,
  onPress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
      onPress={onPress}
    >
      {/* Rank number */}
      <View style={styles.rankBlock}>
        <Text style={styles.rankHash}>#</Text>
        <Text style={styles.rankNum}>{rank}</Text>
      </View>

      {/* Middle text */}
      <View style={styles.middle}>
        <Text style={styles.mainText}>
          You're #{rank} on campus this week
        </Text>
        <Text style={styles.subText}>
          {nextUser} is #{rank - 1} · {pointsGap} RC ahead
        </Text>
      </View>

      {/* Right CTA */}
      <View style={styles.ctaPill}>
        <Text style={styles.ctaText}>View board ›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,   // #E8DCC4
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: NAVY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  // Rank block
  rankBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 44,
  },
  rankHash: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
    lineHeight: 26,
  },
  rankNum: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  // Middle
  middle: {
    flex: 1,
  },
  mainText: {
    fontSize: 12,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 2,
  },
  subText: {
    fontSize: 10,
    color: colors.neutral[500],
    fontWeight: '400',
  },
  // CTA pill
  ctaPill: {
    backgroundColor: 'rgba(255,205,87,0.15)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,205,87,0.35)',
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '700',
    color: NAVY,
  },
});

export default React.memo(CampusLeaderboardTeaser);
