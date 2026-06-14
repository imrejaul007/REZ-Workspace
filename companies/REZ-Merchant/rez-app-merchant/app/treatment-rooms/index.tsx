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

interface TreatmentRoom {
  _id: string;
  name: string;
  type: 'treatment_room' | 'chair' | 'station' | 'suite' | 'other';
  capacity: number;
  description?: string;
  active: boolean;
  color: string;
}

const ROOM_TYPES = [
  { value: 'treatment_room', label: 'Room', icon: 'bed-outline' },
  { value: 'chair', label: 'Chair', icon: 'person-outline' },
  { value: 'station', label: 'Station', icon: 'desktop-outline' },
  { value: 'suite', label: 'Suite', icon: 'home-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

const PRESET_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

const typeLabel = (t: string) => ROOM_TYPES.find((r) => r.value === t)?.label ?? t;

export default function TreatmentRoomsScreen() {
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TreatmentRoom | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>('treatment_room');
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRooms = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const merchant = await storageService.getMerchantData<unknown>();
      const sid = merchant?.activeStoreId || merchant?.storeId || merchant?.id || '';
      setStoreId(sid);
      const res = await apiClient.get<unknown>(`treatment-rooms?storeId=${sid}`);
      const data: TreatmentRoom[] = (res as unknown as { data?: TreatmentRoom[] }).data ?? (res as unknown as TreatmentRoom[]) ?? [];
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load rooms' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormType('treatment_room');
    setFormColor(PRESET_COLORS[0]);
    setFormDesc('');
    setShowModal(true);
  };

  const openEdit = (room: TreatmentRoom) => {
    setEditing(room);
    setFormName(room.name);
    setFormType(room.type);
    setFormColor(room.color);
    setFormDesc(room.description || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        storeId,
        name: formName.trim(),
        type: formType,
        color: formColor,
        description: formDesc.trim() || undefined,
      };
      if (editing) {
        await apiClient.put(`treatment-rooms/${editing._id}`, payload);
        Toast.show({ type: 'success', text1: 'Room updated' });
      } else {
        await apiClient.post('treatment-rooms', payload);
        Toast.show({ type: 'success', text1: 'Room created' });
      }
      setShowModal(false);
      fetchRooms();
    } catch (e) {
      Toast.show({ type: 'error', text1: e?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (room: TreatmentRoom) => {
    try {
      await apiClient.put(`treatment-rooms/${room._id}`, { storeId, active: !room.active });
      setRooms((prev) => prev.map((r) => (r._id === room._id ? { ...r, active: !r.active } : r)));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update' });
    }
  };

  const handleDelete = (room: TreatmentRoom) => {
    Alert.alert('Delete Room', `Delete "${room.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`treatment-rooms/${room._id}`);
            setRooms((prev) => prev.filter((r) => r._id !== room._id));
            Toast.show({ type: 'success', text1: 'Room deleted' });
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
        <Text style={styles.title}>Treatment Rooms</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Assign rooms to appointments to prevent double-booking</Text>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchRooms(true)} />
        }
      >
        {loading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : rooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No rooms yet</Text>
            <Text style={styles.emptySubText}>Add treatment rooms, chairs or stations</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Text style={styles.emptyBtnText}>+ Add First Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rooms.map((room) => (
            <TouchableOpacity key={room._id} style={styles.roomCard} onPress={() => openEdit(room)}>
              <View style={[styles.colorDot, { backgroundColor: room.color }]} />
              <View style={styles.roomInfo}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomMeta}>
                  {typeLabel(room.type)} · Cap. {room.capacity}
                </Text>
                {room.description ? (
                  <Text style={styles.roomDesc} numberOfLines={1}>
                    {room.description}
                  </Text>
                ) : null}
              </View>
              <Switch
                value={room.active}
                onValueChange={() => handleToggleActive(room)}
                trackColor={{ true: '#4f46e5' }}
                style={{ marginRight: 8 }}
              />
              <TouchableOpacity onPress={() => handleDelete(room)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Room' : 'Add Room'}</Text>

            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Room 1, Chair A"
            />

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {ROOM_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, formType === t.value && styles.typeChipActive]}
                  onPress={() => setFormType(t.value)}
                >
                  <Text
                    style={[styles.typeChipText, formType === t.value && styles.typeChipTextActive]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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

            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={formDesc}
              onChangeText={setFormDesc}
              placeholder="Notes about this room"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
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
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  colorDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  roomMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  roomDesc: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  typeChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  typeChipText: { fontSize: 13, color: '#374151' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#111' },
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
