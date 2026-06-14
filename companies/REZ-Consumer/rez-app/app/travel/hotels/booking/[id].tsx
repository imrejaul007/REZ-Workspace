// @ts-nocheck
/**
 * Hotel Booking Detail Screen
 * Route: /travel/hotels/booking/[id]
 * Shows full booking details. Cancel (confirmed) + Write Review (completed).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '@/components/common/ToastManager';
import { getHotelBookingById, cancelBooking, OtaBooking } from '@/services/hotelOtaApi';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  navy: '#0F172A',
  slate: '#64748B',
  slate200: '#E2E8F0',
  green: '#16A34A',
  gold: '#F59E0B',
  red: '#EF4444',
  amber: '#F59E0B',
};

function paise(p: number) {
  return `₹${Math.round(p / 100).toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  hold: '#F59E0B',
  confirmed: C.cyanDark,
  completed: C.green,
  cancelled: C.red,
};

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as unknown} size={16} color={C.slate} style={{ width: 22 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function HotelBookingDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<(OtaBooking & { specialRequests?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    try {
      const b = await getHotelBookingById(id);
      setBooking(b);
    } catch {
      showToast({ type: 'error', message: 'Failed to load booking details' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleCancel = useCallback(() => {
    if (!booking) return;
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this booking at ${booking.hotelName}? Cancellation policy may apply.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelBooking(booking.id, 'Cancelled by guest');
              setBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
              showToast({ type: 'success', message: 'Booking cancelled. Coins will be refunded within 24 hours.' });
            } catch (e) {
              showToast({ type: 'error', message: e.message ?? 'Cancellation failed' });
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }, [booking]);

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.cyan} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: C.bg, paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.slate} />
        <Text style={{ color: C.slate, marginTop: 12 }}>Booking not found</Text>
        <Pressable style={styles.backPressable} onPress={() => router.back()}>
          <Text style={styles.backPressableText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] ?? C.slate;
  const coinsSaved =
    (booking.otaCoinBurnedPaise ?? 0) + (booking.rezCoinBurnedPaise ?? 0) + (booking.hotelBrandCoinBurnedPaise ?? 0);
  const canCancel = booking.status === 'confirmed' || booking.status === 'hold';
  const canReview = booking.status === 'completed';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}30` }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{booking.status.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hotel + ref */}
        <View style={styles.card}>
          <View style={styles.hotelRow}>
            <View style={styles.hotelIcon}>
              <Ionicons name="bed" size={24} color={C.cyanDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hotelName}>{booking.hotelName}</Text>
              <Text style={styles.roomType}>{booking.roomTypeName}</Text>
            </View>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>Booking Reference</Text>
            <Text style={styles.refValue}>{booking.bookingRef}</Text>
          </View>
        </View>

        {/* Stay info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stay Details</Text>
          <InfoRow icon="log-in-outline" label="Check-in" value={booking.checkinDate} />
          <InfoRow icon="log-out-outline" label="Check-out" value={booking.checkoutDate} />
          <InfoRow
            icon="people-outline"
            label="Guests"
            value={`${booking.numGuests} guest${booking.numGuests !== 1 ? 's' : ''}`}
          />
          <InfoRow
            icon="bed-outline"
            label="Rooms"
            value={`${booking.numRooms} room${booking.numRooms !== 1 ? 's' : ''}`}
          />
          {(booking as unknown).specialRequests && (
            <InfoRow icon="chatbubble-outline" label="Special Requests" value={(booking as unknown).specialRequests} />
          )}
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total Value</Text>
            <Text style={styles.priceValue}>{paise(booking.totalValuePaise)}</Text>
          </View>
          {(booking.otaCoinBurnedPaise ?? 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>OTA Coins used</Text>
              <Text style={[styles.priceValue, { color: C.cyan }]}>-{paise(booking.otaCoinBurnedPaise)}</Text>
            </View>
          )}
          {(booking.rezCoinBurnedPaise ?? 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>REZ Coins used</Text>
              <Text style={[styles.priceValue, { color: C.cyan }]}>-{paise(booking.rezCoinBurnedPaise)}</Text>
            </View>
          )}
          {(booking.hotelBrandCoinBurnedPaise ?? 0) > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Brand Coins used</Text>
              <Text style={[styles.priceValue, { color: C.amber }]}>-{paise(booking.hotelBrandCoinBurnedPaise)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Cash Paid</Text>
            <Text style={styles.totalValue}>{paise(booking.pgAmountPaise)}</Text>
          </View>
          {coinsSaved > 0 && (
            <View style={styles.savedBadge}>
              <Ionicons name="wallet" size={13} color={C.green} />
              <Text style={styles.savedText}>Saved {paise(coinsSaved)} using coins</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {canReview && (
          <Pressable
            style={styles.reviewBtn}
            onPress={() =>
              router.push({
                pathname: '/travel/hotels/[id]/review' as unknown,
                params: { id: booking.hotelId, bookingRef: booking.bookingRef, hotelName: booking.hotelName },
              })
            }
          >
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.reviewBtnText}>Write a Review</Text>
          </Pressable>
        )}

        {canCancel && (
          <Pressable
            style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={C.red} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color={C.red} />
                <Text style={styles.cancelBtnText}>Cancel Booking</Text>
              </>
            )}
          </Pressable>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800' },
  content: { padding: 16 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  hotelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  hotelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelName: { fontSize: 16, fontWeight: '700', color: C.navy },
  roomType: { fontSize: 13, color: C.slate, marginTop: 2 },
  refBox: { backgroundColor: '#F0F9FF', borderRadius: 10, padding: 10 },
  refLabel: { fontSize: 11, color: C.slate, fontWeight: '600' },
  refValue: { fontSize: 16, fontWeight: '800', color: C.cyanDark, letterSpacing: 0.5, marginTop: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.navy, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  infoLabel: { fontSize: 11, color: C.slate, fontWeight: '600' },
  infoValue: { fontSize: 14, color: C.navy, fontWeight: '500', marginTop: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { fontSize: 14, color: C.slate },
  priceValue: { fontSize: 14, color: C.navy, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: C.slate200, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: C.navy },
  totalValue: { fontSize: 16, fontWeight: '800', color: C.navy },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
  },
  savedText: { fontSize: 12, fontWeight: '600', color: C.green },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.cyan,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  reviewBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.red,
    backgroundColor: '#FFF1F2',
  },
  cancelBtnText: { color: C.red, fontWeight: '700', fontSize: 14 },
  backPressable: {
    marginTop: 16,
    backgroundColor: C.cyan,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backPressableText: { color: '#fff', fontWeight: '700' },
});
