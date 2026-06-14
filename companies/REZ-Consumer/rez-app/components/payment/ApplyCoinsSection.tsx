// @ts-nocheck
/**
 * Apply Coins Section
 *
 * Container for all coin toggles with auto-optimization badge
 * Premium REZ design palette
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppliedCoins } from '@/types/storePayment.types';
import CoinToggleRow from './CoinToggleRow';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { BRAND } from '@/constants/brand';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

interface ApplyCoinsSectionProps {
  appliedCoins: AppliedCoins;
  maxCoinRedemptionPercent: number;
  billAmount: number;
  isAutoOptimized: boolean;
  category?: string; // MainCategory slug for category-specific coin display
  onCoinToggle: (coinType: 'rez' | 'promo' | 'branded', enabled: boolean) => void;
  onCoinAmountChange: (coinType: 'rez' | 'promo' | 'branded', amount: number) => void;
  onAutoOptimize: () => void;
}

export const ApplyCoinsSection: React.FC<ApplyCoinsSectionProps> = ({
  appliedCoins,
  maxCoinRedemptionPercent,
  billAmount,
  isAutoOptimized,
  onCoinToggle,
  onCoinAmountChange,
  onAutoOptimize,
}) => {
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const maxCoinsAllowed = Math.floor((billAmount * maxCoinRedemptionPercent) / 100);

  // Defensive null checks for coin data
  const rezCoins = appliedCoins?.rezCoins || { available: 0, using: 0, enabled: false };
  const promoCoins = appliedCoins?.promoCoins || { available: 0, using: 0, enabled: false, expiringToday: false };
  const brandedCoins = appliedCoins?.brandedCoins;

  const totalAvailable =
    (rezCoins.available || 0) +
    (promoCoins.available || 0) +
    (brandedCoins?.available || 0);

  // Calculate max usable for each coin type considering others
  const getMaxUsable = (coinType: 'rez' | 'promo' | 'branded'): number => {
    const otherCoinsUsed =
      (coinType !== 'rez' ? (rezCoins.using || 0) : 0) +
      (coinType !== 'promo' ? (promoCoins.using || 0) : 0) +
      (coinType !== 'branded' ? (brandedCoins?.using || 0) : 0);

    const remaining = maxCoinsAllowed - otherCoinsUsed;

    switch (coinType) {
      case 'rez':
        return Math.min(rezCoins.available || 0, Math.max(0, remaining));
      case 'promo':
        return Math.min(promoCoins.available || 0, Math.max(0, remaining));
      case 'branded':
        return Math.min(brandedCoins?.available || 0, Math.max(0, remaining));
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.headerIconWrapper}>
              <CachedImage
                source={BRAND.COIN_IMAGE}
                style={styles.headerCoinIcon}
                contentFit="contain"
                transition={200}
              />
            </View>
            <Text style={styles.sectionTitle}>Use Your Coins</Text>
          </View>

          {/* Auto-Optimize Button */}
          <Pressable
            style={styles.autoOptimizeButton}
            onPress={onAutoOptimize}
           
          >
            <LinearGradient
              colors={isAutoOptimized
                ? [colors.rez.mustard, colors.rez.peach]
                : [colors.rez.lavender, colors.background.primary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.autoOptimizeGradient}
            >
              <Ionicons
                name={isAutoOptimized ? 'checkmark-circle' : 'sparkles'}
                size={14}
                color={isAutoOptimized ? colors.rez.nileBlue : colors.rez.mustard}
              />
              <Text style={[
                styles.autoOptimizeText,
                isAutoOptimized && styles.autoOptimizeActiveText
              ]}>
                {isAutoOptimized ? 'Auto-optimized' : 'Auto-optimize'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Use up to {maxCoinRedemptionPercent}% of your bill ({currencySymbol}{maxCoinsAllowed}) with coins
        </Text>

        {totalAvailable === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="wallet-outline" size={32} color={colors.rez.nileBlue} />
            </View>
            <Text style={styles.emptyText}>No coins available</Text>
            <Text style={styles.emptySubtext}>Earn coins by making purchases!</Text>
          </View>
        ) : (
          <View style={styles.coinsContainer}>
            {/* Promo Coins - First priority (limited-time, max 20% cap) */}
            {(promoCoins.available || 0) > 0 && (
              <CoinToggleRow
                type="promo"
                name="Promo Coins"
                available={promoCoins.available || 0}
                using={promoCoins.using || 0}
                enabled={promoCoins.enabled || false}
                maxUsable={getMaxUsable('promo')}
                expiringToday={promoCoins.expiringToday || false}
                expiresIn={(promoCoins as unknown).expiresIn}
                redemptionCap={(promoCoins as unknown).redemptionCap || 20}
                onToggle={(enabled) => onCoinToggle('promo', enabled)}
                onAmountChange={(amount) => onCoinAmountChange('promo', amount)}
              />
            )}

            {/* Branded/Store Coins - Second priority (store-specific, no expiry) */}
            {brandedCoins && (brandedCoins.available || 0) > 0 && (
              <CoinToggleRow
                type="branded"
                name={`${brandedCoins.storeName || 'Store'} Coins`}
                available={brandedCoins.available || 0}
                using={brandedCoins.using || 0}
                enabled={brandedCoins.enabled || false}
                maxUsable={getMaxUsable('branded')}
                storeName={brandedCoins.storeName}
                onToggle={(enabled) => onCoinToggle('branded', enabled)}
                onAmountChange={(amount) => onCoinAmountChange('branded', amount)}
              />
            )}

            {/* REZ Coins - Third priority (universal, no cap) */}
            {(rezCoins.available || 0) > 0 && (
              <CoinToggleRow
                type="rez"
                name={BRAND.COIN_NAME}
                available={rezCoins.available || 0}
                using={rezCoins.using || 0}
                enabled={rezCoins.enabled || false}
                maxUsable={getMaxUsable('rez')}
                onToggle={(enabled) => onCoinToggle('rez', enabled)}
                onAmountChange={(amount) => onCoinAmountChange('rez', amount)}
              />
            )}
          </View>
        )}

        {/* Coins Applied Total Banner */}
        {(appliedCoins?.totalApplied || 0) > 0 && (
          <LinearGradient
            colors={[colors.rez.lavender, colors.rez.linen]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.appliedBanner}
          >
            <View style={styles.appliedIconWrapper}>
              <Ionicons name="checkmark-circle" size={18} color={colors.rez.mustard} />
            </View>
            <Text style={styles.appliedText}>
              Coins Applied: <Text style={styles.appliedAmount}>{currencySymbol}{appliedCoins?.totalApplied || 0}</Text>
            </Text>
          </LinearGradient>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.rez.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.rez.linen,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.rez.linen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCoinIcon: {
    width: 24,
    height: 24,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.rez.nileBlue,
    fontWeight: '700',
  },
  autoOptimizeButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  autoOptimizeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.rez.peach,
    gap: 4,
  },
  autoOptimizeText: {
    ...typography.caption,
    color: colors.rez.nileBlue,
    fontWeight: '600',
  },
  autoOptimizeActiveText: {
    color: colors.rez.nileBlue,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  coinsContainer: {
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.rez.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.rez.nileBlue,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  appliedIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedText: {
    ...typography.body,
    color: colors.rez.nileBlue,
  },
  appliedAmount: {
    fontWeight: '700',
  },
});

export default React.memo(ApplyCoinsSection);
