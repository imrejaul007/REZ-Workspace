// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Lock Deal Confirm Page
// Verifies Razorpay signature on backend and shows lock confirmation
// with pickup code (deposit) or balance-paid confirmation.

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '@/components/ThemedText';
import lockDealApi, { ConfirmLockResponse, ConfirmBalanceResponse } from '@/services/lockDealApi';
import logger from '@/utils/logger';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { DetailPageSkeleton } from '@/components/skeletons';

const { width: screenWidth } = Dimensions.get('window');
const MAX_RETRIES = 3;

function LockConfirmPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentType, dealId, lockId } =
    useLocalSearchParams<unknown>();

  const isBalancePayment = paymentType === 'balance';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pickupCode, setPickupCode] = useState<string>('');
  const [dealTitle, setDealTitle] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [lockRewardEarned, setLockRewardEarned] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Animations
  const scaleAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);
  const scaleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));
  const fadeAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  useEffect(() => {
    const hasParams = razorpay_order_id && razorpay_payment_id && razorpay_signature;
    const hasTarget = isBalancePayment ? !!lockId : !!dealId;
    if (hasParams && hasTarget) {
      confirmPayment();
    } else {
      setError('Missing payment information');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentType, dealId, lockId]);

  const confirmPayment = async (attempt = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      if (isBalancePayment) {
        // Confirm balance payment
        const response = await lockDealApi.confirmBalancePayment(
          lockId!,
          razorpay_order_id!,
          razorpay_payment_id!,
          razorpay_signature!,
        );

        if (!isMounted()) return;

        if (response?.data?.userLockDeal) {
          const lock = response.data.userLockDeal;
          setPickupCode(lock.pickupCode);
          setDealTitle(lock.dealSnapshot?.title || 'Your Deal');
          playSuccessAnimation();
        } else {
          throw new Error(response?.error || 'Confirmation failed');
        }
      } else {
        // Confirm deposit / lock deal
        const response = await lockDealApi.confirmLock(
          dealId!,
          razorpay_order_id!,
          razorpay_payment_id!,
          razorpay_signature!,
        );

        if (!isMounted()) return;

        if (response?.data?.userLockDeal) {
          const lock = response.data.userLockDeal;
          setPickupCode(lock.pickupCode);
          setDealTitle(lock.dealSnapshot?.title || 'Your Deal');
          setExpiresAt(lock.expiresAt || '');
          setLockRewardEarned(lock.lockRewardEarned || 0);
          playSuccessAnimation();
        } else {
          throw new Error(response?.error || 'Lock confirmation failed');
        }
      }

      if (!isMounted()) return;
      setIsLoading(false);
    } catch (err) {
      logger.error('[LOCK CONFIRM] Confirmation error:', err);
      if (!isMounted()) return;

      if (attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => {
          if (!isMounted()) return;
          setRetryCount(attempt + 1);
          confirmPayment(attempt + 1);
        }, delay);
      } else {
        setError(err.message || 'Failed to confirm payment. Your money is safe — please contact support.');
        setIsLoading(false);
      }
    }
  };

  const playSuccessAnimation = () => {
    scaleAnim.value = withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 8 }));
    fadeAnim.value = withTiming(1, { duration: 600 });
  };

  const handleCopyCode = async () => {
    if (pickupCode) {
      await Clipboard.setStringAsync(pickupCode);
      setCopiedCode(true);
      setTimeout(() => {
        if (isMounted()) setCopiedCode(false);
      }, 2000);
    }
  };

  const handleViewMyLocks = () => {
    router.replace('/lock-deals/my-locks' as unknown as string);
  };

  const handleGoHome = () => {
    router.replace('/(tabs)' as unknown);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // ==================== LOADING STATE ====================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0533', '#2d0b6b', '#0f0f23']} style={styles.container}>
          <View style={styles.loadingContainer}>
            <DetailPageSkeleton />
            {retryCount > 0 && (
              <ThemedText style={styles.retryText}>
                Verifying payment... (attempt {retryCount + 1}/{MAX_RETRIES})
              </ThemedText>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ==================== ERROR STATE ====================

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={['#1a0533', '#2d0b6b', '#0f0f23']} style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.error || '#ff4444'} />
            <ThemedText style={styles.errorTitle}>Verification Failed</ThemedText>
            <ThemedText style={styles.errorMessage}>{error}</ThemedText>
            <ThemedText style={styles.errorNote}>
              Your payment was received. If the lock doesn't appear in My Locks within a few minutes, please contact
              support.
            </ThemedText>
            <Pressable style={styles.supportButton} onPress={() => router.push('/support' as unknown as string)}>
              <ThemedText style={styles.supportButtonText}>Contact Support</ThemedText>
            </Pressable>
            <Pressable style={styles.myLocksButton} onPress={handleViewMyLocks}>
              <ThemedText style={styles.myLocksButtonText}>View My Locks</ThemedText>
            </Pressable>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ==================== SUCCESS STATE ====================

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#1a0533', '#2d0b6b', '#0f0f23']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Success Icon */}
          <Animated.View style={[styles.successIconContainer, scaleAnimStyle]}>
            <LinearGradient colors={['#2a5a7c', '#0d2133']} style={styles.successIconGradient}>
              <Ionicons name={isBalancePayment ? 'checkmark-done' : 'lock-closed'} size={48} color="#fff" />
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.content, fadeAnimStyle]}>
            {/* Title */}
            <ThemedText style={styles.title}>{isBalancePayment ? 'Balance Paid!' : 'Deal Locked!'}</ThemedText>
            <ThemedText style={styles.subtitle}>{dealTitle}</ThemedText>

            {/* Reward badge (deposit only) */}
            {!isBalancePayment && lockRewardEarned > 0 && (
              <View style={styles.rewardBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <ThemedText style={styles.rewardText}>+{lockRewardEarned} coins earned!</ThemedText>
              </View>
            )}

            {/* Pickup Code Card */}
            <View style={styles.codeCard}>
              <ThemedText style={styles.codeLabel}>
                {isBalancePayment ? 'Show at Store' : 'Your Pickup Code'}
              </ThemedText>
              <View style={styles.codeRow}>
                <ThemedText style={styles.codeText}>{pickupCode}</ThemedText>
                <Pressable style={styles.copyButton} onPress={handleCopyCode}>
                  <Ionicons
                    name={copiedCode ? 'checkmark' : 'copy-outline'}
                    size={20}
                    color={copiedCode ? Colors.success : colors.brand.purple || '#2a5a7c'}
                  />
                </Pressable>
              </View>
              {copiedCode && <ThemedText style={styles.copiedText}>Copied!</ThemedText>}
            </View>

            {/* Expiry info (deposit only) */}
            {!isBalancePayment && expiresAt && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
                <ThemedText style={styles.infoText}>Pick up by {formatDate(expiresAt)}</ThemedText>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <ThemedText style={styles.instructionsTitle}>
                {isBalancePayment ? "You're all set!" : "What's next?"}
              </ThemedText>
              {isBalancePayment ? (
                <ThemedText style={styles.instructionsText}>
                  Show your pickup code at the store. Your full deal is paid and ready to collect.
                </ThemedText>
              ) : (
                <>
                  <ThemedText style={styles.instructionsText}>1. Visit the store before your expiry date.</ThemedText>
                  <ThemedText style={styles.instructionsText}>2. Pay the remaining balance on arrival.</ThemedText>
                  <ThemedText style={styles.instructionsText}>3. Show this pickup code to claim your deal.</ThemedText>
                </>
              )}
            </View>

            {/* CTA Buttons */}
            <Pressable style={styles.primaryButton} onPress={handleViewMyLocks}>
              <ThemedText style={styles.primaryButtonText}>View My Locks</ThemedText>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleGoHome}>
              <ThemedText style={styles.secondaryButtonText}>Back to Home</ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  retryText: {
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: Spacing.md,
    fontSize: Typography.bodySmall.fontSize,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: Typography.body.fontSize,
    color: '#ff8888',
    textAlign: 'center',
  },
  errorNote: {
    fontSize: Typography.bodySmall.fontSize,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#2a5a7c',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.body.fontSize,
  },
  myLocksButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  myLocksButtonText: {
    color: '#2a5a7c',
    fontWeight: '500',
    fontSize: Typography.body.fontSize,
  },

  // Success
  successIconContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  successIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.strong,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    gap: Spacing.xs,
  },
  rewardText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: Typography.bodySmall.fontSize,
  },
  codeCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    marginVertical: Spacing.sm,
  },
  codeLabel: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: Spacing.xs,
  },
  copiedText: {
    color: Colors.success,
    fontSize: Typography.bodySmall.fontSize,
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.bodySmall.fontSize,
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  instructionsTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.xs,
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: Typography.bodySmall.fontSize,
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#2a5a7c',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.medium,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Typography.bodyLarge.fontSize,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    fontSize: Typography.body.fontSize,
  },
});

export default withErrorBoundary(LockConfirmPage, 'LockConfirmPage');
