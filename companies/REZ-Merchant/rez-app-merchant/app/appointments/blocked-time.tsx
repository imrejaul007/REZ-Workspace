import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Switch,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

interface BlockedSlot {
  _id: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  isAllDay: boolean;
  staffId?: string;
  recurring?: boolean;
  recurringDays?: number[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function fmtDateDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BlockedTimeScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id || '';

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [slots, setSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add block form state
  const [formDate, setFormDate] = useState(todayStr());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<BlockedSlot[]>(
        `/blocked-slots/store/${storeId}?date=${selectedDate}`
      );
      setSlots(res.data ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const openModal = () => {
    setFormDate(selectedDate);
    setStartTime('09:00');
    setEndTime('17:00');
    setReason('');
    setIsAllDay(false);
    setRecurring(false);
    setRecurringDays([]);
    setShowModal(true);
  };

  const toggleDay = (day: number) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (!isAllDay && (!startTime || !endTime)) {
      Toast.show({ type: 'error', text1: 'Start and end time are required' });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/blocked-slots', {
        storeId,
        date: formDate,
        startTime: isAllDay ? '00:00' : startTime,
        endTime: isAllDay ? '23:59' : endTime,
        reason: reason.trim() || undefined,
        isAllDay,
        recurring,
        recurringDays: recurring ? recurringDays : undefined,
      });
      Toast.show({ type: 'success', text1: 'Block added' });
      setShowModal(false);
      if (formDate === selectedDate) fetchSlots();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to add block' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    setDeletingId(slotId);
    try {
      await apiClient.delete(`/blocked-slots/${slotId}`);
      setSlots((prev) => prev.filter((s) => s._id !== slotId));
      Toast.show({ type: 'success', text1: 'Block removed' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to remove block' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderSlot = ({ item }: { item: BlockedSlot }) => (
    <View style={styles.slotCard}>
      <View style={styles.slotBand} />
      <View style={styles.slotContent}>
        <View style={styles.slotHeader}>
          <View style={styles.slotTimeRow}>
            <Ionicons name="ban-outline" size={15} color="#6B7280" />
            <ThemedText style={styles.slotTime}>
              {item.isAllDay ? 'All Day' : `${item.startTime} – ${item.endTime}`}
            </ThemedText>
            {item.recurring && (
              <View style={styles.recurringBadge}>
                <ThemedText style={styles.recurringText}>Weekly</ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item._id)}
            disabled={deletingId === item._id}
            style={styles.deleteBtn}
          >
            {deletingId === item._id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
        {item.reason ? <ThemedText style={styles.slotReason}>{item.reason}</ThemedText> : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Manage Blocked Time</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      {/* Date picker row */}
      <View style={styles.datePicker}>
        <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.light.textSecondary}
        />
        <ThemedText style={styles.dateLabel}>{fmtDateDisplay(selectedDate)}</ThemedText>
      </View>

      {/* Slots list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item._id}
          renderItem={renderSlot}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="checkmark-circle-outline"
                size={52}
                color={Colors.light.textSecondary}
              />
              <ThemedText style={styles.emptyTitle}>No blocks for this date</ThemedText>
              <ThemedText style={styles.emptyText}>
                Tap the + button to block out time for breaks, holidays, or maintenance.
              </ThemedText>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Block Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add Blocked Time</ThemedText>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {/* Date */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Date</ThemedText>
              <TextInput
                style={styles.textInput}
                value={formDate}
                onChangeText={setFormDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* All Day toggle */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.fieldLabel}>All Day</ThemedText>
                <ThemedText style={styles.fieldHint}>Block the entire day</ThemedText>
              </View>
              <Switch
                value={isAllDay}
                onValueChange={setIsAllDay}
                trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Time range (only when not all day) */}
            {!isAllDay && (
              <View style={styles.timeRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <ThemedText style={styles.fieldLabel}>Start Time</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.timeSep}>
                  <ThemedText style={styles.timeSepText}>–</ThemedText>
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <ThemedText style={styles.fieldLabel}>End Time</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="17:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            {/* Reason */}
            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Reason (optional)</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Lunch break, Holiday, Staff training"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Recurring toggle */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.fieldLabel}>Recurring</ThemedText>
                <ThemedText style={styles.fieldHint}>Repeat weekly on selected days</ThemedText>
              </View>
              <Switch
                value={recurring}
                onValueChange={setRecurring}
                trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
                thumbColor="#fff"
              />
            </View>

            {recurring && (
              <View style={styles.daysRow}>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, recurringDays.includes(idx) && styles.dayChipActive]}
                    onPress={() => toggleDay(idx)}
                  >
                    <ThemedText
                      style={[
                        styles.dayChipText,
                        recurringDays.includes(idx) && styles.dayChipTextActive,
                      ]}
                    >
                      {day}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.saveBtnText}>Add Block</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dateInput: {
    flex: 0,
    width: 120,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
    padding: 0,
  },
  dateLabel: { fontSize: 13, color: Colors.light.textSecondary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  emptyText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  slotBand: { width: 4, backgroundColor: '#9CA3AF' },
  slotContent: { flex: 1, padding: 12 },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTime: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  recurringBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recurringText: { fontSize: 11, color: '#7C3AED', fontWeight: '600' },
  slotReason: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalScroll: { flex: 1, paddingHorizontal: 20 },
  fieldGroup: { marginTop: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldHint: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 16 },
  timeSep: { paddingBottom: 12 },
  timeSepText: { fontSize: 18, color: '#9CA3AF' },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  dayChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  dayChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  dayChipTextActive: { color: '#fff' },
  modalFooter: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 8 : 20 },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
