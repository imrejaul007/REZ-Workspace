// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Modern Payment Page

import { colors } from '@/constants/theme';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import paymentService, { PaymentMethod, PaymentResponse } from '@/services/paymentService';
import PaymentValidator from '@/services/paymentValidation';
import financialServicesApi, { FinancialService } from '@/services/financialServicesApi';
import { useGetCurrencySymbol, useGetCurrency } from '@/stores/selectors';
import { platformAlertSimple } from '@/utils/platformAlert';
import { FormPageSkeleton } from '@/components/skeletons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import { useIsMounted } from '@/hooks/useIsMounted';

function PaymentPage() {
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const getCurrency = useGetCurrency();
  const regionCurrency = getCurrencySymbol();
  const params = useLocalSearchParams();
  // BUG-FIX: `Number(x) || 5000` silently defaulted to ₹5000 when deep-link
  // passed amount=0 or any falsy number, and also when no upper-bound guard was
  // present a crafted negative value would reach the backend.  Use an explicit
  // finite/positive check so only valid positive values are accepted; invalid
  // params redirect away before any API call is made.
  const rawAmount = Number(params.amount);
  const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : -1;
  const currency = (params.currency as string) || 'INR';
  const fiatCurrency = (params.fiatCurrency as string) || getCurrency();

  // Use NC display for wallet recharges, region currency for financial services
  const isWalletRecharge = currency === BRAND.CURRENCY_CODE;
  const displayCurrency = isWalletRecharge ? BRAND.CURRENCY_CODE + ' ' : regionCurrency;

  // Financial service specific params
  const paymentType = params.type as string;
  const isFinancialService = paymentType === 'financial-service';
  const serviceId = params.serviceId as string;
  const serviceType = params.serviceType as string;

  // FR-D004 FIX: Detect mobile-recharge payment type.
  // recharge.tsx navigates here with type=recharge&txnId=<REZ-txnId>&mobile=<e164>.
  // Without this flag the screen treated mobile recharges as a generic wallet topup,
  // ignored txnId in the payment metadata, and navigated to /wallet-screen on success
  // instead of back to the recharge flow.  The Razorpay webhook also never received
  // the txnId so it couldn't match the payment back to the RechargeTransaction record.
  const isMobileRecharge = paymentType === 'recharge';
  const rechargeTransactionId = (params.txnId as string) || '';
  const rechargeMobile = (params.mobile as string) || '';

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'methods' | 'details' | 'processing' | 'failed'>('methods');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Financial service state
  const [financialService, setFinancialService] = useState<FinancialService | null>(null);
  const [isLoadingService, setIsLoadingService] = useState(false);

  // Recharge discount state
  const [discountInfo, setDiscountInfo] = useState<{ discount: number; payable: number; percentage: number } | null>(
    null,
  );

  // Form states (UPI, wallet, netbanking)
  const [upiId, setUpiId] = useState('');
  const [walletType, setWalletType] = useState('paytm');
  const [bankCode, setBankCode] = useState('');
  const [processingStatus, setProcessingStatus] = useState('Initiating payment...');
  const lastPaymentRef = useRef<PaymentResponse | null>(null);
  const pollingAbortedRef = useRef(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    return () => {
      pollingAbortedRef.current = true;
    };
  }, []);

  // BUG-FIX: Guard against invalid amounts arriving via deep link.
  // Redirect immediately so no API call is made with a bad amount.
  useEffect(() => {
    if (amount <= 0 || amount > 1_000_000) {
      platformAlertSimple('Invalid Amount', 'The payment amount is invalid. Please go back and try again.');
      const t = setTimeout(() => {
        // eslint-disable-next-line no-unused-expressions
        router.canGoBack() ? router.back() : router.replace('/(tabs)' as unknown);
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation values
  const fadeAnim = useSharedValue(1);
  const slideAnim = useSharedValue(0);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    loadPaymentMethods();
    animateEntrance();

    if (isFinancialService && serviceId) {
      loadFinancialService();
    }

    // Fetch recharge discount for wallet topups
    if (isWalletRecharge && amount > 0) {
      paymentService
        .previewCashback(amount)
        .then((res) => {
          if (res.success && res.data && (res.data.discountAmount || res.data.cashback)) {
            setDiscountInfo({
              discount: res.data.discountAmount || res.data.cashback || 0,
              payable: res.data.payableAmount || amount - (res.data.discountAmount || res.data.cashback || 0),
              percentage: res.data.discountPercentage || res.data.cashbackPercentage || 0,
            });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinancialService, serviceId, isWalletRecharge, amount]);

  const loadFinancialService = async () => {
    if (!serviceId) return;

    setIsLoadingService(true);
    try {
      const response = await financialServicesApi.getById(serviceId);
      if (response.success && response.data) {
        setFinancialService(response.data);
      }
    } catch (error) {
      // silently handle
    } finally {
      if (!isMounted()) return;
      setIsLoadingService(false);
    }
  };

  // PAYMENT TIMEOUT: If the processing screen is shown for more than 30s
  // without resolving, move to the failed state so the user is never stuck.
  useEffect(() => {
    if (currentStep !== 'processing') return;
    animateProgress();
    const timeoutId = setTimeout(() => {
      if (!isMounted()) return;
      // Only trigger if still on processing screen (not already resolved)
      setCurrentStep((prev) => {
        if (prev === 'processing') {
          setPaymentError('Payment timed out. Please check your payment method and try again.');
          return 'failed';
        }
        return prev;
      });
    }, 30_000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const animateEntrance = () => {
    fadeAnim.value = 0.3;
    slideAnim.value = 20;
    fadeAnim.value = withTiming(1, { duration: 400 });
    slideAnim.value = withTiming(0, { duration: 400 });
  };

  const animateProgress = () => {
    progressAnim.value = 0;
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
      const response = await paymentService.getPaymentMethods(currency, fiatCurrency);
      if (response.success && Array.isArray(response.data)) {
        // Filter out 'card' until the card payment flow is fully implemented.
        // Cards require PCI-DSS compliant tokenisation (Razorpay Cards / Stripe
        // Elements) which is not yet wired up on this screen.  Showing the
        // option without a working flow would silently fail for users.
        const availableMethods = response.data.filter((m) => m.type !== 'card');
        setPaymentMethods(availableMethods);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to load payment methods. Please try again.');
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
    }
  };

  const handleBackPress = useCallback(() => {
    if (currentStep === 'details') {
      setCurrentStep('methods');
      setSelectedMethod(null);
    } else {
      // eslint-disable-next-line no-unused-expressions
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    }
  }, [currentStep, router]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setCurrentStep('details');
  };

  const getSuccessMessage = () => {
    if (isFinancialService) {
      return `Your ${
        serviceType === 'bills'
          ? 'bill payment'
          : serviceType === 'recharge'
            ? 'recharge'
            : serviceType === 'ott'
              ? 'subscription'
              : serviceType === 'gold'
                ? 'gold purchase'
                : serviceType === 'insurance'
                  ? 'insurance'
                  : 'payment'
      } of ${displayCurrency}${amount.toLocaleString()} has been processed successfully.`;
    }
    // FR-D004 FIX: provide correct success message for mobile recharge flow
    if (isMobileRecharge) {
      return `Mobile recharge of ${displayCurrency}${amount.toLocaleString()} for ${rechargeMobile} has been processed successfully.`;
    }
    if (isWalletRecharge) {
      return `${amount.toLocaleString()} ${BRAND.CURRENCY_CODE} has been added to your wallet successfully.`;
    }
    return `Your payment of ${displayCurrency}${amount.toLocaleString()} has been processed successfully.`;
  };

  const navigateAfterSuccess = () => {
    if (isFinancialService) {
      router.replace('/financial' as unknown as string);
    } else if (isMobileRecharge) {
      // FR-D004 FIX: after mobile recharge payment navigate to wallet so user
      // can see the debited amount + promo coins, rather than looping back to
      // the recharge page or hitting /wallet-screen with a misleading "NC added" banner.
      router.replace('/wallet-screen');
    } else {
      router.replace('/wallet-screen');
    }
  };

  /**
   * Create payment intent on backend
   */
  const createPaymentIntent = async (extraMetadata?: Record<string, unknown>): Promise<PaymentResponse | null> => {
    if (!selectedMethod) return null;

    // BUG-FIX: Validate amount before sending to backend — catches negative/zero/
    // out-of-range values that slipped past the URL-param check above.
    const amountValidation = PaymentValidator.validateAmount(amount);
    if (!amountValidation.isValid) {
      throw new Error(amountValidation.errors[0] || 'Invalid payment amount');
    }

    // FR-D004 FIX: map mobile-recharge to its own purpose so the backend
    // Razorpay order notes carry type='recharge' and the webhook handler
    // (rechargeController.handleRazorpayWebhook) can match the payment
    // back to the correct RechargeTransaction by txnId.
    const purpose = isFinancialService
      ? ('financial_service' as const)
      : isMobileRecharge
        ? ('other' as const)
        : isWalletRecharge
          ? ('wallet_topup' as const)
          : ('other' as const);

    const rechargeMetadata = isMobileRecharge
      ? { type: 'recharge', rechargeTransactionId, mobile: rechargeMobile }
      : {};

    const response = await paymentService.processPayment(amount, currency, selectedMethod, purpose, {
      ...(extraMetadata || {}),
      fiatCurrency,
      ...rechargeMetadata,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Payment initiation failed');
    }

    return response.data;
  };

  /**
   * Non-card payment handler — creates intent, then polls for status
   * Used for UPI, wallet, netbanking (redirects/polling based)
   */
  const handleNonCardPayment = async (extraMetadata?: Record<string, unknown>) => {
    if (!selectedMethod || isProcessing) return;

    setCurrentStep('processing');
    setIsProcessing(true);
    setProcessingStatus('Initiating payment...');

    try {
      const paymentData = await createPaymentIntent(extraMetadata);
      if (!paymentData) throw new Error('Failed to create payment');

      lastPaymentRef.current = paymentData;
      if (!isMounted()) return;
      setProcessingStatus('Waiting for payment confirmation...');

      // Poll for real status from backend (aborts if component unmounts)
      const statusResponse = await paymentService.pollPaymentStatus(
        paymentData.paymentId,
        paymentData.gateway || selectedMethod.gateway,
        {
          maxAttempts: 40,
          intervalMs: 3000,
          onStatusChange: (status) => {
            if (pollingAbortedRef.current) return;
            if (status === 'processing') setProcessingStatus('Processing your payment...');
            if (status === 'completed') setProcessingStatus('Payment confirmed!');
          },
          shouldAbort: () => pollingAbortedRef.current,
        },
      );

      // If component unmounted during polling, don't update state
      if (pollingAbortedRef.current) return;

      if (statusResponse.success && statusResponse.data?.status === 'completed') {
        platformAlertSimple('Payment Successful!', getSuccessMessage());
        navigateAfterSuccess();
      } else if (statusResponse.data?.status === 'failed') {
        throw new Error(statusResponse.data?.failureReason || 'Payment was declined');
      } else {
        // CRIT-004 FIX: 'pending' (or any non-completed status) must NOT navigate to the
        // success screen. Doing so lets the user believe payment succeeded and could trigger
        // downstream cashback/reward flows before the backend confirms the payment.
        // Instead, show a neutral informational alert and navigate back without triggering
        // any success-path side-effects.
        platformAlertSimple(
          'Payment Pending',
          'Your payment is still being processed. Please check your wallet for updates.',
        );
        // Navigate back (not to success) — user can check wallet history for status
        // eslint-disable-next-line no-unused-expressions
        router.canGoBack() ? router.back() : router.replace('/(tabs)');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment failed. Please try again.';
      if (!isMounted()) return;
      setPaymentError(errorMsg);
      if (!isMounted()) return;
      setCurrentStep('failed');
    } finally {
      if (!isMounted()) return;
      setIsProcessing(false);
    }
  };

  const handleUPIPayment = async () => {
    const validation = PaymentValidator.validateUPIId(upiId);
    if (!validation.isValid) {
      platformAlertSimple('Validation Error', validation.errors.join('\n'));
      return;
    }
    await handleNonCardPayment({ upiId, app: 'paytm' });
  };

  const handleWalletPayment = async () => {
    await handleNonCardPayment({ walletType });
  };

  const getMethodIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'card':
        return 'card-outline';
      case 'upi':
        return 'phone-portrait-outline';
      case 'wallet':
        return 'wallet-outline';
      case 'netbanking':
        return 'business-outline';
      case 'paypal':
        return 'globe-outline';
      default:
        return 'card-outline';
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'upi':
        return colors.nileBlue;
      case 'card':
        return Colors.info;
      case 'wallet':
        return Colors.gold;
      case 'netbanking':
        return Colors.success;
      case 'paypal':
        return '#0070BA';
      default:
        return colors.text.tertiary;
    }
  };

  const renderPaymentMethods = () => (
    <Animated.View style={[styles.stepContainer, stepContainerStyle]}>
      <ThemedText style={styles.stepTitle}>Choose Payment Method</ThemedText>
      <ThemedText style={styles.stepSubtitle}>Select your preferred payment method to continue</ThemedText>

      {paymentMethods.length === 0 && !isLoading && (
        <ThemedText style={styles.emptyMethodsText}>No payment methods available. Please try again later.</ThemedText>
      )}

      <View style={styles.methodsGrid}>
        {paymentMethods.map((method) => {
          const methodColor = getMethodColor(method.type);
          const hasFee = method.processingFee && method.processingFee > 0;

          return (
            <Pressable
              key={method.id}
              style={styles.methodCard}
              onPress={() => handleMethodSelect(method)}
              disabled={!method.isAvailable}
              accessibilityLabel={`${method.name}. ${hasFee ? `Fee: ${method.processingFee} percent` : 'No fee'}. ${method.processingTime}`}
              accessibilityRole="button"
            >
              <View style={[styles.methodIconContainer, { backgroundColor: methodColor }]}>
                <Ionicons name={getMethodIcon(method.type)} size={22} color={colors.text.inverse} />
              </View>

              <View style={styles.methodInfo}>
                <ThemedText style={styles.methodName}>{method.name}</ThemedText>
                <View style={styles.methodDetails}>
                  <View style={[styles.feeBadge, hasFee ? styles.feeBadgeWarning : styles.feeBadgeFree]}>
                    <ThemedText style={[styles.feeText, hasFee ? styles.feeTextWarning : styles.feeTextFree]}>
                      {hasFee ? `Fee: ${method.processingFee}%` : 'No fee'}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.methodTime}>{method.processingTime}</ThemedText>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>
          );
        })}
      </View>

      {/* Security Footer */}
      <View style={styles.securityRow}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
        <ThemedText style={styles.securityText}>256-bit SSL encrypted | Secure payment</ThemedText>
      </View>
    </Animated.View>
  );

  const renderPaymentDetails = () => {
    if (!selectedMethod) return null;

    return (
      <Animated.View style={[styles.stepContainer, stepContainerStyle]}>
        <View style={styles.methodHeader}>
          <View style={[styles.methodIconContainer, { backgroundColor: getMethodColor(selectedMethod.type) }]}>
            <Ionicons name={getMethodIcon(selectedMethod.type)} size={22} color={colors.text.inverse} />
          </View>
          <View style={styles.methodHeaderInfo}>
            <ThemedText style={styles.methodHeaderName}>{selectedMethod.name}</ThemedText>
            {selectedMethod.description && (
              <ThemedText style={styles.methodHeaderGateway}>{selectedMethod.description}</ThemedText>
            )}
          </View>
        </View>

        {/* UPI Payment */}
        {selectedMethod.type === 'upi' && (
          <View style={styles.formContainer}>
            <ThemedText style={styles.formLabel}>Enter UPI ID</ThemedText>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="user@paytm"
                value={upiId}
                onChangeText={setUpiId}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.text.tertiary}
                accessibilityLabel="UPI ID input"
              />
            </View>
            <Pressable
              style={[styles.payButton, !upiId ? styles.disabledButton : null]}
              onPress={handleUPIPayment}
              disabled={!upiId || isProcessing}
            >
              <LinearGradient colors={[colors.nileBlue, '#2A5577'] as const} style={styles.payButtonGradient}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.inverse} />
                <ThemedText style={styles.payButtonText}>
                  Pay {displayCurrency}
                  {amount.toLocaleString()}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Digital Wallet */}
        {selectedMethod.type === 'wallet' && (
          <View style={styles.formContainer}>
            <ThemedText style={styles.formLabel}>Select Wallet</ThemedText>
            <View style={styles.walletGrid}>
              {['paytm', 'phonepe', 'gpay', 'amazonpay'].map((wallet) => (
                <Pressable
                  key={wallet}
                  style={[styles.walletOption, walletType === wallet ? styles.selectedWalletOption : null]}
                  onPress={() => setWalletType(wallet)}
                  accessibilityLabel={`${wallet.toUpperCase()}${walletType === wallet ? ', selected' : ''}`}
                  accessibilityRole="radio"
                >
                  <View style={[styles.walletIcon, { backgroundColor: getMethodColor('wallet') }]}>
                    <Ionicons name="wallet-outline" size={18} color={colors.text.inverse} />
                  </View>
                  <ThemedText style={styles.walletText}>{wallet.toUpperCase()}</ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.payButton} onPress={handleWalletPayment} disabled={isProcessing}>
              <LinearGradient colors={[colors.nileBlue, '#2A5577'] as const} style={styles.payButtonGradient}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.inverse} />
                <ThemedText style={styles.payButtonText}>Pay with {walletType.toUpperCase()}</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* Net Banking */}
        {selectedMethod.type === 'netbanking' && (
          <View style={styles.formContainer}>
            <ThemedText style={styles.formLabel}>Select Bank</ThemedText>
            <View style={styles.walletGrid}>
              {[
                { code: 'sbi', name: 'SBI' },
                { code: 'hdfc', name: 'HDFC' },
                { code: 'icici', name: 'ICICI' },
                { code: 'axis', name: 'Axis' },
              ].map((bank) => (
                <Pressable
                  key={bank.code}
                  style={[styles.walletOption, bankCode === bank.code ? styles.selectedWalletOption : null]}
                  onPress={() => setBankCode(bank.code)}
                  accessibilityLabel={`${bank.name}${bankCode === bank.code ? ', selected' : ''}`}
                  accessibilityRole="radio"
                >
                  <View style={[styles.walletIcon, { backgroundColor: getMethodColor('netbanking') }]}>
                    <Ionicons name="business-outline" size={18} color={colors.text.inverse} />
                  </View>
                  <ThemedText style={styles.walletText}>{bank.name}</ThemedText>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.payButton, !bankCode ? styles.disabledButton : null]}
              onPress={() => handleNonCardPayment({ bankCode })}
              disabled={!bankCode || isProcessing}
            >
              <LinearGradient colors={[colors.nileBlue, '#2A5577'] as const} style={styles.payButtonGradient}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.text.inverse} />
                <ThemedText style={styles.payButtonText}>
                  Pay {displayCurrency}
                  {amount.toLocaleString()}
                </ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <View style={styles.processingIcon}>
        <ActivityIndicator size="large" color={colors.nileBlue} />
      </View>

      <ThemedText style={styles.processingTitle}>Processing Payment</ThemedText>
      <ThemedText style={styles.processingSubtitle}>Please wait while we process your payment...</ThemedText>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, progressFillStyle]} />
        </View>
        <ThemedText style={styles.progressText}>{processingStatus}</ThemedText>
      </View>
    </View>
  );

  const handleRetryPayment = () => {
    setPaymentError(null);
    setCurrentStep('details');
  };

  const renderPaymentFailed = () => (
    <View style={styles.failedContainer}>
      <View style={styles.failedIconCircle}>
        <Ionicons name="close-circle" size={56} color={Colors.error} />
      </View>

      <ThemedText style={styles.failedTitle}>Payment Failed</ThemedText>

      <View style={styles.failedErrorBox}>
        <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
        <ThemedText style={styles.failedErrorText}>
          {paymentError || 'Something went wrong. Please try again.'}
        </ThemedText>
      </View>

      <Pressable style={styles.retryButtonWrapper} onPress={handleRetryPayment}>
        <LinearGradient
          colors={[colors.nileBlue, '#2A5577'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.retryButton}
        >
          <Ionicons name="refresh" size={20} color={colors.text.inverse} />
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </LinearGradient>
      </Pressable>

      <Pressable
        style={styles.changMethodButton}
        onPress={() => {
          setPaymentError(null);
          setSelectedMethod(null);
          setCurrentStep('methods');
        }}
      >
        <ThemedText style={styles.changeMethodText}>Change Payment Method</ThemedText>
      </Pressable>
    </View>
  );

  // Page header title based on context
  const headerLabel = isFinancialService ? 'Payment' : isWalletRecharge ? 'Add Money' : 'Payment';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'top']}>
        {/* SOFIA: SafeAreaView prevents overlap with notch and dynamic island */}
        <ThemedView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
          <LinearGradient colors={[colors.nileBlue, '#2A5577'] as const} style={styles.headerBg}>
            <View style={styles.headerContainer}>
              <Pressable style={styles.backButton} onPress={handleBackPress}>
                <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
              </Pressable>
              <ThemedText style={styles.headerTitle}>{headerLabel}</ThemedText>
              <View style={styles.placeholder} />
            </View>
          </LinearGradient>
          <FormPageSkeleton />
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'top']}>
      {/* SOFIA: KeyboardAvoidingView prevents TextInput from being hidden by keyboard overlay */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoiding}>
        <ThemedView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
          <LinearGradient colors={[colors.nileBlue, '#2A5577'] as const} style={styles.headerBg}>
            <View style={styles.headerContainer}>
              <Pressable
                style={styles.backButton}
                onPress={handleBackPress}
                accessibilityLabel={currentStep === 'details' ? 'Back to payment methods' : 'Back'}
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
              </Pressable>
              <ThemedText style={styles.headerTitle}>{headerLabel}</ThemedText>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.amountSection}>
              {isFinancialService && financialService && (
                <View style={styles.serviceInfo}>
                  <ThemedText style={styles.serviceName}>{financialService.name}</ThemedText>
                  <ThemedText style={styles.serviceType}>
                    {serviceType === 'bills'
                      ? 'Bill Payment'
                      : serviceType === 'recharge'
                        ? 'Mobile Recharge'
                        : serviceType === 'ott'
                          ? 'OTT Subscription'
                          : serviceType === 'gold'
                            ? 'Digital Gold'
                            : serviceType === 'insurance'
                              ? 'Insurance'
                              : 'Financial Service'}
                  </ThemedText>
                </View>
              )}
              {isWalletRecharge && <ThemedText style={styles.amountContextLabel}>Wallet Recharge</ThemedText>}
              <ThemedText style={styles.amountLabel}>
                {isWalletRecharge ? 'Recharge Amount' : 'Amount to Pay'}
              </ThemedText>
              <ThemedText style={styles.amountValue}>
                {displayCurrency}
                {amount.toLocaleString()}
              </ThemedText>
              {isWalletRecharge && discountInfo && discountInfo.discount > 0 && (
                <View style={styles.discountBadge}>
                  <Ionicons name="pricetag-outline" size={14} color={Colors.success} />
                  <ThemedText style={styles.discountText}>
                    {discountInfo.percentage}% off — You pay {regionCurrency}
                    {discountInfo.payable.toLocaleString()}
                  </ThemedText>
                </View>
              )}
              {isFinancialService && financialService?.cashback && (
                <ThemedText style={styles.cashbackInfo}>
                  Get {financialService.cashback.percentage}% cashback
                </ThemedText>
              )}
              {isWalletRecharge && (
                <View style={styles.walletRechargeNote}>
                  <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <ThemedText style={styles.walletRechargeText}>
                    {amount.toLocaleString()} {BRAND.CURRENCY_CODE} will be added to your wallet
                  </ThemedText>
                </View>
              )}
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
            {currentStep === 'details' && renderPaymentDetails()}
            {currentStep === 'processing' && renderProcessing()}
            {currentStep === 'failed' && renderPaymentFailed()}
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    // SOFIA: SafeAreaView prevents content from hiding behind notch and home indicator
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  keyboardAvoiding: {
    // SOFIA: Prevents TextInput from being covered by soft keyboard
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerBg: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text.inverse,
    ...Typography.h4,
    fontWeight: '700',
  },
  placeholder: {
    width: 36,
  },
  amountSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  amountContextLabel: {
    color: 'rgba(255,255,255,0.7)',
    ...Typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  amountValue: {
    color: colors.text.inverse,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  stepContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  stepTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: Spacing.base,
  },
  emptyMethodsText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center' as const,
    paddingVertical: Spacing.lg,
  },
  methodsGrid: {
    gap: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    ...Shadows.subtle,
  },
  methodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  methodDetails: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  feeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  feeBadgeFree: {
    backgroundColor: Colors.successScale[50],
  },
  feeBadgeWarning: {
    backgroundColor: Colors.warningScale[50],
  },
  feeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feeTextFree: {
    color: Colors.success,
  },
  feeTextWarning: {
    color: colors.brand.amberDeep,
  },
  methodTime: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.base,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  securityText: {
    ...Typography.caption,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  methodHeaderInfo: {
    marginLeft: 14,
  },
  methodHeaderName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  methodHeaderGateway: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  formContainer: {
    gap: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text.primary,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  walletOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border.default,
  },
  selectedWalletOption: {
    borderColor: colors.nileBlue,
    backgroundColor: '#F0F4F8',
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  walletText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
  },
  payButton: {
    marginTop: 6,
  },
  payButtonGradient: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingIcon: {
    marginBottom: Spacing.lg,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  processingSubtitle: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border.default,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.nileBlue,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  serviceInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  serviceName: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  serviceType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  discountBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  cashbackInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  walletRechargeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  walletRechargeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Payment Failed
  failedContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  failedIconCircle: {
    marginBottom: Spacing.base,
  },
  failedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.base,
  },
  failedErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorScale[50],
    borderRadius: BorderRadius.md,
    padding: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.errorScale[200],
    width: '100%',
  },
  failedErrorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  retryButtonWrapper: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: 14,
  },
  retryButton: {
    flexDirection: 'row',
    gap: 8,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
  },
  changMethodButton: {
    paddingVertical: 10,
  },
  changeMethodText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
});

export default withErrorBoundary(PaymentPage, 'Payment');
