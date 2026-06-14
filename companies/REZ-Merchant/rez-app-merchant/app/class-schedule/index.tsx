import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';

interface ClassSchedule {
  _id: string;
  name: string;
  description?: string;
  instructorName?: string;
  duration: number;
  capacity: number;
  price: number;
  startTime: string;
  endTime: string;
  recurring: boolean;
  recurringDays?: number[];
  color: string;
  active: boolean;
  bookedCount: number;
}

const PRESET_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function ClassScheduleScreen() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassSchedule | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formCapacity, setFormCapacity] = useState('10');
  const [formPrice, setFormPrice] = useState('0');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formRecurring, setFormRecurring] = useState(false);
  const [formRecurringDays, setFormRecurringDays] = useState<number[]>([]);

  const fetchClasses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const merchant = await storageService.getMerchantData<unknown>();
      const sid = merchant?.activeStoreId || merchant?.storeId || merchant?.id || '';
      setStoreId(sid);
      const res = await apiClient.get<unknown>(`class-schedules?storeId=${sid}`);
      const data: ClassSchedule[] = (res as unknown as { data?: ClassSchedule[] }).data ?? (res as unknown as ClassSchedule[]) ?? [];
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load classes' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
    }, [fetchClasses])
  );

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormInstructor('');
    setFormDuration('60');
    setFormCapacity('10');
    setFormPrice('0');
    setFormStartTime('');
    setFormEndTime('');
    setFormColor(PRESET_COLORS[0]);
    setFormRecurring(false);
    setFormRecurringDays([]);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (cls: ClassSchedule) => {
    setEditing(cls);
    setFormName(cls.name);
    setFormDesc(cls.description || '');
    setFormInstructor(cls.instructorName || '');
    setFormDuration(String(cls.duration));
    setFormCapacity(String(cls.capacity));
    setFormPrice(String(cls.price));
    setFormStartTime(cls.startTime ? new Date(cls.startTime).toISOString().slice(0, 16) : '');
    setFormEndTime(cls.endTime ? new Date(cls.endTime).toISOString().slice(0, 16) : '');
    setFormColor(cls.color);
    setFormRecurring(cls.recurring);
    setFormRecurringDays(cls.recurringDays ?? []);
    setShowModal(true);
  };

  const toggleRecurringDay = (day: number) => {
    setFormRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }
    if (!formStartTime || !formEndTime) {
      Toast.show({ type: 'error', text1: 'Start and end time are required' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        storeId,
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        instructorName: formInstructor.trim() || undefined,
        duration: Number(formDuration) || 60,
        capacity: Number(formCapacity) || 10,
        price: Number(formPrice) || 0,
        startTime: new Date(formStartTime).toISOString(),
        endTime: new Date(formEndTime).toISOString(),
        color: formColor,
        recurring: formRecurring,
        recurringDays: formRecurring ? formRecurringDays : undefined,
      };
      if (editing) {
        await apiClient.put(`class-schedules/${editing._id}`, payload);
        Toast.show({ type: 'success', text1: 'Class updated' });
      } else {
        await apiClient.post('class-schedules', payload);
        Toast.show({ type: 'success', text1: 'Class created' });
      }
      setShowModal(false);
      fetchClasses();
    } catch (e) {
      Toast.show({ type: 'error', text1: e?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cls: ClassSchedule) => {
    try {
      await apiClient.put(`class-schedules/${cls._id}`, { storeId, active: !cls.active });
      setClasses((prev) => prev.map((c) => (c._id === cls._id ? { ...c, active: !c.active } : c)));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update' });
    }
  };

  const handleDelete = (cls: ClassSchedule) => {
    Alert.alert('Delete Class', `Delete "${cls.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`class-schedules/${cls._id}`);
            setClasses((prev) => prev.filter((c) => c._id !== cls._id));
            Toast.show({ type: 'success', text1: 'Class deleted' });
          } catch {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Class Scheduling</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Manage group classes with seat capacity</Text>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchClasses(true)} />
        }
      >
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : classes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-number-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No classes yet</Text>
            <Text style={styles.emptySubText}>Add yoga, pilates or fitness classes</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Text style={styles.emptyBtnText}>+ Add First Class</Text>
            </TouchableOpacity>
          </View>
        ) : (
          classes.map((cls) => (
            <TouchableOpacity key={cls._id} style={styles.classCard} onPress={() => openEdit(cls)}>
              <View style={[styles.colorDot, { backgroundColor: cls.color }]} />
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                {cls.instructorName ? (
                  <Text style={styles.classMeta}>by {cls.instructorName}</Text>
                ) : null}
                <Text style={styles.classMeta}>{formatDateTime(cls.startTime)}</Text>
                <Text style={styles.classMeta}>
                  {cls.duration} min · {cls.bookedCount}/{cls.capacity} booked · ₹{cls.price}
                </Text>
              </View>
              <Switch
                value={cls.active}
                onValueChange={() => handleToggleActive(cls)}
                trackColor={{ true: '#4f46e5' }}
                style={{ marginRight: 8 }}
              />
              <TouchableOpacity onPress={() => handleDelete(cls)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Class' : 'Add Class'}</Text>

              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Morning Yoga, HIIT Bootcamp"
              />

              <Text style={styles.fieldLabel}>Description (optional)</Text>
              <TextInput
                style={styles.input}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Brief description of the class"
              />

              <Text style={styles.fieldLabel}>Instructor Name (optional)</Text>
              <TextInput
                style={styles.input}
                value={formInstructor}
                onChangeText={setFormInstructor}
                placeholder="e.g. Priya Sharma"
              />

              <View style={styles.rowFields}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Duration (mins) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formDuration}
                    onChangeText={setFormDuration}
                    keyboardType="numeric"
                    placeholder="60"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Capacity *</Text>
                  <TextInput
                    style={styles.input}
                    value={formCapacity}
                    onChangeText={setFormCapacity}
                    keyboardType="numeric"
                    placeholder="10"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={formPrice}
                onChangeText={setFormPrice}
                keyboardType="numeric"
                placeholder="0"
              />

              <Text style={styles.fieldLabel}>Start Time * (YYYY-MM-DDTHH:MM)</Text>
              <TextInput
                style={styles.input}
                value={formStartTime}
                onChangeText={setFormStartTime}
                placeholder="2025-01-15T09:00"
              />

              <Text style={styles.fieldLabel}>End Time * (YYYY-MM-DDTHH:MM)</Text>
              <TextInput
                style={styles.input}
                value={formEndTime}
                onChangeText={setFormEndTime}
                placeholder="2025-01-15T10:00"
              />

              <Text style={styles.fieldLabel}>Color</Text>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      formColor === c && styles.colorSwatchSelected,
                    ]}
                    onPress={() => setFormColor(c)}
                  />
                ))}
              </View>

              <View style={styles.recurringRow}>
                <Text style={styles.fieldLabel}>Recurring</Text>
                <Switch
                  value={formRecurring}
                  onValueChange={setFormRecurring}
                  trackColor={{ true: '#4f46e5' }}
                />
              </View>

              {formRecurring ? (
                <>
                  <Text style={styles.fieldLabel}>Repeat on Days</Text>
                  <View style={styles.daysRow}>
                    {DAY_LABELS.map((label, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.dayChip,
                          formRecurringDays.includes(idx) && styles.dayChipActive,
                        ]}
                        onPress={() => toggleRecurringDay(idx)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            formRecurringDays.includes(idx) && styles.dayChipTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.light.text },
  addBtn: { padding: 4 },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary ?? '#6b7280',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  classMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  deleteBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  emptyBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  rowFields: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#111' },
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dayChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  dayChipText: { fontSize: 12, color: '#374151' },
  dayChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
