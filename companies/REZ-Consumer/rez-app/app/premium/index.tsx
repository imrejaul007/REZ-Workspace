// @ts-nocheck
/**
 * REZ Premium Screen
 * Premium subscription management with benefits, pricing, and subscription state
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import apiClient from '@/services/apiClient';
import { useIsMounted } from '@/hooks/useIsMounted';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

const NAVY = '#0A1628';
const GOLD = '#FFD700';
const GOLD_DARK = '#B8860B';
const GOLD_LIGHT = '#FFF3B0';

interface SubscriptionStatus {
  isActive: boolean;
  plan?: string;
  renewalDate?: string;
  startDate?: string;
}

const BENEFITS = [
  { icon: 'star', text: '2x coins on every purchase' },
  { icon: 'headset', text: 'Priority customer support' },
  { icon: 'gift', text: 'Exclusive premium-only offers' },
  { icon: 'ban', text: 'No ads' },
  { icon: 'rocket', text: 'Early access to new features' },
] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function PremiumScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/user/subscription');
      const data = (response.data as unknown)?.data ?? (response.data as unknown);
      if (!isMounted()) return;
      setSubscriptionStatus({
        isActive: data?.isActive ?? data?.status === 'active' ?? false,
        plan: data?.plan,
        renewalDate: data?.renewalDate ?? data?.currentPeriodEnd,
        startDate: data?.startDate ?? data?.currentPeriodStart,
      });
    } catch (_err) {
      if (!isMounted()) return;
      setSubscriptionStatus({ isActive: false });
    } finally {
      if (!isMounted()) return;
      setLoading(false);
    }
  }, [isMounted]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const handleSubscribe = useCallback(async () => {
    if (subscribing) return;
    setSubscribing(true);
    setError(null);
    try {
      await apiClient.post('/user/subscription/subscribe', { plan: 'premium_monthly' });
      if (!isMounted()) return;
      setSuccess(true);
      setSubscriptionStatus((prev) => ({ ...prev, isActive: true, plan: 'premium_monthly' }));
    } catch (err) {
      if (!isMounted()) return;
      setError(err?.response?.data?.message ?? err?.message ?? 'Subscription failed. Please try again.');
    } finally {
      if (!isMounted()) return;
      setSubscribing(false);
    }
  }, [subscribing, isMounted]);

  const handleCancel = useCallback(() => {
    router.push('/subscription/cancel-feedback' as unknown as string);
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GOLD} />
      </View>
    );
  }

  const isActive = subscriptionStatus?.isActive ?? false;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[NAVY, '#1A2E4A']} style={styles.headerGradient}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as unknown))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </Pressable>
        <Text style={styles.headerLabel}>REZ Premium</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={[NAVY, '#1A2E4A', NAVY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.crownContainer}>
            <Ionicons name="star" size={48} color={GOLD} />
          </View>
          <Text style={styles.heroTitle}>REZ Premium</Text>
          <Text style={styles.heroSubtitle}>Unlock the full REZ experience</Text>

          {isActive && (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color={GOLD} />
              <Text style={styles.activeBadgeText}>Active Premium Member</Text>
            </View>
          )}
        </LinearGradient>

        {/* Active Member Info */}
        {isActive && subscriptionStatus?.renewalDate && (
          <View style={styles.renewalCard}>
            <View style={styles.renewalRow}>
              <Ionicons name="calendar-outline" size={18} color={GOLD_DARK} />
              <Text style={styles.renewalText}>Renews on {formatDate(subscriptionStatus.renewalDate)}</Text>
            </View>
          </View>
        )}

        {/* Success Message */}
        {success && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.successText}>Welcome to REZ Premium!</Text>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>What you get</Text>
          {BENEFITS.map((benefit) => (
            <View key={benefit.text} style={styles.benefitRow}>
              <View style={styles.benefitCheckIcon}>
                <Ionicons name="checkmark" size={16} color={NAVY} />
              </View>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        {/* Pricing Card */}
        {!isActive && (
          <View style={styles.pricingCard}>
            <LinearGradient
              colors={[GOLD_LIGHT, GOLD]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pricingGradient}
            >
              <View style={styles.pricingContent}>
                <View>
                  <Text style={styles.planName}>Premium Monthly</Text>
                  <Text style={styles.planDescription}>Cancel anytime</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.priceAmount}>99</Text>
                  <Text style={styles.pricePeriod}>/mo</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isActive ? (
            <Pressable style={styles.subscribeButton} onPress={handleSubscribe} disabled={subscribing}>
              <LinearGradient
                colors={[GOLD, GOLD_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.subscribeGradient}
              >
                {subscribing ? (
                  <ActivityIndicator size="small" color={NAVY} />
                ) : (
                  <>
                    <Ionicons name="star" size={18} color={NAVY} />
                    <Text style={styles.subscribeButtonText}>Subscribe Now — ₹99/month</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable style={styles.cancelLink} onPress={handleCancel}>
              <Text style={styles.cancelLinkText}>Cancel subscription</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.legalNote}>
          <Text style={styles.legalText}>Subscription auto-renews at ₹99/month. Cancel anytime from your profile.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  backButton: {
    padding: Spacing.sm,
    width: 40,
  },
  headerLabel: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: GOLD,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  crownContainer: {
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: GOLD,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: Typography.body.fontSize,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.base,
    backgroundColor: `${GOLD}20`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: `${GOLD}60`,
  },
  activeBadgeText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '700',
    color: GOLD,
  },
  renewalCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: `${GOLD_LIGHT}`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
  },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renewalText: {
    fontSize: Typography.body.fontSize,
    color: GOLD_DARK,
    fontWeight: '500',
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: `${Colors.success}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
  },
  successText: {
    fontSize: Typography.body.fontSize,
    color: Colors.success,
    fontWeight: '600',
  },
  benefitsSection: {
    padding: Spacing.base,
    marginTop: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.base,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    gap: Spacing.md,
  },
  benefitCheckIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  benefitText: {
    fontSize: Typography.body.fontSize,
    color: colors.text.primary,
    flex: 1,
  },
  pricingCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  pricingGradient: {
    padding: Spacing.xl,
  },
  pricingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: Typography.bodySmall.fontSize,
    color: NAVY,
    opacity: 0.7,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  currency: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: NAVY,
    lineHeight: 44,
  },
  pricePeriod: {
    fontSize: Typography.body.fontSize,
    color: NAVY,
    opacity: 0.7,
    marginBottom: 6,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: `${Colors.error}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  errorText: {
    fontSize: Typography.bodySmall.fontSize,
    color: Colors.error,
    flex: 1,
  },
  actionsContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
  },
  subscribeButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  subscribeButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: NAVY,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  cancelLinkText: {
    fontSize: Typography.body.fontSize,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
  legalNote: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  legalText: {
    fontSize: Typography.caption.fontSize,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default withErrorBoundary(PremiumScreen, 'Premium');
