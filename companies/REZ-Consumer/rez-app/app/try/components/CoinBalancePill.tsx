// @ts-nocheck
/**
 * ReZ Try - Coin Balance Pill Component
 *
 * Displays coin balance in header with tiered visibility:
 * - low: "120 coins Buy" (prominent, gradient background)
 * - medium: "340 coins" (normal, subtle background)
 * - high: "1.2k" (minimal, text only)
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, borderRadius, spacing, typography } from '@/constants/theme';
import { formatCoins, getCoinTier, type CoinTier } from './coinUtils';

export interface CoinBalancePillProps {
  /** Current coin balance */
  balance: number;
  /** Optional callback when pressed */
  onPress?: () => void;
  /** Compact mode (smaller pill) */
  compact?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Show coin icon */
  showIcon?: boolean;
  /** Show balance text (false for icon-only mode) */
  showBalance?: boolean;
}

// ============================================================================
// THEME CONFIGURATION BY TIER
// ============================================================================

const TIER_CONFIG = {
  low: {
    backgroundColors: gradients.gold as [string, string, string],
    textColor: colors.nileBlue,
    borderColor: colors.primary[300],
    iconColor: colors.nileBlue,
    showBuyButton: true,
    size: 'large' as const,
  },
  medium: {
    backgroundColors: [colors.background.accent, colors.background.accentLight] as [string, string],
    textColor: colors.text.primary,
    borderColor: colors.border.accent,
    iconColor: colors.gold,
    showBuyButton: false,
    size: 'medium' as const,
  },
  high: {
    backgroundColors: ['transparent', 'transparent'] as [string, string],
    textColor: colors.text.secondary,
    borderColor: 'transparent',
    iconColor: colors.text.tertiary,
    showBuyButton: false,
    size: 'small' as const,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

const CoinBalancePill: React.FC<CoinBalancePillProps> = ({
  balance,
  onPress,
  compact = false,
  style,
  showIcon = true,
  showBalance = true,
}) => {
  const router = useRouter();
  const tier = getCoinTier(balance);
  const config = TIER_CONFIG[tier];

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      // Default: navigate to coins page
      router.push('/try/coins');
    }
  }, [onPress, router]);

  // Size variants
  const isCompact = compact || tier === 'high';
  const isSmall = tier === 'high' || (compact && tier !== 'low');

  // Coin icon
  const CoinIcon = () => (
    <Ionicons
      name="logo-usd"
      size={isSmall ? 14 : 16}
      color={config.iconColor}
      style={styles.coinIcon}
    />
  );

  // Balance text
  const BalanceText = () => {
    if (!showBalance) return null;

    const formattedBalance = formatCoins(balance);

    if (tier === 'low' && config.showBuyButton) {
      return (
        <View style={styles.lowBalanceRow}>
          <Text
            style={[
              styles.balanceText,
              { color: config.textColor },
              isCompact && styles.balanceTextCompact,
            ]}
          >
            {formattedBalance}
          </Text>
          <LinearGradient
            colors={config.backgroundColors as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyBadge}
          >
            <Text style={[styles.buyText, { color: colors.nileBlue }]}>
              Buy
            </Text>
          </LinearGradient>
        </View>
      );
    }

    return (
      <Text
        style={[
          styles.balanceText,
          { color: config.textColor },
          isCompact && styles.balanceTextCompact,
        ]}
      >
        {formattedBalance}
      </Text>
    );
  };

  // Render based on tier visibility
  const renderContent = () => (
    <View style={styles.contentRow}>
      {showIcon && <CoinIcon />}
      <BalanceText />
    </View>
  );

  // High tier: minimal text-only display
  if (tier === 'high') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pillBase,
          styles.pillHigh,
          pressed && styles.pressed,
          style,
        ]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {renderContent()}
      </Pressable>
    );
  }

  // Medium tier: subtle background
  if (tier === 'medium') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pillBase,
          styles.pillMedium,
          { backgroundColor: config.backgroundColors[0] },
          { borderColor: config.borderColor },
          pressed && styles.pressed,
          style,
        ]}
      >
        {renderContent()}
      </Pressable>
    );
  }

  // Low tier: prominent gradient with buy CTA
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pillBase,
        styles.pillLow,
        pressed && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={config.backgroundColors as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBackground}
      >
        {renderContent()}
      </LinearGradient>
    </Pressable>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Base pill styles
  pillBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },

  pillHigh: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
  },

  pillMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },

  pillLow: {
    paddingLeft: 2,
    paddingRight: 2,
    paddingVertical: 2,
  },

  // Content layout
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  coinIcon: {
    marginRight: spacing.xs,
  },

  balanceText: {
    ...typography.label,
    fontWeight: '600',
  },

  balanceTextCompact: {
    fontSize: 12,
  },

  // Low tier specific
  lowBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  gradientBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full - 2,
  },

  buyBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },

  buyText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },

  // Pressed state
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export { CoinBalancePill };
export type { CoinBalancePillProps, CoinTier };

export default memo(CoinBalancePill);
