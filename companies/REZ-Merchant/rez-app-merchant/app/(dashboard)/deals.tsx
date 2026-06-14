import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '@/utils/alert';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import {
  dealRedemptionsService,
  DealRedemption,
  RedemptionStats,
  VerifyCodeResponse,
} from '@/services/api/dealRedemptions';
import { useStore } from '@/contexts/StoreContext';
import { useRouter } from 'expo-router';
import { logger } from '@/utils/logger';

type ViewMode = 'scanner' | 'list' | 'stats';
type RedemptionStatus = 'all' | 'active' | 'used' | 'expired' | 'cancelled';

const FILTER_TABS: { key: RedemptionStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'used', label: 'Used' },
  { key: 'expired', label: 'Expired' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_STATS: RedemptionStats = {
  today: { total: 0, used: 0, pending: 0 },
  thisWeek: { total: 0, used: 0, pending: 0 },
  thisMonth: { total: 0, used: 0, pending: 0 },
  totalRevenue: 0,
  topDeals: [],
};

const EMPTY_LIST_STATS = {
  total: 0,
  active: 0,
  used: 0,
  expired: 0,
  pending: 0,
  cancelled: 0,
};

const normalizeStats = (value: RedemptionStats | null | undefined): RedemptionStats | null => {
  if (!value) return null;

  return {
    today: {
      total: value.today?.total ?? 0,
      used: value.today?.used ?? 0,
      pending: value.today?.pending ?? 0,
    },
    thisWeek: {
      total: value.thisWeek?.total ?? 0,
      used: value.thisWeek?.used ?? 0,
      pending: value.thisWeek?.pending ?? 0,
    },
    thisMonth: {
      total: value.thisMonth?.total ?? 0,
      used: value.thisMonth?.used ?? 0,
      pending: value.thisMonth?.pending ?? 0,
    },
    totalRevenue: value.totalRevenue ?? 0,
    topDeals: Array.isArray(value.topDeals) ? value.topDeals : [],
  };
};

const normalizeListStats = (
  value:
    | {
        total?: number;
        active?: number;
        used?: number;
        expired?: number;
        pending?: number;
        cancelled?: number;
      }
    | null
    | undefined
) => ({
  total: value?.total ?? 0,
  active: value?.active ?? 0,
  used: value?.used ?? 0,
  expired: value?.expired ?? 0,
  pending: value?.pending ?? 0,
  cancelled: value?.cancelled ?? 0,
});

export default function DealsScreen() {
  const { activeStore } = useStore();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [redemptions, setRedemptions] = useState<DealRedemption[]>([]);
  const [stats, setStats] = useState<RedemptionStats | null>(null);
  const [listStats, setListStats] = useState(EMPTY_LIST_STATS);
  const [activeFilter, setActiveFilter] = useState<RedemptionStatus>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Scanner state
  const [codeInput, setCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyCodeResponse | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  // Monotonic version counter for fetchData. Rapid filter clicks fire multiple
  // requests; without this guard a slower earlier response can overwrite a
  // faster later one and the user sees stale data for the wrong filter.
  const fetchVersionRef = useRef(0);

  // Load data based on view mode
  const fetchData = useCallback(
    async (showRefreshing = false) => {
      const myVersion = ++fetchVersionRef.current;
      const isStale = () => myVersion !== fetchVersionRef.current;

      try {
        if (showRefreshing) setRefreshing(true);
        else setIsLoading(true);

        if (viewMode === 'list') {
          // Use allSettled so a stats failure doesn't drop the redemptions list
          // (and vice versa). Each result is applied independently.
          const [redemptionsResult, statsResult] = await Promise.allSettled([
            dealRedemptionsService.getRedemptions({
              storeId: activeStore?._id,
              status: activeFilter !== 'all' ? activeFilter : undefined,
              limit: 50,
              page: 1,
            }),
            dealRedemptionsService.getStats(activeStore?._id),
          ]);

          if (isStale()) return;

          if (redemptionsResult.status === 'fulfilled') {
            const data = redemptionsResult.value;
            setRedemptions(Array.isArray(data?.redemptions) ? data.redemptions : []);
            setListStats(normalizeListStats(data?.stats));
          } else if (__DEV__) {
            logger.error('getRedemptions failed:', redemptionsResult.reason);
          }

          if (statsResult.status === 'fulfilled') {
            setStats(normalizeStats(statsResult.value) ?? EMPTY_STATS);
          } else if (__DEV__) {
            logger.error('getStats failed:', statsResult.reason);
          }

          // Only show an error if BOTH calls failed — otherwise the user has
          // partial but useful data on screen.
          if (redemptionsResult.status === 'rejected' && statsResult.status === 'rejected') {
            showAlert('Error', 'Failed to load data. Please try again.');
          }
        } else if (viewMode === 'stats') {
          const statsData = await dealRedemptionsService.getStats(activeStore?._id);
          if (isStale()) return;
          setStats(normalizeStats(statsData) ?? EMPTY_STATS);
        }
      } catch (error) {
        if (isStale()) return;
        if (__DEV__) logger.error('Error fetching deal data:', error);
        showAlert('Error', 'Failed to load data. Please try again.');
      } finally {
        if (!isStale()) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [viewMode, activeFilter, activeStore?._id]
  );

  // Fetch data when viewMode or activeFilter changes, with try-catch
  const handleFetchWithRefresh = useCallback(async () => {
    try {
      await fetchData();
    } catch (error) {
      if (__DEV__) logger.error('Error in handleFetchWithRefresh:', error);
    }
  }, [fetchData]);

  useEffect(() => {
    if (viewMode !== 'scanner') {
      handleFetchWithRefresh();
    }
  }, [viewMode, activeFilter, handleFetchWithRefresh]);

  const handleRefresh = () => {
    fetchData(true);
  };

  // Verify code
  const handleVerifyCode = async () => {
    if (!codeInput.trim()) {
      showAlert('Error', 'Please enter a redemption code');
      return;
    }

    try {
      setIsVerifying(true);
      const result = await dealRedemptionsService.verifyCode(codeInput.trim());
      setVerifyResult(result);
      setShowResultModal(true);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  // Mark code as used
  const handleMarkAsUsed = async () => {
    if (!verifyResult?.redemption || !activeStore) {
      showAlert('Error', 'No active store selected');
      return;
    }

    try {
      setIsMarking(true);
      await dealRedemptionsService.useCode(verifyResult.redemption.code, {
        storeId: activeStore._id,
      });

      showAlert('Success', 'Deal redeemed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowResultModal(false);
            setVerifyResult(null);
            setCodeInput('');
          },
        },
      ]);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to mark code as used');
    } finally {
      setIsMarking(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return dealRedemptionsService.getStatusInfo(status);
  };

  const safeRedemptions = Array.isArray(redemptions) ? redemptions : [];
  const safeStats = normalizeStats(stats);

  const formatDate = (date?: string) => {
    if (!date) return 'Not available';

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return 'Not available';
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render scanner view
  const renderScanner = () => (
    <View style={styles.scannerContainer}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.indigo]}
        style={styles.scannerHeader}
      >
        <Ionicons name="qr-code" size={48} color="white" />
        <ThemedText style={styles.scannerTitle}>Verify Deal Code</ThemedText>
        <ThemedText style={styles.scannerSubtitle}>
          Enter the customer's redemption code to verify and apply the deal
        </ThemedText>
      </LinearGradient>

      <View style={styles.inputContainer}>
        <View style={styles.codeInputWrapper}>
          <Ionicons
            name="ticket-outline"
            size={24}
            color={Colors.light.primary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.codeInput}
            placeholder="Enter code (e.g., RZ-XXXXXXXX)"
            placeholderTextColor={Colors.light.textMuted}
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {codeInput.length > 0 && (
            <TouchableOpacity onPress={() => setCodeInput('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.light.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleVerifyCode}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <ThemedText style={styles.verifyButtonText}>Verify Code</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.instructionsCard}>
        <ThemedText style={styles.instructionsTitle}>How it works</ThemedText>
        <View style={styles.instructionRow}>
          <View style={styles.instructionNumber}>
            <ThemedText style={styles.instructionNumberText}>1</ThemedText>
          </View>
          <ThemedText style={styles.instructionText}>Ask customer for their deal code</ThemedText>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.instructionNumber}>
            <ThemedText style={styles.instructionNumberText}>2</ThemedText>
          </View>
          <ThemedText style={styles.instructionText}>Enter the code above to verify</ThemedText>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.instructionNumber}>
            <ThemedText style={styles.instructionNumberText}>3</ThemedText>
          </View>
          <ThemedText style={styles.instructionText}>Apply the benefit and mark as used</ThemedText>
        </View>
      </View>
    </View>
  );

  // Resolve count for a given filter without an inline ternary chain
  const countFor = (status: RedemptionStatus): number => {
    switch (status) {
      case 'all':
        return listStats.total;
      case 'active':
        return listStats.active;
      case 'used':
        return listStats.used;
      case 'expired':
        return listStats.expired;
      case 'cancelled':
        return listStats.cancelled;
    }
  };

  // Render list view
  const renderList = () => (
    <View style={styles.listContainer}>
      {/* Inline filter chips — count and label on a single line. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScroll}
      >
        {FILTER_TABS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.85}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setActiveFilter(key)}
            >
              <ThemedText style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {label}
              </ThemedText>
              <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                <ThemedText style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                  {countFor(key)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Redemptions list */}
      <ScrollView
        style={styles.redemptionsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : safeRedemptions.length === 0 ? (
          <View style={styles.emptyState}>
            {/* Layered ring + ticket illustration */}
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyRingOuter} />
              <View style={styles.emptyRingInner} />
              <View style={styles.emptyIconWrap}>
                <Ionicons name="ticket-outline" size={32} color="#7C3AED" />
              </View>
            </View>
            <ThemedText style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No redemptions yet' : `No ${activeFilter} codes`}
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              {activeFilter === 'all'
                ? `When customers redeem deals at ${activeStore?.name || 'your store'}, they'll appear here.`
                : `You have no ${activeFilter} redemptions right now. Switch tabs to see other statuses.`}
            </ThemedText>
            <TouchableOpacity
              style={styles.emptyAction}
              activeOpacity={0.9}
              onPress={() => setViewMode('scanner')}
            >
              <Ionicons name="scan-outline" size={18} color="white" />
              <ThemedText style={styles.emptyActionText}>Verify a code</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          safeRedemptions.map((redemption) => {
            const statusInfo = getStatusInfo(redemption.status);
            return (
              <View key={redemption.id} style={styles.redemptionCard}>
                <View style={styles.redemptionHeader}>
                  <View style={styles.codeContainer}>
                    <ThemedText style={styles.redemptionCode}>{redemption.code}</ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                      <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.userName}>
                    {redemption.user?.name ?? 'Unknown customer'}
                  </ThemedText>
                </View>

                <View style={styles.redemptionDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="pricetag" size={16} color={Colors.light.primary} />
                    <ThemedText style={styles.detailText}>
                      {redemption.campaignSnapshot?.title ?? 'Untitled campaign'}
                    </ThemedText>
                  </View>
                  {redemption.dealSnapshot?.cashback && (
                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={16} color={Colors.light.success} />
                      <ThemedText style={styles.detailText}>
                        {redemption.dealSnapshot.cashback} cashback
                      </ThemedText>
                    </View>
                  )}
                  {redemption.dealSnapshot?.discount && (
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetags" size={16} color={Colors.light.warning} />
                      <ThemedText style={styles.detailText}>
                        {redemption.dealSnapshot.discount} discount
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.redemptionFooter}>
                  <ThemedText style={styles.dateText}>
                    Issued: {formatDate(redemption.redeemedAt || redemption.createdAt)}
                  </ThemedText>
                  {redemption.usedAt && (
                    <ThemedText style={styles.dateText}>
                      Used: {formatDate(redemption.usedAt)}
                    </ThemedText>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  // Render stats view
  const renderStats = () => (
    <ScrollView
      style={styles.statsContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : safeStats ? (
        <>
          {/* Period stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statPeriod}>Today</ThemedText>
              <ThemedText style={styles.statValue}>{safeStats.today.total}</ThemedText>
              <View style={styles.statBreakdown}>
                <ThemedText style={styles.statBreakdownText}>
                  {safeStats.today.used} used • {safeStats.today.pending} pending
                </ThemedText>
              </View>
            </View>

            <View style={styles.statCard}>
              <ThemedText style={styles.statPeriod}>This Week</ThemedText>
              <ThemedText style={styles.statValue}>{safeStats.thisWeek.total}</ThemedText>
              <View style={styles.statBreakdown}>
                <ThemedText style={styles.statBreakdownText}>
                  {safeStats.thisWeek.used} used • {safeStats.thisWeek.pending} pending
                </ThemedText>
              </View>
            </View>

            <View style={styles.statCard}>
              <ThemedText style={styles.statPeriod}>This Month</ThemedText>
              <ThemedText style={styles.statValue}>{safeStats.thisMonth.total}</ThemedText>
              <View style={styles.statBreakdown}>
                <ThemedText style={styles.statBreakdownText}>
                  {safeStats.thisMonth.used} used • {safeStats.thisMonth.pending} pending
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Revenue card */}
          <View style={styles.revenueCard}>
            <LinearGradient
              colors={[Colors.light.success, '#059669']}
              style={styles.revenueGradient}
            >
              <Ionicons name="cash" size={32} color="white" />
              <View style={styles.revenueContent}>
                <ThemedText style={styles.revenueLabel}>Total Revenue from Paid Deals</ThemedText>
                <ThemedText style={styles.revenueValue}>
                  ₹{safeStats.totalRevenue.toLocaleString()}
                </ThemedText>
              </View>
            </LinearGradient>
          </View>

          {/* Top deals */}
          {safeStats.topDeals.length > 0 && (
            <View style={styles.topDealsCard}>
              <ThemedText style={styles.topDealsTitle}>Top Performing Deals</ThemedText>
              {safeStats.topDeals.map((deal, index) => (
                <View key={index} style={styles.topDealRow}>
                  <View style={styles.topDealRank}>
                    <ThemedText style={styles.topDealRankText}>#{index + 1}</ThemedText>
                  </View>
                  <ThemedText style={styles.topDealName} numberOfLines={1}>
                    {deal.campaign}
                  </ThemedText>
                  <ThemedText style={styles.topDealCount}>
                    {deal.redemptions} redemptions
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart" size={48} color={Colors.light.textMuted} />
          <ThemedText style={styles.emptyText}>No stats available</ThemedText>
        </View>
      )}
    </ScrollView>
  );

  // Result modal
  const renderResultModal = () => (
    <Modal
      visible={showResultModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowResultModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setShowResultModal(false)}>
            <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>

          {verifyResult?.valid ? (
            <>
              <View style={styles.validHeader}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.light.success} />
                <ThemedText style={styles.validTitle}>Valid Code!</ThemedText>
              </View>

              <View style={styles.redemptionInfo}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Code</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {verifyResult.redemption?.code ?? '—'}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Campaign</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {verifyResult.redemption?.campaignSnapshot?.title ?? 'Untitled campaign'}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Customer</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {verifyResult.redemption?.user?.name ?? 'Customer'}
                  </ThemedText>
                </View>
                {/* Prominent Reward Preview */}
                {(verifyResult.redemption?.dealSnapshot?.cashback ||
                  verifyResult.redemption?.dealSnapshot?.discount) && (
                  <View
                    style={{
                      backgroundColor: '#ECFDF5',
                      borderRadius: 12,
                      padding: 14,
                      marginVertical: 8,
                      borderWidth: 1,
                      borderColor: '#D1FAE5',
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 11,
                        color: '#065F46',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Customer Reward
                    </ThemedText>
                    {verifyResult.redemption?.dealSnapshot?.cashback && (
                      <ThemedText
                        style={{ fontSize: 20, fontWeight: '800', color: '#10B981', marginTop: 4 }}
                      >
                        {verifyResult.redemption.dealSnapshot.cashback} cashback
                      </ThemedText>
                    )}
                    {verifyResult.redemption?.dealSnapshot?.discount && (
                      <ThemedText
                        style={{ fontSize: 20, fontWeight: '800', color: '#F59E0B', marginTop: 4 }}
                      >
                        {verifyResult.redemption.dealSnapshot.discount} discount
                      </ThemedText>
                    )}
                  </View>
                )}
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Expires</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {formatDate(verifyResult.redemption?.expiresAt || '')}
                  </ThemedText>
                </View>
              </View>

              {Array.isArray(verifyResult.redemption?.campaignSnapshot?.terms) &&
                (verifyResult.redemption?.campaignSnapshot?.terms?.length ?? 0) > 0 && (
                  <View style={styles.termsSection}>
                    <ThemedText style={styles.termsTitle}>Terms & Conditions</ThemedText>
                    {(verifyResult.redemption?.campaignSnapshot?.terms ?? []).map((term, i) => (
                      <ThemedText key={i} style={styles.termText}>
                        • {term}
                      </ThemedText>
                    ))}
                  </View>
                )}

              <TouchableOpacity
                style={[styles.markUsedButton, isMarking && styles.markUsedButtonDisabled]}
                onPress={handleMarkAsUsed}
                disabled={isMarking}
              >
                {isMarking ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={24} color="white" />
                    <ThemedText style={styles.markUsedButtonText}>Mark as Used</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.invalidHeader}>
                <Ionicons name="close-circle" size={64} color={Colors.light.error} />
                <ThemedText style={styles.invalidTitle}>Invalid Code</ThemedText>
                <ThemedText style={styles.invalidReason}>{verifyResult?.reason}</ThemedText>
              </View>

              <TouchableOpacity
                style={styles.tryAgainButton}
                onPress={() => {
                  setShowResultModal(false);
                  setCodeInput('');
                }}
              >
                <ThemedText style={styles.tryAgainButtonText}>Try Another Code</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#5B21B6', '#7C3AED', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTopRow}>
          <TouchableOpacity
            style={styles.storeButton}
            activeOpacity={0.85}
            onPress={() => router.push('/stores')}
          >
            <Ionicons
              name={activeStore ? 'storefront-outline' : 'add-circle-outline'}
              size={16}
              color="white"
            />
            <ThemedText style={styles.storeButtonText} numberOfLines={1}>
              {activeStore?.name || 'Add a store'}
            </ThemedText>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroIconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(dashboard)/create-offer')}
          >
            <Ionicons name="share-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.heroTitle}>Deals</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
          Verify customer codes and track every redemption in one place.
        </ThemedText>

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatCard}>
            <View style={styles.heroStatIconWrap}>
              <Ionicons name="flash" size={14} color="#FDE68A" />
            </View>
            <ThemedText style={styles.heroStatLabel}>Active</ThemedText>
            <ThemedText style={styles.heroStatValue}>{listStats.active || 0}</ThemedText>
          </View>
          <View style={styles.heroStatCard}>
            <View style={styles.heroStatIconWrap}>
              <Ionicons name="checkmark-circle" size={14} color="#A7F3D0" />
            </View>
            <ThemedText style={styles.heroStatLabel}>Used</ThemedText>
            <ThemedText style={styles.heroStatValue}>{listStats.used || 0}</ThemedText>
          </View>
          <View style={styles.heroStatCard}>
            <View style={styles.heroStatIconWrap}>
              <Ionicons name="trending-up" size={14} color="#BAE6FD" />
            </View>
            <ThemedText style={styles.heroStatLabel}>Revenue</ThemedText>
            <ThemedText style={styles.heroStatValue} numberOfLines={1}>
              ₹{(safeStats?.totalRevenue || 0).toLocaleString()}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {!activeStore && (
        <View style={styles.storeWarningBanner}>
          <Ionicons name="information-circle" size={18} color="#7C3AED" />
          <ThemedText style={styles.storeWarningText}>
            Select a store to verify codes for a specific location and keep history accurate.
          </ThemedText>
        </View>
      )}

      {/* View mode tabs */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'scanner' && styles.viewModeTabActive]}
          onPress={() => setViewMode('scanner')}
        >
          <Ionicons name="scan" size={20} color={viewMode === 'scanner' ? '#7C3AED' : '#6b7280'} />
          <ThemedText
            style={[styles.viewModeText, viewMode === 'scanner' && styles.viewModeTextActive]}
          >
            Verify
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'list' && styles.viewModeTabActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list" size={20} color={viewMode === 'list' ? '#7C3AED' : '#6b7280'} />
          <ThemedText
            style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}
          >
            History
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'stats' && styles.viewModeTabActive]}
          onPress={() => setViewMode('stats')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={viewMode === 'stats' ? '#7C3AED' : '#6b7280'}
          />
          <ThemedText
            style={[styles.viewModeText, viewMode === 'stats' && styles.viewModeTextActive]}
          >
            Stats
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content based on view mode */}
      {viewMode === 'scanner' && renderScanner()}
      {viewMode === 'list' && renderList()}
      {viewMode === 'stats' && renderStats()}

      {/* Result modal */}
      {renderResultModal()}

      {/* Floating Create Offer button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.light.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 6,
          shadowColor: Colors.light.primary,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
        onPress={() => router.push('/(dashboard)/create-offer')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    maxWidth: '78%',
  },
  storeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    flexShrink: 1,
  },
  heroIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.78)',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  heroStatCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  heroStatIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroStatValue: {
    marginTop: 4,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: 'white',
  },
  storeWarningBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#6D28D9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  // View mode tabs (segmented control)
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  viewModeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewModeTabActive: {
    backgroundColor: '#F5F3FF',
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  viewModeTextActive: {
    color: '#7C3AED',
  },

  // Scanner styles
  scannerContainer: {
    flex: 1,
  },
  scannerHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  inputContainer: {
    padding: 16,
    gap: 12,
  },
  codeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  codeInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.light.textHeading,
  },
  clearButton: {
    padding: 4,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  instructionsCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    flex: 1,
  },

  // List styles
  listContainer: {
    flex: 1,
  },
  tabsScroll: {
    flexGrow: 0,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  chipLabelActive: {
    color: 'white',
  },
  chipCount: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  chipCountActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  chipCountText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: '#475569',
  },
  chipCountTextActive: {
    color: 'white',
  },
  redemptionsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  redemptionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  redemptionHeader: {
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  redemptionCode: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.textHeading,
    letterSpacing: 1.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  redemptionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    flex: 1,
  },
  redemptionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 32,
  },
  emptyIllustration: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyRingOuter: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#F5F3FF',
    opacity: 0.7,
  },
  emptyRingInner: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EDE9FE',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: Colors.light.textHeading,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: Colors.light.textMuted,
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Stats styles
  statsContainer: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  statPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginTop: 4,
  },
  statBreakdown: {
    marginTop: 8,
  },
  statBreakdownText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  revenueCard: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  revenueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  revenueContent: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
  topDealsCard: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  topDealsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 16,
  },
  topDealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundTertiary,
  },
  topDealRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topDealRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  topDealName: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textHeading,
  },
  topDealCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  validHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  validTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.success,
    marginTop: 12,
  },
  invalidHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  invalidTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.error,
    marginTop: 12,
  },
  invalidReason: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  redemptionInfo: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  termsSection: {
    marginTop: 16,
    backgroundColor: Colors.light.warningLight,
    borderRadius: 12,
    padding: 16,
  },
  termsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  termText: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 4,
  },
  markUsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.success,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  markUsedButtonDisabled: {
    opacity: 0.7,
  },
  markUsedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  tryAgainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  tryAgainButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
});
