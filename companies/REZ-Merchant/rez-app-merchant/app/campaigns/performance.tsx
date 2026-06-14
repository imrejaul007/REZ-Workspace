/**
 * Campaign Performance Screen
 *
 * Lists all campaigns from the marketing service API
 * Each card shows: name, type, status badge, budget, redemption count, launch date.
 * Tap a campaign to open a detail modal.
 * FAB navigates to the existing recommendations screen.
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
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  getCampaigns,
  getCampaignRecommendations,
  Campaign,
  formatCurrencyINR,
} from '@/services/api/marketingService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Using Campaign type from marketingService
// Extended to support legacy fields for backwards compatibility
type LegacyCampaign = Campaign & {
  _id?: string;
  title?: string;
  campaignType?: string;
  redemptionCount?: number;
  launchedAt?: string;
  rewardValue?: number;
  estimatedROI?: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) => formatCurrencyINR(n);

function getStatus(c: LegacyCampaign): 'active' | 'draft' | 'completed' {
  if (c.status === 'active' || c.status === 'paused' || c.status === 'scheduled') return 'active';
  if (c.status === 'completed') return 'completed';
  if (c.launchedAt || c.startDate) return 'active';
  return 'draft';
}

function statusColor(s: string): { bg: string; text: string } {
  switch (s) {
    case 'active':
      return { bg: '#d1fae5', text: '#059669' };
    case 'completed':
      return { bg: '#dbeafe', text: '#1d4ed8' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280' };
  }
}

function campaignId(c: LegacyCampaign): string {
  return c.id || (c as unknown)._id || String(Date.now());
}

function campaignTitle(c: LegacyCampaign): string {
  return c.name || (c as unknown).title || (c as unknown).campaignType || c.type || 'Campaign';
}

function campaignType(c: LegacyCampaign): string {
  return c.type || '—';
}

function totalBudget(c: LegacyCampaign): number {
  return c.budget ?? c.budgetCap ?? 0;
}

function launchDate(c: LegacyCampaign): string {
  if (!c.launchedAt && !c.startDate) return '—';
  const date = c.launchedAt || c.startDate;
  return new Date(date!).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Budget Progress Bar
// ---------------------------------------------------------------------------

interface BudgetBarProps {
  spent: number;
  total: number;
}

const BudgetBar = ({ spent, total }: BudgetBarProps) => {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  return (
    <View style={styles.budgetSection}>
      <View style={styles.budgetLabelRow}>
        <Text style={styles.budgetLabel}>Budget</Text>
        <Text style={styles.budgetValues}>
          {fmt(spent)} / {fmt(total)}
        </Text>
      </View>
      <View style={styles.budgetTrack}>
        <View style={[styles.budgetFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.budgetPct}>{pct.toFixed(0)}% used</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Campaign Card
// ---------------------------------------------------------------------------

interface CampaignCardProps {
  campaign: LegacyCampaign;
  onPress: () => void;
}

const CampaignCard = ({ campaign, onPress }: CampaignCardProps) => {
  const status = getStatus(campaign);
  const colors = statusColor(status);
  const spent = campaign.budgetSpent ?? 0;
  const total = totalBudget(campaign);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {campaignTitle(campaign)}
          </Text>
          <Text style={styles.cardType}>{campaignType(campaign)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Budget bar */}
      {total > 0 && <BudgetBar spent={spent} total={total} />}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="gift-outline" size={14} color="#9ca3af" />
          <Text style={styles.statText}>
            {campaign.redemptionCount !== undefined ? campaign.redemptionCount : '—'} redemptions
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.statText}>{launchDate(campaign)}</Text>
        </View>
      </View>

      <View style={styles.cardChevron}>
        <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Detail Modal
// ---------------------------------------------------------------------------

interface DetailModalProps {
  campaign: LegacyCampaign | null;
  onClose: () => void;
}

const DetailModal = ({ campaign, onClose }: DetailModalProps) => {
  if (!campaign) return null;
  const status = getStatus(campaign);
  const colors = statusColor(status);

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Type', value: campaignType(campaign) },
    { label: 'Status', value: status.charAt(0).toUpperCase() + status.slice(1) },
    { label: 'Target Segment', value: campaign.targetSegment || '—' },
    { label: 'Total Budget', value: totalBudget(campaign) > 0 ? fmt(totalBudget(campaign)) : '—' },
    {
      label: 'Budget Spent',
      value: campaign.budgetSpent !== undefined ? fmt(campaign.budgetSpent) : '—',
    },
    {
      label: 'Redemptions',
      value: campaign.redemptionCount !== undefined ? String(campaign.redemptionCount) : '—',
    },
    {
      label: 'Reward Value',
      value: campaign.rewardValue !== undefined ? String(campaign.rewardValue) : '—',
    },
    {
      label: 'Duration',
      value: campaign.durationDays !== undefined ? `${campaign.durationDays} days` : '—',
    },
    { label: 'Launch Date', value: launchDate(campaign) },
    {
      label: 'Est. ROI',
      value: campaign.estimatedROI !== undefined ? `${campaign.estimatedROI.toFixed(0)}%` : '—',
    },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {/* FE-M10 fix: stop propagation so tapping the sheet content doesn't dismiss the modal */}
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Title */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{campaignTitle(campaign)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Description */}
          {campaign.description && (
            <Text style={styles.modalDescription}>{campaign.description}</Text>
          )}

          {/* Detail rows */}
          <ScrollView style={styles.modalRows} showsVerticalScrollIndicator={false}>
            {rows.map((row) => (
              <View key={row.label} style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>{row.label}</Text>
                <Text style={styles.modalRowValue}>{row.value}</Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CampaignPerformanceScreen() {
  const [campaigns, setCampaigns] = useState<LegacyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LegacyCampaign | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setError(null);

      // Try to fetch from marketing service API first
      const merchantId = 'default'; // In production, get from auth context

      // Attempt to fetch campaigns from marketing service
      const campaignsResult = await getCampaigns(merchantId);
      if (campaignsResult.success && campaignsResult.data && campaignsResult.data.length > 0) {
        setCampaigns(campaignsResult.data as LegacyCampaign[]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fallback to recommendations endpoint
      const recommendationsResult = await getCampaignRecommendations(merchantId);
      if (recommendationsResult.success && recommendationsResult.data) {
        setCampaigns(recommendationsResult.data as LegacyCampaign[]);
      } else {
        // Final fallback to legacy endpoint for backwards compatibility
        const { apiClient } = await import('@/services/api/client');
        const res = await apiClient.get<unknown>('merchant/campaign-recommendations');
        if (res.success && res.data) {
          // Handle both array response and { recommendations } shape
          const raw = Array.isArray(res.data) ? res.data : (res.data.recommendations ?? []);
          setCampaigns(raw);
        } else {
          setCampaigns([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCampaigns();
    }, [fetchCampaigns])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading campaigns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchCampaigns();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary header */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{campaigns.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>
              {campaigns.filter((c) => getStatus(c) === 'active').length}
            </Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>
              {campaigns.filter((c) => getStatus(c) === 'completed').length}
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No campaigns yet</Text>
            <Text style={styles.emptySubtitle}>
              Launch your first campaign from the AI Recommendations screen.
            </Text>
          </View>
        ) : (
          campaigns.map((c) => (
            <CampaignCard key={campaignId(c)} campaign={c} onPress={() => setSelected(c)} />
          ))
        )}
      </ScrollView>

      {/* FAB — launch new campaign */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/campaigns/recommendations')}
        activeOpacity={0.85}
      >
        <Ionicons name="rocket" size={22} color="#fff" />
        <Text style={styles.fabText}>Launch New Campaign</Text>
      </TouchableOpacity>

      {/* Detail Modal */}
      <DetailModal campaign={selected} onClose={() => setSelected(null)} />
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
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Summary banner
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 24, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },

  // Campaign card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardType: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Budget
  budgetSection: { marginBottom: 12 },
  budgetLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  budgetLabel: { fontSize: 12, color: '#9ca3af' },
  budgetValues: { fontSize: 12, fontWeight: '600', color: '#374151' },
  budgetTrack: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  budgetFill: { height: '100%', backgroundColor: '#6366f1', borderRadius: 3 },
  budgetPct: { fontSize: 11, color: '#9ca3af' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, color: '#6b7280' },
  cardChevron: { position: 'absolute', right: 16, top: '50%' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },

  // Detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, marginRight: 10 },
  modalDescription: { fontSize: 13, color: '#6b7280', lineHeight: 19, marginBottom: 16 },
  modalRows: { maxHeight: 300 },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalRowLabel: { fontSize: 13, color: '#9ca3af' },
  modalRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    maxWidth: '55%',
    textAlign: 'right',
  },
  modalClose: {
    marginTop: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
