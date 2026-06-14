/**
 * MissionProgressMini Component
 * Compact mission card for profile drawer and other space-constrained areas
 * Part of ReZ Try Simplified UX Architecture
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '@/constants/theme';
import type { Mission } from '@/services/tryApi';
import {
  getTimeRemaining,
  getMissionProgress,
  formatMissionReward,
  isMissionUrgent,
} from './missionUtils';

interface MissionProgressMiniProps {
  mission: Mission;
  compact?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

/**
 * Mini mission progress card for profile drawer
 *
 * Layout (compact version):
 * ┌────────────────────────────────┐
 * │ Try 3 cafes this weekend       │
 * │ ████████░░░░  2/3             │
 * │ +200 ReZ +50 Trial             │
 * └────────────────────────────────┘
 */
function MissionProgressMini({
  mission,
  compact = false,
  style,
  onPress,
}: MissionProgressMiniProps) {
  const router = useRouter();
  const progress = getMissionProgress(mission);
  const timeLeft = getTimeRemaining(mission.endsAt);
  const rewardText = formatMissionReward(mission);
  const urgent = isMissionUrgent(mission);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/try/missions');
    }
  };

  const getProgressColor = (): string => {
    if (progress >= 100) return colors.successScale[500];
    if (progress >= 50) return colors.warningScale[500];
    return colors.brand.purple;
  };

  return (
    <Pressable
      style={[
        styles.container,
        compact && styles.containerCompact,
        urgent && styles.containerUrgent,
        style,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Mission: ${mission.title}. ${mission.completed} of ${mission.target} completed. ${rewardText}`}
    >
      {/* Header Row: Title + Time Badge */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={compact ? 1 : 2}
        >
          {mission.title}
        </Text>
        {urgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="time-outline" size={10} color={colors.errorMain} />
            <Text style={styles.urgentText}>{timeLeft}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: getProgressColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {mission.completed}/{mission.target}
        </Text>
      </View>

      {/* Reward Badges */}
      <View style={styles.rewardRow}>
        {mission.reward.rezCoins > 0 && (
          <View style={styles.rewardBadge}>
            <Ionicons name="logo-usd" size={12} color={colors.coin} />
            <Text style={styles.rewardText}>{mission.reward.rezCoins} ReZ</Text>
          </View>
        )}
        {mission.reward.trialCoins > 0 && (
          <View style={[styles.rewardBadge, styles.rewardBadgeTrial]}>
            <Ionicons name="diamond-outline" size={12} color={colors.brand.purple} />
            <Text style={styles.rewardTextTrial}>{mission.reward.trialCoins} Trial</Text>
          </View>
        )}
        {!compact && !urgent && (
          <Text style={styles.timeText}>{timeLeft}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  containerCompact: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  containerUrgent: {
    borderColor: colors.errorMain,
    borderWidth: 1,
    backgroundColor: colors.errorLight,
  } as ViewStyle,

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  } as ViewStyle,
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  } as TextStyle,
  titleCompact: {
    fontSize: 13,
  } as TextStyle,

  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 2,
  } as ViewStyle,
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.errorMain,
  } as TextStyle,

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  } as ViewStyle,
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  } as ViewStyle,
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 32,
    textAlign: 'right',
  } as TextStyle,

  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    gap: 3,
  } as ViewStyle,
  rewardBadgeTrial: {
    backgroundColor: colors.tint.purple,
  } as ViewStyle,
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.coin,
  } as TextStyle,
  rewardTextTrial: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brand.purple,
  } as TextStyle,
  timeText: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginLeft: 'auto',
  } as TextStyle,
});

export default memo(MissionProgressMini);
