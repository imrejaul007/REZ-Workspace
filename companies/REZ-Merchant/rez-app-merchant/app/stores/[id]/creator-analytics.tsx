// Merchant Creator Analytics Page
// Shows pending picks for approval, history, and analytics

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import apiClient from '@/services/api';
import { showAlert } from '@/utils/alert';

// ============================================
// TYPES
// ============================================

interface PendingPick {
  id: string;
  title: string;
  description?: string;
  image?: string;
  videoUrl?: string;
  tags: string[];
  productName: string;
  productPrice: number;
  productImage?: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorTier?: string;
  createdAt: string;
}

interface CreatorPickStats {
  id: string;
  title: string;
  productName: string;
  productPrice: number;
  creatorName: string;
  creatorTier: string;
  views: number;
  clicks: number;
  purchases: number;
  revenue: number;
  commission: number;
  createdAt: string;
}

interface HistoryPick {
  id: string;
  title: string;
  productName: string;
  productPrice: number;
  creatorName: string;
  creatorAvatar?: string;
  merchantApprovalStatus: 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt: string;
  reward?: { type: string; amount: number } | null;
  status: string;
  createdAt: string;
}

interface StoreCreatorStats {
  totalPicks: number;
  uniqueCreators: number;
  totalViews: number;
  totalClicks: number;
  totalPurchases: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
  pendingPicks: number;
}

type TabType = 'pending' | 'history' | 'analytics';
type RewardType = 'none' | 'rez_coins' | 'branded_coins';

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CreatorAnalyticsPage() {
  const router = useRouter();
  const { id: storeId } = useLocalSearchParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StoreCreatorStats | null>(null);
  const [picks, setPicks] = useState<CreatorPickStats[]>([]);
  const [pendingPicks, setPendingPicks] = useState<PendingPick[]>([]);
  const [historyPicks, setHistoryPicks] = useState<HistoryPick[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Modal state
  const [approveModal, setApproveModal] = useState<PendingPick | null>(null);
  const [rejectModal, setRejectModal] = useState<PendingPick | null>(null);
  const [rewardType, setRewardType] = useState<RewardType>('none');
  const [rewardAmount, setRewardAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!storeId) return;

      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const [statsRes, picksRes, pendingRes, historyRes, walletRes] = await Promise.all([
          apiClient.get(`/merchant/stores/${storeId}/creator-stats`),
          apiClient.get(`/merchant/stores/${storeId}/creator-picks`, { params: { limit: 20 } }),
          apiClient.get(`/merchant/stores/${storeId}/pending-picks`, { params: { limit: 50 } }),
          apiClient.get(`/merchant/stores/${storeId}/pick-history`, { params: { limit: 50 } }),
          apiClient.get(`/merchant/wallet`).catch(() => null),
        ]);

        if (statsRes.success && statsRes.data) {
          const s = statsRes.data as StoreCreatorStats;
          setStats(s);
          setPendingCount(s.pendingPicks || 0);
        }
        if (picksRes.success && picksRes.data) {
          setPicks(((picksRes.data as unknown as { picks?: CreatorPickStats[] }).picks || []) as CreatorPickStats[]);
        }
        if (pendingRes.success && pendingRes.data) {
          setPendingPicks(((pendingRes.data as unknown as { picks?: PendingPick[] }).picks || []) as PendingPick[]);
        }
        if (historyRes?.success && historyRes.data) {
          setHistoryPicks(((historyRes.data as unknown as { picks?: HistoryPick[] }).picks || []) as HistoryPick[]);
        }
        if (walletRes?.success && walletRes.data) {
          const wb = (walletRes.data as unknown as { balance?: { available?: number; total?: number } | number }).balance;
          setWalletBalance(typeof wb === 'number' ? wb : wb?.available ?? wb?.total ?? null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [storeId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  // ============================================
  // APPROVE / REJECT ACTIONS
  // ============================================

  const handleApprove = async () => {
    if (!approveModal || !storeId) return;

    if (rewardType !== 'none' && (!rewardAmount || Number(rewardAmount) <= 0)) {
      showAlert('Invalid Amount', 'Please enter a valid reward amount.');
      return;
    }

    setActionLoading(true);
    try {
      const body: unknown = {};
      if (rewardType !== 'none') {
        body.rewardType = rewardType;
        body.rewardAmount = Number(rewardAmount);
      }

      const res = await apiClient.post(
        `/merchant/stores/${storeId}/picks/${approveModal.id}/approve`,
        body
      );

      if (res.success) {
        setPendingPicks((prev) => prev.filter((p) => p.id !== approveModal.id));
        setPendingCount((prev) => Math.max(0, prev - 1));
        setApproveModal(null);
        setRewardType('none');
        setRewardAmount('');
        showAlert('Pick Approved', 'The creator pick has been approved and sent for admin review.');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Failed to approve pick');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal || !storeId) return;

    if (!rejectReason.trim()) {
      showAlert('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/merchant/stores/${storeId}/picks/${rejectModal.id}/reject`,
        { reason: rejectReason.trim() }
      );

      if (res.success) {
        setPendingPicks((prev) => prev.filter((p) => p.id !== rejectModal.id));
        setPendingCount((prev) => Math.max(0, prev - 1));
        setRejectModal(null);
        setRejectReason('');
        showAlert('Pick Rejected', 'The creator has been notified.');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Failed to reject pick');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // LOADING / ERROR
  // ============================================

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header onBack={() => router.back()} pendingCount={0} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header onBack={() => router.back()} pendingCount={0} />
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================
  // TAB CONTENT RENDERERS
  // ============================================

  const renderPendingTab = () => (
    <View style={styles.tabContent}>
      {pendingPicks.length > 0 ? (
        pendingPicks.map((pick) => (
          <View key={pick.id} style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {pick.title}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name="person-outline" size={12} color="#8B5CF6" />
                    <Text style={styles.cardMetaText}>
                      {pick.creatorName}
                      {pick.creatorTier ? ` · ${pick.creatorTier}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.pendingBadge}>
                  <View style={styles.pendingDot} />
                  <Text style={styles.pendingBadgeText}>Pending</Text>
                </View>
              </View>

              <View style={styles.productRow}>
                <View style={styles.productChip}>
                  <Ionicons name="cube-outline" size={13} color="#6B7280" />
                  <Text style={styles.productChipText} numberOfLines={1}>
                    {pick.productName}
                  </Text>
                </View>
                <Text style={styles.productPrice}>₹{pick.productPrice}</Text>
              </View>

              {pick.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {pick.description}
                </Text>
              ) : null}

              {/* Media preview — creator upload + product image */}
              <View style={styles.mediaPreviewRow}>
                {/* Product catalog image */}
                {pick.productImage ? (
                  <View style={styles.mediaThumbnail}>
                    <Image
                      source={{ uri: pick.productImage }}
                      style={styles.mediaThumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.mediaBadge, { backgroundColor: '#6B7280' }]}>
                      <Text style={{ fontSize: 7, color: '#FFF', fontWeight: '700' }}>PRODUCT</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.mediaThumbnail}>
                    <View
                      style={[
                        styles.mediaThumbnailImage,
                        { justifyContent: 'center', alignItems: 'center' },
                      ]}
                    >
                      <Ionicons name="cube-outline" size={22} color="#9CA3AF" />
                    </View>
                  </View>
                )}

                {/* Creator's uploaded photo */}
                {pick.image && (
                  <TouchableOpacity
                    style={styles.mediaThumbnail}
                    onPress={() => pick.image && Linking.openURL(pick.image)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: pick.image }}
                      style={styles.mediaThumbnailImage}
                      resizeMode="cover"
                    />
                    <View style={styles.mediaBadge}>
                      <Ionicons name="image" size={10} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Creator's uploaded video */}
                {pick.videoUrl && (
                  <TouchableOpacity
                    style={styles.mediaThumbnail}
                    onPress={() => pick.videoUrl && Linking.openURL(pick.videoUrl)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.mediaThumbnailImage,
                        {
                          backgroundColor: '#1F2937',
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Ionicons name="play-circle" size={28} color="#FFFFFF" />
                    </View>
                    <View style={[styles.mediaBadge, { backgroundColor: '#EF4444' }]}>
                      <Ionicons name="videocam" size={10} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                )}

                {pick.image || pick.videoUrl ? (
                  <Text style={styles.mediaHint}>Tap to preview</Text>
                ) : (
                  <Text style={styles.mediaHint}>No media uploaded</Text>
                )}
              </View>

              {pick.tags && pick.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {pick.tags.slice(0, 4).map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  <Ionicons name="time-outline" size={11} color="#9CA3AF" />{' '}
                  {new Date(pick.createdAt).toLocaleDateString()}
                </Text>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => {
                      setRejectModal(pick);
                      setRejectReason('');
                    }}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => {
                      setApproveModal(pick);
                      setRewardType('none');
                      setRewardAmount('');
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark-done" size={32} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>
            No pending creator picks to review. New picks will appear here when creators link your
            products.
          </Text>
        </View>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {historyPicks.length > 0 ? (
        historyPicks.map((pick) => {
          const isApproved = pick.merchantApprovalStatus === 'approved';
          return (
            <View key={pick.id} style={styles.card}>
              <View
                style={[styles.cardAccent, { backgroundColor: isApproved ? '#10B981' : '#EF4444' }]}
              />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {pick.title}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="person-outline" size={12} color="#8B5CF6" />
                      <Text style={styles.cardMetaText}>
                        {pick.creatorName} · {pick.productName}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isApproved ? styles.statusApproved : styles.statusRejected,
                    ]}
                  >
                    <Ionicons
                      name={isApproved ? 'checkmark-circle' : 'close-circle'}
                      size={12}
                      color={isApproved ? '#16A34A' : '#EF4444'}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isApproved ? '#16A34A' : '#EF4444' },
                      ]}
                    >
                      {isApproved ? 'Approved' : 'Rejected'}
                    </Text>
                  </View>
                </View>

                {pick.rejectionReason ? (
                  <View style={styles.reasonBanner}>
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color="#B91C1C" />
                    <Text style={styles.reasonBannerText} numberOfLines={2}>
                      {pick.rejectionReason}
                    </Text>
                  </View>
                ) : null}

                {pick.reward && pick.reward.amount > 0 ? (
                  <View style={styles.rewardBanner}>
                    <Ionicons name="gift" size={13} color="#7C3AED" />
                    <Text style={styles.rewardBannerText}>
                      Rewarded {pick.reward.amount}{' '}
                      {pick.reward.type === 'branded_coins' ? 'branded' : 'ReZ'} coins
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.cardDate}>
                  <Ionicons name="time-outline" size={11} color="#9CA3AF" /> Reviewed{' '}
                  {pick.reviewedAt ? new Date(pick.reviewedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="time" size={32} color="#6366F1" />
          </View>
          <Text style={styles.emptyTitle}>No Review History</Text>
          <Text style={styles.emptySubtitle}>
            Your past approval and rejection decisions will appear here.
          </Text>
        </View>
      )}
    </View>
  );

  const renderAnalyticsTab = () => (
    <>
      {/* Quick Stats */}
      <View style={styles.statsRow}>
        {[
          {
            label: 'Creators',
            value: stats?.uniqueCreators || 0,
            icon: 'people' as const,
            color: '#7C3AED',
            bg: '#F5F3FF',
          },
          {
            label: 'Picks',
            value: stats?.totalPicks || 0,
            icon: 'star' as const,
            color: '#3B82F6',
            bg: '#EFF6FF',
          },
          {
            label: 'Sales',
            value: stats?.totalPurchases || 0,
            icon: 'cart' as const,
            color: '#10B981',
            bg: '#ECFDF5',
          },
          {
            label: 'Conv.',
            value: `${stats?.conversionRate || 0}%`,
            icon: 'trending-up' as const,
            color: '#F59E0B',
            bg: '#FFFBEB',
          },
        ].map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <View style={[styles.statIcon, { backgroundColor: `${s.color}20` }]}>
              <Ionicons name={s.icon} size={16} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>
              {typeof s.value === 'number' ? formatCount(s.value) : s.value}
            </Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Revenue Card */}
      <LinearGradient
        colors={['#1a3a52', '#2d5a7b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.revenueCard}
      >
        <View style={styles.revenueHeader}>
          <Ionicons name="analytics" size={18} color="rgba(255,255,255,0.8)" />
          <Text style={styles.revenueTitle}>Creator-Attributed Revenue</Text>
        </View>
        <View style={styles.revenueGrid}>
          {[
            {
              label: 'Views',
              value: formatCount(stats?.totalViews || 0),
              icon: 'eye-outline' as const,
            },
            {
              label: 'Clicks',
              value: formatCount(stats?.totalClicks || 0),
              icon: 'hand-left-outline' as const,
            },
            {
              label: 'Revenue',
              value: `₹${formatCount(stats?.totalRevenue || 0)}`,
              icon: 'cash-outline' as const,
            },
          ].map((item, i) => (
            <View key={i} style={styles.revenueItem}>
              <Ionicons name={item.icon} size={16} color="rgba(255,255,255,0.6)" />
              <Text style={styles.revenueValue}>{item.value}</Text>
              <Text style={styles.revenueLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.commissionRow}>
          <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.commissionText}>
            Commission paid: {formatCount(stats?.totalCommission || 0)} coins
          </Text>
        </View>
      </LinearGradient>

      {/* Picks List */}
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Active Picks ({picks.length})</Text>
        {picks.length > 0 ? (
          picks.map((pick) => (
            <View key={pick.id} style={styles.analyticsCard}>
              <View style={styles.analyticsCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {pick.title}
                  </Text>
                  <Text style={styles.analyticsCreator}>
                    {pick.creatorName}
                    {pick.creatorTier ? ` · ${pick.creatorTier}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                {[
                  { label: 'Views', value: formatCount(pick.views), color: '#6B7280' },
                  { label: 'Clicks', value: formatCount(pick.clicks), color: '#6B7280' },
                  { label: 'Sales', value: String(pick.purchases), color: '#6B7280' },
                  { label: 'Revenue', value: `₹${formatCount(pick.revenue)}`, color: '#16A34A' },
                ].map((m, i) => (
                  <View key={i} style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                    <Text style={styles.metricLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="sparkles" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>No Active Picks</Text>
            <Text style={styles.emptySubtitle}>
              When creators recommend your products, their picks and performance will appear here.
            </Text>
          </View>
        )}
      </View>
    </>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header onBack={() => router.back()} pendingCount={pendingCount} />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'pending' as TabType, label: 'Pending', count: pendingCount },
          { key: 'history' as TabType, label: 'History', count: 0 },
          { key: 'analytics' as TabType, label: 'Analytics', count: 0 },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabPillText, activeTab === tab.key && styles.tabPillTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text
                  style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
      >
        {activeTab === 'pending'
          ? renderPendingTab()
          : activeTab === 'history'
            ? renderHistoryTab()
            : renderAnalyticsTab()}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ======== APPROVE MODAL ======== */}
      <Modal visible={!!approveModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setApproveModal(null)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              </View>
              <Text style={styles.modalTitle}>Approve Pick</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setApproveModal(null)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalPickInfo}>
              <Text style={styles.modalPickTitle} numberOfLines={2}>
                {approveModal?.title}
              </Text>
              <Text style={styles.modalSubtext}>
                by {approveModal?.creatorName} · {approveModal?.productName}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.modalSectionLabel}>Reward Creator (Optional)</Text>

            {walletBalance !== null && (
              <View style={styles.walletBanner}>
                <Ionicons name="wallet" size={16} color="#7C3AED" />
                <Text style={styles.walletBannerText}>
                  Available:{' '}
                  <Text style={{ fontWeight: '700' }}>{formatCount(walletBalance)} coins</Text>
                </Text>
              </View>
            )}

            <View style={styles.rewardOptions}>
              {(['none', 'rez_coins', 'branded_coins'] as RewardType[]).map((type) => {
                const active = rewardType === type;
                const labels = {
                  none: 'No Reward',
                  rez_coins: 'ReZ Coins',
                  branded_coins: 'Branded Coins',
                };
                const icons = {
                  none: 'remove-circle-outline' as const,
                  rez_coins: 'flash' as const,
                  branded_coins: 'diamond' as const,
                };
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.rewardOption, active && styles.rewardOptionActive]}
                    onPress={() => setRewardType(type)}
                  >
                    <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                      {active && <View style={styles.radioInner} />}
                    </View>
                    <Ionicons name={icons[type]} size={16} color={active ? '#7C3AED' : '#9CA3AF'} />
                    <Text
                      style={[styles.rewardOptionText, active && styles.rewardOptionTextActive]}
                    >
                      {labels[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {rewardType !== 'none' && (
              <View style={styles.amountRow}>
                <Ionicons name="cash-outline" size={18} color="#7C3AED" />
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={rewardAmount}
                  onChangeText={setRewardAmount}
                />
                <Text style={styles.amountUnit}>coins</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setApproveModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalApproveBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.modalActionText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======== REJECT MODAL ======== */}
      <Modal visible={!!rejectModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setRejectModal(null)}
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>Reject Pick</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setRejectModal(null)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalPickInfo}>
              <Text style={styles.modalPickTitle} numberOfLines={2}>
                {rejectModal?.title}
              </Text>
              <Text style={styles.modalSubtext}>
                by {rejectModal?.creatorName} · {rejectModal?.productName}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.modalSectionLabel}>Reason for Rejection *</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="e.g., Product not from our store, Inaccurate description..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRejectModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRejectBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="close" size={18} color="#FFF" />
                    <Text style={styles.modalActionText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ============================================
// HEADER
// ============================================

function Header({ onBack, pendingCount }: { onBack: () => void; pendingCount: number }) {
  return (
    <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={headerStyles.header}>
      <View style={headerStyles.row}>
        <TouchableOpacity style={headerStyles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={headerStyles.title}>Creator Picks</Text>
          {pendingCount > 0 && (
            <Text style={headerStyles.subtitle}>
              {pendingCount} pick{pendingCount !== 1 ? 's' : ''} awaiting your review
            </Text>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const headerStyles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  errorMessage: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#1a3a52',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // Tab Bar — pill style
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#1a3a52',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },

  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  // Cards — unified with left accent
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardAccent: {
    width: 4,
    backgroundColor: '#F59E0B',
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardDesc: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  mediaPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mediaThumbnail: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaThumbnailImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  mediaBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    padding: 2,
  },
  mediaHint: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Product row
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    marginRight: 8,
  },
  productChipText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  // Pending badge
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },

  // Status badges (history)
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusApproved: { backgroundColor: '#ECFDF5' },
  statusRejected: { backgroundColor: '#FEF2F2' },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },

  // History banners
  reasonBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FECACA',
  },
  reasonBannerText: { fontSize: 12, color: '#991B1B', flex: 1, lineHeight: 16 },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#C4B5FD',
  },
  rewardBannerText: { fontSize: 12, color: '#6D28D9', fontWeight: '500' },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#6B7280' },

  // Action buttons (in card)
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  approveBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // Analytics stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500', marginTop: 2 },

  // Revenue card
  revenueCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 18,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  revenueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  revenueGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  revenueValue: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  revenueLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commissionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Analytics pick cards
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyticsCardTop: {
    marginBottom: 10,
  },
  analyticsCreator: { fontSize: 12, color: '#6B7280', marginTop: 3 },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  metricLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPickInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  modalPickTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 4 },
  modalSubtext: { fontSize: 13, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  modalSectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },

  // Wallet banner
  walletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  walletBannerText: { fontSize: 13, color: '#6D28D9' },

  // Reward options
  rewardOptions: { gap: 8, marginBottom: 12 },
  rewardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  rewardOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#FAF5FF',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#7C3AED',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  rewardOptionText: { fontSize: 14, color: '#6B7280' },
  rewardOptionTextActive: { color: '#7C3AED', fontWeight: '600' },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  amountUnit: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },

  reasonInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    marginBottom: 16,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalApproveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalRejectBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalActionText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
