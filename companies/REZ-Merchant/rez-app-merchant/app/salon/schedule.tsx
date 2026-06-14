/**
 * Salon Schedule - Daily schedule view with time slots
 *
 * Features:
 * - View daily schedule
 * - Filter by status, staff, service
 * - Block time slots
 * - Walk-in check-in
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from './components/BookingCard';
import { salonService, SalonBooking, TimeSlot, BlockedSlot } from '@/services/api/salon';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8; // Start at 8 AM
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 32,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.light.background,
    gap: 16,
  },
  dateNavBtn: {
    padding: 8,
  },
  currentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    minWidth: 140,
    textAlign: 'center',
  },
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  filterTextActive: { color: '#fff' },
  timelineContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  timelineHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  slotsColumn: {
    flex: 1,
  },
  slotRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    minHeight: 50,
  },
  blockedSlot: {
    backgroundColor: Colors.light.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  blockedText: {
    fontSize: 11,
    color: Colors.light.warning,
    fontWeight: '600',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 12, paddingBottom: 120 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.text, marginTop: 16 },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  timeSlotPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeSlotBtn: {
    width: 70,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  timeSlotText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#fff',
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
    minHeight: 44,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.light.primary,
  },
  viewToggleBtnInactive: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function SalonScheduleScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<SalonBooking[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState<string>('12:00');
  const [blockEndTime, setBlockEndTime] = useState<string>('13:00');
  const [blockReason, setBlockReason] = useState('');

  const storeId = (user as unknown as { storeId?: string; stores?: Array<{ _id?: string }> })?.storeId ||
    (user as unknown as { stores?: Array<{ _id?: string }> })?.stores?.[0]?._id || '';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const fetchSchedule = useCallback(async () => {
    if (!storeId) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const [bookingsData, blockedData] = await Promise.all([
        salonService.getBookingsByDate(storeId, dateStr, {
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        salonService.getBlockedSlots(storeId, dateStr),
      ]);

      setBookings(bookingsData);
      setBlockedSlots(blockedData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeId, selectedDate, statusFilter]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedule();
  }, [fetchSchedule]);

  const handleDateChange = useCallback((days: number) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  }, []);

  const handleBlockTime = useCallback(async () => {
    if (!storeId || !blockStartTime || !blockEndTime) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      await salonService.blockTimeSlot(storeId, {
        date: dateStr,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason: blockReason || 'Blocked',
      });

      setShowBlockModal(false);
      setBlockReason('');
      fetchSchedule();
    } catch (error) {
      console.error('Error blocking time slot:', error);
    }
  }, [storeId, selectedDate, blockStartTime, blockEndTime, blockReason, fetchSchedule]);

  const handleUnblockSlot = useCallback(async (slotId: string) => {
    try {
      await salonService.unblockTimeSlot(slotId);
      fetchSchedule();
    } catch (error) {
      console.error('Error unblocking slot:', error);
    }
  }, [fetchSchedule]);

  const handleBookingAction = useCallback(async (bookingId: string, action: string) => {
    try {
      switch (action) {
        case 'confirm':
          await salonService.updateBookingStatus(bookingId, 'confirmed');
          break;
        case 'start':
          await salonService.updateBookingStatus(bookingId, 'in_progress');
          break;
        case 'complete':
          await salonService.updateBookingStatus(bookingId, 'completed');
          break;
        case 'cancel':
          await salonService.updateBookingStatus(bookingId, 'cancelled');
          break;
      }
      fetchSchedule();
    } catch (error) {
      console.error(`Error performing ${action} on booking:`, error);
    }
  }, [fetchSchedule]);

  const FILTERS: StatusFilter[] = [
    'all',
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
  ];

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Schedule</ThemedText>
        <TouchableOpacity onPress={() => setShowBlockModal(true)} style={styles.backButton}>
          <Ionicons name="ban-outline" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => handleDateChange(-1)}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
          <ThemedText style={styles.currentDate}>
            {isToday ? `Today, ${formatDate(selectedDate)}` : formatDate(selectedDate)}
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={() => handleDateChange(1)}
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.viewToggleBtn,
            viewMode === 'list' ? styles.viewToggleBtnActive : styles.viewToggleBtnInactive,
          ]}
          onPress={() => setViewMode('list')}
        >
          <ThemedText
            style={[
              styles.viewToggleText,
              { color: viewMode === 'list' ? '#fff' : Colors.light.textSecondary },
            ]}
          >
            List
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleBtn,
            viewMode === 'timeline' ? styles.viewToggleBtnActive : styles.viewToggleBtnInactive,
          ]}
          onPress={() => setViewMode('timeline')}
        >
          <ThemedText
            style={[
              styles.viewToggleText,
              { color: viewMode === 'timeline' ? '#fff' : Colors.light.textSecondary },
            ]}
          >
            Timeline
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              statusFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <ThemedText
              style={[
                styles.filterText,
                statusFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/salon/booking/${item._id}`)}
              onAction={(action) => handleBookingAction(item._id, action)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={Colors.light.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No Bookings</ThemedText>
              <ThemedText style={styles.emptyText}>
                No bookings found for this date and filter.
              </ThemedText>
            </View>
          }
        />
      ) : (
        <ScrollView style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <View style={styles.timeColumn}>
              <ThemedText style={{ fontSize: 11, color: Colors.light.textSecondary }}>Time</ThemedText>
            </View>
            <View style={styles.slotsColumn}>
              <ThemedText style={{ fontSize: 11, color: Colors.light.textSecondary }}>Bookings</ThemedText>
            </View>
          </View>

          {TIME_SLOTS.map((time) => {
            const slotBookings = bookings.filter(
              (b) => b.appointmentTime === time || (b.appointmentTime <= time && b.endTime > time)
            );
            const blockedSlot = blockedSlots.find(
              (s) => s.startTime <= time && s.endTime > time
            );

            return (
              <View key={time} style={styles.slotRow}>
                <View style={styles.timeColumn}>
                  <ThemedText style={styles.timeLabel}>{time}</ThemedText>
                </View>
                <View style={styles.slotsColumn}>
                  {blockedSlot ? (
                    <TouchableOpacity
                      style={styles.blockedSlot}
                      onLongPress={() => handleUnblockSlot(blockedSlot._id)}
                    >
                      <ThemedText style={styles.blockedText}>{blockedSlot.reason}</ThemedText>
                    </TouchableOpacity>
                  ) : slotBookings.length > 0 ? (
                    slotBookings.slice(0, 1).map((booking) => (
                      <BookingCard
                        key={booking._id}
                        booking={booking}
                        onPress={() => router.push(`/salon/booking/${booking._id}`)}
                        onAction={(action) => handleBookingAction(booking._id, action)}
                        compact
                      />
                    ))
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Block Time Modal */}
      <Modal
        visible={showBlockModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBlockModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Block Time Slot</ThemedText>
              <TouchableOpacity onPress={() => setShowBlockModal(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ThemedText style={{ fontSize: 14, color: Colors.light.textSecondary, marginBottom: 8 }}>
              Start Time
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.timeSlotPicker}>
                {TIME_SLOTS.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlotBtn,
                      blockStartTime === time && styles.timeSlotBtnActive,
                    ]}
                    onPress={() => setBlockStartTime(time)}
                  >
                    <ThemedText
                      style={[
                        styles.timeSlotText,
                        blockStartTime === time && styles.timeSlotTextActive,
                      ]}
                    >
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <ThemedText style={{ fontSize: 14, color: Colors.light.textSecondary, marginBottom: 8 }}>
              End Time
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.timeSlotPicker}>
                {TIME_SLOTS.filter((t) => t > blockStartTime).map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlotBtn,
                      blockEndTime === time && styles.timeSlotBtnActive,
                    ]}
                    onPress={() => setBlockEndTime(time)}
                  >
                    <ThemedText
                      style={[
                        styles.timeSlotText,
                        blockEndTime === time && styles.timeSlotTextActive,
                      ]}
                    >
                      {time}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              placeholder="Reason (optional)"
              placeholderTextColor={Colors.light.textSecondary}
              value={blockReason}
              onChangeText={setBlockReason}
              style={styles.reasonInput}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowBlockModal(false)}
              >
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleBlockTime}>
                <ThemedText style={styles.confirmBtnText}>Block Time</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
