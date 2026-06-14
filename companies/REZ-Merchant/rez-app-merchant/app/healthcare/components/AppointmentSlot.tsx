/**
 * AppointmentSlot Component
 * Reusable component for displaying appointment time slots
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';

export type AppointmentStatus = 'available' | 'booked' | 'blocked' | 'selected';

export interface AppointmentSlotData {
  id: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  patientName?: string;
  appointmentType?: 'in_person' | 'telemedicine';
  doctorName?: string;
}

interface AppointmentSlotProps {
  slot: AppointmentSlotData;
  onPress?: () => void;
  compact?: boolean;
}

const getStatusColor = (status: AppointmentStatus): string => {
  const colors: Record<AppointmentStatus, string> = {
    available: Colors.light.success,
    booked: Colors.light.info,
    blocked: Colors.light.textMuted,
    selected: Colors.light.primary,
  };
  return colors[status];
};

const getStatusBgColor = (status: AppointmentStatus): string => {
  const colors: Record<AppointmentStatus, string> = {
    available: Colors.light.successLight,
    booked: Colors.light.infoLight,
    blocked: Colors.light.backgroundSecondary,
    selected: Colors.light.primaryLight2,
  };
  return colors[status];
};

const getStatusLabel = (status: AppointmentStatus): string => {
  const labels: Record<AppointmentStatus, string> = {
    available: 'Available',
    booked: 'Booked',
    blocked: 'Blocked',
    selected: 'Selected',
  };
  return labels[status];
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const AppointmentSlot: React.FC<AppointmentSlotProps> = ({
  slot,
  onPress,
  compact = false,
}) => {
  const isAvailable = slot.status === 'available' || slot.status === 'selected';
  const isSelected = slot.status === 'selected';

  return (
    <TouchableOpacity
      onPress={isAvailable ? onPress : undefined}
      activeOpacity={isAvailable ? 0.7 : 1}
      disabled={!isAvailable}
    >
      <View
        style={[
          styles.container,
          compact && styles.containerCompact,
          { backgroundColor: getStatusBgColor(slot.status) },
          isSelected && styles.containerSelected,
          !isAvailable && styles.containerUnavailable,
        ]}
      >
        <View style={styles.timeContainer}>
          <Text
            style={[
              styles.timeText,
              { color: getStatusColor(slot.status) },
              isSelected && styles.timeTextSelected,
            ]}
          >
            {formatTime(slot.startTime)}
          </Text>
          <Text
            style={[
              styles.timeSeparator,
              { color: getStatusColor(slot.status) },
              isSelected && styles.timeTextSelected,
            ]}
          >
            -
          </Text>
          <Text
            style={[
              styles.timeText,
              { color: getStatusColor(slot.status) },
              isSelected && styles.timeTextSelected,
            ]}
          >
            {formatTime(slot.endTime)}
          </Text>
        </View>

        {slot.status === 'booked' && slot.patientName && (
          <View style={styles.bookingInfo}>
            <Text style={styles.patientName}>{slot.patientName}</Text>
            {slot.appointmentType && (
              <View style={styles.typeContainer}>
                <Ionicons
                  name={
                    slot.appointmentType === 'telemedicine'
                      ? 'videocam-outline'
                      : 'business-outline'
                  }
                  size={12}
                  color={Colors.light.textSecondary}
                />
                <Text style={styles.typeText}>
                  {slot.appointmentType === 'telemedicine' ? 'Telemedicine' : 'In-Person'}
                </Text>
              </View>
            )}
          </View>
        )}

        {slot.status === 'blocked' && (
          <Text style={styles.blockedText}>Unavailable</Text>
        )}

        {slot.status === 'available' && (
          <View style={styles.availableIndicator}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.light.success} />
            <Text style={styles.availableText}>Tap to book</Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.light.primary} />
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Calendar Day View Component
interface CalendarDayViewProps {
  slots: AppointmentSlotData[];
  selectedSlotId?: string;
  onSlotPress: (slotId: string) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  slots,
  selectedSlotId,
  onSlotPress,
}) => {
  return (
    <View style={styles.dayViewContainer}>
      <Text style={styles.dayViewTitle}>Available Slots</Text>
      <View style={styles.slotsGrid}>
        {slots.map((slot) => (
          <AppointmentSlot
            key={slot.id}
            slot={{
              ...slot,
              status:
                slot.id === selectedSlotId
                  ? 'selected'
                  : slot.status,
            }}
            onPress={() => onSlotPress(slot.id)}
            compact
          />
        ))}
      </View>
      {slots.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={32} color={Colors.light.textMuted} />
          <Text style={styles.emptyText}>No slots available for this day</Text>
        </View>
      )}
    </View>
  );
};

// Week View Slot Row Component
interface WeekViewSlotRowProps {
  time: string;
  slots: AppointmentSlotData[];
  selectedSlotId?: string;
  onSlotPress: (slotId: string) => void;
}

export const WeekViewSlotRow: React.FC<WeekViewSlotRowProps> = ({
  time,
  slots,
  selectedSlotId,
  onSlotPress,
}) => {
  return (
    <View style={styles.weekRowContainer}>
      <Text style={styles.weekRowTime}>{formatTime(time)}</Text>
      <View style={styles.weekRowSlots}>
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.weekSlot,
              {
                backgroundColor:
                  slot.id === selectedSlotId
                    ? Colors.light.primaryLight2
                    : slot.status === 'booked'
                      ? Colors.light.infoLight
                      : 'transparent',
                borderColor:
                  slot.id === selectedSlotId
                    ? Colors.light.primary
                    : Colors.light.border,
              },
            ]}
            onPress={() => slot.status === 'available' && onSlotPress(slot.id)}
            disabled={slot.status !== 'available'}
          >
            {slot.status === 'booked' && (
              <Text style={styles.weekSlotPatient} numberOfLines={1}>
                {slot.patientName}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  containerCompact: {
    padding: 8,
    marginBottom: 4,
  },
  containerSelected: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  containerUnavailable: {
    opacity: 0.7,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeTextSelected: {
    color: Colors.light.primary,
  },
  timeSeparator: {
    fontSize: 14,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  bookingInfo: {
    marginTop: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  blockedText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  availableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '500',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  selectedText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  dayViewContainer: {
    marginTop: 16,
  },
  dayViewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 8,
  },
  weekRowContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekRowTime: {
    width: 60,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  weekRowSlots: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  weekSlot: {
    flex: 1,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  weekSlotPatient: {
    fontSize: 10,
    color: Colors.light.textSecondary,
  },
});

export default AppointmentSlot;
