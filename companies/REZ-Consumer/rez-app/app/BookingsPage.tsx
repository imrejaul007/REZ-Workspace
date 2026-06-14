// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useIsAuthenticated, useGetCurrencySymbol } from '@/stores/selectors';
import eventsApiService from '@/services/eventsApi';
import tableBookingApi from '@/services/tableBookingApi';
import serviceBookingService from '@/services/serviceBookingApi';
import { showConfirm, showAlert } from '@/utils/alert';
import { DetailPageSkeleton } from '@/components/skeletons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

// ─── Brand Colors ─────────────────────────────────────────────
const C = {
  primary: colors.brand.green,
  primaryDark: colors.brand.teal,
  gold: Colors.warning,
  navy: colors.nileBlue,
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.tertiary,
  bg: colors.background.secondary,
  white: colors.background.primary,
  border: colors.border.default,
  error: Colors.error,
  warning: Colors.warning,
  success: Colors.success,
  purple: colors.primary[500],
  blue: Colors.info,
  orange: colors.brand.orange,
  teal: colors.tealGreen,
};

// ─── Booking type config ─────────────────────────────────────
const BOOKING_TYPE_CONFIG = {
  table: { label: 'Table', icon: 'restaurant-outline' as const, color: C.orange, bgColor: colors.tint.orange },
  event: { label: 'Event', icon: 'ticket-outline' as const, color: C.purple, bgColor: colors.tint.purpleLight },
  service: { label: 'Service', icon: 'construct-outline' as const, color: C.blue, bgColor: colors.tint.blue },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  pending: { color: colors.warningScale[400], bg: colors.tint.amber, icon: 'time-outline' },
  confirmed: { color: colors.successScale[400], bg: colors.tint.greenLight, icon: 'checkmark-circle-outline' },
  completed: { color: colors.infoScale[400], bg: colors.tint.blue, icon: 'checkmark-done-outline' },
  cancelled: { color: colors.error, bg: colors.errorScale[50], icon: 'close-circle-outline' },
  assigned: { color: colors.primary[300], bg: colors.tint.purpleLight, icon: 'person-outline' },
  in_progress: { color: colors.brand.orange, bg: colors.tint.orange, icon: 'play-circle-outline' },
  no_show: { color: colors.neutral[500], bg: colors.neutral[50], icon: 'eye-off-outline' },
};

// ─── API Response Types ────────────────────────────────────────
interface ApiResponse<T> {
  data?: T;
  pagination?: { hasNext?: boolean; page?: number; total?: number };
  bookings?: T[];
  [key: string]: unknown;
}

interface MetaResponse {
  pagination?: { pages?: number; total?: number; page?: number };
}

// ─── Types ────────────────────────────────────────────────────
type BookingType = 'all' | 'table' | 'event' | 'service';
type StatusFilter = 'all' | 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

// BUG-042 FIX: Type the `raw` field instead of `any` to prevent unsafe property access.
// `raw` preserves the original API object for cancel/navigation/display operations that
// need type-specific fields not in the normalized shape (storeId, bookingNumber, etc.).
interface RawBookingStoreObject {
  _id?: string;
  name?: string;
  logo?: string;
  location?: { address?: string; city?: string; state?: string };
  contact?: { phone?: string };
  [key: string]: unknown;
}

interface RawBookingData {
  _id: string;
  storeId?: RawBookingStoreObject | string;
  bookingNumber?: string;
  specialRequests?: string;
  cancellationReason?: string;
  [key: string]: unknown; // Allow additional API fields without full `any`
}

interface UnifiedBooking {
  id: string;
  type: 'table' | 'event' | 'service';
  title: string;
  subtitle: string;
  image?: string;
  date: Date;
  dateLabel: string;
  timeLabel: string;
  status: string;
  referenceNumber: string;
  details: { label: string; value: string }[];
  canCancel: boolean;
  raw: RawBookingData;
}

// ─── Category tab data ────────────────────────────────────────
const TYPE_TABS: { key: BookingType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'table', label: 'Tables', icon: 'restaurant-outline' },
  { key: 'event', label: 'Events', icon: 'ticket-outline' },
  { key: 'service', label: 'Services', icon: 'construct-outline' },
];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

// ─── Helper: format date/time ─────────────────────────────────
const formatDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatDateFull = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatTime12 = (time24: string) => {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const isUpcoming = (d: Date) => d >= new Date(new Date().setHours(0, 0, 0, 0));

// ─── BUG-041 FIX: Normalize functions moved to module level to avoid
//     recreation on every render. currencySymbol passed as parameter.
interface TableBookingData {
  _id: string;
  storeId?: RawBookingStoreObject | string;
  bookingNumber?: string;
  specialRequests?: string;
  cancellationReason?: string;
  bookingDate: string;
  bookingTime?: string;
  partySize?: number;
  customerName?: string;
  customerPhone?: string;
  status?: string;
  [key: string]: unknown;
}

interface EventBookingData {
  _id: string;
  event?: { date?: string; title?: string; location?: string; image?: string; time?: string };
  bookingDate?: string;
  attendeeInfo?: { name?: string; email?: string };
  amount?: number;
  currency?: string;
  status?: string;
  bookingReference?: string;
  [key: string]: unknown;
}

interface ServiceBookingData {
  _id: string;
  bookingDate: string;
  service?: { name?: string; images?: { url?: string }[] };
  store?: { name?: string; logo?: string };
  timeSlot?: { start?: string; end?: string };
  customerName?: string;
  pricing?: { total?: number; currency?: string };
  serviceType?: string;
  duration?: number;
  status?: string;
  bookingNumber?: string;
  [key: string]: unknown;
}

const normalizeTableBooking = (b: TableBookingData): UnifiedBooking => {
  const store = b.storeId && typeof b.storeId === 'object' ? (b.storeId as RawBookingStoreObject) : null;
  const bookingDate = new Date(b.bookingDate);
  return {
    id: `table-${b._id}`,
    type: 'table',
    title: store?.name || 'Restaurant',
    subtitle: `Table for ${b.partySize} ${b.partySize === 1 ? 'guest' : 'guests'}`,
    image: store?.logo,
    date: bookingDate,
    dateLabel: formatDateFull(bookingDate),
    timeLabel: formatTime12(b.bookingTime || '00:00'),
    status: b.status || 'pending',
    referenceNumber: b.bookingNumber || b._id,
    details: [
      { label: 'Party Size', value: `${b.partySize} ${b.partySize === 1 ? 'person' : 'people'}` },
      { label: 'Customer', value: b.customerName || '' },
      ...(b.customerPhone ? [{ label: 'Phone', value: b.customerPhone }] : []),
      ...(b.specialRequests ? [{ label: 'Requests', value: b.specialRequests }] : []),
    ],
    canCancel: b.status === 'pending' || b.status === 'confirmed',
    raw: b,
  };
};

const normalizeEventBooking = (b: EventBookingData, currencySymbol: string): UnifiedBooking => {
  const eventDate = b.event?.date ? new Date(b.event.date) : new Date(b.bookingDate || Date.now());
  return {
    id: `event-${b._id}`,
    type: 'event',
    title: b.event?.title || 'Event',
    subtitle: b.event?.location || 'Location TBD',
    image: b.event?.image,
    date: eventDate,
    dateLabel: formatDateFull(eventDate),
    timeLabel: b.event?.time || '',
    status: b.status || 'pending',
    referenceNumber: b.bookingReference || b._id,
    details: [
      { label: 'Attendee', value: b.attendeeInfo?.name || '-' },
      ...(b.amount && b.amount > 0
        ? [{ label: 'Amount', value: `${b.currency || currencySymbol} ${b.amount?.toLocaleString()}` }]
        : []),
      ...(b.attendeeInfo?.email ? [{ label: 'Email', value: b.attendeeInfo.email }] : []),
    ],
    canCancel: b.status === 'pending' || b.status === 'confirmed',
    raw: b,
  };
};

const normalizeServiceBooking = (b: ServiceBookingData, currencySymbol: string): UnifiedBooking => {
  const bookingDate = new Date(b.bookingDate);
  return {
    id: `service-${b._id}`,
    type: 'service',
    title: b.service?.name || 'Service',
    subtitle: b.store?.name || 'Provider',
    image: b.service?.images?.[0]?.url || b.store?.logo,
    date: bookingDate,
    dateLabel: formatDateFull(bookingDate),
    timeLabel: b.timeSlot
      ? `${formatTime12(b.timeSlot.start || '00:00')} - ${formatTime12(b.timeSlot.end || '00:00')}`
      : '',
    status: b.status || 'pending',
    referenceNumber: b.bookingNumber || b._id,
    details: [
      { label: 'Customer', value: b.customerName || '-' },
      ...(b.pricing?.total
        ? [{ label: 'Amount', value: `${b.pricing.currency || currencySymbol} ${b.pricing.total?.toLocaleString()}` }]
        : []),
      ...(b.serviceType
        ? [{ label: 'Type', value: b.serviceType.charAt(0).toUpperCase() + b.serviceType.slice(1) }]
        : []),
      ...(b.duration ? [{ label: 'Duration', value: `${b.duration} min` }] : []),
    ],
    canCancel: b.status === 'pending' || b.status === 'confirmed' || b.status === 'assigned',
    raw: b,
  };
};

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
function BookingsPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const tintColor = useThemeColor({}, 'tint');

  const [typeFilter, setTypeFilter] = useState<BookingType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [allBookings, setAllBookings] = useState<UnifiedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Staleness guard: skip fetch if data was loaded within the last 30 seconds
  const lastLoadedAt = useRef<number>(0);
  const STALE_TTL_MS = 30_000;

  // Per-API pagination cursors
  const PAGE_SIZE = 15;
  const [tablePage, setTablePage] = useState({ page: 1, hasMore: true });
  const [eventPage, setEventPage] = useState({ offset: 0, hasMore: true });
  const [servicePage, setServicePage] = useState({ page: 1, hasMore: true });

  // Stats
  const stats = useMemo(() => {
    const s = { total: 0, upcoming: 0, tables: 0, events: 0, services: 0 };
    allBookings.forEach((b) => {
      s.total++;
      if (isUpcoming(b.date) && b.status !== 'cancelled' && b.status !== 'completed') s.upcoming++;
      if (b.type === 'table') s.tables++;
      if (b.type === 'event') s.events++;
      if (b.type === 'service') s.services++;
    });
    return s;
  }, [allBookings]);

  // ─── Sort helper ────────────────────────────────────────
  const sortBookings = (list: UnifiedBooking[]) => {
    const now = new Date();
    return [...list].sort((a, b) => {
      const aUp = a.date >= now && a.status !== 'cancelled' && a.status !== 'completed';
      const bUp = b.date >= now && b.status !== 'cancelled' && b.status !== 'completed';
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      if (aUp && bUp) return a.date.getTime() - b.date.getTime();
      return b.date.getTime() - a.date.getTime();
    });
  };

  // ─── Fetch one page from each API ─────────────────────
  const fetchPage = useCallback(
    async (tPage: number, eOffset: number, sPage: number, tHasMore: boolean, eHasMore: boolean, sHasMore: boolean) => {
      const promises: Promise<{ type: 'table' | 'event' | 'service'; bookings: RawBookingData[]; hasMore: boolean }>[] =
        [];

      if (tHasMore) {
        promises.push(
          tableBookingApi
            .getUserTableBookings({ page: tPage, limit: PAGE_SIZE })
            .then((res) => {
              const data = res.data as ApiResponse<TableBookingData[]> | TableBookingData[];
              const bookings = Array.isArray(data) ? data : (data as ApiResponse<TableBookingData[]>)?.data || [];
              const hasNext =
                (data as ApiResponse<TableBookingData[]>).pagination?.hasNext ?? bookings.length >= PAGE_SIZE;
              return { type: 'table' as const, bookings, hasMore: hasNext };
            })
            .catch((error) => {
              logger.error('[BookingsPage] Failed to load table bookings:', error);
              return { type: 'table' as const, bookings: [] as TableBookingData[], hasMore: false };
            }),
        );
      }

      if (eHasMore) {
        promises.push(
          eventsApiService
            .getUserBookings(undefined, PAGE_SIZE, eOffset)
            .then((res) => ({
              type: 'event' as const,
              bookings: (res.bookings || []) as unknown as RawBookingData[],
              hasMore: res.hasMore ?? (res.bookings || []).length >= PAGE_SIZE,
            }))
            .catch((error) => {
              logger.error('[BookingsPage] Failed to load event bookings:', error);
              return { type: 'event' as const, bookings: [] as unknown as RawBookingData[], hasMore: false };
            }),
        );
      }

      if (sHasMore) {
        promises.push(
          serviceBookingService
            .getUserBookings({ page: sPage, limit: PAGE_SIZE })
            .then((res) => {
              const response = res.data as unknown as ApiResponse<ServiceBookingData[]> | ServiceBookingData[];
              const bookings = Array.isArray(response)
                ? response
                : (response as ApiResponse<ServiceBookingData[]>)?.data || [];
              const meta = (res as unknown as { meta?: MetaResponse })?.meta;
              const totalPages = meta?.pagination?.pages || 1;
              return {
                type: 'service' as const,
                bookings: bookings as unknown as RawBookingData[],
                hasMore: sPage < totalPages && bookings.length >= PAGE_SIZE,
              };
            })
            .catch((error) => {
              logger.error('[BookingsPage] Failed to load service bookings:', error);
              return { type: 'service' as const, bookings: [] as unknown as RawBookingData[], hasMore: false };
            }),
        );
      }

      return Promise.all(promises);
    },
    [],
  );

  // ─── Initial load (page 1 of each) ────────────────────
  const loadBookings = useCallback(
    async (force = false) => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      // Skip fetch if data is fresh (within 30s TTL) unless forced (e.g. pull-to-refresh)
      if (!force && Date.now() - lastLoadedAt.current < STALE_TTL_MS) {
        setLoading(false);
        return;
      }
      try {
        setLoadError(null);
        if (!refreshing) setLoading(true);

        // Reset pagination
        const results = await fetchPage(1, 0, 1, true, true, true);

        const unified: UnifiedBooking[] = [];
        let tHasMore = false,
          eHasMore = false,
          sHasMore = false;

        results.forEach((r) => {
          if (r.type === 'table') {
            r.bookings.forEach((b) => unified.push(normalizeTableBooking(b as TableBookingData)));
            tHasMore = r.hasMore;
          } else if (r.type === 'event') {
            r.bookings.forEach((b) => unified.push(normalizeEventBooking(b as EventBookingData, currencySymbol)));
            eHasMore = r.hasMore;
          } else {
            r.bookings.forEach((b) => unified.push(normalizeServiceBooking(b as ServiceBookingData, currencySymbol)));
            sHasMore = r.hasMore;
          }
        });

        if (!isMounted()) return;
        setTablePage({ page: 2, hasMore: tHasMore });
        if (!isMounted()) return;
        setEventPage({ offset: PAGE_SIZE, hasMore: eHasMore });
        if (!isMounted()) return;
        setServicePage({ page: 2, hasMore: sHasMore });
        if (!isMounted()) return;
        setAllBookings(sortBookings(unified));
        lastLoadedAt.current = Date.now();
      } catch (error) {
        if (!isMounted()) return;
        setLoadError(error.message || 'Failed to load bookings');
      } finally {
        if (!isMounted()) return;
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, refreshing, fetchPage],
  );

  // ─── Load more (next page) ────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const anyHasMore = tablePage.hasMore || eventPage.hasMore || servicePage.hasMore;
    if (!anyHasMore) return;

    setLoadingMore(true);
    try {
      const results = await fetchPage(
        tablePage.page,
        eventPage.offset,
        servicePage.page,
        tablePage.hasMore,
        eventPage.hasMore,
        servicePage.hasMore,
      );

      const newItems: UnifiedBooking[] = [];
      let tHasMore = tablePage.hasMore,
        eHasMore = eventPage.hasMore,
        sHasMore = servicePage.hasMore;
      let tNextPage = tablePage.page,
        eNextOffset = eventPage.offset,
        sNextPage = servicePage.page;

      results.forEach((r) => {
        if (r.type === 'table') {
          r.bookings.forEach((b) => newItems.push(normalizeTableBooking(b as TableBookingData)));
          tHasMore = r.hasMore;
          tNextPage = tablePage.page + 1;
        } else if (r.type === 'event') {
          r.bookings.forEach((b) => newItems.push(normalizeEventBooking(b as EventBookingData, currencySymbol)));
          eHasMore = r.hasMore;
          eNextOffset = eventPage.offset + PAGE_SIZE;
        } else {
          r.bookings.forEach((b) => newItems.push(normalizeServiceBooking(b as ServiceBookingData, currencySymbol)));
          sHasMore = r.hasMore;
          sNextPage = servicePage.page + 1;
        }
      });

      if (!isMounted()) return;
      setTablePage({ page: tNextPage, hasMore: tHasMore });
      if (!isMounted()) return;
      setEventPage({ offset: eNextOffset, hasMore: eHasMore });
      if (!isMounted()) return;
      setServicePage({ page: sNextPage, hasMore: sHasMore });
      if (!isMounted()) return;
      setAllBookings((prev) => sortBookings([...prev, ...newItems]));
    } catch (error) {
      // silently handle
    } finally {
      if (!isMounted()) return;
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, tablePage, eventPage, servicePage, fetchPage]);

  const hasMoreData = tablePage.hasMore || eventPage.hasMore || servicePage.hasMore;

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) loadBookings();
      else setLoading(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]),
  );

  // Subscribe to booking socket events so the list refreshes when a booking is
  // cancelled or updated externally (hotel system, merchant, or another session).
  const { onOrderListUpdated } = useSocket();
  useEffect(() => {
    const unsubscribe = onOrderListUpdated(() => {
      loadBookings(true);
    });
    return unsubscribe;
  }, [onOrderListUpdated, loadBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings(true); // force bypass staleness guard on manual refresh
    if (!isMounted()) return;
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBookings]);

  // ─── Filtered list ───────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let list = allBookings;

    // Type filter
    if (typeFilter !== 'all') {
      list = list.filter((b) => b.type === typeFilter);
    }

    // Status filter
    if (statusFilter === 'upcoming') {
      list = list.filter((b) => isUpcoming(b.date) && b.status !== 'cancelled' && b.status !== 'completed');
    } else if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter);
    }

    return list;
  }, [allBookings, typeFilter, statusFilter]);

  // ─── Cancel handlers ─────────────────────────────────────
  const handleCancel = async (booking: UnifiedBooking) => {
    await new Promise<void>((resolve) => {
      showConfirm(
        'Cancel Booking',
        `Are you sure you want to cancel your booking for "${booking.title}"?`,
        () => resolve(),
        () => resolve(),
      );
    });
    const confirmed = true;
    if (!confirmed) return;

    try {
      let success = false;
      let message = '';

      if (booking.type === 'table') {
        const res = await tableBookingApi.cancelTableBooking(booking.raw._id);
        success = res.success;
        message = res.message;
      } else if (booking.type === 'event') {
        const res = await eventsApiService.cancelBooking(booking.raw._id);
        success = res.success;
        message = res.message;
      } else if (booking.type === 'service') {
        const res = await serviceBookingService.cancelBooking(booking.raw._id);
        success = !!res.success;
        message = res.message || '';
      }

      if (success) {
        showAlert('Cancelled', message || 'Your booking has been cancelled.');
        await loadBookings();
      } else {
        showAlert('Error', message || 'Failed to cancel booking.');
      }
    } catch (error) {
      showAlert('Error', error.message || 'Something went wrong.');
    }
  };

  // ─── Callbacks for tab/pill presses ─────────────────────
  const handleTypeFilterPress = useCallback((key: BookingType) => {
    setTypeFilter(key);
  }, []);

  const handleStatusFilterPress = useCallback((key: StatusFilter) => {
    setStatusFilter(key);
  }, []);

  const handleClearFilters = useCallback(() => {
    setTypeFilter('all');
    setStatusFilter('all');
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMoreData && !loadingMore) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMoreData, loadingMore]);

  // ─── Render booking card ─────────────────────────────────
  const renderBookingCard = useCallback(
    ({ item: booking }: { item: UnifiedBooking }) => {
      const typeConf = BOOKING_TYPE_CONFIG[booking.type];
      const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
      const upcoming =
        isUpcoming(booking.date) &&
        booking.status !== 'cancelled' &&
        booking.status !== 'completed' &&
        booking.status !== 'no_show';
      const isExpanded = expandedBookingId === booking.id;

      // Build expanded details from raw data
      const raw = booking.raw;
      const rawStoreObj =
        raw?.storeId && typeof raw.storeId === 'object' ? (raw.storeId as RawBookingStoreObject) : null;
      const storeLocation = rawStoreObj?.location;
      const storeContact = rawStoreObj?.contact;

      const handleExpand = () => setExpandedBookingId(isExpanded ? null : booking.id);
      const getStoreId = (rawStoreId: string | RawBookingStoreObject | undefined): string => {
        if (!rawStoreId) return '';
        if (typeof rawStoreId === 'object' && '_id' in rawStoreId) return rawStoreId._id as string;
        return rawStoreId as string;
      };
      const handleMenuPress = () => {
        const storeId = getStoreId(booking.raw?.storeId as string | RawBookingStoreObject | undefined);
        router.push({
          pathname: '/menu/[storeId]',
          params: {
            storeId: storeId || '',
            dineIn: 'true',
            table: booking.raw?.bookingNumber || '',
          },
        });
      };
      const handlePayPress = () => {
        const storeId = getStoreId(booking.raw?.storeId as string | RawBookingStoreObject | undefined);
        const store = booking.raw?.storeId && typeof booking.raw.storeId === 'object' ? booking.raw.storeId as RawBookingStoreObject : null;
        router.push({
          pathname: '/pay-in-store/enter-amount',
          params: {
            storeId: storeId || '',
            storeName: store?.name || booking.title || '',
            storeLogo: store?.logo || '',
          },
        });
      };

      return (
        <Pressable style={styles.card} onPress={handleExpand}>
          {/* Type badge + Status badge row */}
          <View style={styles.cardTopRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeConf.bgColor }]}>
              <Ionicons name={typeConf.icon} size={12} color={typeConf.color} />
              <Text style={[styles.typeBadgeText, { color: typeConf.color }]}>{typeConf.label}</Text>
            </View>
            {upcoming && (
              <View style={styles.upcomingDot}>
                <View style={styles.upcomingDotInner} />
                <Text style={styles.upcomingText}>Upcoming</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
              <Ionicons name={statusConf.icon as keyof typeof Ionicons.glyphMap} size={12} color={statusConf.color} />
              <Text style={[styles.statusBadgeText, { color: statusConf.color }]}>
                {booking.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </Text>
            </View>
          </View>

          {/* Main info row */}
          <View style={styles.cardMainRow}>
            <View style={[styles.cardIcon, { backgroundColor: typeConf.bgColor }]}>
              {booking.image ? (
                <CachedImage source={booking.image} style={styles.cardImage} />
              ) : (
                <Ionicons name={typeConf.icon} size={24} color={typeConf.color} />
              )}
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {booking.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {booking.subtitle}
              </Text>
              <View style={styles.cardDateRow}>
                <Ionicons name="calendar-outline" size={13} color={C.textTertiary} />
                <Text style={styles.cardDateText}>{booking.dateLabel}</Text>
                {booking.timeLabel ? (
                  <>
                    <Text style={styles.cardDateDot}> </Text>
                    <Ionicons name="time-outline" size={13} color={C.textTertiary} />
                    <Text style={styles.cardDateText}>{booking.timeLabel}</Text>
                  </>
                ) : null}
              </View>
            </View>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.textTertiary} />
          </View>

          {/* Detail pills */}
          <View style={styles.detailRow}>
            {(booking.details || []).slice(0, 3).map((d, i) => (
              <View key={i} style={styles.detailPill}>
                <Text style={styles.detailPillLabel}>{d.label}</Text>
                <Text style={styles.detailPillValue} numberOfLines={1}>
                  {d.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Expanded details section */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              {/* All remaining details */}
              {(booking.details || []).length > 3 &&
                (booking.details || []).slice(3).map((d, i) => (
                  <View key={`extra-${i}`} style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>{d.label}</Text>
                    <Text style={styles.expandedValue}>{d.value}</Text>
                  </View>
                ))}

              {/* Store address */}
              {storeLocation?.address && (
                <View style={styles.expandedRow}>
                  <Text style={styles.expandedLabel}>Address</Text>
                  <Text style={styles.expandedValue}>
                    {[storeLocation.address, storeLocation.city, storeLocation.state].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}

              {/* Store phone */}
              {storeContact?.phone && (
                <View style={styles.expandedRow}>
                  <Text style={styles.expandedLabel}>Restaurant Phone</Text>
                  <Text style={styles.expandedValue}>{storeContact.phone}</Text>
                </View>
              )}

              {/* Special requests (for table bookings) */}
              {raw?.specialRequests && (
                <View style={styles.expandedRow}>
                  <Text style={styles.expandedLabel}>Special Requests</Text>
                  <Text style={styles.expandedValue}>{raw.specialRequests}</Text>
                </View>
              )}

              {/* Cancellation reason if cancelled/no_show */}
              {raw?.cancellationReason && (
                <View style={styles.expandedRow}>
                  <Text style={styles.expandedLabel}>Cancellation Reason</Text>
                  <Text style={[styles.expandedValue, { color: C.error }]}>{raw.cancellationReason}</Text>
                </View>
              )}
            </View>
          )}

          {/* Ref number + Actions */}
          <View style={styles.cardFooter}>
            <View style={styles.refRow}>
              <Ionicons name="document-text-outline" size={13} color={C.textTertiary} />
              <Text style={styles.refText} numberOfLines={1}>
                {booking.referenceNumber}
              </Text>
            </View>
            <View style={styles.footerActions}>
              {/* Menu & Order button for table bookings */}
              {booking.type === 'table' && (booking.status === 'confirmed' || booking.status === 'pending') && (
                <Pressable
                  style={styles.menuBtn}
                  onPress={handleMenuPress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="restaurant-outline" size={16} color={C.white} />
                  <Text style={styles.menuBtnText}>Menu</Text>
                </Pressable>
              )}
              {/* Pay button for table bookings with active status */}
              {booking.type === 'table' && (booking.status === 'confirmed' || booking.status === 'pending') && (
                <Pressable
                  style={styles.payBtn}
                  onPress={handlePayPress}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="card-outline" size={16} color={C.white} />
                  <Text style={styles.payBtnText}>Pay</Text>
                </Pressable>
              )}
              {booking.canCancel && (
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(booking)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={C.error} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedBookingId, router],
  );

  // ─── Unauthenticated state ───────────────────────────────
  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[C.primary, C.primaryDark]} style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
          </Pressable>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.centeredContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.neutral[100] }]}>
            <Ionicons name="lock-closed-outline" size={40} color={C.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtitle}>Please login to view your bookings</Text>
          <Pressable
            style={[styles.ctaButton, { backgroundColor: tintColor || C.primary }]}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.ctaButtonText}>Login</Text>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // ─── Empty state ─────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) return null;
    const isFiltered = typeFilter !== 'all' || statusFilter !== 'all';
    const typeLabel = typeFilter !== 'all' ? BOOKING_TYPE_CONFIG[typeFilter].label.toLowerCase() : '';
    const statusLabel = statusFilter !== 'all' ? statusFilter : '';

    return (
      <View style={styles.centeredContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(0, 192, 106, 0.08)' }]}>
          <Ionicons name={isFiltered ? 'filter-outline' : 'calendar-outline'} size={40} color={C.primary} />
        </View>
        <Text style={styles.emptyTitle}>{isFiltered ? 'No Matches' : 'No Bookings Yet'}</Text>
        <Text style={styles.emptySubtitle}>
          {isFiltered
            ? `No ${statusLabel} ${typeLabel} bookings found. Try adjusting your filters.`
            : "You haven't made unknown bookings yet. Start exploring!"}
        </Text>
        {isFiltered ? (
          <Pressable style={styles.ctaButtonOutline} onPress={handleClearFilters}>
            <Ionicons name="refresh-outline" size={18} color={C.primary} />
            <Text style={styles.ctaButtonOutlineText}>Clear Filters</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.ctaButton, { backgroundColor: C.primary }]} onPress={() => router.push('/')}>
            <Text style={styles.ctaButtonText}>Explore Now</Text>
          </Pressable>
        )}
      </View>
    );
  };

  // ─── Main render ─────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'top']}>
      {/* SOFIA: SafeAreaView ensures content avoids notch and top inset areas */}
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" />

        {/* ── Header ── */}
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
          </Pressable>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.successScale[50] }]}>
            <Text style={[styles.statNumber, { color: C.success }]}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.warningScale[50] }]}>
            <Text style={[styles.statNumber, { color: C.orange }]}>{stats.tables}</Text>
            <Text style={styles.statLabel}>Tables</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.infoScale[50] }]}>
            <Text style={[styles.statNumber, { color: C.purple }]}>{stats.events}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </View>

        {/* ── Type tabs ── */}
        <View style={styles.typeTabsContainer}>
          {TYPE_TABS.map((tab) => {
            const active = typeFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.typeTab, active ? styles.typeTabActive : null]}
                onPress={() => handleTypeFilterPress(tab.key)}
              >
                <Ionicons name={tab.icon} size={16} color={active ? C.white : C.textSecondary} />
                <Text style={[styles.typeTabText, active ? styles.typeTabTextActive : null]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Status pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusPillsScroll}
          contentContainerStyle={styles.statusPillsContent}
        >
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.statusPill, active ? styles.statusPillActive : null]}
                onPress={() => handleStatusFilterPress(tab.key)}
              >
                <Text style={[styles.statusPillText, active ? styles.statusPillTextActive : null]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Content ── */}
        {loading && !refreshing ? (
          <DetailPageSkeleton />
        ) : loadError ? (
          <View style={styles.centeredContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: Colors.errorScale[50] }]}>
              <Ionicons name="alert-circle-outline" size={40} color={C.error} />
            </View>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptySubtitle}>{loadError}</Text>
            <Pressable style={[styles.ctaButton, { backgroundColor: C.primary }]} onPress={() => loadBookings()}>
              <Text style={styles.ctaButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList
            data={filteredBookings}
            keyExtractor={(item: UnifiedBooking, idx: number) => item.id || String(idx)}
            renderItem={renderBookingCard}
            contentContainerStyle={Object.assign(
              {},
              styles.listContent,
              filteredBookings.length === 0 ? { flex: 1 } : {},
            )}
            ListEmptyComponent={renderEmpty}
            estimatedItemSize={120}
            removeClippedSubviews={true}
            ListFooterComponent={
              hasMoreData && filteredBookings.length > 0 ? (
                <View style={styles.loadMoreFooter}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Pressable style={styles.loadMoreBtn} onPress={loadMore}>
                      <Text style={styles.loadMoreText}>Load More</Text>
                      <Ionicons name="chevron-down" size={16} color={C.primary} />
                    </Pressable>
                  )}
                </View>
              ) : null
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.primary}
                colors={[C.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeContainer: {
    // SOFIA: SafeAreaView prevents content from hiding behind notch and safe area insets
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 24) + 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20, // Pill-shaped button for 40x40
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textSecondary,
    marginTop: 2,
  },

  // ── Type tabs ──
  typeTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  typeTabActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
  },
  typeTabTextActive: {
    color: C.white,
  },

  // ── Status pills ──
  statusPillsScroll: {
    maxHeight: 44,
  },
  statusPillsContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusPillActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textSecondary,
  },
  statusPillTextActive: {
    color: C.white,
    fontWeight: '600',
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
    gap: 12,
  },

  // ── Card ──
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.background.secondary,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  upcomingDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  upcomingText: {
    fontSize: 11,
    fontWeight: '500',
    color: C.success,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Card main row
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  cardDateText: {
    fontSize: 12,
    color: C.textTertiary,
  },
  cardDateDot: {
    fontSize: 12,
    color: C.textTertiary,
    marginHorizontal: 2,
  },

  // Detail pills
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  detailPill: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
    minWidth: 80,
    flex: 1,
  },
  detailPillLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailPillValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },

  // Expanded details
  expandedSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  expandedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textTertiary,
    minWidth: 100,
  },
  expandedValue: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    flex: 1,
    textAlign: 'right',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
    paddingTop: 10,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  refText: {
    fontSize: 12,
    color: C.textTertiary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.purple,
  },
  menuBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.primary,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.errorScale[50],
    borderWidth: 1,
    borderColor: Colors.errorScale[200],
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.error,
  },

  // ── Loading / Empty ──
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 15,
    color: C.textSecondary,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  ctaButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  ctaButtonOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.primary,
  },
  emptyIcon: {},

  // ── Load more footer ──
  loadMoreFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.primary,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },
});

export default withErrorBoundary(BookingsPage, 'BookingsPage');
