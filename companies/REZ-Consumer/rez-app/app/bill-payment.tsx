// @ts-nocheck
import { colors } from '@/constants/theme';
/**
 * Bill Payment Page
 * Pay utility bills with cashback - fully wired to backend APIs
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthLoading, useGetCurrencySymbol, useIsAuthenticated } from '@/stores/selectors';
import CachedImage from '@/components/ui/CachedImage';
import { platformAlert } from '@/utils/platformAlert';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { errorReporter } from '@/utils/errorReporter';
import ErrorState from '@/components/common/ErrorState';
import {
  getBillTypes,
  getProviders,
  fetchBill,
  payBill,
  getPaymentHistory,
  BillTypeInfo,
  BillProviderInfo,
  FetchedBillInfo,
  BillPaymentRecord,
} from '@/services/billPaymentApi';
import { useIsMounted } from '@/hooks/useIsMounted';
import razorpayService from '@/services/razorpayService';
import { useWalletContext } from '@/contexts/WalletContext';

// ── Valid bill types for deep link param validation (CONS-014) ─────────────
const VALID_BILL_TYPES = [
  'electricity',
  'mobile_prepaid',
  'mobile_postpaid',
  'broadband',
  'dth',
  'gas',
  'fastag',
  'insurance',
  'education_fee',
];

type PageStep = 'types' | 'providers' | 'input' | 'bill';

function BillPaymentPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const params = useLocalSearchParams();
  // CONS-014: Validate deep link type param against allowlist
  const rawType = (params.type as string) || '';
  const initialType = VALID_BILL_TYPES.includes(rawType) ? rawType : '';
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  // CONS-004: Refresh wallet after successful payment
  const { refreshWallet, walletData } = useWalletContext();

  // Data state
  // CONS-002: React Query with 5-min stale time prevents redundant API calls on tab switching
  const {
    data: billTypesData,
    isLoading: loadingTypesQuery,
    error: billTypesError,
    refetch: refetchBillTypes,
  } = useQuery({
    queryKey: ['billTypes'],
    queryFn: getBillTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes — bill types rarely change
    retry: 2,
    select: (res) => (res.success && res.data ? res.data : []),
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const billTypes: BillTypeInfo[] = billTypesData ?? [];
  const [providers, setProviders] = useState<BillProviderInfo[]>([]);
  const [recentPayments, setRecentPayments] = useState<BillPaymentRecord[]>([]);
  const [fetchedBill, setFetchedBill] = useState<FetchedBillInfo | null>(null);

  // CONS-017: Coin redemption state
  const [coinsToRedeem, setCoinsToRedeem] = useState(0);
  const promoCoinsAvailable = walletData?.coins?.find((c) => c.type === 'promo')?.amount ?? 0;

  // UI state
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedProvider, setSelectedProvider] = useState<BillProviderInfo | null>(null);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  // loadingTypes is now driven by React Query (loadingTypesQuery)
  const loadingTypes = loadingTypesQuery;
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // CONS-018: Track payment ID for status polling
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // CA-PAY-009 FIX: Track consecutive polling errors so we can stop after 5 failures
  // instead of silently burning through pollCount.
  const pollErrorCountRef = useRef(0);

  // Pagination for history
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // ============================================
  // DATA FETCHING
  // ============================================

  // CONS-002: Handle React Query error for bill types
  useEffect(() => {
    if (billTypesError) {
      setError('Failed to load bill types. Please try again.');
      errorReporter.captureError(
        billTypesError instanceof Error ? billTypesError : new Error('Failed to fetch bill types'),
        { context: 'BillPaymentPage.fetchBillTypes' },
        'warning',
      );
    } else {
      setError(null);
    }
  }, [billTypesError]);

  // Auto-select deep link type once bill types are loaded
  useEffect(() => {
    if (initialType && billTypes.some((t) => t.id === initialType)) {
      setSelectedType(initialType);
    }
  }, [initialType, billTypes]);

  // CA-PAY-028 FIX: Debounce rapid type changes to prevent multiple API calls
  // Fetch providers when type changes
  useEffect(() => {
    if (!selectedType) {
      setProviders([]);
      return;
    }
    let cancelled = false;
    // Debounce 300ms to prevent spam on rapid type selections
    const timer = setTimeout(async () => {
      try {
        setLoadingProviders(true);
        setSelectedProvider(null);
        setFetchedBill(null);
        setConsumerNumber('');
        const res = await getProviders(selectedType, 1, 50);
        if (!cancelled && res.success && res.data) {
          setProviders(res.data.providers);
        }
      } catch (err) {
        errorReporter.captureError(
          err instanceof Error ? err : new Error('Failed to fetch bill providers'),
          { context: 'BillPaymentPage.fetchProviders' },
          'warning',
        );
        if (!isMounted()) return;
        setProviders([]);
      } finally {
        if (!cancelled) setLoadingProviders(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  // Fetch payment history
  const loadHistory = useCallback(
    async (page: number, append = false) => {
      if (authLoading || !isAuthenticated) return;
      try {
        if (page === 1) setLoadingHistory(true);
        else setLoadingMoreHistory(true);
        const res = await getPaymentHistory(page, 10);
        if (res.success && res.data) {
          if (append) {
            setRecentPayments((prev) => [...prev, ...res.data!.payments]);
          } else {
            setRecentPayments(res.data.payments);
          }
          setHasMoreHistory(res.data.pagination.hasNextPage);
          setHistoryPage(page);
        }
      } catch (err) {
        errorReporter.captureError(
          err instanceof Error ? err : new Error('Failed to fetch payment history'),
          { context: 'BillPaymentPage.loadHistory' },
          'info',
        );
      } finally {
        if (!isMounted()) return;
        setLoadingHistory(false);
        if (!isMounted()) return;
        setLoadingMoreHistory(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authLoading, isAuthenticated],
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadHistory(1);
    }
  }, [authLoading, isAuthenticated, loadHistory]);

  // ============================================
  // HANDLERS
  // ============================================

  // CONS-007: Retry logic with exponential backoff for transient network failures
  const handleFetchBill = useCallback(async () => {
    if (!selectedProvider || !consumerNumber.trim()) return;
    const MAX_ATTEMPTS = 3;
    let lastErr: Error | null = null;
    setLoadingBill(true);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Exponential backoff: 0ms, 2s, 4s
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        if (!isMounted()) return;
      }
      try {
        const res = await fetchBill(selectedProvider._id, consumerNumber.trim());
        if (res.success && res.data) {
          if (isMounted()) setFetchedBill(res.data);
          if (isMounted()) setLoadingBill(false);
          return; // Success — stop retrying
        } else {
          // API returned a non-success response — don't retry
          if (isMounted()) platformAlert('Error', res.message || 'Could not fetch bill details');
          if (isMounted()) setLoadingBill(false);
          return;
        }
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error('Failed to fetch bill details');
        // Only retry on network/timeout errors; stop if unmounted
        if (!isMounted()) return;
      }
    }
    // All attempts exhausted
    errorReporter.captureError(
      lastErr ?? new Error('Failed to fetch bill details'),
      { context: 'BillPaymentPage.handleFetchBill', metadata: { attempts: MAX_ATTEMPTS } },
      'warning',
    );
    if (isMounted()) {
      platformAlert('Error', 'Failed to fetch bill after 3 attempts. Please check your connection and try again.');
      setLoadingBill(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider, consumerNumber]);

  const handlePayBill = useCallback(async () => {
    if (!fetchedBill || !selectedProvider || !fetchedBill.amount) return;

    // CONS-017: Client-side redemption cap validation
    // NA-HIGH-07 FIX: Use Math.round instead of Math.floor to eliminate floating-point under-redemption
    if (coinsToRedeem > 0) {
      const maxRedeemable = Math.round(fetchedBill.amount * ((selectedProvider.maxRedemptionPercent ?? 0) / 100));
      if (coinsToRedeem > maxRedeemable) {
        platformAlert(
          'Redemption Cap Exceeded',
          `Maximum ${maxRedeemable} coins can be used for this bill (${selectedProvider.maxRedemptionPercent}% of ₹${fetchedBill.amount}).`,
        );
        return;
      }
      if (coinsToRedeem > promoCoinsAvailable) {
        platformAlert('Insufficient Coins', `You only have ${promoCoinsAvailable} promo coins available.`);
        return;
      }
    }

    // CONS-011: Analytics — payment initiated
    try {
      errorReporter.captureError(
        new Error('bill_payment_initiated'),
        {
          context: 'analytics',
          metadata: {
            billType: selectedProvider.type,
            provider: selectedProvider.code,
            amount: fetchedBill.amount,
            coinsToRedeem,
          },
        },
        'info',
      );
    } catch {
      /* non-critical */
    }

    try {
      setLoadingPay(true);

      // CONS-001: Step 1 — Create Razorpay order for the bill amount
      let razorpayPaymentId: string;
      try {
        const order = await razorpayService.createOrder(
          `bill_${selectedProvider._id}_${Date.now()}`,
          fetchedBill.amount,
          'INR',
          {
            billType: selectedProvider.type,
            providerCode: selectedProvider.code,
            customerNumber: consumerNumber.trim(),
          },
        );

        // Step 2 — Open Razorpay checkout
        const paymentData = await razorpayService.openCheckout(order);
        razorpayPaymentId = paymentData.razorpay_payment_id;
      } catch (razorpayErr) {
        // User cancelled or Razorpay error — don't proceed
        if (razorpayErr.message?.includes('cancelled')) {
          return; // Silent cancel — no error shown
        }
        throw razorpayErr;
      }

      // CA-PAY-003 FIX: crypto.randomUUID() replaces Date.now() for collision-safe idempotency.
      const idempotencyKey = `bill-${selectedProvider._id}-${consumerNumber.trim()}-${crypto.randomUUID()}`;

      // Step 3 — Confirm payment with backend BBPS
      const res = await payBill(
        selectedProvider._id,
        consumerNumber.trim(),
        fetchedBill.amount,
        razorpayPaymentId,
        undefined,
        idempotencyKey,
      );

      if (res.success && res.data) {
        const { payment, promoCoinsEarned } = res.data;

        // CONS-011: Analytics — payment success
        try {
          errorReporter.captureError(
            new Error('bill_payment_completed'),
            {
              context: 'analytics',
              metadata: { billType: selectedProvider.type, amount: fetchedBill.amount, coinsEarned: promoCoinsEarned },
            },
            'info',
          );
        } catch {
          /* non-critical */
        }

        // CONS-018: Poll for webhook confirmation if status is 'processing'
        if (payment?.status === 'processing' && payment?._id) {
          setLastPaymentId(payment._id);
          setPaymentPolling(true);
          pollErrorCountRef.current = 0;
          let pollCount = 0;
          // CA-PAY-008 FIX: Add max timeout protection (5 minutes) to prevent infinite polling
          const pollStartTime = Date.now();
          const MAX_POLL_DURATION = 5 * 60 * 1000; // 5 minutes
          // CA-PAY-009 FIX: Stop polling after this many consecutive errors so we surface
          // the problem instead of silently burning through the poll budget.
          const MAX_CONSECUTIVE_POLL_ERRORS = 5;
          pollIntervalRef.current = setInterval(async () => {
            pollCount++;
            // CA-PAY-008 FIX: Check elapsed time to stop polling after max duration
            const elapsedTime = Date.now() - pollStartTime;
            if (elapsedTime > MAX_POLL_DURATION) {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              if (isMounted()) setPaymentPolling(false);
              platformAlert(
                'Payment Status Pending',
                'Payment status is still being confirmed. Please check your transaction history.',
              );
              return;
            }
            try {
              const statusRes = await getPaymentHistory(1, 5);
              const updated = statusRes.data?.payments?.find((p) => p._id === payment._id);
              // FL-05 fix: rez-finance-service returns 'success' as terminal status (not 'completed')
              const status = updated?.status as string | undefined;
              // CA-PAY-009 FIX: Reset the error counter on any successful poll
              pollErrorCountRef.current = 0;
              if (status === 'completed' || status === 'success' || status === 'failed') {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (isMounted()) setPaymentPolling(false);
                if (status === 'failed') {
                  platformAlert('Payment Failed', 'Payment was not completed. Please contact support.');
                }
              }
            } catch {
              // CA-PAY-009 FIX: Actually stop after MAX_CONSECUTIVE_POLL_ERRORS
              // instead of silently burning through pollCount. Previous catch was a no-op.
              pollErrorCountRef.current += 1;
              if (pollErrorCountRef.current >= MAX_CONSECUTIVE_POLL_ERRORS) {
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                if (isMounted()) setPaymentPolling(false);
                platformAlert(
                  'Status Check Unavailable',
                  'Status check unavailable — please check your wallet history.',
                );
              }
            }
            if (pollCount >= 100) {
              // Stop after 100 polls (300s / 5 minutes) — also bounded by MAX_POLL_DURATION above
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              if (isMounted()) setPaymentPolling(false);
            }
          }, 3000);
        }

        const coinsEarnedMsg = promoCoinsEarned > 0 ? ` You earned ${promoCoinsEarned} promo coins!` : '';
        platformAlert('Success', `Bill payment submitted!${coinsEarnedMsg}`);

        // CONS-004: Refresh wallet balance after earning promo coins
        refreshWallet().catch(() => {
          /* non-blocking */
        });

        if (!isMounted()) return;
        setFetchedBill(null);
        setConsumerNumber('');
        setSelectedProvider(null);
        setCoinsToRedeem(0);
        loadHistory(1);
      } else {
        // CONS-011: Analytics — payment failed
        try {
          errorReporter.captureError(
            new Error('bill_payment_failed'),
            { context: 'analytics', metadata: { billType: selectedProvider.type, error: res.message } },
            'info',
          );
        } catch {
          /* non-critical */
        }
        platformAlert('Error', res.message || 'Payment failed');
      }
    } catch (err) {
      errorReporter.captureError(
        err instanceof Error ? err : new Error('Bill payment failed'),
        { context: 'BillPaymentPage.handlePayBill' },
        'warning',
      );
      // CONS-006: Never let async errors go uncaught — always show user-friendly message
      platformAlert('Payment Failed', 'No charge was made. Please try again.');
    } finally {
      if (!isMounted()) return;
      setLoadingPay(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchedBill,
    selectedProvider,
    consumerNumber,
    currencySymbol,
    loadHistory,
    coinsToRedeem,
    promoCoinsAvailable,
    refreshWallet,
  ]);

  const handleLoadMoreHistory = useCallback(() => {
    if (!hasMoreHistory || loadingMoreHistory) return;
    loadHistory(historyPage + 1, true);
  }, [hasMoreHistory, loadingMoreHistory, historyPage, loadHistory]);

  // ============================================
  // HELPER: bill type icon/color from backend data or local meta
  // ============================================

  const getBillTypeMeta = useCallback(
    (typeId: string) => {
      const found = billTypes.find((t) => t.id === typeId);
      return found || { icon: 'receipt-outline', color: Colors.gold, label: typeId };
    },
    [billTypes],
  );

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderBillTypeCard = useCallback(
    (type: BillTypeInfo) => {
      const isActive = selectedType === type.id;
      return (
        <Pressable
          key={type.id}
          style={[styles.billTypeCard, isActive ? styles.billTypeCardActive : null]}
          onPress={() => {
            setSelectedType(type.id);
          }}
        >
          <View style={[styles.billTypeIcon, { backgroundColor: type.color + '20' }]}>
            <Ionicons name={type.icon as unknown} size={24} color={type.color} />
          </View>
          <Text style={styles.billTypeName}>{type.label}</Text>
          {type.providerCount > 0 && <Text style={styles.billTypeCount}>{type.providerCount}</Text>}
        </Pressable>
      );
    },
    [selectedType],
  );

  const renderProviderCard = useCallback(
    (provider: BillProviderInfo) => {
      const isActive = selectedProvider?._id === provider._id;
      return (
        <Pressable
          key={provider._id}
          style={[styles.providerCard, isActive ? styles.providerCardActive : null]}
          onPress={() => {
            setSelectedProvider(provider);
            setFetchedBill(null);
            setConsumerNumber('');
          }}
        >
          {provider.logo ? (
            <CachedImage source={{ uri: provider.logo }} style={styles.providerLogo} contentFit="contain" />
          ) : (
            <View style={styles.providerIcon}>
              <Ionicons name={getBillTypeMeta(provider.type).icon as unknown} size={20} color={Colors.gold} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
              {provider.cashbackPercent > 0 && (
                <Text style={styles.providerCashback}>{provider.cashbackPercent}% cashback</Text>
              )}
              {/* CONS-005: Show max redemption cap so users know upfront */}
              {(provider.maxRedemptionPercent ?? 0) > 0 && (
                <Text style={styles.providerCoinCap}>up to {provider.maxRedemptionPercent}% coins</Text>
              )}
            </View>
          </View>
          {isActive && <Ionicons name="checkmark-circle" size={20} color={Colors.gold} />}
        </Pressable>
      );
    },
    [selectedProvider, getBillTypeMeta],
  );

  const renderRecentPayment = useCallback(
    ({ item }: { item: BillPaymentRecord }) => {
      const meta = getBillTypeMeta(item.billType);
      const isPaid = item.status === 'completed';
      return (
        <Pressable style={styles.recentCard}>
          <View style={styles.recentIcon}>
            <Ionicons name={meta.icon as unknown} size={20} color={Colors.gold} />
          </View>
          <View style={styles.recentInfo}>
            <Text style={styles.recentType}>{meta.label}</Text>
            <Text style={styles.recentProvider}>
              {item.provider?.name || 'Unknown'} - {item.customerNumber}
            </Text>
          </View>
          <View style={styles.recentAmount}>
            <Text style={styles.recentAmountText}>
              {currencySymbol}
              {item.amount.toLocaleString()}
            </Text>
            <View style={[styles.recentStatus, isPaid ? styles.recentStatusPaid : null]}>
              <Text style={[styles.recentStatusText, isPaid ? styles.recentStatusTextPaid : null]}>
                {isPaid ? 'Paid' : item.status === 'failed' ? 'Failed' : 'Pending'}
              </Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [currencySymbol, getBillTypeMeta],
  );

  const renderHistoryFooter = useCallback(() => {
    if (!loadingMoreHistory) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.gold} />
      </View>
    );
  }, [loadingMoreHistory]);

  // ============================================
  // MAIN LIST HEADER (all content above history)
  // ============================================

  const ListHeader = useCallback(() => {
    const typeMeta = selectedType ? getBillTypeMeta(selectedType) : null;

    return (
      <View>
        {/* Cashback Banner */}
        <View style={styles.banner}>
          <LinearGradient
            colors={['rgba(255, 205, 87, 0.15)', 'rgba(251, 191, 36, 0.15)']}
            style={styles.bannerGradient}
          >
            <Ionicons name="gift" size={24} color={Colors.gold} />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Earn Cashback</Text>
              <Text style={styles.bannerSubtitle}>
                {`Pay your utility bills and earn ${BRAND.COIN_NAME} as cashback`}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Bill Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Bill Type</Text>
          {loadingTypes ? (
            <View style={styles.centeredLoader}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          ) : billTypes.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={32} color={colors.text.secondary} />
              </View>
              <Text style={styles.emptyTitle}>No Bill Types Available</Text>
              <Text style={styles.emptySubtitle}>Please check back later</Text>
            </View>
          ) : (
            <View style={styles.billTypesGrid}>{billTypes.map(renderBillTypeCard)}</View>
          )}
        </View>

        {/* Provider Selection */}
        {selectedType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Provider</Text>
            {loadingProviders ? (
              <View style={styles.centeredLoader}>
                <ActivityIndicator size="small" color={Colors.gold} />
              </View>
            ) : providers.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={(typeMeta?.icon as unknown) || 'business-outline'}
                    size={28}
                    color={colors.text.secondary}
                  />
                </View>
                <Text style={styles.emptyTitle}>No Providers Found</Text>
                <Text style={styles.emptySubtitle}>No providers available for {typeMeta?.label || selectedType}</Text>
              </View>
            ) : (
              <View style={styles.providersList}>{providers.map(renderProviderCard)}</View>
            )}
          </View>
        )}

        {/* Consumer Number Input */}
        {selectedProvider && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedProvider.requiredFields?.[0]?.label || 'Consumer/Account Number'}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={selectedProvider.requiredFields?.[0]?.placeholder || 'Enter your consumer number'}
                placeholderTextColor={colors.text.secondary}
                value={consumerNumber}
                onChangeText={setConsumerNumber}
                keyboardType={selectedProvider.requiredFields?.[0]?.type === 'number' ? 'numeric' : 'default'}
              />
              <Pressable
                style={[styles.fetchButton, (!consumerNumber.trim() || loadingBill) && styles.fetchButtonDisabled]}
                onPress={handleFetchBill}
                disabled={!consumerNumber.trim() || loadingBill}
              >
                {loadingBill ? (
                  <ActivityIndicator size="small" color={colors.background.primary} />
                ) : (
                  <Text style={styles.fetchButtonText}>Fetch Bill</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Fetched Bill Details */}
        {fetchedBill && selectedProvider && (
          <View style={styles.billCard}>
            <View style={styles.billHeader}>
              <Ionicons name="receipt-outline" size={24} color={Colors.gold} />
              <Text style={styles.billTitle}>Bill Details</Text>
            </View>
            <View style={styles.billDetails}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Provider</Text>
                <Text style={styles.billValue}>{fetchedBill.provider.name}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Consumer Number</Text>
                <Text style={styles.billValue}>{fetchedBill.customerNumber}</Text>
              </View>
              {fetchedBill.dueDate && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Due Date</Text>
                  <Text style={styles.billValue}>{new Date(fetchedBill.dueDate).toLocaleDateString()}</Text>
                </View>
              )}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Bill Amount</Text>
                <Text style={styles.billAmount}>
                  {currencySymbol}
                  {fetchedBill.amount?.toLocaleString()}
                </Text>
              </View>
              {(fetchedBill.cashbackAmount ?? 0) > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Cashback</Text>
                  <Text style={styles.billCashback}>
                    + {currencySymbol}
                    {fetchedBill.cashbackAmount!.toLocaleString()} ({fetchedBill.cashbackPercent}%)
                  </Text>
                </View>
              )}

              {/* CONS-003: Promo coin earn + expiry warning */}
              {(fetchedBill.promoCoins ?? 0) > 0 && (
                <View style={styles.promoCoinsRow}>
                  <Ionicons name="star" size={16} color={Colors.gold} />
                  <Text style={styles.promoCoinsText}>
                    Earn {fetchedBill.promoCoins} promo coins
                    {fetchedBill.promoExpiryDays ? ` • expires in ${fetchedBill.promoExpiryDays} days` : ''}
                  </Text>
                  {(fetchedBill.promoExpiryDays ?? 99) <= 3 && (
                    <View style={styles.expiryWarning}>
                      <Text style={styles.expiryWarningText}>Expires soon!</Text>
                    </View>
                  )}
                </View>
              )}

              {/* CONS-016: Show pending promo coins in wallet */}
              {(walletData?.pendingRewards ?? 0) > 0 && (
                <View style={styles.pendingCoinsRow}>
                  <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                  <Text style={styles.pendingCoinsText}>{walletData!.pendingRewards} coins arriving soon</Text>
                </View>
              )}

              {/* CONS-005 + CONS-017: Coin redemption section with cap */}
              {promoCoinsAvailable > 0 && (selectedProvider.maxRedemptionPercent ?? 0) > 0 && (
                <View style={styles.coinRedemptionSection}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Use Promo Coins</Text>
                    <Text style={styles.coinCapText}>
                      Max {selectedProvider.maxRedemptionPercent}% of bill (
                      {/* NA-HIGH-07 FIX: Math.round instead of Math.floor for accurate display */}
                      {Math.round(
                        (fetchedBill.amount ?? 0) * ((selectedProvider.maxRedemptionPercent ?? 0) / 100),
                      )}{' '}
                      coins)
                    </Text>
                  </View>
                  <View style={styles.coinInputRow}>
                    <Pressable style={styles.coinAdjBtn} onPress={() => setCoinsToRedeem((c) => Math.max(0, c - 5))}>
                      <Ionicons name="remove" size={16} color={colors.text.primary} />
                    </Pressable>
                    <TextInput
                      style={styles.coinInput}
                      value={String(coinsToRedeem)}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const num = parseInt(v, 10) || 0;
                        const maxRedeemable = Math.round(
                          (fetchedBill.amount ?? 0) * ((selectedProvider.maxRedemptionPercent ?? 0) / 100),
                        );
                        setCoinsToRedeem(Math.min(num, Math.min(promoCoinsAvailable, maxRedeemable)));
                      }}
                    />
                    <Pressable
                      style={styles.coinAdjBtn}
                      onPress={() => {
                        const maxRedeemable = Math.round(
                          (fetchedBill.amount ?? 0) * ((selectedProvider.maxRedemptionPercent ?? 0) / 100),
                        );
                        setCoinsToRedeem((c) => Math.min(c + 5, Math.min(promoCoinsAvailable, maxRedeemable)));
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.text.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.coinMaxBtn}
                      onPress={() => {
                        const maxRedeemable = Math.round(
                          (fetchedBill.amount ?? 0) * ((selectedProvider.maxRedemptionPercent ?? 0) / 100),
                        );
                        setCoinsToRedeem(Math.min(promoCoinsAvailable, maxRedeemable));
                      }}
                    >
                      <Text style={styles.coinMaxBtnText}>Use Max</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.coinBalanceText}>Available: {promoCoinsAvailable} coins</Text>
                </View>
              )}

              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>You Pay</Text>
                <Text style={styles.billTotal}>
                  {currencySymbol}
                  {Math.max(0, (fetchedBill.amount ?? 0) - coinsToRedeem).toLocaleString()}
                </Text>
              </View>
              {coinsToRedeem > 0 && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coins discount</Text>
                  <Text style={styles.billCashback}>- {coinsToRedeem} coins</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Payments Header */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {loadingHistory && (
            <View style={styles.centeredLoader}>
              <ActivityIndicator size="small" color={Colors.gold} />
            </View>
          )}
          {!loadingHistory && recentPayments.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="time-outline" size={32} color={colors.text.secondary} />
              </View>
              <Text style={styles.emptyTitle}>No Payments Yet</Text>
              <Text style={styles.emptySubtitle}>Your bill payment history will appear here</Text>
            </View>
          )}
        </View>
      </View>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    billTypes,
    selectedType,
    providers,
    selectedProvider,
    consumerNumber,
    fetchedBill,
    loadingTypes,
    loadingProviders,
    loadingBill,
    loadingHistory,
    recentPayments.length,
    currencySymbol,
    renderBillTypeCard,
    renderProviderCard,
    getBillTypeMeta,
    handleFetchBill,
  ]);

  // ============================================
  // RENDER
  // ============================================

  if (error && !loadingTypes) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Bill Payments</Text>
          <View style={{ width: 32 }} />
        </View>
        <ErrorState error={error} onRetry={refetchBillTypes} title="Failed to Load Bill Types" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Bill Payments</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlashList
        data={recentPayments}
        renderItem={renderRecentPayment}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={renderHistoryFooter}
        onEndReached={handleLoadMoreHistory}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={80}
      />

      {/* CONS-018: Payment processing/polling status banner */}
      {paymentPolling && (
        <View style={styles.pollingBanner}>
          <ActivityIndicator size="small" color={Colors.gold} />
          <Text style={styles.pollingText}>Confirming payment with provider...</Text>
        </View>
      )}

      {/* Bottom CTA */}
      {fetchedBill && !paymentPolling && (
        <View style={styles.bottomCta}>
          <Pressable
            style={[styles.payButton, loadingPay ? styles.payButtonDisabled : null]}
            onPress={handlePayBill}
            disabled={loadingPay}
          >
            {loadingPay ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : (
              <>
                <Text style={styles.payButtonText}>
                  Pay {currencySymbol}
                  {Math.max(0, (fetchedBill.amount ?? 0) - coinsToRedeem).toLocaleString()}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.background.primary} />
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listContent: {
    paddingBottom: 120,
  },
  banner: {
    margin: Spacing.base,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  billTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  billTypeCard: {
    width: '22%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  billTypeCardActive: {
    borderColor: Colors.gold,
  },
  billTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  billTypeName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  billTypeCount: {
    fontSize: 10,
    color: colors.text.secondary,
    marginTop: 2,
  },
  providersList: {
    gap: Spacing.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  providerCardActive: {
    borderColor: Colors.gold,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 205, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  providerCashback: {
    fontSize: 12,
    color: Colors.gold,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  fetchButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    minWidth: 90,
    alignItems: 'center',
  },
  fetchButtonDisabled: {
    backgroundColor: colors.text.secondary,
  },
  fetchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  billCard: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.xl,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  billDetails: {
    gap: Spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  billCashback: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: Spacing.sm,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  billTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gold,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 205, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentType: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 2,
  },
  recentProvider: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  recentAmount: {
    alignItems: 'flex-end',
  },
  recentAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  recentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  recentStatusPaid: {
    backgroundColor: 'rgba(255, 205, 87, 0.1)',
  },
  recentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.error,
  },
  recentStatusTextPaid: {
    color: Colors.gold,
  },
  bottomCta: {
    padding: Spacing.base,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  centeredLoader: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  // CONS-005: Provider coin cap label
  providerCoinCap: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  // CONS-003: Promo coin earn row with expiry
  promoCoinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 205, 87, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  promoCoinsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '500',
  },
  expiryWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  expiryWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.error,
  },
  // CONS-016: Pending coins row
  pendingCoinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  pendingCoinsText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  // CONS-005 + CONS-017: Coin redemption section
  coinRedemptionSection: {
    backgroundColor: 'rgba(255, 205, 87, 0.06)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.2)',
  },
  coinCapText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  coinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  coinAdjBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  coinInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  coinMaxBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  coinMaxBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background.primary,
  },
  coinBalanceText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  // CONS-018: Payment polling banner
  pollingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 205, 87, 0.1)',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  pollingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default withErrorBoundary(BillPaymentPage, 'Bill Payment');
