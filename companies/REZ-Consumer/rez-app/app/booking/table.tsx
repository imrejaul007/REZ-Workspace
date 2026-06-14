// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FormPageSkeleton } from '@/components/skeletons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import storesApi from '@/services/storesApi';
import tableBookingApi from '@/services/tableBookingApi';
import CountryCodePicker, { CountryCode, COUNTRY_CODES } from '@/components/common/CountryCodePicker';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const { width } = Dimensions.get('window');

interface Store {
  _id: string;
  name: string;
  logo?: string;
  category: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  businessHours?: {
    [key: string]: { open: string; close: string; isClosed?: boolean };
  };
  bookingConfig?: {
    enabled: boolean;
    slotDuration: number; // in minutes
    maxPartySize: number;
    minPartySize: number;
    advanceBookingDays: number;
  };
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  tablesLeft: number | null;
}

interface DateItem {
  id: string;
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
  fullDate: Date;
}

function TableBookingPage() {
  const isMounted = useIsMounted();
  const { storeId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // All hooks must be declared before any early return (Rules of Hooks)
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // tablesLeft: real-time availability not yet exposed by API. Show neutral state.
  const [availabilityBySlot, setAvailabilityBySlot] = useState<Record<string, number | null>>({});
  const [partySize, setPartySize] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStoreDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    const dateString = selectedDate.toISOString().split('T')[0];
    tableBookingApi
      .checkAvailability(storeId as string, dateString)
      .then((res) => {
        if (!isMounted()) return;
        if (res.success && res.data) {
          // API returns a map of timeSlot (HH:MM) -> tablesLeft count
          const slots: Record<string, number> = res.data.slots ?? res.data ?? {};
          setAvailabilityBySlot(slots);
        } else {
          setAvailabilityBySlot({});
        }
      })
      .catch(() => {
        if (!isMounted()) return;
        // tablesLeft: real-time availability not yet exposed by API. Show neutral state.
        setAvailabilityBySlot({});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, selectedDate]);

  const loadStoreDetails = async () => {
    try {
      setLoading(true);
      const response = await storesApi.getStoreById(storeId as string);
      if (response.success && response.data) {
        setStore(response.data as unknown);
      } else {
        platformAlertSimple('Error', 'Failed to load store details');
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to load store details');
    } finally {
      if (!isMounted()) return;
      setLoading(false);
    }
  };

  // Generate next 14 days for date selection
  const availableDates: DateItem[] = useMemo(() => {
    const days = store?.bookingConfig?.advanceBookingDays || 14;
    const dates: DateItem[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        id: date.toISOString().split('T')[0],
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date,
      });
    }
    return dates;
  }, [store]);

  // Generate time slots based on store working hours (90-minute slots).
  // tablesLeft is populated from checkAvailability API when available; null when API has no data.
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const slotDuration = store?.bookingConfig?.slotDuration || 90; // default 90 minutes

    // Get today's day name
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = store?.businessHours?.[dayOfWeek];

    if (hours && !hours.isClosed) {
      // Parse opening and closing hours
      const [openHour, openMinute] = hours.open.split(':').map(Number);
      const [closeHour, closeMinute] = hours.close.split(':').map(Number);

      let currentHour = openHour;
      let currentMinute = openMinute;

      while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        const hour12 = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
        const displayTime = `${hour12}:${currentMinute.toString().padStart(2, '0')} ${currentHour >= 12 ? 'PM' : 'AM'}`;

        // Check if slot is in the past
        const isToday = selectedDate.toDateString() === new Date().toDateString();
        const now = new Date();
        const isPast =
          isToday &&
          (currentHour < now.getHours() || (currentHour === now.getHours() && currentMinute <= now.getMinutes()));

        slots.push({
          id: timeString,
          time: displayTime,
          available: !isPast,
          tablesLeft: availabilityBySlot[timeString] ?? null,
        });

        // Add slot duration
        currentMinute += slotDuration;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }
    } else {
      // Default slots if no business hours configured (9 AM to 9 PM, 90-minute slots)
      for (let hour = 9; hour <= 21; hour += 1.5) {
        const wholeHour = Math.floor(hour);
        const minutes = (hour % 1) * 60;
        const timeString = `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const displayHour = wholeHour > 12 ? wholeHour - 12 : wholeHour;
        const displayTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${wholeHour >= 12 ? 'PM' : 'AM'}`;

        const isToday = selectedDate.toDateString() === new Date().toDateString();
        const isPast = isToday && wholeHour < new Date().getHours();

        slots.push({
          id: timeString,
          time: displayTime,
          available: !isPast,
          tablesLeft: availabilityBySlot[timeString] ?? null,
        });
      }
    }

    return slots;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const timeSlots = useMemo(() => generateTimeSlots(), [selectedDate, store, availabilityBySlot]);

  // Guard: storeId must be present (placed after all hooks to comply with Rules of Hooks)
  if (!storeId) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText style={styles.errorText}>Restaurant not found</ThemedText>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handlePartySizeChange = (increment: boolean) => {
    const maxSize = store?.bookingConfig?.maxPartySize || 10;
    const minSize = store?.bookingConfig?.minPartySize || 1;

    if (increment) {
      setPartySize(Math.min(partySize + 1, maxSize));
    } else {
      setPartySize(Math.max(partySize - 1, minSize));
    }
  };

  const handleBooking = () => {
    // Validate form
    if (!selectedTime) {
      platformAlertSimple('Missing Information', 'Please select a time slot');
      return;
    }
    if (!customerName.trim()) {
      platformAlertSimple('Missing Information', 'Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      platformAlertSimple('Missing Information', 'Please enter your phone number');
      return;
    }

    const selectedTimeSlot = timeSlots.find((s) => s.id === selectedTime);

    // Show confirmation
    platformAlertConfirm(
      'Confirm Booking',
      `Book a table for ${partySize} ${partySize === 1 ? 'person' : 'people'} on ${formatDate(selectedDate)} at ${selectedTimeSlot?.time}?`,
      handleConfirmBooking,
      'Confirm',
    );
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);
      const response = await tableBookingApi.createTableBooking({
        storeId: storeId as string,
        bookingDate: selectedDate.toISOString().split('T')[0],
        bookingTime: selectedTime!,
        partySize,
        customerName: customerName.trim(),
        customerPhone: `${selectedCountry.dialCode}${customerPhone.trim()}`,
        customerEmail: customerEmail.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
      });

      if (response.success && response.data) {
        const selectedTimeSlot = timeSlots.find((s) => s.id === selectedTime);
        platformAlertConfirm(
          'Booking Confirmed!',
          `Your table has been booked!\nBooking Number: ${(response.data as unknown).bookingId || (response.data as unknown).confirmationCode || 'N/A'}\nDate: ${formatDate(selectedDate)}\nTime: ${selectedTimeSlot?.time}\nParty Size: ${partySize}`,
          () => (router.canGoBack() ? router.back() : router.replace('/(tabs)')),
          'OK',
        );
      } else {
        platformAlertSimple('Booking Failed', response.message || 'Please try again.');
      }
    } catch (error) {
      platformAlertSimple('Booking Failed', error.message || 'Unable to create booking. Please try again.');
    } finally {
      if (!isMounted()) return;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[Colors.brand.purple, Colors.brand.purple]}
          style={[styles.loadingHeader, { paddingTop: insets.top + 10 }]}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <FormPageSkeleton />
        </View>
      </ThemedView>
    );
  }

  if (!store) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient
          colors={[Colors.brand.purple, Colors.brand.purple]}
          style={[styles.loadingHeader, { paddingTop: insets.top + 10 }]}
        >
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="restaurant-outline" size={64} color={colors.border.default} />
          <ThemedText style={styles.errorText}>Restaurant not found</ThemedText>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            style={styles.errorButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ThemedText style={styles.errorButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  const maxPartySize = store?.bookingConfig?.maxPartySize || 10;
  const quickPartySizes = Array.from({ length: Math.min(4, maxPartySize) }, (_, i) => (i + 1) * 2).filter(
    (size) => size <= maxPartySize,
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'top']}>
      {/* SOFIA: KeyboardAvoidingView to prevent TextInput from being hidden by soft keyboard */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ThemedView style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />

          {/* Header with Purple Gradient */}
          <LinearGradient
            colors={[Colors.brand.purple, Colors.brand.purple]}
            style={[styles.header, { paddingTop: insets.top + 10 }]}
          >
            <View style={styles.headerTop}>
              <Pressable
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
              </Pressable>
              <ThemedText style={styles.headerTitle}>Book a Table</ThemedText>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.storeInfo}>
              <ThemedText style={styles.storeName}>{store.name}</ThemedText>
              <ThemedText style={styles.storeCategory}>{store.category}</ThemedText>
              {store.bookingConfig && (
                <View style={styles.bookingInfoBadge}>
                  <Ionicons name="time-outline" size={14} color={colors.text.inverse} />
                  <ThemedText style={styles.bookingInfoText}>
                    {store.bookingConfig.slotDuration || 90} min slots
                  </ThemedText>
                  <ThemedText style={styles.bookingInfoDivider}>•</ThemedText>
                  <Ionicons name="people-outline" size={14} color={colors.text.inverse} />
                  <ThemedText style={styles.bookingInfoText}>
                    Up to {store.bookingConfig.maxPartySize || 10} guests
                  </ThemedText>
                </View>
              )}
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Date Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={20} color={Colors.brand.purple} />
                <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dateScroll}
                contentContainerStyle={styles.dateScrollContent}
              >
                {availableDates.map((dateItem) => {
                  const isSelected = dateItem.date === selectedDate.toISOString().split('T')[0];
                  const isToday = dateItem.date === new Date().toISOString().split('T')[0];

                  return (
                    <Pressable
                      key={dateItem.id}
                      onPress={() => {
                        setSelectedDate(dateItem.fullDate);
                        setSelectedTime(null); // Reset time when date changes
                      }}
                      style={[styles.dateCard, isSelected ? styles.dateCardSelected : null]}
                      accessibilityRole="radio"
                      accessibilityLabel={`${isToday ? 'Today, ' : ''}${dateItem.dayName} ${dateItem.dayNumber} ${dateItem.monthName}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <ThemedText style={styles.todayBadgeText}>Today</ThemedText>
                        </View>
                      )}
                      <ThemedText style={[styles.dateDay, isSelected ? styles.dateTextSelected : null]}>
                        {dateItem.dayName}
                      </ThemedText>
                      <ThemedText style={[styles.dateNumber, isSelected ? styles.dateTextSelected : null]}>
                        {dateItem.dayNumber}
                      </ThemedText>
                      <ThemedText style={[styles.dateMonth, isSelected ? styles.dateTextSelected : null]}>
                        {dateItem.monthName}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Time Slots */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20} color={Colors.brand.purple} />
                <ThemedText style={styles.sectionTitle}>Select Time</ThemedText>
              </View>
              {/* BUG-009: Real table availability is not yet fetched from the API.
                  Slots marked available are derived from business hours only. */}
              <ThemedText
                style={{ fontSize: 12, color: colors.text?.tertiary || '#888', marginBottom: 8, fontStyle: 'italic' }}
              >
                Availability data unavailable — confirm directly with the restaurant.
              </ThemedText>
              {timeSlots.length > 0 ? (
                <View style={styles.timeGrid}>
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.id;
                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => slot.available && setSelectedTime(slot.id)}
                        disabled={!slot.available}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                          !slot.available && styles.timeSlotDisabled,
                        ]}
                        accessibilityRole="radio"
                        accessibilityLabel={
                          slot.available
                            ? `${slot.time}${slot.tablesLeft && slot.tablesLeft <= 3 ? `, ${slot.tablesLeft} tables left` : ''}`
                            : `${slot.time}, fully booked`
                        }
                        accessibilityState={{ selected: isSelected, disabled: !slot.available }}
                      >
                        <ThemedText
                          style={[
                            styles.timeText,
                            isSelected && styles.timeTextSelected,
                            !slot.available && styles.timeTextDisabled,
                          ]}
                        >
                          {slot.time}
                        </ThemedText>
                        {slot.available && slot.tablesLeft && slot.tablesLeft <= 3 && (
                          <ThemedText style={styles.tablesLeftText}>{slot.tablesLeft} left</ThemedText>
                        )}
                        {!slot.available && <ThemedText style={styles.bookedText}>Booked</ThemedText>}
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={colors.border.default} />
                  <ThemedText style={styles.emptyStateText}>No time slots available for this date</ThemedText>
                </View>
              )}
            </View>

            {/* Party Size */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={20} color={Colors.brand.purple} />
                <ThemedText style={styles.sectionTitle}>Party Size</ThemedText>
              </View>

              <View style={styles.partySizeContainer}>
                <Pressable
                  style={styles.partySizeButton}
                  onPress={() => handlePartySizeChange(false)}
                  disabled={partySize <= (store?.bookingConfig?.minPartySize || 1)}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease party size"
                  accessibilityState={{ disabled: partySize <= (store?.bookingConfig?.minPartySize || 1) }}
                >
                  <Ionicons
                    name="remove-circle"
                    size={40}
                    color={
                      partySize <= (store?.bookingConfig?.minPartySize || 1)
                        ? colors.border.default
                        : Colors.brand.purple
                    }
                  />
                </Pressable>

                <View style={styles.partySizeDisplay}>
                  <ThemedText style={styles.partySizeNumber}>{partySize}</ThemedText>
                  <ThemedText style={styles.partySizeLabel}>{partySize === 1 ? 'Guest' : 'Guests'}</ThemedText>
                </View>

                <Pressable
                  style={styles.partySizeButton}
                  onPress={() => handlePartySizeChange(true)}
                  disabled={partySize >= maxPartySize}
                  accessibilityRole="button"
                  accessibilityLabel="Increase party size"
                  accessibilityState={{ disabled: partySize >= maxPartySize }}
                >
                  <Ionicons
                    name="add-circle"
                    size={40}
                    color={partySize >= maxPartySize ? colors.border.default : Colors.brand.purple}
                  />
                </Pressable>
              </View>

              {quickPartySizes.length > 0 && (
                <View style={styles.quickSizeContainer}>
                  {quickPartySizes.map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => setPartySize(size)}
                      style={[styles.quickSizeButton, partySize === size ? styles.quickSizeButtonSelected : null]}
                      accessibilityRole="radio"
                      accessibilityLabel={`${size} guests`}
                      accessibilityState={{ selected: partySize === size }}
                    >
                      <Ionicons
                        name="people"
                        size={16}
                        color={partySize === size ? colors.text.inverse : Colors.brand.purple}
                      />
                      <ThemedText
                        style={[styles.quickSizeText, partySize === size ? styles.quickSizeTextSelected : null]}
                      >
                        {size}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Customer Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={Colors.brand.purple} />
                <ThemedText style={styles.sectionTitle}>Your Details</ThemedText>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Full Name *"
                    placeholderTextColor={colors.neutral[400]}
                    value={customerName}
                    onChangeText={setCustomerName}
                    accessibilityLabel="Enter your full name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                  <CountryCodePicker
                    selectedCountry={selectedCountry}
                    onSelect={setSelectedCountry}
                    style={styles.countryPicker}
                  />
                  <View style={styles.phoneDivider} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Phone Number *"
                    placeholderTextColor={colors.neutral[400]}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                    accessibilityLabel="Enter your phone number"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Email (Optional)"
                    placeholderTextColor={colors.neutral[400]}
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Enter your email address (optional)"
                  />
                </View>

                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={colors.text.tertiary}
                    style={[styles.inputIcon, styles.textAreaIcon]}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: textColor }]}
                    placeholder="Special Requests (Optional)"
                    placeholderTextColor={colors.neutral[400]}
                    value={specialRequests}
                    onChangeText={setSpecialRequests}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    accessibilityLabel="Enter unknown special requests such as dietary requirements or seating preferences (optional)"
                  />
                </View>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Bottom Fixed Button */}
          <View style={[styles.bottomContainer, { backgroundColor }]}>
            <Pressable
              onPress={handleBooking}
              style={styles.bookButton}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={`Confirm table booking at ${store.name} for ${partySize} guests`}
              accessibilityState={{ disabled: submitting }}
            >
              <LinearGradient
                colors={
                  submitting ? [colors.text.tertiary, colors.text.tertiary] : [Colors.brand.purple, Colors.brand.purple]
                }
                style={styles.bookButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                    <ThemedText style={styles.bookButtonText}>Confirming...</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={colors.text.inverse} />
                    <ThemedText style={styles.bookButtonText}>Confirm Booking</ThemedText>
                    <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    // SOFIA: SafeAreaView ensures content doesn't overlap with notch/home indicator
    flex: 1,
  },
  keyboardAvoidingView: {
    // SOFIA: Prevents TextInput from being covered by iOS/Android keyboard
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  loadingHeader: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // BUG-066 FIX: properly typed style, removed (styles as any) cast
  backButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.gold,
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  storeInfo: {
    alignItems: 'center',
  },
  storeName: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: colors.text.inverse,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  storeCategory: {
    ...Typography.body,
    color: '#E9D5FF',
    marginBottom: Spacing.sm,
  },
  bookingInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xs,
  },
  bookingInfoText: {
    ...Typography.caption,
    color: colors.text.inverse,
    marginLeft: Spacing.xs,
  },
  bookingInfoDivider: {
    ...Typography.caption,
    color: colors.text.inverse,
    marginHorizontal: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: Spacing.base,
    ...Typography.body,
    color: colors.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    ...Typography.h4,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.xl,
    color: colors.text.tertiary,
  },
  errorButton: {
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorButtonText: {
    color: colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  dateScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  dateScrollContent: {
    paddingRight: Spacing.lg,
  },
  dateCard: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    backgroundColor: colors.text.inverse,
    position: 'relative',
  },
  dateCardSelected: {
    borderColor: Colors.brand.purple,
    backgroundColor: colors.tint.pink,
  },
  todayBadge: {
    position: 'absolute',
    top: Spacing.xs,
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  dateDay: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  dateNumber: {
    ...Typography.h1,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  dateMonth: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dateTextSelected: {
    color: Colors.brand.purple,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  timeSlot: {
    width: (width - 64) / 3,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
  },
  timeSlotSelected: {
    borderColor: Colors.brand.purple,
    backgroundColor: colors.tint.pink,
  },
  timeSlotDisabled: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    opacity: 0.6,
  },
  timeText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeTextSelected: {
    color: Colors.brand.purple,
    fontWeight: '700',
  },
  timeTextDisabled: {
    color: colors.text.tertiary,
  },
  tablesLeftText: {
    fontSize: 11,
    color: Colors.warning,
    marginTop: 4,
  },
  bookedText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginTop: Spacing.md,
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text.inverse,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
  },
  partySizeButton: {
    padding: Spacing.sm,
  },
  partySizeDisplay: {
    alignItems: 'center',
  },
  partySizeNumber: {
    fontSize: 52,
    fontWeight: 'bold',
    color: Colors.brand.purple,
  },
  partySizeLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  quickSizeContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickSizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.brand.purple,
    backgroundColor: colors.text.inverse,
    gap: 6,
  },
  quickSizeButtonSelected: {
    backgroundColor: Colors.brand.purple,
    borderColor: Colors.brand.purple,
  },
  quickSizeText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.brand.purple,
  },
  quickSizeTextSelected: {
    color: colors.text.inverse,
  },
  formContainer: {
    gap: Spacing.base,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: Spacing.base,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  countryPicker: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
    marginHorizontal: Spacing.sm,
  },
  textAreaIcon: {
    marginTop: Spacing.base,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bookButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
  },
  bookButtonText: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(TableBookingPage, 'BookingTable');
