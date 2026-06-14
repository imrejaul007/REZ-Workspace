// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { ThemedText } from '@/components/ThemedText';
import { platformAlertSimple } from '@/utils/platformAlert';
import serviceBookingApi from '@/services/serviceBookingApi';
import { useIsMounted } from '@/hooks/useIsMounted';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

function RescheduleBookingScreen() {
  const { bookingId } = useLocalSearchParams<unknown>();
  const router = useRouter();
  const isMounted = useIsMounted();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  // ETHAN: crash guard — bookingId from route params could be undefined
  if (!bookingId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>Reschedule Appointment</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={(styles as unknown).errorContainer}>
          <Text style={(styles as unknown).errorText}>Booking not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={(styles as unknown).retryButton}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
          >
            <Text style={(styles as unknown).retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Generate next 30 days
  const getNextDays = (): string[] => {
    const days: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  // Generate time slots
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 9; hour < 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string): string => {
    const [hour] = timeStr.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      platformAlertSimple('Missing Information', 'Please select both date and time');
      return;
    }

    setLoading(true);
    try {
      const response = await (serviceBookingApi as unknown).rescheduleBooking(bookingId || '', {
        newDate: selectedDate,
        newTime: selectedTime,
      });

      if (response.success) {
        platformAlertSimple('Success!', 'Your appointment has been rescheduled. The merchant will be notified.');
        if (isMounted()) {
          setTimeout(() => router.replace('/my-bookings' as unknown as string), 1500);
        }
      } else {
        platformAlertSimple('Error', response.error || 'Could not reschedule booking');
      }
    } catch (err) {
      platformAlertSimple('Error', err.response?.data?.error || 'Failed to reschedule booking. Please try again.');
    } finally {
      if (isMounted()) {
        setLoading(false);
      }
    }
  };

  const nextDays = getNextDays();
  const timeSlots = generateTimeSlots();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>Reschedule Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Selection */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Select New Date</ThemedText>
          <View style={styles.datesGrid}>
            {nextDays.slice(0, 15).map((date) => (
              <Pressable
                key={date}
                onPress={() => setSelectedDate(date)}
                style={[styles.dateButton, selectedDate === date ? styles.dateButtonSelected : null]}
                accessibilityRole="radio"
                accessibilityLabel={`Select date ${formatDate(date)}`}
                accessibilityState={{ selected: selectedDate === date }}
              >
                <Text style={[styles.dateButtonText, selectedDate === date ? styles.dateButtonTextSelected : null]}>
                  {formatDate(date)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Select New Time</ThemedText>
            <View style={styles.timesGrid}>
              {timeSlots.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  style={[styles.timeButton, selectedTime === time ? styles.timeButtonSelected : null]}
                  accessibilityRole="radio"
                  accessibilityLabel={`Select time ${formatTime(time)}`}
                  accessibilityState={{ selected: selectedTime === time }}
                >
                  <Text style={[styles.timeButtonText, selectedTime === time ? styles.timeButtonTextSelected : null]}>
                    {formatTime(time)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
          <Text style={[styles.infoText, { color: colors.text.secondary }]}>
            The merchant will be notified of your reschedule request
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm Button */}
      {selectedDate && selectedTime && (
        <View style={[styles.footer, { backgroundColor: colors.background.primary }]}>
          <Pressable
            style={[styles.confirmBtn, { backgroundColor: colors.brand.purpleLight, opacity: loading ? 0.7 : 1 }]}
            onPress={handleReschedule}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={`Confirm reschedule to ${formatDate(selectedDate)} at ${formatTime(selectedTime)}`}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background.primary} />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

export default withErrorBoundary(RescheduleBookingScreen, 'BookingRescheduleBookingId');

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: { ...Typography.h4, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h4, fontWeight: '600', marginBottom: Spacing.md },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  dateButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  dateButtonSelected: {
    backgroundColor: colors.brand.purpleLight,
    borderColor: colors.brand.purpleLight,
  },
  dateButtonText: { fontSize: 12, fontWeight: '500', color: colors.text.secondary },
  dateButtonTextSelected: { fontWeight: '700', color: colors.background.primary },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  timeButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  timeButtonSelected: {
    backgroundColor: colors.brand.purpleLight,
    borderColor: colors.brand.purpleLight,
  },
  timeButtonText: { fontSize: 13, fontWeight: '500', color: colors.text.secondary },
  timeButtonTextSelected: { fontWeight: '700', color: colors.background.primary },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 16 },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  confirmBtn: { paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  confirmBtnText: { ...Typography.bodyLarge, fontWeight: '700', color: colors.background.primary },
});
