import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  RefreshControl,
  Platform,
} from 'react-native';

const RazorpayCheckout = Platform.OS !== 'web' ? require('react-native-razorpay').default : null;
import { platformAlertSimple } from '@/utils/platformAlert';
import { getPaymentMode } from '@/config/payment';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';
import {
  Card,
  Heading1,
  Heading2,
  BodyText,
  Caption,
} from '@/components/ui/DesignSystemComponents';

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

interface UsageData {
  currentPlan: string;
  planExpiresAt: string | null;
  usage: {
    products: number;
    stores: number;
  };
  limits: {
    maxProducts: number;
    maxStores: number;
  };
}

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const { merchant } = useAuth();
  const [plans, setPlans] = useState<MerchantPlan[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  // Fetch plans and usage
  const fetchData = useCallback(async () => {
    try {
      setLoadingPlans(true);
      setLoadingUsage(true);

      const [plansRes, usageRes] = await Promise.all([
        apiClient.get<MerchantPlan[]>('merchant/subscription/plans'),
        apiClient.get<UsageData>('merchant/subscription/usage'),
      ]);

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }

      if (usageRes.success && usageRes.data) {
        setUsage(usageRes.data);
      }
    } catch (error) {
      logger.error('Error fetching subscription data:', error);
      platformAlertSimple('Error', 'Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
      setLoadingUsage(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleUpgrade = async (plan: MerchantPlan) => {
    if (!RazorpayCheckout) {
      platformAlertSimple(
        'Not Available',
        'Payment is only available in the mobile app. Please use the Rez Merchant app on your phone.'
      );
      return;
    }

    try {
      setUpgrading(true);

      // Step 1: Create Razorpay order on the backend
      const orderRes = await apiClient.post<{
        razorpayOrderId: string;
        amountInPaise: number;
        currency: string;
        keyId: string;
        planName: string;
      }>('merchant/subscription/upgrade', { planName: plan.plan, storeId: activeStore?._id ?? '' });

      if (!orderRes.success) throw new Error(orderRes.message || 'Failed to create order');

      const { razorpayOrderId, amountInPaise, currency, keyId } = orderRes.data!;

      // Step 2: Open Razorpay checkout
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
        theme: { color: '#1e3a5f' },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Step 3: Verify on backend (HMAC checked server-side — never client-side)
      const verifyRes = await apiClient.post('merchant/subscription/verify-payment', {
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_signature: paymentData.razorpay_signature,
        planName: plan.plan,
      });

      if (!verifyRes.success) throw new Error(verifyRes.message || 'Payment verification failed');

      platformAlertSimple('Success', 'Your plan has been upgraded!');
      fetchData();
    } catch (err) {
      if (err.code !== 'payment_cancelled') {
        platformAlertSimple('Payment Failed', err.message || 'Please try again');
      }
    } finally {
      setUpgrading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPlanCard = (plan: MerchantPlan) => {
    const isCurrentPlan = usage?.currentPlan === plan.plan;
    const isStarter = plan.plan === 'starter';

    return (
      <View key={plan._id} style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
        {isCurrentPlan && (
          <View style={styles.currentPlanBadge}>
            <Text style={styles.badgeText}>Current Plan</Text>
          </View>
        )}

        <Text style={styles.planName}>
          {plan.plan.charAt(0).toUpperCase() + plan.plan.slice(1)}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{plan.monthlyPrice}</Text>
          {plan.monthlyPrice > 0 && <Text style={styles.period}>/month</Text>}
        </View>

        <View style={styles.featuresList}>
          <FeatureRow icon="cube" label="Products" value={`${plan.maxProducts}`} />
          <FeatureRow icon="storefront" label="Stores" value={`${plan.maxStores}`} />
          <FeatureRow icon="mail" label="SMS/month" value={`${plan.smsPerMonth}`} />
          <FeatureRow icon="chatbubble" label="WhatsApp/month" value={`${plan.whatsappPerMonth}`} />
          <FeatureRow icon="notifications" label="Push/month" value={`${plan.pushPerMonth}`} />
          <FeatureRow
            icon="analytics"
            label="Analytics"
            value={`${plan.analyticsRetentionDays}d`}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            (isCurrentPlan || isStarter || upgrading) && styles.upgradeButtonDisabled,
          ]}
          disabled={isCurrentPlan || isStarter || upgrading}
          onPress={() => handleUpgrade(plan)}
        >
          {upgrading ? (
            <ActivityIndicator size="small" color={Colors.background.primary} />
          ) : (
            <Text
              style={[
                styles.upgradeButtonText,
                (isCurrentPlan || isStarter) && styles.upgradeButtonTextDisabled,
              ]}
            >
              {isCurrentPlan ? 'Current' : isStarter ? 'Free' : 'Upgrade'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* TEST MODE banner — visible when Razorpay key is not a live key */}
      {getPaymentMode() === 'test' && (
        <View style={styles.testModeBanner}>
          <Text style={styles.testModeBannerText}>TEST MODE — Payments are not real</Text>
        </View>
      )}

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary[600], Colors.primary[800]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.background.primary} />
          </TouchableOpacity>
          <Heading1 style={styles.headerTitle}>Subscription Plans</Heading1>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Plans Section */}
        {loadingPlans ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <View style={styles.plansContainer}>
            <Heading2 style={styles.sectionTitle}>Choose Your Plan</Heading2>
            {plans.length === 0 ? (
              <BodyText style={{ textAlign: 'center', color: Colors.text.secondary }}>
                No plans available
              </BodyText>
            ) : (
              <View style={styles.plansList}>{plans.map(renderPlanCard)}</View>
            )}
          </View>
        )}

        {/* Usage Section */}
        {loadingUsage ? null : usage ? (
          <View style={styles.usageContainer}>
            <Heading2 style={styles.sectionTitle}>Current Usage</Heading2>

            {/* Plan Expiry */}
            {usage.planExpiresAt && (
              <Card style={styles.expiryCard}>
                <View style={styles.expiryContent}>
                  <Ionicons name="calendar" size={20} color={Colors.primary[500]} />
                  <View style={{ marginLeft: Spacing.md }}>
                    <Caption style={styles.expiryLabel}>Plan Expires</Caption>
                    <BodyText style={styles.expiryDate}>{formatDate(usage.planExpiresAt)}</BodyText>
                  </View>
                </View>
              </Card>
            )}

            {/* Products Usage Bar */}
            <View style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Products</Text>
                <Text style={styles.usageValue}>
                  {usage.usage.products} / {usage.limits.maxProducts}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((usage.usage.products / Math.max(usage.limits.maxProducts, 1)) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Stores Usage Bar */}
            <View style={styles.usageItem}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Stores</Text>
                <Text style={styles.usageValue}>
                  {usage.usage.stores} / {usage.limits.maxStores}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min((usage.usage.stores / Math.max(usage.limits.maxStores, 1)) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

interface FeatureRowProps {
  icon: string;
  label: string;
  value: string;
}

function FeatureRow({ icon, label, value }: FeatureRowProps) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={16} color={Colors.primary[500]} />
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.background.primary,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plansContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    color: Colors.text.primary,
  },
  plansList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  currentPlanCard: {
    borderColor: Colors.primary[500],
    borderWidth: 2,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background.primary,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  priceContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  period: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  featuresList: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    flex: 1,
  },
  featureValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  upgradeButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  upgradeButtonText: {
    color: Colors.background.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  upgradeButtonTextDisabled: {
    color: Colors.gray[600],
  },
  paymentComingSoonText: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  usageContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  expiryCard: {
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  expiryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expiryLabel: {
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  expiryDate: {
    color: Colors.primary[500],
    fontWeight: '600',
  },
  usageItem: {
    marginBottom: Spacing.lg,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  usageValue: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
  },
  bottomPadding: {
    height: Spacing.lg,
  },
  testModeBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: Spacing.lg,
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
