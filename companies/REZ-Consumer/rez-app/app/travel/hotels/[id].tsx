// @ts-nocheck
/**
 * Hotel Detail Screen
 * Route: /travel/hotels/[id]
 * Params: id, checkin, checkout, guests (passed from search screen)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '@/components/common/ToastManager';
import { colors } from '@/constants/theme';
import {
  getHotelById,
  getHotelRoomTypes,
  checkBurnCoins,
  holdBooking,
  getOtaToken,
  getPaymentOptions,
  OtaHotel,
  OtaRoomType,
  OtaCheckBurnResult,
  PaymentOption,
} from '@/services/hotelOtaApi';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  navy: '#0F172A',
  slate: '#64748B',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  gold: '#F59E0B',
  green: '#16A34A',
  purple: '#7C3AED',
  red: '#EF4444',
};

function paise(p: number) {
  return `₹${Math.round(p / 100).toLocaleString()}`;
}

function RoomCard({
  room,
  selected,
  onSelect,
  coinSaving,
}: {
  room: OtaRoomType;
  selected: boolean;
  onSelect: () => void;
  coinSaving: number;
}) {
  return (
    <Pressable style={[styles.roomCard, selected && styles.roomCardSelected]} onPress={onSelect}>
      <View style={styles.roomCardHeader}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          color={selected ? C.cyan : C.slate200}
        />
      </View>
      <Text style={styles.roomDesc} numberOfLines={2}>
        {room.description}
      </Text>
      <View style={styles.roomMeta}>
        <Ionicons name="people" size={14} color={C.slate} />
        <Text style={styles.roomMetaText}>Max {room.maxOccupancy} guests</Text>
      </View>
      <View style={styles.roomPriceRow}>
        <Text style={styles.roomPrice}>
          {paise(room.baseRatePaise)}
          <Text style={styles.roomPerNight}>/night</Text>
        </Text>
        {coinSaving > 0 && (
          <View style={styles.coinSavingPill}>
            <Text style={styles.coinSavingText}>Save {paise(coinSaving)} with coins</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function CoinToggle({
  label,
  balance,
  enabled,
  onToggle,
  color,
}: {
  label: string;
  balance: number;
  enabled: boolean;
  onToggle: () => void;
  color: string;
}) {
  if (balance <= 0) return null;
  return (
    <Pressable
      style={[styles.coinToggle, enabled && { borderColor: color, backgroundColor: `${color}10` }]}
      onPress={onToggle}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.coinToggleLabel, enabled && { color }]}>{label}</Text>
        <Text style={styles.coinToggleBal}>{paise(balance)} available</Text>
      </View>
      <View style={[styles.coinToggleSwitch, enabled && { backgroundColor: color }]}>
        <Ionicons name={enabled ? 'checkmark' : 'close'} size={14} color="#fff" />
      </View>
    </Pressable>
  );
}

function PaymentOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: PaymentOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const iconMap: Record<string, string> = {
    card: 'card-outline',
    cash: 'cash-outline',
    wallet: 'wallet-outline',
  };
  const iconName = iconMap[option.icon] || 'card-outline';

  return (
    <Pressable
      style={[styles.paymentOptionCard, selected && styles.paymentOptionCardSelected]}
      onPress={onSelect}
    >
      <View style={styles.paymentOptionLeft}>
        <View style={[styles.paymentOptionIcon, selected && { backgroundColor: `${C.cyan}20` }]}>
          <Ionicons name={iconName as unknown} size={20} color={selected ? C.cyan : C.slate} />
        </View>
        <View style={styles.paymentOptionInfo}>
          <View style={styles.paymentOptionNameRow}>
            <Text style={[styles.paymentOptionName, selected && styles.paymentOptionNameSelected]}>
              {option.name}
            </Text>
            {option.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            )}
            {option.requiresCreditCard && (
              <View style={styles.creditCardBadge}>
                <Ionicons name="card" size={10} color={C.slate} />
                <Text style={styles.creditCardBadgeText}>Card req.</Text>
              </View>
            )}
          </View>
          <Text style={styles.paymentOptionDesc}>{option.description}</Text>
        </View>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? C.cyan : C.slate200}
      />
    </Pressable>
  );
}

export default function HotelDetailScreen() {
  const {
    id,
    checkin: paramCheckin,
    checkout: paramCheckout,
    guests: paramGuests,
  } = useLocalSearchParams<{
    id: string;
    checkin?: string;
    checkout?: string;
    guests?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Use params from search, fall back to tomorrow/day-after (same-day check-in is invalid)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const defaultCheckin = paramCheckin ?? tomorrow.toISOString().split('T')[0];
  const defaultCheckout = paramCheckout ?? dayAfter.toISOString().split('T')[0];
  const defaultGuests = parseInt(paramGuests ?? '2', 10) || 2;

  const [checkin] = useState(defaultCheckin);
  const [checkout] = useState(defaultCheckout);
  const [numGuests] = useState(defaultGuests);

  const [hotel, setHotel] = useState<OtaHotel | null>(null);
  const [rooms, setRooms] = useState<OtaRoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [burnResult, setBurnResult] = useState<OtaCheckBurnResult | null>(null);
  const [burnLoading, setBurnLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // Coin toggles
  const [useOtaCoins, setUseOtaCoins] = useState(true);
  const [useRezCoins, setUseRezCoins] = useState(true);
  const [useBrandCoins, setUseBrandCoins] = useState(true);

  // Payment options
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>('prepay');

  // Guest details modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getHotelById(id), getHotelRoomTypes(id)])
      .then(([h, r]) => {
        setHotel(h);
        setRooms(r);
        if (r.length) setSelectedRoom(r[0].id);
      })
      .catch((e) => setLoadError(e?.message ?? 'Failed to load hotel details'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch payment options
  useEffect(() => {
    if (!id) return;
    getPaymentOptions(id)
      .then((data) => {
        setPaymentOptions(data.options || []);
        setSelectedPaymentOption(data.defaultOption || 'prepay');
      })
      .catch(() => {
        // Use default payment options if API fails
        setPaymentOptions([
          { id: 'prepay', name: 'Pay Now', description: 'Prepay and save more', discount: 5, icon: 'card', popular: true },
          { id: 'pay_at_hotel', name: 'Pay at Hotel', description: 'Pay when you arrive', discount: 0, icon: 'cash', popular: false, requiresCreditCard: true },
          { id: 'partial', name: 'Partial Payment', description: 'Pay 30% now, rest at checkout', discount: 2, icon: 'wallet', popular: false },
        ]);
      });
  }, [id]);

  // Recheck burn when room/coin toggles change — debounced 300ms to avoid
  // firing a network call on every toggle press.
  const burnDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!id || !selectedRoom) return;
    if (burnDebounceRef.current) clearTimeout(burnDebounceRef.current);
    burnDebounceRef.current = setTimeout(() => {
      setBurnLoading(true);
      const selectedRoomObj = rooms.find((r) => r.id === selectedRoom);
      const nights = Math.max(1, Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000));
      const bookingValuePaise = (selectedRoomObj?.baseRatePaise ?? 0) * nights;
      checkBurnCoins({
        hotelId: id,
        roomTypeId: selectedRoom,
        checkin,
        checkout,
        numRooms: 1,
        numGuests,
        bookingValuePaise,
        otaCoinRequestedPaise: useOtaCoins ? 999999 : 0,
        rezCoinRequestedPaise: useRezCoins ? 999999 : 0,
        hotelBrandCoinRequestedPaise: useBrandCoins ? 999999 : 0,
      })
        .then((r) => setBurnResult(r))
        .catch(() => setBurnResult(null))
        .finally(() => setBurnLoading(false));
    }, 300);
    return () => {
      if (burnDebounceRef.current) clearTimeout(burnDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedRoom, useOtaCoins, useRezCoins, useBrandCoins]);

  const handleBookPress = useCallback(async () => {
    const token = await getOtaToken();
    if (!token) {
      showToast({ type: 'warning', message: 'Please log in with REZ to book this hotel.' });
      return;
    }
    if (!id || !selectedRoom) return;
    setShowGuestModal(true);
  }, [id, selectedRoom]);

  const handleConfirmGuest = useCallback(async () => {
    if (!guestName.trim()) {
      showToast({ type: 'warning', message: 'Please enter guest name.' });
      return;
    }
    if (!/^\d{10}$/.test(guestPhone.trim())) {
      showToast({ type: 'warning', message: 'Please enter a valid 10-digit phone number.' });
      return;
    }

    setShowGuestModal(false);
    setBooking(true);
    try {
      const hold = await holdBooking({
        hotelId: id!,
        roomTypeId: selectedRoom!,
        checkin,
        checkout,
        numRooms: 1,
        numGuests,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim().slice(0, 500) || undefined,
        otaCoinBurnPaise: useOtaCoins && burnResult ? burnResult.ota_coin_applicable_paise : 0,
        rezCoinBurnPaise: useRezCoins && burnResult ? burnResult.rez_coin_applicable_paise : 0,
        hotelBrandCoinBurnPaise: useBrandCoins && burnResult ? burnResult.hotel_brand_coin_applicable_paise : 0,
        paymentOption: selectedPaymentOption as 'prepay' | 'pay_at_hotel' | 'partial',
      });

      router.push({
        pathname: '/travel/hotels/checkout' as unknown,
        params: {
          holdId: hold.holdId,
          bookingRef: hold.bookingRef,
          hotelName: hotel?.name ?? '',
          checkin,
          checkout,
          totalPaise: String(hold.totalPaise),
          pgAmountPaise: String(hold.pgAmountPaise),
          otaCoinAppliedPaise: String(hold.otaCoinAppliedPaise),
          rezCoinAppliedPaise: String(hold.rezCoinAppliedPaise),
          hotelBrandCoinAppliedPaise: String(hold.hotelBrandCoinAppliedPaise),
          holdExpiresAt: hold.holdExpiresAt,
          razorpayOrderId: hold.razorpayOrderId ?? '',
          paymentOption: selectedPaymentOption,
          payAtHotelAmountPaise: hold.payAtHotelAmountPaise ? String(hold.payAtHotelAmountPaise) : '0',
        },
      });
    } catch (e) {
      showToast({ type: 'error', message: e.message ?? 'Booking failed. Please try again.' });
    } finally {
      setBooking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    selectedRoom,
    guestName,
    guestPhone,
    specialRequests,
    burnResult,
    useOtaCoins,
    useRezCoins,
    useBrandCoins,
    hotel,
    checkin,
    checkout,
    numGuests,
  ]);

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <ActivityIndicator size="large" color={C.cyan} />
      </View>
    );
  }

  if (!hotel) {
    return (
      <View style={[styles.center, { flex: 1 }]}>
        <Text style={{ color: C.slate, marginBottom: 12 }}>{loadError ?? 'Hotel not found'}</Text>
        {loadError && (
          <Pressable
            onPress={() => {
              setLoadError(null);
              setLoading(true);
              if (id)
                Promise.all([getHotelById(id), getHotelRoomTypes(id)])
                  .then(([h, r]) => {
                    setHotel(h);
                    setRooms(r);
                    if (r.length) setSelectedRoom(r[0].id);
                  })
                  .catch((e) => setLoadError(e?.message ?? 'Failed to load'))
                  .finally(() => setLoading(false));
            }}
            style={{ paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#06B6D4', borderRadius: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const totalSaving =
    ((useOtaCoins ? burnResult?.ota_coin_applicable_paise : 0) ?? 0) +
    ((useRezCoins ? burnResult?.rez_coin_applicable_paise : 0) ?? 0) +
    ((useBrandCoins ? burnResult?.hotel_brand_coin_applicable_paise : 0) ?? 0);

  // Use pg_amount_paise from check-burn result (what user actually pays after coin discounts).
  // Fall back to room base rate when no burn result is available.
  const effectivePay = burnResult
    ? burnResult.pg_amount_paise
    : (rooms.find((r) => r.id === selectedRoom)?.baseRatePaise ?? 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Hero — photo or gradient */}
      <View style={styles.heroContainer}>
        {hotel.images?.[0] ? (
          <Image source={{ uri: hotel.images[0] }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#0891B2', '#06B6D4']} style={styles.heroGrad} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(8,145,178,0.85)']} style={styles.heroOverlay}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.heroContent}>
            <Text style={styles.heroName}>{hotel.name}</Text>
            <Text style={styles.heroCity}>
              {hotel.city}, {hotel.country}
            </Text>
            <View style={styles.heroRatingRow}>
              <Ionicons name="star" size={14} color={C.gold} />
              <Text style={styles.heroRating}>{hotel.rating?.toFixed(1) ?? '—'}</Text>
              <Text style={styles.heroReviews}>({hotel.reviewCount ?? 0} reviews)</Text>
              {'  ·  '}
              {[...Array(Math.min(hotel.starRating ?? 3, 5))].map((_, i) => (
                <Ionicons key={i} name="star" size={11} color={C.gold} />
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Stay dates bar */}
        <View style={styles.datesBar}>
          <View style={styles.datesBarItem}>
            <Ionicons name="log-in-outline" size={14} color={C.cyanDark} />
            <Text style={styles.datesBarLabel}>Check-in</Text>
            <Text style={styles.datesBarValue}>{checkin}</Text>
          </View>
          <View style={styles.datesBarDivider} />
          <View style={styles.datesBarItem}>
            <Ionicons name="log-out-outline" size={14} color={C.slate} />
            <Text style={styles.datesBarLabel}>Check-out</Text>
            <Text style={styles.datesBarValue}>{checkout}</Text>
          </View>
          <View style={styles.datesBarDivider} />
          <View style={styles.datesBarItem}>
            <Ionicons name="people-outline" size={14} color={C.slate} />
            <Text style={styles.datesBarLabel}>Guests</Text>
            <Text style={styles.datesBarValue}>{numGuests}</Text>
          </View>
        </View>

        {/* Savings banner */}
        {totalSaving > 0 && (
          <LinearGradient colors={['#064E3B', '#065F46']} style={styles.savingsBanner}>
            <Ionicons name="wallet" size={22} color="#34D399" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.savingsBannerTitle}>You save {paise(totalSaving)} with coins!</Text>
              <View style={styles.savingsBreakdownRow}>
                {useOtaCoins && (burnResult?.ota_coin_applicable_paise ?? 0) > 0 && (
                  <Text style={styles.savingsChip}>OTA {paise(burnResult!.ota_coin_applicable_paise)}</Text>
                )}
                {useRezCoins && (burnResult?.rez_coin_applicable_paise ?? 0) > 0 && (
                  <Text style={styles.savingsChip}>REZ {paise(burnResult!.rez_coin_applicable_paise)}</Text>
                )}
                {useBrandCoins && (burnResult?.hotel_brand_coin_applicable_paise ?? 0) > 0 && (
                  <Text style={[styles.savingsChip, { backgroundColor: 'rgba(167,139,250,0.2)', color: '#C4B5FD' }]}>
                    {hotel.brandCoinName ?? 'Brand'} {paise(burnResult!.hotel_brand_coin_applicable_paise)}
                  </Text>
                )}
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Coin toggles */}
        {burnResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Apply Coins</Text>
            <CoinToggle
              label="OTA Coins"
              balance={burnResult.ota_coin_applicable_paise}
              enabled={useOtaCoins}
              onToggle={() => setUseOtaCoins((v) => !v)}
              color={C.cyan}
            />
            <CoinToggle
              label="REZ Coins"
              balance={burnResult.rez_coin_applicable_paise}
              enabled={useRezCoins}
              onToggle={() => setUseRezCoins((v) => !v)}
              color={C.purple}
            />
            {hotel.brandCoinEnabled && (
              <CoinToggle
                label={hotel.brandCoinName ?? 'Brand Coins'}
                balance={burnResult.hotel_brand_coin_applicable_paise}
                enabled={useBrandCoins}
                onToggle={() => setUseBrandCoins((v) => !v)}
                color={C.gold}
              />
            )}
          </View>
        )}

        {/* Payment Options */}
        {paymentOptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            {paymentOptions.map((option) => (
              <PaymentOptionCard
                key={option.id}
                option={option}
                selected={selectedPaymentOption === option.id}
                onSelect={() => setSelectedPaymentOption(option.id)}
              />
            ))}
          </View>
        )}

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{hotel.description}</Text>
        </View>

        {/* Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policies</Text>
          <View style={styles.policyRow}>
            <Ionicons name="enter" size={16} color={C.cyan} />
            <Text style={styles.policyText}>Check-in: {hotel.checkInTime}</Text>
          </View>
          <View style={styles.policyRow}>
            <Ionicons name="exit" size={16} color={C.slate} />
            <Text style={styles.policyText}>Check-out: {hotel.checkOutTime}</Text>
          </View>
        </View>

        {/* Amenities */}
        {hotel.amenities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesRow}>
              {hotel.amenities.slice(0, 8).map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Brand coin earn info */}
        {hotel.brandCoinEnabled && (
          <View style={styles.brandCoinBanner}>
            <Text style={styles.brandCoinEmoji}>🪙</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.brandCoinTitle}>Earn {hotel.brandCoinName ?? 'brand coins'}</Text>
              <Text style={styles.brandCoinSub}>
                {hotel.coinEarnPct ?? 5}% of your stay value credited as {hotel.brandCoinSymbol ?? 'coins'} — usable on
                your next stay here
              </Text>
            </View>
          </View>
        )}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Pressable
            style={styles.mapCard}
            onPress={() => {
              const query = encodeURIComponent(`${hotel.name}, ${hotel.city}`);
              const url = Platform.OS === 'ios' ? `maps://?q=${query}` : `https://maps.google.com/?q=${query}`;
              Linking.openURL(url).catch(() => {});
            }}
          >
            <View style={styles.mapIconBox}>
              <Ionicons name="location" size={24} color={C.cyanDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapCity}>
                {hotel.city}, {hotel.country}
              </Text>
              <Text style={styles.mapNote}>Tap to open in Maps</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={C.cyanDark} />
          </Pressable>
        </View>

        {/* Room types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Room</Text>
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={selectedRoom === room.id}
              onSelect={() => setSelectedRoom(room.id)}
              coinSaving={totalSaving}
            />
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Book button */}
      <View style={[styles.bookBar, { paddingBottom: insets.bottom + 12 }]}>
        {burnLoading ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <View style={styles.bookBarInner}>
            <View>
              {totalSaving > 0 ? (
                <>
                  <Text style={styles.bookBarSavings}>Save {paise(totalSaving)}</Text>
                  <Text style={styles.bookBarAmount}>{paise(effectivePay)} to pay</Text>
                </>
              ) : (
                <Text style={styles.bookBarAmount}>
                  {paise(rooms.find((r) => r.id === selectedRoom)?.baseRatePaise ?? 0)} / night
                </Text>
              )}
            </View>
            <Pressable
              style={[styles.bookBtn, (booking || !selectedRoom) && { opacity: 0.7 }]}
              onPress={handleBookPress}
              disabled={booking || !selectedRoom}
            >
              {booking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.bookBtnText}>Book Now</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {/* Guest Details Modal */}
      <Modal visible={showGuestModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Guest Details</Text>
            <Text style={styles.modalSub}>Required for check-in</Text>

            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter guest name"
              value={guestName}
              onChangeText={setGuestName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10-digit number"
              value={guestPhone}
              onChangeText={setGuestPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Text style={styles.inputLabel}>Special Requests (optional)</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Early check-in, extra pillows, etc."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setShowGuestModal(false)}>
                <Text style={styles.modalCancelText}>Back</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleConfirmGuest}>
                <Text style={styles.modalConfirmText}>Proceed to Payment</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  heroContainer: { height: 300, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', paddingBottom: 0 },
  heroGrad: { paddingBottom: 24 },
  backBtn: { padding: 12 },
  heroContent: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 8 },
  heroCity: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  heroRating: { color: '#fff', fontWeight: '700', fontSize: 14, marginLeft: 4 },
  heroReviews: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginLeft: 4 },

  datesBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    overflow: 'hidden',
  },
  datesBarItem: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  datesBarDivider: { width: 1, backgroundColor: C.slate200 },
  datesBarLabel: { fontSize: 10, color: C.slate, fontWeight: '600' },
  datesBarValue: { fontSize: 12, fontWeight: '700', color: C.navy },

  savingsBanner: { flexDirection: 'row', alignItems: 'flex-start', margin: 16, borderRadius: 14, padding: 16 },
  savingsBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  savingsBreakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  savingsChip: {
    backgroundColor: 'rgba(52,211,153,0.2)',
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  coinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.slate200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  coinToggleLabel: { fontSize: 13, fontWeight: '600', color: C.navy },
  coinToggleBal: { fontSize: 11, color: C.slate, marginTop: 2 },
  coinToggleSwitch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.slate200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  paymentOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: C.slate200,
  },
  paymentOptionCardSelected: {
    borderColor: C.cyan,
    backgroundColor: '#F0F9FF',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.slate100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  paymentOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.navy,
  },
  paymentOptionNameSelected: {
    color: C.cyanDark,
  },
  popularBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.green,
  },
  creditCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.slate100,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  creditCardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.slate,
  },
  paymentOptionDesc: {
    fontSize: 12,
    color: C.slate,
    marginTop: 2,
  },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 10 },
  description: { fontSize: 14, color: C.slate, lineHeight: 22 },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  policyText: { fontSize: 14, color: C.slate, marginLeft: 8 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { backgroundColor: C.slate100, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  amenityText: { fontSize: 12, color: C.navy },
  brandCoinBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FEF9C3',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  brandCoinEmoji: { fontSize: 26 },
  brandCoinTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  brandCoinSub: { fontSize: 12, color: '#78350F', marginTop: 3, lineHeight: 18 },
  roomCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: C.slate200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  roomCardSelected: { borderColor: C.cyan },
  roomCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  roomName: { fontSize: 15, fontWeight: '700', color: C.navy },
  roomDesc: { fontSize: 13, color: C.slate, lineHeight: 18, marginBottom: 8 },
  roomMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  roomMetaText: { fontSize: 12, color: C.slate, marginLeft: 5 },
  roomPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomPrice: { fontSize: 18, fontWeight: '800', color: C.navy },
  roomPerNight: { fontSize: 12, fontWeight: '400', color: C.slate },
  coinSavingPill: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  coinSavingText: { color: C.green, fontSize: 11, fontWeight: '700' },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.slate200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: -3 } },
      android: { elevation: 8 },
    }),
  },
  bookBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bookBarSavings: { fontSize: 12, fontWeight: '600', color: C.green },
  bookBarAmount: { fontSize: 18, fontWeight: '800', color: C.navy },
  bookBtn: { backgroundColor: C.cyan, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Guest modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: C.slate200,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.navy, marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.slate, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: C.navy, marginBottom: 6 },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.slate200,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: C.navy,
    marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.slate200,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: C.slate },
  modalConfirm: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: C.cyan, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.slate200,
    gap: 12,
  },
  mapIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapCity: { fontSize: 14, fontWeight: '600', color: C.navy },
  mapNote: { fontSize: 12, color: C.slate, marginTop: 2 },
});
