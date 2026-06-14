// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Salon Booking Flow Page
 * Book appointment with service, stylist, date & time selection
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FormPageSkeleton } from '@/components/skeletons';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useGetCurrencySymbol } from '@/stores/selectors';
import { useIsMounted } from '@/hooks/useIsMounted';
import TimeSlotPicker from '../components/TimeSlotPicker';
import StylistPicker from '../components/StylistPicker';
import apiClient from '@/services/apiClient';
import { platformAlertSimple } from '@/utils/platformAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: colors.brand.pink,
  primaryDark: '#F43F5E',
  white: colors.background.primary,
  gray50: colors.background.secondary,
  gray200: colors.border.default,
  gray600: colors.text.tertiary,
  green500: Colors.success,
  background: colors.background.secondary,
  amber: Colors.warning,
};

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Stylist {
  id: string;
  name: string;
  image?: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: string;
  available: boolean;
}

const SalonBookingPage: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const {
    salonId,
    salonName,
    serviceId,
    serviceName,
    servicePrice,
    serviceDuration,
    stylistId,
    stylistName,
  } = useLocalSearchParams<{
    salonId: string;
    salonName: string;
    serviceId: string;
    serviceName: string;
    servicePrice: string;
    serviceDuration: string;
    stylistId?: string;
    stylistName?: string;
  }>();

  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(
    stylistId && stylistName
      ? { id: stylistId, name: stylistName, specialty: '', rating: 0, reviewCount: 0, experience: '', available: true }
      : null
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showStylistPicker, setShowStylistPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Data
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Mock data for demonstration
  const mockStylists: Stylist[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      image: '',
      specialty: 'Hair Styling & Coloring',
      rating: 4.9,
      reviewCount: 156,
      experience: '8 years',
      available: true,
    },
    {
      id: '2',
      name: 'Rahul Verma',
      image: '',
      specialty: "Men's Grooming",
      rating: 4.7,
      reviewCount: 89,
      experience: '5 years',
      available: true,
    },
    {
      id: '3',
      name: 'Anita Patel',
      image: '',
      specialty: 'Facials & Skincare',
      rating: 4.8,
      reviewCount: 112,
      experience: '6 years',
      available: false,
    },
    {
      id: '4',
      name: 'Meera Joshi',
      image: '',
      specialty: 'Bridal Makeup',
      rating: 4.9,
      reviewCount: 78,
      experience: '10 years',
      available: true,
    },
  ];

  const fetchStylists = useCallback(async () => {
    try {
      // In production, use API call:
      // const response = await apiClient.get(`/public/stores/${salonId}/staff`);

      // Using mock data
      if (!isMounted()) return;
      setStylists(mockStylists);
    } catch (error) {
      if (!isMounted()) return;
      setStylists([]);
    }
  }, [salonId, isMounted]);

  const fetchAvailableSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      // In production, use API call:
      // const response = await apiClient.get(`/service-appointments/slots/${salonId}?date=${dateStr}`);

      // Generate mock slots
      const date = selectedDate;
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const slots: TimeSlot[] = [];

      for (let hour = 9; hour < 21; hour++) {
        for (const minute of [0, 30]) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

          const isPast = isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()));
          // Randomly make some slots unavailable
          const available = !isPast && Math.random() > 0.2;

          slots.push({
            id: timeString,
            time: displayTime,
            available,
          });
        }
      }

      if (!isMounted()) return;
      setAvailableSlots(slots);
    } catch (error) {
      if (!isMounted()) return;
      setAvailableSlots([]);
    } finally {
      if (!isMounted()) return;
      setLoadingSlots(false);
    }
  }, [selectedDate, salonId, isMounted]);

  useEffect(() => {
    setIsLoading(true);
    fetchStylists().finally(() => {
      if (!isMounted()) return;
      setIsLoading(false);
    });
  }, [fetchStylists, isMounted]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // Generate next 14 days
  const getNextDays = (count: number) => {
    const days = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = getNextDays(14);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedTime(slot);
    }
  };

  const handleStylistSelect = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setShowStylistPicker(false);
  };

  const validateForm = (): boolean => {
    if (!selectedTime) {
      setErrorMessage('Please select a time slot');
      return false;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please enter your name');
      return false;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your phone number');
      return false;
    }
    if (!/^[0-9]{10}$/.test(customerPhone.replace(/\s/g, ''))) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const handleBooking = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const confirmBooking = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      // In production, use API call:
      // const response = await apiClient.post('/service-bookings', {
      //   serviceId,
      //   salonId,
      //   bookingDate: selectedDate.toISOString(),
      //   timeSlot: selectedTime,
      //   stylistId: selectedStylist?.id,
      //   customerName,
      //   customerPhone,
      //   customerEmail,
      //   notes,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!isMounted()) return;
      setIsSubmitting(false);
      if (!isMounted()) return;
      setShowSuccessModal(true);
    } catch (error) {
      if (!isMounted()) return;
      setIsSubmitting(false);
      platformAlertSimple('Booking Failed', error.message || 'Failed to create booking. Please try again.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.replace('/salon/my-bookings' as unknown);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <FormPageSkeleton />
      </View>
    );
  }

  const price = parseFloat(servicePrice || '0');
  const duration = parseInt(serviceDuration || '60', 10);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: (Platform.OS === 'ios' ? 56 : 16) as number }]}
        >
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Book Appointment</ThemedText>
            <View style={{ width: 44 }} />
          </View>

          {/* Service Info Card */}
          <View style={styles.serviceCard}>
            <View style={styles.serviceIconContainer}>
              <Ionicons name="cut" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.serviceDetails}>
              <ThemedText style={styles.serviceName}>{serviceName}</ThemedText>
              <ThemedText style={styles.salonName}>{salonName}</ThemedText>
              <View style={styles.servicePriceRow}>
                <ThemedText style={styles.servicePrice}>
                  {currencySymbol}
                  {price.toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.serviceDuration}>• {duration} min</ThemedText>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
              <ThemedText style={styles.sectionTitle}>Select Date</ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContent}
            >
              {nextDays.map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <Pressable
                    key={date.toISOString()}
                    onPress={() => handleDateSelect(date)}
                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  >
                    <ThemedText style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </ThemedText>
                    <ThemedText style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>
                      {date.getDate()}
                    </ThemedText>
                    <ThemedText style={[styles.dateMonth, isSelected && styles.dateTextSelected]}>
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </ThemedText>
                    {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Stylist Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
              <ThemedText style={styles.sectionTitle}>Select Stylist (Optional)</ThemedText>
            </View>
            <Pressable style={styles.stylistPickerBtn} onPress={() => setShowStylistPicker(true)}>
              {selectedStylist ? (
                <View style={styles.selectedStylistRow}>
                  <View style={styles.stylistAvatar}>
                    <Text style={styles.stylistAvatarText}>{selectedStylist.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.stylistInfo}>
                    <ThemedText style={styles.stylistName}>{selectedStylist.name}</ThemedText>
                    <ThemedText style={styles.stylistSpecialty}>{selectedStylist.specialty}</ThemedText>
                  </View>
                </View>
              ) : (
                <ThemedText style={styles.stylistPickerPlaceholder}>Choose a preferred stylist</ThemedText>
              )}
              <Ionicons name="chevron-down" size={16} color={COLORS.gray600} />
            </Pressable>
          </View>

          {/* Time Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <ThemedText style={styles.sectionTitle}>Select Time</ThemedText>
            </View>
            {loadingSlots ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <TimeSlotPicker
                slots={availableSlots}
                selectedSlot={selectedTime}
                onSelectSlot={handleTimeSelect}
              />
            )}
          </View>

          {/* Customer Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} />
              <ThemedText style={styles.sectionTitle}>Your Details</ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person" size={18} color={COLORS.gray600} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                placeholderTextColor={COLORS.gray600}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call" size={18} color={COLORS.gray600} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                placeholderTextColor={COLORS.gray600}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={18} color={COLORS.gray600} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email (Optional)"
                placeholderTextColor={COLORS.gray600}
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <Ionicons name="chatbubble" size={18} color={COLORS.gray600} style={[styles.inputIcon, { marginTop: 14 }]} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Special Requests (Optional)"
                placeholderTextColor={COLORS.gray600}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Summary Card */}
          {selectedTime && (
            <View style={styles.section}>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryTitle}>Booking Summary</ThemedText>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Service</ThemedText>
                  <ThemedText style={styles.summaryValue}>{serviceName}</ThemedText>
                </View>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Date</ThemedText>
                  <ThemedText style={styles.summaryValue}>{formatDate(selectedDate)}</ThemedText>
                </View>

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Time</ThemedText>
                  <ThemedText style={styles.summaryValue}>{selectedTime?.time}</ThemedText>
                </View>

                {selectedStylist && (
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Stylist</ThemedText>
                    <ThemedText style={styles.summaryValue}>{selectedStylist.name}</ThemedText>
                  </View>
                )}

                <View style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>Duration</ThemedText>
                  <ThemedText style={styles.summaryValue}>{duration} min</ThemedText>
                </View>

                <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                  <ThemedText style={styles.summaryLabelTotal}>Total</ThemedText>
                  <ThemedText style={styles.summaryValueTotal}>
                    {currencySymbol}
                    {price.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <ThemedText style={styles.errorBannerText}>{errorMessage}</ThemedText>
            <Pressable onPress={() => setErrorMessage('')}>
              <Ionicons name="close" size={18} color={Colors.error} />
            </Pressable>
          </View>
        ) : null}

        {/* Bottom Book Button */}
        <View style={styles.bottomContainer}>
          <Pressable onPress={handleBooking} style={styles.bookButton} disabled={isSubmitting}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <ThemedText style={styles.bookButtonText}>
                    Confirm Booking {currencySymbol}
                    {price.toLocaleString()}
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Stylist Picker Modal */}
      <Modal
        visible={showStylistPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStylistPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: 32 }]}>
            <ThemedText style={styles.modalTitle}>Choose Stylist</ThemedText>

            <Pressable
              style={styles.stylistOption}
              onPress={() => {
                setSelectedStylist(null);
                setShowStylistPicker(false);
              }}
            >
              <View style={styles.stylistOptionIcon}>
                <Ionicons name="people-outline" size={20} color={COLORS.gray600} />
              </View>
              <ThemedText style={styles.stylistOptionText}>Any available stylist</ThemedText>
              {!selectedStylist && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
            </Pressable>

            {stylists.map((stylist) => (
              <Pressable
                key={stylist.id}
                style={[styles.stylistOption, !stylist.available && styles.stylistOptionDisabled]}
                onPress={() => stylist.available && handleStylistSelect(stylist)}
                disabled={!stylist.available}
              >
                <View style={styles.stylistOptionAvatar}>
                  <Text style={styles.stylistOptionAvatarText}>{stylist.name.charAt(0)}</Text>
                </View>
                <View style={styles.stylistOptionInfo}>
                  <ThemedText style={styles.stylistOptionName}>{stylist.name}</ThemedText>
                  <ThemedText style={styles.stylistOptionSpecialty}>
                    {stylist.specialty} • {stylist.experience}
                  </ThemedText>
                  {!stylist.available && (
                    <Text style={styles.stylistUnavailable}>Currently unavailable</Text>
                  )}
                </View>
                {selectedStylist?.id === stylist.id && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="calendar" size={32} color={COLORS.primary} />
            </View>
            <ThemedText style={styles.modalTitle}>Confirm Booking</ThemedText>
            <ThemedText style={styles.modalMessage}>
              Book {serviceName} at {salonName} on {formatDate(selectedDate)} at {selectedTime?.time}?
            </ThemedText>

            <View style={styles.modalDetails}>
              <View style={styles.modalDetailRow}>
                <Ionicons name="cut" size={16} color={COLORS.gray600} />
                <ThemedText style={styles.modalDetailText}>{serviceName}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="person" size={16} color={COLORS.gray600} />
                <ThemedText style={styles.modalDetailText}>{customerName}</ThemedText>
              </View>
              <View style={styles.modalDetailRow}>
                <Ionicons name="call" size={16} color={COLORS.gray600} />
                <ThemedText style={styles.modalDetailText}>{customerPhone}</ThemedText>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setShowConfirmModal(false)}>
                <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.modalConfirmButton} onPress={confirmBooking}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmGradient}
                >
                  <ThemedText style={styles.modalConfirmText}>Confirm</ThemedText>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={handleSuccessClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, styles.successIconContainer]}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.green500} />
            </View>
            <ThemedText style={styles.modalTitle}>Booking Confirmed!</ThemedText>
            <ThemedText style={styles.modalMessage}>
              Your appointment has been booked. You will receive a confirmation shortly.
            </ThemedText>

            <View style={styles.successDetails}>
              <View style={styles.successDetailRow}>
                <ThemedText style={styles.successLabel}>Service</ThemedText>
                <ThemedText style={styles.successValue}>{serviceName}</ThemedText>
              </View>
              <View style={styles.successDetailRow}>
                <ThemedText style={styles.successLabel}>Date</ThemedText>
                <ThemedText style={styles.successValue}>{formatDate(selectedDate)}</ThemedText>
              </View>
              <View style={styles.successDetailRow}>
                <ThemedText style={styles.successLabel}>Time</ThemedText>
                <ThemedText style={styles.successValue}>{selectedTime?.time}</ThemedText>
              </View>
              {selectedStylist && (
                <View style={styles.successDetailRow}>
                  <ThemedText style={styles.successLabel}>Stylist</ThemedText>
                  <ThemedText style={styles.successValue}>{selectedStylist.name}</ThemedText>
                </View>
              )}
            </View>

            <Pressable style={styles.successButton} onPress={handleSuccessClose}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.successButtonGradient}
              >
                <ThemedText style={styles.successButtonText}>Done</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.inverse,
    fontFamily: 'Poppins',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: 2,
  },
  salonName: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  servicePrice: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: COLORS.primary,
  },
  serviceDuration: {
    ...Typography.body,
    color: COLORS.gray600,
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.nileBlue,
    marginLeft: Spacing.sm,
    fontFamily: 'Poppins',
  },
  dateScrollContent: {
    paddingRight: Spacing.base,
  },
  dateCard: {
    width: 68,
    height: 88,
    borderRadius: BorderRadius.lg,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  dateDay: {
    ...Typography.caption,
    fontWeight: '500',
    color: COLORS.gray600,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  dateMonth: {
    ...Typography.caption,
    color: COLORS.gray600,
    marginTop: 2,
  },
  dateTextSelected: {
    color: colors.text.inverse,
  },
  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  todayDotSelected: {
    backgroundColor: colors.text.inverse,
  },
  stylistPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stylistPickerPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray600,
  },
  selectedStylistRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stylistAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stylistAvatarText: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  stylistSpecialty: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    marginBottom: Spacing.md,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    ...Typography.body,
    fontFamily: 'Inter',
    color: colors.nileBlue,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
  },
  textArea: {
    height: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  summaryLabel: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  summaryValue: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  summaryRowTotal: {
    borderBottomWidth: 0,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  summaryLabelTotal: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  summaryValueTotal: {
    ...Typography.h4,
    fontWeight: '700',
    color: COLORS.primary,
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorScale[100],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    zIndex: 100,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.body,
    color: Colors.error,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  bookButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: 10,
  },
  bookButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.inverse,
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.nileBlue,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...Typography.body,
    color: COLORS.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  modalDetails: {
    width: '100%',
    backgroundColor: COLORS.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  modalDetailText: {
    ...Typography.body,
    color: colors.text.secondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
  },
  modalCancelText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  stylistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    gap: Spacing.md,
  },
  stylistOptionDisabled: {
    opacity: 0.5,
  },
  stylistOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stylistOptionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stylistOptionAvatarText: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  stylistOptionInfo: {
    flex: 1,
  },
  stylistOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  stylistOptionName: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  stylistOptionSpecialty: {
    ...Typography.bodySmall,
    color: COLORS.gray600,
  },
  stylistUnavailable: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 2,
  },
  successDetails: {
    width: '100%',
    backgroundColor: COLORS.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  successDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  successLabel: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  successValue: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  successButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  successButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  successButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default withErrorBoundary(SalonBookingPage, 'SalonBooking');
