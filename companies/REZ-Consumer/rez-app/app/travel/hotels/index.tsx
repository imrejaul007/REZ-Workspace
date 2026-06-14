// @ts-nocheck
/**
 * Hotel Search Screen
 * REZ App → Hotel OTA integration
 * Route: /travel/hotels
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { BRAND } from '@/constants/brand';
import { searchHotels, OtaHotel, rezSsoLogin, getOtaToken } from '@/services/hotelOtaApi';
import { useAuthStore } from '@/stores/authStore';

const { width: SW } = Dimensions.get('window');

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  cyan: colors.brand?.cyan ?? '#06B6D4',
  cyanDark: colors.cyanDark ?? '#0891B2',
  navy: '#0F172A',
  slate: '#64748B',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  gold: '#F59E0B',
  green: '#16A34A',
};

// ─── Popular cities ───────────────────────────────────────────────────────────
const POPULAR_CITIES = [
  { name: 'Mumbai', icon: '🌆' },
  { name: 'Delhi', icon: '🏛️' },
  { name: 'Goa', icon: '🏖️' },
  { name: 'Jaipur', icon: '🏰' },
  { name: 'Bangalore', icon: '🌳' },
  { name: 'Manali', icon: '🏔️' },
];

// ─── Hotel card ───────────────────────────────────────────────────────────────
function HotelCard({ hotel, onPress }: { hotel: OtaHotel; onPress: () => void }) {
  const basePaise = hotel.baseRatePaise ?? 0;
  const discountedPaise = Math.round(basePaise * (1 - (hotel.discountPct ?? 0) / 100));
  const savingsPaise = basePaise - discountedPaise;
  const heroImg = hotel.images?.[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardImagePlaceholder}>
        {heroImg ? (
          <Image source={{ uri: heroImg }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.cardImageGrad}>
            <Ionicons name="bed" size={36} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        )}
        {hotel.discountPct > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{hotel.discountPct}% OFF</Text>
          </View>
        )}
        {hotel.brandCoinEnabled && (
          <View style={styles.coinBadge}>
            <Text style={styles.coinBadgeText}>🪙 Earn {hotel.brandCoinName ?? 'coins'}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {hotel.name}
        </Text>
        <Text style={styles.cardCity}>
          {hotel.city}, {hotel.country}
        </Text>

        <View style={styles.cardRatingRow}>
          <Ionicons name="star" size={13} color={C.gold} />
          <Text style={styles.cardRating}>{hotel.rating?.toFixed(1) ?? '—'}</Text>
          <Text style={styles.cardReviews}>({hotel.reviewCount ?? 0})</Text>
          <View style={styles.starsDot} />
          {[...Array(Math.min(hotel.starRating ?? 3, 5))].map((_, i) => (
            <Ionicons key={i} name="star" size={10} color={C.gold} />
          ))}
        </View>

        <View style={styles.cardPriceRow}>
          <View>
            {savingsPaise > 0 && (
              <Text style={styles.cardOriginal}>₹{Math.round(basePaise / 100).toLocaleString()}</Text>
            )}
            <Text style={styles.cardPrice}>₹{Math.round(discountedPaise / 100).toLocaleString()}</Text>
            <Text style={styles.cardPerNight}>per night</Text>
          </View>
          {savingsPaise > 0 && (
            <View style={styles.savingsPill}>
              <Text style={styles.savingsText}>Save ₹{Math.round(savingsPaise / 100).toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HotelSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);

  const [city, setCity] = useState('');
  const [hotels, setHotels] = useState<OtaHotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'stars'>('price_asc');
  const [minStars, setMinStars] = useState(0);
  const [maxPricePaise, setMaxPricePaise] = useState(0); // 0 = no limit

  // Date & guests state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const fmtDate = (d: Date) => d.toISOString().split('T')[0];
  const [checkin, setCheckin] = useState(fmtDate(tomorrow));
  const [checkout, setCheckout] = useState(fmtDate(dayAfter));
  const [guests, setGuests] = useState(1);

  // Auto-SSO into Hotel OTA with existing REZ token.
  // Refresh OTA token if it is missing or within 5 minutes of expiry.
  useEffect(() => {
    if (!token) return;
    getOtaToken().then(async (existing) => {
      let needsRefresh = !existing;
      if (existing && !needsRefresh) {
        try {
          // Decode expiry from JWT payload (base64url middle segment)
          const payload = JSON.parse(
            Buffer.from(existing.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
          );
          const expiresInMs = (payload.exp ?? 0) * 1000 - Date.now();
          if (expiresInMs < 5 * 60 * 1000) needsRefresh = true; // refresh if < 5 min left
        } catch {
          needsRefresh = true; // unreadable token — refresh
        }
      }
      if (!needsRefresh) return;
      setSsoLoading(true);
      try {
        await rezSsoLogin(token);
      } catch {
        // Non-fatal — user can still browse, just can't book
      } finally {
        setSsoLoading(false);
      }
    });
  }, [token]);

  const doSearch = useCallback(
    async (searchCity?: string) => {
      const q = searchCity ?? city;
      setLoading(true);
      setError(null);
      try {
        const res = await searchHotels({ city: q || undefined, checkin, checkout, guests, limit: 40 });
        let list = res.hotels ?? [];
        // Client-side filter + sort
        if (minStars > 0) list = list.filter((h) => (h.starRating ?? 0) >= minStars);
        if (maxPricePaise > 0) list = list.filter((h) => (h.baseRatePaise ?? 0) <= maxPricePaise);
        if (sortBy === 'price_asc') list.sort((a, b) => (a.baseRatePaise ?? 0) - (b.baseRatePaise ?? 0));
        else if (sortBy === 'price_desc') list.sort((a, b) => (b.baseRatePaise ?? 0) - (a.baseRatePaise ?? 0));
        else if (sortBy === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        else if (sortBy === 'stars') list.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0));
        setHotels(list);
      } catch (e) {
        setError(e.message ?? 'Failed to load hotels');
      } finally {
        setLoading(false);
      }
    },
    [city, checkin, checkout, guests, minStars, maxPricePaise, sortBy],
  );

  // Load on mount
  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Hotels</Text>
        {ssoLoading && <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />}
      </LinearGradient>

      {/* Date & Guests picker */}
      <View style={styles.datesRow}>
        <View style={styles.dateBox}>
          <Ionicons name="calendar-outline" size={14} color={C.slate} style={{ marginRight: 4 }} />
          <Text style={styles.dateLabel}>Check-in</Text>
          <TextInput
            style={styles.dateInput}
            value={checkin}
            onChangeText={(v) => setCheckin(v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.slate}
          />
        </View>
        <Ionicons name="arrow-forward" size={14} color={C.slate200} />
        <View style={styles.dateBox}>
          <Ionicons name="calendar-outline" size={14} color={C.slate} style={{ marginRight: 4 }} />
          <Text style={styles.dateLabel}>Check-out</Text>
          <TextInput
            style={styles.dateInput}
            value={checkout}
            onChangeText={(v) => setCheckout(v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.slate}
          />
        </View>
        <View style={styles.guestsBox}>
          <Pressable onPress={() => setGuests(Math.max(1, guests - 1))} style={styles.guestBtn}>
            <Ionicons name="remove" size={14} color={C.cyanDark} />
          </Pressable>
          <Text style={styles.guestsText}>
            {guests} guest{guests !== 1 ? 's' : ''}
          </Text>
          <Pressable onPress={() => setGuests(Math.min(10, guests + 1))} style={styles.guestBtn}>
            <Ionicons name="add" size={14} color={C.cyanDark} />
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={C.slate} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search city, hotel..."
            placeholderTextColor={C.slate}
            value={city}
            onChangeText={setCity}
            onSubmitEditing={() => doSearch()}
            returnKeyType="search"
          />
          {city.length > 0 && (
            <Pressable
              onPress={() => {
                setCity('');
                doSearch('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={C.slate} />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.searchBtn} onPress={() => doSearch()}>
          <Text style={styles.searchBtnText}>Search</Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterBtn,
            (minStars > 0 || maxPricePaise > 0 || sortBy !== 'price_asc') && styles.filterBtnActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={minStars > 0 || maxPricePaise > 0 || sortBy !== 'price_asc' ? '#fff' : C.cyanDark}
          />
        </Pressable>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.filterOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.filterHandle} />
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}
            >
              <Text style={{ fontSize: 18, fontWeight: '800', color: C.navy }}>Filters</Text>
              <Pressable
                onPress={() => {
                  setSortBy('price_asc');
                  setMinStars(0);
                  setMaxPricePaise(0);
                }}
              >
                <Text style={{ color: C.cyanDark, fontWeight: '600', fontSize: 13 }}>Reset</Text>
              </Pressable>
            </View>

            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.filterChipRow}>
              {(
                [
                  ['price_asc', 'Price: Low→High'],
                  ['price_desc', 'Price: High→Low'],
                  ['rating', 'Top Rated'],
                  ['stars', 'Star Rating'],
                ] as const
              ).map(([val, lbl]) => (
                <Pressable
                  key={val}
                  style={[styles.filterChip, sortBy === val && styles.filterChipActive]}
                  onPress={() => setSortBy(val)}
                >
                  <Text style={[styles.filterChipText, sortBy === val && { color: '#fff' }]}>{lbl}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Minimum Stars</Text>
            <View style={styles.filterChipRow}>
              {[0, 2, 3, 4, 5].map((s) => (
                <Pressable
                  key={s}
                  style={[styles.filterChip, minStars === s && styles.filterChipActive]}
                  onPress={() => setMinStars(s)}
                >
                  <Text style={[styles.filterChipText, minStars === s && { color: '#fff' }]}>
                    {s === 0 ? 'Any' : `${s}★+`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Max Price / Night</Text>
            <View style={styles.filterChipRow}>
              {[
                [0, 'Any'],
                [250000, '₹2,500'],
                [500000, '₹5,000'],
                [1000000, '₹10,000'],
              ].map(([val, lbl]) => (
                <Pressable
                  key={val}
                  style={[styles.filterChip, maxPricePaise === val && styles.filterChipActive]}
                  onPress={() => setMaxPricePaise(val as number)}
                >
                  <Text style={[styles.filterChipText, maxPricePaise === val && { color: '#fff' }]}>{lbl}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.filterApplyBtn}
              onPress={() => {
                setShowFilters(false);
                doSearch();
              }}
            >
              <Text style={styles.filterApplyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Popular cities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {POPULAR_CITIES.map((c) => (
              <Pressable
                key={c.name}
                style={styles.cityChip}
                onPress={() => {
                  setCity(c.name);
                  doSearch(c.name);
                }}
              >
                <Text style={styles.cityChipEmoji}>{c.icon}</Text>
                <Text style={styles.cityChipName}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Earn coins banner */}
        <View style={styles.coinBanner}>
          <LinearGradient colors={['#1E3A8A', '#1D4ED8']} style={styles.coinBannerGrad}>
            <Ionicons name="wallet" size={24} color="#FCD34D" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.coinBannerTitle}>Use REZ + OTA Coins</Text>
              <Text style={styles.coinBannerSub}>Up to 40% off using your coins at checkout</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{city ? `Hotels in ${city}` : 'Featured Hotels'}</Text>

          {loading && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.cyan} />
              <Text style={styles.loadingText}>Finding hotels...</Text>
            </View>
          )}

          {error && (
            <View style={styles.center}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={() => doSearch()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {!loading && !error && hotels.length === 0 && (
            <View style={styles.center}>
              <Ionicons name="bed-outline" size={48} color={C.slate200} />
              <Text style={styles.emptyText}>No hotels found</Text>
              <Text style={styles.emptySubText}>Try a different city</Text>
            </View>
          )}

          {!loading &&
            hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onPress={() =>
                  router.push({
                    pathname: '/travel/hotels/[id]' as unknown,
                    params: { id: hotel.id, checkin, checkout, guests: String(guests) },
                  })
                }
              />
            ))}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1 },
  datesRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, gap: 8 },
  dateBox: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  dateLabel: { fontSize: 10, color: C.slate, fontWeight: '600', marginBottom: 2 },
  dateInput: { fontSize: 13, color: C.navy, padding: 0 },
  guestsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: C.slate200,
    gap: 6,
  },
  guestBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestsText: { fontSize: 11, color: C.navy, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 16, marginTop: 8, gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    height: 46,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  searchInput: { flex: 1, fontSize: 15, color: C.navy },
  searchBtn: { backgroundColor: C.cyan, borderRadius: 12, paddingHorizontal: 16, height: 46, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.navy },
  cityChip: {
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.slate200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  cityChipEmoji: { fontSize: 20, marginBottom: 4 },
  cityChipName: { fontSize: 12, fontWeight: '600', color: C.navy },
  coinBanner: { marginHorizontal: 16, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  coinBannerGrad: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  coinBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  coinBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  cardImagePlaceholder: { height: 160, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImageGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  coinBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  coinBadgeText: { color: '#FCD34D', fontSize: 11, fontWeight: '600' },
  cardBody: { padding: 14 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 3 },
  cardCity: { fontSize: 12, color: C.slate, marginBottom: 8 },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardRating: { fontSize: 13, fontWeight: '700', color: C.navy, marginLeft: 3 },
  cardReviews: { fontSize: 12, color: C.slate, marginLeft: 3 },
  starsDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.slate200, marginHorizontal: 6 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardOriginal: { fontSize: 12, color: C.slate, textDecorationLine: 'line-through' },
  cardPrice: { fontSize: 20, fontWeight: '800', color: C.navy },
  cardPerNight: { fontSize: 11, color: C.slate },
  savingsPill: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  savingsText: { color: C.green, fontSize: 12, fontWeight: '700' },
  center: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { color: C.slate, marginTop: 12, fontSize: 14 },
  errorText: { color: '#EF4444', marginTop: 10, fontSize: 14, textAlign: 'center' },
  retryBtn: { marginTop: 12, backgroundColor: C.cyan, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyText: { fontSize: 16, fontWeight: '700', color: C.slate, marginTop: 12 },
  emptySubText: { fontSize: 13, color: C.slate200, marginTop: 4 },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: C.cyanDark },
  filterOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  filterHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.slate200,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  filterLabel: { fontSize: 13, fontWeight: '700', color: C.navy, marginBottom: 10 },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: C.slate200,
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: C.cyanDark, borderColor: C.cyanDark },
  filterChipText: { fontSize: 13, fontWeight: '600', color: C.navy },
  filterApplyBtn: { backgroundColor: C.cyanDark, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  filterApplyText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
