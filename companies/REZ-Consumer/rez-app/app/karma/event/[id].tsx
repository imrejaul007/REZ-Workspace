// @ts-nocheck
/**
 * Karma Event Detail Screen
 * Full event info with join/check-in/check-out flows.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import CachedImage from '@/components/ui/CachedImage';
import { KarmaHeader } from '../_layout';
import karmaService, { KarmaEvent, Booking } from '@/services/karmaService';
import { useIsAuthenticated } from '@/stores/selectors';
import { showAlert } from '@/utils/alert';
import { showToast } from '@/components/common/ToastManager';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'] as const;

const CATEGORY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  environment: { icon: 'leaf', color: '#22C55E', bg: '#DCFCE7' },
  food: { icon: 'restaurant', color: '#F97316', bg: '#FFF7ED' },
  health: { icon: 'heart', color: '#EF4444', bg: '#FEF2F2' },
  education: { icon: 'school', color: '#3B82F6', bg: '#EFF6FF' },
  community: { icon: 'people', color: '#8B5CF6', bg: '#F5F3FF' },
};

function KarmaEventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [event, setEvent] = useState<KarmaEvent | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [eventRes, bookingRes] = await Promise.all([
        karmaService.getEventDetail(id),
        karmaService.getMyBooking(id),
      ]);
      // G-KU-M8 FIX: Use fresh eventRes data in the same callback to avoid stale closure.
      // Previously, event state from a previous render was used in handleCheckIn/CheckOut.
      if (eventRes.success && eventRes.data) setEvent(eventRes.data);
      if (bookingRes.success) setBooking(bookingRes.data ?? null);
    } catch {
      showAlert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push('/sign-in' as unknown as string);
      return;
    }
    if (!event) return;
    setJoining(true);
    try {
      const res = await karmaService.joinEvent(event._id);
      if (res.success && res.data) {
        setBooking(res.data);
        showAlert('Joined!', `You're registered for ${event.name}. Check in when you arrive.`);
      } else {
        showAlert('Error', res.error ?? 'Unable to join event');
      }
    } catch (e) {
      showAlert('Error', e.message ?? 'Something went wrong');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!event) return;
    Alert.alert('Leave Event', 'Are you sure you want to cancel your registration?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            const res = await karmaService.leaveEvent(event._id);
            if (res.success) {
              setBooking(null);
              showToast({ type: 'info', message: "You've cancelled your registration." });
            } else {
              showToast({ type: 'error', message: res.error ?? 'Unable to leave event' });
            }
          } catch (e) {
            showToast({ type: 'error', message: e.message });
          } finally {
            setLeaving(false);
          }
        },
      },
    ]);
  };

  const handleCheckIn = () => {
    if (!event) return;
    router.push(`/karma/scan?eventId=${event._id}&mode=checkin`);
  };

  const handleCheckOut = () => {
    if (!event) return;
    router.push(`/karma/scan?eventId=${event._id}&mode=checkout`);
  };

  const openMaps = () => {
    if (!event?.location.coordinates) return;
    const { lat, lng } = event.location.coordinates;
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url =
      Platform.OS === 'ios'
        ? `${scheme}?q=${encodeURIComponent(event.location.address)}&ll=${lat},${lng}`
        : `${scheme}${lat},${lng}?q=${encodeURIComponent(event.location.address)}`;
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Event" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Event" showBack />
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Event not found</Text>
          <Pressable style={styles.backHomeBtn} onPress={() => router.push('/karma/home')}>
            <Text style={styles.backHomeBtnText}>Go to Karma Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const catCfg = CATEGORY_ICONS[event.category] ?? CATEGORY_ICONS.community;
  const progressPercent = event.capacity?.goal
    ? Math.min((event.capacity.enrolled / event.capacity.goal) * 100, 100)
    : 0;
  const estimatedKarma = Math.round(event.baseKarmaPerHour * event.expectedDurationHours);
  const isJoined = !!booking;
  const canCheckIn = isJoined && booking?.status !== 'checked_in' && !booking?.qrCheckedIn;
  const canCheckOut = isJoined && booking?.qrCheckedIn && !booking?.qrCheckedOut;
  const verificationIcon =
    event.verificationMode === 'qr'
      ? 'qr-code-outline'
      : event.verificationMode === 'gps'
        ? 'location-outline'
        : 'hand-right-outline';

  return (
    <View style={styles.container}>
      <KarmaHeader title="Event Details" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          {event.image ? (
            <CachedImage source={event.image} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: catCfg.bg }]}>
              <Ionicons name={catCfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={80} color={catCfg.color} />
            </View>
          )}
          {/* Gradient overlay */}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.heroGradient} />
          {/* Category + Status */}
          <View style={styles.heroBadges}>
            <View style={[styles.catBadge, { backgroundColor: catCfg.bg }]}>
              <Ionicons name={catCfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={12} color={catCfg.color} />
              <Text style={[styles.catBadgeText, { color: catCfg.color }]}>
                {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
              </Text>
            </View>
            {event.status === 'ongoing' && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Event Title & Organizer */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.name}</Text>
          <View style={styles.organizerRow}>
            {event.organizer.logo ? (
              <CachedImage source={event.organizer.logo} style={styles.orgLogo} />
            ) : (
              <View style={styles.orgEmojiWrap}>
                <Text style={styles.orgEmoji}>🏢</Text>
              </View>
            )}
            <Text style={styles.orgName}>{event.organizer.name}</Text>
          </View>

          {/* Joined badge */}
          {isJoined && (
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.joinedBadgeText}>Registered</Text>
            </View>
          )}
        </View>

        {/* Date / Time / Location */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color={KARMA_PURPLE} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {event.date
                  ? new Date(event.date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'TBD'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={KARMA_PURPLE} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {event.time ? `${event.time.start} - ${event.time.end}` : 'TBD'} | Duration:{' '}
                {event.expectedDurationHours}h
              </Text>
            </View>
          </View>

          <Pressable style={styles.infoRow} onPress={openMaps}>
            <Ionicons name="location" size={18} color={KARMA_PURPLE} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{event.location.address}</Text>
              {event.location.city && <Text style={styles.infoSub}>{event.location.city}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </Pressable>

          <View style={styles.infoRow}>
            <Ionicons name={verificationIcon} size={18} color={KARMA_PURPLE} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Verification</Text>
              <Text style={styles.infoValue}>
                {event.verificationMode === 'qr'
                  ? 'QR Code scan'
                  : event.verificationMode === 'gps'
                    ? 'GPS check-in'
                    : 'Manual'}
                {event.gpsRadius ? ` (within ${event.gpsRadius}m)` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Map */}
        {event.location.coordinates && (
          <View style={styles.mapSection}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: event.location.coordinates!.lat,
                longitude: event.location.coordinates!.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: event.location.coordinates!.lat,
                  longitude: event.location.coordinates!.lng,
                }}
                title={event.name}
                description={event.location.address}
              />
            </MapView>
          </View>
        )}

        {/* Capacity */}
        {event.capacity && (
          <View style={styles.capacitySection}>
            <View style={styles.capacityHeader}>
              <Text style={styles.capacityLabel}>Volunteer Spots</Text>
              <Text style={styles.capacityCount}>
                {event.capacity.enrolled} / {event.capacity.goal} filled
              </Text>
            </View>
            <View style={styles.capacityBar}>
              <View style={[styles.capacityFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.capacitySpots}>{event.capacity.goal - event.capacity.enrolled} spots remaining</Text>
          </View>
        )}

        {/* Impact Preview */}
        <View style={styles.impactSection}>
          <Text style={styles.sectionTitle}>What You'll Earn</Text>
          <View style={styles.impactCards}>
            <View style={styles.impactCard}>
              <Ionicons name="leaf" size={24} color={KARMA_PURPLE} />
              <Text style={styles.impactNumber}>~{estimatedKarma}</Text>
              <Text style={styles.impactLabel}>Karma Points</Text>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactCard}>
              <Ionicons name="wallet" size={24} color="#F59E0B" />
              <Text style={styles.impactNumber}>~{Math.round(estimatedKarma * 0.5)}</Text>
              <Text style={styles.impactLabel}>ReZ Coins (L2)</Text>
            </View>
            <View style={styles.impactDivider} />
            <View style={styles.impactCard}>
              <Ionicons name="time" size={24} color="#22C55E" />
              <Text style={styles.impactNumber}>{event.expectedDurationHours}h</Text>
              <Text style={styles.impactLabel}>Hours Given</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descSection}>
          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        {/* Difficulty */}
        <View style={styles.difficultySection}>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor:
                  event.difficulty === 'easy' ? '#DCFCE7' : event.difficulty === 'hard' ? '#FFF1F2' : '#EFF6FF',
              },
            ]}
          >
            <Ionicons
              name={
                event.difficulty === 'easy' ? 'sunny-outline' : event.difficulty === 'hard' ? 'flame' : 'walk-outline'
              }
              size={18}
              color={event.difficulty === 'easy' ? '#22C55E' : event.difficulty === 'hard' ? '#EF4444' : '#3B82F6'}
            />
            <Text
              style={[
                styles.difficultyText,
                {
                  color: event.difficulty === 'easy' ? '#22C55E' : event.difficulty === 'hard' ? '#EF4444' : '#3B82F6',
                },
              ]}
            >
              {event.difficulty.charAt(0).toUpperCase() + event.difficulty.slice(1)} —{' '}
              {event.difficulty === 'easy'
                ? 'No prior experience needed'
                : event.difficulty === 'hard'
                  ? 'Requires training or physical effort'
                  : 'Basic skills helpful'}
            </Text>
          </View>
        </View>

        {/* Booking Status */}
        {booking && (
          <View style={styles.bookingStatusSection}>
            <Text style={styles.sectionTitle}>Your Status</Text>
            <View style={styles.bookingStatusCard}>
              <View style={styles.statusRow}>
                <Ionicons
                  name={booking.qrCheckedIn ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={booking.qrCheckedIn ? Colors.success : Colors.textSecondary}
                />
                <Text style={styles.statusLabel}>Check In</Text>
                <Text style={[styles.statusValue, booking.qrCheckedIn && { color: Colors.success }]}>
                  {booking.qrCheckedIn ? 'Done' : 'Pending'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons
                  name={booking.qrCheckedOut ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={booking.qrCheckedOut ? Colors.success : Colors.textSecondary}
                />
                <Text style={styles.statusLabel}>Check Out</Text>
                <Text style={[styles.statusValue, booking.qrCheckedOut && { color: Colors.success }]}>
                  {booking.qrCheckedOut ? 'Done' : 'Pending'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons
                  name={booking.ngoApproved ? 'checkmark-circle' : 'time-outline'}
                  size={18}
                  color={booking.ngoApproved ? Colors.success : Colors.textSecondary}
                />
                <Text style={styles.statusLabel}>NGO Approval</Text>
                <Text style={[styles.statusValue, booking.ngoApproved && { color: Colors.success }]}>
                  {booking.ngoApproved ? 'Approved' : 'Pending NGO Review'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons name="speedometer" size={18} color={KARMA_PURPLE} />
                <Text style={styles.statusLabel}>Confidence</Text>
                <Text style={styles.statusValue}>{Math.round((booking.confidenceScore ?? 0) * 100)}%</Text>
              </View>
              {booking.karmaEarned > 0 && (
                <View style={styles.statusRow}>
                  <Ionicons name="star" size={18} color="#FCD34D" />
                  <Text style={styles.statusLabel}>Karma Earned</Text>
                  <Text style={[styles.statusValue, { color: '#FCD34D', fontWeight: '700' }]}>
                    +{booking.karmaEarned}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View style={styles.bottomCta}>
        {event.status === 'completed' || event.status === 'cancelled' ? (
          <View style={styles.closedCta}>
            <Text style={styles.closedCtaText}>
              {event.status === 'cancelled' ? 'This event was cancelled' : 'This event has ended'}
            </Text>
          </View>
        ) : !isJoined ? (
          <LinearGradient colors={KARMA_GRADIENT} style={styles.joinBtn}>
            <Pressable style={styles.joinBtnInner} onPress={handleJoin} disabled={joining}>
              {joining ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color={colors.text.inverse} />
                  <Text style={styles.joinBtnText}>Join Event</Text>
                </>
              )}
            </Pressable>
          </LinearGradient>
        ) : (
          <View style={styles.joinedCta}>
            {canCheckIn && (
              <Pressable style={styles.checkInBtn} onPress={handleCheckIn}>
                <Ionicons name="qr-code-outline" size={20} color={colors.text.inverse} />
                <Text style={styles.checkInBtnText}>Check In</Text>
              </Pressable>
            )}
            {canCheckOut && (
              <Pressable style={styles.checkOutBtn} onPress={handleCheckOut}>
                <Ionicons name="qr-code-outline" size={20} color={KARMA_PURPLE} />
                <Text style={styles.checkOutBtnText}>Check Out</Text>
              </Pressable>
            )}
            {!canCheckIn && !canCheckOut && (
              <View style={styles.waitingCta}>
                <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
                <Text style={styles.waitingCtaText}>
                  {booking?.qrCheckedIn && !booking?.qrCheckedOut
                    ? 'Checked in — check out when done'
                    : 'Ready for check-in'}
                </Text>
              </View>
            )}
            <Pressable style={styles.leaveBtn} onPress={handleLeave} disabled={leaving}>
              {leaving ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
              )}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  emptyTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
  },
  backHomeBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
  },
  backHomeBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  scrollView: { flex: 1 },

  // Hero
  heroWrap: { position: 'relative', height: 220 },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  heroBadges: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text.inverse },
  liveText: { fontSize: 11, fontWeight: '700', color: colors.text.inverse },

  // Title
  titleSection: { padding: Spacing.base, backgroundColor: colors.text.inverse },
  eventTitle: { fontSize: Typography.h3.fontSize, fontWeight: '800', color: colors.deepNavy, marginBottom: Spacing.sm },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  orgLogo: { width: 24, height: 24, borderRadius: 12 },
  orgEmojiWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgEmoji: { fontSize: 14 },
  orgName: { fontSize: Typography.body.fontSize, color: Colors.textSecondary, fontWeight: '500' },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  joinedBadgeText: { fontSize: Typography.caption.fontSize, fontWeight: '700', color: Colors.success },

  // Info
  infoSection: { backgroundColor: colors.text.inverse, padding: Spacing.base, marginTop: 8 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },
  infoSub: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },

  // Map
  mapSection: {
    height: 140,
    marginHorizontal: Spacing.base,
    marginTop: 8,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  map: { ...StyleSheet.absoluteFillObject },

  // Capacity
  capacitySection: { backgroundColor: colors.text.inverse, padding: Spacing.base, marginTop: 8 },
  capacityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  capacityLabel: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },
  capacityCount: { fontSize: Typography.bodySmall.fontSize, color: Colors.textSecondary },
  capacityBar: { height: 6, backgroundColor: colors.background.secondary, borderRadius: 3, overflow: 'hidden' },
  capacityFill: { height: '100%', backgroundColor: KARMA_PURPLE, borderRadius: 3 },
  capacitySpots: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 6 },

  // Impact
  impactSection: { backgroundColor: colors.text.inverse, padding: Spacing.base, marginTop: 8 },
  sectionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: Spacing.md,
  },
  impactCards: { flexDirection: 'row', alignItems: 'center' },
  impactCard: { flex: 1, alignItems: 'center', padding: Spacing.md },
  impactDivider: { width: 1, backgroundColor: colors.border.default, height: 50 },
  impactNumber: { fontSize: 22, fontWeight: '800', color: colors.deepNavy, marginTop: 6 },
  impactLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Description
  descSection: { backgroundColor: colors.text.inverse, padding: Spacing.base, marginTop: 8 },
  description: { fontSize: Typography.body.fontSize, color: Colors.textSecondary, lineHeight: 22 },

  // Difficulty
  difficultySection: { backgroundColor: colors.text.inverse, padding: Spacing.base, marginTop: 8 },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 10,
  },
  difficultyText: { fontSize: Typography.body.fontSize, fontWeight: '600', flex: 1 },

  // Booking status
  bookingStatusSection: { backgroundColor: colors.text.inverse, padding: Spacing.base, marginTop: 8 },
  bookingStatusCard: { gap: Spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusLabel: { flex: 1, fontSize: Typography.body.fontSize, color: Colors.textSecondary },
  statusValue: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },

  // Bottom CTA
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.text.inverse,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  joinBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  joinBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  joinBtnText: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: colors.text.inverse },
  joinedCta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkInBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KARMA_PURPLE,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  checkInBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.text.inverse },
  checkOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
    borderWidth: 1,
    borderColor: KARMA_PURPLE,
  },
  checkOutBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: KARMA_PURPLE },
  waitingCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  waitingCtaText: { fontSize: Typography.body.fontSize, fontWeight: '500', color: Colors.textSecondary },
  leaveBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedCta: { alignItems: 'center', paddingVertical: 14 },
  closedCtaText: { fontSize: Typography.body.fontSize, color: Colors.textSecondary },
});

export default withErrorBoundary(KarmaEventDetailScreen, 'KarmaEventDetail');
