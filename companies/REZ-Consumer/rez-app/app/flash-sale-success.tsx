// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import logger from '@/utils/logger';
// Flash Sale Success Page
// Shows voucher code after successful Razorpay payment

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { DetailPageSkeleton } from '@/components/skeletons';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import realOffersApi from '@/services/realOffersApi';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const { width: screenWidth } = Dimensions.get('window');

function FlashSaleSuccessPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const { purchaseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = useLocalSearchParams<unknown>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [promoCode, setPromoCode] = useState<string | undefined>();
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const MAX_RETRIES = 3;

  // Animation
  const scaleAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);
  const scaleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));
  const fadeAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    if (purchaseId && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      verifyPayment();
    } else {
      setError('Missing payment information');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId, razorpay_order_id, razorpay_payment_id, razorpay_signature]);

  const verifyPayment = async (attempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await realOffersApi.verifyFlashSalePayment({
        purchaseId: purchaseId!,
        razorpayOrderId: razorpay_order_id!,
        razorpayPaymentId: razorpay_payment_id!,
        razorpaySignature: razorpay_signature!,
      });

      if (response.success && response.data) {
        if (!isMounted()) return;
        setVoucherCode(response.data.voucherCode);
        if (!isMounted()) return;
        setPromoCode(response.data.promoCode);
        if (!isMounted()) return;
        setExpiresAt(response.data.expiresAt);
        if (!isMounted()) return;
        setAmount(response.data.amount);

        // Animate success
        scaleAnim.value = withSpring(1, { damping: 7, stiffness: 50 });
        fadeAnim.value = withTiming(1, { duration: 300 });

        // NA-MED-17 FIX: Add haptic feedback on successful payment (mirrors payment-success.tsx)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((err) => {
          logger.debug('Haptic feedback unavailable', { error: err?.message }, 'FlashSaleSuccess');
        });
      } else {
        // Retry on transient failures (network hiccup, backend still processing)
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          logger.warn(`[FlashSaleSuccess] Verification attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (!isMounted()) return;
          setRetryCount(attempt + 1);
          return verifyPayment(attempt + 1);
        }
        if (!isMounted()) return;
        setError(response.message || 'Payment verification failed. Please try again or contact support.');
      }
    } catch (err) {
      logger.error('Error verifying flash sale payment:', err);
      // Retry on network errors
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (!isMounted()) return;
        setRetryCount(attempt + 1);
        return verifyPayment(attempt + 1);
      }
      if (!isMounted()) return;
      setError(err.message || 'Failed to verify payment. Please check My Purchases.');
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    if (!isMounted()) return;
    setCopiedCode(true);
    if (!isMounted()) return;
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <DetailPageSkeleton />
        {retryCount > 0 && (
          <View style={styles.retryingBanner}>
            <ThemedText style={styles.retryingText}>
              Retrying… attempt {retryCount + 1}/{MAX_RETRIES + 1}
            </ThemedText>
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={80} color={Colors.error} />
          </View>
          <ThemedText style={styles.errorTitle}>Verification Issue</ThemedText>
          <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          {retryCount > 0 && (
            <ThemedText style={styles.retryCountText}>
              Tried {retryCount}/{MAX_RETRIES} times automatically
            </ThemedText>
          )}
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setRetryCount(0);
              verifyPayment(0);
            }}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.retryButton, styles.secondaryErrorButton]}
            onPress={() => router.replace('/offers')}
          >
            <ThemedText style={[styles.retryButtonText, styles.secondaryErrorButtonText]}>Back to Offers</ThemedText>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[colors.successScale[400], colors.successScale[700]]} style={styles.successGradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Success Icon */}
          <Animated.View style={[styles.successIconContainer, scaleAnimStyle]}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={60} color={Colors.success} />
            </View>
          </Animated.View>

          {/* Success Message */}
          <Animated.View style={[styles.contentContainer, fadeAnimStyle]} pointerEvents="box-none">
            <ThemedText style={styles.successTitle}>Payment Successful!</ThemedText>
            <ThemedText style={styles.successSubtitle}>Your deal has been claimed</ThemedText>

            {/* Amount Paid */}
            <View style={styles.amountCard}>
              <ThemedText style={styles.amountLabel}>Amount Paid</ThemedText>
              <ThemedText style={styles.amountValue}>
                {currencySymbol}
                {amount}
              </ThemedText>
            </View>

            {/* Voucher Code Card */}
            <View style={styles.voucherCard}>
              <View style={styles.voucherHeader}>
                <Ionicons name="ticket" size={24} color={Colors.brand.purple} />
                <ThemedText style={styles.voucherLabel}>Your Voucher Code</ThemedText>
              </View>
              <Pressable style={styles.voucherCodeBox} onPress={() => handleCopyCode(voucherCode)}>
                <ThemedText style={styles.voucherCode}>{voucherCode}</ThemedText>
                <View style={styles.copyIcon}>
                  <Ionicons name={copiedCode ? 'checkmark' : 'copy'} size={20} color={Colors.brand.purple} />
                </View>
              </Pressable>
              {copiedCode && <ThemedText style={styles.copiedText}>Copied to clipboard!</ThemedText>}

              {/* Promo Code (if exists) */}
              {promoCode && (
                <View style={styles.promoCodeSection}>
                  <ThemedText style={styles.promoLabel}>Promo Code</ThemedText>
                  <Pressable style={styles.promoCodeBox} onPress={() => handleCopyCode(promoCode)}>
                    <ThemedText style={styles.promoCode}>{promoCode}</ThemedText>
                    <Ionicons name="copy-outline" size={18} color={colors.text.tertiary} />
                  </Pressable>
                </View>
              )}

              {/* Expiry Date */}
              <View style={styles.expirySection}>
                <Ionicons name="calendar-outline" size={18} color={colors.text.tertiary} />
                <ThemedText style={styles.expiryText}>Valid until {formatDate(expiresAt)}</ThemedText>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <ThemedText style={styles.instructionsTitle}>How to use</ThemedText>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>1</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>Visit the store and show this voucher code</ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>2</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>The store will verify and apply your discount</ThemedText>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <ThemedText style={styles.instructionNumberText}>3</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>Enjoy your deal before it expires!</ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Pressable style={styles.primaryButton} onPress={() => router.replace('/offers')}>
                <LinearGradient
                  colors={[colors.brand.purpleLight, colors.brand.purple]}
                  style={styles.primaryButtonGradient}
                >
                  <ThemedText style={styles.primaryButtonText}>Browse More Deals</ThemedText>
                </LinearGradient>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={() => router.push('/my-vouchers' as unknown as string)}>
                <ThemedText style={styles.secondaryButtonText}>View My Vouchers</ThemedText>
              </Pressable>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.inverse,
    ...Typography.h4,
    marginTop: Spacing.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: colors.background.secondary,
  },
  errorIcon: {
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h2,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.bodyLarge,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  retryButton: {
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  retryCountText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  secondaryErrorButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.brand.purple,
  },
  secondaryErrorButtonText: {
    color: Colors.brand.purple,
  },
  retryingBanner: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retryingText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  successGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    padding: Spacing.xl,
  },
  successIconContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
  },
  successTitle: {
    ...Typography.h1,
    fontWeight: '800',
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  amountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.inverse,
  },
  voucherCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  voucherLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  voucherCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tint.amberLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 2,
    borderColor: colors.warningScale[400],
    borderStyle: 'dashed',
  },
  voucherCode: {
    ...Typography.h2,
    fontWeight: '800',
    color: colors.brand.amberDark,
    letterSpacing: 2,
  },
  copyIcon: {
    backgroundColor: colors.background.primary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  copiedText: {
    ...Typography.bodySmall,
    color: Colors.success,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  promoCodeSection: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  promoLabel: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  promoCode: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  expirySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  expiryText: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginLeft: Spacing.sm,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  instructionsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.inverse,
    marginBottom: Spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  instructionNumberText: {
    ...Typography.bodySmall,
    fontWeight: '800',
    color: Colors.success,
  },
  instructionText: {
    flex: 1,
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  primaryButton: {
    marginBottom: Spacing.md,
  },
  primaryButtonGradient: {
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: BorderRadius.md,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
});

export default withErrorBoundary(FlashSaleSuccessPage, 'FlashSaleSuccess');
