import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { triggerImpact } from '@/utils/haptics';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { BRAND } from '@/constants/brand';
import { Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import { colors as themeColors } from '@/constants/theme';

interface PaymentBottomSheetProps {
  totalPayable: number;
  redemptionBenefit: number;
  totalWalletBalance: number;
  hasServiceItems: boolean;
  canCheckout: boolean;
  loading: boolean;
  paymentExpanded: boolean;
  currencySymbol: string;
  onToggleExpanded: () => void;
  onPaymentSelect: (method: 'cod' | 'wallet' | 'razorpay') => void;
}

function PaymentBottomSheet({
  totalPayable,
  redemptionBenefit,
  totalWalletBalance,
  hasServiceItems,
  canCheckout,
  loading,
  paymentExpanded,
  currencySymbol,
  onToggleExpanded,
  onPaymentSelect,
}: PaymentBottomSheetProps) {
  const { colors } = useTheme();
  const finalAmount = Math.max(0, totalPayable - redemptionBenefit).toFixed(0);

  return (
    <View style={styles.paymentBottomSheet}>
      {/* Main Pay Button - Always Visible */}
      <Pressable style={styles.payNowBar} onPress={() => { triggerImpact('Medium'); onToggleExpanded(); }} accessibilityLabel="Payment total" accessibilityRole="button" accessibilityHint={`${paymentExpanded ? 'Collapse' : 'Expand'} payment options`}>
        <View style={styles.payNowLeft}>
          <ThemedText style={styles.payNowAmount}>{currencySymbol}{finalAmount}</ThemedText>
          <ThemedText style={styles.payNowLabel}>Total Amount</ThemedText>
        </View>
        <View style={styles.payNowRight}>
          <View style={styles.payNowButton}>
            <ThemedText style={styles.payNowButtonText}>
              {paymentExpanded ? 'Close' : 'Place Order'}
            </ThemedText>
            <Ionicons
              name={paymentExpanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color="white"
            />
          </View>
        </View>
      </Pressable>

      {/* Expandable Payment Options */}
      {paymentExpanded && (
        <View style={styles.paymentOptionsContainer}>
          <View style={styles.paymentDragIndicator} />

          <ThemedText style={styles.paymentOptionsTitle}>Choose Payment Method</ThemedText>

          {/* Quick Pay Options */}
          <View style={styles.quickPayOptions}>
            {/* Wallet */}
            <Pressable
              style={[
                styles.quickPayCard,
                (totalWalletBalance < totalPayable || !canCheckout) && styles.quickPayDisabled,
              ]}
              onPress={() => { triggerImpact('Heavy'); onPaymentSelect('wallet'); }}
              disabled={loading || totalWalletBalance < totalPayable || !canCheckout}
              accessibilityLabel="Pay with wallet"
              accessibilityRole="button"
              accessibilityHint={`Available balance: ${totalWalletBalance} coins`}
            >
              <View style={[styles.quickPayIcon, { backgroundColor: colors.nileBlue }]}>
                <CachedImage
                  source={BRAND.COIN_IMAGE}
                  style={styles.coinIconMedium}
                  contentFit="contain"
                />
              </View>
              <ThemedText style={styles.quickPayLabel}>Wallet</ThemedText>
              <ThemedText style={styles.quickPayBalance}>{totalWalletBalance} RC</ThemedText>
            </Pressable>

            {/* COD */}
            <Pressable
              style={[
                styles.quickPayCard,
                (hasServiceItems || !canCheckout) && styles.quickPayDisabled,
              ]}
              onPress={() => { triggerImpact('Heavy'); onPaymentSelect('cod'); }}
              disabled={loading || !canCheckout || hasServiceItems}
              accessibilityLabel="Cash on delivery"
              accessibilityRole="button"
              accessibilityHint="Pay when your order arrives"
            >
              <View style={[styles.quickPayIcon, { backgroundColor: hasServiceItems ? colors.neutral[400] : colors.warningScale[400] }]}>
                <Ionicons name="cash" size={20} color="white" />
              </View>
              <ThemedText style={styles.quickPayLabel}>COD</ThemedText>
              <ThemedText style={styles.quickPayBalance}>{hasServiceItems ? 'N/A' : 'Pay Later'}</ThemedText>
            </Pressable>
          </View>

          {/* Other Payment Button */}
          {/* OG-002 FIX: Disable while loading to prevent double-tap / reconnect re-submission */}
          <Pressable
            style={[styles.otherPaymentOption, loading && { opacity: 0.5 }]}
            onPress={() => { if (!loading && canCheckout) { triggerImpact('Heavy'); onPaymentSelect('razorpay'); } }}
            disabled={loading || !canCheckout}
            accessibilityLabel="Other payment methods"
            accessibilityRole="button"
            accessibilityHint="UPI, Credit/Debit Card, or Net Banking"
          >
            <View style={styles.otherPaymentLeft}>
              <Ionicons name="card-outline" size={22} color={colors.neutral[700]} />
              <View style={styles.otherPaymentText}>
                <ThemedText style={styles.otherPaymentTitle}>Other Payment Methods</ThemedText>
                <ThemedText style={styles.otherPaymentSubtitle}>UPI, Credit/Debit Card, Net Banking</ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
          </Pressable>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.gold} />
            <ThemedText style={styles.securityText}>100% Secure Payments</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  paymentBottomSheet: {
    backgroundColor: themeColors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingBottom: 80,
  },
  payNowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    backgroundColor: themeColors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  payNowLeft: {
    flex: 1,
  },
  payNowAmount: {
    ...Typography.h2,
    fontWeight: '800',
    color: themeColors.text.primary,
    letterSpacing: -0.5,
  },
  payNowLabel: {
    ...Typography.bodySmall,
    color: themeColors.text.tertiary,
    marginTop: 2,
  },
  payNowRight: {},
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
    borderRadius: 26,
    gap: 6,
    minHeight: 52,
    backgroundColor: themeColors.nileBlue,
    shadowColor: themeColors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  payNowButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: themeColors.text.inverse,
  },
  paymentOptionsContainer: {
    backgroundColor: themeColors.background.secondary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  paymentDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: themeColors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
  paymentOptionsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: Spacing.base,
  },
  quickPayOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  quickPayCard: {
    flex: 1,
    backgroundColor: themeColors.background.primary,
    borderRadius: BorderRadius.md,
    padding: 14,
    alignItems: 'center',
    ...Shadows.subtle,
  },
  quickPayDisabled: {
    opacity: 0.5,
  },
  quickPayIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickPayLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 2,
  },
  quickPayBalance: {
    fontSize: 11,
    color: themeColors.text.tertiary,
  },
  coinIconMedium: {
    width: 24,
    height: 24,
  },
  otherPaymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeColors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  otherPaymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  otherPaymentText: {},
  otherPaymentTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  otherPaymentSubtitle: {
    ...Typography.bodySmall,
    color: themeColors.text.tertiary,
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
  },
  securityText: {
    ...Typography.bodySmall,
    color: themeColors.text.tertiary,
    fontWeight: '500',
  },
});

export default React.memo(PaymentBottomSheet);
