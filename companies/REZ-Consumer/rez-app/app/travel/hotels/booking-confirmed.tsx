/**
 * Hotel Booking Confirmed Screen
 * Route: /travel/hotels/booking-confirmed
 * Replaces generic travel-booking-confirmation for hotel bookings.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withSpring, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

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
  purple: '#7C3AED',
};

function paise(p: number) {
  if (!p || p <= 0) return null;
  return `₹${Math.round(p / 100).toLocaleString()}`;
}

export default function HotelBookingConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    bookingId,
    bookingRef,
    hotelName,
    checkinDate,
    checkoutDate,
    totalPaise: totalStr,
    coinsSavedPaise: savedStr,
    otaCoinEarnedPaise: otaEarnStr,
    rezCoinEarnedPaise: rezEarnStr,
    hotelBrandCoinEarnedPaise: brandEarnStr,
  } = useLocalSearchParams<{
    bookingId: string;
    bookingRef: string;
    hotelName: string;
    checkinDate: string;
    checkoutDate: string;
    totalPaise: string;
    coinsSavedPaise: string;
    otaCoinEarnedPaise: string;
    rezCoinEarnedPaise: string;
    hotelBrandCoinEarnedPaise?: string;
  }>();

  const totalPaise = parseInt(totalStr ?? '0', 10);
  const coinsSaved = parseInt(savedStr ?? '0', 10);
  const otaEarned = parseInt(otaEarnStr ?? '0', 10);
  const rezEarned = parseInt(rezEarnStr ?? '0', 10);
  const brandEarned = parseInt(brandEarnStr ?? '0', 10);

  const scaleAnim = useSharedValue(0);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    scaleAnim.value = withSpring(1, { damping: 7, stiffness: 50 });
    fadeAnim.value = withTiming(1, { duration: 500 });
    scheduleCheckInReminder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function scheduleCheckInReminder() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      // Reminder: day before check-in at 9 AM
      const checkin = checkinDate ? new Date(checkinDate) : null;
      if (!checkin || isNaN(checkin.getTime())) return;

      const reminderDate = new Date(checkin);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(9, 0, 0, 0);

      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Hotel Check-in Tomorrow',
            body: `Your stay at ${hotelName ?? 'your hotel'} starts tomorrow. Check-in time is usually from 2 PM.`,
            data: { bookingId, screen: 'hotel_booking' },
          },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: reminderDate },
        });
      }

      // Confirmation notification: immediate
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Booking Confirmed!',
          body: `${hotelName ?? 'Hotel'} — Ref: ${bookingRef}. Check-in: ${checkinDate}`,
          data: { bookingId, screen: 'hotel_booking' },
        },
        trigger: null, // immediate
      });
    } catch {
      /* notifications are best-effort */
    }
  }

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: scaleAnim.value,
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: fadeAnim.value }));

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hotel Booking Confirmed! 🏨\n${hotelName}\nCheck-in: ${checkinDate}\nCheck-out: ${checkoutDate}\nRef: ${bookingRef}\n\nBooked via REZ App`,
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Success header */}
        <LinearGradient colors={['#064E3B', '#065F46']} style={styles.header}>
          <Animated.View style={[styles.checkCircle, iconStyle]}>
            <Ionicons name="checkmark" size={44} color="#fff" />
          </Animated.View>
          <Text style={styles.headerTitle}>Booking Confirmed!</Text>
          <Text style={styles.headerSub}>Your hotel stay is all set</Text>
        </LinearGradient>

        <Animated.View style={[styles.cards, contentStyle]}>
          {/* Booking ref card */}
          <View style={styles.card}>
            <View style={styles.refRow}>
              <View style={styles.hotelIconBox}>
                <Ionicons name="bed" size={24} color={C.cyanDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hotelName}>{hotelName}</Text>
                <Text style={styles.refLabel}>Booking Ref</Text>
                <Text style={styles.refValue}>{bookingRef}</Text>
              </View>
            </View>
          </View>

          {/* Stay details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stay Details</Text>
            <View style={styles.stayRow}>
              <View style={styles.stayItem}>
                <Ionicons name="log-in-outline" size={20} color={C.cyanDark} />
                <Text style={styles.stayItemLabel}>Check-in</Text>
                <Text style={styles.stayItemValue}>{checkinDate}</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={C.slate200} />
              <View style={styles.stayItem}>
                <Ionicons name="log-out-outline" size={20} color={C.slate} />
                <Text style={styles.stayItemLabel}>Check-out</Text>
                <Text style={styles.stayItemValue}>{checkoutDate}</Text>
              </View>
            </View>
          </View>

          {/* Payment & coins */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Summary</Text>
            {totalPaise > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.summaryValue}>₹{Math.round(totalPaise / 100).toLocaleString()}</Text>
              </View>
            )}
            {coinsSaved > 0 && (
              <View style={[styles.summaryRow, styles.savingsRow]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="wallet" size={14} color={C.green} />
                  <Text style={[styles.summaryLabel, { color: C.green }]}>Coins Saved</Text>
                </View>
                <Text style={[styles.summaryValue, { color: C.green }]}>-{paise(coinsSaved)}</Text>
              </View>
            )}
          </View>

          {/* Coins earned */}
          {(otaEarned > 0 || rezEarned > 0 || brandEarned > 0) && (
            <LinearGradient colors={['#1E3A8A', '#1D4ED8']} style={styles.earnCard}>
              <Ionicons name="gift" size={22} color="#FCD34D" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.earnTitle}>Coins Earned from this Stay!</Text>
                <View style={styles.earnRow}>
                  {otaEarned > 0 && <Text style={styles.earnChip}>OTA +{paise(otaEarned)}</Text>}
                  {rezEarned > 0 && (
                    <Text style={[styles.earnChip, { backgroundColor: 'rgba(167,139,250,0.3)' }]}>
                      REZ +{paise(rezEarned)}
                    </Text>
                  )}
                  {brandEarned > 0 && (
                    <Text style={[styles.earnChip, { backgroundColor: 'rgba(124,58,237,0.3)' }]}>
                      Hotel +{paise(brandEarned)}
                    </Text>
                  )}
                </View>
              </View>
            </LinearGradient>
          )}

          {/* Actions */}
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/my-bookings' as unknown as string)}>
            <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.primaryBtnGrad}>
              <Ionicons name="list" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>View My Bookings</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={C.cyanDark} />
            <Text style={styles.secondaryBtnText}>Share Booking</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/travel/hotels' as unknown as string)}>
            <Ionicons name="bed-outline" size={18} color={C.cyanDark} />
            <Text style={styles.secondaryBtnText}>Browse More Hotels</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  cards: { padding: 16, marginTop: -20 },
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
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hotelIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelName: { fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 4 },
  refLabel: { fontSize: 11, color: C.slate, fontWeight: '600' },
  refValue: { fontSize: 16, fontWeight: '800', color: C.cyanDark, letterSpacing: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.navy, marginBottom: 12 },
  stayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  stayItem: { alignItems: 'center', gap: 4 },
  stayItemLabel: { fontSize: 11, color: C.slate, fontWeight: '600' },
  stayItemValue: { fontSize: 14, fontWeight: '700', color: C.navy },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  savingsRow: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 10, marginTop: 4 },
  summaryLabel: { fontSize: 14, color: C.slate },
  summaryValue: { fontSize: 14, fontWeight: '700', color: C.navy },
  earnCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, padding: 16, marginBottom: 14 },
  earnTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 8 },
  earnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  earnChip: {
    backgroundColor: 'rgba(52,211,153,0.3)',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  primaryBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  primaryBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.slate200,
    backgroundColor: C.white,
    marginBottom: 10,
  },
  secondaryBtnText: { color: C.cyanDark, fontWeight: '700', fontSize: 14 },
});
