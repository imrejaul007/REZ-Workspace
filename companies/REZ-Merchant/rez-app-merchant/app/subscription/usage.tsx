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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UsageMetrics {
  // Core metrics
  staff: { current: number; limit: number; label: string };
  products: { current: number; limit: number; label: string };
  stores: { current: number; limit: number; label: string };
  monthlyBookings: { current: number; limit: number; label: string };

  // Communication limits
  sms: { current: number; limit: number; label: string };
  whatsapp: { current: number; limit: number; label: string };
  pushNotifications: { current: number; limit: number; label: string };

  // Analytics & Storage
  analyticsRetention: { current: number; limit: number; label: string };
  imageStorage: { current: number; limit: number; label: string };

  // Feature flags
  hasApiAccess: boolean;
  hasCustomBranding: boolean;
  hasAdvancedAnalytics: boolean;
  hasMultiLocation: boolean;
  hasWhiteLabel: boolean;
}

interface UsageHistory {
  month: string;
  staff: number;
  products: number;
  bookings: number;
}

interface BillingCycle {
  startDate: string;
  endDate: string;
  daysRemaining: number;
  resetDate: string;
}

const FEATURE_LABELS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  apiAccess: { label: 'API Access', icon: 'code-slash-outline' },
  customBranding: { label: 'Custom Branding', icon: 'color-palette-outline' },
  advancedAnalytics: { label: 'Advanced Analytics', icon: 'bar-chart-outline' },
  multiLocation: { label: 'Multi-Location', icon: 'business-outline' },
  whiteLabel: { label: 'White Label', icon: 'ribbon-outline' },
};

export default function UsageScreen() {
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'history'>('current');

  const loadUsageData = useCallback(async () => {
    try {
      const res = await apiClient.get<{
        usage: {
          staff: number;
          staffLimit: number;
          products: number;
          productsLimit: number;
          stores: number;
          storesLimit: number;
          monthlyBookings: number;
          monthlyBookingsLimit: number;
          sms: number;
          smsLimit: number;
          whatsapp: number;
          whatsappLimit: number;
          pushNotifications: number;
          pushNotificationsLimit: number;
          analyticsRetentionDays: number;
          analyticsRetentionLimit: number;
          imageStorageMB: number;
          imageStorageLimitMB: number;
        };
        plan: string;
        features: {
          apiAccess: boolean;
          customBranding: boolean;
          advancedAnalytics: boolean;
          multiLocation: boolean;
          whiteLabel: boolean;
        };
        billingCycle: {
          startDate: string;
          endDate: string;
          daysRemaining: number;
        };
        history: UsageHistory[];
      }>('merchant/subscription/usage');

      if (res.success && res.data) {
        const { usage: u, plan, features, billingCycle: bc, history: h } = res.data;

        setCurrentPlan(plan || 'starter');
        setBillingCycle(bc || null);
        setHistory(h || []);

        setUsage({
          staff: {
            current: u.staff ?? 0,
            limit: u.staffLimit ?? 2,
            label: 'Staff Members',
          },
          products: {
            current: u.products ?? 0,
            limit: u.productsLimit ?? 50,
            label: 'Products',
          },
          stores: {
            current: u.stores ?? 1,
            limit: u.storesLimit ?? 1,
            label: 'Outlets',
          },
          monthlyBookings: {
            current: u.monthlyBookings ?? 0,
            limit: u.monthlyBookingsLimit ?? 100,
            label: 'Monthly Bookings',
          },
          sms: {
            current: u.sms ?? 0,
            limit: u.smsLimit ?? 100,
            label: 'SMS Notifications',
          },
          whatsapp: {
            current: u.whatsapp ?? 0,
            limit: u.whatsappLimit ?? 50,
            label: 'WhatsApp Messages',
          },
          pushNotifications: {
            current: u.pushNotifications ?? 0,
            limit: u.pushNotificationsLimit ?? 200,
            label: 'Push Notifications',
          },
          analyticsRetention: {
            current: u.analyticsRetentionDays ?? 30,
            limit: u.analyticsRetentionLimit ?? 30,
            label: 'Data Retention (Days)',
          },
          imageStorage: {
            current: u.imageStorageMB ?? 0,
            limit: u.imageStorageLimitMB ?? 500,
            label: 'Image Storage (MB)',
          },
          hasApiAccess: features.apiAccess ?? false,
          hasCustomBranding: features.customBranding ?? false,
          hasAdvancedAnalytics: features.advancedAnalytics ?? false,
          hasMultiLocation: features.multiLocation ?? false,
          hasWhiteLabel: features.whiteLabel ?? false,
        });
      }
    } catch (error) {
      logger.error('[Usage] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsageData();
    setRefreshing(false);
  }, [loadUsageData]);

  const getUsagePercentage = (current: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return '#EF4444'; // Red - Critical
    if (percentage >= 75) return '#F59E0B'; // Yellow - Warning
    return '#10B981'; // Green - Good
  };

  const formatBytes = (mb: number): string => {
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  };

  const getUpgradeRecommendation = (): string | null => {
    if (!usage) return null;

    const criticalMetrics = [
      { metric: usage.staff, name: 'Staff Members' },
      { metric: usage.products, name: 'Products' },
      { metric: usage.monthlyBookings, name: 'Monthly Bookings' },
      { metric: usage.stores, name: 'Outlets' },
    ];

    for (const item of criticalMetrics) {
      if (getUsagePercentage(item.metric.current, item.metric.limit) >= 90) {
        return `You're approaching the limit for ${item.name}. Consider upgrading your plan.`;
      }
    }

    return null;
  };

  const renderUsageBar = (
    current: number,
    limit: number,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    formatValue?: (v: number) => string
  ) => {
    const percentage = getUsagePercentage(current, limit);
    const color = getUsageColor(percentage);
    const displayValue = formatValue ? formatValue(current) : current.toString();
    const displayLimit = formatValue ? formatValue(limit) : limit.toString();

    return (
      <View style={styles.usageItem}>
        <View style={styles.usageHeader}>
          <View style={styles.usageLabelRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon} size={16} color={color} />
            </View>
            <Text style={styles.usageLabel}>{label}</Text>
          </View>
          <Text style={styles.usageValue}>
            {displayValue} / {displayLimit}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${percentage}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          {percentage >= 90 && (
            <View style={styles.warningIndicator}>
              <Ionicons name="warning" size={12} color="#EF4444" />
            </View>
          )}
        </View>
        {percentage >= 90 && (
          <TouchableOpacity
            style={styles.upgradeHint}
            onPress={() => router.push('/subscription/upgrade')}
          >
            <Text style={styles.upgradeHintText}>Upgrade to increase limit</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.light.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFeatureItem = (key: string, enabled: boolean) => {
    const feature = FEATURE_LABELS[key];
    if (!feature) return null;

    return (
      <View key={key} style={styles.featureItem}>
        <View style={styles.featureLeft}>
          <View
            style={[
              styles.featureIconContainer,
              { backgroundColor: enabled ? '#D1FAE5' : Colors.light.backgroundSecondary },
            ]}
          >
            <Ionicons
              name={feature.icon}
              size={18}
              color={enabled ? '#059669' : Colors.light.textSecondary}
            />
          </View>
          <Text
            style={[styles.featureLabel, !enabled && styles.featureLabelDisabled]}
          >
            {feature.label}
          </Text>
        </View>
        <View style={[styles.featureStatus, enabled && styles.featureStatusEnabled]}>
          <Ionicons
            name={enabled ? 'checkmark-circle' : 'close-circle'}
            size={18}
            color={enabled ? '#059669' : Colors.light.textSecondary}
          />
          <Text style={[styles.featureStatusText, enabled && styles.featureStatusTextEnabled]}>
            {enabled ? 'Included' : 'Not Included'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading usage data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const recommendation = getUpgradeRecommendation();

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
        <Text style={styles.headerTitle}>Usage & Limits</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Plan Info Banner */}
        <View style={styles.planBanner}>
          <View style={styles.planInfo}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <Text style={styles.planName}>
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeBannerButton}
            onPress={() => router.push('/subscription/upgrade')}
          >
            <Text style={styles.upgradeBannerButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Billing Cycle Info */}
        {billingCycle && (
          <View style={styles.billingCycleCard}>
            <View style={styles.billingCycleHeader}>
              <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.billingCycleTitle}>Current Billing Cycle</Text>
            </View>
            <View style={styles.billingCycleStats}>
              <View style={styles.billingCycleStat}>
                <Text style={styles.billingCycleStatLabel}>Days Remaining</Text>
                <Text style={styles.billingCycleStatValue}>{billingCycle.daysRemaining}</Text>
              </View>
              <View style={styles.billingCycleDivider} />
              <View style={styles.billingCycleStat}>
                <Text style={styles.billingCycleStatLabel}>Resets On</Text>
                <Text style={styles.billingCycleStatValue}>
                  {billingCycle.endDate || '—'}
                </Text>
              </View>
            </View>
            <View style={styles.cycleProgressContainer}>
              <View style={styles.cycleProgressBar}>
                <View
                  style={[
                    styles.cycleProgressFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(100, ((30 - billingCycle.daysRemaining) / 30) * 100)
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Usage Recommendation Alert */}
        {recommendation && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color="#D97706" />
            <Text style={styles.alertText}>{recommendation}</Text>
          </View>
        )}

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedPeriod === 'current' && styles.tabActive]}
            onPress={() => setSelectedPeriod('current')}
          >
            <Text style={[styles.tabText, selectedPeriod === 'current' && styles.tabTextActive]}>
              Current Usage
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedPeriod === 'history' && styles.tabActive]}
            onPress={() => setSelectedPeriod('history')}
          >
            <Text style={[styles.tabText, selectedPeriod === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Current Usage Tab */}
        {selectedPeriod === 'current' && usage && (
          <>
            {/* Core Usage Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Core Resources</Text>

              {renderUsageBar(
                usage.staff.current,
                usage.staff.limit,
                usage.staff.label,
                'people-outline'
              )}
              {renderUsageBar(
                usage.products.current,
                usage.products.limit,
                usage.products.label,
                'cube-outline'
              )}
              {renderUsageBar(
                usage.stores.current,
                usage.stores.limit,
                usage.stores.label,
                'business-outline'
              )}
              {renderUsageBar(
                usage.monthlyBookings.current,
                usage.monthlyBookings.limit,
                usage.monthlyBookings.label,
                'calendar-outline'
              )}
            </View>

            {/* Communication Limits Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Communication Limits</Text>

              {renderUsageBar(
                usage.sms.current,
                usage.sms.limit,
                usage.sms.label,
                'mail-outline'
              )}
              {renderUsageBar(
                usage.whatsapp.current,
                usage.whatsapp.limit,
                usage.whatsapp.label,
                'logo-whatsapp'
              )}
              {renderUsageBar(
                usage.pushNotifications.current,
                usage.pushNotifications.limit,
                usage.pushNotifications.label,
                'notifications-outline'
              )}
            </View>

            {/* Storage & Data Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Storage & Data</Text>

              {renderUsageBar(
                usage.imageStorage.current,
                usage.imageStorage.limit,
                usage.imageStorage.label,
                'image-outline',
                formatBytes
              )}
              {renderUsageBar(
                usage.analyticsRetention.current,
                usage.analyticsRetention.limit,
                usage.analyticsRetention.label,
                'analytics-outline'
              )}
            </View>

            {/* Plan Features Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plan Features</Text>
              <View style={styles.featuresCard}>
                {renderFeatureItem('apiAccess', usage.hasApiAccess)}
                {renderFeatureItem('customBranding', usage.hasCustomBranding)}
                {renderFeatureItem('advancedAnalytics', usage.hasAdvancedAnalytics)}
                {renderFeatureItem('multiLocation', usage.hasMultiLocation)}
                {renderFeatureItem('whiteLabel', usage.hasWhiteLabel)}
              </View>
            </View>
          </>
        )}

        {/* History Tab */}
        {selectedPeriod === 'history' && (
          <View style={styles.section}>
            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="time-outline" size={48} color={Colors.light.textSecondary} />
                <Text style={styles.emptyHistoryTitle}>No History Yet</Text>
                <Text style={styles.emptyHistoryText}>
                  Your usage history will appear here as you use the platform.
                </Text>
              </View>
            ) : (
              history.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyMonth}>{item.month}</Text>
                  </View>
                  <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                      <Ionicons name="people-outline" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.historyStatValue}>{item.staff} staff</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Ionicons name="cube-outline" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.historyStatValue}>{item.products} products</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.historyStatValue}>{item.bookings} bookings</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quick Stats Summary */}
        {usage && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(
                    (getUsagePercentage(usage.products.current, usage.products.limit) +
                      getUsagePercentage(usage.staff.current, usage.staff.limit) +
                      getUsagePercentage(usage.monthlyBookings.current, usage.monthlyBookings.limit)) /
                      3
                  )}%
                </Text>
                <Text style={styles.summaryLabel}>Avg. Usage</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Object.values(usage).filter((v) => typeof v === 'object' && 'current' in v)
                    .filter((m) => getUsagePercentage(m.current, m.limit) < 75).length}
                </Text>
                <Text style={styles.summaryLabel}>Healthy</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                  {Object.values(usage).filter((v) => typeof v === 'object' && 'current' in v)
                    .filter((m) => {
                      const pct = getUsagePercentage(m.current, m.limit);
                      return pct >= 75 && pct < 90;
                    }).length}
                </Text>
                <Text style={styles.summaryLabel}>Warning</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                  {Object.values(usage).filter((v) => typeof v === 'object' && 'current' in v)
                    .filter((m) => getUsagePercentage(m.current, m.limit) >= 90).length}
                </Text>
                <Text style={styles.summaryLabel}>Critical</Text>
              </View>
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need More Resources?</Text>
          <Text style={styles.helpText}>
            Contact our sales team to get a custom plan that fits your business needs.
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="chatbubbles-outline" size={18} color={Colors.light.primary} />
            <Text style={styles.contactButtonText}>Contact Sales</Text>
          </TouchableOpacity>
        </View>

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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
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
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 16,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  upgradeBannerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  upgradeBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
  },
  billingCycleCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  billingCycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  billingCycleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  billingCycleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billingCycleStat: {
    flex: 1,
  },
  billingCycleStatLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  billingCycleStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  billingCycleDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.light.border,
  },
  cycleProgressContainer: {
    marginTop: 4,
  },
  cycleProgressBar: {
    height: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: 'white',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },
  usageItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  usageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  usageValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningIndicator: {
    marginLeft: 8,
  },
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  upgradeHintText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  featuresCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  featureLabelDisabled: {
    color: Colors.light.textSecondary,
  },
  featureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureStatusEnabled: {},
  featureStatusText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  featureStatusTextEnabled: {
    color: '#059669',
    fontWeight: '500',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  historyItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  historyHeader: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  historyMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  historyStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyStatValue: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  helpSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  footer: {
    height: 40,
  },
});
