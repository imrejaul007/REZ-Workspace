/**
 * Promote Hub — unified entry point for Campaigns (broadcasts) + In-App Ads.
 * Delegates all detail/creation work to the existing marketing.tsx and ads screens.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { AdCampaign, AdAnalytics, fetchAds, fetchAdAnalytics } from '@/services/api/adCampaigns';

// ── Types ──────────────────────────────────────────────────────────────────────
type HubTab = 'campaigns' | 'ads' | 'adbazaar';
interface Campaign {
  _id: string;
  name: string;
  channel: string;
  status: string;
  stats?: { sent?: number };
}
interface AdBazaarBooking {
  id: string;
  listingTitle: string;
  category: string;
  status: string;
  amount: number;
  totalScans: number;
  startDate: string;
  endDate?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, { icon: string; color: string }> = {
  push: { icon: 'notifications', color: '#7c3aed' },
  whatsapp: { icon: 'logo-whatsapp', color: '#25D366' },
  sms: { icon: 'chatbubble', color: '#007aff' },
  email: { icon: 'mail', color: '#ea4335' },
  in_app: { icon: 'phone-portrait', color: '#ff9500' },
};
const CAM_STATUS: Record<string, { bg: string; text: string }> = {
  sent: { bg: '#d1fae5', text: '#059669' },
  active: { bg: '#d1fae5', text: '#059669' },
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  pending_review: { bg: '#fef3c7', text: '#d97706' },
  failed: { bg: '#fee2e2', text: '#dc2626' },
};
const AD_STATUS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#d1fae5', text: '#059669' },
  draft: { bg: '#f3f4f6', text: '#6b7280' },
  pending_review: { bg: '#fef3c7', text: '#d97706' },
  rejected: { bg: '#fee2e2', text: '#dc2626' },
  paused: { bg: '#f3f4f6', text: '#6b7280' },
  completed: { bg: '#dbeafe', text: '#1d4ed8' },
};
const PLACEMENT_COLORS: Record<string, string> = {
  home_banner: '#7c3aed',
  explore_feed: '#0ea5e9',
  store_listing: '#10b981',
  search_result: '#f59e0b',
};
const PLACEMENT_LABELS: Record<string, string> = {
  home_banner: 'Home Banner',
  explore_feed: 'Explore Feed',
  store_listing: 'Store Listing',
  search_result: 'Search Result',
};

const fmtNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
const fmtCoins = (n: number) => `${n.toLocaleString('en-IN')} coins`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

function parseBroadcasts(raw: unknown): Campaign[] {
  if (!raw || typeof raw !== 'object') return [];
  const r = raw as unknown as { data?: unknown; broadcasts?: unknown; items?: unknown };
  const list = r.data ?? r.broadcasts ?? r.items;
  if (Array.isArray(list)) return list;
  if (Array.isArray(raw)) return raw as Campaign[];
  return [];
}

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  iconColor,
  label,
  value,
  loading,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  loading: boolean;
}) => (
  <View style={s.statCard}>
    <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
    {loading ? (
      <ActivityIndicator size="small" color={iconColor} style={{ marginTop: 6 }} />
    ) : (
      <Text style={s.statValue}>{value}</Text>
    )}
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const SectionError = ({ msg, onRetry }: { msg: string; onRetry: () => void }) => (
  <View style={s.sectionError}>
    <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
    <Text style={s.sectionErrorText}>{msg}</Text>
    <TouchableOpacity onPress={onRetry} style={s.retryInline}>
      <Text style={s.retryInlineText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function PromoteScreen() {
  const [activeTab, setActiveTab] = useState<HubTab>('campaigns');
  const [modalVisible, setModalVisible] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [camLoading, setCamLoading] = useState(true);
  const [camError, setCamError] = useState(false);
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [analytics, setAnalytics] = useState<AdAnalytics | null>(null);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsError, setAdsError] = useState(false);
  const [adBazaarData, setAdBazaarData] = useState<{
    activeBookings: number;
    totalScans: number;
    revenueAttributed: number;
    recentBookings: AdBazaarBooking[];
  } | null>(null);
  const [adBazaarLoading, setAdBazaarLoading] = useState(true);
  const [adBazaarError, setAdBazaarError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setCamError(false);
    try {
      const res = await apiClient.get('/merchant/broadcasts', { params: { limit: 5, page: 1 } });
      setCampaigns(parseBroadcasts(res?.data ?? res).slice(0, 5));
    } catch {
      setCamError(true);
    } finally {
      setCamLoading(false);
    }
  }, []);

  const loadAds = useCallback(async () => {
    setAdsError(false);
    try {
      const [adsData, analyticsData] = await Promise.all([fetchAds(), fetchAdAnalytics()]);
      setAds(adsData.slice(0, 5));
      setAnalytics(analyticsData);
    } catch {
      setAdsError(true);
    } finally {
      setAdsLoading(false);
    }
  }, []);

  const loadAdBazaar = useCallback(async () => {
    setAdBazaarError(false);
    try {
      const res = await apiClient.get('/merchant/adbazaar-summary');
      setAdBazaarData(res?.data ?? res);
    } catch {
      setAdBazaarError(true);
    } finally {
      setAdBazaarLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setCamLoading(true);
    setAdsLoading(true);
    setAdBazaarLoading(true);
    await Promise.all([loadCampaigns(), loadAds(), loadAdBazaar()]);
    setRefreshing(false);
  }, [loadCampaigns, loadAds, loadAdBazaar]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const reach = campaigns.reduce((sum, c) => sum + (c.stats?.sent ?? 0), 0);
  const adViews = analytics?.totalImpressions ?? 0;
  const spend = analytics?.totalSpend ?? 0;
  const stLoading = camLoading || adsLoading;

  const closeAndPush = (path: string) => {
    setModalVisible(false);
    router.push(path);
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Promote</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
      >
        {/* Stats */}
        <Text style={s.sectionLabel}>This Month</Text>
        <View style={s.statRow}>
          <StatCard
            icon="people-outline"
            iconColor="#7c3aed"
            label="Reach"
            value={fmtNum(reach)}
            loading={stLoading}
          />
          <StatCard
            icon="eye-outline"
            iconColor="#0ea5e9"
            label="Ad Views"
            value={fmtNum(adViews)}
            loading={stLoading}
          />
          <StatCard
            icon="qr-code-outline"
            iconColor="#10b981"
            label="QR Scans"
            value={fmtNum(adBazaarData?.totalScans ?? 0)}
            loading={stLoading || adBazaarLoading}
          />
        </View>

        {/* Tabs */}
        <View style={s.tabBar}>
          {(['campaigns', 'ads', 'adbazaar'] as HubTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>
                {tab === 'campaigns' ? 'Campaigns' : tab === 'ads' ? 'In-App Ads' : 'AdBazaar'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campaigns list */}
        {activeTab === 'campaigns' && (
          <View style={s.section}>
            {camLoading ? (
              <ActivityIndicator color="#7c3aed" style={{ marginVertical: 24 }} />
            ) : camError ? (
              <SectionError
                msg="Could not load campaigns"
                onRetry={() => {
                  setCamLoading(true);
                  loadCampaigns();
                }}
              />
            ) : campaigns.length === 0 ? (
              <Text style={s.emptyText}>No campaigns yet.</Text>
            ) : (
              campaigns.map((item) => {
                const ch = CHANNEL_ICONS[item.channel] ?? { icon: 'megaphone', color: '#6b7280' };
                const st = CAM_STATUS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
                return (
                  <View key={item._id} style={s.row}>
                    <View style={[s.rowIcon, { backgroundColor: ch.color + '1a' }]}>
                      <Ionicons name={ch.icon as unknown as keyof typeof Ionicons.glyphMap} size={16} color={ch.color} />
                    </View>
                    <View style={s.rowBody}>
                      <Text style={s.rowTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={s.rowSub}>
                        {cap(item.channel)} · {item.stats?.sent ?? 0} sent
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                      <Text style={[s.badgeText, { color: st.text }]}>{cap(item.status)}</Text>
                    </View>
                  </View>
                );
              })
            )}
            <TouchableOpacity
              style={s.viewAll}
              onPress={() => router.push('/(dashboard)/marketing')}
            >
              <Text style={s.viewAllText}>View all campaigns</Text>
              <Ionicons name="arrow-forward" size={14} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        )}

        {/* Ads list */}
        {activeTab === 'ads' && (
          <View style={s.section}>
            {adsLoading ? (
              <ActivityIndicator color="#7c3aed" style={{ marginVertical: 24 }} />
            ) : adsError ? (
              <SectionError
                msg="Could not load ads"
                onRetry={() => {
                  setAdsLoading(true);
                  loadAds();
                }}
              />
            ) : ads.length === 0 ? (
              <Text style={s.emptyText}>No ads yet.</Text>
            ) : (
              ads.map((item) => {
                const st = AD_STATUS[item.status] ?? { bg: '#f3f4f6', text: '#6b7280' };
                const pc = PLACEMENT_COLORS[item.placement] ?? '#6b7280';
                return (
                  <View key={item._id} style={s.row}>
                    <View style={[s.rowIcon, { backgroundColor: pc + '1a' }]}>
                      <Ionicons name="megaphone-outline" size={16} color={pc} />
                    </View>
                    <View style={s.rowBody}>
                      <Text style={s.rowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={s.rowSub}>
                        {PLACEMENT_LABELS[item.placement] ?? item.placement} ·{' '}
                        {fmtNum(item.impressions)} views · {fmtNum(item.clicks)} clicks
                      </Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                      <Text style={[s.badgeText, { color: st.text }]}>{cap(item.status)}</Text>
                    </View>
                  </View>
                );
              })
            )}
            <TouchableOpacity style={s.viewAll} onPress={() => router.push('/ads')}>
              <Text style={s.viewAllText}>View all ads</Text>
              <Ionicons name="arrow-forward" size={14} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        )}

        {/* AdBazaar tab */}
        {activeTab === 'adbazaar' && (
          <View>
            {/* Summary cards row */}
            <View style={s.abSummaryRow}>
              <View style={s.abSummaryCard}>
                <Text style={s.abSummaryValue}>{adBazaarData?.activeBookings ?? 0}</Text>
                <Text style={s.abSummaryLabel}>Active Bookings</Text>
              </View>
              <View style={s.abSummaryCard}>
                <Text style={s.abSummaryValue}>{fmtNum(adBazaarData?.totalScans ?? 0)}</Text>
                <Text style={s.abSummaryLabel}>QR Scans</Text>
              </View>
              <View style={s.abSummaryCard}>
                <Text style={[s.abSummaryValue, { color: '#10b981' }]}>
                  ₹{((adBazaarData?.revenueAttributed ?? 0) / 100).toFixed(0)}
                </Text>
                <Text style={s.abSummaryLabel}>Revenue</Text>
              </View>
            </View>

            {/* Recent bookings section */}
            <View style={s.section}>
              {adBazaarLoading ? (
                <ActivityIndicator color="#10b981" style={{ marginVertical: 24 }} />
              ) : adBazaarError ? (
                <SectionError
                  msg="Could not load AdBazaar data"
                  onRetry={() => {
                    setAdBazaarLoading(true);
                    loadAdBazaar();
                  }}
                />
              ) : !adBazaarData?.recentBookings?.length ? (
                <View style={s.abEmptyState}>
                  <Text style={s.abEmptyIcon}>🏙</Text>
                  <Text style={s.abEmptyTitle}>No AdBazaar bookings yet</Text>
                  <Text style={s.abEmptySub}>
                    Book billboards, auto rickshaws, influencers & more
                  </Text>
                  <TouchableOpacity
                    style={s.abBrowseBtn}
                    onPress={() => Linking.openURL('https://adbazaar.in')}
                  >
                    <Text style={s.abBrowseBtnText}>Browse Ad Inventory</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                adBazaarData.recentBookings.map((b) => (
                  <View key={b.id} style={s.row}>
                    <View style={[s.rowIcon, { backgroundColor: '#f0fdf4' }]}>
                      <Ionicons name="storefront-outline" size={16} color="#10b981" />
                    </View>
                    <View style={s.rowBody}>
                      <Text style={s.rowTitle} numberOfLines={1}>
                        {b.listingTitle}
                      </Text>
                      <Text style={s.rowSub}>
                        {b.category} · {b.totalScans} scans
                      </Text>
                    </View>
                    <View
                      style={[
                        s.badge,
                        { backgroundColor: b.status === 'completed' ? '#d1fae5' : '#fef3c7' },
                      ]}
                    >
                      <Text
                        style={[
                          s.badgeText,
                          { color: b.status === 'completed' ? '#059669' : '#d97706' },
                        ]}
                      >
                        {cap(b.status)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
              <TouchableOpacity
                style={s.viewAll}
                onPress={() => Linking.openURL('https://adbazaar.in/buyer/bookings')}
              >
                <Text style={s.viewAllText}>View all on AdBazaar</Text>
                <Ionicons name="open-outline" size={14} color="#7c3aed" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* New — bottom sheet modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>What would you like to create?</Text>

            <TouchableOpacity
              style={s.optCard}
              onPress={() => closeAndPush('/(dashboard)/marketing')}
            >
              <View style={[s.optIcon, { backgroundColor: '#ede9fe' }]}>
                <Text style={s.optEmoji}>📢</Text>
              </View>
              <View style={s.optBody}>
                <Text style={s.optTitle}>Send a Campaign</Text>
                <Text style={s.optSub}>Reach customers via WhatsApp, push, SMS</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={s.optCard} onPress={() => closeAndPush('/ads/create')}>
              <View style={[s.optIcon, { backgroundColor: '#fef3c7' }]}>
                <Text style={s.optEmoji}>🎯</Text>
              </View>
              <View style={s.optBody}>
                <Text style={s.optTitle}>Create an In-App Ad</Text>
                <Text style={s.optSub}>Show a visual ad inside the REZ app</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.optCard}
              onPress={() => {
                setModalVisible(false);
                Linking.openURL('https://adbazaar.in/marketplace/browse');
              }}
            >
              <View style={[s.optIcon, { backgroundColor: '#f0fdf4' }]}>
                <Text style={s.optEmoji}>🏙</Text>
              </View>
              <View style={s.optBody}>
                <Text style={s.optTitle}>Book Ad Space</Text>
                <Text style={s.optSub}>
                  Billboards, autos, influencers, TV screens & 88+ formats
                </Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9ca3af', textAlign: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabBtnTextActive: { fontWeight: '700', color: '#111827' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  rowSub: { fontSize: 12, color: '#9ca3af' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewAllText: { fontSize: 14, fontWeight: '600', color: '#7c3aed' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: 24 },
  sectionError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#fff5f5',
  },
  sectionErrorText: { flex: 1, fontSize: 13, color: '#ef4444' },
  retryInline: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fecaca',
    borderRadius: 6,
  },
  retryInlineText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  optIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optEmoji: { fontSize: 22 },
  optBody: { flex: 1 },
  optTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  optSub: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  cancelBtn: {
    marginTop: 6,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  abSummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  abSummaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  abSummaryValue: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 2 },
  abSummaryLabel: { fontSize: 10, color: '#9ca3af', textAlign: 'center' },
  abEmptyState: { alignItems: 'center', padding: 28 },
  abEmptyIcon: { fontSize: 40, marginBottom: 10 },
  abEmptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  abEmptySub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  abBrowseBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  abBrowseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
