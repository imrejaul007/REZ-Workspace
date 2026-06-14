/**
 * Karma My Events Screen
 * Shows the user's joined events — upcoming, ongoing, and past.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from './_layout';
import karmaService, { BookingWithEvent } from '@/services/karmaService';
import { useIsAuthenticated } from '@/stores/selectors';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'environment', label: 'Environment', icon: 'leaf', color: '#22C55E', bg: '#DCFCE7' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#F97316', bg: '#FFF7ED' },
  { id: 'health', label: 'Health', icon: 'heart', color: '#EF4444', bg: '#FEF2F2' },
  { id: 'education', label: 'Education', icon: 'school', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'community', label: 'Community', icon: 'people', color: '#EC4899', bg: '#FDF2F8' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  confirmed: { label: 'Registered', color: '#3B82F6', bg: '#EFF6FF', icon: 'checkmark-circle' },
  checked_in: { label: 'Checked In', color: '#F59E0B', bg: '#FEF3C7', icon: 'scan' },
  completed: { label: 'Completed', color: '#22C55E', bg: '#DCFCE7', icon: 'trophy' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', icon: 'close-circle' },
};

type Tab = 'upcoming' | 'past';

function MyEventCard({ booking, onPress }: { booking: BookingWithEvent; onPress: () => void }) {
  const ev = booking.event;
  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.confirmed;
  const category = CATEGORIES.find((c) => c.id === (ev?.category ?? 'all')) ?? CATEGORIES[0];
  const karmaEarned = booking.karmaEarned ?? 0;
  const earnedDate = booking.earnedAt ? new Date(booking.earnedAt) : null;

  return (
    <Pressable style={styles.eventCard} onPress={onPress}>
      {ev?.image ? (
        <Image source={{ uri: ev.image }} style={styles.eventImage} resizeMode="cover" />
      ) : (
        <View style={[styles.eventImagePlaceholder, { backgroundColor: category.bg }]}>
          <Ionicons name={category.icon as unknown} size={36} color={category.color} />
        </View>
      )}
      <View style={styles.eventBody}>
        <View style={styles.eventTop}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon as unknown} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          {booking.status === 'completed' && karmaEarned > 0 && (
            <View style={styles.karmaEarned}>
              <Text style={styles.karmaEarnedText}>+{karmaEarned} Karma</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventName} numberOfLines={2}>
          {ev?.name ?? 'Event'}
        </Text>
        {ev?.location && (
          <View style={styles.eventLocation}>
            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {typeof ev.location === 'string' ? ev.location : (ev.location?.city ?? ev.location?.address)}
            </Text>
          </View>
        )}
        {ev?.date && (
          <View style={styles.eventDate}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.dateText}>
              {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        )}
        {/* Verification signals */}
        <View style={styles.signals}>
          <View style={[styles.signalChip, booking.qrCheckedIn && styles.signalActive]}>
            <Ionicons name="qr-code" size={10} color={booking.qrCheckedIn ? '#22C55E' : Colors.textSecondary} />
            <Text style={[styles.signalText, booking.qrCheckedIn && { color: '#22C55E' }]}>Check-in</Text>
          </View>
          <View style={[styles.signalChip, booking.qrCheckedOut && styles.signalActive]}>
            <Ionicons
              name="qr-code-outline"
              size={10}
              color={booking.qrCheckedOut ? '#22C55E' : Colors.textSecondary}
            />
            <Text style={[styles.signalText, booking.qrCheckedOut && { color: '#22C55E' }]}>Check-out</Text>
          </View>
          <View style={[styles.signalChip, booking.ngoApproved && styles.signalActive]}>
            <Ionicons
              name="shield-checkmark"
              size={10}
              color={booking.ngoApproved ? '#22C55E' : Colors.textSecondary}
            />
            <Text style={[styles.signalText, booking.ngoApproved && { color: '#22C55E' }]}>NGO</Text>
          </View>
        </View>
        {earnedDate && (
          <Text style={styles.earnedDate}>
            Earned {karmaEarned} karma on {earnedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState({ tab, router }: { tab: Tab; router: ReturnType<typeof useRouter> }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={tab === 'upcoming' ? 'calendar-outline' : 'trophy-outline'} size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>{tab === 'upcoming' ? 'No upcoming events' : 'No past events'}</Text>
      <Text style={styles.emptySub}>
        {tab === 'upcoming' ? 'Join an event to start your impact journey' : 'Complete events to see your history here'}
      </Text>
      {tab === 'upcoming' && (
        <Pressable style={styles.exploreBtn} onPress={() => router.push('/karma/explore' as unknown as string)}>
          <Text style={styles.exploreBtnText}>Explore Events</Text>
        </Pressable>
      )}
    </View>
  );
}

function KarmaMyEventsScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const isMounted = useIsMounted();
  const [bookings, setBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const loadBookings = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const status = activeTab === 'past' ? 'past' : 'upcoming';
        const res = await karmaService.getMyEvents(status as 'upcoming' | 'ongoing' | 'past');
        if (!isMounted()) return;
        if (res.success && res.data) {
          setBookings(Array.isArray(res.data) ? res.data : []);
        }
      } catch {
        // non-fatal
      } finally {
        if (isMounted()) setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings(true);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="My Events" showBack />
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color="#D1D5DB" />
          <Text style={styles.authTitle}>Login Required</Text>
          <Text style={styles.authSubtitle}>Sign in to view your events</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KarmaHeader title="My Events" subtitle="Your impact journey" />

      {/* Tab selector */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Ionicons name="calendar" size={16} color={activeTab === 'upcoming' ? KARMA_PURPLE : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'past' && styles.tabActive]} onPress={() => setActiveTab('past')}>
          <Ionicons name="trophy" size={16} color={activeTab === 'past' ? KARMA_PURPLE : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>Past</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      ) : bookings.length === 0 ? (
        <EmptyState tab={activeTab} router={router} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={KARMA_PURPLE} />}
        >
          {bookings.map((booking) => (
            <MyEventCard
              key={booking._id}
              booking={booking}
              onPress={() => {
                // Navigate to event detail if available
              }}
            />
          ))}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authRequired: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  authTitle: { ...Typography.h3, fontWeight: '700', color: colors.deepNavy, marginTop: Spacing.base, marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  tabActive: { backgroundColor: '#F5F3FF' },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: KARMA_PURPLE },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base },
  eventCard: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  eventImage: { width: '100%', height: 120 },
  eventImagePlaceholder: { width: '100%', height: 120, justifyContent: 'center', alignItems: 'center' },
  eventBody: { padding: Spacing.md },
  eventTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  karmaEarned: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FEF3C7',
  },
  karmaEarnedText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  eventName: { ...Typography.body, fontWeight: '700', color: colors.deepNavy, marginBottom: 6 },
  eventLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  locationText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  eventDate: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  dateText: { fontSize: 12, color: Colors.textSecondary },
  signals: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: 4 },
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  signalActive: { backgroundColor: '#DCFCE7' },
  signalText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  earnedDate: { fontSize: 11, color: '#22C55E', marginTop: 6 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    marginBottom: Spacing.lg,
  },
  emptyTitle: { ...Typography.h4, color: colors.deepNavy, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  exploreBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  exploreBtnText: { fontSize: 14, fontWeight: '600', color: colors.text.inverse },
});

export default withErrorBoundary(KarmaMyEventsScreen, 'KarmaMyEvents');
