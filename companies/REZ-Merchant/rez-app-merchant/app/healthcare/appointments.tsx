/**
 * Appointments Calendar Screen
 * Displays appointments in a calendar view with day/week/month options
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';
import { Card } from '@/components/ui/DesignSystemComponents';
import { useStore } from '@/contexts/StoreContext';

// Types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: 'in_person' | 'telemedicine';
  reason: string;
  notes?: string;
}

type ViewMode = 'day' | 'week' | 'month';

// Mock data
const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'John Smith',
    patientPhone: '+1 234 567 8901',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    date: new Date(),
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    type: 'in_person',
    reason: 'Follow-up consultation',
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Sarah Johnson',
    patientPhone: '+1 234 567 8902',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    date: new Date(),
    startTime: '10:00',
    endTime: '10:30',
    status: 'scheduled',
    type: 'telemedicine',
    reason: 'Prescription renewal',
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Michael Brown',
    patientPhone: '+1 234 567 8903',
    doctorId: 'd2',
    doctorName: 'Dr. James Wilson',
    date: new Date(),
    startTime: '11:00',
    endTime: '11:45',
    status: 'in_progress',
    type: 'in_person',
    reason: 'Annual checkup',
    notes: 'Patient requested blood work',
  },
  {
    id: '4',
    patientId: '4',
    patientName: 'Emily Davis',
    patientPhone: '+1 234 567 8904',
    doctorId: 'd1',
    doctorName: 'Dr. Emily Chen',
    date: new Date(),
    startTime: '14:00',
    endTime: '14:30',
    status: 'scheduled',
    type: 'in_person',
    reason: 'New patient consultation',
  },
  {
    id: '5',
    patientId: '5',
    patientName: 'Robert Wilson',
    patientPhone: '+1 234 567 8905',
    doctorId: 'd2',
    doctorName: 'Dr. James Wilson',
    date: new Date(),
    startTime: '15:30',
    endTime: '16:00',
    status: 'completed',
    type: 'telemedicine',
    reason: 'Lab results review',
  },
];

// Helper functions
const getStatusColor = (status: AppointmentStatus): string => {
  const colors: Record<AppointmentStatus, string> = {
    scheduled: Colors.light.info,
    confirmed: Colors.light.success,
    in_progress: Colors.light.warning,
    completed: Colors.light.primary,
    cancelled: Colors.light.danger,
    no_show: Colors.light.textMuted,
  };
  return colors[status];
};

const getStatusLabel = (status: AppointmentStatus): string => {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return labels[status];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <Card variant="elevated" padding="md" style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{appointment.startTime}</Text>
          <Text style={styles.timeSeparator}>-</Text>
          <Text style={styles.timeText}>{appointment.endTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(appointment.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
            {getStatusLabel(appointment.status)}
          </Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <Text style={styles.patientName}>{appointment.patientName}</Text>
        <Text style={styles.reasonText}>{appointment.reason}</Text>
      </View>

      <View style={styles.appointmentFooter}>
        <View style={styles.footerItem}>
          <Ionicons
            name={appointment.type === 'telemedicine' ? 'videocam-outline' : 'business-outline'}
            size={16}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.footerText}>
            {appointment.type === 'telemedicine' ? 'Telemedicine' : 'In-Person'}
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
          <Text style={styles.footerText}>{appointment.doctorName}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const viewModes: { label: string; value: ViewMode }[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  // Generate dates for week view
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return (
      aptDate.getDate() === selectedDate.getDate() &&
      aptDate.getMonth() === selectedDate.getMonth() &&
      aptDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments().finally(() => setRefreshing(false));
  }, [fetchAppointments]);

  const handleAppointmentPress = useCallback((appointment: Appointment) => {
    router.push(`/healthcare/appointment/${appointment.id}`);
  }, []);

  const handleNewAppointment = useCallback(() => {
    Alert.alert('New Appointment', 'Appointment creation modal would open here', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Create', onPress: () => {} },
    ]);
  }, []);

  const handlePrevDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const handleNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        {viewModes.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.viewModeButton,
              viewMode === mode.value && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode(mode.value)}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === mode.value && styles.viewModeTextActive,
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Week Calendar Strip (for week view) */}
      {viewMode === 'week' && (
        <View style={styles.weekStrip}>
          {weekDates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDayItem,
                selectedDate.getDate() === date.getDate() && styles.weekDayItemSelected,
              ]}
              onPress={() => handleDateSelect(date)}
            >
              <Text
                style={[
                  styles.weekDayText,
                  selectedDate.getDate() === date.getDate() && styles.weekDayTextSelected,
                ]}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.weekDateText,
                  selectedDate.getDate() === date.getDate() && styles.weekDateTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
              {isToday(date) && <View style={styles.todayDot} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Date Navigation */}
      <View style={styles.dateNavContainer}>
        <TouchableOpacity onPress={handlePrevDay} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextDay} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredAppointments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.light.success }]}>
            {filteredAppointments.filter((a) => a.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: Colors.light.warning }]}>
            {filteredAppointments.filter((a) => a.status === 'in_progress').length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textHeading} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity onPress={handleNewAppointment} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50)}>
              <AppointmentCard
                appointment={item}
                onPress={() => handleAppointmentPress(item)}
              />
            </Animated.View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No Appointments</Text>
              <Text style={styles.emptyText}>
                No appointments scheduled for this date
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  addButton: {
    padding: 4,
  },
  header: {
    paddingBottom: 16,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  viewModeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  weekDayItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    minWidth: 44,
  },
  weekDayItemSelected: {
    backgroundColor: Colors.light.primaryLight2,
  },
  weekDayText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  weekDayTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  weekDateText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.textHeading,
  },
  weekDateTextSelected: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
    marginTop: 4,
  },
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  appointmentCard: {
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  timeSeparator: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginHorizontal: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  appointmentFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
