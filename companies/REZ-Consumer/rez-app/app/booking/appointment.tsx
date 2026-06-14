// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Text,
  KeyboardAvoidingView,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { platformAlertSimple, platformAlertConfirm, platformAlert } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { FormPageSkeleton } from '@/components/skeletons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import storesApi, { Store } from '@/services/storesApi';
import servicesApi, { ServiceItem } from '@/services/servicesApi';
import bookingApi from '@/services/bookingApi';
import { razorpayApi } from '@/services/razorpayApi';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import apiClient from '@/services/apiClient';
import serviceAppointmentApi from '@/services/serviceAppointmentApi';
import { isSmallDevice, responsiveFontSize } from '@/utils/responsive';
import { logger } from '@/utils/logger';

// Service type icon mapping
const SERVICE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  haircut: 'cut',
  'hair styling': 'cut',
  'color treatment': 'color-palette',
  coloring: 'color-palette',
  facial: 'sparkles',
  massage: 'hand-left',
  spa: 'water',
  manicure: 'hand-right',
  pedicure: 'footsteps',
  waxing: 'flash',
  makeup: 'brush',
  'hair treatment': 'flask',
  threading: 'remove',
  'nail art': 'color-fill',
  default: 'cut-outline',
};

// Helper function to get icon for service
const getServiceIcon = (serviceName: string): keyof typeof Ionicons.glyphMap => {
  const name = serviceName.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  return SERVICE_ICONS.default;
};

interface TimeSlot {
  id: string;
  time: string;
  displayTime: string;
  available: boolean;
}

function CancellationPolicyBadge({
  freeCancellationHours = 24,
  lateCancellationFee = 'none',
  cancellationFeeAmount,
  selectedDate,
}: {
  freeCancellationHours?: number;
  lateCancellationFee?: 'none' | 'partial' | 'full';
  cancellationFeeAmount?: number;
  selectedDate?: Date | string;
}) {
  const isFree = lateCancellationFee === 'none';
  const deadline = selectedDate
    ? new Date(new Date(selectedDate).getTime() - freeCancellationHours * 60 * 60 * 1000)
    : null;

  const deadlineText = deadline
    ? deadline.toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : `${freeCancellationHours} hours before`;

  let policyText = '';
  let policyColor = '';
  let iconName: unknown = 'checkmark-circle-outline';

  if (isFree) {
    policyText = `Free cancellation until ${deadlineText}`;
    policyColor = '#16a34a';
    iconName = 'checkmark-circle-outline';
  } else if (lateCancellationFee === 'partial') {
    const feeText = cancellationFeeAmount ? `₹${cancellationFeeAmount}` : '50%';
    policyText = `${feeText} fee if cancelled after ${deadlineText}`;
    policyColor = '#d97706';
    iconName = 'warning-outline';
  } else {
    policyText = `Full charge if cancelled after ${deadlineText}`;
    policyColor = '#dc2626';
    iconName = 'alert-circle-outline';
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: isFree ? '#f0fdf4' : lateCancellationFee === 'partial' ? '#fffbeb' : '#fef2f2',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: isFree ? '#bbf7d0' : lateCancellationFee === 'partial' ? '#fed7aa' : '#fecaca',
        marginTop: 12,
      }}
    >
      <Ionicons name={iconName} size={18} color={policyColor} style={{ marginTop: 1, flexShrink: 0 }} />
      <Text style={{ flex: 1, fontSize: 13, color: policyColor, fontWeight: '500', lineHeight: 18 }}>{policyText}</Text>
    </View>
  );
}

function AppointmentBookingPage() {
  const isMounted = useIsMounted();
  const { storeId } = useLocalSearchParams<unknown>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // All hooks must be declared before any early return (Rules of Hooks)
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  // Screen fade-in animation
  const fadeAnim = useSharedValue(0);
  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 250, easing: Easing.ease });
  }, [fadeAnim]);
  // Rules of Hooks: useAnimatedStyle must be declared before any conditional return
  const fadeAnimStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  // State management
  const [store, setStore] = useState<Store | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Booking selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);

  // Staff picker state
  const [availableStaff, setAvailableStaff] = useState<unknown[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Backend slot availability — keyed by "HH:MM" → available boolean
  const [backendAvailability, setBackendAvailability] = useState<Record<string, boolean>>({});

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Patch test status
  const [patchTestStatus, setPatchTestStatus] = useState<unknown>(null);

  // Group booking state
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [groupFriends, setGroupFriends] = useState<{ name: string; phone: string }[]>([]);

  useEffect(() => {
    if (storeId) {
      // Run both fetches concurrently; loading stays true until both finish
      setLoading(true);
      Promise.all([loadStoreDetails(), loadStoreServices()]).finally(() => {
        if (isMounted()) setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Check patch test status for color/tint services
  useEffect(() => {
    if (
      selectedService &&
      (selectedService.name?.toLowerCase().includes('colour') ||
        selectedService.name?.toLowerCase().includes('color') ||
        selectedService.name?.toLowerCase().includes('tint'))
    ) {
      // ETHAN: crash guard — API call without error handling could crash; added try/catch
      apiClient
        .get('/consumer/patch-tests/check?category=hair_colour')
        .then((res) => {
          if ((res as unknown)?.success && (res as unknown)?.data) {
            setPatchTestStatus((res as unknown).data?.data ?? null);
          }
        })
        .catch((err) => {
          if (__DEV__) logger.warn('[Appointment] Patch test check failed:', { message: err?.message });
          setPatchTestStatus(null);
        });
    } else {
      setPatchTestStatus(null);
    }
  }, [selectedService]);

  // Fetch real-time slot availability from backend whenever the selected date changes.
  // Without this, users can pick already-booked slots and only see an error on submit.
  useEffect(() => {
    if (!storeId) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    setBackendAvailability({});
    setSelectedTime(null);
    serviceAppointmentApi
      .getAvailableSlots(storeId, dateStr)
      .then((resp) => {
        if (resp.success && Array.isArray(resp.data)) {
          const map: Record<string, boolean> = {};
          (resp.data as unknown[]).forEach((slot) => {
            if (slot.time) map[slot.time] = slot.available;
          });
          if (isMounted()) setBackendAvailability(map);
        }
      })
      .catch(() => {
        // Backend unavailable — fall back to local past-time-only check (silent)
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, storeId]);

  // Guard: storeId must be present (placed after all hooks to comply with Rules of Hooks)
  if (!storeId) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText style={styles.errorText}>Store not found</ThemedText>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backToStoreButton}
        >
          <ThemedText style={styles.backToStoreText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const loadStoreDetails = async () => {
    try {
      const response = await storesApi.getStoreById(storeId);
      if (response.success && response.data) {
        if (isMounted()) setStore(response.data);
      } else {
        platformAlertSimple('Error', 'Failed to load store details');
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to load store details');
    }
  };

  const loadStoreServices = async () => {
    try {
      setServicesLoading(true);
      const response = await servicesApi.getStoreServices(storeId);
      if (response.success && response.data?.services) {
        setServices(response.data.services);
      }
    } catch (error) {
      // silently handle
    } finally {
      if (!isMounted()) return;
      setServicesLoading(false);
    }
  };

  // Generate next 30 days for date selection
  const getNextDays = (count: number = 30): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Generate time slots based on working hours (60-minute intervals)
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];

    // Default working hours: 9 AM to 8 PM
    let startHour = 9;
    let endHour = 20;

    // If store has working hours, use them
    if (store?.hours && store.hours.length > 0) {
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const todayHours = store.hours.find((h) => h?.day?.toLowerCase() === dayName.toLowerCase());

      if (todayHours && !todayHours.closed) {
        // ETHAN: crash guard — parseInt could return NaN; guard with fallback
        const openTime = todayHours.open?.split(':') ?? ['9'];
        const closeTime = todayHours.close?.split(':') ?? ['20'];
        const parsedStartHour = parseInt(openTime?.[0] ?? '9', 10);
        const parsedEndHour = parseInt(closeTime?.[0] ?? '20', 10);
        startHour = !isNaN(parsedStartHour) ? parsedStartHour : 9;
        endHour = !isNaN(parsedEndHour) ? parsedEndHour : 20;
      }
    }

    // Generate 60-minute slots
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayTime = `${displayHour}:00 ${period}`;

      // Check if slot is in the past for today
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      const isPast = isToday && hour <= new Date().getHours();

      // If we have backend data, mark slot unavailable when backend says so.
      // Fall back to !isPast only when no backend data has loaded yet.
      const hasBackendData = Object.keys(backendAvailability).length > 0;
      const isBooked = hasBackendData && backendAvailability[timeString] === false;

      slots.push({
        id: timeString,
        time: timeString,
        displayTime,
        available: !isPast && !isBooked,
      });
    }

    return slots;
  };

  const nextDays = getNextDays();
  const timeSlots = generateTimeSlots();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const validateForm = (): boolean => {
    if (!selectedService) {
      platformAlertSimple('Missing Information', 'Please select a service');
      return false;
    }
    if (!selectedTime) {
      platformAlertSimple('Missing Information', 'Please select a time slot');
      return false;
    }
    if (!customerName.trim()) {
      platformAlertSimple('Missing Information', 'Please enter your full name');
      return false;
    }
    if (!customerPhone.trim()) {
      platformAlertSimple('Missing Information', 'Please enter your phone number');
      return false;
    }
    if (customerPhone.trim().length < 10) {
      platformAlertSimple('Invalid Phone', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleConfirmAppointment = async () => {
    if (!validateForm()) return;
    if (submitting) return; // guard against double-tap
    setSubmitting(true); // lock immediately to prevent double-tap between async calls

    try {
      // Fetch service details to check requiresPaymentUpfront
      let requiresUpfront = false;
      let servicePrice = 0;

      if (selectedService?.id) {
        try {
          const serviceResp = await servicesApi.getServiceById(selectedService.id);
          const svc = (serviceResp.data as unknown)?.data || serviceResp.data;
          requiresUpfront = svc?.serviceDetails?.requiresPaymentUpfront || svc?.requiresPaymentUpfront || false;
          servicePrice = svc?.pricing?.selling || svc?.price || selectedService.price || 0;
        } catch (e) {
          servicePrice = selectedService.price || 0;
        }
      }

      if (requiresUpfront && servicePrice > 0) {
        const summary = `
Service: ${selectedService?.name ?? 'Unknown'}
Date: ${formatDate(selectedDate)}
Time: ${selectedTime?.displayTime ?? 'N/A'}
Duration: ${selectedService?.duration ? formatDuration(selectedService.duration) : 'N/A'}
Price: ${currencySymbol}${Math.max(0, servicePrice)}

Payment Required: Full amount will be charged now.
Free cancellation available 24 hours before appointment.
        `.trim();

        platformAlert('Confirm Appointment', summary, [
          { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
          { text: 'Proceed to Payment', onPress: () => handlePaymentGate(servicePrice) },
        ]);
      } else {
        const summary = `
Service: ${selectedService?.name ?? 'Unknown'}
Date: ${formatDate(selectedDate)}
Time: ${selectedTime?.displayTime ?? 'N/A'}
Duration: ${selectedService?.duration ? formatDuration(selectedService.duration) : 'N/A'}
Price: ${currencySymbol}${Math.max(0, selectedService?.price ?? 0)}
        `.trim();

        platformAlert('Confirm Appointment', summary, [
          { text: 'Cancel', style: 'cancel', onPress: () => setSubmitting(false) },
          { text: 'Confirm', onPress: () => submitBooking({}) },
        ]);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to process booking');
      setSubmitting(false);
    }
  };

  const handlePaymentGate = async (amount: number) => {
    try {
      setSubmitting(true);
      // CA-PAY-027 FIX: Validate amount is whole paise (no fractions)
      // Create Razorpay order for upfront payment
      const paiseAmount = Math.round(amount * 100);
      if (!Number.isInteger(paiseAmount)) {
        throw new Error('Invalid amount: must be whole paise value');
      }
      const orderResponse = await razorpayApi.createOrder({
        amount: paiseAmount, // Convert to paise
        notes: {
          serviceId: selectedService?.id,
          serviceName: selectedService?.name,
          storeId: selectedService?.storeId,
        },
      });

      if (!(orderResponse as unknown).data?.data?.razorpayOrderId) {
        throw new Error('Failed to create payment order');
      }

      // Initiate checkout
      const paymentResult = await (razorpayApi as unknown).checkout({
        amount: paiseAmount, // Use validated paise amount
        orderId: (orderResponse as unknown).data.data.razorpayOrderId,
        notes: {
          serviceId: selectedService?.id,
          serviceName: selectedService?.name,
        },
      });

      if (paymentResult.paymentId) {
        // Payment successful, proceed with booking
        await submitBooking({ paymentId: paymentResult.paymentId });
      }
    } catch (error) {
      if (__DEV__) logger.error('[Appointment] Payment failed:', error);
      platformAlertSimple('Payment Failed', error?.message || 'Unable to process payment. Please try again.');
      setSubmitting(false);
    }
  };

  const submitBooking = async (paymentData?: { paymentId?: string }) => {
    if (!selectedService || !selectedTime) return;

    try {
      setSubmitting(true);

      // Use serviceAppointmentApi (POST /service-appointments) — NOT bookingApi (POST /bookings
      // which maps to ServiceBooking/Pattern B and doesn't exist for this flow).
      const appointmentData = {
        storeId: storeId as string,
        serviceType: selectedService.name,
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedTime.time,
        duration: selectedService.duration,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        specialInstructions: specialInstructions.trim() || undefined,
        ...(selectedStaffId
          ? {
              staffId: selectedStaffId,
              // BUG 5 FIX: also pass staffName so backend Joi schema receives it
              staffName:
                availableStaff.find((s) => s._id === selectedStaffId || s.id === selectedStaffId)?.name ||
                undefined,
            }
          : {}),
        ...(paymentData?.paymentId ? { paymentId: paymentData.paymentId } : {}),
      };

      const response = await serviceAppointmentApi.createServiceAppointment(appointmentData);

      if (response.success) {
        // Show appointmentNumber if available, fall back to id
        const appointmentNumber = (response.data as unknown)?.appointmentNumber || response.data?.id || 'N/A';

        // Success alert with appointment details
        const successMessage = `
Your appointment has been confirmed!

Appointment Number: ${appointmentNumber}
Service: ${selectedService.name}
Date: ${formatDate(selectedDate)}
Time: ${selectedTime.displayTime}
Store: ${store?.name}

You will receive a confirmation message at ${customerPhone}${customerEmail ? ` and ${customerEmail}` : ''}.
        `.trim();

        platformAlertConfirm('Appointment Confirmed!', successMessage, () => router.replace('/my-bookings'), 'OK');
      } else {
        platformAlertSimple(
          'Booking Failed',
          (response as unknown).error || 'Unable to create appointment. Please try again.',
        );
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to submit booking. Please try again.');
    } finally {
      if (!isMounted()) return;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <FormPageSkeleton />
      </ThemedView>
    );
  }

  if (!store) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText style={styles.errorText}>Store not found</ThemedText>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backToStoreButton}
        >
          <ThemedText style={styles.backToStoreText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <Animated.View style={[styles.container, fadeAnimStyle]}>
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header with Purple Gradient */}
        <LinearGradient
          colors={[colors.brand.purpleLight, colors.brand.purple]}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.headerTop}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.background.primary} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Book Appointment</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.storeInfo}>
            {/* ETHAN: crash guard — store.name could be undefined */}
            <ThemedText style={styles.storeName}>{store?.name ?? 'Store'}</ThemedText>
            {(() => {
              const catName = typeof store?.category === 'string' ? store.category : store?.category?.name;
              return catName ? <ThemedText style={styles.storeCategory}>{catName}</ThemedText> : null;
            })()}
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Service Selection */}
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Select Service</ThemedText>

              {servicesLoading ? (
                <ActivityIndicator color={colors.brand.purpleLight} style={{ marginVertical: Spacing.xl }} />
              ) : services.length > 0 ? (
                <View style={styles.servicesGrid}>
                  {services.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    const iconName = getServiceIcon(service.name);

                    return (
                      <Pressable
                        key={service.id}
                        onPress={() => {
                          setSelectedService(service);
                          setSelectedTime(null); // Reset time when service changes
                        }}
                        style={[styles.serviceCard, isSelected ? styles.serviceCardSelected : null]}
                        accessibilityRole="radio"
                        accessibilityLabel={`${service.name}${service.duration ? `, ${formatDuration(service.duration)}` : ''}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View
                          style={[styles.serviceIconContainer, isSelected ? styles.serviceIconContainerSelected : null]}
                        >
                          <Ionicons
                            name={iconName}
                            size={28}
                            color={isSelected ? colors.background.primary : colors.brand.purpleLight}
                          />
                        </View>
                        <ThemedText
                          style={[styles.serviceName, isSelected ? styles.serviceNameSelected : null]}
                          numberOfLines={2}
                        >
                          {service.name}
                        </ThemedText>
                        {service.duration && (
                          <ThemedText
                            style={[styles.serviceDuration, isSelected ? styles.serviceDurationSelected : null]}
                          >
                            {formatDuration(service.duration)}
                          </ThemedText>
                        )}
                        <ThemedText style={[styles.servicePrice, isSelected ? styles.servicePriceSelected : null]}>
                          {currencySymbol}
                          {service.price}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <ThemedText style={styles.noDataText}>No services available</ThemedText>
              )}
            </View>

            {/* Dynamic Pricing Badge */}
            {selectedService && (selectedService as unknown).pricingRule && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: (selectedService as unknown).discount > 0 ? '#f0fdf4' : '#fff7ed',
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={(selectedService as unknown).discount > 0 ? 'pricetag' : 'trending-up'}
                  size={16}
                  color={(selectedService as unknown).discount > 0 ? '#16a34a' : '#d97706'}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    color: (selectedService as unknown).discount > 0 ? '#16a34a' : '#d97706',
                    fontWeight: '500',
                  }}
                >
                  {(selectedService as unknown).pricingRule.label}
                  {(selectedService as unknown).discount > 0
                    ? ` · Save ${currencySymbol}${(selectedService as unknown).discount}`
                    : ` · +${currencySymbol}${(selectedService as unknown).surcharge}`}
                </Text>
              </View>
            )}

            {/* Date Selection */}
            {selectedService && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dateScroll}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {nextDays.map((date, index) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = index === 0;

                    return (
                      <Pressable
                        key={date.toISOString().split('T')[0]}
                        onPress={() => {
                          setSelectedDate(date);
                          setSelectedTime(null); // Reset time when date changes
                        }}
                        style={[styles.dateCard, isSelected ? styles.dateCardSelected : null]}
                        accessibilityRole="radio"
                        accessibilityLabel={`${isToday ? 'Today, ' : ''}${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        {isToday && (
                          <View style={styles.todayBadge}>
                            <ThemedText style={styles.todayBadgeText}>Today</ThemedText>
                          </View>
                        )}
                        <ThemedText style={[styles.dateDay, isSelected ? styles.dateTextSelected : null]}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </ThemedText>
                        <ThemedText style={[styles.dateNumber, isSelected ? styles.dateTextSelected : null]}>
                          {date.getDate()}
                        </ThemedText>
                        <ThemedText style={[styles.dateMonth, isSelected ? styles.dateTextSelected : null]}>
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Time Slot Selection */}
            {selectedService && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Select Time</ThemedText>
                <View style={styles.timeGrid}>
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime?.id === slot.id;
                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => slot.available && setSelectedTime(slot)}
                        disabled={!slot.available}
                        style={[
                          styles.timeSlot,
                          isSelected && styles.timeSlotSelected,
                          !slot.available && styles.timeSlotDisabled,
                        ]}
                        accessibilityRole="radio"
                        accessibilityLabel={slot.available ? slot.displayTime : `${slot.displayTime}, unavailable`}
                        accessibilityState={{ selected: isSelected, disabled: !slot.available }}
                      >
                        <ThemedText
                          style={[
                            styles.timeText,
                            isSelected && styles.timeTextSelected,
                            !slot.available && styles.timeTextDisabled,
                          ]}
                        >
                          {slot.displayTime}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Waitlist button when all slots are full */}
                {timeSlots.length > 0 && timeSlots.every((s) => !s.available) && (
                  <Pressable
                    style={{
                      backgroundColor: colors.secondary[600],
                      padding: 14,
                      borderRadius: 12,
                      marginTop: 16,
                      alignItems: 'center',
                    }}
                    onPress={() => router.push(`/waitlist/${storeId}`)}
                    accessibilityRole="button"
                    accessibilityLabel="Join waitlist for this store"
                  >
                    <ThemedText style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                      No slots available — Join Waitlist
                    </ThemedText>
                    <ThemedText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                      We'll notify you when a slot opens
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            )}

            {/* Customer Details Form */}
            {selectedService && selectedTime && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Your Details</ThemedText>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Full Name *"
                    placeholderTextColor={colors.text.tertiary}
                    value={customerName}
                    onChangeText={setCustomerName}
                    accessibilityLabel="Enter your full name"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Phone Number *"
                    placeholderTextColor={colors.text.tertiary}
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
                    placeholderTextColor={colors.text.tertiary}
                    value={customerEmail}
                    onChangeText={setCustomerEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    accessibilityLabel="Enter your email address (optional)"
                  />
                </View>

                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.text.tertiary}
                    style={styles.inputIconTop}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: textColor }]}
                    placeholder="Special Instructions (Optional)"
                    placeholderTextColor={colors.text.tertiary}
                    value={specialInstructions}
                    onChangeText={setSpecialInstructions}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    accessibilityLabel="Enter unknown special instructions for your appointment (optional)"
                  />
                </View>
              </View>
            )}

            {/* Group Booking Toggle */}
            {selectedService && selectedTime && (
              <View style={styles.groupBookingToggleContainer}>
                <View>
                  <ThemedText style={styles.groupBookingTitle}>Book for a group</ThemedText>
                  <ThemedText style={styles.groupBookingSubtitle}>Add friends to book together</ThemedText>
                </View>
                <Pressable
                  onPress={() => setIsGroupBooking(!isGroupBooking)}
                  style={[styles.toggleSwitch, isGroupBooking ? styles.toggleSwitchActive : null]}
                  accessibilityRole="switch"
                  accessibilityLabel="Book for a group"
                  accessibilityState={{ checked: isGroupBooking }}
                >
                  <View style={[styles.toggleKnob, isGroupBooking ? styles.toggleKnobActive : null]} />
                </Pressable>
              </View>
            )}

            {/* Group Members Input */}
            {isGroupBooking && selectedService && selectedTime && (
              <View style={styles.groupMembersContainer}>
                <ThemedText style={styles.groupMembersTitle}>Group Members</ThemedText>
                {groupFriends.map((friend, idx) => (
                  <View key={idx} style={styles.groupMemberRow}>
                    <TextInput
                      value={friend.name}
                      onChangeText={(name) =>
                        setGroupFriends((prev) => prev.map((g, i) => (i === idx ? { ...g, name } : g)))
                      }
                      placeholder="Friend's name"
                      style={[styles.groupMemberInput, { color: textColor }]}
                      placeholderTextColor={colors.text.tertiary}
                    />
                    <TextInput
                      value={friend.phone}
                      onChangeText={(phone) =>
                        setGroupFriends((prev) => prev.map((g, i) => (i === idx ? { ...g, phone } : g)))
                      }
                      placeholder="Phone"
                      keyboardType="phone-pad"
                      style={[styles.groupMemberPhone, { color: textColor }]}
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>
                ))}
                <Pressable
                  style={styles.addMemberButton}
                  onPress={() => setGroupFriends((prev) => [...prev, { name: '', phone: '' }])}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.brand.purpleLight} />
                  <ThemedText style={styles.addMemberText}>Add another friend</ThemedText>
                </Pressable>
              </View>
            )}

            {/* Booking Summary */}
            {selectedService && selectedTime && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Booking Summary</ThemedText>
                <View style={styles.summaryCard}>
                  {/* Deposit Banner */}
                  {(selectedService as unknown).requiresPaymentUpfront && selectedService.price > 0 && (
                    <View
                      style={[
                        styles.depositBanner,
                        { backgroundColor: colors.tint.pink, borderColor: colors.brand.purpleLight },
                      ]}
                    >
                      <Ionicons name="card-outline" size={16} color={colors.brand.purpleLight} />
                      <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                        <ThemedText style={[styles.depositText, { fontWeight: '600', color: colors.brand.purple }]}>
                          Payment required at booking · {currencySymbol}
                          {selectedService.price}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.depositSub,
                            { color: colors.text.tertiary, marginTop: Spacing.xs, fontSize: 12 },
                          ]}
                        >
                          Full amount charged now · Free cancellation 24h before
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Service</ThemedText>
                    <ThemedText style={styles.summaryValue}>{selectedService.name}</ThemedText>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Date</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Time</ThemedText>
                    <ThemedText style={styles.summaryValue}>{selectedTime.displayTime}</ThemedText>
                  </View>
                  {selectedService.duration && (
                    <>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <ThemedText style={styles.summaryLabel}>Duration</ThemedText>
                        <ThemedText style={styles.summaryValue}>{formatDuration(selectedService.duration)}</ThemedText>
                      </View>
                    </>
                  )}
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabelBold}>Total Price</ThemedText>
                    <ThemedText style={styles.summaryValueBold}>
                      {currencySymbol}
                      {selectedService.price}
                    </ThemedText>
                  </View>

                  {/* Cancellation Policy */}
                  {selectedService && (
                    <>
                      <View style={styles.summaryDivider} />
                      <CancellationPolicyBadge
                        freeCancellationHours={selectedService.freeCancellationHours ?? 24}
                        lateCancellationFee={selectedService.lateCancellationFee ?? 'none'}
                        cancellationFeeAmount={selectedService.cancellationFeeAmount}
                        selectedDate={selectedDate}
                      />
                    </>
                  )}
                </View>
              </View>
            )}

            {/* Patch Test Status for Color Services */}
            {patchTestStatus !== null && (
              <View
                style={[
                  styles.patchTestContainer,
                  {
                    backgroundColor: patchTestStatus.hasValidTest ? '#f0fdf4' : '#fff7ed',
                    borderColor: patchTestStatus.hasValidTest ? '#86efac' : '#fed7aa',
                  },
                ]}
              >
                <Text style={[styles.patchTestTitle, { color: patchTestStatus.hasValidTest ? '#166534' : '#9a3412' }]}>
                  {patchTestStatus.hasValidTest ? '✓ Patch test on record' : '⚠️ Patch test required'}
                </Text>
                <Text style={[styles.patchTestText, { color: patchTestStatus.hasValidTest ? '#166534' : '#9a3412' }]}>
                  {patchTestStatus.hasValidTest
                    ? `Last test: ${new Date(patchTestStatus.lastTest.testedAt).toLocaleDateString('en-IN')} — valid until ${new Date(patchTestStatus.lastTest.expiresAt).toLocaleDateString('en-IN')}`
                    : 'This service requires a patch test 48h before your appointment. The salon will contact you to arrange one.'}
                </Text>
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Fixed Button */}
        {selectedService && selectedTime && (
          <View style={[styles.bottomContainer, { backgroundColor }]}>
            <Pressable
              onPress={handleConfirmAppointment}
              style={styles.confirmButton}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={`Confirm appointment for ${selectedService?.name} at ${selectedTime?.displayTime}`}
              accessibilityState={{ disabled: submitting }}
            >
              <LinearGradient
                colors={[colors.brand.purpleLight, colors.brand.purple]}
                style={styles.confirmButtonGradient}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.background.primary} />
                ) : (
                  <>
                    <ThemedText style={styles.confirmButtonText}>Confirm Appointment</ThemedText>
                    <Ionicons name="checkmark-circle" size={24} color={colors.background.primary} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingIndicator: {
    marginTop: 100,
  },
  errorText: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    marginTop: 100,
    paddingHorizontal: Spacing.lg,
  },
  backToStoreButton: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: colors.brand.purpleLight,
    borderRadius: BorderRadius.sm,
  },
  backToStoreText: {
    color: colors.background.primary,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  header: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: colors.background.primary,
  },
  storeInfo: {
    alignItems: 'center',
  },
  storeName: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: colors.background.primary,
    marginBottom: Spacing.xs,
  },
  storeCategory: {
    ...Typography.body,
    color: '#E9D5FF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.base,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  serviceCard: {
    width: '31%',
    aspectRatio: 0.85,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  serviceCardSelected: {
    borderColor: colors.brand.purpleLight,
    backgroundColor: colors.tint.pink,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tint.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  serviceIconContainerSelected: {
    backgroundColor: colors.brand.purpleLight,
  },
  serviceName: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    color: colors.text.primary,
  },
  serviceNameSelected: {
    color: colors.brand.purple,
  },
  serviceDuration: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  serviceDurationSelected: {
    color: colors.brand.purpleLight,
  },
  servicePrice: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  servicePriceSelected: {
    color: colors.brand.purple,
  },
  noDataText: {
    textAlign: 'center',
    ...Typography.body,
    color: colors.text.tertiary,
    paddingVertical: Spacing.lg,
  },
  dateScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  dateScrollContent: {
    paddingRight: Spacing.lg,
  },
  dateCard: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    backgroundColor: colors.background.primary,
    position: 'relative',
  },
  dateCardSelected: {
    borderColor: colors.brand.purpleLight,
    backgroundColor: colors.tint.pink,
  },
  todayBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: colors.successScale[400],
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.background.primary,
  },
  dateDay: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  dateNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  dateMonth: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  dateTextSelected: {
    color: colors.brand.purpleLight,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    width: '31%',
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  timeSlotSelected: {
    borderColor: colors.brand.purpleLight,
    backgroundColor: colors.tint.pink,
  },
  timeSlotDisabled: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.default,
    opacity: 0.5,
  },
  timeText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeTextSelected: {
    color: colors.brand.purpleLight,
    fontWeight: '700',
  },
  timeTextDisabled: {
    color: colors.text.tertiary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.base,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  inputIconTop: {
    marginRight: Spacing.md,
    marginTop: Spacing.xs,
  },
  input: {
    flex: 1,
    height: 50,
    ...Typography.bodyLarge,
  },
  textArea: {
    height: 100,
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  summaryLabel: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  summaryValue: {
    ...Typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  summaryLabelBold: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  summaryValueBold: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.brand.purpleLight,
  },
  depositBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  depositText: {
    fontSize: 14,
    color: colors.secondary[700],
  },
  depositSub: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  policyText: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: colors.text.tertiary,
    flex: 1,
    lineHeight: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    ...Shadows.medium,
  },
  confirmButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  confirmButtonSmall: {
    paddingHorizontal: isSmallDevice ? Spacing.sm : 0,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? Spacing.sm : Spacing.base,
    gap: isSmallDevice ? Spacing.xs : Spacing.sm,
  },
  confirmButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    fontSize: isSmallDevice ? 14 : 16,
    color: colors.background.primary,
  },
  groupBookingToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  groupBookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  groupBookingSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.default,
    justifyContent: 'center',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.brand.purpleLight,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    alignSelf: 'flex-start',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  groupMembersContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  groupMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  groupMemberRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  groupMemberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    height: 44,
    backgroundColor: colors.background.secondary,
  },
  groupMemberPhone: {
    width: 120,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    height: 44,
    backgroundColor: colors.background.secondary,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  addMemberText: {
    color: colors.brand.purpleLight,
    marginLeft: Spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  patchTestContainer: {
    padding: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    margin: Spacing.md,
  },
  patchTestTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  patchTestText: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
});

export default withErrorBoundary(AppointmentBookingPage, 'BookingAppointment');
