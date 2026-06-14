// Habixo Bookings Management Screen with Swipe Actions and Calendar
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { getHostBookings, updateBookingStatus, HabixoBooking } from './api';
import { SwipeableBookingCard, QuickActionButtons } from './components/SwipeableBookingCard';
import { BookingCalendar, CalendarBooking } from './components/BookingCalendar';

// Mock data for development/fallback
const MOCK_BOOKINGS: HabixoBooking[] = [
  {
    id: 'b1',
    guestName: 'Priya Mehta',
    guestAvatar: 'https://i.pravatar.cc/50?img=5',
    property: 'Modern Apartment Koramangala',
    propertyImage: 'https://picsum.photos/100/100?random=1',
    checkIn: 'May 10, 2026',
    checkOut: 'May 15, 2026',
    nights: 5,
    guests: 2,
    amount: 12500,
    status: 'upcoming',
    paymentStatus: 'paid',
    propertyId: 'p1',
    hostId: 'host_123',
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'b2',
    guestName: 'Amit Kumar',
    guestAvatar: 'https://i.pravatar.cc/50?img=3',
    property: 'Cozy Room Indiranagar',
    propertyImage: 'https://picsum.photos/100/100?random=2',
    checkIn: 'May 12, 2026',
    checkOut: 'May 14, 2026',
    nights: 2,
    guests: 1,
    amount: 4800,
    status: 'upcoming',
    paymentStatus: 'paid',
    propertyId: 'p2',
    hostId: 'host_123',
    createdAt: '2026-05-02T00:00:00Z',
  },
  {
    id: 'b3',
    guestName: 'Sneha Joshi',
    guestAvatar: 'https://i.pravatar.cc/50?img=9',
    property: 'Modern Apartment Koramangala',
    propertyImage: 'https://picsum.photos/100/100?random=1',
    checkIn: 'May 18, 2026',
    checkOut: 'May 25, 2026',
    nights: 7,
    guests: 3,
    amount: 17500,
    status: 'pending',
    paymentStatus: 'pending',
    propertyId: 'p1',
    hostId: 'host_123',
    createdAt: '2026-05-03T00:00:00Z',
  },
  {
    id: 'b4',
    guestName: 'Rahul Verma',
    guestAvatar: 'https://i.pravatar.cc/50?img=7',
    property: 'Beach Villa Goa',
    propertyImage: 'https://picsum.photos/100/100?random=3',
    checkIn: 'May 1, 2026',
    checkOut: 'May 5, 2026',
    nights: 4,
    guests: 4,
    amount: 22000,
    status: 'completed',
    paymentStatus: 'paid',
    propertyId: 'p3',
    hostId: 'host_123',
    createdAt: '2026-04-25T00:00:00Z',
  },
];

const FILTER_TABS = ['All', 'Upcoming', 'Pending', 'Completed'];

// Convert HabixoBooking to CalendarBooking format
function toCalendarBookings(bookings: HabixoBooking[]): CalendarBooking[] {
  return bookings.map((b) => ({
    id: b.id,
    guestName: b.guestName,
    status: b.status === 'upcoming' ? 'confirmed' : b.status === 'pending' ? 'pending' : 'checked_out',
    checkIn: new Date(b.checkIn),
    checkOut: new Date(b.checkOut),
  }));
}

// TODO: Get hostId from auth context/storage
const HOST_ID = 'host_123';

export default function HabixoBookings() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<HabixoBooking[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await getHostBookings(HOST_ID);
      setBookings(data.length > 0 ? data : MOCK_BOOKINGS);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings. Showing cached data.');
      setBookings(MOCK_BOOKINGS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  // Handle booking confirm
  const handleConfirm = useCallback(async (bookingId: string) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to accept this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateBookingStatus(bookingId, 'completed');
              setBookings((prev) =>
                prev.map((b) =>
                  b.id === bookingId ? { ...b, status: 'upcoming' } : b
                )
              );
              Alert.alert('Success', 'Booking confirmed!');
            } catch (err) {
              Alert.alert('Error', 'Failed to confirm booking');
            }
          },
        },
      ]
    );
  }, []);

  // Handle booking decline
  const handleDecline = useCallback(async (bookingId: string) => {
    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateBookingStatus(bookingId, 'cancelled');
              setBookings((prev) =>
                prev.map((b) =>
                  b.id === bookingId ? { ...b, status: 'cancelled' } : b
                )
              );
              Alert.alert('Success', 'Booking declined');
            } catch (err) {
              Alert.alert('Error', 'Failed to decline booking');
            }
          },
        },
      ]
    );
  }, []);

  // Handle booking press
  const handleBookingPress = useCallback((bookingId: string) => {
    router.push(`/habixo/bookings/${bookingId}`);
  }, [router]);

  // Filter bookings based on active tab
  const filteredBookings = activeFilter === 'All'
    ? bookings
    : bookings.filter(b => b.status.toLowerCase() === activeFilter.toLowerCase());

  // Calculate stats
  const upcomingCount = bookings.filter(b => b.status === 'upcoming').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const thisMonthEarnings = bookings
    .filter(b => b.status === 'completed' && b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  // Get calendar bookings
  const calendarBookings = toCalendarBookings(bookings);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{(thisMonthEarnings / 1000).toFixed(1)}K</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Toggle: List / Calendar */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleButton, !showCalendar && styles.viewToggleActive]}
          onPress={() => setShowCalendar(false)}
        >
          <Text style={[styles.viewToggleText, !showCalendar && styles.viewToggleTextActive]}>
            📋 List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleButton, showCalendar && styles.viewToggleActive]}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={[styles.viewToggleText, showCalendar && styles.viewToggleTextActive]}>
            📅 Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {FILTER_TABS.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCalendar ? (
        // Calendar View
        <ScrollView style={styles.calendarContainer}>
          <BookingCalendar
            bookings={calendarBookings}
            onDateSelect={(date) => {
              console.log('Selected date:', date);
            }}
          />
        </ScrollView>
      ) : (
        // List View with Swipeable Cards
        <ScrollView style={styles.bookingsList} refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#6366f1']} />
        }>
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No bookings found</Text>
            </View>
          ) : (
            filteredBookings.map((booking) => (
              <SwipeableBookingCard
                key={booking.id}
                id={booking.id}
                guestName={booking.guestName}
                guestAvatar={booking.guestAvatar}
                propertyName={booking.property}
                checkIn={booking.checkIn}
                checkOut={booking.checkOut}
                amount={booking.amount}
                status={booking.status}
                paymentStatus={booking.paymentStatus}
                onConfirm={handleConfirm}
                onDecline={handleDecline}
                onPress={handleBookingPress}
              >
                {/* Quick Action Buttons */}
                <QuickActionButtons
                  onConfirm={booking.status === 'pending' ? () => handleConfirm(booking.id) : undefined}
                  onDecline={booking.status === 'pending' ? () => handleDecline(booking.id) : undefined}
                  onMessage={() => console.log('Message', booking.id)}
                  onCall={() => console.log('Call', booking.id)}
                />
              </SwipeableBookingCard>
            ))
          )}
        </ScrollView>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📅</Text>
          <Text style={styles.actionText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📞</Text>
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  viewToggleActive: {
    backgroundColor: '#6366f1',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  viewToggleTextActive: {
    color: '#fff',
  },
  filterTabs: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#6366f1',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  bookingsList: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  guestMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingBody: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#6b7280',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
  },
});
