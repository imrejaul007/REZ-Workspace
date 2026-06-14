import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';

import { Colors, Spacing, Shadows, BorderRadius, Typography } from '@/constants/DesignTokens';
import {
  Card,
  Heading2,
  Heading3,
  BodyText,
  Caption,
  Button,
  Badge,
} from '@/components/ui/DesignSystemComponents';

// Import services and hooks
import { useAuth } from '@/contexts/AuthContext';
import { useMerchant } from '@/contexts/MerchantContext';
import { useStore } from '@/contexts/StoreContext';
import { useMerchantMode } from '@/hooks/useMerchantMode';
import DashboardRegistrySection from '@/components/dashboard/DashboardRegistrySection';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useDashboardRealTime } from '@/hooks/useRealTimeUpdates';
import { useDashboardData } from '@/hooks/useDashboardData';
import MetricCard from '@/components/dashboard/MetricCard';
import QuickActionButton from '@/components/dashboard/QuickActionButton';
import DailyCommandBar from '@/components/dashboard/DailyCommandBar';
import BudgetGauge from '@/components/dashboard/BudgetGauge';
import DemandIntelligenceCard from '@/components/dashboard/DemandIntelligenceCard';
import GrowthActionsCard from '@/components/dashboard/GrowthActionsCard';
import REZAttributionCard from '@/components/dashboard/REZAttributionCard';
import RendezBookingsCard from '@/components/dashboard/RendezBookingsCard';
import RezNowAnalyticsCard from '@/components/dashboard/RezNowAnalyticsCard';
import TodayRevenueWidget from '@/components/dashboard/TodayRevenueWidget';
import type { DashboardMetrics, DashboardOverview, Notification } from '@/hooks/useDashboardData';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { state: authState } = useAuth();
  const { activeStore } = useStore();
  const { unreadCount: notificationUnreadCount } = useNotificationContext();
  const realTime = useDashboardRealTime();
  const { mode: merchantMode, setMode: setMerchantMode, modes } = useMerchantMode();

  const {
    metrics,
    overview,
    notifications,
    isLoading,
    refreshing,
    dashboardError,
    customerPayments,
    storePerformance,
    actionItems,
    todayRevenue,
    topItemsToday,
    campaignPerformance,
    customerRetention,
    basketTrend,
    healthData,
    recommendations,
    fetchDashboardData,
    handleRefresh,
    formatCurrency,
    formatPercentage,
    formatNumber,
  } = useDashboardData();

  // Inline MetricCardItem and QuickActionButton definitions removed — extracted to components/dashboard/

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.primary[100], Colors.primary[50], Colors.gray[50]]}
        style={styles.backgroundGradient}
      />

      {/* Error Banner */}
      {dashboardError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText} numberOfLines={2}>
            Something went wrong. {dashboardError}
          </Text>
          <TouchableOpacity
            onPress={() => fetchDashboardData()}
            style={styles.errorRetryButton}
            accessibilityLabel="Retry loading dashboard"
            accessibilityRole="button"
          >
            <Text style={styles.errorRetryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Store Suspension Alert */}
      {activeStore?.isSuspended && (
        <View style={styles.suspensionBanner}>
          <Ionicons name="warning" size={20} color="#DC2626" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.suspensionTitle}>Store Suspended</Text>
            <Text style={styles.suspensionText}>
              Your store "{activeStore.name}" has been suspended by admin.
              {activeStore.adminNotes
                ? ` Reason: ${activeStore.adminNotes}`
                : ' Please contact support for details.'}
            </Text>
          </View>
        </View>
      )}

      {/* Inactive Store Warning */}
      {activeStore && !activeStore.isActive && !activeStore.isSuspended && (
        <View style={styles.inactiveBanner}>
          <Ionicons name="pause-circle" size={20} color="#D97706" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.inactiveTitle}>Store Inactive</Text>
            <Text style={styles.inactiveText}>
              Your store is currently not visible to customers. Go to Store Settings to activate it.
            </Text>
          </View>
        </View>
      )}

      {/* Daily Command Bar — sticky above scroll */}
      {/* H4 FIX: todayScans uses pendingOrders (actionable today-count), not monthlyOrders.
        liabilityAmount uses pendingCashback (amount still owed), not totalCashbackPaid (settled). */}
      {metrics && (
        <DailyCommandBar
          todayScans={metrics.pendingOrders || 0}
          liabilityAmount={metrics.pendingCashback || 0}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Phase F bridge — registry-driven cards (Daily Actions, ROI,
            Growth Score, CPA Billing, Quick Actions). Additive: the
            inline content below still renders. Env-flag
            EXPO_PUBLIC_DASHBOARD_REGISTRY_ENABLED=1 turns it on. */}
        <DashboardRegistrySection
          hasError={!!dashboardError}
          storeActive={activeStore?.isActive !== false}
          storeSuspended={!!activeStore?.isSuspended}
        />

        {/* Glassmorphic Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.glassHeader}>
          <LinearGradient
            colors={['rgba(124, 58, 237, 0.95)', 'rgba(99, 102, 241, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassHeaderGradient}
          >
            <View style={styles.glassHeaderOverlay}>
              <View style={styles.headerMainContent}>
                <View style={styles.headerLeftSection}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={[Colors.primary[300], Colors.primary[500]]}
                      style={styles.avatarGradient}
                    >
                      <BodyText style={styles.avatarText}>
                        {(authState.user?.name || 'M').charAt(0).toUpperCase()}
                      </BodyText>
                    </LinearGradient>
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Heading3 style={styles.welcomeText}>
                      Welcome back, {authState.user?.name || 'Merchant'}! 👋
                    </Heading3>
                    <Caption style={styles.businessNameText}>
                      {authState.merchant?.businessName || 'Your Business'}
                    </Caption>
                  </View>
                </View>

                {/* Mode picker — simple | growth | advanced */}
                <View style={styles.modePickerRow}>
                  {modes.map((m) => (
                    <TouchableOpacity
                      key={m.value}
                      onPress={() => setMerchantMode(m.value)}
                      style={[styles.modeChip, merchantMode === m.value && styles.modeChipActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`Switch to ${m.label} mode`}
                      accessibilityState={{ selected: merchantMode === m.value }}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          merchantMode === m.value && styles.modeChipTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.headerRightSection}>
                  <View style={styles.liveStatusContainer}>
                    <View style={[styles.liveDot, realTime.isConnected && styles.liveDotPulse]} />
                    <BodyText style={styles.liveText}>
                      {realTime.isConnected ? 'LIVE' : 'OFFLINE'}
                    </BodyText>
                  </View>
                  <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => router.push('/notifications')}
                    accessibilityLabel="Notifications"
                    accessibilityRole="button"
                  >
                    <Ionicons name="notifications" size={24} color={Colors.text.inverse} />
                    {notificationUnreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <BodyText style={styles.notificationCount}>
                          {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                        </BodyText>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {realTime.lastUpdate && (
                <Caption style={styles.lastUpdateCaption}>
                  Last synced: {new Date(realTime.lastUpdate).toLocaleTimeString()}
                </Caption>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Sprint 15: Growth Actions Card */}
        <Animated.View
          entering={FadeInDown.delay(60).springify()}
          style={{ marginHorizontal: 16, marginBottom: 14 }}
        >
          <GrowthActionsCard />
        </Animated.View>

        {/* Sprint 15: Today at a Glance Summary Card */}
        <Animated.View
          entering={FadeInDown.delay(90).springify()}
          style={{ marginHorizontal: 16, marginBottom: 14 }}
        >
          {isLoading ? (
            <View style={glanceStyles.skeleton}>
              <View style={glanceStyles.skeletonRow}>
                <View style={glanceStyles.skeletonTitle} />
                <View style={glanceStyles.skeletonBadge} />
              </View>
              <View style={glanceStyles.skeletonGrid}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={glanceStyles.skeletonCell} />
                ))}
              </View>
            </View>
          ) : (
            <View style={glanceStyles.card}>
              <View style={glanceStyles.cardHeader}>
                <View style={glanceStyles.cardTitleRow}>
                  <Ionicons name="sunny" size={16} color="#F59E0B" />
                  <BodyText style={glanceStyles.cardTitle}>Today at a Glance</BodyText>
                </View>
                <BodyText style={glanceStyles.cardDate}>
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </BodyText>
              </View>
              <View style={glanceStyles.grid}>
                {/* Visits */}
                <View style={glanceStyles.cell}>
                  <View style={[glanceStyles.cellIcon, { backgroundColor: '#EDE9FE' }]}>
                    <Ionicons name="people" size={18} color="#7C3AED" />
                  </View>
                  <Heading3 style={glanceStyles.cellValue}>
                    {(
                      todayRevenue?.vsYesterday?.orders ??
                      metrics?.pendingOrders ??
                      0
                    ).toLocaleString()}
                  </Heading3>
                  <Caption style={glanceStyles.cellLabel}>Today Visits</Caption>
                  {todayRevenue?.vsYesterday && (
                    <View style={glanceStyles.changePill}>
                      <Ionicons
                        name={
                          (todayRevenue.vsYesterday.percentChange ?? 0) >= 0
                            ? 'arrow-up'
                            : 'arrow-down'
                        }
                        size={10}
                        color={
                          (todayRevenue.vsYesterday.percentChange ?? 0) >= 0 ? '#10B981' : '#EF4444'
                        }
                      />
                      <Caption
                        style={[
                          glanceStyles.changePillText,
                          {
                            color:
                              (todayRevenue.vsYesterday.percentChange ?? 0) >= 0
                                ? '#10B981'
                                : '#EF4444',
                          },
                        ]}
                      >
                        {Math.abs(todayRevenue.vsYesterday.percentChange ?? 0).toFixed(1)}%
                      </Caption>
                    </View>
                  )}
                </View>
                {/* Revenue */}
                <View style={[glanceStyles.cell, glanceStyles.cellBorderLeft]}>
                  <View style={[glanceStyles.cellIcon, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="cash" size={18} color="#10B981" />
                  </View>
                  <Heading3 style={glanceStyles.cellValue}>
                    ₹{(todayRevenue?.totalGMV ?? 0).toLocaleString()}
                  </Heading3>
                  <Caption style={glanceStyles.cellLabel}>Today Revenue</Caption>
                  {todayRevenue?.vsYesterday && (
                    <View style={glanceStyles.changePill}>
                      <Ionicons
                        name={
                          (todayRevenue.vsYesterday.change ?? 0) >= 0 ? 'arrow-up' : 'arrow-down'
                        }
                        size={10}
                        color={(todayRevenue.vsYesterday.change ?? 0) >= 0 ? '#10B981' : '#EF4444'}
                      />
                      <Caption
                        style={[
                          glanceStyles.changePillText,
                          {
                            color:
                              (todayRevenue.vsYesterday.change ?? 0) >= 0 ? '#10B981' : '#EF4444',
                          },
                        ]}
                      >
                        vs yest
                      </Caption>
                    </View>
                  )}
                </View>
                {/* Active Offers */}
                <View style={[glanceStyles.cell, glanceStyles.cellBorderTop]}>
                  <View style={[glanceStyles.cellIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="pricetag" size={18} color="#D97706" />
                  </View>
                  <Heading3 style={glanceStyles.cellValue}>
                    {(metrics?.activeProducts ?? 0).toLocaleString()}
                  </Heading3>
                  <Caption style={glanceStyles.cellLabel}>Active Offers</Caption>
                </View>
                {/* Pending Orders */}
                <View
                  style={[
                    glanceStyles.cell,
                    glanceStyles.cellBorderLeft,
                    glanceStyles.cellBorderTop,
                  ]}
                >
                  <View style={[glanceStyles.cellIcon, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="time" size={18} color="#EF4444" />
                  </View>
                  <Heading3
                    style={[
                      glanceStyles.cellValue,
                      (metrics?.pendingOrders ?? 0) > 0 && { color: '#EF4444' },
                    ]}
                  >
                    {(metrics?.pendingOrders ?? 0).toLocaleString()}
                  </Heading3>
                  <Caption style={glanceStyles.cellLabel}>Pending Orders</Caption>
                  {(metrics?.pendingOrders ?? 0) > 0 && (
                    <View style={[glanceStyles.changePill, { backgroundColor: '#FEE2E2' }]}>
                      <Caption style={[glanceStyles.changePillText, { color: '#EF4444' }]}>
                        Action needed
                      </Caption>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* REZ × Rendez — social dating platform bookings */}
        <RendezBookingsCard storeId={activeStore?._id} />

        {/* A-05: Health Score Card */}
        {healthData && (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.healthCardContainer}
          >
            <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.healthCard}>
              <View style={styles.healthScoreContent}>
                <View style={styles.healthScoreLeft}>
                  <View style={styles.healthScoreRing}>
                    <Text style={styles.healthScore}>{healthData.score || 0}</Text>
                  </View>
                </View>
                <View style={styles.healthScoreRight}>
                  <Heading3 style={styles.healthLabel}>Store Health</Heading3>
                  <View style={styles.trendBadge}>
                    <Ionicons
                      name={(healthData.trend || 0) > 0 ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={(healthData.trend || 0) > 0 ? Colors.success[500] : Colors.error[500]}
                    />
                    <BodyText
                      style={[
                        styles.trendText,
                        {
                          color:
                            (healthData.trend || 0) > 0 ? Colors.success[500] : Colors.error[500],
                        },
                      ]}
                    >
                      {(healthData.trend || 0) > 0 ? '+' : ''}
                      {healthData.trend}% vs last week
                    </BodyText>
                  </View>
                  {healthData.percentile && (
                    <Caption style={styles.percentileText}>
                      Top {healthData.percentile}% of similar stores
                    </Caption>
                  )}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* A-05: AI Recommendations */}
        {recommendations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={styles.recsSection}>
              <Heading3 style={styles.recsSectionTitle}>AI Recommendations</Heading3>
              {recommendations.map((rec, idx) => (
                <TouchableOpacity
                  key={rec.id || `rec-${idx}`}
                  style={styles.recCard}
                  activeOpacity={0.8}
                  onPress={() => rec.actionRoute && router.push(rec.actionRoute)}
                >
                  <View style={styles.recHeader}>
                    <Heading3 style={styles.recHeadline}>
                      {rec.headline || 'Action needed'}
                    </Heading3>
                  </View>
                  <BodyText style={styles.recDesc}>{rec.description}</BodyText>
                  {rec.estimatedImpact && (
                    <Caption style={styles.recImpact}>💡 {rec.estimatedImpact}</Caption>
                  )}
                  <View style={styles.recCTA}>
                    <BodyText style={styles.recCTAText}>{rec.actionLabel || 'Learn More'}</BodyText>
                    <Ionicons name="arrow-forward" size={14} color={Colors.primary[500]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Today's Highlights - Horizontal Scroll */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.highlightsSection}>
            <View style={styles.highlightsTitleRow}>
              <View style={styles.highlightsIconBg}>
                <Ionicons name="today" size={18} color={Colors.text.inverse} />
              </View>
              <Heading3 style={styles.highlightsSectionTitle}>Today's Highlights</Heading3>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.highlightsScroll}
            >
              {/* Total Revenue Card */}
              <Animated.View entering={FadeInRight.delay(200).springify()}>
                <LinearGradient
                  colors={['#0B2240', '#1E3A5F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.highlightCard}
                >
                  <View style={styles.highlightCardIcon}>
                    <Ionicons name="wallet" size={20} color="#00C06A" />
                  </View>
                  <Caption style={styles.highlightCardLabel}>Total Revenue (All Time)</Caption>
                  <Heading2 style={styles.highlightCardValue}>
                    {formatCurrency(metrics?.totalRevenue || 0)}
                  </Heading2>
                  <View style={styles.highlightCardBadge}>
                    <Ionicons
                      name={(metrics?.revenueGrowth || 0) >= 0 ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={(metrics?.revenueGrowth || 0) >= 0 ? '#00C06A' : Colors.error[500]}
                    />
                    <BodyText
                      style={[
                        styles.highlightCardBadgeText,
                        {
                          color: (metrics?.revenueGrowth || 0) >= 0 ? '#00C06A' : Colors.error[500],
                        },
                      ]}
                    >
                      {formatPercentage(metrics?.revenueGrowth || 0)}
                    </BodyText>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Total Orders Card */}
              <Animated.View entering={FadeInRight.delay(250).springify()}>
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.highlightCard}
                >
                  <View style={styles.highlightCardIcon}>
                    <Ionicons name="cart" size={20} color={Colors.text.inverse} />
                  </View>
                  <Caption style={styles.highlightCardLabel}>Total Orders (All Time)</Caption>
                  <Heading2 style={styles.highlightCardValue}>
                    {formatNumber(metrics?.totalOrders || 0)}
                  </Heading2>
                  <View style={styles.highlightCardBadge}>
                    <Ionicons
                      name={(metrics?.ordersGrowth || 0) >= 0 ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={(metrics?.ordersGrowth || 0) >= 0 ? '#00C06A' : Colors.error[500]}
                    />
                    <BodyText
                      style={[
                        styles.highlightCardBadgeText,
                        {
                          color: (metrics?.ordersGrowth || 0) >= 0 ? '#00C06A' : Colors.error[500],
                        },
                      ]}
                    >
                      {formatPercentage(metrics?.ordersGrowth || 0)}
                    </BodyText>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Customers Card */}
              <Animated.View entering={FadeInRight.delay(300).springify()}>
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.highlightCard}
                >
                  <View style={styles.highlightCardIcon}>
                    <Ionicons name="people" size={20} color={Colors.text.inverse} />
                  </View>
                  <Caption style={styles.highlightCardLabel}>Customers (All Time)</Caption>
                  <Heading2 style={styles.highlightCardValue}>
                    {formatNumber(metrics?.totalCustomers || 0)}
                  </Heading2>
                  <View style={styles.highlightCardBadge}>
                    <Ionicons
                      name={(metrics?.customerGrowth || 0) >= 0 ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={(metrics?.customerGrowth || 0) >= 0 ? '#00C06A' : Colors.error[500]}
                    />
                    <BodyText
                      style={[
                        styles.highlightCardBadgeText,
                        {
                          color:
                            (metrics?.customerGrowth || 0) >= 0 ? '#00C06A' : Colors.error[500],
                        },
                      ]}
                    >
                      {formatPercentage(metrics?.customerGrowth || 0)}
                    </BodyText>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Pending Orders Card */}
              <Animated.View entering={FadeInRight.delay(350).springify()}>
                <View style={styles.highlightCardLight}>
                  <View
                    style={[
                      styles.highlightCardIconLight,
                      { backgroundColor: Colors.warning[100] },
                    ]}
                  >
                    <Ionicons name="time" size={20} color={Colors.warning[500]} />
                  </View>
                  <Caption style={styles.highlightCardLabelDark}>Pending Orders</Caption>
                  <Heading2 style={styles.highlightCardValueDark}>
                    {formatNumber(metrics?.pendingOrders || 0)}
                  </Heading2>
                  <View
                    style={[
                      styles.highlightCardBadgeLight,
                      { backgroundColor: Colors.warning[100] },
                    ]}
                  >
                    <BodyText
                      style={{ color: Colors.warning[500], fontSize: 11, fontWeight: '600' }}
                    >
                      Needs attention
                    </BodyText>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </View>
        </Animated.View>

        {/* Story Card — Revenue narrative */}
        {metrics && (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={{ marginHorizontal: 16, marginBottom: 12 }}
          >
            <LinearGradient
              colors={['#7C3AED', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14, padding: 16 }}
            >
              <BodyText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' }}>
                This Month's Highlight
              </BodyText>
              <Heading3 style={{ color: '#fff', fontSize: 18, marginTop: 4 }}>
                Rez brought you {'\u20B9'}
                {(metrics.monthlyRevenue || 0).toLocaleString()} from {metrics.monthlyOrders || 0}{' '}
                orders
              </Heading3>
              {metrics.revenueGrowth > 0 ? (
                <BodyText style={{ color: '#A5F3FC', fontSize: 13, marginTop: 4 }}>
                  {'\u{1F4C8}'} That's {(metrics.revenueGrowth ?? 0).toFixed(1)}% more than last
                  month!
                </BodyText>
              ) : (
                <BodyText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                  Keep going — your loyal customers are coming back
                </BodyText>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* LI WEI: merchant ROI — Today's Revenue Card with vs Yesterday comparison */}
        {todayRevenue && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={{ marginHorizontal: 16, marginBottom: 14 }}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14, padding: 16 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <View>
                  <BodyText
                    style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' }}
                  >
                    TODAY'S REVENUE
                  </BodyText>
                  <Heading2 style={{ color: '#fff', marginTop: 4 }}>
                    ₹{(todayRevenue.totalGMV || 0).toLocaleString()}
                  </Heading2>
                </View>
                {todayRevenue.vsYesterday && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name={
                          (todayRevenue.vsYesterday.percentChange ?? 0) >= 0
                            ? 'trending-up'
                            : 'trending-down'
                        }
                        size={14}
                        color={
                          (todayRevenue.vsYesterday.percentChange ?? 0) >= 0 ? '#A5F3FC' : '#FCA5A5'
                        }
                      />
                      <BodyText
                        style={{
                          color:
                            (todayRevenue.vsYesterday.percentChange ?? 0) >= 0
                              ? '#A5F3FC'
                              : '#FCA5A5',
                          fontSize: 12,
                          fontWeight: '600',
                          marginLeft: 4,
                        }}
                      >
                        {(todayRevenue.vsYesterday.percentChange ?? 0) >= 0 ? '+' : ''}
                        {(todayRevenue.vsYesterday.percentChange ?? 0).toFixed(1)}%
                      </BodyText>
                    </View>
                    <Caption style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                      vs yesterday
                    </Caption>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                    Orders Today
                  </Caption>
                  <Heading3 style={{ color: '#fff', marginTop: 2 }}>
                    {todayRevenue.totalOrders}
                  </Heading3>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <Caption style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                    Your Earnings
                  </Caption>
                  <Heading3 style={{ color: '#fff', marginTop: 2 }}>
                    ₹{(todayRevenue.merchantEarnings || 0).toLocaleString()}
                  </Heading3>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* LI WEI: merchant ROI — Top 3 Items Today */}
        {topItemsToday && topItemsToday.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            style={{ marginHorizontal: 16, marginBottom: 14 }}
          >
            <View style={{ marginBottom: 10 }}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}
              >
                <View style={{ backgroundColor: '#FCD34D', borderRadius: 8, padding: 8 }}>
                  <Ionicons name="flame" size={16} color="#D97706" />
                </View>
                <Heading3 style={{ color: Colors.text.primary }}>Top Items Today</Heading3>
              </View>
              {topItemsToday.map((item, index) => (
                <View
                  key={item.productId}
                  style={{
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: Colors.gray[50],
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: Colors.primary[100],
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <BodyText
                      style={{ color: Colors.primary[500], fontWeight: '700', fontSize: 16 }}
                    >
                      #{index + 1}
                    </BodyText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <BodyText
                      style={{ fontWeight: '600', color: Colors.text.primary, fontSize: 13 }}
                    >
                      {item.name}
                    </BodyText>
                    <Caption style={{ color: Colors.text.tertiary, marginTop: 2 }}>
                      {item.orderCount} orders • ₹{(item.totalRevenue || 0).toLocaleString()}
                    </Caption>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* LI WEI: merchant ROI — Customer Return Rate */}
        {customerRetention && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={{ marginHorizontal: 16, marginBottom: 14 }}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14, padding: 14 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <BodyText
                    style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '500' }}
                  >
                    RETURNING CUSTOMERS
                  </BodyText>
                  <Heading2 style={{ color: '#fff', marginTop: 4 }}>
                    {(customerRetention.returnRatePercent ?? 0).toFixed(1)}%
                  </Heading2>
                  <Caption style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {customerRetention.returningCustomersToday ?? 0} of{' '}
                    {customerRetention.totalCustomersToday ?? 0} today
                  </Caption>
                </View>
                <View
                  style={{ width: 70, height: 70, justifyContent: 'center', alignItems: 'center' }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <BodyText style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
                      {(customerRetention.returnRatePercent ?? 0).toFixed(0)}%
                    </BodyText>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* LI WEI: merchant ROI — Basket Size Trend Alert */}
        {basketTrend && basketTrend.percentChange !== 0 && (
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            style={{ marginHorizontal: 16, marginBottom: 14 }}
          >
            <LinearGradient
              colors={basketTrend.isDecline ? ['#F87171', '#EF4444'] : ['#60A5FA', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 14, padding: 14 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons
                  name={basketTrend.isDecline ? 'alert-circle' : 'checkmark-circle'}
                  size={24}
                  color="#fff"
                />
                <View style={{ flex: 1 }}>
                  <BodyText
                    style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' }}
                  >
                    {basketTrend.isDecline
                      ? 'Average Order Value Declining'
                      : 'Strong Basket Growth'}
                  </BodyText>
                  <Caption style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                    {basketTrend.isDecline
                      ? `Down ${Math.abs(basketTrend.percentChange ?? 0).toFixed(1)}%`
                      : `Up ${(basketTrend.percentChange ?? 0).toFixed(1)}%`}{' '}
                    this week • ₹{(basketTrend.thisWeekAvg ?? 0).toFixed(0)} avg order value
                  </Caption>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Action Cards — 2x2 grid */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{ marginHorizontal: 16, marginBottom: 12 }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {[
              {
                icon: 'storefront-outline' as const,
                label: 'POS — Sell Now',
                route: '/pos',
                bg: '#EDE9FE',
                color: '#7C3AED',
              },
              {
                icon: 'ticket-outline' as const,
                label: 'Verify Deal',
                route: '/(dashboard)/deals',
                bg: '#EFF6FF',
                color: '#3B82F6',
              },
              {
                icon: 'add-circle-outline' as const,
                label: 'Create Offer',
                route: '/(dashboard)/create-offer',
                bg: '#F0FDF4',
                color: '#10B981',
              },
              {
                icon: 'people-outline' as const,
                label: 'Customers',
                route: '/customers',
                bg: '#FDF4FF',
                color: '#A855F7',
              },
              {
                icon: 'receipt-outline' as const,
                label: 'Settlements',
                route: '/settlements',
                bg: '#FEF3C7',
                color: '#D97706',
              },
              {
                icon: 'business-outline' as const,
                label: 'Hotel OS',
                route: '/hotel',
                bg: '#EDE9FE',
                color: '#7C3AED',
                fullWidth: true,
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route)}
                style={{
                  flex: 1,
                  minWidth: item.fullWidth ? '100%' : '45%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: item.bg,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
                <BodyText style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                  {item.label}
                </BodyText>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Action Items - What Needs Your Attention */}
        {actionItems.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={styles.actionItemsSection}>
              <View style={styles.actionItemsHeader}>
                <View style={styles.actionItemsTitleRow}>
                  <View
                    style={[styles.recentActivityIconBg, { backgroundColor: Colors.error[500] }]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={Colors.text.inverse} />
                  </View>
                  <Heading3 style={styles.recentActivityTitle}>Needs Your Attention</Heading3>
                  <View style={styles.actionBadge}>
                    <BodyText style={styles.actionBadgeText}>{actionItems.length}</BodyText>
                  </View>
                </View>
              </View>
              {actionItems.slice(0, 5).map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.actionItemCard,
                    index === 0 && item.priority === 'urgent' && styles.actionItemUrgent,
                  ]}
                  onPress={() => router.push(item.deepLink)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionItemIconBg, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={item.color} />
                  </View>
                  <View style={styles.actionItemContent}>
                    <BodyText style={styles.actionItemTitle}>{item.title}</BodyText>
                    <Caption style={styles.actionItemDesc}>{item.description}</Caption>
                  </View>
                  <View
                    style={[styles.actionPriorityBadge, { backgroundColor: `${item.color}15` }]}
                  >
                    <BodyText style={[styles.actionPriorityText, { color: item.color }]}>
                      {item.priority === 'urgent'
                        ? 'URGENT'
                        : item.priority === 'high'
                          ? 'HIGH'
                          : 'MED'}
                    </BodyText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* LI WEI: merchant ROI — Campaign Performance with Revenue Attribution */}
        {campaignPerformance && campaignPerformance.length > 0 && (
          <Animated.View entering={FadeInDown.delay(380).springify()}>
            <View style={styles.analyticsSection}>
              <View style={styles.analyticsSectionHeader}>
                <View style={styles.analyticsTitleRow}>
                  <View style={styles.analyticsIconBg}>
                    <Ionicons name="rocket" size={20} color={Colors.text.inverse} />
                  </View>
                  <Heading3 style={styles.analyticsSectionTitle}>Active Campaigns ROI</Heading3>
                </View>
              </View>
              <View style={{ paddingHorizontal: 16, gap: 10 }}>
                {campaignPerformance.slice(0, 3).map((campaign) => (
                  <TouchableOpacity
                    key={campaign.campaignId}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(dashboard)/bonus-campaigns`)}
                  >
                    <LinearGradient
                      colors={
                        campaign.roi > 200
                          ? ['#10B981', '#059669']
                          : campaign.roi > 100
                            ? ['#3B82F6', '#2563EB']
                            : ['#F59E0B', '#D97706']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 10, padding: 12 }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 8,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <BodyText style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                            {campaign.campaignName}
                          </BodyText>
                          <Caption style={{ color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                            {campaign.type}
                          </Caption>
                        </View>
                        <View
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                          }}
                        >
                          <Caption style={{ color: '#fff', fontWeight: '600', fontSize: 11 }}>
                            ROI: {(campaign.roi ?? 0).toFixed(0)}%
                          </Caption>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Caption style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
                            Revenue Driven
                          </Caption>
                          <BodyText style={{ color: '#fff', fontWeight: '600', marginTop: 2 }}>
                            ₹{(campaign.attributedRevenue || 0).toLocaleString()}
                          </BodyText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Caption style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
                            Customers
                          </Caption>
                          <BodyText style={{ color: '#fff', fontWeight: '600', marginTop: 2 }}>
                            {campaign.customersReached}
                          </BodyText>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Analytics Overview Section - Premium Redesign */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.analyticsSection}>
            {/* Section Header */}
            <View style={styles.analyticsSectionHeader}>
              <View style={styles.analyticsTitleRow}>
                <View style={styles.analyticsIconBg}>
                  <Ionicons name="pulse" size={20} color={Colors.text.inverse} />
                </View>
                <Heading3 style={styles.analyticsSectionTitle}>Analytics Overview</Heading3>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/analytics')}
                style={styles.analyticsViewAllBtn}
              >
                <BodyText style={styles.analyticsViewAllText}>View All</BodyText>
                <Ionicons name="arrow-forward" size={16} color="#00C06A" />
              </TouchableOpacity>
            </View>

            {/* Main Analytics Cards - 2x2 Grid */}
            <View style={styles.analyticsGrid}>
              {/* Revenue Card */}
              <Animated.View
                entering={FadeInDown.delay(450).springify()}
                style={styles.analyticsCardWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('/analytics?tab=revenue')}
                >
                  <LinearGradient
                    colors={['#00C06A', '#00A85A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.analyticsCardGradient}
                  >
                    <View style={styles.analyticsCardContent}>
                      <View style={styles.analyticsCardTop}>
                        <View style={styles.analyticsCardIconCircle}>
                          <Ionicons name="trending-up" size={20} color="#00C06A" />
                        </View>
                        <View
                          style={[
                            styles.analyticsChangeBadge,
                            { backgroundColor: 'rgba(255,255,255,0.25)' },
                          ]}
                        >
                          <Ionicons
                            name={(metrics?.revenueGrowth || 0) >= 0 ? 'arrow-up' : 'arrow-down'}
                            size={10}
                            color={Colors.text.inverse}
                          />
                          <BodyText style={styles.analyticsChangeBadgeText}>
                            {Math.abs(metrics?.revenueGrowth || 0).toFixed(1)}%
                          </BodyText>
                        </View>
                      </View>
                      <BodyText style={styles.analyticsCardLabel}>Monthly Revenue</BodyText>
                      <Heading2 style={styles.analyticsCardValue}>
                        {formatCurrency(metrics?.monthlyRevenue || 0)}
                      </Heading2>
                      <View style={styles.analyticsCardFooter}>
                        <Caption style={styles.analyticsCardSubtext}>vs last month</Caption>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Orders Card */}
              <Animated.View
                entering={FadeInDown.delay(500).springify()}
                style={styles.analyticsCardWrapper}
              >
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/orders')}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.analyticsCardGradient}
                  >
                    <View style={styles.analyticsCardContent}>
                      <View style={styles.analyticsCardTop}>
                        <View style={styles.analyticsCardIconCircle}>
                          <Ionicons name="receipt" size={20} color="#6366F1" />
                        </View>
                        <View
                          style={[
                            styles.analyticsChangeBadge,
                            { backgroundColor: 'rgba(255,255,255,0.25)' },
                          ]}
                        >
                          <Ionicons
                            name={(metrics?.ordersGrowth || 0) >= 0 ? 'arrow-up' : 'arrow-down'}
                            size={10}
                            color={Colors.text.inverse}
                          />
                          <BodyText style={styles.analyticsChangeBadgeText}>
                            {Math.abs(metrics?.ordersGrowth || 0).toFixed(1)}%
                          </BodyText>
                        </View>
                      </View>
                      <BodyText style={styles.analyticsCardLabel}>Monthly Orders</BodyText>
                      <Heading2 style={styles.analyticsCardValue}>
                        {formatNumber(metrics?.monthlyOrders || 0)}
                      </Heading2>
                      <View style={styles.analyticsCardFooter}>
                        <Caption style={styles.analyticsCardSubtext}>vs last month</Caption>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Avg Order Value Card */}
              <Animated.View
                entering={FadeInDown.delay(550).springify()}
                style={styles.analyticsCardWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('/analytics?tab=revenue')}
                >
                  <View style={styles.analyticsCardLight}>
                    <View style={styles.analyticsCardContent}>
                      <View style={styles.analyticsCardTop}>
                        <LinearGradient
                          colors={['#F59E0B', '#D97706']}
                          style={styles.analyticsCardIconGradient}
                        >
                          <Ionicons name="wallet" size={18} color={Colors.text.inverse} />
                        </LinearGradient>
                      </View>
                      <BodyText style={styles.analyticsCardLabelDark}>Avg Order Value</BodyText>
                      <Heading2 style={styles.analyticsCardValueDark}>
                        {formatCurrency(metrics?.averageOrderValue || 0)}
                      </Heading2>
                      <View style={styles.analyticsCardFooter}>
                        <Caption style={styles.analyticsCardSubtextDark}>per order</Caption>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Customer Growth Card */}
              <Animated.View
                entering={FadeInDown.delay(600).springify()}
                style={styles.analyticsCardWrapper}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('/analytics?tab=customers')}
                >
                  <View style={styles.analyticsCardLight}>
                    <View style={styles.analyticsCardContent}>
                      <View style={styles.analyticsCardTop}>
                        <LinearGradient
                          colors={['#EC4899', '#DB2777']}
                          style={styles.analyticsCardIconGradient}
                        >
                          <Ionicons name="people" size={18} color={Colors.text.inverse} />
                        </LinearGradient>
                        <View
                          style={[
                            styles.analyticsChangeBadgeSmall,
                            {
                              backgroundColor:
                                (metrics?.customerGrowth || 0) >= 0 ? '#DCFCE7' : Colors.error[100],
                            },
                          ]}
                        >
                          <Ionicons
                            name={(metrics?.customerGrowth || 0) >= 0 ? 'arrow-up' : 'arrow-down'}
                            size={10}
                            color={(metrics?.customerGrowth || 0) >= 0 ? '#16A34A' : '#DC2626'}
                          />
                          <BodyText
                            style={[
                              styles.analyticsChangeBadgeTextSmall,
                              {
                                color: (metrics?.customerGrowth || 0) >= 0 ? '#16A34A' : '#DC2626',
                              },
                            ]}
                          >
                            {Math.abs(metrics?.customerGrowth || 0).toFixed(1)}%
                          </BodyText>
                        </View>
                      </View>
                      <BodyText style={styles.analyticsCardLabelDark}>Customer Growth</BodyText>
                      <Heading2 style={styles.analyticsCardValueDark}>
                        {formatNumber(metrics?.totalCustomers || 0)}
                      </Heading2>
                      <View style={styles.analyticsCardFooter}>
                        <Caption style={styles.analyticsCardSubtextDark}>total customers</Caption>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Quick Stats Bar */}
            <Animated.View entering={FadeInDown.delay(650).springify()}>
              <View style={styles.quickStatsBar}>
                <TouchableOpacity
                  style={styles.quickStatItem}
                  onPress={() => router.push('/analytics?tab=inventory')}
                >
                  <View style={[styles.quickStatDot, { backgroundColor: Colors.error[500] }]} />
                  <BodyText style={styles.quickStatLabel}>Low Stock</BodyText>
                  <BodyText style={styles.quickStatValue}>
                    {metrics?.lowStockProducts || 0}
                  </BodyText>
                </TouchableOpacity>
                <View style={styles.quickStatDivider} />
                <TouchableOpacity
                  style={styles.quickStatItem}
                  onPress={() => router.push('/orders?filter=pending')}
                >
                  <View style={[styles.quickStatDot, { backgroundColor: Colors.warning[500] }]} />
                  <BodyText style={styles.quickStatLabel}>Pending</BodyText>
                  <BodyText style={styles.quickStatValue}>{metrics?.pendingOrders || 0}</BodyText>
                </TouchableOpacity>
                <View style={styles.quickStatDivider} />
                <TouchableOpacity
                  style={styles.quickStatItem}
                  onPress={() => router.push('/products')}
                >
                  <View style={[styles.quickStatDot, { backgroundColor: '#00C06A' }]} />
                  <BodyText style={styles.quickStatLabel}>Products</BodyText>
                  <BodyText style={styles.quickStatValue}>{metrics?.totalProducts || 0}</BodyText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Store Performance Breakdown */}
        {storePerformance.length > 0 && (
          <Animated.View entering={FadeInDown.delay(480).springify()}>
            <View style={styles.storePerformanceSection}>
              <View style={styles.storePerformanceHeader}>
                <View style={styles.actionItemsTitleRow}>
                  <View style={[styles.recentActivityIconBg, { backgroundColor: '#6366F1' }]}>
                    <Ionicons name="storefront" size={18} color={Colors.text.inverse} />
                  </View>
                  <Heading3 style={styles.recentActivityTitle}>Store Performance</Heading3>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/stores')}
                  style={styles.recentActivityViewAll}
                >
                  <BodyText style={styles.recentActivityViewAllText}>All Stores</BodyText>
                  <Ionicons name="chevron-forward" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
              >
                {storePerformance.map((store, index) => (
                  <Animated.View
                    key={store.storeId}
                    entering={FadeInRight.delay(index * 80).springify()}
                  >
                    <TouchableOpacity
                      style={styles.storeCard}
                      activeOpacity={0.85}
                      onPress={() => router.push(`/stores/${store.storeId}/details`)}
                    >
                      {/* Store Header */}
                      <View style={styles.storeCardHeader}>
                        <View style={styles.storeCardAvatar}>
                          <BodyText style={styles.storeCardAvatarText}>
                            {(store.name || 'S').charAt(0).toUpperCase()}
                          </BodyText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <BodyText style={styles.storeCardName} numberOfLines={1}>
                            {store.name}
                          </BodyText>
                          <Caption style={styles.storeCardLocation} numberOfLines={1}>
                            {store.location || store.category || ''}
                          </Caption>
                        </View>
                        {store.rating > 0 && (
                          <View style={styles.storeRatingBadge}>
                            <Ionicons name="star" size={11} color={Colors.warning[500]} />
                            <BodyText style={styles.storeRatingText}>
                              {(store.rating ?? 0).toFixed(1)}
                            </BodyText>
                          </View>
                        )}
                      </View>

                      {/* Key Metrics Grid */}
                      <View style={styles.storeMetricsGrid}>
                        <View style={styles.storeMetricItem}>
                          <Caption style={styles.storeMetricLabel}>This Month</Caption>
                          <BodyText style={styles.storeMetricValue}>
                            ₹{(store.monthlyRevenue ?? 0).toLocaleString()}
                          </BodyText>
                        </View>
                        <View style={styles.storeMetricItem}>
                          <Caption style={styles.storeMetricLabel}>Orders</Caption>
                          <BodyText style={styles.storeMetricValue}>{store.monthlyOrders}</BodyText>
                        </View>
                        <View style={styles.storeMetricItem}>
                          <Caption style={styles.storeMetricLabel}>Today</Caption>
                          <BodyText
                            style={[styles.storeMetricValue, { color: Colors.success[500] }]}
                          >
                            ₹{(store.todayRevenue ?? 0).toLocaleString()}
                          </BodyText>
                        </View>
                        <View style={styles.storeMetricItem}>
                          <Caption style={styles.storeMetricLabel}>Customers</Caption>
                          <BodyText style={styles.storeMetricValue}>
                            {store.uniqueCustomers}
                          </BodyText>
                        </View>
                      </View>

                      {/* Status Pills */}
                      <View style={styles.storeStatusRow}>
                        {store.pendingOrders > 0 && (
                          <View
                            style={[
                              styles.storeStatusPill,
                              { backgroundColor: Colors.warning[100] },
                            ]}
                          >
                            <View
                              style={[
                                styles.storeStatusDot,
                                { backgroundColor: Colors.warning[500] },
                              ]}
                            />
                            <Caption style={{ color: Colors.warning[800], fontSize: 11 }}>
                              {store.pendingOrders} pending
                            </Caption>
                          </View>
                        )}
                        {store.lowStockProducts > 0 && (
                          <View
                            style={[styles.storeStatusPill, { backgroundColor: Colors.error[100] }]}
                          >
                            <View
                              style={[
                                styles.storeStatusDot,
                                { backgroundColor: Colors.error[500] },
                              ]}
                            />
                            <Caption style={{ color: Colors.error[800], fontSize: 11 }}>
                              {store.lowStockProducts} low stock
                            </Caption>
                          </View>
                        )}
                        {store.pendingOrders === 0 && store.lowStockProducts === 0 && (
                          <View style={[styles.storeStatusPill, { backgroundColor: '#D1FAE5' }]}>
                            <View
                              style={[
                                styles.storeStatusDot,
                                { backgroundColor: Colors.success[500] },
                              ]}
                            />
                            <Caption style={{ color: '#065F46', fontSize: 11 }}>All good</Caption>
                          </View>
                        )}
                        {store.pendingCashbackCount > 0 && (
                          <View style={[styles.storeStatusPill, { backgroundColor: '#EDE9FE' }]}>
                            <Caption style={{ color: '#5B21B6', fontSize: 11 }}>
                              {store.pendingCashbackCount} cashback
                            </Caption>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}

        {/* Budget Gauge — Monthly Liability Overview */}
        {metrics && (
          <Animated.View
            entering={FadeInDown.delay(450).springify()}
            style={{ marginHorizontal: 16, marginBottom: 12 }}
          >
            <BudgetGauge
              used={metrics.totalCashbackPaid || 0}
              total={Math.max((metrics.totalCashbackPaid || 0) + (metrics.pendingCashback || 0), 1)}
            />
          </Animated.View>
        )}

        <DemandIntelligenceCard />
        <REZAttributionCard />
        <TodayRevenueWidget />
        <RezNowAnalyticsCard />

        {/* Quick Actions - Premium Grid */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsSectionHeader}>
              <View style={styles.quickActionsIconBg}>
                <Ionicons name="flash" size={18} color={Colors.text.inverse} />
              </View>
              <Heading3 style={styles.quickActionsSectionTitle}>Quick Actions</Heading3>
            </View>

            {/* Primary Actions Row */}
            <View style={styles.primaryActionsRow}>
              <TouchableOpacity
                style={styles.primaryActionCard}
                onPress={() => router.push('/products/add')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#00C06A', '#00A85A']}
                  style={styles.primaryActionGradient}
                >
                  <Ionicons name="add-circle" size={28} color={Colors.text.inverse} />
                  <BodyText style={styles.primaryActionText}>Add Product</BodyText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionCard}
                onPress={() => router.push('/orders')}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#6366F1', '#4F46E5']}
                  style={styles.primaryActionGradient}
                >
                  <Ionicons name="receipt" size={28} color={Colors.text.inverse} />
                  <BodyText style={styles.primaryActionText}>View Orders</BodyText>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Secondary Actions Grid */}
            <View style={styles.secondaryActionsGrid}>
              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/stores')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Ionicons name="storefront" size={22} color="#6366F1" />
                </View>
                <BodyText style={styles.secondaryActionText}>Stores</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/cashback')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="card" size={22} color={Colors.success[500]} />
                </View>
                <BodyText style={styles.secondaryActionText}>Cashback</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/analytics')}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.secondaryActionIcon, { backgroundColor: Colors.warning[100] }]}
                >
                  <Ionicons name="bar-chart" size={22} color={Colors.warning[500]} />
                </View>
                <BodyText style={styles.secondaryActionText}>Analytics</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/reports')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Ionicons name="document-text" size={22} color="#EC4899" />
                </View>
                <BodyText style={styles.secondaryActionText}>Reports</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/visits')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="calendar" size={22} color="#7C3AED" />
                </View>
                <BodyText style={styles.secondaryActionText}>Store Visits</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/tickets')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="chatbubbles" size={22} color="#D97706" />
                </View>
                <BodyText style={styles.secondaryActionText}>Tickets</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/settlements')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="receipt-outline" size={22} color="#059669" />
                </View>
                <BodyText style={styles.secondaryActionText}>Settlements</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/events')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="calendar" size={22} color="#3B82F6" />
                </View>
                <BodyText style={styles.secondaryActionText}>Events</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/analytics/export')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#F3E8FF' }]}>
                  <Ionicons name="download" size={22} color="#9333EA" />
                </View>
                <BodyText style={styles.secondaryActionText}>Export</BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push('/business-ai')}
                activeOpacity={0.8}
              >
                <View style={[styles.secondaryActionIcon, { backgroundColor: '#6366F1' }]}>
                  <Ionicons name="bulb" size={22} color="#ffffff" />
                </View>
                <BodyText style={styles.secondaryActionText}>Business AI</BodyText>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Customer Payment Activity */}
        {customerPayments.length > 0 && (
          <Animated.View entering={FadeInDown.delay(580).springify()}>
            <View style={styles.recentActivitySection}>
              <View style={styles.recentActivityHeader}>
                <View style={styles.recentActivityTitleRow}>
                  <View
                    style={[styles.recentActivityIconBg, { backgroundColor: Colors.success[500] }]}
                  >
                    <Ionicons name="people" size={18} color={Colors.text.inverse} />
                  </View>
                  <Heading3 style={styles.recentActivityTitle}>Customer Payments</Heading3>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(dashboard)/payments')}
                  style={styles.recentActivityViewAll}
                >
                  <BodyText style={styles.recentActivityViewAllText}>View All</BodyText>
                  <Ionicons name="chevron-forward" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>

              <View style={styles.recentActivityList}>
                {customerPayments.map((payment, index) => (
                  <TouchableOpacity
                    key={payment.id}
                    style={[
                      styles.recentActivityItem,
                      index === customerPayments.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() =>
                      payment.type === 'order' && payment.id
                        ? router.push(`/orders/${payment.id}`)
                        : null
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentActivityItemLeft}>
                      <View
                        style={[styles.customerPaymentAvatar, { backgroundColor: '#7C3AED15' }]}
                      >
                        <BodyText style={styles.customerPaymentAvatarText}>
                          {(payment.customerName || 'C').charAt(0).toUpperCase()}
                        </BodyText>
                      </View>
                      <View style={styles.recentActivityItemInfo}>
                        <BodyText style={styles.recentActivityItemTitle}>
                          {payment.customerName}
                        </BodyText>
                        <Caption style={styles.recentActivityItemSubtitle}>
                          {payment.storeName}{' '}
                          {payment.type === 'order' ? `• #${payment.orderNumber}` : '• In-store'} •{' '}
                          {payment.paymentMethod === 'upi'
                            ? 'UPI'
                            : payment.paymentMethod === 'wallet'
                              ? 'Wallet'
                              : payment.paymentMethod === 'coins_only'
                                ? 'Coins'
                                : payment.paymentMethod === 'cod'
                                  ? 'COD'
                                  : 'Card'}
                        </Caption>
                      </View>
                    </View>
                    <View style={styles.recentActivityItemRight}>
                      <BodyText
                        style={[styles.recentActivityItemAmount, { color: Colors.success[500] }]}
                      >
                        +₹{(payment.amount ?? 0).toLocaleString()}
                      </BodyText>
                      <Caption style={styles.recentActivityItemTime}>
                        {new Date(payment.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Caption>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recent Activity - Premium Design */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <View style={styles.recentActivitySection}>
            <View style={styles.recentActivityHeader}>
              <View style={styles.recentActivityTitleRow}>
                <View style={styles.recentActivityIconBg}>
                  <Ionicons name="time" size={18} color={Colors.text.inverse} />
                </View>
                <Heading3 style={styles.recentActivityTitle}>Recent Activity</Heading3>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/orders')}
                style={styles.recentActivityViewAll}
              >
                <BodyText style={styles.recentActivityViewAllText}>See All</BodyText>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>

            {overview &&
            overview.recentActivity?.orders &&
            overview.recentActivity.orders.length > 0 ? (
              <View style={styles.recentActivityList}>
                {overview.recentActivity.orders.slice(0, 5).map((order, index: number) => {
                  const getStatusColor = (status: string) => {
                    switch (status?.toLowerCase()) {
                      case 'completed':
                      case 'delivered':
                        return Colors.success[500];
                      case 'pending':
                      case 'placed':
                        return Colors.warning[500];
                      case 'cancelled':
                        return Colors.error[500];
                      case 'processing':
                        return '#6366F1';
                      default:
                        return '#64748B';
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={order.id || index}
                      style={[
                        styles.recentActivityItem,
                        index === (overview.recentActivity?.orders?.length ?? 0) - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                      onPress={() => router.push(`/orders/${order.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.recentActivityItemLeft}>
                        <View
                          style={[
                            styles.recentActivityItemIcon,
                            { backgroundColor: `${getStatusColor(order.status)}15` },
                          ]}
                        >
                          <Ionicons name="receipt" size={18} color={getStatusColor(order.status)} />
                        </View>
                        <View style={styles.recentActivityItemInfo}>
                          <BodyText style={styles.recentActivityItemTitle}>
                            Order #{order.orderNumber || 'N/A'}
                          </BodyText>
                          <Caption style={styles.recentActivityItemSubtitle}>
                            {order.customer?.name || 'Customer'} •{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Caption>
                        </View>
                      </View>
                      <View style={styles.recentActivityItemRight}>
                        <BodyText style={styles.recentActivityItemAmount}>
                          {formatCurrency(order.total || 0)}
                        </BodyText>
                        <View
                          style={[
                            styles.recentActivityStatusBadge,
                            { backgroundColor: `${getStatusColor(order.status)}15` },
                          ]}
                        >
                          <BodyText
                            style={[
                              styles.recentActivityStatusText,
                              { color: getStatusColor(order.status) },
                            ]}
                          >
                            {order.status || 'Unknown'}
                          </BodyText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.recentActivityEmpty}>
                <View style={styles.recentActivityEmptyIcon}>
                  <Ionicons name="receipt-outline" size={32} color="#94A3B8" />
                </View>
                <BodyText style={styles.recentActivityEmptyTitle}>No Recent Orders</BodyText>
                <Caption style={styles.recentActivityEmptyText}>
                  When customers place orders, they'll appear here
                </Caption>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 400,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 100,
  },
  errorBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  errorRetryButton: {
    marginLeft: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
  },
  errorRetryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  suspensionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  suspensionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  suspensionText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  inactiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  inactiveText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
  },

  // Glassmorphic Header Styles
  glassHeader: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['3xl'],
    overflow: 'hidden',
    ...Shadows.lg,
  },
  glassHeaderGradient: {
    padding: 0,
  },
  glassHeaderOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  headerMainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...Shadows.md,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  welcomeText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: '700',
  },
  businessNameText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  modePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modeChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  modeChipTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  liveStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success[400],
  },
  liveDotPulse: {
    shadowColor: Colors.success[400],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  liveText: {
    color: Colors.text.inverse,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.error[500],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  notificationCount: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  lastUpdateCaption: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    textAlign: 'center',
  },
  // A-05: Health Score & Recommendations
  healthCardContainer: {
    marginBottom: Spacing.lg,
  },
  healthCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(3, 102, 214, 0.2)',
  },
  healthScoreContent: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  healthScoreLeft: {
    alignItems: 'center',
  },
  healthScoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary[200],
  },
  healthScore: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
  },
  healthScoreRight: {
    flex: 1,
    gap: 6,
  },
  healthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    width: 'auto',
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentileText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  recsSection: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  recsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  recCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recHeadline: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  recDesc: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  recImpact: {
    fontSize: 11,
    color: Colors.primary[600],
    fontWeight: '600',
    marginTop: 4,
  },
  recCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  recCTAText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  metricCardWrapper: {
    width: '48%',
    marginBottom: Spacing.sm,
  },
  metricCardGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Shadows.md,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'space-between',
  },
  metricCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  metricCard: {
    padding: Spacing.lg,
    minHeight: 150,
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    flex: 1,
    minWidth: '47%',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  metricTitle: {
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  glassSection: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Shadows.lg,
    overflow: 'hidden',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionWrapper: {
    width: (width - Spacing.base * 2 - Spacing.md * 2) / 3, // 3 columns with proper gaps
  },
  quickActionCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Shadows.md,
    overflow: 'hidden',
  },
  quickActionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quickActionIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  quickActionTitle: {
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 13,
    color: Colors.text.primary,
  },
  activityContainer: {
    gap: Spacing.sm,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Shadows.sm,
    marginBottom: Spacing.sm,
  },
  activityIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary[50],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary[100],
    ...Shadows.sm,
  },
  viewAllText: {
    color: Colors.primary[600],
    fontWeight: '700',
    fontSize: 12,
  },
  miniChartsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  miniChart: {
    flex: 1,
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Shadows.md,
  },
  miniChartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  miniChartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  miniChartTitle: {
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  miniChartValue: {
    marginBottom: 6,
    fontSize: 24,
    fontWeight: '800',
  },
  miniChartChange: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  miniChartBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniChartBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickMetricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickMetricCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    gap: 10,
    ...Shadows.md,
  },
  quickMetricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  quickMetricLabel: {
    color: Colors.text.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  quickMetricValue: {
    fontWeight: '800',
    fontSize: 18,
    color: Colors.text.primary,
  },

  // ==================== NEW ANALYTICS SECTION STYLES ====================
  analyticsSection: {
    marginBottom: Spacing.xl,
  },
  analyticsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  analyticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyticsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00C06A',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  analyticsSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  analyticsViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E8FFF3',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00C06A20',
  },
  analyticsViewAllText: {
    color: '#00C06A',
    fontWeight: '700',
    fontSize: 13,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  analyticsCardWrapper: {
    width: (width - Spacing.base * 2 - 12) / 2,
  },
  analyticsCardGradient: {
    borderRadius: 20,
    padding: 18,
    minHeight: 160,
    ...Shadows.md,
  },
  analyticsCardLight: {
    borderRadius: 20,
    padding: 18,
    minHeight: 160,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  analyticsCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  analyticsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  analyticsCardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  analyticsCardIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  analyticsChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  analyticsChangeBadgeText: {
    color: Colors.text.inverse,
    fontSize: 11,
    fontWeight: '700',
  },
  analyticsChangeBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  analyticsChangeBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  analyticsCardLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  analyticsCardLabelDark: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  analyticsCardValue: {
    color: Colors.text.inverse,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  analyticsCardValueDark: {
    color: Colors.text.primary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  analyticsCardFooter: {
    marginTop: 'auto',
  },
  analyticsCardSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  analyticsCardSubtextDark: {
    color: Colors.text.tertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  quickStatsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  quickStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickStatLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  quickStatValue: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  quickStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border.default,
  },

  // ==================== HIGHLIGHTS SECTION STYLES ====================
  highlightsSection: {
    marginBottom: Spacing.xl,
  },
  highlightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  highlightsIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  highlightsScroll: {
    gap: 12,
    paddingRight: Spacing.base,
  },
  highlightCard: {
    width: 160,
    borderRadius: 18,
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  highlightCardLight: {
    width: 160,
    borderRadius: 18,
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  highlightCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  highlightCardIconLight: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  highlightCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  highlightCardLabelDark: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  highlightCardValue: {
    color: Colors.text.inverse,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  highlightCardValueDark: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  highlightCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  highlightCardBadgeLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  highlightCardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ==================== QUICK ACTIONS SECTION STYLES ====================
  quickActionsSection: {
    marginBottom: Spacing.xl,
  },
  quickActionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  quickActionsIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.warning[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryActionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  primaryActionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 100,
  },
  primaryActionText: {
    color: Colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryActionCard: {
    width: (width - Spacing.base * 2 - 20) / 3,
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  secondaryActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ==================== RECENT ACTIVITY SECTION STYLES ====================
  recentActivitySection: {
    marginBottom: Spacing.xl,
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border.default,
    ...Shadows.sm,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentActivityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentActivityIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  recentActivityViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentActivityViewAllText: {
    color: '#6366F1',
    fontSize: 13,
    fontWeight: '600',
  },
  recentActivityList: {
    gap: 0,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentActivityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recentActivityItemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentActivityItemInfo: {
    flex: 1,
  },
  recentActivityItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  recentActivityItemSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  recentActivityItemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  recentActivityItemAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  recentActivityStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recentActivityStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  recentActivityEmpty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  recentActivityEmptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  recentActivityEmptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recentActivityEmptyText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  recentActivityItemTime: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  customerPaymentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerPaymentAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },

  // Action Items Section
  actionItemsSection: {
    marginBottom: Spacing.lg,
  },
  actionItemsHeader: {
    marginBottom: Spacing.md,
  },
  actionItemsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBadge: {
    backgroundColor: Colors.error[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionBadgeText: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  actionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    ...Shadows.sm,
  },
  actionItemUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.error[500],
  },
  actionItemIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionItemContent: {
    flex: 1,
    marginRight: 8,
  },
  actionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  actionItemDesc: {
    fontSize: 12,
    color: Colors.text.tertiary,
    lineHeight: 16,
  },
  actionPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionPriorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Store Performance Section
  storePerformanceSection: {
    marginBottom: Spacing.lg,
  },
  storePerformanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storeCard: {
    width: width * 0.72,
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    ...Shadows.md,
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  storeCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeCardAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
  },
  storeCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  storeCardLocation: {
    fontSize: 12,
    color: Colors.text.disabled,
  },
  storeRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warning[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storeRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning[800],
  },
  storeMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginBottom: 12,
  },
  storeMetricItem: {
    width: '50%',
    paddingVertical: 6,
  },
  storeMetricLabel: {
    fontSize: 11,
    color: Colors.text.disabled,
    marginBottom: 2,
  },
  storeMetricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  storeStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  storeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  storeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Extracted common inline styles
  flexOne: {
    flex: 1,
  },
  marginHorizontal16Bottom14: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  marginHorizontal16Bottom12: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  semiTransparentGlass: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
  },
  lightTextMuted: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  lightTextSmall11: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  veryLightText11: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  whiteText4: {
    color: '#fff',
    marginTop: 4,
  },
  whiteText2: {
    color: '#fff',
    marginTop: 2,
  },
  whiteTextBold2: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },
  cardRounded14Padded16: {
    borderRadius: 14,
    padding: 16,
  },
  cardRounded14Padded14: {
    borderRadius: 14,
    padding: 14,
  },
  lightVeryMutedText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 4,
  },
});

// Sprint 15: Glance card styles (kept separate to avoid bloating main StyleSheet)
const glanceStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#111827',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '50%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  cellBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#F3F4F6',
  },
  cellBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cellIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cellValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24,
  },
  cellLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  changePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Skeleton
  skeleton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  skeletonTitle: {
    width: 140,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonCell: {
    width: '47%',
    height: 70,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
});
