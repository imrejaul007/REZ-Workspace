// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Salon My Bookings Page
 * View and manage salon appointments
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { CardGridSkeleton } from '@/components/skeletons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { useIsMounted } from '@/hooks/useIsMounted';

const COLORS = {
  primary: colors.brand.pink,
  primaryDark: '#F43F5E',
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: Colors.success,
  background: colors.background.secondary,
  amber: Colors.warning,
  error: Colors.error,
};

export interface SalonBooking {
  id: string;
  salonName: string;
  salonImage?: string;
  serviceName: string;
  stylistName?: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show';
  bookingNumber: string;
}

const SalonMyBookingsPage: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  const [bookings, setBookings] = useState<SalonBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<SalonBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<SalonBooking | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SalonBooking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Mock data for demonstration
  const mockBookings: SalonBooking[] = [
    {
      id: '1',
      salonName: 'Luxe Hair & Beauty Studio',
      serviceName: 'Hair Coloring',
      stylistName: 'Priya Sharma',
      date: '2026-05-15',
      time: '10:00 AM',
      duration: 120,
      price: 2500,
      status: 'upcoming',
      bookingNumber: 'SAL-2026-001',
    },
    {
      id: '2',
      salonName: 'Glow Spa & Wellness',
      serviceName: 'Aromatherapy Massage',
      stylistName: 'Anita Patel',
      date: '2026-05-18',
      time: '2:30 PM',
      duration: 90,
      price: 1800,
      status: 'upcoming',
      bookingNumber: 'SAL-2026-002',
    },
    {
      id: '3',
      salonName: 'Style Studio Unisex Salon',
      serviceName: 'Haircut & Styling',
      stylistName: 'Rahul Verma',
      date: '2026-04-20',
      time: '11:00 AM',
      duration: 60,
      price: 800,
      status: 'completed',
      bookingNumber: 'SAL-2026-003',
    },
    {
      id: '4',
      salonName: 'Nail Artistry by Priya',
      serviceName: 'Gel Manicure',
      date: '2026-04-10',
      time: '3:00 PM',
      duration: 45,
      price: 800,
      status: 'completed',
      bookingNumber: 'SAL-2026-004',
    },
    {
      id: '5',
      salonName: 'Bridal Makeup by Meera',
      serviceName: 'Party Makeup',
      stylistName: 'Meera Joshi',
      date: '2026-03-15',
      time: '9:00 AM',
      duration: 120,
      price: 5000,
      status: 'cancelled',
      bookingNumber: 'SAL-2026-005',
    },
  ];

  const fetchBookings = useCallback(async () => {
    try {
      // In production, use API call:
      // const response = await serviceBookingApi.getUserBookings({ category: 'salon' });

      // Using mock data
      if (!isMounted()) return;
      setBookings(mockBookings);
    } catch (error) {
      if (!isMounted()) return;
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
      if (!isMounted()) return;
      setIsRefreshing(false);
    }
  }, [isMounted]);

  useEffect(() => {
    setIsLoading(true);
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings by tab
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === 'upcoming') {
      const upcoming = bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate >= today && b.status === 'upcoming';
      });
      setFilteredBookings(upcoming);
    } else {
      const past = bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate < today || b.status !== 'upcoming';
      });
      setFilteredBookings(past);
    }
  }, [activeTab, bookings]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelPress = (booking: SalonBooking) => {
    setBookingToCancel(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    setCancellingId(bookingToCancel.id);
    setShowCancelModal(false);

    try {
      // In production, use API call:
      // await serviceBookingApi.cancelBooking(bookingToCancel.id, cancelReason);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!isMounted()) return;
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id ? { ...b, status: 'cancelled' as const } : b
        )
      );
      if (!isMounted()) return;
      Alert.alert('Booking Cancelled', 'Your appointment has been cancelled successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    } finally {
      if (!isMounted()) return;
      setCancellingId(null);
    }
  };

  const handleReschedulePress = (booking: SalonBooking) => {
    setSelectedBooking(booking);
    setShowRescheduleModal(true);
  };

  const handleReschedule = () => {
    if (!selectedBooking) return;
    setShowRescheduleModal(false);
    // Navigate to booking page with existing booking details
    router.push({
      pathname: `/salon/book/${selectedBooking.id}` as unknown,
      params: {
        salonName: selectedBooking.salonName,
        serviceName: selectedBooking.serviceName,
        reschedule: 'true',
        originalBookingId: selectedBooking.id,
      },
    } as unknown);
  };

  const handleReviewPress = (booking: SalonBooking) => {
    setSelectedBooking(booking);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedBooking) return;

    setSubmittingReview(true);
    try {
      // In production, use API call:
      // await reviewService.createReview({
      //   storeId: selectedBooking.salonId,
      //   bookingId: selectedBooking.id,
      //   rating: reviewRating,
      //   comment: reviewComment,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!isMounted()) return;
      setShowReviewModal(false);
      Alert.alert('Review Submitted', 'Thank you for your review!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      if (!isMounted()) return;
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return COLORS.green500;
      case 'completed':
        return COLORS.amber;
      case 'cancelled':
      case 'no_show':
        return COLORS.error;
      default:
        return COLORS.gray600;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CardGridSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <Text style={styles.headerTitle}>My Salon Bookings</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
          >
            <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
              Past
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Empty State */}
        {filteredBookings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💇‍♀️</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming'
                ? 'Book a service at a salon to see your upcoming appointments here'
                : 'Your completed appointments will appear here'}
            </Text>
            {activeTab === 'upcoming' && (
              <Pressable
                style={styles.browseButton}
                onPress={() => router.push('/salon' as unknown)}
              >
                <Text style={styles.browseButtonText}>Browse Salons</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Bookings List */}
        {filteredBookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                {getStatusText(booking.status)}
              </Text>
            </View>

            {/* Salon Info */}
            <View style={styles.salonInfo}>
              <View style={styles.salonIcon}>
                <Ionicons name="cut" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.salonDetails}>
                <Text style={styles.salonName}>{booking.salonName}</Text>
                <Text style={styles.serviceName}>{booking.serviceName}</Text>
              </View>
            </View>

            {/* Booking Details */}
            <View style={styles.bookingDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.gray600} />
                <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.gray600} />
                <Text style={styles.detailText}>{booking.time}</Text>
              </View>
              {booking.stylistName && (
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color={COLORS.gray600} />
                  <Text style={styles.detailText}>{booking.stylistName}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Ionicons name="hourglass-outline" size={16} color={COLORS.gray600} />
                <Text style={styles.detailText}>{booking.duration} minutes</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>
                  {currencySymbol}
                  {booking.price.toLocaleString()}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {booking.status === 'upcoming' && (
                  <>
                    <Pressable
                      style={styles.rescheduleButton}
                      onPress={() => handleReschedulePress(booking)}
                    >
                      <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                    </Pressable>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => handleCancelPress(booking)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                      ) : (
                        <>
                          <Ionicons name="close-outline" size={14} color={COLORS.error} />
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </>
                      )}
                    </Pressable>
                  </>
                )}
                {booking.status === 'completed' && (
                  <Pressable
                    style={styles.reviewButton}
                    onPress={() => handleReviewPress(booking)}
                  >
                    <Ionicons name="star-outline" size={14} color={COLORS.amber} />
                    <Text style={styles.reviewButtonText}>Write Review</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Booking Number */}
            <View style={styles.bookingNumberContainer}>
              <Text style={styles.bookingNumberLabel}>Booking #</Text>
              <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="alert-circle" size={32} color={COLORS.error} />
            </View>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this appointment?
            </Text>

            <TextInput
              style={styles.cancelReasonInput}
              placeholder="Reason for cancellation (optional)"
              placeholderTextColor={COLORS.gray600}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelText}>Keep Booking</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={confirmCancelBooking}
              >
                <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="calendar" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalMessage}>
              Would you like to reschedule this appointment to a different date and time?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowRescheduleModal(false)}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: COLORS.primary }]}
                onPress={handleReschedule}
              >
                <Text style={[styles.modalConfirmText, { color: colors.text.inverse }]}>Yes, Reschedule</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <Text style={styles.modalMessage}>
              How was your experience at {selectedBooking?.salonName}?
            </Text>

            {/* Star Rating */}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setReviewRating(star)}>
                  <Ionicons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={32}
                    color={COLORS.amber}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              placeholderTextColor={COLORS.gray600}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: COLORS.primary }]}
                onPress={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={[styles.modalConfirmText, { color: colors.text.inverse }]}>Submit</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  browseButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    ...Shadows.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  salonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  salonIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  salonDetails: {
    flex: 1,
  },
  salonName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: 2,
  },
  serviceName: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  bookingDetails: {
    backgroundColor: COLORS.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.body,
    color: colors.text.secondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  priceLabel: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  priceValue: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  rescheduleButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${COLORS.error}10`,
  },
  cancelButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: COLORS.error,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: `${COLORS.amber}15`,
  },
  reviewButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: COLORS.amber,
  },
  bookingNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    gap: Spacing.xs,
  },
  bookingNumberLabel: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  bookingNumber: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...Typography.body,
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  cancelReasonInput: {
    width: '100%',
    backgroundColor: COLORS.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Typography.body,
    color: colors.nileBlue,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  reviewInput: {
    width: '100%',
    backgroundColor: COLORS.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Typography.body,
    color: colors.nileBlue,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(SalonMyBookingsPage, 'SalonMyBookings');
