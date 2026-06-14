import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentMode } from '@/config/payment';

const RazorpayCheckout = Platform.OS !== 'web' ? require('react-native-razorpay').default : null;

// Plan display config (features & colors only — prices/limits come from API)
const PLAN_DISPLAY: Record<string, { color: string; features: string[]; popular?: boolean }> = {
  starter: {
    color: '#6b7280',
    features: ['Basic analytics', 'REZ booking widget', 'Standard support'],
  },
  growth: {
    color: '#1a3a52',
    features: [
      'Advanced analytics',
      'Dynamic pricing',
      'Priority support',
      'Web QR ordering',
      'WhatsApp notifications',
    ],
    popular: true,
  },
  pro: {
    color: '#b7791f',
    features: [
      'Full analytics suite',
      'Multi-outlet management',
      'Dedicated account manager',
      'Custom commission rates',
      'API access',
    ],
  },
};

interface MerchantPlan {
  _id: string;
  plan: 'starter' | 'growth' | 'pro';
  monthlyPrice: number;
  maxProducts: number;
  maxStores: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
  pushPerMonth: number;
  analyticsRetentionDays: number;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { activeStore } = useStore();
  const { merchant } = useAuth();
  const [plans, setPlans] = useState<MerchantPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<'starter' | 'growth' | 'pro'>('starter');
  const [usage, setUsage] = useState({ staff: 0, products: 0, monthlyBookings: 0 });
  const [staffLimit, setStaffLimit] = useState(2);
  const [monthlyBookingsLimit, setMonthlyBookingsLimit] = useState(100);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const loadSubscriptionData = useCallback(async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        apiClient.get<{
          plan: string;
          planLabel: string;
          nextBillingDate: string | null;
          usage: {
            staff: number;
            staffLimit: number;
            products: number;
            productsLimit: number;
            monthlyBookings: number;
            monthlyBookingsLimit: number;
          };
          invoices: Invoice[];
        }>('merchant/subscription'),
        apiClient.get<MerchantPlan[]>('merchant/subscription/plans'),
      ]);

      if (subRes.success && subRes.data) {
        const { plan, usage: u, nextBillingDate: nbd, invoices: inv } = subRes.data;
        setCurrentPlan((plan as 'starter' | 'growth' | 'pro') || 'starter');
        setUsage({
          staff: u?.staff ?? 0,
          products: u?.products ?? 0,
          monthlyBookings: u?.monthlyBookings ?? 0,
        });
        setStaffLimit(u?.staffLimit ?? 2);
        setMonthlyBookingsLimit(u?.monthlyBookingsLimit ?? 100);
        setNextBillingDate(nbd || null);
        setInvoices(inv || []);
      }

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }
    } catch (error) {
      logger.error('[Subscription] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadSubscriptionData();
    }, [loadSubscriptionData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubscriptionData();
    setRefreshing(false);
  }, [loadSubscriptionData]);

  const handleUpgrade = async (plan: MerchantPlan) => {
    if (plan.plan === currentPlan) return;
    if (plan.monthlyPrice === 0) return;

    try {
      setUpgradingPlan(plan.plan);

      // Step 1: Create Razorpay order
      const orderRes = await apiClient.post<{
        razorpayOrderId: string;
        amountInPaise: number;
        currency: string;
        keyId: string;
        planName: string;
      }>('merchant/subscription/upgrade', {
        planName: plan.plan,
        storeId: activeStore?._id ?? '',
      });

      if (!orderRes.success) throw new Error(orderRes.message || 'Failed to create order');

      const { razorpayOrderId, amountInPaise, currency, keyId } = orderRes.data!;

      if (!RazorpayCheckout) {
        platformAlertSimple(
          'Not Available',
          'Payment is only available in the mobile app. Please use the Rez Merchant app on your phone.'
        );
        return;
      }

      // MA-GAP-150: Pre-flight token refresh check — if token expires during the
      // long checkout session, the verification POST will fail (gap 145 / 150).
      try {
        await apiClient.get('merchant/auth/me');
      } catch (e) {
        if (e?.response?.status === 401 || e?.status === 401) {
          platformAlertSimple('Session Expired', 'Please log in again to continue.');
          return;
        }
      }

      // Step 2: Open Razorpay checkout
      // FIX (131, 136): Handler callback + modal timeout to prevent promise hanging indefinitely.
      // FIX (135): Use numeric code 2 for cancellation (PAYMENT_CANCELLED is 2, not a string).
      let paymentData: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      } | null = null;
      let handlerError: Error | null = null;

      const timeoutId = setTimeout(
        () => {
          RazorpayCheckout.close();
          handlerError = new Error('Payment session expired. Please try again.');
        },
        10 * 60 * 1000
      ); // 10 minutes

      const options = {
        description: `REZ ${plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)} Subscription`,
        currency: currency || 'INR',
        key: keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: String(amountInPaise),
        name: 'REZ App',
        order_id: razorpayOrderId,
        prefill: {
          email: merchant?.email || '',
          contact: merchant?.phone || '',
          name: merchant?.ownerName || '',
        },
        theme: { color: '#7C3AED' },
        handler: (data: typeof paymentData) => {
          clearTimeout(timeoutId);
          paymentData = data;
        },
        modal: {
          ondismiss: () => {
            clearTimeout(timeoutId);
          },
        },
      };

      try {
        await RazorpayCheckout.open(options);
      } finally {
        clearTimeout(timeoutId);
      }

      if (handlerError) {
        throw handlerError;
      }

      if (!paymentData) {
        // User dismissed without completing — not an error
        return;
      }

      // Step 3: Verify payment with null checks
      // FIX (137): Guard against undefined fields from incomplete Razorpay responses.
      // FIX (132): Retry logic on transient failures. Uses order_id as idempotency key.
      // FIX (148): Send amountInPaise for defense-in-depth verification.
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        logger.error('Razorpay incomplete response', { paymentData });
        throw new Error('Incomplete payment response. Please contact support.');
      }

      // MA-GAP-149: Validate the returned order_id matches what was sent — prevents
      // attacker-in-the-middle injection of a different order during the checkout window.
      if (razorpay_order_id !== razorpayOrderId) {
        logger.error('Razorpay order ID mismatch', {
          expected: razorpayOrderId,
          received: razorpay_order_id,
        });
        throw new Error('Payment verification failed: order mismatch. Please contact support.');
      }

      let verifyRes: { success: boolean; message?: string } | null = null;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          verifyRes = await apiClient.post<{ success: boolean; message?: string }>(
            'merchant/subscription/verify-payment',
            {
              razorpay_payment_id,
              razorpay_order_id,
              razorpay_signature,
              planName: plan.plan,
              amountInPaise,
            }
          );
          if (verifyRes.success) break;
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * attempt)); // 1s, 2s delay
          }
        } catch (verifyErr) {
          if (attempt === maxRetries) throw verifyErr;
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }

      if (!verifyRes?.success) throw new Error(verifyRes?.message || 'Payment verification failed');

      platformAlertSimple('Success', 'Your plan has been upgraded!');
      loadSubscriptionData();
    } catch (err) {
      // FIX (135): PAYMENT_CANCELLED = 2 as numeric code, not string 'payment_cancelled'.
      // Numeric code 2: NETWORK_ERROR or PAYMENT_CANCELLED. We treat both as user-initiated dismissal.
      const errorCode = typeof err.code === 'number' ? err.code : 0;
      if (errorCode !== 2) {
        const msg = err.description || err.message || 'Please try again';
        platformAlertSimple('Payment Failed', msg);
      }
    } finally {
      setUpgradingPlan(null);
    }
  };

  const planDisplay = PLAN_DISPLAY[currentPlan] || PLAN_DISPLAY.starter;
  const planLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor:
              colorScheme === 'dark' ? Colors.light.gray[900] : Colors.light.gray[50],
          },
        ]}
      >
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colorScheme === 'dark' ? Colors.light.gray[900] : Colors.light.gray[50],
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* TEST MODE banner */}
      {getPaymentMode() === 'test' && (
        <View style={styles.testModeBanner}>
          <Text style={styles.testModeBannerText}>TEST MODE — Payments are not real</Text>
        </View>
      )}

      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Plan</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* Current Plan Card */}
      <View style={styles.currentPlanCard}>
        <View style={styles.planBadge}>
          <Text style={[styles.planBadgeText, { color: planDisplay.color }]}>
            {planLabel.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.currentPlanName}>{planLabel} Plan</Text>
        {nextBillingDate && <Text style={styles.billingDate}>Next billing: {nextBillingDate}</Text>}
        {nextBillingDate === null && currentPlan === 'starter' && (
          <Text style={styles.billingDate}>Free forever</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/subscription/usage')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="bar-chart-outline" size={20} color="#2563EB" />
          </View>
          <Text style={styles.quickActionText}>Usage</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/subscription/upgrade')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="arrow-up-circle-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.quickActionText}>Upgrade</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => router.push('/subscription/payment-history')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="receipt-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.quickActionText}>Payments</Text>
        </TouchableOpacity>
      </View>

      {/* Usage Bars */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Usage</Text>
          <TouchableOpacity onPress={() => router.push('/subscription/usage')}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.usageItem}>
          <View style={styles.usageLabel}>
            <Text style={styles.usageTitle}>Staff Members</Text>
            <Text style={styles.usageValue}>
              {usage.staff}/{staffLimit}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((usage.staff / Math.max(staffLimit, 1)) * 100, 100)}%`,
                  backgroundColor: '#10b981',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.usageItem}>
          <View style={styles.usageLabel}>
            <Text style={styles.usageTitle}>Monthly Bookings</Text>
            <Text style={styles.usageValue}>
              {usage.monthlyBookings}/{monthlyBookingsLimit}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    (usage.monthlyBookings / Math.max(monthlyBookingsLimit, 1)) * 100,
                    100
                  )}%`,
                  backgroundColor: '#f59e0b',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Plan Comparison */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Plans</Text>
          <TouchableOpacity onPress={() => router.push('/subscription/upgrade')}>
            <Text style={styles.seeAllLink}>Compare Plans</Text>
          </TouchableOpacity>
        </View>

        {plans.length === 0 ? (
          <Text style={styles.emptyText}>No plans available</Text>
        ) : (
          plans.map((p) => {
            const display = PLAN_DISPLAY[p.plan] || PLAN_DISPLAY.starter;
            const isCurrentPlan = currentPlan === p.plan;
            const isUpgrading = upgradingPlan === p.plan;
            const isStarter = p.monthlyPrice === 0;

            return (
              <View
                key={p._id}
                style={[styles.planCard, display.popular && styles.popularPlanCard]}
              >
                {display.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                <Text style={styles.planName}>
                  {p.plan.charAt(0).toUpperCase() + p.plan.slice(1)}
                </Text>
                <View style={styles.priceSection}>
                  <Text style={styles.price}>
                    {p.monthlyPrice === 0 ? 'Free' : `₹${p.monthlyPrice.toLocaleString('en-IN')}`}
                  </Text>
                  <Text style={styles.period}>
                    {p.monthlyPrice === 0 ? 'Free forever' : '/ month'}
                  </Text>
                </View>

                {/* Features from display config + dynamic limits */}
                <View style={styles.features}>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={display.color} />
                    <Text style={styles.featureText}>
                      Up to {p.maxProducts >= 9999 ? 'unlimited' : p.maxProducts} products
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={display.color} />
                    <Text style={styles.featureText}>
                      Up to {p.maxStores >= 10 ? p.maxStores + '+' : p.maxStores} stores
                    </Text>
                  </View>
                  {(display.features || []).map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={display.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Upgrade Button */}
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    (isCurrentPlan || isStarter || upgradingPlan !== null) &&
                      styles.upgradeButtonDisabled,
                  ]}
                  onPress={() => handleUpgrade(p)}
                  disabled={isCurrentPlan || isStarter || upgradingPlan !== null}
                >
                  {isUpgrading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      style={[
                        styles.upgradeButtonText,
                        (isCurrentPlan || isStarter) && styles.upgradeButtonTextDisabled,
                      ]}
                    >
                      {isCurrentPlan ? 'Current Plan' : isStarter ? 'Free' : 'Upgrade'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Billing History */}
      {invoices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Billing History</Text>
            <TouchableOpacity onPress={() => router.push('/subscription/payment-history')}>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
          </View>

          {invoices.slice(0, 3).map((invoice) => (
            <View key={invoice.id} style={styles.invoiceRow}>
              <View>
                <Text style={styles.invoiceDate}>{invoice.date}</Text>
                <Text style={styles.invoiceStatus}>{invoice.status}</Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>₹{invoice.amount}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {invoices.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing History</Text>
          <Text style={styles.emptyText}>No invoices yet</Text>
        </View>
      )}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  currentPlanCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937',
  },
  billingDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  usageItem: {
    marginBottom: 16,
  },
  usageLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  usageValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  planCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: '#7C3AED',
    backgroundColor: '#f9f5ff',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  period: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  features: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#374151',
  },
  upgradeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  upgradeButtonTextDisabled: {
    color: '#9ca3af',
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  invoiceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  invoiceStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  footer: {
    height: 40,
  },
  testModeBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  testModeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.3,
  },
});
