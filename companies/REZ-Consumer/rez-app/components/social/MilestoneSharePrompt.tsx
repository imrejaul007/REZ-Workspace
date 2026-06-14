/**
 * MilestoneSharePrompt
 * Phase 3.1 — Social Proof & Sharing
 *
 * Bottom sheet that appears when a user hits a savings milestone.
 * Milestones: Rs.1,000 / 5,000 / 10,000 / 25,000 total savings.
 *
 * Usage:
 *   <MilestoneSharePrompt
 *     milestone={5000}
 *     totalSaved={5320}
 *     onShare={() => router.push('/share-savings')}
 *     onDismiss={() => setVisible(false)}
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const SAVINGS_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];

export function getNextMilestone(totalSaved: number): number | null {
  return SAVINGS_MILESTONES.find((m) => m > totalSaved) ?? null;
}

export function hasHitMilestone(totalSaved: number, previousTotal: number): number | null {
  for (const milestone of SAVINGS_MILESTONES) {
    if (previousTotal < milestone && totalSaved >= milestone) return milestone;
  }
  return null;
}

const MILESTONE_CONFIG: Record<
  number,
  { emoji: string; headline: string; gradient: [string, string] }
> = {
  1000:   { emoji: '🎉', headline: 'First milestone unlocked!',    gradient: ['#0ea5e9', '#38bdf8'] },
  5000:   { emoji: '🚀', headline: 'You\'re a Smart Saver now!',    gradient: ['#1a3a52', '#FFC857'] },
  10000:  { emoji: '💎', headline: 'Incredible savings habit!',     gradient: ['#d97706', '#fbbf24'] },
  25000:  { emoji: '👑', headline: 'Elite savings territory!',      gradient: ['#dc2626', '#f87171'] },
  50000:  { emoji: '🏆', headline: 'You\'re a REZ Legend!',         gradient: ['#1a3a52', '#FFC857'] },
  100000: { emoji: '🌟', headline: 'Savings master. 1 Lakh done!',  gradient: ['#059669', '#34d399'] },
};

function getMilestoneConfig(milestone: number) {
  return (
    MILESTONE_CONFIG[milestone] ?? {
      emoji: '🎯',
      headline: 'Milestone achieved!',
      gradient: ['#1a3a52', '#FFC857'] as [string, string],
    }
  );
}

export interface MilestoneSharePromptProps {
  /** The milestone amount that was just hit */
  milestone: number;
  /** User's current total savings */
  totalSaved: number;
  /** Called when user taps "Share" */
  onShare: () => void;
  /** Called when user taps "Maybe later" or backdrop */
  onDismiss: () => void;
  /** Whether the prompt is visible */
  visible?: boolean;
}

export default function MilestoneSharePrompt({
  milestone,
  totalSaved,
  onShare,
  onDismiss,
  visible = true,
}: MilestoneSharePromptProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, slideAnim, bgAnim]);

  if (!visible) return null;

  const config = getMilestoneConfig(milestone);
  const formattedMilestone = milestone.toLocaleString('en-IN');
  const formattedTotal = totalSaved.toLocaleString('en-IN');

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)'],
  });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onDismiss}>
        <Animated.View style={[styles.backdrop, { backgroundColor: bgColor }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <LinearGradient
          colors={[config.gradient[0], config.gradient[1], '#fff']}
          style={styles.sheetGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Big emoji */}
          <Text style={styles.bigEmoji}>{config.emoji}</Text>

          {/* Headlines */}
          <Text style={styles.headline}>{config.headline}</Text>
          <Text style={styles.subheadline}>
            You've saved <Text style={styles.boldAmount}>Rs.{formattedTotal}</Text> with {BRAND.APP_NAME}!
          </Text>

          {/* Milestone chip */}
          <View style={styles.milestoneChip}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.milestoneChipText}>
              Rs.{formattedMilestone} Milestone Unlocked
            </Text>
          </View>

          {/* Share CTA */}
          <View style={styles.actionsSection}>
            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.shareButtonPressed,
              ]}
              onPress={onShare}
              accessibilityLabel="Share your savings milestone"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[config.gradient[0], config.gradient[1]]}
                style={styles.shareGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="share-social" size={22} color="#fff" />
                <Text style={styles.shareButtonText}>Share Your Achievement</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.dismissButton}
              onPress={onDismiss}
              accessibilityLabel="Dismiss milestone prompt"
              accessibilityRole="button"
            >
              <Text style={styles.dismissText}>Maybe later</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  sheetGradient: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
  },
  bigEmoji: {
    fontSize: 72,
    lineHeight: 80,
    marginBottom: 16,
  },
  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  boldAmount: {
    fontWeight: '800',
  },
  milestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 32,
  },
  milestoneChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  actionsSection: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shareButtonPressed: {
    opacity: 0.85,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  dismissButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
});
