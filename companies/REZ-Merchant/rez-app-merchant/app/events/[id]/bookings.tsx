import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventService, EventBooking, EventBookingStats, Pagination } from '@/services/api/events';
import { Colors } from '@/constants/Colors';
import { BottomNav, BOTTOM_NAV_HEIGHT_CONSTANT } from '@/components/navigation/BottomNav';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';
import ConfirmModal from '@/components/common/ConfirmModal';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const BOOKING_STATUS_COLORS = {
  pending: { bg: Colors.light.warningLight, text: Colors.light.warning },
  confirmed: { bg: Colors.light.successLight, text: Colors.light.success },
  cancelled: { bg: Colors.light.errorLight, text: Colors.light.error },
  completed: { bg: '#E0E7FF', text: Colors.light.indigo },
  refunded: { bg: Colors.light.backgroundTertiary, text: Colors.light.textSecondary },
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.light.warningLight, text: Colors.light.warning },
  processing: { bg: Colors.light.warningLight, text: Colors.light.warning },
  completed: { bg: Colors.light.successLight, text: Colors.light.success },
  failed: { bg: Colors.light.errorLight, text: Colors.light.error },
  cancelled: { bg: Colors.light.errorLight, text: Colors.light.error },
  expired: { bg: Colors.light.backgroundTertiary, text: Colors.light.textSecondary },
  refunded: { bg: Colors.light.backgroundTertiary, text: Colors.light.textSecondary },
  refund_initiated: { bg: Colors.light.warningLight, text: Colors.light.warning },
  refund_processing: { bg: Colors.light.warningLight, text: Colors.light.warning },
  refund_failed: { bg: Colors.light.errorLight, text: Colors.light.error },
  partially_refunded: { bg: Colors.light.backgroundTertiary, text: Colors.light.textSecondary },
};

export default function EventBookingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [stats, setStats] = useState<EventBookingStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Modal states
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });
  const [checkInModal, setCheckInModal] = useState<{
    visible: boolean;
    booking: EventBooking | null;
  }>({
    visible: false,
    booking: null,
  });

  useEffect(() => {
    if (id) {
      loadBookings();
    }
  }, [id, activeTab]);

  const loadBookings = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1 && !append) {
        setLoading(true);
      }

      const params: unknown = { page, limit: 20 };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const result = await eventService.getEventBookings(id as string, params);

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
  }, [id, activeTab]);

  const handleLoadMore = () => {
    if (pagination?.hasNext && !loadingMore) {
      setLoadingMore(true);
      loadBookings(pagination.page + 1, true);
    }
  };

  const handleCheckIn = async (booking: EventBooking) => {
    try {
      setCheckingIn(booking.id);
      await eventService.checkInBooking(id as string, booking.id);
      setCheckInModal({ visible: false, booking: null });
      setSuccessModal({
        visible: true,
        title: 'Checked In!',
        message: `${booking.attendeeInfo.name} has been checked in successfully.`,
      });
      loadBookings();
    } catch (error) {
      setErrorModal({
        visible: true,
        title: 'Check-In Failed',
        message: error.message || 'Failed to check in attendee',
      });
    } finally {
      setCheckingIn(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBookingCard = ({ item }: { item: EventBooking }) => {
    const statusStyle =
      (BOOKING_STATUS_COLORS as unknown as Record<string, { bg: string; text: string }>)[item.status] || BOOKING_STATUS_COLORS.pending;
    const paymentStyle =
      (PAYMENT_STATUS_COLORS as unknown as Record<string, { bg: string; text: string }>)[item.paymentStatus] || PAYMENT_STATUS_COLORS.pending;
    const canCheckIn = item.status === 'confirmed' && !item.checkInTime;

    return (
      <View style={styles.bookingCard}>
        {/* Header */}
        <View style={styles.bookingHeader}>
          <View>
            <Text style={styles.bookingRef}>#{item.bookingReference}</Text>
            <Text style={styles.bookingDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Attendee Info */}
        <View style={styles.attendeeSection}>
          <View style={styles.attendeeRow}>
            <Ionicons name="person" size={18} color={Colors.light.primary} />
            <Text style={styles.attendeeName}>{item.attendeeInfo.name}</Text>
          </View>
          <View style={styles.attendeeRow}>
            <Ionicons name="mail-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.attendeeDetail}>{item.attendeeInfo.email}</Text>
          </View>
          {item.attendeeInfo.phone && (
            <View style={styles.attendeeRow}>
              <Ionicons name="call-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.attendeeDetail}>{item.attendeeInfo.phone}</Text>
            </View>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount</Text>
            <Text style={styles.paymentAmount}>
              {item.currency}
              {item.amount}
            </Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment</Text>
            <View style={[styles.paymentBadge, { backgroundColor: paymentStyle.bg }]}>
              <Text style={[styles.paymentStatus, { color: paymentStyle.text }]}>
                {item.paymentStatus.charAt(0).toUpperCase() + item.paymentStatus.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Check-In Info */}
        {item.checkInTime && (
          <View style={styles.checkInInfo}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.light.success} />
            <Text style={styles.checkInText}>Checked in at {formatDate(item.checkInTime)}</Text>
          </View>
        )}

        {/* Actions */}
        {canCheckIn && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => setCheckInModal({ visible: true, booking: item })}
          >
            <Ionicons name="checkbox-outline" size={20} color="#FFFFFF" />
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View>
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
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>₹{stats.totalRevenue}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
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
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.light.primary} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Bookings Yet</Text>
      <Text style={styles.emptyText}>
        {activeTab === 'all'
          ? 'Bookings for this event will appear here'
          : `No ${activeTab} bookings found`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Bookings</Text>
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
            keyExtractor={(item) => item.id}
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

      {/* Check-In Confirmation Modal */}
      <ConfirmModal
        visible={checkInModal.visible}
        title="Check In Attendee"
        message={`Confirm check-in for ${checkInModal.booking?.attendeeInfo.name}?`}
        confirmText="Check In"
        cancelText="Cancel"
        type="default"
        loading={checkingIn === checkInModal.booking?.id}
        onConfirm={() => checkInModal.booking && handleCheckIn(checkInModal.booking)}
        onCancel={() => setCheckInModal({ visible: false, booking: null })}
      />

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
    marginBottom: 16,
  },
  bookingRef: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  bookingDate: {
    fontSize: 12,
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
  attendeeSection: {
    marginBottom: 16,
    gap: 8,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  attendeeDetail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  paymentSection: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkInText: {
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '500',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
