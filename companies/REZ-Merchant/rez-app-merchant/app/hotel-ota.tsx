/**
 * Hotel OTA Dashboard
 * Route: /hotel-ota
 * For hotel merchants: OTA bookings, brand coin stats, PMS connection status.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { hotelOtaService } from '@/services/api/hotelOta';
import type { OtaBookingSummary, BrandCoinProgram, PmsStatus } from '@/services/api/hotelOta';

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
  red: '#EF4444',
};

// ─── OTA URL (for the connect / open-panel flow only) ─────────────────────────
// The fetch helpers below use hotelOtaService which reads this from env internally.
const OTA_BASE = (() => {
  const url = process.env.EXPO_PUBLIC_HOTEL_OTA_URL;
  if (!url) {
    if (__DEV__) return 'http://localhost:3008';
    throw new Error('[CONFIG] EXPO_PUBLIC_HOTEL_OTA_URL required in production');
  }
  return url;
})();

// ─── Types (imported from hotelOta service) ───────────────────────────────────

export type { OtaBookingSummary, BrandCoinProgram, PmsStatus } from '@/services/api/hotelOta';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BookingRow({ booking }: { booking: OtaBookingSummary }) {
  const statusColors: Record<string, string> = {
    confirmed: C.green,
    hold: C.gold,
    cancelled: C.red,
    completed: C.slate,
  };
  const color = statusColors[booking.status] ?? C.slate;
  return (
    <View style={styles.bookingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.bookingGuest} numberOfLines={1}>
          {booking.guestName}
        </Text>
        <Text style={styles.bookingRoom} numberOfLines={1}>
          {booking.roomTypeName} · {booking.numRooms} room{booking.numRooms > 1 ? 's' : ''}
        </Text>
        <Text style={styles.bookingDates}>
          {booking.checkinDate} → {booking.checkoutDate}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.bookingAmount}>
          ₹{Math.round(booking.totalValuePaise / 100).toLocaleString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.statusText, { color }]}>{booking.status}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HotelOtaDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // In a real implementation, the hotel staff JWT would come from SecureStore
  // after the hotel panel login flow. Using placeholder for now.
  const [hotelToken, setHotelToken] = useState<string | null>(null);
  const [hotelId, setHotelId] = useState<string | null>(null);

  const [bookings, setBookings] = useState<OtaBookingSummary[]>([]);
  const [coinProgram, setCoinProgram] = useState<BrandCoinProgram | null>(null);
  const [pmsStatus, setPmsStatus] = useState<PmsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'coins' | 'settings'>('bookings');

  // Stats derived from bookings
  const todayStr = new Date().toISOString().slice(0, 10);
  const arrivalsToday = bookings.filter(
    (b) => b.checkinDate === todayStr && b.status === 'confirmed'
  ).length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const totalRevenuePaise = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((s, b) => s + b.totalValuePaise, 0);

  const load = useCallback(async () => {
    try {
      // FIX-BIZOS-002: Also fetch PMS status for Settings tab
      const [bookingsData, coinData, pmsData] = await Promise.allSettled([
        hotelOtaService.getBookings(20),
        hotelOtaService.getBrandCoinProgram(),
        // FIX-BIZOS-002: Fetch PMS status - was missing
        hotelId ? hotelOtaService.getPmsStatus() : Promise.reject('No hotel ID'),
      ]);
      if (bookingsData.status === 'fulfilled') {
        setBookings(bookingsData.value);
      }
      if (coinData.status === 'fulfilled') {
        setCoinProgram(coinData.value);
      }
      // FIX-BIZOS-002: Set PMS status if fetched successfully
      if (pmsData.status === 'fulfilled') {
        setPmsStatus(pmsData.value);
      }
    } catch {
      /* ignore — service throws user-friendly messages that surface in the UI */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hotelId]);

  useEffect(() => {
    (async () => {
      try {
        const [token, id] = await Promise.all([
          SecureStore.getItemAsync('@hotel_ota:staff_token', {
            keychainService: 'rez.merchant.hotel',
          }),
          SecureStore.getItemAsync('@hotel_ota:hotel_id', {
            keychainService: 'rez.merchant.hotel',
          }),
        ]);
        if (token) setHotelToken(token);
        if (id) setHotelId(id);
      } catch {
        // SecureStore failure is non-fatal — user will see "connect" state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConnect = () => {
    const otaPanelUrl = `${OTA_BASE}/login?redirect=merchant`;
    Alert.alert(
      'Connect to Hotel OTA',
      'Open the Hotel OTA panel to log in and link your property.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open OTA Panel',
          onPress: () => {
            Linking.openURL(otaPanelUrl).catch(() => {
              Alert.alert('Error', 'Could not open OTA panel. Please try again.');
            });
          },
        },
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Hotel OTA Dashboard</Text>
        <View style={{ width: 30 }} />
      </LinearGradient>

      {!hotelToken ? (
        /* Not connected */
        <View style={styles.connectContainer}>
          <View style={styles.connectCard}>
            <Ionicons
              name="globe-outline"
              size={56}
              color={C.cyanDark}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.connectTitle}>Connect to Hotel OTA</Text>
            <Text style={styles.connectDesc}>
              Link your property to the REZ Hotel OTA platform to manage online bookings, set up
              your loyalty coin program, and sync with your PMS.
            </Text>
            <Pressable style={styles.connectBtn} onPress={handleConnect}>
              <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.connectBtnGrad}>
                <Ionicons name="link-outline" size={18} color="#fff" />
                <Text style={styles.connectBtnText}>Connect Property</Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.connectHint}>
              Need an OTA account? Contact REZ support to onboard your property.
            </Text>
          </View>
        </View>
      ) : (
        <>
          {/* Tab bar */}
          <View style={styles.tabBar}>
            {(['bookings', 'coins', 'settings'] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'bookings' ? 'Bookings' : tab === 'coins' ? 'Brand Coins' : 'Settings'}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} />
            }
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator size="large" color={C.cyan} style={{ marginTop: 60 }} />
            ) : activeTab === 'bookings' ? (
              <>
                {/* Stats row */}
                <View style={styles.statsRow}>
                  <StatCard
                    icon="today-outline"
                    label="Arrivals Today"
                    value={String(arrivalsToday)}
                    color={C.cyan}
                  />
                  <StatCard
                    icon="checkmark-circle-outline"
                    label="Confirmed"
                    value={String(confirmedCount)}
                    color={C.green}
                  />
                  <StatCard
                    icon="cash-outline"
                    label="Revenue"
                    value={`₹${Math.round(totalRevenuePaise / 100).toLocaleString()}`}
                    color={C.gold}
                  />
                </View>

                <Text style={styles.sectionTitle}>Recent Bookings</Text>
                {bookings.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="bed-outline" size={40} color={C.slate200} />
                    <Text style={styles.emptyText}>No bookings yet</Text>
                  </View>
                ) : (
                  bookings.map((b) => <BookingRow key={b.id} booking={b} />)
                )}
              </>
            ) : activeTab === 'coins' ? (
              <>
                {coinProgram ? (
                  <>
                    <View style={styles.card}>
                      <View style={styles.coinProgramRow}>
                        <View style={[styles.coinIconBox, { backgroundColor: '#F5F3FF' }]}>
                          <Ionicons name="wallet" size={24} color={C.purple} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.coinProgramName}>
                            {coinProgram.brandCoinName} ({coinProgram.brandCoinSymbol})
                          </Text>
                          <View
                            style={[
                              styles.programBadge,
                              { backgroundColor: coinProgram.enabled ? '#DCFCE7' : '#FEF2F2' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.programBadgeText,
                                { color: coinProgram.enabled ? C.green : C.red },
                              ]}
                            >
                              {coinProgram.enabled ? 'Active' : 'Disabled'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.coinStatsRow}>
                        <View style={styles.coinStat}>
                          <Text style={styles.coinStatValue}>{coinProgram.earnPct}%</Text>
                          <Text style={styles.coinStatLabel}>Earn Rate</Text>
                        </View>
                        <View style={styles.coinStat}>
                          <Text style={styles.coinStatValue}>{coinProgram.maxBurnPct}%</Text>
                          <Text style={styles.coinStatLabel}>Max Redeem</Text>
                        </View>
                        <View style={styles.coinStat}>
                          <Text style={styles.coinStatValue}>
                            {coinProgram.totalMembersCount.toLocaleString()}
                          </Text>
                          <Text style={styles.coinStatLabel}>Members</Text>
                        </View>
                        <View style={styles.coinStat}>
                          <Text style={styles.coinStatValue}>
                            ₹{Math.round(coinProgram.totalOutstandingPaise / 100).toLocaleString()}
                          </Text>
                          <Text style={styles.coinStatLabel}>Outstanding</Text>
                        </View>
                      </View>
                    </View>
                    <Pressable style={styles.editProgramBtn}>
                      <Ionicons name="settings-outline" size={16} color={C.cyanDark} />
                      <Text style={styles.editProgramText}>Edit Coin Program</Text>
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.empty}>
                    <Ionicons name="wallet-outline" size={40} color={C.slate200} />
                    <Text style={styles.emptyText}>No coin program configured</Text>
                    <Text style={styles.emptyHint}>
                      Contact REZ admin to enable the brand coin program for your property.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              /* Settings tab */
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>PMS Connection</Text>
                <View style={styles.pmsRow}>
                  <Ionicons
                    name={pmsStatus?.connected ? 'checkmark-circle' : 'close-circle'}
                    size={22}
                    color={pmsStatus?.connected ? C.green : C.red}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.pmsStatusText}>
                      {pmsStatus?.connected ? 'Connected' : 'Not Connected'}
                    </Text>
                    {pmsStatus?.lastSync && (
                      <Text style={styles.pmsLastSync}>
                        Last sync: {new Date(pmsStatus.lastSync).toLocaleString()}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    style={styles.syncBtn}
                    onPress={async () => {
                      try {
                        const result = await hotelOtaService.syncPmsInventory();
                        if (result.success) {
                          Alert.alert('Sync Complete', 'Inventory synced successfully');
                          load(); // Refresh all data
                        } else {
                          Alert.alert('Sync Failed', 'Could not sync with PMS');
                        }
                      } catch (e) {
                        Alert.alert('Error', e.message || 'Sync failed');
                      }
                    }}
                  >
                    <Ionicons name="refresh-outline" size={16} color={C.cyanDark} />
                    <Text style={styles.syncBtnText}>Sync</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  connectContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  connectCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  connectTitle: { fontSize: 20, fontWeight: '800', color: C.navy, marginBottom: 12 },
  connectDesc: {
    fontSize: 14,
    color: C.slate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectBtn: { borderRadius: 14, overflow: 'hidden', width: '100%', marginBottom: 16 },
  connectBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  connectBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  connectHint: { fontSize: 12, color: C.slate, textAlign: 'center', lineHeight: 16 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    backgroundColor: C.white,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.cyan },
  tabText: { fontSize: 13, fontWeight: '600', color: C.slate },
  tabTextActive: { color: C.cyan },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: C.navy },
  statLabel: { fontSize: 10, color: C.slate, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 12 },
  bookingRow: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
    }),
  },
  bookingGuest: { fontSize: 14, fontWeight: '700', color: C.navy },
  bookingRoom: { fontSize: 12, color: C.slate, marginTop: 2 },
  bookingDates: { fontSize: 11, color: C.slate, marginTop: 3 },
  bookingAmount: { fontSize: 14, fontWeight: '800', color: C.navy },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600', color: C.slate },
  emptyHint: { fontSize: 13, color: C.slate, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  coinProgramRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  coinIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinProgramName: { fontSize: 15, fontWeight: '700', color: C.navy, marginBottom: 4 },
  programBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  programBadgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: C.slate200, marginVertical: 12 },
  coinStatsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  coinStat: { alignItems: 'center' },
  coinStatValue: { fontSize: 16, fontWeight: '800', color: C.navy },
  coinStatLabel: { fontSize: 10, color: C.slate, fontWeight: '600', marginTop: 2 },
  editProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.slate200,
    paddingVertical: 12,
    backgroundColor: C.white,
  },
  editProgramText: { color: C.cyanDark, fontWeight: '700', fontSize: 14 },
  pmsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
  },
  pmsStatusText: { fontSize: 14, fontWeight: '600', color: C.navy },
  pmsLastSync: { fontSize: 11, color: C.slate, marginTop: 2 },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.white,
  },
  syncBtnText: { fontSize: 13, fontWeight: '600', color: C.cyanDark },
});
