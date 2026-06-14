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

interface Commission {
  _id: string;
  staffId: string;
  staffName: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  serviceCategories: string[];
  active: boolean;
}

interface StaffMember {
  _id: string;
  name: string;
  role: string;
}

export default function StaffCommissionsScreen() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Commission | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [commType, setCommType] = useState<'percentage' | 'fixed'>('percentage');
  const [commValue, setCommValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const merchant = await storageService.getMerchantData<unknown>();
      const sid = merchant?.activeStoreId || merchant?.storeId || merchant?.id || '';
      setStoreId(sid);

      const [commRes, staffRes] = await Promise.all([
        apiClient.get<unknown>(`staff-commissions?storeId=${sid}`),
        apiClient.get<unknown>(`merchant/team?storeId=${sid}`),
      ]);

      const commData: Commission[] = (commRes as unknown as { data?: Commission[] }).data ?? (commRes as unknown as Commission[]) ?? [];
      setCommissions(Array.isArray(commData) ? commData : []);

      const staffData: StaffMember[] =
        (staffRes as unknown as { data?: { teamMembers?: StaffMember[] } }).data?.teamMembers ?? (staffRes as unknown as { data?: StaffMember[] }).data ?? (staffRes as unknown as StaffMember[]) ?? [];
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load commissions' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const getCommissionForStaff = (staffId: string) => commissions.find((c) => c.staffId === staffId);

  const openEdit = (member: StaffMember) => {
    const existing = getCommissionForStaff(member._id);
    setEditing(existing || null);
    setSelectedStaffId(member._id);
    setSelectedStaffName(member.name);
    setCommType(existing?.commissionType || 'percentage');
    setCommValue(existing ? String(existing.commissionValue) : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!commValue.trim()) {
      Toast.show({ type: 'error', text1: 'Enter a commission value' });
      return;
    }
    try {
      setSaving(true);
      await apiClient.post('staff-commissions', {
        storeId,
        staffId: selectedStaffId,
        staffName: selectedStaffName,
        commissionType: commType,
        commissionValue: parseFloat(commValue) || 0,
      });
      Toast.show({ type: 'success', text1: 'Commission saved' });
      setShowModal(false);
      fetchData();
    } catch (e) {
      Toast.show({ type: 'error', text1: e?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (commission: Commission) => {
    Alert.alert('Remove Commission', `Remove commission for ${commission.staffName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`staff-commissions/${commission._id}`);
            setCommissions((prev) => prev.filter((c) => c._id !== commission._id));
            Toast.show({ type: 'success', text1: 'Commission removed' });
          } catch {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        },
      },
    ]);
  };

  const formatCommission = (c: Commission) =>
    c.commissionType === 'percentage' ? `${c.commissionValue}%` : `₹${c.commissionValue}`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Staff Commissions</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.subtitle}>Set commission rates per staff member</Text>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />
        }
      >
        {loading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : staff.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No staff members</Text>
            <Text style={styles.emptySubText}>Add staff in Team Management first</Text>
          </View>
        ) : (
          staff.map((member) => {
            const comm = getCommissionForStaff(member._id);
            return (
              <TouchableOpacity
                key={member._id}
                style={styles.staffCard}
                onPress={() => openEdit(member)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{member.name}</Text>
                  <Text style={styles.staffRole}>{member.role}</Text>
                </View>
                {comm ? (
                  <View style={styles.commBadge}>
                    <Text style={styles.commBadgeText}>{formatCommission(comm)}</Text>
                  </View>
                ) : (
                  <Text style={styles.noComm}>Not set</Text>
                )}
                {comm && (
                  <TouchableOpacity onPress={() => handleDelete(comm)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Commission for {selectedStaffName}</Text>

            <Text style={styles.fieldLabel}>Commission Type</Text>
            <View style={styles.typeRow}>
              {(['percentage', 'fixed'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, commType === t && styles.typeChipActive]}
                  onPress={() => setCommType(t)}
                >
                  <Text style={[styles.typeChipText, commType === t && styles.typeChipTextActive]}>
                    {t === 'percentage' ? '% of service' : '₹ flat per service'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Value {commType === 'percentage' ? '(%)' : '(₹)'}</Text>
            <TextInput
              style={styles.input}
              value={commValue}
              onChangeText={setCommValue}
              keyboardType="numeric"
              placeholder={commType === 'percentage' ? 'e.g. 15' : 'e.g. 50'}
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
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary ?? '#6b7280',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  staffRole: { fontSize: 12, color: '#6b7280', marginTop: 2, textTransform: 'capitalize' },
  commBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  commBadgeText: { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
  noComm: { fontSize: 12, color: '#9ca3af', marginRight: 12 },
  deleteBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  emptySubText: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
    marginTop: 12,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  typeChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  typeChipText: { fontSize: 13, color: '#374151' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
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
