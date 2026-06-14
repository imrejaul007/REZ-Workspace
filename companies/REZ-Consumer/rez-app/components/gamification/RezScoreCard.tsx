// @ts-nocheck
/**
 * RezScoreCard
 *
 * Phase 2.3 — REZ Score
 * Compact card version of the REZ Score for embedding in home/profile.
 * Shows: score number, tier badge, trend arrow.
 * Tap → navigate to full RezScoreScreen.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export type ScoreTier =
  | 'Beginner'
  | 'Smart Saver'
  | 'Super Saver'
  | 'Elite Saver'
  | 'Legend';

export type ScoreTrend = 'up' | 'down' | 'stable';

export interface RezScoreCardProps {
  score: number;         // 0-999
  tier: ScoreTier;
  trend: ScoreTrend;
  percentile: number;    // e.g. 72 (means top 72%)
  onPress: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

// CRED Light: Nile Blue accent on white card — tiers use muted colored badges
const NILE_BLUE = '#1a3a52';

function getTierColor(tier: ScoreTier): { bg: string; text: string; accent: string } {
  switch (tier) {
    case 'Smart Saver':  return { bg: 'rgba(26,58,82,0.08)',  text: NILE_BLUE,   accent: NILE_BLUE };
    case 'Super Saver':  return { bg: 'rgba(255,200,87,0.15)', text: '#B8860B',  accent: '#FFC857' };
    case 'Elite Saver':  return { bg: 'rgba(251,146,60,0.10)', text: '#C2621A',  accent: '#FB923C' };
    case 'Legend':       return { bg: 'rgba(255,200,87,0.20)', text: '#B8860B',  accent: '#FFC857' };
    case 'Beginner':
    default:             return { bg: 'rgba(26,58,82,0.06)',  text: '#6B7280',   accent: NILE_BLUE };
  }
}

function getTrendConfig(trend: ScoreTrend): { icon: string; color: string; label: string } {
  switch (trend) {
    case 'up':     return { icon: 'trending-up',   color: colors.success, label: 'Rising' };
    case 'down':   return { icon: 'trending-down', color: colors.error,   label: 'Falling' };
    case 'stable':
    default:       return { icon: 'remove',        color: '#9CA3AF',      label: 'Stable' };
  }
}

// Circular gauge using View arcs (pure RN, no SVG)
function ScoreGauge({ score, accentColor }: { score: number; accentColor: string }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const progress = score / 999;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 1200,
      delay: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  return (
    <View style={gaugeStyles.wrapper}>
      {/* Background ring — light gray track on white */}
      <View style={[gaugeStyles.ring, { borderColor: '#E5E7EB' }]} />
      {/* Filled arc simulation via colored border-top trick */}
      <Animated.View
        style={[
          gaugeStyles.ring,
          gaugeStyles.fillRing,
          {
            borderTopColor: accentColor,
            borderRightColor: fillAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 1],
              outputRange: ['transparent', accentColor, accentColor, accentColor],
            }) as unknown,
            borderBottomColor: fillAnim.interpolate({
              inputRange: [0, 0.5, 0.75, 1],
              outputRange: ['transparent', 'transparent', accentColor, accentColor],
            }) as unknown,
            borderLeftColor: fillAnim.interpolate({
              inputRange: [0, 0.75, 1],
              outputRange: ['transparent', 'transparent', accentColor],
            }) as unknown,
          },
        ]}
      />
      {/* Score number */}
      <View style={gaugeStyles.center}>
        <ThemedText style={[gaugeStyles.scoreText, { color: accentColor }]}>
          {score}
        </ThemedText>
      </View>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrapper: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ring: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 4,
    // Light gray track — clean on white card
    borderColor: '#E8E8E8',
  },
  fillRing: {
    transform: [{ rotate: '-90deg' }],
    // Active arc uses accentColor passed in from parent (Nile Blue)
    borderColor: 'transparent',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    // Color is set inline via accentColor prop
  },
});

// ============================================================================
// COMPONENT
// ============================================================================

const RezScoreCard: React.FC<RezScoreCardProps> = ({
  score,
  tier,
  trend,
  percentile,
  onPress,
}) => {
  const tierConfig = getTierColor(tier);
  const trendConfig = getTrendConfig(trend);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed ? styles.containerPressed : null]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`REZ Score ${score}, ${tier} tier. Tap for full details.`}
    >
      {/* Left: gauge */}
      <ScoreGauge score={score} accentColor={tierConfig.accent} />

      {/* Center: info */}
      <View style={styles.info}>
        <View style={[styles.tierBadge, { backgroundColor: tierConfig.bg }]}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[styles.tierText, { color: tierConfig.text }]}
          >
            {tier.toUpperCase()}
          </Text>
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.percentileText}>
          Higher than {percentile}% nearby
        </Text>
      </View>

      {/* Right: trend + chevron */}
      <View style={styles.rightCol}>
        <View style={styles.trendRow}>
          <Ionicons name={trendConfig.icon as unknown} size={14} color={trendConfig.color} />
          <Text numberOfLines={1} style={[styles.trendLabel, { color: trendConfig.color }]}>
            — {trendConfig.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color="rgba(0,0,0,0.25)" style={styles.chevron} />
      </View>
    </Pressable>
  );
};

// ============================================================================
// STYLES (CRED Light)
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  containerPressed: {
    opacity: 0.88,
  },
  info: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    maxWidth: '100%',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  percentileText: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 15,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
    minWidth: 64,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    opacity: 0.3,
  },
});

export default React.memo(RezScoreCard);
