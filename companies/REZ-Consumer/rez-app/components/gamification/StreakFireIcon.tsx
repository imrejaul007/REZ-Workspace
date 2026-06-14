/**
 * StreakFireIcon
 *
 * Phase 1.4 — Visit Progress Visualization
 * Animated flame icon showing the current streak count.
 *
 * States:
 *  - cold  (0 days)    → gray flame, no animation
 *  - warm  (1-6 days)  → orange flame, gentle glow
 *  - hot   (7+ days)   → red/gold flame, pulse animation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export type StreakState = 'cold' | 'warm' | 'hot';
export type StreakSize = 'small' | 'medium' | 'large';

export interface StreakFireIconProps {
  streakDays: number;
  size?: StreakSize;
}

// ============================================================================
// HELPERS
// ============================================================================

const SIZE_MAP: Record<StreakSize, { flame: number; count: number; glow: number }> = {
  small:  { flame: 22, count: 11, glow: 32 },
  medium: { flame: 36, count: 15, glow: 50 },
  large:  { flame: 52, count: 20, glow: 72 },
};

function getStreakState(days: number): StreakState {
  if (days <= 0) return 'cold';
  if (days < 7) return 'warm';
  return 'hot';
}

const STATE_CONFIG: Record<StreakState, {
  flameEmoji: string;
  flameBg: string;
  glowColor: string;
  countColor: string;
  label: string;
}> = {
  cold: {
    flameEmoji: '🩶',
    flameBg: colors.gray[200],
    glowColor: 'transparent',
    countColor: colors.gray[500],
    label: 'No streak',
  },
  warm: {
    flameEmoji: '🔥',
    flameBg: colors.tint.amber,
    glowColor: colors.warningScale[200],
    countColor: colors.warning,
    label: 'Warming up',
  },
  hot: {
    flameEmoji: '🔥',
    flameBg: '#FFF0E0',
    glowColor: colors.brand.orange + '55',
    countColor: colors.brand.orangeDark,
    label: 'On fire!',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

const StreakFireIcon: React.FC<StreakFireIconProps> = ({
  streakDays,
  size = 'medium',
}) => {
  const state = getStreakState(streakDays);
  const config = STATE_CONFIG[state];
  const dim = SIZE_MAP[size];

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  // Hot state: pulse animation
  useEffect(() => {
    if (state === 'hot') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.12,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.6,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }

    if (state === 'warm') {
      const sway = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      sway.start();
      return () => sway.stop();
    }

    // cold — reset
    scaleAnim.setValue(1);
    glowAnim.setValue(0.6);
    return () => {};
  }, [state, scaleAnim, glowAnim]);

  const glowSize = dim.glow;

  return (
    <View style={styles.wrapper}>
      {/* Glow ring behind flame */}
      {state !== 'cold' && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: glowSize,
              height: glowSize,
              borderRadius: glowSize / 2,
              backgroundColor: config.glowColor,
              opacity: state === 'hot' ? glowAnim : 0.5,
            },
          ]}
        />
      )}

      {/* Flame + count */}
      <Animated.View
        style={[
          styles.flameContainer,
          {
            width: dim.flame + 8,
            height: dim.flame + 8,
            borderRadius: (dim.flame + 8) / 2,
            backgroundColor: config.flameBg,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ThemedText style={{ fontSize: dim.flame * 0.72, lineHeight: dim.flame }}>
          {config.flameEmoji}
        </ThemedText>
      </Animated.View>

      {/* Streak count badge */}
      {streakDays > 0 && (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: config.countColor,
              minWidth: dim.count + 8,
              height: dim.count + 6,
              borderRadius: (dim.count + 6) / 2,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.countText,
              { fontSize: dim.count - 2, color: colors.text.inverse },
            ]}
          >
            {streakDays}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  flameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  countText: {
    fontWeight: '800',
    lineHeight: 16,
  },
});

export default React.memo(StreakFireIcon);
