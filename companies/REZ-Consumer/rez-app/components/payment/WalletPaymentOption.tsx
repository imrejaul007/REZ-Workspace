/**
 * Wallet Payment Option
 *
 * Third-party wallet payment option (Paytm, Amazon Pay, Mobikwik)
 * Premium REZ design palette
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalWallet } from '@/types/storePayment.types';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

interface WalletPaymentOptionProps {
  wallet: ExternalWallet;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const WalletPaymentOption: React.FC<WalletPaymentOptionProps> = ({
  wallet,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  return (
    <Pressable
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        disabled && styles.containerDisabled,
      ]}
      onPress={onSelect}
      disabled={disabled}
     
    >
      {/* Selected State Gradient Border Effect */}
      {isSelected && (
        <LinearGradient
          colors={[colors.rez.mustard, colors.rez.peach]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.selectedGradientBorder}
        />
      )}

      <View style={[styles.iconContainer, { backgroundColor: wallet.color + '20' }]}>
        <Ionicons name={wallet.icon as unknown} size={20} color={wallet.color} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.walletName, disabled ? styles.textDisabled : null]}>
          {wallet.name}
        </Text>
        {wallet.isLinked ? (
          <View style={styles.linkedRow}>
            <View style={styles.linkedBadge}>
              <Ionicons name="checkmark-circle" size={10} color={colors.rez.mustard} />
              <Text style={styles.linkedText}>
                {wallet.linkedPhone || wallet.linkedEmail || 'Linked'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.linkText}>Tap to link</Text>
        )}
      </View>

      {wallet.balance !== undefined && wallet.isLinked && (
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balance, { color: wallet.color }]}>
            {currencySymbol}{wallet.balance}
          </Text>
        </View>
      )}

      {isSelected ? (
        <LinearGradient
          colors={[colors.rez.mustard, colors.rez.peach]}
          style={styles.checkmarkWrapper}
        >
          <Ionicons name="checkmark" size={14} color={colors.rez.nileBlue} />
        </LinearGradient>
      ) : wallet.isLinked ? (
        <View style={styles.radioOuter}>
          <View style={styles.radioInner} />
        </View>
      ) : (
        <View style={styles.addIconWrapper}>
          <Ionicons name="add" size={16} color={colors.rez.mustard} />
        </View>
      )}

      {!wallet.isLinked && (
        <LinearGradient
          colors={[colors.rez.lavender, colors.rez.linen]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.comingSoonBadge}
        >
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </LinearGradient>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.rez.linen,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.rez.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerSelected: {
    borderColor: colors.rez.mustard,
    backgroundColor: colors.rez.linen,
  },
  selectedGradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContainer: {
    flex: 1,
  },
  walletName: {
    ...typography.button,
    color: colors.rez.nileBlue,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.text.tertiary,
  },
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 87, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  linkedText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.rez.nileBlue,
    fontWeight: '500',
  },
  linkText: {
    ...typography.caption,
    color: colors.rez.mustard,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceContainer: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  balanceLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balance: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  checkmarkWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.rez.peach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rez.linen,
  },
  addIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 205, 87, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.rez.peach,
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.rez.nileBlue,
  },
});

export default React.memo(WalletPaymentOption);
