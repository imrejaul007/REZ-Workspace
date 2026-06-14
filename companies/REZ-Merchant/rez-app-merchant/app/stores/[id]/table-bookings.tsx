import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  tableBookingService,
  TableBooking,
  TableBookingStats,
  Pagination,
} from '@/services/api/tableBookings';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';
import ConfirmModal from '@/components/common/ConfirmModal';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
];

const BOOKING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.light.warningLight, text: Colors.light.warning },
  confirmed: { bg: Colors.light.successLight, text: Colors.light.success },
  cancelled: { bg: Colors.light.errorLight, text: Colors.light.error },
  completed: { bg: '#E0E7FF', text: '#6366F1' },
  no_show: { bg: Colors.light.backgroundTertiary, text: Colors.light.textSecondary },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  no_show: 'No Show',
};

export default function TableBookingsScreen() {
  const router = useRouter();
  const { id: storeId } = useLocalSearchParams();
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [stats, setStats] = useState<TableBookingStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  // Modal states
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    booking: TableBooking | null;
    action: 'confirmed' | 'completed' | 'cancelled' | null;
  }>({ visible: false, booking: null, action: null });

  useEffect(() => {
    if (storeId) {
      loadBookings();
    }
  }, [storeId, activeTab, selectedDate]);

  const refreshBookingsOnFocus = useCallback(() => {
    if (storeId) {
      loadBookings();
    }
  }, [storeId, activeTab, selectedDate]);

  useFocusEffect(refreshBookingsOnFocus);

  const loadBookings = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1 && !append) {
        setLoading(true);
      }

      const params: unknown = { page, limit: 50 };
      if (activeTab !== 'all') params.status = activeTab;
      if (selectedDate) params.date = selectedDate;

      const result = await tableBookingService.getStoreTableBookings(storeId as string, params);

      if (append) {
        setBookings((prev) => [...prev, ...result.bookings]);
      } else {
        setBookings(result.bookings);
      }
      setStats(result.stats);
      setPagination(result.pagination);
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to load bookings',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings(1, false);
  }, [storeId, activeTab, selectedDate]);

  const handleLoadMore = () => {
    if (pagination?.hasNext && !loadingMore) {
      setLoadingMore(true);
      loadBookings(pagination.page + 1, true);
    }
  };

  const handleUpdateStatus = async (
    booking: TableBooking,
    status: 'confirmed' | 'completed' | 'cancelled'
  ) => {
    try {
      setUpdatingBooking(booking._id);
      await tableBookingService.updateBookingStatus(booking._id, status);
      setActionModal({ visible: false, booking: null, action: null });

      const labels = { confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
      setSuccessModal({
        visible: true,
        title: `Booking ${labels[status]}`,
        message: `Booking #${booking.bookingNumber} has been ${status}.`,
      });
      loadBookings();
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Update Failed',
        message: error.message || 'Failed to update booking status',
      });
    } finally {
      setUpdatingBooking(null);
    }
  };

  const formatBookingDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCustomerName = (booking: TableBooking): string => {
    if (booking.customerName) return booking.customerName;
    const user = booking.userId;
    if (user?.profile) {
      return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
    }
    return 'Customer';
  };

  const getCustomerPhone = (booking: TableBooking): string => {
    if (booking.customerPhone) return booking.customerPhone;
    return booking.userId?.phoneNumber || '';
  };

  const renderBookingCard = useCallback(
    ({ item }: { item: TableBooking }) => {
      const statusStyle = BOOKING_STATUS_COLORS[item.status] || BOOKING_STATUS_COLORS.pending;
      const canConfirm = item.status === 'pending';
      const canComplete = item.status === 'confirmed';
      const canCancel = item.status === 'pending' || item.status === 'confirmed';

      return (
        <View style={styles.bookingCard}>
          {/* Header: Booking Number + Status */}
          <View style={styles.bookingHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingRef}>#{item.bookingNumber}</Text>
              <Text style={styles.bookingDate}>
                {formatBookingDate(item.bookingDate)} at {item.bookingTime}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {STATUS_LABELS[item.status] ||
                  item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.customerSection}>
            <View style={styles.customerRow}>
              <Ionicons name="person" size={18} color={Colors.light.primary} />
              <Text style={styles.customerName}>{getCustomerName(item)}</Text>
            </View>
            <View style={styles.customerRow}>
              <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.customerDetail}>{getCustomerPhone(item)}</Text>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Party Size</Text>
              <Text style={styles.detailValue}>{item.partySize} guests</Text>
            </View>
            {item.specialRequests ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text
                  style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}
                  numberOfLines={2}
                >
                  {item.specialRequests}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          {(canConfirm || canComplete || canCancel) && (
            <View style={styles.actionsRow}>
              {canConfirm && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                  onPress={() =>
                    setActionModal({ visible: true, booking: item, action: 'confirmed' })
                  }
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirm</Text>
                </TouchableOpacity>
              )}
              {canComplete && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
                  onPress={() =>
                    setActionModal({ visible: true, booking: item, action: 'completed' })
                  }
                >
                  <Ionicons name="checkbox-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete</Text>
                </TouchableOpacity>
              )}
              {canCancel && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                  onPress={() =>
                    setActionModal({ visible: true, booking: item, action: 'cancelled' })
                  }
                >
                  <Ionicons name="close-circle-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      );
    },
    [formatBookingDate, getCustomerName, getCustomerPhone, setActionModal]
  );

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Date Filter */}
        <View style={styles.dateFilterRow}>
          <TouchableOpacity
            style={[styles.dateChip, !selectedDate && styles.dateChipActive]}
            onPress={() => setSelectedDate('')}
          >
            <Text style={[styles.dateChipText, !selectedDate && styles.dateChipTextActive]}>
              All Dates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateChip,
              selectedDate === new Date().toISOString().split('T')[0] && styles.dateChipActive,
            ]}
            onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            <Text
              style={[
                styles.dateChipText,
                selectedDate === new Date().toISOString().split('T')[0] &&
                  styles.dateChipTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dateChip, selectedDate === getTomorrowDate() && styles.dateChipActive]}
            onPress={() => setSelectedDate(getTomorrowDate())}
          >
            <Text
              style={[
                styles.dateChipText,
                selectedDate === getTomorrowDate() && styles.dateChipTextActive,
              ]}
            >
              Tomorrow
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.confirmed}</Text>
                <Text style={styles.statLabel}>Confirmed</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#E0E7FF' }]}>
                <Text style={[styles.statValue, { color: '#6366F1' }]}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.cancelled}</Text>
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.noShow}</Text>
                <Text style={styles.statLabel}>No Show</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>{stats.todayCount}</Text>
                <Text style={styles.statLabel}>Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <FlatList
            horizontal
            data={STATUS_TABS}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.tab, activeTab === item.key && styles.tabActive]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text style={[styles.tabText, activeTab === item.key && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsList}
          />
        </View>
      </View>
    ),
    [selectedDate, stats, activeTab, setActiveTab]
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </View>
    );
  }, [loadingMore]);

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Bookings</Text>
        <Text style={styles.emptyText}>
          {activeTab === 'all'
            ? 'Table bookings will appear here when customers make reservations'
            : `No ${activeTab} bookings found`}
        </Text>
      </View>
    ),
    [activeTab]
  );

  const actionLabels = {
    confirmed: {
      title: 'Confirm Booking',
      message: 'Are you sure you want to confirm this booking?',
    },
    completed: { title: 'Complete Booking', message: 'Mark this booking as completed?' },
    cancelled: {
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking? This cannot be undone.',
    },
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Table Bookings</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.light.primary]}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
          />
        )}
      </SafeAreaView>
      <BottomNav />

      {/* Action Confirmation Modal */}
      {actionModal.action && (
        <ConfirmModal
          visible={actionModal.visible}
          title={actionLabels[actionModal.action].title}
          message={`${actionLabels[actionModal.action].message}\n\nBooking: #${actionModal.booking?.bookingNumber}\nCustomer: ${actionModal.booking ? getCustomerName(actionModal.booking) : ''}\nParty: ${actionModal.booking?.partySize} guests`}
          confirmText={
            actionModal.action === 'cancelled'
              ? 'Cancel Booking'
              : actionModal.action === 'confirmed'
                ? 'Confirm'
                : 'Complete'
          }
          cancelText="Go Back"
          type={actionModal.action === 'cancelled' ? 'danger' : 'default'}
          loading={updatingBooking === actionModal.booking?._id}
          onConfirm={() =>
            actionModal.booking &&
            actionModal.action &&
            handleUpdateStatus(actionModal.booking, actionModal.action)
          }
          onCancel={() => setActionModal({ visible: false, booking: null, action: null })}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ visible: false, title: '', message: '' })}
        autoCloseDelay={2000}
      />
    </View>
  );
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  listContent: {
    paddingBottom: BOTTOM_NAV_HEIGHT_CONSTANT + 16,
  },
  dateFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  dateChipTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    padding: 16,
    gap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: Colors.light.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tabsList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  bookingCard: {
    backgroundColor: Colors.light.background,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bookingRef: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  bookingDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerSection: {
    marginBottom: 14,
    gap: 6,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  customerDetail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailsSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
