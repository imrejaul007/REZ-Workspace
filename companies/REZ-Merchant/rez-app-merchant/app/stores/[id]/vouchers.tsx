import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  storeVouchersService,
  MerchantStoreVoucher,
  StoreVoucherStats,
} from '@/services/api/storeVouchers';
import { useStore } from '@/contexts/StoreContext';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Safe back navigation - goes to store details if no history
const useSafeBack = (storeId: string) => {
  const router = useRouter();

  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/stores/${storeId}/details`);
    }
  };
};

type FilterType = 'all' | 'active' | 'expired';

export default function StoreVouchersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;
  const { stores } = useStore();
  const store = stores.find((s) => s._id === storeId);
  const handleBack = useSafeBack(storeId);

  const [vouchers, setVouchers] = useState<MerchantStoreVoucher[]>([]);
  const [stats, setStats] = useState<StoreVoucherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
    onConfirm: () => {},
  });
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'default' | 'danger' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
  });

  // Reload vouchers when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadVouchers();
      loadStats();
    }, [storeId])
  );

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storeVouchersService.getVouchers({
        storeId: storeId,
      });
      if (response.success && response.data) {
        setVouchers(response.data.vouchers || []);
      } else {
        setError(response.message || 'Failed to load vouchers');
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading vouchers:', err);
      setError(err.message || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await storeVouchersService.getVoucherStats(storeId);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      if (__DEV__) console.error('Error loading stats:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVouchers(), loadStats()]);
    setRefreshing(false);
  };

  const handleAddVoucher = () => {
    router.push({
      pathname: '/stores/[id]/vouchers/add',
      params: { id: storeId },
    });
  };

  const handleEditVoucher = (voucherId: string) => {
    router.push({
      pathname: '/stores/[id]/vouchers/[voucherId]',
      params: { id: storeId, voucherId },
    });
  };

  const handleDeleteVoucher = async (voucherId: string) => {
    setConfirmModal({
      visible: true,
      title: 'Delete Voucher',
      message:
        'Are you sure you want to delete this voucher? This will also remove it from all users who have claimed it. This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, visible: false });
        try {
          const response = await storeVouchersService.deleteVoucher(voucherId);
          if (response.success) {
            setAlertModal({
              visible: true,
              title: 'Success',
              message: 'Voucher deleted successfully',
              type: 'default',
            });
            loadVouchers();
            loadStats();
          } else {
            setAlertModal({
              visible: true,
              title: 'Error',
              message: response.message || 'Failed to delete voucher',
              type: 'danger',
            });
          }
        } catch (err) {
          setAlertModal({
            visible: true,
            title: 'Error',
            message: err.message || 'Failed to delete voucher',
            type: 'danger',
          });
        }
      },
    });
  };

  const handleToggleActive = async (voucher: MerchantStoreVoucher) => {
    try {
      const response = await storeVouchersService.toggleVoucherActive(voucher._id);
      if (response.success) {
        loadVouchers();
        loadStats();
      } else {
        setAlertModal({
          visible: true,
          title: 'Error',
          message: response.message || 'Failed to update voucher',
          type: 'danger',
        });
      }
    } catch (err) {
      setAlertModal({
        visible: true,
        title: 'Error',
        message: err.message || 'Failed to update voucher',
        type: 'danger',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDiscountValue = (voucher: MerchantStoreVoucher) => {
    if (voucher.discountType === 'percentage') {
      return `${voucher.discountValue}%`;
    }
    return `₹${voucher.discountValue}`;
  };

  const isCurrentlyValid = (voucher: MerchantStoreVoucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validUntil = new Date(voucher.validUntil);
    return voucher.isActive && now >= validFrom && now <= validUntil;
  };

  const isExpired = (voucher: MerchantStoreVoucher) => {
    const now = new Date();
    const validUntil = new Date(voucher.validUntil);
    return now > validUntil;
  };

  // Filter vouchers based on selected filter
  const filteredVouchers = vouchers.filter((voucher) => {
    if (filter === 'all') return true;
    if (filter === 'active') return isCurrentlyValid(voucher);
    if (filter === 'expired') return isExpired(voucher) || !voucher.isActive;
    return true;
  });

  const getFilterCount = (filterType: FilterType) => {
    if (filterType === 'all') return vouchers.length;
    if (filterType === 'active') return vouchers.filter((v) => isCurrentlyValid(v)).length;
    if (filterType === 'expired') return vouchers.filter((v) => isExpired(v) || !v.isActive).length;
    return 0;
  };

  // Render Stats Cards
  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Analytics Overview</Text>
        <View style={styles.statsGrid}>
          {/* Total Vouchers */}
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="ticket" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{stats.totalVouchers}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>

          {/* Active Vouchers */}
          <LinearGradient
            colors={['#11998E', '#38EF7D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{stats.activeVouchers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </LinearGradient>

          {/* Claimed */}
          <LinearGradient
            colors={['#4776E6', '#8E54E9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="hand-left" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{stats.totalClaimed}</Text>
            <Text style={styles.statLabel}>Claimed</Text>
          </LinearGradient>

          {/* Redeemed */}
          <LinearGradient
            colors={['#F2994A', '#F2C94C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="gift" size={20} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.statValue}>{stats.totalRedeemed}</Text>
            <Text style={styles.statLabel}>Redeemed</Text>
          </LinearGradient>
        </View>

        {/* Redemption Rate Card */}
        <View style={styles.redemptionCard}>
          <View style={styles.redemptionHeader}>
            <View style={styles.redemptionIconBg}>
              <Ionicons name="trending-up" size={18} color={Colors.light.accent} />
            </View>
            <View style={styles.redemptionInfo}>
              <Text style={styles.redemptionTitle}>Redemption Rate</Text>
              <Text style={styles.redemptionSubtitle}>Vouchers used vs claimed</Text>
            </View>
            <Text style={styles.redemptionPercent}>{stats.redemptionRate}%</Text>
          </View>
          <View style={styles.redemptionBarBg}>
            <LinearGradient
              colors={[Colors.light.accent, Colors.light.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.redemptionBarFill,
                { width: `${Math.min(stats.redemptionRate, 100)}%` },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  // Render Filter Tabs
  const renderFilterTabs = () => (
    <View style={styles.filterSection}>
      {(['all', 'active', 'expired'] as FilterType[]).map((filterOption) => {
        const isActive = filter === filterOption;
        const count = getFilterCount(filterOption);
        return (
          <TouchableOpacity
            key={filterOption}
            style={[styles.filterTab, isActive && styles.filterTabActive]}
            onPress={() => setFilter(filterOption)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
            <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
              <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Render Voucher Card - Modern Ticket Style
  const renderVoucherCard = (voucher: MerchantStoreVoucher) => {
    const isValid = isCurrentlyValid(voucher);
    const expired = isExpired(voucher);
    const isPromo = voucher.type === 'promotional';

    const cardGradient: [string, string] = isPromo ? ['#F59E0B', '#EF4444'] : ['#8B5CF6', '#6366F1'];

    const statusColor = isValid
      ? Colors.light.success
      : expired
        ? Colors.light.warning
        : Colors.light.error;
    const statusBg = isValid ? '#ECFDF5' : expired ? '#FFFBEB' : '#FEF2F2';
    const statusText = isValid ? 'Active' : expired ? 'Expired' : 'Inactive';

    return (
      <View key={voucher._id} style={styles.voucherCard}>
        {/* Ticket Header with Gradient */}
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.voucherHeader}
        >
          <View style={styles.voucherHeaderLeft}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountValue}>{formatDiscountValue(voucher)}</Text>
              <Text style={styles.discountLabel}>OFF</Text>
            </View>
          </View>
          <View style={styles.voucherHeaderRight}>
            <Text style={styles.voucherType}>{isPromo ? 'PROMOTIONAL' : 'STORE VISIT'}</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{voucher.code}</Text>
            </View>
          </View>
          {/* Decorative circles for ticket effect */}
          <View style={[styles.ticketCircle, styles.ticketCircleLeft]} />
          <View style={[styles.ticketCircle, styles.ticketCircleRight]} />
        </LinearGradient>

        {/* Dashed Separator */}
        <View style={styles.dashedSeparator}>
          <View style={styles.dashedLine} />
        </View>

        {/* Card Body */}
        <View style={styles.voucherBody}>
          {/* Title and Actions Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.voucherName} numberOfLines={1}>
                {voucher.name}
              </Text>
              {voucher.description && (
                <Text style={styles.voucherDescription} numberOfLines={1}>
                  {voucher.description}
                </Text>
              )}
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleEditVoucher(voucher._id)}
                style={styles.actionBtn}
              >
                <Ionicons name="create-outline" size={18} color={Colors.light.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteVoucher(voucher._id)}
                style={[styles.actionBtn, styles.deleteBtn]}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.light.error} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="wallet-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.infoLabel}>Min. Bill</Text>
              <Text style={styles.infoValue}>₹{voucher.minBillAmount}</Text>
            </View>
            {voucher.maxDiscountAmount && (
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.infoLabel}>Max. Off</Text>
                <Text style={styles.infoValue}>₹{voucher.maxDiscountAmount}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Ionicons name="people-outline" size={14} color={Colors.light.textSecondary} />
              <Text style={styles.infoLabel}>Claims</Text>
              <Text style={styles.infoValue}>{voucher.claimedCount || 0}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="checkmark-done-outline"
                size={14}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.infoLabel}>Used</Text>
              <Text style={styles.infoValue}>
                {voucher.usedCount}/{voucher.usageLimit}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.voucherFooter}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.dateText}>
                {formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleToggleActive(voucher)}
              style={[styles.statusBadge, { backgroundColor: statusBg }]}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </TouchableOpacity>
          </View>

          {/* Restrictions Tags */}
          {voucher.restrictions && (
            <View style={styles.tagsContainer}>
              {voucher.restrictions.isOfflineOnly && (
                <View style={styles.tag}>
                  <Ionicons
                    name="storefront-outline"
                    size={10}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.tagText}>In-store only</Text>
                </View>
              )}
              {voucher.restrictions.singleVoucherPerBill && (
                <View style={styles.tag}>
                  <Ionicons name="document-outline" size={10} color={Colors.light.textSecondary} />
                  <Text style={styles.tagText}>1 per bill</Text>
                </View>
              )}
              {voucher.usageLimitPerUser && (
                <View style={styles.tag}>
                  <Ionicons name="person-outline" size={10} color={Colors.light.textSecondary} />
                  <Text style={styles.tagText}>{voucher.usageLimitPerUser}/user</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[Colors.light.accent, Colors.light.primary]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.card} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Store Vouchers</Text>
            <View style={styles.headerBtn} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={Colors.light.accent} />
          </View>
          <Text style={styles.loadingText}>Loading vouchers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[Colors.light.accent, Colors.light.primary]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.card} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Store Vouchers</Text>
            {store && <Text style={styles.headerSubtitle}>{store.name}</Text>}
          </View>
          <TouchableOpacity onPress={handleAddVoucher} style={styles.headerBtn}>
            <Ionicons name="add-circle" size={26} color={Colors.light.card} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8B5CF6']}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Stats Section */}
        {renderStatsCard()}

        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBg}>
              <Ionicons name="alert-circle" size={32} color={Colors.light.error} />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadVouchers} style={styles.retryButton}>
              <Ionicons name="refresh" size={18} color={Colors.light.card} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!error && filteredVouchers.length === 0 && (
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#F3E8FF', '#E9D5FF']} style={styles.emptyIconBg}>
              <Ionicons name="ticket-outline" size={48} color={Colors.light.accent} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No Vouchers Yet' : `No ${filter} Vouchers`}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Create your first voucher to attract customers with exclusive discounts!'
                : `No ${filter} vouchers found for this store.`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity style={styles.createButton} onPress={handleAddVoucher}>
                <LinearGradient
                  colors={[Colors.light.accent, Colors.light.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  <Ionicons name="add" size={20} color={Colors.light.card} />
                  <Text style={styles.createButtonText}>Create Voucher</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Voucher Cards */}
        {!error && filteredVouchers.map(renderVoucherCard)}

        {/* Bottom Spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      {filteredVouchers.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddVoucher} activeOpacity={0.9}>
          <LinearGradient
            colors={[Colors.light.accent, Colors.light.primary]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={Colors.light.card} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
      />

      {/* Alert Modal */}
      <ConfirmModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        confirmText="OK"
        onConfirm={() => setAlertModal({ ...alertModal, visible: false })}
        onCancel={() => setAlertModal({ ...alertModal, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.card,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  // Stats Section
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minHeight: 95,
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.card,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  redemptionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  redemptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  redemptionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redemptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  redemptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textDark,
  },
  redemptionSubtitle: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  redemptionPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.accent,
  },
  redemptionBarBg: {
    height: 8,
    backgroundColor: Colors.light.primaryLight2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  redemptionBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Filter Section
  filterSection: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: Colors.light.accent,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.light.card,
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  filterCountTextActive: {
    color: Colors.light.card,
  },

  // Error State
  errorContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  errorIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: Colors.light.card,
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    color: Colors.light.card,
    fontSize: 16,
    fontWeight: '600',
  },

  // Voucher Card - Ticket Style
  voucherCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: 'relative',
  },
  voucherHeaderLeft: {
    alignItems: 'flex-start',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  discountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.card,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  voucherHeaderRight: {
    alignItems: 'flex-end',
  },
  voucherType: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.card,
    letterSpacing: 1.5,
  },
  ticketCircle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    bottom: -10,
  },
  ticketCircleLeft: {
    left: -10,
  },
  ticketCircleRight: {
    right: -10,
  },
  dashedSeparator: {
    paddingHorizontal: 10,
  },
  dashedLine: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  voucherBody: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  voucherName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textDark,
  },
  voucherDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.primaryLight2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.light.errorLight,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textTertiary,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundTertiary,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    shadowColor: Colors.light.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
