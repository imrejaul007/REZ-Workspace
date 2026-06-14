import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { showAlert } from '@/utils/alert';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from 'react-native';
import { cashbackService } from '@/services';
import { CashbackRequest, CashbackMetrics, CashbackStatus } from '@/types/api';
import { SocialMediaPostsList } from '@/components/social-media';
import { useStore } from '@/contexts/StoreContext';
import { logger } from '@/utils/logger';

type CashbackColors = typeof Colors.light;

type ViewMode = 'cashback' | 'social_media';

function getCashbackThemedStyles(colors: CashbackColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.backgroundSecondary },
    centered: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24,
    },
    title: { color: colors.text, marginBottom: 4 },
    subtitle: { color: colors.textSecondary, fontSize: 14 },
    actionButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8 },
    metricsContainer: { flexDirection: 'row', marginBottom: 24, gap: 12 },
    metricCard: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    metricValue: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    metricLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
    tabsContainer: { marginBottom: 16 },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderRadius: 20,
      backgroundColor: colors.background,
    },
    activeTab: { backgroundColor: colors.primary },
    tabText: { fontSize: 14, color: colors.text },
    activeTabText: { color: colors.background, fontWeight: '600' },
    quickActions: { flexDirection: 'row', marginBottom: 24, gap: 12 },
    quickActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    quickActionText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
    requestsContainer: { gap: 12 },
    emptyState: {
      alignItems: 'center',
      padding: 48,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    requestCard: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    requestInfo: { flex: 1 },
    requestNumber: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '500' },
    requestAmount: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    requestDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    customerInfo: { flex: 1 },
    customerName: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 2 },
    orderNumber: { fontSize: 12, color: colors.textSecondary },
    requestDate: { fontSize: 12, color: colors.textSecondary },
    requestFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    riskIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    riskDot: { width: 6, height: 6, borderRadius: 3 },
    riskText: { fontSize: 12, color: colors.textSecondary },
    flaggedBadge: { marginLeft: 4 },
    quickActionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 8, borderRadius: 6 },
    approveBtn: { backgroundColor: colors.success },
    rejectBtn: { backgroundColor: colors.error },
    viewModeTabs: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    viewModeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    viewModeTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    viewModeTabText: { fontSize: 14, fontWeight: '500', color: colors.text },
    viewModeTabTextActive: { color: colors.background },
  });
}

export default function CashbackScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'] as CashbackColors;
  const themedStyles = getCashbackThemedStyles(colors);
  const { activeStore } = useStore(); // Get the currently selected store
  const [viewMode, setViewMode] = useState<ViewMode>('cashback');
  const [cashbackRequests, setCashbackRequests] = useState<CashbackRequest[]>([]);
  const [metrics, setMetrics] = useState<CashbackMetrics | null>(null);
  const [activeFilter, setActiveFilter] = useState<CashbackStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        if (__DEV__) logger.log('Fetching cashback data...');

        // Fetch metrics and requests in parallel
        const [metricsData, requestsData] = await Promise.all([
          cashbackService.getMetrics(),
          cashbackService.getCashbackRequests({
            status: activeFilter !== 'all' ? activeFilter : undefined,
            limit: 50,
            page: 1,
            sortBy: 'created',
            sortOrder: 'desc',
          }),
        ]);

        if (__DEV__) logger.log('Cashback data received', { metricsData, requestsData });

        setMetrics(metricsData);
        setCashbackRequests(requestsData.requests || []);
      } catch (error) {
        if (__DEV__) logger.error('Error fetching cashback data', error);
        showAlert('Error', 'Failed to load cashback data. Please try again.');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter]
  );

  // Initial load and re-fetch on screen focus
  const isFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      fetchData();
      return () => {
        isFocused.current = false;
      };
    }, [fetchData])
  );

  // M3 FIX: Re-fetch from server when filter tab changes (not client-side filter)
  const prevFilter = useRef(activeFilter);
  useEffect(() => {
    if (prevFilter.current !== activeFilter && isFocused.current) {
      prevFilter.current = activeFilter;
      fetchData();
    } else {
      prevFilter.current = activeFilter;
    }
  }, [activeFilter, fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleQuickAction = useCallback(
    async (requestId: string, action: 'approve' | 'reject') => {
      try {
        if (__DEV__) logger.log(`Processing cashback request ${action} for ${requestId}`);

        if (action === 'approve') {
          const request = cashbackRequests.find((r) => r.id === requestId);
          if (!request) {
            showAlert('Error', 'Request not found');
            return;
          }

          await cashbackService.approveCashbackRequest(requestId, {
            approvedAmount: request.requestedAmount,
          });
        } else {
          await cashbackService.rejectCashbackRequest(requestId, {
            rejectionReason: 'Quick rejection via mobile app',
          });
        }

        if (__DEV__) logger.log(`Cashback request ${action}d successfully`);
        await fetchData();
        showAlert('Success', `Cashback request ${action}d successfully`);
      } catch (error) {
        if (__DEV__) logger.error(`Error ${action}ing request`, error);
        showAlert('Error', `Failed to ${action} request. Please try again.`);
      }
    },
    [cashbackRequests, fetchData]
  );

  const generateSampleData = useCallback(async () => {
    try {
      if (__DEV__) logger.log('Generating sample cashback data...');
      await cashbackService.createSampleData();
      await fetchData();
      showAlert('Success', 'Sample cashback requests generated successfully');
    } catch (error) {
      if (__DEV__) logger.error('Error generating sample data', error);
      showAlert('Error', 'Failed to generate sample data. Please try again.');
    }
  }, [fetchData]);

  const getStatusColor = (status: CashbackStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      case 'paid':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 70) return colors.error;
    if (riskScore >= 40) return colors.warning;
    return colors.success;
  };

  const formatCurrency = (amount: number) => `₹${amount.toFixed(2)}`;
  const formatDate = (date: string | Date) => new Date(date).toLocaleDateString();

  // M3 FIX: server already filters by activeFilter, so cashbackRequests is the final list
  const statusTabs: Array<{ key: CashbackStatus | 'all'; label: string; count?: number }> = [
    { key: 'all', label: 'All', count: cashbackRequests.length },
    {
      key: 'pending',
      label: 'Pending',
      count: cashbackRequests.filter((r) => r.status === 'pending').length,
    },
    {
      key: 'approved',
      label: 'Approved',
      count: cashbackRequests.filter((r) => r.status === 'approved').length,
    },
    {
      key: 'paid',
      label: 'Paid',
      count: cashbackRequests.filter((r) => r.status === 'paid').length,
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: cashbackRequests.filter((r) => r.status === 'rejected').length,
    },
  ];

  if (isLoading && !refreshing) {
    return (
      <View style={[themedStyles.container, themedStyles.centered]}>
        <ThemedText>Loading cashback data...</ThemedText>
      </View>
    );
  }

  // If social media tab is selected, render SocialMediaPostsList
  if ((viewMode as string) === 'social_media') {
    return (
      <View style={themedStyles.container}>
        <ThemedView style={themedStyles.content}>
          <View style={themedStyles.header}>
            <View>
              <ThemedText type="title" style={themedStyles.title}>
                Cashback Management
              </ThemedText>
              <ThemedText style={themedStyles.subtitle}>
                Review and manage customer cashback requests
              </ThemedText>
            </View>
            <TouchableOpacity
              style={themedStyles.actionButton}
              onPress={() => router.push('/(cashback)/analytics')}
            >
              <Ionicons name="analytics" size={20} color={colors.background} />
            </TouchableOpacity>
          </View>

          {/* View Mode Tabs */}
          <View style={themedStyles.viewModeTabs}>
            <TouchableOpacity
              style={[
                themedStyles.viewModeTab,
                (viewMode as string) === 'cashback' && themedStyles.viewModeTabActive,
              ]}
              onPress={() => setViewMode('cashback')}
            >
              <Ionicons
                name="receipt-outline"
                size={18}
                color={(viewMode as string) === 'cashback' ? colors.background : colors.text}
              />
              <ThemedText
                style={[
                  themedStyles.viewModeTabText,
                  (viewMode as string) === 'cashback' && themedStyles.viewModeTabTextActive,
                ]}
              >
                Cashback Requests
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                themedStyles.viewModeTab,
                (viewMode as string) === 'social_media' && themedStyles.viewModeTabActive,
              ]}
              onPress={() => setViewMode('social_media')}
            >
              <Ionicons
                name="logo-instagram"
                size={18}
                color={(viewMode as string) === 'social_media' ? colors.background : colors.text}
              />
              <ThemedText
                style={[
                  themedStyles.viewModeTabText,
                  (viewMode as string) === 'social_media' && themedStyles.viewModeTabTextActive,
                ]}
              >
                Social Media
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Social Media Posts List */}
          <SocialMediaPostsList storeId={activeStore?._id} />
        </ThemedView>
      </View>
    );
  }

  return (
    <ScrollView
      style={themedStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <ThemedView style={themedStyles.content}>
        <View style={themedStyles.header}>
          <View>
            <ThemedText type="title" style={themedStyles.title}>
              Cashback Management
            </ThemedText>
            <ThemedText style={themedStyles.subtitle}>
              Review and manage customer cashback requests
            </ThemedText>
          </View>
          <TouchableOpacity
            style={themedStyles.actionButton}
            onPress={() => router.push('/(cashback)/analytics')}
          >
            <Ionicons name="analytics" size={20} color={Colors.light.background} />
          </TouchableOpacity>
        </View>

        {/* View Mode Tabs */}
        <View style={themedStyles.viewModeTabs}>
          <TouchableOpacity
            style={[
              themedStyles.viewModeTab,
              (viewMode as string) === 'cashback' && themedStyles.viewModeTabActive,
            ]}
            onPress={() => setViewMode('cashback')}
          >
            <Ionicons
              name="receipt-outline"
              size={18}
              color={
                (viewMode as string) === 'cashback' ? Colors.light.background : Colors.light.text
              }
            />
            <ThemedText
              style={[
                themedStyles.viewModeTabText,
                (viewMode as string) === 'cashback' && themedStyles.viewModeTabTextActive,
              ]}
            >
              Cashback Requests
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              themedStyles.viewModeTab,
              (viewMode as string) === 'social_media' && themedStyles.viewModeTabActive,
            ]}
            onPress={() => setViewMode('social_media')}
          >
            <Ionicons
              name="logo-instagram"
              size={18}
              color={
                (viewMode as string) === 'social_media'
                  ? Colors.light.background
                  : Colors.light.text
              }
            />
            <ThemedText
              style={[
                themedStyles.viewModeTabText,
                (viewMode as string) === 'social_media' && themedStyles.viewModeTabTextActive,
              ]}
            >
              Social Media
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Metrics Cards */}
        {metrics && (
          <View style={themedStyles.metricsContainer}>
            <View style={themedStyles.metricCard}>
              <ThemedText style={themedStyles.metricValue}>
                {metrics.totalPendingRequests}
              </ThemedText>
              <ThemedText style={themedStyles.metricLabel}>Pending</ThemedText>
            </View>
            <View style={themedStyles.metricCard}>
              <ThemedText style={themedStyles.metricValue}>
                {formatCurrency(metrics.totalPendingAmount)}
              </ThemedText>
              <ThemedText style={themedStyles.metricLabel}>Pending Amount</ThemedText>
            </View>
            <View style={themedStyles.metricCard}>
              <ThemedText style={[themedStyles.metricValue, { color: colors.error }]}>
                {metrics.highRiskRequests}
              </ThemedText>
              <ThemedText style={themedStyles.metricLabel}>High Risk</ThemedText>
            </View>
            <View style={themedStyles.metricCard}>
              <ThemedText style={[themedStyles.metricValue, { color: colors.success }]}>
                {metrics.autoApprovedToday}
              </ThemedText>
              <ThemedText style={themedStyles.metricLabel}>Auto Approved</ThemedText>
            </View>
          </View>
        )}

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={themedStyles.tabsContainer}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[themedStyles.tab, activeFilter === tab.key && themedStyles.activeTab]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <ThemedText
                style={[
                  themedStyles.tabText,
                  activeFilter === tab.key && themedStyles.activeTabText,
                ]}
              >
                {tab.label} {tab.count !== undefined && `(${tab.count})`}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={themedStyles.quickActions}>
          <TouchableOpacity style={themedStyles.quickActionButton} onPress={generateSampleData}>
            <Ionicons name="flask" size={16} color={colors.primary} />
            <ThemedText style={themedStyles.quickActionText}>Generate Sample Data</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={themedStyles.quickActionButton}
            onPress={() => router.push('/(cashback)/bulk-actions')}
          >
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <ThemedText style={themedStyles.quickActionText}>Bulk Actions</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Cashback Requests List */}
        <View style={themedStyles.requestsContainer}>
          {cashbackRequests.length === 0 ? (
            <View style={themedStyles.emptyState}>
              <Ionicons name="cash" size={48} color={colors.textSecondary} />
              <ThemedText style={themedStyles.emptyStateText}>
                No cashback requests found
              </ThemedText>
              <ThemedText style={themedStyles.emptyStateSubtext}>
                {activeFilter === 'all'
                  ? 'Generate sample data to get started'
                  : `No ${activeFilter} requests found`}
              </ThemedText>
            </View>
          ) : (
            cashbackRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={themedStyles.requestCard}
                onPress={() => router.push(`/(cashback)/${request.id}`)}
              >
                <View style={themedStyles.requestHeader}>
                  <View style={themedStyles.requestInfo}>
                    <ThemedText style={themedStyles.requestNumber}>
                      #{request.requestNumber}
                    </ThemedText>
                    <View style={themedStyles.statusBadge}>
                      <View
                        style={[
                          themedStyles.statusDot,
                          { backgroundColor: getStatusColor(request.status) },
                        ]}
                      />
                      <ThemedText
                        style={[themedStyles.statusText, { color: getStatusColor(request.status) }]}
                      >
                        {request.status.replace('_', ' ').toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={themedStyles.requestAmount}>
                    {formatCurrency(request.requestedAmount)}
                  </ThemedText>
                </View>

                <View style={themedStyles.requestDetails}>
                  <View style={themedStyles.customerInfo}>
                    <ThemedText style={themedStyles.customerName}>
                      {request.customer.name}
                    </ThemedText>
                    <ThemedText style={themedStyles.orderNumber}>
                      Order: {request.order.orderNumber}
                    </ThemedText>
                  </View>
                  <ThemedText style={themedStyles.requestDate}>
                    {formatDate(request.createdAt)}
                  </ThemedText>
                </View>

                <View style={themedStyles.requestFooter}>
                  <View style={themedStyles.riskIndicator}>
                    <View
                      style={[
                        themedStyles.riskDot,
                        { backgroundColor: getRiskColor(request.riskScore) },
                      ]}
                    />
                    <ThemedText style={themedStyles.riskText}>
                      Risk: {request.riskScore}/100
                    </ThemedText>
                    {request.flaggedForReview && (
                      <View style={themedStyles.flaggedBadge}>
                        <Ionicons name="flag" size={12} color={colors.error} />
                      </View>
                    )}
                  </View>

                  {request.status === 'pending' && (
                    <View style={themedStyles.quickActionButtons}>
                      <TouchableOpacity
                        style={[themedStyles.actionBtn, themedStyles.approveBtn]}
                        onPress={() => handleQuickAction(request.id, 'approve')}
                      >
                        <Ionicons name="checkmark" size={16} color={colors.background} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[themedStyles.actionBtn, themedStyles.rejectBtn]}
                        onPress={() => handleQuickAction(request.id, 'reject')}
                      >
                        <Ionicons name="close" size={16} color={colors.background} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}
