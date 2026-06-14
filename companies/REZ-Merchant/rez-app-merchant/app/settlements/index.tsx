import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  settlementService,
  SettlementRecord,
  SettlementSummary,
  SettlementListResponse,
} from '@/services/api/settlements';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Colors } from '@/constants/Colors';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending_settlement', label: 'Pending' },
  { key: 'settled', label: 'Settled' },
  { key: 'disputed', label: 'Disputed' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#DBEAFE', text: '#2563EB' },
  pending_settlement: { bg: Colors.light.warningLight, text: Colors.light.warning },
  settled: { bg: Colors.light.successLight, text: Colors.light.success },
  disputed: { bg: Colors.light.errorLight, text: Colors.light.error },
  void: { bg: '#F3F4F6', text: '#6B7280' },
};

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  branded_coin_award: 'Branded Coins',
  bonus_campaign: 'Bonus Campaign',
  deal_redemption: 'Deal Redemption',
  creator_reward: 'Creator Reward',
};

function formatCycleId(cycleId: string): string {
  // Monthly: "2026-03" → "March 2026"
  if (/^\d{4}-\d{2}$/.test(cycleId)) {
    const [y, m] = cycleId.split('-').map(Number);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[m - 1]} ${y}`;
  }
  // Weekly: "2026-W11" → "Week 11, 2026"
  if (/^\d{4}-W\d{2}$/.test(cycleId)) {
    const [y, w] = cycleId.split('-W');
    return `Week ${parseInt(w, 10)}, ${y}`;
  }
  // Daily: "2026-03-16" → "16 Mar 2026"
  if (/^\d{4}-\d{2}-\d{2}$/.test(cycleId)) {
    const d = new Date(cycleId);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (cycleId === 'instant') return 'Instant';
  return cycleId;
}

export default function SettlementHistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [instantSettlementLoading, setInstantSettlementLoading] = useState(false);
  const LIMIT = 20;

  const loadRecords = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (!append) setLoading(true);
        const result: SettlementListResponse = await settlementService.getSettlements({
          page: pageNum,
          limit: LIMIT,
          status: activeTab !== 'all' ? activeTab : undefined,
        });
        const nextRecords = Array.isArray(result.records) ? result.records : [];
        if (append) {
          setRecords((prev) => [...(Array.isArray(prev) ? prev : []), ...nextRecords]);
        } else {
          setRecords(nextRecords);
        }
        setPage(pageNum);
        setHasMore(Boolean(result.pagination?.hasNextPage));
      } catch (error) {
        logger.error('Failed to load settlements:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  const loadSummary = useCallback(async () => {
    const data = await settlementService.getSummary();
    if (data) setSummary(data);
  }, []);

  useEffect(() => {
    setPage(1);
    loadRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecords(1);
    loadSummary();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      loadRecords(page + 1, true);
    }
  };

  const handleDownload = async (cycleId: string) => {
    try {
      const url = settlementService.getPayoutStatementUrl(cycleId);
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.error('Download failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleInstantSettlement = async () => {
    setInstantSettlementLoading(true);
    try {
      const res = await apiClient.post('merchant/liability/instant');
      if (res.success) {
        platformAlertSimple(
          'Settlement Requested',
          res.message || 'Instant settlement request submitted successfully.'
        );
        loadRecords(1, false);
      } else {
        platformAlertSimple('Failed', res.message || 'Failed to process instant settlement');
      }
    } catch (error) {
      logger.error('Instant settlement error:', error);
      platformAlertSimple('Error', error?.message || 'Error processing instant settlement');
    } finally {
      setInstantSettlementLoading(false);
    }
  };

  const renderSummary = () => {
    if (!summary) return null;
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.light.successLight }]}>
            <Text style={[styles.statValue, { color: Colors.light.success }]}>
              {summary.totalSettled.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.light.success }]}>Settled</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.light.warningLight }]}>
            <Text style={[styles.statValue, { color: Colors.light.warning }]}>
              {summary.totalPending.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors.light.warning }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{summary.settledCount}</Text>
            <Text style={[styles.statLabel, { color: '#2563EB' }]}>Cycles</Text>
          </View>
        </View>

        {/* Instant Settlement Button */}
        {summary.totalPending > 0 && (
          <TouchableOpacity
            style={styles.instantSettlementButton}
            onPress={handleInstantSettlement}
            disabled={instantSettlementLoading}
          >
            <Ionicons name="flash" size={18} color="#FFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.instantSettlementButtonText}>
                {instantSettlementLoading ? 'Processing...' : 'Instant Settlement'}
              </Text>
              <Text style={styles.instantSettlementButtonSubtext}>
                Pending: ₹{summary.totalPending.toFixed(0)} • Small processing fee applies
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* GST Summary */}
        {summary.gst.totalGst > 0 && (
          <View style={styles.gstCard}>
            <View style={styles.gstHeader}>
              <Ionicons name="receipt-outline" size={16} color="#6B7280" />
              <Text style={styles.gstTitle}>GST Summary (on Platform Fees)</Text>
            </View>
            {/* TS-H2 fix: gst sub-object may be absent from API response */}
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>CGST (9%)</Text>
              <Text style={styles.gstValue}>{summary.gst?.cgst?.toFixed(2) ?? '0.00'}</Text>
            </View>
            <View style={styles.gstRow}>
              <Text style={styles.gstLabel}>SGST (9%)</Text>
              <Text style={styles.gstValue}>{summary.gst?.sgst?.toFixed(2) ?? '0.00'}</Text>
            </View>
            <View style={[styles.gstRow, styles.gstTotalRow]}>
              <Text style={styles.gstTotalLabel}>Total GST</Text>
              <Text style={styles.gstTotalValue}>
                {summary.gst?.totalGst?.toFixed(2) ?? '0.00'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSettlementItem = useCallback(
    ({ item }: { item: SettlementRecord }) => {
      const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.void;
      const storeName = typeof item.store === 'object' ? item.store.name : 'Store';
      const isExpanded = expandedId === item._id;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => setExpandedId(isExpanded ? null : item._id)}
          activeOpacity={0.7}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cycleText}>{formatCycleId(item.cycleId)}</Text>
              <Text style={styles.storeText}>{storeName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {CAMPAIGN_TYPE_LABELS[item.campaignType] || item.campaignType}
            </Text>
          </View>

          {/* Amounts row */}
          <View style={styles.amountsRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Issued</Text>
              <Text style={styles.amountValue}>{item.rewardIssued.toFixed(2)}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Redeemed</Text>
              <Text style={styles.amountValue}>{item.rewardRedeemed.toFixed(2)}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Settled</Text>
              <Text style={[styles.amountValue, { color: Colors.light.success }]}>
                {item.settledAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Pending</Text>
              <Text style={[styles.amountValue, { color: Colors.light.warning }]}>
                {item.pendingAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Expanded details */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              {item.settlementDate && (
                <Text style={styles.detailText}>Settled on: {formatDate(item.settlementDate)}</Text>
              )}
              <Text style={styles.detailText}>
                Transactions: {item.issuanceCount} issued, {item.redemptionCount} redeemed
              </Text>
              <Text style={styles.detailText}>Currency: {item.currency}</Text>

              {/* Download button */}
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownload(item.cycleId)}
              >
                <Ionicons name="download-outline" size={16} color="#fff" />
                <Text style={styles.downloadBtnText}>Download Payout Statement</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expand indicator */}
          <View style={styles.expandIndicator}>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      );
    },
    [expandedId]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlement History</Text>
      </View>

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Settlement List */}
      <FlatList
        data={records}
        keyExtractor={(item) => item._id}
        renderItem={renderSettlementItem}
        ListHeaderComponent={renderSummary}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.tint}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No settlements found</Text>
              <Text style={styles.emptySubtitle}>
                Your settlement history will appear here once orders are processed
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.light.tint} />
            </View>
          ) : null
        }
      />

      {loading && records.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },

  tabsContainer: {
    maxHeight: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContent: { paddingHorizontal: 12, alignItems: 'center', gap: 6 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabActive: { backgroundColor: Colors.light.tint },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  listContent: { padding: 16, paddingBottom: 100 },

  // Summary
  summaryContainer: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  gstCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gstHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  gstTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  gstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gstLabel: { fontSize: 13, color: '#6B7280' },
  gstValue: { fontSize: 13, fontWeight: '500', color: '#111' },
  gstTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
    paddingTop: 8,
  },
  gstTotalLabel: { fontSize: 13, fontWeight: '700', color: '#111' },
  gstTotalValue: { fontSize: 13, fontWeight: '700', color: '#111' },

  // Settlement card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cycleText: { fontSize: 15, fontWeight: '700', color: '#111' },
  storeText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600' },

  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  typeText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },

  amountsRow: { flexDirection: 'row', gap: 8 },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  amountValue: { fontSize: 13, fontWeight: '600', color: '#111' },

  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailText: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  expandIndicator: { alignItems: 'center', marginTop: 6 },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  footerLoader: { paddingVertical: 20, alignItems: 'center' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  instantSettlementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFA500',
    borderRadius: 10,
    marginTop: 16,
  },
  instantSettlementButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  instantSettlementButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
});
