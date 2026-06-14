/**
 * StaffShiftsScreen
 * Weekly view of staff shifts with staff selector and add/edit modal.
 * APIs:
 *   GET  /api/merchant/staff-shifts/:staffId/:weekStart?storeId=
 *   POST /api/merchant/staff-shifts
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { useStore } from '@/contexts/StoreContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

interface ShiftSlot {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
}

interface StaffRota {
  _id?: string;
  staffId: string;
  staffName: string;
  storeId: string;
  weekStartDate: string;
  shifts: ShiftSlot[];
}

interface StaffMember {
  _id: string;
  name: string;
}

type WeeklyRotaData = StaffRota;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the ISO date string (YYYY-MM-DD) for the most recent Monday. */
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Move week start forward or backward by 7 days. */
function shiftWeek(weekStart: string, direction: 1 | -1): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + direction * 7);
  return d.toISOString().split('T')[0];
}

/** Format a week-start date like "31 Mar – 6 Apr 2026". */
function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-IN', opts)} – ${end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
}

// ---------------------------------------------------------------------------
// Add/Edit Shift Modal
// ---------------------------------------------------------------------------

interface ShiftModalProps {
  visible: boolean;
  initialShift: Partial<ShiftSlot>;
  onSave: (slot: ShiftSlot) => void;
  onClose: () => void;
}

function ShiftModal({ visible, initialShift, onSave, onClose }: ShiftModalProps) {
  const [day, setDay] = useState<DayOfWeek>(initialShift.day ?? 'Mon');
  const [startTime, setStartTime] = useState(initialShift.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(initialShift.endTime ?? '17:00');

  useEffect(() => {
    if (visible) {
      setDay(initialShift.day ?? 'Mon');
      setStartTime(initialShift.startTime ?? '09:00');
      setEndTime(initialShift.endTime ?? '17:00');
    }
  }, [visible, initialShift]);

  const handleSave = () => {
    if (!startTime.match(/^\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}$/)) {
      Alert.alert('Invalid time', 'Use HH:MM format, e.g. 09:00');
      return;
    }
    onSave({ day, startTime, endTime });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{initialShift.day ? 'Edit Shift' : 'Add Shift'}</Text>

          {/* Day selector */}
          <Text style={styles.modalLabel}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScrollRow}>
            {DAYS_OF_WEEK.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, day === d && styles.dayChipActive]}
                onPress={() => setDay(d)}
              >
                <Text style={[styles.dayChipText, day === d && styles.dayChipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Times */}
          <View style={styles.modalTimeRow}>
            <View style={styles.modalTimeGroup}>
              <Text style={styles.modalLabel}>Start Time</Text>
              <View style={styles.modalInput}>
                <TextInput
                  style={styles.modalInputText}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <View style={styles.modalTimeGroup}>
              <Text style={styles.modalLabel}>End Time</Text>
              <View style={styles.modalInput}>
                <TextInput
                  style={styles.modalInputText}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="17:00"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onClose}>
              <Text style={styles.modalBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSave}>
              <Text style={styles.modalBtnSaveText}>Save Shift</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function StaffShiftsScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [weekStart, setWeekStart] = useState<string>(getWeekStart());
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [rota, setRota] = useState<StaffRota | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<Partial<ShiftSlot>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const storeId = activeStore?._id || '';

  // Fetch staff list once on mount
  useFocusEffect(
    useCallback(() => {
      fetchStaffList();
    }, [storeId])
  );

  const fetchStaffList = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await apiClient.get<{ members: StaffMember[] }>(
        `/merchant/team?storeId=${storeId}`
      );
      if (res.success && res.data) {
        const members = (res.data as unknown as { members?: StaffMember[] }).members ?? (res.data as unknown as StaffMember[]) ?? [];
        setStaffList(Array.isArray(members) ? members : []);
        if (Array.isArray(members) && members.length > 0 && !selectedStaff) {
          setSelectedStaff(members[0]);
        }
      }
    } catch {
      // staff list is best-effort
    }
  }, [storeId]);

  // Fetch rota whenever staff or week changes
  useEffect(() => {
    if (!selectedStaff || !storeId) return;
    fetchRota();
  }, [selectedStaff, weekStart, storeId]);

  const fetchRota = useCallback(async () => {
    if (!selectedStaff || !storeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<StaffRota>(
        `/merchant/staff-shifts/${selectedStaff._id}/${weekStart}?storeId=${storeId}`
      );
      if (res.success && res.data) {
        setRota(res.data as unknown as WeeklyRotaData);
      } else {
        setRota(null);
      }
    } catch {
      setRota(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStaff, weekStart, storeId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRota();
  }, [fetchRota]);

  const saveRota = useCallback(
    async (updatedShifts: ShiftSlot[]) => {
      if (!selectedStaff || !storeId) return;
      setSaving(true);
      try {
        const payload = {
          storeId,
          staffId: selectedStaff._id,
          staffName: selectedStaff.name,
          weekStartDate: weekStart,
          shifts: updatedShifts,
        };
        const res = await apiClient.post('/merchant/staff-shifts', payload);
        if (res.success) {
          setRota(res.data as unknown as WeeklyRotaData);
        } else {
          showAlert('Error', res.message || 'Failed to save shifts');
        }
      } catch (err) {
        showAlert('Error', err?.message || 'Something went wrong');
      } finally {
        setSaving(false);
      }
    },
    [selectedStaff, storeId, weekStart]
  );

  const handleShiftSave = useCallback(
    (slot: ShiftSlot) => {
      const current = rota?.shifts ?? [];
      let updated: ShiftSlot[];
      if (editingIndex !== null) {
        updated = current.map((s, i) => (i === editingIndex ? slot : s));
      } else {
        updated = [...current, slot];
      }
      setModalVisible(false);
      saveRota(updated);
    },
    [rota, editingIndex, saveRota]
  );

  const handleDeleteShift = useCallback(
    (index: number) => {
      Alert.alert('Delete shift', 'Remove this shift from the rota?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = (rota?.shifts ?? []).filter((_, i) => i !== index);
            saveRota(updated);
          },
        },
      ]);
    },
    [rota, saveRota]
  );

  const currentShifts = rota?.shifts ?? [];

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Shifts</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Week navigator */}
        <View style={styles.weekNav}>
          <TouchableOpacity
            style={styles.weekNavBtn}
            onPress={() => setWeekStart(shiftWeek(weekStart, -1))}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.light.tint} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>{formatWeekRange(weekStart)}</Text>
          <TouchableOpacity
            style={styles.weekNavBtn}
            onPress={() => setWeekStart(shiftWeek(weekStart, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>

        {/* Staff selector */}
        {staffList.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.staffScrollRow}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {staffList.map((s) => (
              <TouchableOpacity
                key={s._id}
                style={[styles.staffChip, selectedStaff?._id === s._id && styles.staffChipActive]}
                onPress={() => setSelectedStaff(s)}
              >
                <Text
                  style={[
                    styles.staffChipText,
                    selectedStaff?._id === s._id && styles.staffChipTextActive,
                  ]}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Shifts grid */}
        {!selectedStaff ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.light.icon} />
            <Text style={styles.emptyTitle}>No staff members found</Text>
            <Text style={styles.emptySubtitle}>Add team members from the Team section first.</Text>
          </View>
        ) : loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
          </View>
        ) : (
          <View style={styles.shiftsSection}>
            <View style={styles.shiftsSectionHeader}>
              <Text style={styles.shiftsSectionTitle}>{selectedStaff.name}'s Shifts</Text>
              {saving && <ActivityIndicator size="small" color={Colors.light.tint} />}
            </View>

            {DAYS_OF_WEEK.map((day) => {
              const dayShifts = currentShifts
                .map((s, i) => ({ ...s, index: i }))
                .filter((s) => s.day === day);

              return (
                <View key={day} style={styles.dayRow}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View style={styles.daySlotsContainer}>
                    {dayShifts.length === 0 ? (
                      <Text style={styles.noShiftText}>Off</Text>
                    ) : (
                      dayShifts.map((s) => (
                        <View key={s.index} style={styles.shiftChip}>
                          <Text style={styles.shiftChipText}>
                            {s.startTime} – {s.endTime}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingShift({
                                day: s.day,
                                startTime: s.startTime,
                                endTime: s.endTime,
                              });
                              setEditingIndex(s.index);
                              setModalVisible(true);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="pencil-outline" size={14} color={Colors.light.tint} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteShift(s.index)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="trash-outline" size={14} color={Colors.light.error} />
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      {selectedStaff && (
        <TouchableOpacity
          style={[styles.fab, { bottom: Math.max(insets.bottom + 12, 24) }]}
          onPress={() => {
            setEditingShift({});
            setEditingIndex(null);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={32} color={Colors.light.card} />
        </TouchableOpacity>
      )}

      {/* Add/Edit Modal */}
      <ShiftModal
        visible={modalVisible}
        initialShift={editingShift}
        onSave={handleShiftSave}
        onClose={() => setModalVisible(false)}
      />
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: Colors.light.card },

  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  weekNavBtn: { padding: 4 },
  weekLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },

  staffScrollRow: { paddingVertical: 12 },
  staffChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  staffChipActive: { borderColor: Colors.light.tint, backgroundColor: `${Colors.light.tint}15` },
  staffChipText: { fontSize: 13, color: Colors.light.icon, fontWeight: '500' },
  staffChipTextActive: { color: Colors.light.tint, fontWeight: '700' },

  shiftsSection: { marginHorizontal: 16, marginTop: 8 },
  shiftsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftsSectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  dayLabel: {
    width: 36,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    paddingTop: 6,
  },
  daySlotsContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noShiftText: { fontSize: 13, color: Colors.light.icon, paddingTop: 6 },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${Colors.light.tint}12`,
    borderWidth: 1,
    borderColor: `${Colors.light.tint}30`,
  },
  shiftChipText: { fontSize: 13, fontWeight: '600', color: Colors.light.tint },

  centerLoader: { paddingVertical: 40, alignItems: 'center' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  emptySubtitle: { fontSize: 13, color: Colors.light.icon, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text, marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.icon, marginBottom: 8 },
  dayScrollRow: { marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
    backgroundColor: Colors.light.card,
  },
  dayChipActive: { borderColor: Colors.light.tint, backgroundColor: `${Colors.light.tint}15` },
  dayChipText: { fontSize: 13, color: Colors.light.icon, fontWeight: '500' },
  dayChipTextActive: { color: Colors.light.tint, fontWeight: '700' },
  modalTimeRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  modalTimeGroup: { flex: 1 },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  modalInputText: { fontSize: 16, color: Colors.light.text },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalBtnCancelText: { color: Colors.light.text, fontWeight: '600', fontSize: 15 },
  modalBtnSave: { backgroundColor: Colors.light.tint },
  modalBtnSaveText: { color: Colors.light.card, fontWeight: '600', fontSize: 15 },
});
