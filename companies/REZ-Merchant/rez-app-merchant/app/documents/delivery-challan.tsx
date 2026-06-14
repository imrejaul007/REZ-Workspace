import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { storageService } from '@/services/storage';
import { platformAlertSimple } from '@/utils/platformAlert';

interface ChallanItem {
  name: string;
  qty: number;
  unit: string;
}

interface DeliveryChallan {
  id: string;
  challanNumber: string;
  customerName: string;
  toAddress: string;
  items: ChallanItem[];
  status: 'draft' | 'dispatched' | 'delivered';
  dispatchDate?: string;
  vehicleNumber?: string;
  notes?: string;
  createdAt: string;
}

const EMPTY_ITEM: ChallanItem = { name: '', qty: 1, unit: 'pcs' };

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  dispatched: '#2563eb',
  delivered: '#16a34a',
};

export default function DeliveryChallanScreen() {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [custName, setCustName] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [notes, setNotes] = useState('');
  const [formItems, setFormItems] = useState<ChallanItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const fetchChallans = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      const res = await apiClient.get<unknown>(
        `merchant/bizdocs?type=delivery_challan&storeId=${storeId}&limit=50`
      );
      setChallans(res.data?.docs || res.data || []);
    } catch {
      setChallans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  const updateItem = (index: number, field: keyof ChallanItem, value: string) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === 'name') item.name = value;
      else if (field === 'qty') item.qty = parseFloat(value) || 0;
      else if (field === 'unit') item.unit = value;
      updated[index] = item;
      return updated;
    });
  };

  const createChallan = async () => {
    if (!custName.trim() || !toAddress.trim()) {
      platformAlertSimple('Validation', 'Customer name and delivery address are required');
      return;
    }
    if (formItems.some((it) => !it.name.trim())) {
      platformAlertSimple('Validation', 'All items need a name');
      return;
    }
    try {
      setSaving(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      await apiClient.post('merchant/bizdocs', {
        type: 'delivery_challan',
        storeId,
        customerName: custName.trim(),
        toAddress: toAddress.trim(),
        vehicleNumber: vehicleNo.trim(),
        items: formItems,
        notes: notes.trim(),
        status: 'draft',
      });
      setShowCreate(false);
      setCustName('');
      setToAddress('');
      setVehicleNo('');
      setNotes('');
      setFormItems([{ ...EMPTY_ITEM }]);
      fetchChallans(true);
    } catch {
      platformAlertSimple('Error', 'Failed to create delivery challan');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: DeliveryChallan['status']) => {
    try {
      await apiClient.patch(`merchant/bizdocs/${id}`, {
        status,
        ...(status === 'dispatched' ? { dispatchDate: new Date().toISOString() } : {}),
      });
      setChallans((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch {
      platformAlertSimple('Error', 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Challans</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={challans}
        keyExtractor={(c) => c.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchChallans(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Challans Yet</Text>
            <Text style={styles.emptySub}>Create a delivery challan for dispatching goods</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>+ Create Challan</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardNum}>{item.challanNumber}</Text>
                <Text style={styles.cardCust}>{item.customerName}</Text>
                <Text style={styles.cardAddr} numberOfLines={1}>
                  {item.toAddress}
                </Text>
              </View>
              <View
                style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}
              >
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.metaText}>
              {item.items?.length || 0} items
              {item.vehicleNumber ? ` · Vehicle: ${item.vehicleNumber}` : ''}
              {item.dispatchDate
                ? ` · Dispatched: ${new Date(item.dispatchDate).toLocaleDateString('en-IN')}`
                : ''}
            </Text>
            {item.status !== 'delivered' && (
              <View style={styles.actionRow}>
                {item.status === 'draft' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateStatus(item.id, 'dispatched')}
                  >
                    <Ionicons name="send-outline" size={14} color="#2563eb" />
                    <Text style={[styles.actionText, { color: '#2563eb' }]}>Dispatch</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'dispatched' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateStatus(item.id, 'delivered')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                    <Text style={[styles.actionText, { color: '#16a34a' }]}>Mark Delivered</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      />

      <Modal
        visible={showCreate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Delivery Challan</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field
                label="Customer Name *"
                value={custName}
                onChange={setCustName}
                placeholder="e.g. ABC Traders"
              />
              <Field
                label="Delivery Address *"
                value={toAddress}
                onChange={setToAddress}
                placeholder="Full delivery address"
                multiline
              />
              <Field
                label="Vehicle Number"
                value={vehicleNo}
                onChange={setVehicleNo}
                placeholder="e.g. MH 01 AB 1234"
              />

              <Text style={styles.fieldLabel}>Items</Text>
              {formItems.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <TextInput
                    style={[styles.itemInput, { flex: 3 }]}
                    placeholder="Item name"
                    placeholderTextColor="#9ca3af"
                    value={it.name}
                    onChangeText={(v) => updateItem(idx, 'name', v)}
                  />
                  <TextInput
                    style={styles.itemInput}
                    placeholder="Qty"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={String(it.qty)}
                    onChangeText={(v) => updateItem(idx, 'qty', v)}
                  />
                  <TextInput
                    style={styles.itemInput}
                    placeholder="Unit"
                    placeholderTextColor="#9ca3af"
                    value={it.unit}
                    onChangeText={(v) => updateItem(idx, 'unit', v)}
                  />
                  <TouchableOpacity
                    onPress={() => setFormItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => setFormItems((prev) => [...prev, { ...EMPTY_ITEM }])}
              >
                <Ionicons name="add-circle-outline" size={16} color="#4f46e5" />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>

              <Field
                label="Notes (optional)"
                value={notes}
                onChange={setNotes}
                placeholder="Special instructions..."
                multiline
              />

              <TouchableOpacity style={styles.saveBtn} onPress={createChallan} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Create Challan</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 64, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboard}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  addBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', marginBottom: 6, gap: 8 },
  cardNum: { fontSize: 12, fontWeight: '700', color: '#4f46e5', marginBottom: 2 },
  cardCust: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardAddr: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaText: { fontSize: 12, color: '#9ca3af', marginBottom: 8 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af' },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  itemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 12,
  },
  addItemText: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
