/**
 * CampaignBanner Component
 *
 * Displays an active campaign at the top of the feed.
 * Shows campaign title, description, progress, and navigates to campaigns page.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import {
  Campaign,
  getCampaignProgress,
  getCampaignBadge,
  getCampaignTypeColor,
  formatEndDate,
  getUrgencyColor,
} from './campaignUtils';

// =============================================================================
// PROPS
// =============================================================================

export interface CampaignBannerProps {
  campaign: Campaign;
  onPress?: () => void;
  style?: ViewStyle;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CampaignBanner({
  campaign,
  onPress,
  style,
}: CampaignBannerProps) {
  const router = useRouter();
  const progress = getCampaignProgress(campaign);
  const badge = getCampaignBadge(campaign);
  const typeColor = getCampaignTypeColor(campaign);
  const endDateText = formatEndDate(campaign);
  const urgencyColor = getUrgencyColor(campaign);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/try/campaigns');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        style,
      ]}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          typeColor,
          typeColor === colors.brand.purple
            ? colors.brand.purpleLight
            : colors.nileBlue,
        ] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Badge Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.badgeText}>{badge}</Text>
            <Text style={styles.badgeLabel}>{campaign.type.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
            <Ionicons name="time" size={10} color={colors.text.white} />
            <Text style={styles.urgencyText}>{endDateText}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {campaign.title}
        </Text>

        {/* Description */}
        {campaign.description && (
          <Text style={styles.description} numberOfLines={2}>
            {campaign.description}
          </Text>
        )}

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressText}>
              {progress.completed}/{progress.target}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress.percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
          </View>
        </View>

        {/* Reward Section */}
        <View style={styles.rewardSection}>
          <View style={styles.rewardContainer}>
            <Ionicons name="gift" size={14} color={colors.lightMustard} />
            <Text style={styles.rewardLabel}>Reward:</Text>
            <Text style={styles.rewardText}>{campaign.reward}</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>Continue Campaign</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.white} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// =============================================================================
// ALTERNATIVE: COMPACT BANNER
// =============================================================================

export interface CompactCampaignBannerProps {
  campaign: Campaign;
  onPress?: () => void;
  style?: ViewStyle;
}

/**
 * Compact version of CampaignBanner for inline display.
 */
export function CompactCampaignBanner({
  campaign,
  onPress,
  style,
}: CompactCampaignBannerProps) {
  const router = useRouter();
  const progress = getCampaignProgress(campaign);
  const badge = getCampaignBadge(campaign);
  const typeColor = getCampaignTypeColor(campaign);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/try/campaigns');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.compactContainer,
        pressed && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={[typeColor, `${typeColor}CC`] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.compactGradient}
      >
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Text style={styles.compactBadge}>{badge}</Text>
            <View style={styles.compactTextContainer}>
              <Text style={styles.compactTitle} numberOfLines={1}>
                {campaign.title}
              </Text>
              <Text style={styles.compactProgress}>
                {progress.percentage}% complete
              </Text>
            </View>
          </View>

          <View style={styles.compactRight}>
            <View style={styles.compactProgressCircle}>
              <Text style={styles.compactProgressCircleText}>
                {progress.percentage}%
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.white} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Full Banner
  container: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.strong,
  },

  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },

  gradient: {
    padding: spacing.lg,
  },

  // Badge Row
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },

  badgeText: {
    fontSize: 12,
    marginRight: spacing.xs,
  },

  badgeLabel: {
    ...typography.labelSmall,
    color: colors.text.white,
    textTransform: 'capitalize',
  },

  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },

  urgencyText: {
    ...typography.caption,
    color: colors.text.white,
    marginLeft: spacing.xs,
  },

  // Title & Description
  title: {
    ...typography.h3,
    color: colors.text.white,
    marginBottom: spacing.xs,
  },

  description: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.md,
  },

  // Progress Section
  progressSection: {
    marginBottom: spacing.md,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  progressLabel: {
    ...typography.labelSmall,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  progressText: {
    ...typography.labelSmall,
    color: colors.text.white,
  },

  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: colors.lightMustard,
    borderRadius: borderRadius.full,
  },

  progressPercentage: {
    ...typography.labelSmall,
    color: colors.lightMustard,
    minWidth: 36,
    textAlign: 'right',
  },

  // Reward Section
  rewardSection: {
    marginBottom: spacing.md,
  },

  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },

  rewardLabel: {
    ...typography.labelSmall,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: spacing.xs,
  },

  rewardText: {
    ...typography.label,
    color: colors.lightMustard,
    marginLeft: spacing.xs,
  },

  // CTA
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaText: {
    ...typography.button,
    color: colors.text.white,
    marginRight: spacing.xs,
  },

  // Compact Banner
  compactContainer: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },

  compactGradient: {
    padding: spacing.md,
  },

  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  compactBadge: {
    fontSize: 16,
    marginRight: spacing.sm,
  },

  compactTextContainer: {
    flex: 1,
  },

  compactTitle: {
    ...typography.label,
    color: colors.text.white,
  },

  compactProgress: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  compactProgressCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  compactProgressCircleText: {
    ...typography.labelSmall,
    color: colors.text.white,
  },
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default CampaignBanner;
