// @ts-nocheck
import { colors } from '@/constants/theme';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// My Bookings Page
// Shows user's service bookings with travel-specific enhancements

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { CardGridSkeleton } from '@/components/skeletons';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import serviceBookingApi, { ServiceBooking } from '@/services/serviceBookingApi';
import serviceAppointmentApi from '@/services/serviceAppointmentApi';
import CashbackStatusBadge from '@/components/travel/CashbackStatusBadge';
import { getMyBookings, cancelBooking, OtaBooking } from '@/services/hotelOtaApi';
import { showToast } from '@/components/common/ToastManager';
import { useGetCurrencySymbol, useIsAuthenticated } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useTheme } from '@/contexts/ThemeContext';

const TRAVEL_SLUGS = ['flights', 'hotels', 'trains', 'bus', 'cab', 'packages'];
const EDUCATION_KEYWORDS = ['class', 'course', 'tutorial', 'workshop', 'enrollment', 'lesson', 'training'];

const CATEGORY_ICONS: Record<string, string> = {
  flights: 'airplane',
  hotels: 'bed',
  trains: 'train',
  bus: 'bus',
  cab: 'car',
  packages: 'briefcase',
};

const isTravelBooking = (booking: ServiceBooking): boolean => {
  const slug = booking.serviceCategory?.slug || '';
  return TRAVEL_SLUGS.includes(slug) || !!booking.travelDetails;
};

const MyBookingsPage = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const getCurrencySymbol = useGetCurrencySymbol();
  const { isDark, themeColors } = useTheme();

  // Screen fade-in animation
  const fadeAnim = useSharedValue(0);
  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 250, easing: Easing.ease });
  }, [fadeAnim]);
  const currencySymbol = getCurrencySymbol();
  const isAuthenticated = useIsAuthenticated();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'courses' | 'hotels'>('upcoming');
  const [hotelBookings, setHotelBookings] = useState<OtaBooking[]>([]);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Pagination state for bookings
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allBookings, setAllBookings] = useState<ServiceBooking[]>([]);
  // SS-D002 FIX: Track which booking IDs currently have a cancel in-flight so
  // the button is disabled (preventing double-tap race) and the UI shows a
  // local "cancelling" state before the API responds.
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  // Ref that keeps fetchBookings stable across the cancel handler closure
  const fetchBookingsRef = useRef<() => void>(() => {});
  // Skip the first render in the activeTab useEffect — useFocusEffect handles initial mount fetch
  const isFirstTabRender = useRef(true);

  const fetchBookings = useCallback(
    async (opts: { reset?: boolean } = {}) => {
      const { reset = false } = opts;
      try {
        if (reset) {
          setLoading(true);
          setPage(1);
          setHasMore(true);
          setAllBookings([]);
        }
        setErrorMessage(null);

        if (!isAuthenticated) {
          setErrorMessage('Please login to view your bookings');
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch both ServiceBooking (cart/checkout flow) and ServiceAppointment (direct booking flow) in parallel
        const [response, appointmentsResponse] = await Promise.all([
          serviceBookingApi.getUserBookings({ page: reset ? 1 : page, limit: 50 }).catch(() => null),
          serviceAppointmentApi.getUserServiceAppointments(reset ? 1 : page, 50).catch(() => null),
        ]);

        // BUG 1 FIX: Normalize appointments independently so they always appear,
        // even when the ServiceBooking API fails or returns no data.
        const rawAppointments: unknown[] =
          appointmentsResponse?.data?.appointments ??
          (Array.isArray(appointmentsResponse?.data as unknown) ? (appointmentsResponse?.data as unknown) : []);

        const normalizedAppointments: ServiceBooking[] = rawAppointments.map(
          (appt) =>
            ({
              _id: appt._id || appt.appointmentId || appt.id,
              bookingNumber: appt.appointmentNumber || appt.id,
              user: appt.userId || '',
              service: {
                _id: appt.serviceId || '',
                name: appt.serviceType || 'Appointment',
                images: [],
                pricing: { original: 0, selling: 0 },
              },
              serviceCategory: { _id: '', name: 'Appointment', slug: 'appointments', icon: 'calendar' },
              store: appt.store || { name: '' },
              merchantId: '',
              customerName: appt.customerName || '',
              customerPhone: appt.customerPhone || '',
              bookingDate: appt.appointmentDate || appt.date,
              timeSlot: { start: appt.appointmentTime || appt.time || '09:00', end: '' },
              duration: appt.duration || 60,
              serviceType: 'store' as const,
              pricing: { basePrice: 0, total: 0, currency: 'INR' },
              paymentStatus: 'pending' as const,
              status: appt.status === 'no-show' ? 'no_show' : appt.status,
              cashbackStatus: 'pending' as const,
              verificationDays: 0,
              isRescheduled: false,
              rescheduleCount: 0,
              maxReschedules: 2,
              requiresPaymentUpfront: false,
              createdAt: appt.createdAt || new Date().toISOString(),
              updatedAt: appt.updatedAt || new Date().toISOString(),
              _isServiceAppointment: true,
            }) as unknown,
        );

        const serviceBookings: ServiceBooking[] =
          response?.success && Array.isArray(response.data) ? response.data : [];

        if (serviceBookings.length > 0 || normalizedAppointments.length > 0) {
          let filteredBookings = [...serviceBookings, ...normalizedAppointments];

          if (activeTab === 'courses') {
            // ED-02: Filter education-related bookings
            filteredBookings = filteredBookings.filter((booking) => {
              const sType = (booking as unknown).serviceType?.toLowerCase() || '';
              const catSlug = booking.serviceCategory?.slug?.toLowerCase() || '';
              return EDUCATION_KEYWORDS.some((kw) => sType.includes(kw) || catSlug.includes(kw));
            });
            filteredBookings.sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
          } else if (activeTab === 'upcoming') {
            // SS-008 FIX: Removed isMounted() guard inside .filter() — it returns undefined (falsy),
            // incorrectly excluding all bookings when the check fires.
            filteredBookings = filteredBookings.filter((booking) => {
              const bookingDate = new Date(booking.bookingDate);
              bookingDate.setHours(0, 0, 0, 0);
              const isFuture = bookingDate >= today;
              const isActive =
                booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'no_show';
              return isFuture && isActive;
            });
            filteredBookings.sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
          } else {
            // SS-008 FIX: Same — removed erroneous isMounted() early-return inside filter
            filteredBookings = filteredBookings.filter((booking) => {
              const bookingDate = new Date(booking.bookingDate);
              bookingDate.setHours(0, 0, 0, 0);
              const isPast = bookingDate < today;
              const isCompleted =
                booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show';
              return isPast || isCompleted;
            });
            filteredBookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
          }

          if (!isMounted()) return;
          // Pagination: append data if loading more, replace if resetting
          const newAllBookings = reset ? filteredBookings : [...allBookings, ...filteredBookings];
          setAllBookings(newAllBookings);
          setBookings(newAllBookings);
          setHasMore(filteredBookings.length >= 50);
        } else {
          // No bookings or appointments found
          if (!isMounted()) return;
          if (reset) {
            setBookings([]);
            setAllBookings([]);
          }
          setHasMore(false);
        }
      } catch (error) {
        if (!isMounted()) return;
        setBookings([]);
        setAllBookings([]);
        setHasMore(false);
      } finally {
        if (!isMounted()) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isAuthenticated, activeTab, page],
  );

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings]),
  );

  useEffect(() => {
    // Skip initial mount — useFocusEffect already handles the first fetch
    if (isFirstTabRender.current) {
      isFirstTabRender.current = false;
      return;
    }
    fetchBookings();
  }, [fetchBookings, activeTab]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setAllBookings([]);
    fetchBookings({ reset: true });
  }, [fetchBookings]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || activeTab === 'hotels' || activeTab === 'courses') return;
    setLoadingMore(true);
    setPage((prev) => prev + 1);
  }, [loadingMore, hasMore, activeTab]);

  // SS-D002 FIX: Keep fetchBookings accessible inside handleCancelBooking
  // without making it a dependency (avoids stale-closure re-creation loop).
  useEffect(() => {
    fetchBookingsRef.current = fetchBookings;
  });

  // Fetch hotel OTA bookings when Hotels tab is active
  useEffect(() => {
    if (activeTab !== 'hotels') return;
    let cancelled = false;
    setHotelLoading(true);
    getMyBookings(1, 20)
      .then((res) => {
        if (!cancelled) setHotelBookings(res.bookings ?? []);
      })
      .catch(() => {
        if (!cancelled) setHotelBookings([]);
      })
      .finally(() => {
        if (!cancelled) setHotelLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Keep a ref to the current bookings so the cancel handler can read it without
  // adding bookings to the useCallback dep array (which would re-create the handler on every render)
  const bookingsRef = useRef<ServiceBooking[]>([]);
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  const handleCancelBooking = useCallback(
    async (bookingId: string) => {
      // SS-D002 FIX: If a cancel is already in-flight for this booking, ignore the
      // duplicate tap — prevents race where two PATCH requests race each other.
      if (cancellingIds.has(bookingId)) return;

      // Determine whether this is a ServiceAppointment (Pattern A) or ServiceBooking (Pattern B)
      // so we call the correct cancel endpoint.
      const targetBooking = bookingsRef.current.find((b) => b._id === bookingId);
      const isServiceAppt = (targetBooking as unknown)?._isServiceAppointment === true;

      platformAlertDestructive(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        async () => {
          // SS-D002 FIX: Lock this booking's Cancel button immediately.
          setCancellingIds((prev) => new Set(prev).add(bookingId));

          // SS-D002 FIX: Optimistic local state update.
          let previousBookings: ServiceBooking[] = [];
          setBookings((prev) => {
            previousBookings = prev;
            return prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' as unknown } : b));
          });

          try {
            // Route to the correct cancel API based on booking type.
            const response = isServiceAppt
              ? await serviceAppointmentApi.cancelServiceAppointment(bookingId)
              : await serviceBookingApi.cancelBooking(bookingId);

            if (response.success) {
              // For ServiceAppointment, response.data has shape { message, appointment }
              const updatedRecord = isServiceAppt
                ? ((response.data as unknown)?.appointment ?? response.data)
                : response.data;

              if (updatedRecord) {
                setBookings((prev) =>
                  prev.map((b) => (b._id === bookingId ? { ...b, ...updatedRecord, status: 'cancelled' as unknown } : b)),
                );
              }
              platformAlertSimple('Success', 'Booking cancelled successfully');
              // Full refresh in the background to sync other fields (e.g. cashback reversal)
              fetchBookingsRef.current();
            } else {
              // SS-D002 FIX: Revert optimistic update on API failure.
              setBookings(previousBookings);
              platformAlertSimple('Error', (response as unknown).error || 'Failed to cancel booking');
            }
          } catch (error) {
            // SS-D002 FIX: Revert on network / unexpected error too.
            setBookings(previousBookings);
            platformAlertSimple('Error', 'Failed to cancel booking');
          } finally {
            // SS-D002 FIX: Always release the lock so the button re-enables on error.
            setCancellingIds((prev) => {
              const next = new Set(prev);
              next.delete(bookingId);
              return next;
            });
          }
        },
        'Yes, Cancel',
      );
    },
    [cancellingIds],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return colors.nileBlue;
      case 'pending':
        return Colors.warning;
      case 'completed':
        return Colors.info;
      case 'cancelled':
      case 'no_show':
        return Colors.error;
      case 'assigned':
      case 'in_progress':
        return Colors.brand.purple;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    // ETHAN: crash guard — split could return incomplete array; parseInt could return NaN
    const parts = timeStr.split(':').map((x) => parseInt(x, 10));
    const hours = !isNaN(parts[0]) ? parts[0] : 0;
    const minutes = !isNaN(parts[1]) ? parts[1] : 0;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderTravelBooking = useCallback(
    ({ item }: { item: ServiceBooking }) => {
      // SS-D002 FIX: canCancel also checks that no cancel is in-flight for this item
      const isCancelling = cancellingIds.has(item._id);
      const canCancel = (item.status === 'confirmed' || item.status === 'pending') && !isCancelling;
      const bookingDate = new Date(item.bookingDate);
      const isUpcoming = bookingDate > new Date();
      const route = item.travelDetails?.route;
      const categorySlug = item.serviceCategory?.slug || '';
      const categoryIcon = CATEGORY_ICONS[categorySlug] || 'airplane';
      const cashbackAmount = item.pricing?.cashbackEarned || 0;

      return (
        <Pressable
          style={styles.bookingCard}
          onPress={() => router.push(`/booking-detail?bookingId=${item._id}` as unknown as string)}
        >
          {/* Header with category icon */}
          <View style={styles.cardHeader}>
            <View style={styles.travelHeaderLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: '#F0F9FF' }]}>
                <Ionicons name={categoryIcon as unknown} size={20} color={colors.nileBlue} />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName} numberOfLines={1}>
                  {item.service?.name || item.serviceCategory?.name || 'Travel'}
                </Text>
                {route ? (
                  <View style={styles.routeBadge}>
                    <Text style={styles.routeText}>
                      {route.fromCode || route.from} → {route.toCode || route.to}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.storeName} numberOfLines={1}>
                    {item.store?.name || ''}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.detailText}>{formatDate(item.bookingDate)}</Text>
            </View>
            {item.travelDetails?.class && (
              <View style={styles.detailRow}>
                <Ionicons name="star-outline" size={16} color={colors.text.tertiary} />
                <Text style={styles.detailText}>{item.travelDetails.class}</Text>
              </View>
            )}
            {item.travelDetails?.passengers && (
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={16} color={colors.text.tertiary} />
                <Text style={styles.detailText}>
                  {item.travelDetails.passengers.adults} Adult{item.travelDetails.passengers.adults !== 1 ? 's' : ''}
                  {(item.travelDetails.passengers.children || 0) > 0
                    ? `, ${item.travelDetails.passengers.children} Child`
                    : ''}
                </Text>
              </View>
            )}
            {item.pnr && (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={16} color={colors.text.tertiary} />
                <Text style={styles.detailText}>PNR: {item.pnr}</Text>
              </View>
            )}
          </View>

          {/* Footer: price + cashback + cancel */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>
                  {currencySymbol}
                  {(item.pricing?.total || item.pricing?.basePrice || 0).toLocaleString()}
                </Text>
              </View>
              {cashbackAmount > 0 && item.cashbackStatus && (
                <CashbackStatusBadge
                  status={item.cashbackStatus}
                  amount={cashbackAmount}
                  verificationDays={item.verificationDays}
                  creditedAt={item.cashbackCreditedAt}
                  currencySymbol={currencySymbol}
                  compact
                />
              )}
            </View>
            {/* SS-D002 FIX: disable button while cancel API call is in-flight */}
            {(canCancel || isCancelling) && isUpcoming && (
              <Pressable
                style={[styles.cancelButton, isCancelling && { opacity: 0.5 }]}
                disabled={isCancelling}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCancelBooking(item._id);
                }}
              >
                <Text style={styles.cancelButtonText}>{isCancelling ? 'Cancelling…' : 'Cancel'}</Text>
              </Pressable>
            )}
          </View>

          {/* Booking Number */}
          {item.bookingNumber && (
            <View style={styles.bookingNumberContainer}>
              <Text style={styles.bookingNumberLabel}>Booking #</Text>
              <Text style={styles.bookingNumber}>{item.bookingNumber}</Text>
            </View>
          )}
        </Pressable>
      );
    },
    [router, currencySymbol, handleCancelBooking, cancellingIds],
  );

  const renderStandardBooking = useCallback(
    ({ item }: { item: ServiceBooking }) => {
      // SS-D002 FIX: canCancel also checks that no cancel is in-flight for this item
      const isCancelling = cancellingIds.has(item._id);
      const canCancel = (item.status === 'confirmed' || item.status === 'pending') && !isCancelling;
      const bookingDate = new Date(item.bookingDate);
      const isUpcoming = bookingDate > new Date();

      return (
        <Pressable
          style={styles.bookingCard}
          onPress={() => router.push(`/booking-detail?bookingId=${item._id}` as unknown as string)}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {item.service?.name || 'Service'}
              </Text>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.store?.name || 'Store'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.bookingDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.detailText}>{formatDate(item.bookingDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.detailText}>
                {formatTime(item.timeSlot?.start)} - {formatTime(item.timeSlot?.end)}
              </Text>
            </View>
            {item.duration > 0 && (
              <View style={styles.detailRow}>
                <Ionicons name="hourglass-outline" size={16} color={colors.text.tertiary} />
                <Text style={styles.detailText}>{item.duration} minutes</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.priceValue}>
                {currencySymbol}
                {(item.pricing?.total || item.pricing?.basePrice || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.footerActions}>
              {canCancel && isUpcoming && (
                <Pressable
                  style={styles.rescheduleButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/booking/reschedule/${item._id}` as unknown as string);
                  }}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.nileBlue} />
                  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </Pressable>
              )}
              {/* SS-D002 FIX: disable button while cancel API call is in-flight */}
              {(canCancel || isCancelling) && isUpcoming && (
                <Pressable
                  style={[styles.cancelButton, isCancelling && { opacity: 0.5 }]}
                  disabled={isCancelling}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCancelBooking(item._id);
                  }}
                >
                  <Text style={styles.cancelButtonText}>{isCancelling ? 'Cancelling…' : 'Cancel'}</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Booking Number */}
          {item.bookingNumber && (
            <View style={styles.bookingNumberContainer}>
              <Text style={styles.bookingNumberLabel}>Booking #</Text>
              <Text style={styles.bookingNumber}>{item.bookingNumber}</Text>
            </View>
          )}
        </Pressable>
      );
    },
    [router, currencySymbol, handleCancelBooking, cancellingIds],
  );

  const renderBooking = useCallback(
    ({ item }: { item: ServiceBooking }) => {
      if (isTravelBooking(item)) {
        return renderTravelBooking({ item });
      }
      return renderStandardBooking({ item });
    },
    [renderTravelBooking, renderStandardBooking],
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color={colors.border.default} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'upcoming'
          ? 'No Upcoming Bookings'
          : activeTab === 'courses'
            ? 'No Courses'
            : 'No Past Bookings'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'upcoming'
          ? 'Book a service to see your upcoming appointments here'
          : activeTab === 'courses'
            ? 'Enroll in a course to get started'
            : 'Your completed bookings will appear here'}
      </Text>
      {(activeTab === 'upcoming' || activeTab === 'courses') && (
        <Pressable style={styles.browseButton} onPress={() => router.push('/(tabs)' as unknown)}>
          <Ionicons name={activeTab === 'courses' ? 'book-outline' : 'search'} size={20} color={colors.text.inverse} />
          <Text style={styles.browseButtonText}>{activeTab === 'courses' ? 'Explore Courses' : 'Browse Services'}</Text>
        </Pressable>
      )}
    </View>
  );

  const fadeAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  if (loading && !refreshing && bookings.length === 0) {
    return <CardGridSkeleton />;
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: themeColors.background.secondary }]}
      edges={['top']}
    >
      <Animated.View style={[{ flex: 1 }, fadeAnimStyle]} pointerEvents="box-none">
        {/* Header */}
        <LinearGradient colors={[colors.nileBlue, '#0f2a3d']} style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.backButton}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <View style={styles.headerRight} />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'past' && styles.activeTab]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Past</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
              onPress={() => setActiveTab('courses')}
            >
              <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>Courses</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'hotels' && styles.activeTab]}
              onPress={() => setActiveTab('hotels')}
            >
              <Text style={[styles.tabText, activeTab === 'hotels' && styles.activeTabText]}>Hotels</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.error} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Hotel Bookings Tab */}
        {activeTab === 'hotels' ? (
          hotelLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.nileBlue} />
            </View>
          ) : hotelBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bed-outline" size={80} color={colors.border.default} />
              <Text style={styles.emptyTitle}>No Hotel Bookings</Text>
              <Text style={styles.emptyText}>Book a hotel to see your stays here</Text>
              <Pressable style={styles.browseButton} onPress={() => router.push('/travel/hotels' as unknown as string)}>
                <Ionicons name="bed-outline" size={20} color={colors.text.inverse} />
                <Text style={styles.browseButtonText}>Browse Hotels</Text>
              </Pressable>
            </View>
          ) : (
            <FlashList
              data={hotelBookings}
              keyExtractor={(item) => item.id}
              estimatedItemSize={140}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: OtaBooking }) => {
                // ENUM-10 FIX: 'hold' is not a real ServiceBooking status — removed from
                // status map and canCancel check. OTA bookings start at 'pending' or 'confirmed'.
                const statusColor =
                  {
                    hold: '#F59E0B',
                    pending: '#F59E0B',
                    confirmed: '#0891B2',
                    cancelled: '#EF4444',
                    completed: '#16A34A',
                  }[item.status] ?? '#6B7280';
                const canCancel = item.status === 'confirmed' || item.status === 'hold';
                const canReview = item.status === 'completed';
                return (
                  <Pressable
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 14,
                      marginBottom: 12,
                      padding: 14,
                      shadowColor: '#000',
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}
                    onPress={() => router.push(`/travel/hotels/booking/${item.id}` as unknown as string)}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                          {item.hotelName}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.roomTypeName}</Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: `${statusColor}18`,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="calendar-outline" size={12} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          {item.checkinDate} → {item.checkoutDate}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="people-outline" size={12} color="#64748B" />
                        <Text style={{ fontSize: 12, color: '#64748B' }}>
                          {item.numGuests} guests · {item.numRooms} room{item.numRooms !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: canCancel || canReview ? 10 : 0,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#94A3B8' }}>Ref: {item.bookingRef}</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                        ₹{Math.round(item.totalValuePaise / 100).toLocaleString()}
                      </Text>
                    </View>
                    {(canCancel || canReview) && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {canReview && (
                          <Pressable
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              backgroundColor: '#0891B2',
                              borderRadius: 8,
                              paddingVertical: 8,
                            }}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push({
                                pathname: '/travel/hotels/[id]/review' as unknown,
                                params: { id: item.hotelId, bookingRef: item.bookingRef, hotelName: item.hotelName },
                              });
                            }}
                          >
                            <Ionicons name="star" size={13} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Write Review</Text>
                          </Pressable>
                        )}
                        {canCancel && (
                          <Pressable
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              borderWidth: 1.5,
                              borderColor: '#EF4444',
                              borderRadius: 8,
                              paddingVertical: 8,
                            }}
                            onPress={(e) => {
                              e.stopPropagation();
                              Alert.alert('Cancel Booking', `Cancel booking at ${item.hotelName}?`, [
                                { text: 'Keep', style: 'cancel' },
                                {
                                  text: 'Cancel',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      await cancelBooking(item.id, 'Cancelled by guest');
                                      setHotelBookings((prev) =>
                                        prev.map((b) => (b.id === item.id ? { ...b, status: 'cancelled' } : b)),
                                      );
                                    } catch (e2) {
                                      showToast({ type: 'error', message: e2.message ?? 'Cancellation failed' });
                                    }
                                  },
                                },
                              ]);
                            }}
                          >
                            <Ionicons name="close-circle-outline" size={13} color="#EF4444" />
                            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Cancel</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          )
        ) : (
          /* Regular Bookings List */
          <FlashList
            data={bookings}
            renderItem={renderBooking}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.nileBlue}
                colors={[colors.nileBlue]}
              />
            }
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.nileBlue} />
                </View>
              ) : null
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={120}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.background.primary,
  },
  tabText: {
    ...Typography.body,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeTabText: {
    color: colors.nileBlue,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  travelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
    gap: Spacing.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  serviceName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  storeName: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoScale[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  routeText: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  statusText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  bookingDetails: {
    backgroundColor: colors.background.secondary,
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
    ...Typography.bodySmall,
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  priceLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  priceValue: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: colors.nileBlue,
  },
  rescheduleButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  cancelButton: {
    backgroundColor: Colors.errorScale[50],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.error,
  },
  bookingNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: Spacing.xs,
  },
  bookingNumberLabel: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
  },
  bookingNumber: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.bodyLarge,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  browseButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorScale[50],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.body,
    color: Colors.error,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default withErrorBoundary(MyBookingsPage, 'MyBookings');
