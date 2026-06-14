/**
 * BundlesUpsellCard Component
 *
 * Eye-catching card component to upsell bundles when user has low coins.
 * Features gradient background, savings percentage, and CTA button.
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
import { Bundle, getBundleSavings, getBundleDisplayTitle } from './bundleUtils';

// =============================================================================
// PROPS
// =============================================================================

export interface BundlesUpsellCardProps {
  bundle: Bundle;
  userCoins: number;
  onPress?: () => void;
  style?: ViewStyle;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BundlesUpsellCard({
  bundle,
  userCoins,
  onPress,
  style,
}: BundlesUpsellCardProps) {
  const router = useRouter();
  const savings = getBundleSavings(bundle);
  const displayTitle = getBundleDisplayTitle(bundle);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/try/bundles');
    }
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [
      styles.container,
      pressed && styles.pressed,
      style,
    ]}>
      <LinearGradient
        colors={[colors.nileBlue, '#2A5577'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={20} color={colors.lightMustard} />
          </View>
          <Text style={styles.headerText}>SAVE WITH BUNDLES</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.title}>
            {displayTitle} for {'₹'}{bundle.price}
          </Text>
          <Text style={styles.savings}>
            Save {savings.percentage}%
          </Text>
        </View>

        {/* Bonus Info */}
        {bundle.rezCoinsBonus > 0 && (
          <View style={styles.bonusContainer}>
            <Ionicons name="gift" size={14} color={colors.lightPeach} />
            <Text style={styles.bonusText}>
              Includes {bundle.rezCoinsBonus} bonus coins
            </Text>
          </View>
        )}

        {/* CTA Button */}
        <View style={styles.ctaContainer}>
          <LinearGradient
            colors={[colors.lightMustard, '#E6B84E'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>View Bundle</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.nileBlue} />
          </LinearGradient>
        </View>

        {/* Coins Info */}
        <View style={styles.coinsInfo}>
          <Text style={styles.coinsInfoText}>
            You have {userCoins} coins
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.base,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.strong,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  gradient: {
    padding: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  headerText: {
    ...typography.overline,
    color: colors.lightMustard,
    letterSpacing: 1.5,
  },

  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },

  title: {
    ...typography.h3,
    color: colors.text.white,
    marginRight: spacing.md,
  },

  savings: {
    ...typography.label,
    color: colors.lightMustard,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },

  // Bonus
  bonusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  bonusText: {
    ...typography.bodySmall,
    color: colors.lightPeach,
    marginLeft: spacing.xs,
  },

  // CTA
  ctaContainer: {
    marginBottom: spacing.sm,
  },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },

  ctaText: {
    ...typography.button,
    color: colors.nileBlue,
    marginRight: spacing.xs,
  },

  // Coins Info
  coinsInfo: {
    alignItems: 'center',
  },

  coinsInfoText: {
    ...typography.caption,
    color: colors.gray[400],
  },
});

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default BundlesUpsellCard;
