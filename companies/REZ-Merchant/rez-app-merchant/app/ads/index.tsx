/**
 * Ads Manager — List Screen
 * Lists all ad campaigns with summary analytics, filter tabs, and inline actions.
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import {
  AdCampaign,
  AdAnalytics,
  fetchAds,
  fetchAdAnalytics,
  submitAd,
  pauseAd,
  activateAd,
} from '@/services/api/adCampaigns';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'active' | 'pending_review' | 'draft' | 'rejected';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending_review', label: 'Pending' },
  { key: 'draft', label: 'Draft' },
  { key: 'rejected', label: 'Rejected' },
];

const PLACEMENT_COLORS: Record<AdCampaign['placement'], string> = {
  home_banner: '#7c3aed',
  explore_feed: '#0ea5e9',
  store_listing: '#10b981',
  search_result: '#f59e0b',
};

const PLACEMENT_LABELS: Record<AdCampaign['placement'], string> = {
  home_banner: 'Home Banner',
  explore_feed: 'Explore Feed',
  store_listing: 'Store Listing',
  search_result: 'Search Result',
};

const STATUS_COLORS: Record<AdCampaign['status'], { bg: string; text: string }> = {
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  pending_review: { bg: '#fef3c7', text: '#d97706' },
  active: { bg: '#d1fae5', text: '#059669' },
  paused: { bg: '#f3f4f6', text: '#6b7280' },
  rejected: { bg: '#fee2e2', text: '#dc2626' },
  completed: { bg: '#dbeafe', text: '#1d4ed8' },
};

const STATUS_LABELS: Record<AdCampaign['status'], string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  active: 'Active',
  paused: 'Paused',
  rejected: 'Rejected',
  completed: 'Completed',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
const fmtCoins = (n: number) => `${n.toLocaleString('en-IN')} coins`;

// ---------------------------------------------------------------------------
// Summary Bar
// ---------------------------------------------------------------------------

interface SummaryBarProps {
  analytics: AdAnalytics | null;
}

const SummaryBar = ({ analytics }: SummaryBarProps) => (
  <View style={styles.summaryBar}>
    <View style={styles.summaryItem}>
      <Ionicons name="eye-outline" size={18} color="#7c3aed" />
      <Text style={styles.summaryValue}>
        {analytics ? fmtNum(analytics.totalImpressions) : '—'}
      </Text>
      <Text style={styles.summaryLabel}>Impressions</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Ionicons name="finger-print-outline" size={18} color="#0ea5e9" />
      <Text style={styles.summaryValue}>{analytics ? fmtNum(analytics.totalClicks) : '—'}</Text>
      <Text style={styles.summaryLabel}>Clicks</Text>
    </View>
    <View style={styles.summaryDivider} />
    <View style={styles.summaryItem}>
      <Ionicons name="cash-outline" size={18} color="#f59e0b" />
      <Text style={styles.summaryValue}>{analytics ? fmtCoins(analytics.totalSpend) : '—'}</Text>
      <Text style={styles.summaryLabel}>Total Spend</Text>
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Ad Campaign Card
// ---------------------------------------------------------------------------

interface AdCardProps {
  ad: AdCampaign;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

const AdCard = ({ ad, expanded, onToggle, onRefresh }: AdCardProps) => {
  const [actionLoading, setActionLoading] = useState(false);
  const statusStyle = STATUS_COLORS[ad.status];
  const placementColor = PLACEMENT_COLORS[ad.placement];
  const spentPct = ad.totalBudget > 0 ? Math.min((ad.totalSpent / ad.totalBudget) * 100, 100) : 0;

  const doAction = async (label: string, fn: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await fn();
      onRefresh();
    } catch (err) {
      Alert.alert('Error', err.message || `Failed to ${label.toLowerCase()}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = () =>
    Alert.alert('Submit for Review', 'Submit this ad for review?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: () => doAction('Submit', () => submitAd(ad._id)) },
    ]);

  const handlePause = () => doAction('Pause', () => pauseAd(ad._id));
  const handleActivate = () => doAction('Activate', () => activateAd(ad._id));

  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.85}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {ad.title}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: placementColor + '22' }]}>
              <Text style={[styles.badgeText, { color: placementColor }]}>
                {PLACEMENT_LABELS[ad.placement]}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {STATUS_LABELS[ad.status]}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#9ca3af" />
      </View>

      {/* Spend & stats row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>{ad.bidType}</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.statText}>
          {fmtCoins(ad.totalSpent)} / {fmtCoins(ad.totalBudget)}
        </Text>
        <Text style={styles.statDot}>·</Text>
        <Ionicons name="eye-outline" size={12} color="#9ca3af" />
        <Text style={styles.statText}>{fmtNum(ad.impressions)}</Text>
        <Text style={styles.statDot}>·</Text>
        <Ionicons name="hand-left-outline" size={12} color="#9ca3af" />
        <Text style={styles.statText}>{fmtNum(ad.clicks)}</Text>
      </View>

      {/* Budget bar */}
      {ad.totalBudget > 0 && (
        <View style={styles.budgetTrack}>
          <View style={[styles.budgetFill, { width: spentPct > 0 ? `${spentPct}%` : 0 }]} />
        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />

          {ad.headline ? <Text style={styles.adHeadline}>{ad.headline}</Text> : null}
          {ad.description ? <Text style={styles.adDescription}>{ad.description}</Text> : null}

          {ad.status === 'rejected' && ad.rejectionReason && (
            <View style={styles.rejectionBox}>
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={styles.rejectionText}>{ad.rejectionReason}</Text>
            </View>
          )}

          {/* Action buttons */}
          {actionLoading ? (
            <ActivityIndicator size="small" color="#7c3aed" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.actionRow}>
              {(ad.status === 'draft' || ad.status === 'paused' || ad.status === 'rejected') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnOutline]}
                  onPress={() => router.push(`/ads/create?id=${ad._id}`)}
                >
                  <Ionicons name="create-outline" size={14} color="#7c3aed" />
                  <Text style={[styles.actionBtnText, { color: '#7c3aed' }]}>Edit</Text>
                </TouchableOpacity>
              )}
              {ad.status === 'draft' && (
                <TouchableOpacity style={styles.actionBtn} onPress={handleSubmit}>
                  <Ionicons name="send-outline" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Submit for Review</Text>
                </TouchableOpacity>
              )}
              {ad.status === 'active' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                  onPress={handlePause}
                >
                  <Ionicons name="pause-outline" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Pause</Text>
                </TouchableOpacity>
              )}
              {ad.status === 'paused' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                  onPress={handleActivate}
                >
                  <Ionicons name="play-outline" size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Activate</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AdsManagerScreen() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [adsData, analyticsData] = await Promise.all([fetchAds(), fetchAdAnalytics()]);
      setAds(adsData);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || 'Failed to load ads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const filteredAds = activeTab === 'all' ? ads : ads.filter((a) => a.status === activeTab);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading ads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && ads.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>Ads Manager</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              loadData();
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Screen header */}
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Ads Manager</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/ads/create')}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create Ad</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary analytics bar */}
        <SummaryBar analytics={analytics} />

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const count =
              tab.key === 'all' ? ads.length : ads.filter((a) => a.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => {
                  setActiveTab(tab.key);
                  setExpandedId(null);
                }}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Ad list */}
        {filteredAds.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No ads yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all'
                ? 'Create your first ad to start reaching customers.'
                : `No ${activeTab.replace('_', ' ')} ads found.`}
            </Text>
            {activeTab === 'all' && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/ads/create')}>
                <Text style={styles.emptyBtnText}>Create your first ad</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredAds.map((ad) => (
            <AdCard
              key={ad._id}
              ad={ad}
              expanded={expandedId === ad._id}
              onToggle={() => setExpandedId((prev) => (prev === ad._id ? null : ad._id))}
              onRefresh={loadData}
            />
          ))
        )}
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
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600' },

  // Screen header
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Summary bar
  summaryBar: {
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
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#9ca3af' },
  summaryDivider: { width: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },

  // Filter tabs
  tabsContainer: { paddingBottom: 12, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  tabText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },
  tabBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  tabBadgeTextActive: { color: '#fff' },

  // Card
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: { flex: 1, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statText: { fontSize: 12, color: '#6b7280' },
  statDot: { fontSize: 12, color: '#d1d5db' },

  // Budget bar
  budgetTrack: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  budgetFill: { height: '100%', backgroundColor: '#7c3aed', borderRadius: 2 },

  // Expanded section
  expandedSection: { marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginBottom: 12 },
  adHeadline: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  adDescription: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 8 },

  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  rejectionText: { fontSize: 12, color: '#dc2626', flex: 1, lineHeight: 17 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnOutline: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

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
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
