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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { platformAlertSimple } from '@/utils/platformAlert';

const RazorpayCheckout = Platform.OS !== 'web' ? require('react-native-razorpay').default : null;

// Plan display configuration
const PLAN_CONFIG: Record<string, { color: string; gradient: string[]; features: string[]; popular?: boolean }> = {
  starter: {
    color: '#6b7280',
    gradient: ['#6b7280', '#9ca3af'],
    features: [
      'Basic analytics dashboard',
      'REZ booking widget',
      'Standard support',
      'Up to 50 products',
      'Single outlet',
      'Email notifications',
    ],
  },
  growth: {
    color: '#7C3AED',
    gradient: ['#7C3AED', '#6366F1'],
    features: [
      'Advanced analytics & insights',
      'Dynamic pricing engine',
      'Priority phone support',
      'Web QR ordering',
      'WhatsApp notifications',
      'Up to 500 products',
      'Up to 3 outlets',
      'Marketing tools',
    ],
    popular: true,
  },
  pro: {
    color: '#b7791f',
    gradient: ['#b7791f', '#d69e2e'],
    features: [
      'Full analytics suite',
      'Multi-outlet management',
      'Dedicated account manager',
      'Custom commission rates',
      'API access',
      'Unlimited products',
      'Unlimited outlets',
      'White-label options',
      'Advanced integrations',
    ],
  },
};

interface MerchantPlan {
  _id: string;
  plan: 'starter' | 'growth' | 'pro';
  monthlyPrice: number;
  yearlyPrice: number;
  maxProducts: number;
  maxStores: number;
  smsPerMonth: number;
  whatsappPerMonth: number;
  pushPerMonth: number;
  analyticsRetentionDays: number;
  features: string[];
}

interface SubscriptionData {
  currentPlan: 'starter' | 'growth' | 'pro';
  nextBillingDate: string | null;
  billingCycle: 'monthly' | 'yearly';
}

export default function UpgradeScreen() {
  const { activeStore } = useStore();
  const { merchant } = useAuth();

  const [plans, setPlans] = useState<MerchantPlan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        apiClient.get<{
          plan: string;
          nextBillingDate: string | null;
          billingCycle: 'monthly' | 'yearly';
        }>('merchant/subscription'),
        apiClient.get<MerchantPlan[]>('merchant/subscription/plans'),
      ]);

      if (subRes.success && subRes.data) {
        setSubscription({
          currentPlan: (subRes.data.plan as 'starter' | 'growth' | 'pro') || 'starter',
          nextBillingDate: subRes.data.nextBillingDate || null,
          billingCycle: subRes.data.billingCycle || 'monthly',
        });
        setBillingCycle(subRes.data.billingCycle || 'monthly');
      }

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }
    } catch (error) {
      logger.error('[Upgrade] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getPlanPrice = (plan: MerchantPlan) => {
    if (billingCycle === 'yearly') {
      return Math.round(plan.yearlyPrice / 12);
    }
    return plan.monthlyPrice;
  };

  const getYearlyTotal = (plan: MerchantPlan) => {
    return plan.yearlyPrice;
  };

  const getYearlySavings = (plan: MerchantPlan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    return monthlyTotal - plan.yearlyPrice;
  };

  const getPlanIndex = (planName: string): number => {
    const order = ['starter', 'growth', 'pro'];
    return order.indexOf(planName);
  };

  const canUpgradeTo = (targetPlan: string): boolean => {
    if (!subscription) return false;
    return getPlanIndex(targetPlan) > getPlanIndex(subscription.currentPlan);
  };

  const canDowngradeTo = (targetPlan: string): boolean => {
    if (!subscription) return false;
    return getPlanIndex(targetPlan) < getPlanIndex(subscription.currentPlan);
  };

  const handlePlanAction = async (plan: MerchantPlan) => {
    if (plan.plan === subscription?.currentPlan) return;
    if (plan.monthlyPrice === 0 && plan.plan === 'starter') return;

    try {
      setProcessingPlan(plan.plan);

      // Create Razorpay order
      const orderRes = await apiClient.post<{
        razorpayOrderId: string;
        amountInPaise: number;
        currency: string;
        keyId: string;
        planName: string;
      }>('merchant/subscription/upgrade', {
        planName: plan.plan,
        billingCycle,
        storeId: activeStore?._id ?? '',
      });

      if (!orderRes.success) throw new Error(orderRes.message || 'Failed to create order');

      const { razorpayOrderId, amountInPaise, currency, keyId } = orderRes.data!;

      if (!RazorpayCheckout) {
        platformAlertSimple(
          'Not Available',
          'Payment is only available in the mobile app. Please use the REZ Merchant app on your phone.'
        );
        return;
      }

      // Session refresh check
      try {
        await apiClient.get('merchant/auth/me');
      } catch (e) {
        if (e?.response?.status === 401 || e?.status === 401) {
          platformAlertSimple('Session Expired', 'Please log in again to continue.');
          return;
        }
      }

      let paymentData: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      } | null = null;

      const timeoutId = setTimeout(() => {
        RazorpayCheckout.close();
        platformAlertSimple('Timeout', 'Payment session expired. Please try again.');
      }, 10 * 60 * 1000);

      const options = {
        description: `REZ ${plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)} Subscription (${billingCycle})`,
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
          ondismiss: () => clearTimeout(timeoutId),
        },
      };

      try {
        await RazorpayCheckout.open(options);
      } finally {
        clearTimeout(timeoutId);
      }

      if (!paymentData) return;

      // Verify payment
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentData;

      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new Error('Incomplete payment response');
      }

      if (razorpay_order_id !== razorpayOrderId) {
        throw new Error('Payment verification failed: order mismatch');
      }

      const verifyRes = await apiClient.post<{ success: boolean; message?: string }>(
        'merchant/subscription/verify-payment',
        {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          planName: plan.plan,
          billingCycle,
          amountInPaise,
        }
      );

      if (!verifyRes.success) throw new Error(verifyRes.message || 'Payment verification failed');

      platformAlertSimple('Success', `Your plan has been upgraded to ${plan.plan.toUpperCase()}!`);
      loadData();

    } catch (err) {
      const errorCode = typeof err.code === 'number' ? err.code : 0;
      if (errorCode !== 2) {
        const msg = err.description || err.message || 'Please try again';
        platformAlertSimple('Error', msg);
      }
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentPlanIndex = subscription ? getPlanIndex(subscription.currentPlan) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

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
        <Text style={styles.headerTitle}>Upgrade Your Plan</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Current Plan Banner */}
        {subscription && (
          <View style={styles.currentPlanBanner}>
            <View style={styles.currentPlanInfo}>
              <Text style={styles.currentPlanLabel}>Current Plan</Text>
              <Text style={styles.currentPlanName}>
                {subscription.currentPlan.charAt(0).toUpperCase() + subscription.currentPlan.slice(1)}
              </Text>
            </View>
            {subscription.nextBillingDate && (
              <View style={styles.renewalInfo}>
                <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.renewalText}>
                  Renews {subscription.nextBillingDate}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Billing Cycle Toggle */}
        <View style={styles.billingToggleContainer}>
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text
                style={[styles.billingOptionText, billingCycle === 'monthly' && styles.billingOptionTextActive]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'yearly' && styles.billingOptionActive]}
              onPress={() => setBillingCycle('yearly')}
            >
              <Text
                style={[styles.billingOptionText, billingCycle === 'yearly' && styles.billingOptionTextActive]}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>
          {billingCycle === 'yearly' && (
            <View style={styles.savingsBadge}>
              <Ionicons name="sparkles" size={12} color="#059669" />
              <Text style={styles.savingsText}>Save up to 2 months free</Text>
            </View>
          )}
        </View>

        {/* Plan Cards */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const config = PLAN_CONFIG[plan.plan] || PLAN_CONFIG.starter;
            const isCurrent = subscription?.currentPlan === plan.plan;
            const isUpgrade = canUpgradeTo(plan.plan);
            const isDowngrade = canDowngradeTo(plan.plan);
            const isProcessing = processingPlan === plan.plan;
            const price = getPlanPrice(plan);
            const yearlySavings = getYearlySavings(plan);

            return (
              <View
                key={plan._id}
                style={[
                  styles.planCard,
                  config.popular && styles.popularPlanCard,
                  isCurrent && styles.currentPlanCard,
                ]}
              >
                {config.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}

                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <View
                    style={[styles.planIconContainer, { backgroundColor: `${config.color}15` }]}
                  >
                    <Ionicons
                      name={
                        plan.plan === 'starter'
                          ? 'rocket-outline'
                          : plan.plan === 'growth'
                          ? 'trending-up-outline'
                          : 'diamond-outline'
                      }
                      size={24}
                      color={config.color}
                    />
                  </View>
                  <Text style={styles.planName}>
                    {plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}
                  </Text>
                </View>

                {/* Price */}
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>
                    {plan.monthlyPrice === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                  </Text>
                  <Text style={styles.pricePeriod}>
                    {plan.monthlyPrice === 0 ? '' : '/month'}
                  </Text>
                </View>

                {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                  <View style={styles.yearlyInfo}>
                    <Text style={styles.yearlyTotal}>
                      ₹{getYearlyTotal(plan).toLocaleString('en-IN')}/year
                    </Text>
                    {yearlySavings > 0 && (
                      <View style={styles.savingsChip}>
                        <Text style={styles.savingsChipText}>
                          Save ₹{yearlySavings.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {config.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={config.color}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    styles.planButton,
                    { backgroundColor: config.color },
                    (isCurrent || isProcessing) && styles.planButtonDisabled,
                    isDowngrade && styles.downgradeButton,
                  ]}
                  onPress={() => handlePlanAction(plan)}
                  disabled={isCurrent || isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.planButtonText}>
                      {isCurrent
                        ? 'Current Plan'
                        : isUpgrade
                        ? 'Upgrade'
                        : 'Downgrade'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Downgrade Warning */}
                {isDowngrade && (
                  <Text style={styles.downgradeWarning}>
                    Downgrading will take effect at the end of your billing period
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Comparison Link */}
        <TouchableOpacity
          style={styles.comparisonLink}
          onPress={() => router.push('/subscription/plans-comparison')}
        >
          <Ionicons name="git-compare-outline" size={18} color={Colors.light.primary} />
          <Text style={styles.comparisonLinkText}>View Full Plan Comparison</Text>
        </TouchableOpacity>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change my plan anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can upgrade or downgrade your plan at unknown time. Upgrades take effect immediately,
              while downgrades apply at the end of your billing period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods are accepted?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit/debit cards, UPI, net banking, and wallets through our
              secure payment partner, Razorpay.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              New users get access to the Growth plan features for 14 days. Contact support to
              extend your trial period.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens to my data if I downgrade?</Text>
            <Text style={styles.faqAnswer}>
              Your data is preserved. However, features beyond your new plan limits will be
              disabled until you upgrade again.
            </Text>
          </View>
        </View>

        {/* Contact Support */}
        <TouchableOpacity style={styles.supportButton}>
          <Ionicons name="headset-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.supportButtonText}>Contact Sales Team</Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
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
  scrollView: {
    flex: 1,
  },
  currentPlanBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  currentPlanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  currentPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  renewalText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  billingToggleContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  billingOptionActive: {
    backgroundColor: Colors.light.primary,
  },
  billingOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  billingOptionTextActive: {
    color: 'white',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
  },
  popularPlanCard: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}08`,
  },
  currentPlanCard: {
    borderColor: Colors.light.success,
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.textHeading,
  },
  pricePeriod: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  yearlyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  yearlyTotal: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  savingsChip: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  planButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonDisabled: {
    opacity: 0.6,
  },
  downgradeButton: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  planButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  downgradeWarning: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  comparisonLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  comparisonLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  faqSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 16,
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  footer: {
    height: 40,
  },
});
