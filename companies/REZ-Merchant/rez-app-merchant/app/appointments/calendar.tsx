import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService, ServiceAppointment } from '@/services/api/appointments';
import { Colors } from '@/constants/Colors';
import { LongPressGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  useAnimatedReaction,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const HOUR_HEIGHT = 64;
const COLUMN_WIDTH = 120;
const TIME_COL_WIDTH = 56;
const START_HOUR = 8; // 8am
const END_HOUR = 22; // 10pm
const SLOT_MINUTES = 30;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

interface Appointment extends ServiceAppointment {
  startTime?: string;
  endTime?: string;
}

interface StaffMember {
  _id: string;
  name: string;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  pending: '#f59e0b',
  in_progress: '#8b5cf6',
  no_show: '#dc2626',
};

interface DraggableCardProps {
  appointment: Appointment;
  staffId: string;
  onPress: () => void;
  onDragEnd: (
    appointment: Appointment,
    deltaSlots: number,
    deltaStaff: number,
    fromStaffId: string
  ) => void;
  isEnabled: boolean;
  staffIndex: number;
  totalStaff: number;
}

function DraggableAppointmentCard({
  appointment,
  staffId,
  onPress,
  onDragEnd,
  isEnabled,
  staffIndex,
  totalStaff,
}: DraggableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.15);
  const isDragging = useSharedValue(false);

  // Sync isDragging shared value → JS-thread state for React props (enabled/disabled)
  const [isDraggingState, setIsDraggingState] = useState(false);
  useAnimatedReaction(
    () => isDragging.value,
    (dragging) => {
      runOnJS(setIsDraggingState)(dragging);
    }
  );

  const startTime = appointment.appointmentTime || appointment.startTime || '09:00';
  // Compute end time from actual duration (default 60 min if missing)
  const durationMinutes = appointment.duration || 60;
  const [startH, startM] = startTime.split(':').map(Number);
  const endTotalMins = startH * 60 + startM + durationMinutes;
  const endHour = Math.floor(endTotalMins / 60);
  const endMin = endTotalMins % 60;
  const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

  const apptTop = (startH - START_HOUR + startM / 60) * HOUR_HEIGHT;
  const apptHeight = Math.max((endHour + endMin / 60 - (startH + startM / 60)) * HOUR_HEIGHT, 32);

  const onLongPress = (event) => {
    if (!isEnabled) return;

    isDragging.value = true;
    scale.value = withSpring(1.08);
    shadowOpacity.value = withSpring(0.4);
  };

  const onPanEvent = (event) => {
    if (!isDragging.value || !isEnabled) return;

    translateX.value = event.translationX;
    translateY.value = event.translationY;
  };

  const onPanEnd = (event) => {
    if (!isDragging.value) {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      shadowOpacity.value = withSpring(0.15);
      isDragging.value = false;
      return;
    }

    const deltaSlots = Math.round((event.translationY / HOUR_HEIGHT) * 2); // Each slot is 30 min = HOUR_HEIGHT/2
    const deltaStaff = Math.round(event.translationX / COLUMN_WIDTH);

    // Snap back to origin
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    shadowOpacity.value = withSpring(0.15);
    isDragging.value = false;

    // Only trigger callback if there was actual movement
    if (deltaSlots !== 0 || deltaStaff !== 0) {
      // Validate move is within bounds
      const newStaffIndex = staffIndex + deltaStaff;
      if (newStaffIndex >= 0 && newStaffIndex < totalStaff) {
        runOnJS(onDragEnd)(appointment, deltaSlots, deltaStaff, staffId);
      }
    }
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    elevation: isDragging.value ? 12 : 2,
    shadowOpacity: shadowOpacity.value,
  }));

  return (
    <LongPressGestureHandler onActivated={onLongPress} minDurationMs={400} enabled={isEnabled}>
      <PanGestureHandler onGestureEvent={onPanEvent} onEnded={onPanEnd} enabled={isDraggingState}>
        <Animated.View
          style={[
            styles.apptBlock,
            {
              top: apptTop,
              height: apptHeight,
              backgroundColor: STATUS_COLORS[appointment.status] || '#3b82f6',
            },
            animStyle,
          ]}
        >
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isDraggingState}
            style={{ flex: 1 }}
          >
            <Text style={styles.apptName} numberOfLines={1}>
              {appointment.customerName}
            </Text>
            <Text style={styles.apptService} numberOfLines={1}>
              {appointment.serviceType}
            </Text>
            <Text style={styles.apptTime}>{startTime}</Text>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </LongPressGestureHandler>
  );
}

export default function AppointmentCalendarScreen() {
  const [date, setDate] = useState(new Date());
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);
  const [draggingApptId, setDraggingApptId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId || (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  const loadData = useCallback(async () => {
    if (!storeId) return;
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const apptResp = await appointmentService.getStoreAppointments(storeId, {
        date: dateStr,
      });
      setAppointments(apptResp.appointments || []);
    } catch (error) {
      logger.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const getApptTop = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return (h - START_HOUR + m / 60) * HOUR_HEIGHT;
  };

  const getApptHeight = (start: string, end: string): number => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const duration = eh + em / 60 - (sh + sm / 60);
    return Math.max(duration * HOUR_HEIGHT, 32);
  };

  const navigateDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next);
  };

  const handleAppointmentPress = (appt: Appointment) => {
    if (!dragEnabled) {
      router.push(`/appointments/${appt._id}`);
    }
  };

  const addMinutes = (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  };

  const parseTimeString = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const formatTimeString = (hours: number, minutes: number): string => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const calculateNewTime = (startTime: string, deltaSlots: number): string => {
    const { hours, minutes } = parseTimeString(startTime);
    const totalMinutes = hours * 60 + minutes + deltaSlots * SLOT_MINUTES;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    // Validate within working hours
    if (newHours < START_HOUR || newHours >= END_HOUR) {
      return startTime; // Return original if out of bounds
    }

    return formatTimeString(newHours, newMinutes);
  };

  // Group appointments by staff
  const appointmentsByStaff = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    const uniqueStaffIds = new Set<string>();
    // Build a name map from appointments themselves (staffName / staffMember fields)
    const staffNames: Record<string, string> = {};

    appointments.forEach((appt) => {
      const staffId = appt.staffId?.toString() || 'unassigned';
      if (!grouped[staffId]) {
        grouped[staffId] = [];
      }
      grouped[staffId].push(appt);
      uniqueStaffIds.add(staffId);
      if (staffId !== 'unassigned' && !staffNames[staffId]) {
        staffNames[staffId] = (appt as unknown as { staffName?: string; staffMember?: string }).staffName || (appt as unknown as { staffName?: string; staffMember?: string }).staffMember || '';
      }
    });

    return { grouped, uniqueStaffIds, staffNames };
  }, [appointments]);

  const handleDragEnd = useCallback(
    async (
      appointment: Appointment,
      deltaSlots: number,
      deltaStaff: number,
      fromStaffId: string
    ) => {
      const startTime = appointment.appointmentTime || appointment.startTime || '09:00';
      const newTime = calculateNewTime(startTime, deltaSlots);

      // Prevent scheduling outside working hours
      if (newTime === startTime && deltaSlots !== 0) {
        platformAlertSimple(
          'Cannot reschedule',
          'Appointment would fall outside working hours (8am-10pm).'
        );
        return;
      }

      // Look up the new staffId using ordered staff array (fromStaffId is a MongoDB ObjectId,
      // not a number — parseInt would always return NaN)
      const staffIds = Array.from(appointmentsByStaff.uniqueStaffIds);
      const fromIndex = staffIds.indexOf(fromStaffId);
      const newStaffId =
        deltaStaff !== 0 && fromIndex !== -1
          ? (staffIds[fromIndex + deltaStaff] ?? fromStaffId)
          : fromStaffId;

      // Store original state for rollback
      const originalAppointment = { ...appointment };

      // Optimistic UI update
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointment._id
            ? {
                ...a,
                appointmentTime: newTime,
                startTime: newTime,
                staffId: deltaStaff !== 0 ? newStaffId : a.staffId,
              }
            : a
        )
      );

      try {
        // Make API call
        const response = await appointmentService.updateAppointment(appointment._id, {
          appointmentTime: newTime,
          ...(deltaStaff !== 0 && { staffId: newStaffId }),
        });

        // Show success feedback
        platformAlertSimple('Success', 'Appointment rescheduled successfully.');
      } catch (error) {
        logger.error('Failed to reschedule appointment:', error);

        // Revert optimistic update on error
        setAppointments((prev) =>
          prev.map((a) => (a._id === appointment._id ? originalAppointment : a))
        );

        platformAlertSimple(
          'Could not reschedule',
          'Please try again or contact support if the issue persists.'
        );
      }
    },
    [appointmentsByStaff]
  );

  return (
    <View style={styles.container}>
      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => navigateDay(-1)} style={styles.navBtn}>
          <Text style={styles.navText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
        <TouchableOpacity onPress={() => navigateDay(1)} style={styles.navBtn}>
          <Text style={styles.navText}>{'›'}</Text>
        </TouchableOpacity>

        {/* Reschedule mode toggle */}
        <TouchableOpacity
          onPress={() => setDragEnabled(!dragEnabled)}
          style={[styles.modeBtn, dragEnabled && styles.modeBtnActive]}
        >
          <Ionicons
            name="move"
            size={16}
            color={dragEnabled ? '#ffcd57' : Colors.light.text}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.modeBtnText, dragEnabled && styles.modeBtnTextActive]}>
            {dragEnabled ? 'Done' : 'Reschedule'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View>
            {/* Staff column headers */}
            <View style={styles.headerRow}>
              <View style={{ width: TIME_COL_WIDTH }} />
              {Array.from(appointmentsByStaff.uniqueStaffIds).map((staffId) => (
                <View key={staffId} style={[styles.staffHeader, { width: COLUMN_WIDTH }]}>
                  <Text style={styles.staffHeaderText} numberOfLines={1}>
                    {staffId === 'unassigned'
                      ? 'Unassigned'
                      : appointmentsByStaff.staffNames[staffId] || 'Staff'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <ScrollView style={{ maxHeight: 600 }} showsVerticalScrollIndicator>
              <View style={{ flexDirection: 'row' }}>
                {/* Time column */}
                <View style={{ width: TIME_COL_WIDTH }}>
                  {HOURS.map((h) => (
                    <View key={h} style={[styles.timeCell, { height: HOUR_HEIGHT }]}>
                      <Text style={styles.timeText}>{`${String(h).padStart(2, '0')}:00`}</Text>
                    </View>
                  ))}
                </View>

                {/* Staff columns */}
                {Array.from(appointmentsByStaff.uniqueStaffIds).map((staffId, staffIndex) => {
                  const staffAppts = appointmentsByStaff.grouped[staffId] || [];
                  const totalStaff = appointmentsByStaff.uniqueStaffIds.size;

                  return (
                    <View
                      key={staffId}
                      style={[
                        styles.staffColumn,
                        {
                          width: COLUMN_WIDTH,
                          borderColor: dragEnabled ? '#ddd' : Colors.light.border,
                          borderWidth: dragEnabled ? 1 : 0,
                          borderRadius: dragEnabled ? 6 : 0,
                        },
                      ]}
                    >
                      {/* Hour grid lines */}
                      {HOURS.map((h) => (
                        <View key={h} style={[styles.hourLine, { height: HOUR_HEIGHT }]} />
                      ))}

                      {/* Appointments */}
                      {staffAppts.map((appt) => {
                        return (
                          <DraggableAppointmentCard
                            key={appt._id}
                            appointment={appt}
                            staffId={staffId}
                            onPress={() => handleAppointmentPress(appt)}
                            onDragEnd={handleDragEnd}
                            isEnabled={dragEnabled}
                            staffIndex={staffIndex}
                            totalStaff={totalStaff}
                          />
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {/* Add appointment FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/appointments/new')}
        accessibilityRole="button"
        accessibilityLabel="Add new appointment"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 8,
  },
  navBtn: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navText: {
    fontSize: 24,
    color: Colors.light.text,
    fontWeight: '400',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modeBtnActive: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffcd57',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modeBtnTextActive: {
    color: '#856404',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.text,
    paddingVertical: 12,
  },
  staffHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  staffHeaderText: {
    color: Colors.light.background,
    fontSize: 12,
    fontWeight: '600',
  },
  timeCell: {
    justifyContent: 'flex-start',
    paddingTop: 2,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  staffColumn: {
    position: 'relative',
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
  },
  hourLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  apptBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 6,
    padding: 4,
    overflow: 'hidden',
  },
  apptName: {
    color: Colors.light.background,
    fontSize: 11,
    fontWeight: '600',
  },
  apptService: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
  },
  apptTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffcd57',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: Colors.light.text,
    lineHeight: 32,
  },
});
