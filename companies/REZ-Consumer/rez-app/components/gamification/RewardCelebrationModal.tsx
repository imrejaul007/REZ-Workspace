/**
 * RewardCelebrationModal
 *
 * Phase 1.2 — Instant Reward Gratification
 * Full-screen overlay modal triggered after earning coins.
 * Features:
 *  - Animated coin count-up from 0 to earned amount
 *  - "You saved Rs.{amount}!" headline
 *  - "Next milestone: {description}" subtitle
 *  - Confetti-style animated falling coin particles
 *  - Auto-dismiss after 3 seconds or tap to dismiss
 *  - Haptic feedback on appearance (expo-haptics)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

export interface RewardCelebrationModalProps {
  visible: boolean;
  coinsEarned: number;
  totalSaved: number;
  nextMilestone?: string;
  onDismiss: () => void;
}

// ============================================================================
// CONFETTI PARTICLE
// ============================================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 18;

interface ParticleConfig {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  emoji: string;
  startX: number;
  startDelay: number;
}

const EMOJIS = ['🪙', '✨', '⭐', '💫', '🌟'];

function createParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    rotate: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random() * 0.8),
    emoji: EMOJIS[i % EMOJIS.length],
    startX: (i / PARTICLE_COUNT) * SCREEN_W,
    startDelay: Math.random() * 600,
  }));
}

// ============================================================================
// COMPONENT
// ============================================================================

const RewardCelebrationModal: React.FC<RewardCelebrationModalProps> = ({
  visible,
  coinsEarned,
  totalSaved,
  nextMilestone,
  onDismiss,
}) => {
  const [displayCount, setDisplayCount] = useState(0);
  const particles = useRef<ParticleConfig[]>(createParticles()).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Count-up animation
  useEffect(() => {
    if (!visible) {
      setDisplayCount(0);
      return;
    }

    // Haptic on appear
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Entry animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 120,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Coin count-up
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayCount(Math.round(eased * coinsEarned));
      if (step >= steps) clearInterval(timer);
    }, interval);

    // Confetti
    particles.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.rotate.setValue(0);

      Animated.sequence([
        Animated.delay(p.startDelay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(p.y, {
            toValue: SCREEN_H * 0.7,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotate, {
            toValue: 6,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.x, {
              toValue: (Math.random() - 0.5) * 120,
              duration: 1100,
              useNativeDriver: true,
            }),
            Animated.timing(p.x, {
              toValue: (Math.random() - 0.5) * 80,
              duration: 1100,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(1400),
            Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });

    // Auto-dismiss after 3 seconds
    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, 3000);

    return () => {
      clearInterval(timer);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      onDismiss();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        {/* Confetti particles */}
        {particles.map((p, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.particle,
              {
                left: p.startX,
                top: -30,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                  {
                    rotate: p.rotate.interpolate({
                      inputRange: [0, 6],
                      outputRange: ['0deg', '1440deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {p.emoji}
          </Animated.Text>
        ))}

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={handleDismiss} hitSlop={10}>
            <Ionicons name="close" size={20} color={colors.gray[400]} />
          </Pressable>

          {/* Icon */}
          <View style={styles.coinCircle}>
            <ThemedText style={styles.coinEmoji}>🪙</ThemedText>
          </View>

          {/* Animated coin count */}
          <View style={styles.countRow}>
            <ThemedText style={styles.plusSign}>+</ThemedText>
            <ThemedText style={styles.countNumber}>
              {displayCount.toLocaleString('en-IN')}
            </ThemedText>
          </View>
          <ThemedText style={styles.coinsLabel}>coins earned</ThemedText>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Savings line */}
          <ThemedText style={styles.savingsText}>
            You saved{' '}
            <ThemedText style={styles.savingsAmount}>
              Rs.{totalSaved.toLocaleString('en-IN')}
            </ThemedText>
            {' '}lifetime!
          </ThemedText>

          {/* Next milestone */}
          {nextMilestone ? (
            <View style={styles.milestonePill}>
              <Ionicons name="flag-outline" size={14} color={colors.lightMustard} />
              <ThemedText style={styles.milestoneText} numberOfLines={2}>
                Next: {nextMilestone}
              </ThemedText>
            </View>
          ) : null}

          {/* Tap hint */}
          <ThemedText style={styles.tapHint}>Tap anywhere to continue</ThemedText>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,20,35,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 22,
  },
  card: {
    width: '78%',
    backgroundColor: colors.background.primary,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.tint.coolGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.tint.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  coinEmoji: {
    fontSize: 36,
    lineHeight: 44,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  plusSign: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.success,
    lineHeight: 58,
    marginRight: 2,
  },
  countNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.lightMustard,
    lineHeight: 58,
    letterSpacing: -1,
  },
  coinsLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
    marginTop: -4,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 8,
  },
  savingsText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  savingsAmount: {
    fontWeight: '700',
    color: colors.success,
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.dark,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginTop: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: colors.lightPeach,
    fontWeight: '500',
    flex: 1,
  },
  tapHint: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 8,
  },
});

export default React.memo(RewardCelebrationModal);
