/**
 * CampaignROIScreen
 * Lists past campaigns with spend, revenue attributed, ROI%, coins given.
 * Uses marketing service API with fallback to legacy endpoint
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  getCampaigns,
  Campaign,
  formatCurrencyINR,
  calculateROI,
} from '@/services/api/marketingService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignROIItem {
  id: string;
  name: string;
  spend: number;
  revenueAttributed: number;
  roi: number;
  coinsGiven: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
}

interface CampaignROISummary {
  totalSpend: number;
  totalRevenue: number;
  overallROI: number;
  totalCoinsGiven: number;
  campaignCount: number;
}

interface CampaignROIResponse {
  campaigns: CampaignROIItem[];
  summary: CampaignROISummary;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number) => formatCurrencyINR(n);

const formatROI = (roi: number) => {
  const sign = roi >= 0 ? '+' : '';
  return `${sign}${roi.toFixed(1)}%`;
};

const roiColor = (roi: number) => (roi >= 0 ? '#10b981' : '#ef4444');

const statusColor = (status: string) => {
  switch (status) {
    case 'active':
      return '#10b981';
    case 'completed':
      return '#6366f1';
    default:
      return '#9ca3af';
  }
};

// Map Campaign from marketingService to CampaignROIItem
function mapCampaignToROIItem(campaign: Campaign): CampaignROIItem {
  return {
    id: campaign.id,
    name: campaign.name,
    spend: campaign.budgetSpent ?? campaign.budget ?? 0,
    revenueAttributed: campaign.revenueAttributed ?? 0,
    roi: campaign.roi ?? calculateROI(campaign.revenueAttributed ?? 0, campaign.budgetSpent ?? campaign.budget ?? 0),
    coinsGiven: 0, // Not available in Campaign type
    startDate: campaign.startDate ?? campaign.launchedAt ?? '',
    endDate: campaign.endDate ?? '',
    status: campaign.status === 'completed' ? 'completed' : campaign.status === 'active' ? 'active' : 'draft',
  };
}

// Calculate summary from campaigns
function calculateSummary(campaigns: CampaignROIItem[]): CampaignROISummary {
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenueAttributed, 0);
  const overallROI = calculateROI(totalRevenue, totalSpend);
  const totalCoinsGiven = campaigns.reduce((sum, c) => sum + c.coinsGiven, 0);

  return {
    totalSpend,
    totalRevenue,
    overallROI,
    totalCoinsGiven,
    campaignCount: campaigns.length,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CampaignROIScreen() {
  const [data, setData] = useState<CampaignROIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const merchantId = 'default'; // In production, get from auth context

      // Try marketing service first
      const result = await getCampaigns(merchantId);

      if (result.success && result.data && result.data.length > 0) {
        const roiItems = result.data.map(mapCampaignToROIItem);
        const summary = calculateSummary(roiItems);
        setData({ campaigns: roiItems, summary });
      } else {
        // Fallback to legacy endpoint
        const { apiClient } = await import('@/services/api/client');
        const res = await apiClient.get<CampaignROIResponse>('merchant/campaign-roi');
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setData({ campaigns: [], summary: calculateSummary([]) });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load campaign ROI data');
      setData({ campaigns: [], summary: calculateSummary([]) });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading campaign data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const summary = data?.summary;
  const campaigns = data?.campaigns ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
      >
        {/* Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overall Performance</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Spend</Text>
                <Text style={styles.summaryValue}>{formatCurrency(summary.totalSpend)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Revenue</Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  {formatCurrency(summary.totalRevenue)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>ROI</Text>
                <Text style={[styles.summaryValue, { color: roiColor(summary.overallROI) }]}>
                  {formatROI(summary.overallROI)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Coins Given</Text>
                <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
                  {summary.totalCoinsGiven.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Campaigns</Text>
                <Text style={styles.summaryValue}>{summary.campaignCount}</Text>
              </View>
              <View style={[styles.summaryDivider, { opacity: 0 }]} />
              <View style={styles.summaryItem} />
            </View>
          </View>
        )}

        {/* Campaign List */}
        <Text style={styles.sectionTitle}>Past Campaigns</Text>

        {campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptySubtitle}>Run your first campaign to see ROI data here.</Text>
          </View>
        ) : (
          campaigns.map((item) => (
            <View key={item.id} style={styles.campaignCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.campaignName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: `${statusColor(item.status)}20` }]}
                >
                  <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Ionicons name="cash-outline" size={16} color="#6b7280" />
                  <Text style={styles.metricLabel}>Spend</Text>
                  <Text style={styles.metricValue}>{formatCurrency(item.spend)}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="trending-up-outline" size={16} color="#10b981" />
                  <Text style={styles.metricLabel}>Revenue</Text>
                  <Text style={[styles.metricValue, { color: '#10b981' }]}>
                    {formatCurrency(item.revenueAttributed)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="analytics-outline" size={16} color={roiColor(item.roi)} />
                  <Text style={styles.metricLabel}>ROI</Text>
                  <Text style={[styles.metricValue, { color: roiColor(item.roi) }]}>
                    {formatROI(item.roi)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="sparkles-outline" size={16} color="#f59e0b" />
                  <Text style={styles.metricLabel}>Coins</Text>
                  <Text style={[styles.metricValue, { color: '#f59e0b' }]}>
                    {item.coinsGiven.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <Text style={styles.dateRange}>
                {item.startDate} &rarr; {item.endDate}
              </Text>
            </View>
          ))
        )}

        {/* Quick Nav to Simulator */}
        <TouchableOpacity
          style={styles.simulatorBanner}
          onPress={() => router.push('/campaigns/simulator')}
        >
          <View>
            <Text style={styles.simulatorBannerTitle}>Plan your next campaign</Text>
            <Text style={styles.simulatorBannerSub}>
              Use the simulator to forecast ROI before spending
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6366f1" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444', textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Summary
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#e5e7eb' },
  summaryLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  summaryValue: { fontSize: 17, fontWeight: '700', color: '#111827' },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },

  // Campaign Card
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  campaignName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  metricsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metricItem: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 2 },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  dateRange: { fontSize: 12, color: '#9ca3af' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', maxWidth: 260 },

  // Simulator Banner
  simulatorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  simulatorBannerTitle: { fontSize: 14, fontWeight: '700', color: '#4338ca' },
  simulatorBannerSub: { fontSize: 12, color: '#6366f1', marginTop: 2 },
});
