import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';
import { showAlert } from '@/utils/alert';
import { logger } from '@/utils/logger';

interface CampaignROI {
  campaignName: string;
  coinsDistributed: number;
  cost: number;
  revenue: number;
  roi: number;
  roiPercentage: number;
}

interface ROISummary {
  totalCoinsDistributed: number;
  totalCost: number;
  totalRevenue: number;
  overallROI: number;
  campaigns: CampaignROI[];
  recommendations: string[];
}

export default function CampaignROIScreen() {
  const { activeStore } = useStore();
  const [summary, setSummary] = useState<ROISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchROI = useCallback(async (showRefreshing = false) => {
    try {
      setError(false);
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const response = await apiClient.get<ROISummary>(
        `/merchant/campaign-roi${activeStore?._id ? `?storeId=${activeStore._id}` : ''}`
      );

      if (response.success && response.data) {
        const d = response.data as unknown as {
          totalCoinsDistributed?: number;
          totalCost?: number;
          totalRevenue?: number;
          overallROI?: number;
          campaigns?: CampaignROI[];
          recommendations?: string[];
          cashbackCost?: number;
          revenue?: number;
          roi?: number | string;
        };
        // Normalize backend shape to frontend ROISummary
        setSummary({
          totalCoinsDistributed: d.totalCoinsDistributed ?? 0,
          totalCost: d.totalCost ?? d.cashbackCost ?? 0,
          totalRevenue: d.totalRevenue ?? d.revenue ?? 0,
          overallROI: d.overallROI ?? (d.roi ? parseFloat(String(d.roi)) : 0),
          campaigns: d.campaigns ?? [],
          recommendations: d.recommendations ?? [],
        });
      } else {
        setError(true);
      }
    } catch (err) {
      if (__DEV__) console.error('Error fetching campaign ROI:', err);
      setError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchROI();
  }, [fetchROI]);

  const handleRefresh = () => {
    fetchROI(true);
  };

  const getROIColor = (roi: number): string => {
    if (roi >= 300) return Colors.light.success;
    if (roi >= 100) return Colors.light.warning;
    return Colors.light.error;
  };

  const renderProgressBar = (roi: number, maxROI: number = 600) => {
    const width = (Math.min(roi, maxROI) / maxROI) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${width}%`,
              backgroundColor: getROIColor(roi),
            },
          ]}
        />
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading ROI data...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Campaign ROI</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Last 30 days</ThemedText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {error && !summary && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.light.error} />
            <ThemedText style={styles.errorTitle}>Failed to load ROI data</ThemedText>
            <ThemedText style={styles.errorText}>
              Pull down to refresh or tap below to retry
            </ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchROI()}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        {summary && (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <ThemedText style={styles.summaryLabel}>Coins distributed</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {(summary.totalCoinsDistributed ?? 0).toLocaleString()}
                  </ThemedText>
                  <ThemedText style={styles.summarySubvalue}>
                    ₹{(summary.totalCost ?? 0).toLocaleString()} cost
                  </ThemedText>
                </View>
                <View style={styles.summaryCol}>
                  <ThemedText style={styles.summaryLabel}>Revenue attributed</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    ₹{(summary.totalRevenue ?? 0).toLocaleString()}
                  </ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.summaryRow,
                  {
                    marginTop: 16,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: Colors.light.border,
                  },
                ]}
              >
                <View style={styles.roiBox}>
                  <ThemedText style={styles.roiLabel}>Overall ROI</ThemedText>
                  <ThemedText style={[styles.roiValue, { color: getROIColor(summary.overallROI) }]}>
                    {summary.overallROI}%
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Per-Campaign Table */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Per-campaign breakdown</ThemedText>
              <View style={styles.tableHeader}>
                <ThemedText style={[styles.tableHeaderCell, { flex: 2 }]}>Campaign</ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { flex: 1 }]}>Coins</ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { flex: 1 }]}>Revenue</ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { flex: 1 }]}>ROI</ThemedText>
              </View>

              <FlatList
                data={summary.campaigns ?? []}
                renderItem={({ item }) => (
                  <View style={styles.tableRow}>
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <ThemedText style={styles.campaignName} numberOfLines={2}>
                        {item.campaignName}
                      </ThemedText>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <ThemedText style={styles.tableCellText}>
                        {item.coinsDistributed.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <ThemedText style={styles.tableCellText}>
                        ₹{item.revenue.toLocaleString()}
                      </ThemedText>
                    </View>
                    <View style={[styles.tableCell, { flex: 1 }]}>
                      <View
                        style={[
                          styles.roiBadge,
                          { backgroundColor: `${getROIColor(item.roiPercentage)}20` },
                        ]}
                      >
                        <ThemedText
                          style={[styles.roiBadgeText, { color: getROIColor(item.roiPercentage) }]}
                        >
                          {item.roiPercentage}%
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.campaignName}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>No campaigns yet</ThemedText>
                  </View>
                }
              />

              {/* Progress bars under table */}
              <View style={styles.progressSection}>
                {(summary.campaigns ?? []).map((campaign) => (
                  <View key={campaign.campaignName} style={styles.progressItem}>
                    <View style={styles.progressLabel}>
                      <ThemedText style={styles.progressName}>{campaign.campaignName}</ThemedText>
                      <ThemedText style={styles.progressValue}>
                        {campaign.roiPercentage}%
                      </ThemedText>
                    </View>
                    {renderProgressBar(campaign.roiPercentage)}
                  </View>
                ))}
              </View>
            </View>

            {/* Recommendations */}
            {(summary.recommendations ?? []).length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
                {(summary.recommendations ?? []).map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <Ionicons name="bulb" size={16} color={Colors.light.warning} />
                    <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.card,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: `${Colors.light.card}90`,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryCard: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summarySubvalue: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  roiBox: {
    flex: 1,
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  roiValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 6,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.icon,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  campaignName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  tableCellText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  roiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  roiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 12,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.card,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.light.icon,
  },
  progressSection: {
    marginTop: 16,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressName: {
    fontSize: 12,
    color: Colors.light.text,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${Colors.light.warning}30`,
    marginBottom: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
});
