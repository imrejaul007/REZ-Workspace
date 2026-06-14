// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Payment Page with Razorpay Gateway Support
// Supports multi-currency: INR (Razorpay)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormPageSkeleton } from '@/components/skeletons';
import paymentService, { PaymentMethod } from '@/services/paymentService';
import apiClient from '@/services/apiClient';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { getCurrencySymbol as getPaymentCurrencySymbol } from '@/config/payment';
import * as WebBrowser from 'expo-web-browser';
import { platformAlertSimple, platformAlertConfirm, platformAlertDestructive } from '@/utils/platformAlert';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

// Import Razorpay for native support
let RazorpayCheckout: unknown = null;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (error) {
  // Not available in Expo Go
}

// Razorpay Key from environment
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';

function PaymentPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { state: authState } = useAuth();
  const authUser = authState.user;
  const params = useLocalSearchParams();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const rawAmount = Number(params.amount);
  const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : -1;
  const currency = ((params.currency as string) || 'INR').toUpperCase();

  // HIGH-10: Validate amount before rendering payment UI
  useEffect(() => {
    if (amount <= 0 || amount > 1000000) {
      platformAlertSimple('Invalid Amount', 'The payment amount is invalid. Please go back and try again.');
      const t = setTimeout(() => {
        // eslint-disable-next-line no-unused-expressions
        router.canGoBack() ? router.back() : router.replace('/(tabs)');
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const orderId = params.orderId as string; // For travel/event: order ID; for deals/flash-sales: pre-created Razorpay order ID
  const bookingId = params.bookingId as string;
  const bookingType = params.bookingType as string;
  const preCreatedKeyId = (params.razorpayKeyId as string) || RAZORPAY_KEY_ID;
  const isTravelPayment = bookingType === 'travel';
  const isDealPayment = bookingType === 'deal';
  const isFlashSalePayment = bookingType === 'flash_sale';
  const isLockDealPayment = bookingType === 'lock_deal';
  const isSubscriptionPayment = bookingType === 'subscription';
  // For lock deals: dealId (deposit) or bookingId (balance payment lockId)
  const dealId = params.dealId as string;
  const paymentType = (params.paymentType as string) || 'deposit'; // 'deposit' | 'balance'
  const preCreatedRazorpayOrderId = params.razorpayOrderId as string;
  // For subscription upgrades
  const subscriptionTier = (params.subscriptionTier as string) || 'premium';
  const subscriptionBillingCycle = (params.billingCycle as string) || 'monthly';

  // Track navigation timeouts so they can be cancelled on unmount
  const navTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    return () => {
      navTimeoutsRef.current.forEach((t) => clearTimeout(t));
      // eslint-disable-next-line react-hooks/exhaustive-deps
      navTimeoutsRef.current.clear();
    };
  }, []);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'methods' | 'processing'>('methods');
  const [paymentStartedAt, setPaymentStartedAt] = useState<number | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);

  // Razorpay state
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState(preCreatedKeyId);

  // Payment timeout (5 minutes)
  useEffect(() => {
    if (!paymentStartedAt) return;
    const timeout = setTimeout(
      () => {
        if (isProcessing) {
          setIsProcessing(false);
          setCurrentStep('methods');
          platformAlertConfirm(
            'Payment Session Expired',
            'Your payment session has expired. Please try again.',
            () => setPaymentStartedAt(null),
            'Retry',
          );
        }
      },
      5 * 60 * 1000,
    );
    return () => clearTimeout(timeout);
  }, [paymentStartedAt, isProcessing]);

  // Animation values
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    loadPaymentMethods();
    animateEntrance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentStep === 'processing') {
      animateProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const animateEntrance = () => {
    fadeAnim.value = 0.3;
    slideAnim.value = 20;
    fadeAnim.value = withTiming(1, { duration: 400 });
    slideAnim.value = withTiming(0, { duration: 400 });
  };

  const animateProgress = () => {
    progressAnim.value = withTiming(1, { duration: 2000 });
  };

  const stepContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressAnim.value, [0, 1], [0, 100])}%`,
  }));

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getPaymentMethods();
      if (response.success && response.data) {
        const methods = response.data.map((method) => ({
          ...method,
          gateway: 'razorpay',
        }));
        if (!isMounted()) return;
        setPaymentMethods(methods);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to load payment methods. Please try again.');
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
    }
  };

  const handleBackPress = useCallback(() => {
    if (isProcessing) {
      platformAlertDestructive(
        'Payment in Progress',
        'A payment is being processed. Are you sure you want to go back?',
        () => {
          setIsProcessing(false);
          setCurrentStep('methods');
          // eslint-disable-next-line no-unused-expressions
          router.canGoBack() ? router.back() : router.replace('/(tabs)');
        },
        'Go Back',
      );
    } else {
      // eslint-disable-next-line no-unused-expressions
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    }
  }, [isProcessing, router]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    // Pass method directly — setSelectedMethod is async; reading selectedMethod
    // state inside handleRazorpayPayment immediately after would be stale.
    handleRazorpayPayment(method);
  };

  // ==================== RAZORPAY FLOW ====================

  // CA-PAY-006 FIX: Use promise-based lock to prevent double-submit of Razorpay orders
  const createOrderPromiseRef = useRef<Promise<unknown> | null>(null);

  const createRazorpayOrder = async (): Promise<unknown> => {
    // CA-PAY-006 FIX: If an order creation is already in-flight, return that promise
    if (createOrderPromiseRef.current) {
      return createOrderPromiseRef.current;
    }

    // For deals, flash sales, and lock deals, the Razorpay order is pre-created by the backend.
    // The order ID and key arrive via URL params — skip the create-order API call.
    if ((isDealPayment || isFlashSalePayment) && orderId) {
      setPaymentStartedAt(Date.now());
      setOrderCreated(true);
      return {
        razorpayOrderId: orderId,
        razorpayKeyId: preCreatedKeyId,
        amount,
        currency,
      };
    }
    if ((isLockDealPayment || isSubscriptionPayment) && preCreatedRazorpayOrderId) {
      setPaymentStartedAt(Date.now());
      setOrderCreated(true);
      return {
        razorpayOrderId: preCreatedRazorpayOrderId,
        razorpayKeyId: preCreatedKeyId,
        amount,
        currency,
      };
    }

    try {
      setPaymentStartedAt(Date.now());

      // CA-PAY-006 FIX: Create the promise and store it to prevent concurrent calls
      const orderPromise = (async () => {
        let response;
        if (isTravelPayment) {
          response = await apiClient.post('/travel-payment/create-order', {
            bookingId,
            amount,
            currency,
          });
        } else {
          // Event payments and generic order payments
          response = await apiClient.post('/payment/create-order', {
            orderId,
            amount,
            currency,
          });
        }

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to create payment order');
        }
      })();

      createOrderPromiseRef.current = orderPromise;
      const result = await orderPromise;
      createOrderPromiseRef.current = null; // Clear after successful completion
      return result;
    } catch (error) {
      createOrderPromiseRef.current = null; // Clear after error
      throw error;
    }
  };

  const verifyRazorpayPaymentOnBackend = async (paymentData): Promise<boolean> => {
    // CA-PAY-011 FIX: Always verify Razorpay payment server-side
    // Do not trust client-side Razorpay data; backend MUST validate signature
    // to prevent fraudulent payment claims.
    try {
      // Validate required fields exist
      if (!paymentData.razorpay_order_id || !paymentData.razorpay_payment_id || !paymentData.razorpay_signature) {
        logger.error('[Razorpay] Missing required payment verification fields');
        return false;
      }

      let response;
      if (isTravelPayment) {
        response = await apiClient.post('/travel-payment/verify', {
          bookingId,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
        });
      } else {
        response = await apiClient.post('/payment/verify', {
          orderId,
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
        });
      }

      // CA-PAY-011 FIX: Only return true if backend explicitly confirms payment is valid
      if (response.success && response.data) {
        // Additional safety: ensure response contains order/payment confirmation
        if (!(response.data as unknown).orderId && !(response.data as unknown).paymentId) {
          logger.warn('[Razorpay] Verification response missing orderId or paymentId');
          return false;
        }
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[Razorpay] Verification error: ' + String(error?.message ?? error));
      return false;
    }
  };

  const handleRazorpayPayment = async (_method?: PaymentMethod) => {
    setCurrentStep('processing');
    setIsProcessing(true);

    try {
      const orderData = await createRazorpayOrder();

      if (!isMounted()) return;
      setRazorpayOrderId(orderData.razorpayOrderId);
      if (!isMounted()) return;
      setRazorpayKeyId(orderData.razorpayKeyId);
      if (!isMounted()) return;
      setOrderCreated(true);

      if (RazorpayCheckout) {
        openNativeRazorpayCheckout(orderData);
      } else {
        openWebRazorpayCheckout(orderData);
      }
    } catch (error) {
      if (!isMounted()) return;
      setCurrentStep('methods');
      if (!isMounted()) return;
      setIsProcessing(false);
      platformAlertSimple('Payment Failed', error.message || 'Failed to initiate payment. Please try again.');
    }
  };

  const openNativeRazorpayCheckout = (orderData) => {
    const options = {
      description: isDealPayment
        ? 'REZ - Deal Purchase'
        : isFlashSalePayment
          ? 'REZ - Flash Sale Purchase'
          : isLockDealPayment
            ? paymentType === 'balance'
              ? 'REZ - Lock Deal Balance Payment'
              : 'REZ - Lock Deal Deposit'
            : isSubscriptionPayment
              ? `REZ - ${subscriptionTier} Subscription`
              : isTravelPayment
                ? 'REZ - Travel Booking'
                : 'REZ App Payment',
      image: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
        ? `https://res.cloudinary.com/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/logo.png`
        : undefined,
      currency: orderData.currency,
      key: orderData.razorpayKeyId,
      amount: orderData.amount,
      order_id: orderData.razorpayOrderId,
      name: 'REZ App',
      prefill: {
        email: authUser?.email || '',
        contact: authUser?.phoneNumber || '',
        name: authUser?.profile ? `${authUser.profile.firstName || ''} ${authUser.profile.lastName || ''}`.trim() : '',
      },
      theme: { color: colors.brand.purpleLight },
      modal: {
        ondismiss: () => {
          setCurrentStep('methods');
          setIsProcessing(false);
          platformAlertSimple('Payment Cancelled', 'You cancelled the payment.');
        },
      },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        handlePaymentSuccess(data);
      })
      .catch((error) => {
        handlePaymentFailure(error);
      });
  };

  const openWebRazorpayCheckout = (_orderData) => {
    // Native Razorpay SDK is unavailable (web/Expo Go environment).
    // Payments require the native app — do NOT simulate or mock payment data,
    // as a mock signature would either bypass backend verification (security risk)
    // or produce a broken UX with a rejected payment. Show a clear error instead.
    setIsProcessing(false);
    platformAlertSimple(
      'Payment Not Available',
      'Payments are only supported on the native iOS/Android app. Please use the ReZ app to complete your purchase.',
    );
  };

  // ==================== SHARED HANDLERS ====================

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Deals: navigate to deal-success page — it handles Razorpay signature verification
      if (isDealPayment) {
        if (!isMounted()) return;
        setIsProcessing(false);
        const t = setTimeout(() => {
          navTimeoutsRef.current.delete(t);
          router.replace(
            `/deal-success?razorpay_order_id=${paymentData.razorpay_order_id}&razorpay_payment_id=${paymentData.razorpay_payment_id}&razorpay_signature=${paymentData.razorpay_signature}&redemptionId=${bookingId}` as unknown,
          );
        }, 500);
        navTimeoutsRef.current.add(t);
        return;
      }

      // Flash sales: navigate to flash-sale-success page — it handles verification
      if (isFlashSalePayment) {
        if (!isMounted()) return;
        setIsProcessing(false);
        const t = setTimeout(() => {
          navTimeoutsRef.current.delete(t);
          router.replace(
            `/flash-sale-success?purchaseId=${bookingId}&razorpay_order_id=${paymentData.razorpay_order_id}&razorpay_payment_id=${paymentData.razorpay_payment_id}&razorpay_signature=${paymentData.razorpay_signature}` as unknown,
          );
        }, 500);
        navTimeoutsRef.current.add(t);
        return;
      }

      // Lock deals: navigate to lock-confirm page — it handles signature verification
      if (isLockDealPayment) {
        if (!isMounted()) return;
        setIsProcessing(false);
        const t = setTimeout(() => {
          navTimeoutsRef.current.delete(t);
          const lockConfirmParams = new URLSearchParams({
            razorpay_order_id: paymentData.razorpay_order_id,
            razorpay_payment_id: paymentData.razorpay_payment_id,
            razorpay_signature: paymentData.razorpay_signature,
            paymentType,
            ...(paymentType === 'balance' ? { lockId: bookingId } : { dealId }),
          }).toString();
          router.replace(`/lock-deals/lock-confirm?${lockConfirmParams}` as unknown as string);
        }, 500);
        navTimeoutsRef.current.add(t);
        return;
      }

      // Subscription upgrades: route to payment confirmation screen (which confirms upgrade)
      if (isSubscriptionPayment) {
        if (!isMounted()) return;
        setIsProcessing(false);
        const t = setTimeout(() => {
          navTimeoutsRef.current.delete(t);
          router.replace({
            pathname: '/subscription/payment-confirmation' as unknown,
            params: {
              status: 'success',
              tier: subscriptionTier,
              amount: String(amount),
              billingCycle: subscriptionBillingCycle,
              transactionId: paymentData.razorpay_payment_id,
              upgradeId: bookingId,
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_signature: paymentData.razorpay_signature,
            },
          });
        }, 500);
        navTimeoutsRef.current.add(t);
        return;
      }

      // Travel and event payments: verify on backend here before navigating
      const isVerified = await verifyRazorpayPaymentOnBackend(paymentData);

      if (isVerified) {
        if (!isMounted()) return;
        setIsProcessing(false);
        if (!isMounted()) return;
        const t = setTimeout(() => {
          navTimeoutsRef.current.delete(t);
          if (isTravelPayment) {
            router.replace(`/travel-booking-confirmation?bookingId=${bookingId}` as unknown as string);
          } else {
            router.replace(`/order-confirmation?orderId=${orderId}` as unknown as string);
          }
        }, 500);
        navTimeoutsRef.current.add(t);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      if (!isMounted()) return;
      setCurrentStep('methods');
      if (!isMounted()) return;
      setIsProcessing(false);
      platformAlertConfirm(
        'Verification Failed',
        'Payment was received but verification failed. Please contact support.',
        () => router.push('/support' as unknown as string),
        'Contact Support',
      );
    }
  };

  const handlePaymentFailure = (error) => {
    setCurrentStep('methods');
    setIsProcessing(false);

    const errorMessage = error.description || error.message || 'Payment failed. Please try again.';

    platformAlertConfirm('Payment Failed', errorMessage, () => setCurrentStep('methods'), 'Try Again');
  };

  // ==================== UI HELPERS ====================

  const displayCurrencySymbol = getPaymentCurrencySymbol(currency) || currencySymbol;

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return 'card-outline';
      case 'upi':
        return 'phone-portrait-outline';
      case 'wallet':
        return 'wallet-outline';
      case 'netbanking':
        return 'business-outline';
      default:
        return 'card-outline';
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'card':
        return Colors.info;
      case 'upi':
        return Colors.brand.purple;
      case 'wallet':
        return colors.brand.pink;
      case 'netbanking':
        return Colors.success;
      default:
        return colors.text.tertiary;
    }
  };

  // ==================== RENDER ====================

  const renderPaymentMethods = () => (
    <Animated.View style={[styles.stepContainer, stepContainerStyle]}>
      <ThemedText style={styles.stepTitle}>Choose Payment Method</ThemedText>
      <ThemedText style={styles.stepSubtitle}>Secure payment powered by Razorpay</ThemedText>

      <View style={styles.securityBadge}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
        <ThemedText style={styles.securityBadgeText}>Secured by Razorpay - PCI DSS Compliant</ThemedText>
      </View>

      <View style={styles.methodsGrid}>
        {paymentMethods.map((method) => (
          <Pressable
            key={method.id}
            style={[styles.methodCard, { borderColor: getMethodColor(method.type) }]}
            onPress={() => handleMethodSelect(method)}
            disabled={!method.isAvailable || isProcessing}
          >
            <View style={[styles.methodIconContainer, { backgroundColor: getMethodColor(method.type) }]}>
              <Ionicons name={getMethodIcon(method.type)} size={24} color={colors.text.inverse} />
            </View>
            <View style={styles.methodInfo}>
              <ThemedText style={styles.methodName}>{method.name}</ThemedText>
              <ThemedText style={styles.methodGateway}>Razorpay Gateway</ThemedText>
              <View style={styles.methodDetails}>
                <ThemedText style={styles.methodFee}>
                  {method.processingFee && method.processingFee > 0 ? `Fee: ${method.processingFee}%` : 'No fee'}
                </ThemedText>
                <ThemedText style={styles.methodTime}>{method.processingTime}</ThemedText>
              </View>
            </View>
            <View style={styles.methodArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.supportedMethods}>
        <ThemedText style={styles.supportedTitle}>Supported Payment Options:</ThemedText>
        <ThemedText style={styles.supportedText}>
          UPI, Cards (Visa, Mastercard, Amex, RuPay), Net Banking, Wallets (Paytm, PhonePe, etc.)
        </ThemedText>
      </View>
    </Animated.View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingIcon}>
        <ActivityIndicator size="large" color={Colors.brand.purple} />
      </View>

      <ThemedText style={styles.processingTitle}>Processing Payment</ThemedText>
      <ThemedText style={styles.processingSubtitle}>Please wait while we securely process your payment...</ThemedText>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
        <ThemedText style={styles.progressText}>Processing...</ThemedText>
      </View>

      <View style={styles.securityInfo}>
        <Ionicons name="lock-closed" size={16} color={Colors.success} />
        <ThemedText style={styles.securityText}>256-bit SSL Encrypted</ThemedText>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.brand.purple} />
        <LinearGradient colors={[Colors.brand.purple, Colors.brand.purpleLight]} style={styles.headerBg}>
          <View style={styles.headerContainer}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Payment</ThemedText>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <FormPageSkeleton />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand.purple} />
      <LinearGradient colors={[Colors.brand.purple, Colors.brand.purpleLight]} style={styles.headerBg}>
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Payment</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.amountSection}>
          <ThemedText style={styles.amountLabel}>Amount to Pay</ThemedText>
          <ThemedText style={styles.amountValue}>
            {displayCurrencySymbol}
            {amount.toLocaleString()}
          </ThemedText>
          {currency !== 'INR' && <ThemedText style={styles.currencyLabel}>{currency}</ThemedText>}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {currentStep === 'methods' && renderPaymentMethods()}
        {currentStep === 'processing' && renderProcessing()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerBg: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    ...Shadows.strong,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: {
    color: colors.text.inverse,
    ...Typography.h3,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 34,
  },
  amountSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  amountLabel: {
    color: '#E0E7FF',
    ...Typography.body,
    marginBottom: 5,
  },
  amountValue: {
    color: colors.text.inverse,
    fontSize: 32,
    fontWeight: '900',
  },
  currencyLabel: {
    color: '#E0E7FF',
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  stepContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.strong,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    ...Typography.bodyLarge,
    color: colors.text.tertiary,
    marginBottom: Spacing.base,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successScale[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: 6,
  },
  securityBadgeText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600',
  },
  methodsGrid: {
    gap: Spacing.base,
    marginTop: Spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    ...Shadows.medium,
    marginHorizontal: Spacing.xs,
  },
  methodIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    ...Shadows.medium,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  methodGateway: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: 6,
  },
  methodDetails: {
    flexDirection: 'row',
    gap: Spacing.base,
    alignItems: 'center',
  },
  methodFee: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600',
    backgroundColor: Colors.successScale[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodTime: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  methodArrow: {
    padding: Spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  supportedMethods: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  supportedTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  supportedText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  processingIcon: {
    marginBottom: Spacing.xl,
  },
  processingTitle: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    ...Typography.bodyLarge,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: Spacing.lg,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border.default,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.brand.purpleLight,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successScale[50],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  securityText: {
    ...Typography.bodySmall,
    color: Colors.success,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.bodyLarge,
    color: colors.text.tertiary,
  },
});

export default withErrorBoundary(PaymentPage, 'PaymentRazorpay');
