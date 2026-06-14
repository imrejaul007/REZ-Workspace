import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  serviceManagementService,
  MerchantServiceBooking,
  BookingStats,
  BookingStatus,
  CashbackStatus,
  Pagination,
} from '@/services/api/services';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import { socketService } from '@/services/api/socket';
import { logger } from '@/utils/logger';

const ACCENT = Colors.light.info;

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const BOOKING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.light.warningLight, text: Colors.light.warning },
  confirmed: { bg: Colors.light.successLight, text: Colors.light.success },
  assigned: { bg: Colors.light.infoLight, text: Colors.light.info },
  in_progress: { bg: '#E0E7FF', text: Colors.light.indigo },
  completed: { bg: Colors.light.successLight, text: '#059669' },
  cancelled: { bg: Colors.light.errorLight, text: Colors.light.error },
  no_show: { bg: Colors.light.backgroundTertiary, text: Colors.light.textSecondary },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.light.warningLight, text: Colors.light.warning },
  paid: { bg: Colors.light.successLight, text: Colors.light.success },
  partial: { bg: '#FED7AA', text: '#EA580C' },
  refunded: { bg: '#E0E7FF', text: Colors.light.indigo },
  failed: { bg: Colors.light.errorLight, text: Colors.light.error },
};

const CASHBACK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.light.warningLight, text: Colors.light.warning },
  held: { bg: Colors.light.infoLight, text: Colors.light.info },
  credited: { bg: Colors.light.successLight, text: Colors.light.success },
  clawed_back: { bg: Colors.light.errorLight, text: Colors.light.error },
};

const DEPOSIT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: '#E6F7EE', text: '#1a3a52' },
  refunded: { bg: '#FFF3E0', text: '#1a3a52' },
  pending: { bg: '#FFF8E1', text: '#1a3a52' },
  none: { bg: 'transparent', text: 'transparent' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function ServiceBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<MerchantServiceBooking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  // Action modal
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    booking: MerchantServiceBooking | null;
    action: 'confirmed' | 'completed' | 'cancelled' | null;
  }>({ visible: false, booking: null, action: null });
  const [actionNote, setActionNote] = useState('');

  // Debounce timer ref — prevents stacked refreshes from burst socket events
  const socketDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load — loadData is a stable inline fn, intentionally omitted
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when tab changes — loadBookings is stable, intentionally omitted
  useEffect(() => {
    loadBookings(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Socket listener — refresh bookings when an order-event or booking update arrives
  useEffect(() => {
    const handleSocketEvent = () => {
      if (socketDebounceRef.current) clearTimeout(socketDebounceRef.current);
      socketDebounceRef.current = setTimeout(async () => {
        socketDebounceRef.current = null;
        await Promise.all([loadBookings(1, false), loadStats()]);
      }, 500);
    };

    socketService.on('order-event', handleSocketEvent);
    socketService.on('booking-event', handleSocketEvent);

    return () => {
      socketService.off('order-event', handleSocketEvent);
      socketService.off('booking-event', handleSocketEvent);
      if (socketDebounceRef.current) {
        clearTimeout(socketDebounceRef.current);
        socketDebounceRef.current = null;
      }
    };
    // loadBookings and loadStats are stable inline fns — intentionally omitted to avoid re-registering on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBookings(1, false), loadStats()]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await serviceManagementService.getBookingStats();
      setStats(data);
    } catch (error) {
      logger.error('Failed to load stats:', error);
    }
  };

  const loadBookings = async (page: number = 1, append: boolean = false) => {
    try {
      const params: unknown = { page, limit: 20 };
      if (activeTab !== 'all') params.status = activeTab as BookingStatus;

      const result = await serviceManagementService.getBookings(params);

      if (append) {
        setBookings((prev) => [...prev, ...result.bookings]);
      } else {
        setBookings(result.bookings);
      }
      setPagination(result.pagination);
    } catch (error) {
      logger.error('Failed to load bookings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadBookings(1, false), loadStats()]);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !pagination || pagination.page >= pagination.pages) return;
    setLoadingMore(true);
    await loadBookings(pagination.page + 1, true);
    setLoadingMore(false);
  };

  const handleUpdateStatus = async () => {
    const { booking, action } = actionModal;
    if (!booking || !action) return;

    setUpdatingBooking(booking._id);
    setActionModal({ visible: false, booking: null, action: null });

    try {
      await serviceManagementService.updateBookingStatus(booking._id, action, {
        note: actionNote.trim() || undefined,
      });
      setActionNote('');

      // Refresh data
      await Promise.all([loadBookings(1, false), loadStats()]);
    } catch (error) {
      showAlert('Error', error.message || 'Failed to update booking status');
    } finally {
      setUpdatingBooking(null);
    }
  };

  const getCustomerName = (booking: MerchantServiceBooking): string => {
    if (booking.customerName) return booking.customerName;
    const profile = booking.user?.profile;
    if (profile?.firstName) {
      return `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`;
    }
    return 'Unknown Customer';
  };

  const getCustomerPhone = (booking: MerchantServiceBooking): string => {
    return booking.customerPhone || booking.user?.profile?.phoneNumber || 'N/A';
  };

  const formatDate = (dateString: string): string => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // ── Stats Cards ─────────────────────────────────────────────────────────

  const renderStatsCards = () => {
    if (!stats) return null;

    const statItems = [
      {
        label: 'Total',
        value: stats.totalBookings,
        color: Colors.light.textDark,
        bg: Colors.light.backgroundTertiary,
      },
      {
        label: 'Pending',
        value: stats.pending,
        color: Colors.light.warning,
        bg: Colors.light.warningLight,
      },
      {
        label: 'Confirmed',
        value: stats.confirmed,
        color: Colors.light.success,
        bg: Colors.light.successLight,
      },
      {
        label: 'Completed',
        value: stats.completed,
        color: '#059669',
        bg: Colors.light.successLight,
      },
      {
        label: 'Cancelled',
        value: stats.cancelled,
        color: Colors.light.error,
        bg: Colors.light.errorLight,
      },
      { label: 'Revenue', value: formatCurrency(stats.revenue), color: ACCENT, bg: '#F0F9FF' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScroll}
      >
        {statItems.map((item, idx) => (
          <View key={idx} style={[styles.statCard, { backgroundColor: item.bg }]}>
            <Text style={[styles.statValue, { color: item.color }]}>
              {typeof item.value === 'number' ? item.value : item.value}
            </Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  // ── Status Tabs ─────────────────────────────────────────────────────────

  const renderStatusTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsScroll}
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
  );

  // ── Status Badge ────────────────────────────────────────────────────────

  const StatusBadge = ({
    status,
    colorMap,
  }: {
    status: string;
    colorMap: Record<string, { bg: string; text: string }>;
  }) => {
    const style = colorMap[status] || {
      bg: Colors.light.backgroundTertiary,
      text: Colors.light.textSecondary,
    };
    const label =
      STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <View style={[styles.badge, { backgroundColor: style.bg }]}>
        <Text style={[styles.badgeText, { color: style.text }]}>{label}</Text>
      </View>
    );
  };

  // ── Booking Card ────────────────────────────────────────────────────────

  const renderBookingCard = ({ item }: { item: MerchantServiceBooking }) => {
    const canConfirm = item.status === 'pending';
    const canComplete = item.status === 'confirmed';
    const canCancel = item.status === 'pending' || item.status === 'confirmed';
    const isUpdating = updatingBooking === item._id;

    return (
      <View style={styles.bookingCard}>
        {isUpdating && (
          <View style={styles.updatingOverlay}>
            <ActivityIndicator color={ACCENT} />
          </View>
        )}

        {/* Header: Booking number + Status */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderFlexContent}>
            <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
            <Text style={styles.bookingDate}>
              {formatDate(item.bookingDate)}
              {item.timeSlot ? ` · ${item.timeSlot.start} - ${item.timeSlot.end}` : ''}
            </Text>
          </View>
          <StatusBadge status={item.status} colorMap={BOOKING_STATUS_COLORS} />
        </View>

        {/* Customer Info */}
        <View style={styles.cardSection}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={ACCENT} />
            <Text style={styles.infoText}>{getCustomerName(item)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.infoTextSecondary}>{getCustomerPhone(item)}</Text>
          </View>
        </View>

        {/* Service + Category */}
        <View style={styles.cardSection}>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={16} color={ACCENT} />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.service?.name || 'N/A'}
            </Text>
          </View>
          {item.serviceCategory?.name && (
            <View style={styles.infoRow}>
              <Ionicons name="folder-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.infoTextSecondary}>{item.serviceCategory.name}</Text>
            </View>
          )}
        </View>

        {/* Payment + Cashback + Deposit Row */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Total</Text>
            <Text style={styles.paymentAmount}>{formatCurrency(item.pricing?.total || 0)}</Text>
          </View>
          <StatusBadge status={item.paymentStatus} colorMap={PAYMENT_STATUS_COLORS} />
          {item.cashbackStatus && (
            <View style={styles.cashbackBadge}>
              <Ionicons
                name="gift-outline"
                size={12}
                color={
                  CASHBACK_STATUS_COLORS[item.cashbackStatus]?.text || Colors.light.textSecondary
                }
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      CASHBACK_STATUS_COLORS[item.cashbackStatus]?.text ||
                      Colors.light.textSecondary,
                    marginLeft: 3,
                  },
                ]}
              >
                CB: {item.cashbackStatus.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </View>

        {/* Deposit Status Badge */}
        {item.depositStatus && item.depositStatus !== 'none' && (
          <View
            style={[
              styles.depositBadge,
              {
                backgroundColor: DEPOSIT_STATUS_COLORS[item.depositStatus]?.bg || '#FFF8E1',
              },
            ]}
          >
            <Text
              style={[
                styles.depositBadgeText,
                {
                  color: DEPOSIT_STATUS_COLORS[item.depositStatus]?.text || '#1a3a52',
                },
              ]}
            >
              {item.depositStatus === 'paid'
                ? `₹${item.depositAmount || 0} paid`
                : item.depositStatus === 'refunded'
                  ? 'Refunded'
                  : 'Payment pending'}
            </Text>
          </View>
        )}

        {/* Travel Details (if present) */}
        {item.travelDetails?.route && (
          <View style={styles.travelSection}>
            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: Colors.light.success }]} />
                <Text style={styles.routeText}>
                  {item.travelDetails.route.from}
                  {item.travelDetails.route.fromCode
                    ? ` (${item.travelDetails.route.fromCode})`
                    : ''}
                </Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={Colors.light.textMuted}
                style={styles.routeArrowIcon}
              />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: Colors.light.error }]} />
                <Text style={styles.routeText}>
                  {item.travelDetails.route.to}
                  {item.travelDetails.route.toCode ? ` (${item.travelDetails.route.toCode})` : ''}
                </Text>
              </View>
            </View>
            {item.travelDetails.passengers && (
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.infoTextSecondary}>
                  {item.travelDetails.passengers.adults} Adult
                  {item.travelDetails.passengers.adults !== 1 ? 's' : ''}
                  {item.travelDetails.passengers.children
                    ? `, ${item.travelDetails.passengers.children} Child`
                    : ''}
                </Text>
              </View>
            )}
            {item.pnr && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={Colors.light.textSecondary}
                />
                <Text style={styles.infoTextSecondary}>PNR: {item.pnr}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {(canConfirm || canComplete || canCancel) && (
          <View style={styles.actionsRow}>
            {canConfirm && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.light.success }]}
                onPress={() =>
                  setActionModal({ visible: true, booking: item, action: 'confirmed' })
                }
              >
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.light.card} />
                <Text style={styles.actionButtonText}>Confirm</Text>
              </TouchableOpacity>
            )}
            {canComplete && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.light.indigo }]}
                onPress={() =>
                  setActionModal({ visible: true, booking: item, action: 'completed' })
                }
              >
                <Ionicons name="checkbox-outline" size={18} color={Colors.light.card} />
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.light.error }]}
                onPress={() =>
                  setActionModal({ visible: true, booking: item, action: 'cancelled' })
                }
              >
                <Ionicons name="close-circle-outline" size={18} color={Colors.light.card} />
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // ── List Header ─────────────────────────────────────────────────────────

  const renderListHeader = () => (
    <View>
      {renderStatsCards()}
      {renderStatusTabs()}
      <View style={styles.resultCount}>
        <Text style={styles.resultCountText}>
          {pagination ? `${pagination.total} booking${pagination.total !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>
    </View>
  );

  // ── Empty State ─────────────────────────────────────────────────────────

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color={Colors.light.borderDark} />
        <Text style={styles.emptyTitle}>No Bookings Found</Text>
        <Text style={styles.emptySubtitle}>
          {activeTab === 'all'
            ? 'Bookings will appear here once customers start booking your services.'
            : `No ${activeTab} bookings at the moment.`}
        </Text>
      </View>
    );
  };

  // ── Footer ──────────────────────────────────────────────────────────────

  const renderFooter = () => {
    if (!loadingMore) return <View style={styles.footerSpacer} />;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  };

  // ── Action Confirmation Modal ───────────────────────────────────────────

  const getActionConfig = () => {
    switch (actionModal.action) {
      case 'confirmed':
        return {
          title: 'Confirm Booking',
          color: Colors.light.success,
          label: 'Confirm',
          icon: 'checkmark-circle' as const,
        };
      case 'completed':
        return {
          title: 'Complete Booking',
          color: Colors.light.indigo,
          label: 'Complete',
          icon: 'checkbox' as const,
        };
      case 'cancelled':
        return {
          title: 'Cancel Booking',
          color: Colors.light.error,
          label: 'Cancel Booking',
          icon: 'close-circle' as const,
        };
      default:
        return {
          title: '',
          color: Colors.light.textSecondary,
          label: '',
          icon: 'help-circle' as const,
        };
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ACCENT, '#0284C7', Colors.light.backgroundTertiary]}
        locations={[0, 0.15, 0.4]}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.card} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Bookings</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
            <Ionicons name="refresh" size={22} color={Colors.light.card} />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item._id}
            renderItem={renderBookingCard}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={ACCENT}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <BottomNav />

      {/* Action Confirmation Modal */}
      <Modal
        visible={actionModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActionModal({ visible: false, booking: null, action: null });
          setActionNote('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {(() => {
              const config = getActionConfig();
              return (
                <>
                  <View style={[styles.modalIcon, { backgroundColor: `${config.color}15` }]}>
                    <Ionicons name={config.icon} size={32} color={config.color} />
                  </View>
                  <Text style={styles.modalTitle}>{config.title}</Text>
                  <Text style={styles.modalMessage}>
                    {actionModal.action === 'cancelled'
                      ? `Are you sure you want to cancel booking #${actionModal.booking?.bookingNumber}? This may trigger a refund.`
                      : `${config.label} booking #${actionModal.booking?.bookingNumber}?`}
                  </Text>

                  <TextInput
                    style={styles.noteInput}
                    value={actionNote}
                    onChangeText={setActionNote}
                    placeholder="Add a note (optional)"
                    placeholderTextColor={Colors.light.textMuted}
                    multiline
                    numberOfLines={2}
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => {
                        setActionModal({ visible: false, booking: null, action: null });
                        setActionNote('');
                      }}
                    >
                      <Text style={styles.modalCancelText}>Go Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalConfirmBtn, { backgroundColor: config.color }]}
                      onPress={handleUpdateStatus}
                    >
                      <Text style={styles.modalConfirmText}>{config.label}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundTertiary,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 180,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.card,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 20,
  },

  // Stats
  statsScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 8,
  },
  statCard: {
    width: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // Tabs
  tabsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.card,
  },

  // Result count
  resultCount: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  resultCountText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },

  // Booking Card
  bookingCard: {
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  updatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textDark,
  },
  bookingDate: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },

  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Card sections
  cardSection: {
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundTertiary,
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textDark,
    flex: 1,
  },
  infoTextSecondary: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },

  // Payment row
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundTertiary,
    paddingTop: 10,
    marginBottom: 4,
  },
  paymentItem: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textDark,
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
  },

  // Deposit status
  depositBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  depositBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Travel section
  travelSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundTertiary,
    paddingTop: 10,
    marginBottom: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textTertiary,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundTertiary,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.card,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textTertiary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textDark,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  noteInput: {
    width: '100%',
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.textDark,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderDark,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.card,
  },
  cardHeaderFlexContent: {
    flex: 1,
  },
  routeArrowIcon: {
    marginHorizontal: 6,
  },
  footerSpacer: {
    height: BOTTOM_NAV_HEIGHT_CONSTANT + 20,
  },
  footerLoading: {
    paddingVertical: 20,
  },
});
