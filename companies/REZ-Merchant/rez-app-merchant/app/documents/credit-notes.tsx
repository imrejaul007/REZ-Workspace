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

type NoteType = 'credit_note' | 'debit_note';

interface NoteItem {
  name: string;
  qty: number;
  price: number;
}

interface CreditDebitNote {
  id: string;
  noteNumber: string;
  type: NoteType;
  customerName: string;
  originalInvoice?: string;
  items: NoteItem[];
  totalAmount: number;
  reason: string;
  status: 'draft' | 'issued';
  createdAt: string;
}

const EMPTY_ITEM: NoteItem = { name: '', qty: 1, price: 0 };

export default function CreditNotesScreen() {
  const [notes, setNotes] = useState<CreditDebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<NoteType>('credit_note');
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<NoteType>('credit_note');

  const [custName, setCustName] = useState('');
  const [originalInvoice, setOriginalInvoice] = useState('');
  const [reason, setReason] = useState('');
  const [formItems, setFormItems] = useState<NoteItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      const [creditRes, debitRes] = await Promise.all([
        apiClient.get<unknown>(`merchant/bizdocs?type=credit_note&storeId=${storeId}&limit=50`),
        apiClient.get<unknown>(`merchant/bizdocs?type=debit_note&storeId=${storeId}&limit=50`),
      ]);
      const all = [
        ...(creditRes.data?.docs || creditRes.data || []).map((n) => ({
          ...n,
          type: 'credit_note',
        })),
        ...(debitRes.data?.docs || debitRes.data || []).map((n) => ({
          ...n,
          type: 'debit_note',
        })),
      ];
      setNotes(all);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const filtered = notes.filter((n) => n.type === activeTab);

  const updateItem = (index: number, field: keyof NoteItem, value: string) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === 'name') item.name = value;
      else if (field === 'qty') item.qty = parseFloat(value) || 0;
      else if (field === 'price') item.price = parseFloat(value) || 0;
      updated[index] = item;
      return updated;
    });
  };

  const totalAmount = formItems.reduce((s, it) => s + it.qty * it.price, 0);

  const openCreate = (type: NoteType) => {
    setCreateType(type);
    setCustName('');
    setOriginalInvoice('');
    setReason('');
    setFormItems([{ ...EMPTY_ITEM }]);
    setShowCreate(true);
  };

  const createNote = async () => {
    if (!custName.trim() || !reason.trim()) {
      platformAlertSimple('Validation', 'Customer name and reason are required');
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
        type: createType,
        storeId,
        customerName: custName.trim(),
        originalInvoice: originalInvoice.trim() || undefined,
        items: formItems,
        totalAmount,
        reason: reason.trim(),
        status: 'draft',
      });
      setShowCreate(false);
      fetchNotes(true);
    } catch {
      platformAlertSimple(
        'Error',
        `Failed to create ${createType === 'credit_note' ? 'credit' : 'debit'} note`
      );
    } finally {
      setSaving(false);
    }
  };

  const issueNote = async (id: string) => {
    try {
      await apiClient.patch(`merchant/bizdocs/${id}`, { status: 'issued' });
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'issued' } : n)));
    } catch {
      platformAlertSimple('Error', 'Failed to issue note');
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
        <Text style={styles.title}>Credit / Debit Notes</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#16a34a' }]}
            onPress={() => openCreate('credit_note')}
          >
            <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: '#dc2626' }]}
            onPress={() => openCreate('debit_note')}
          >
            <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'credit_note' && styles.tabActive]}
          onPress={() => setActiveTab('credit_note')}
        >
          <Text style={[styles.tabText, activeTab === 'credit_note' && { color: '#16a34a' }]}>
            Credit Notes ({notes.filter((n) => n.type === 'credit_note').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'debit_note' && styles.tabActiveDebit]}
          onPress={() => setActiveTab('debit_note')}
        >
          <Text style={[styles.tabText, activeTab === 'debit_note' && { color: '#dc2626' }]}>
            Debit Notes ({notes.filter((n) => n.type === 'debit_note').length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotes(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              No {activeTab === 'credit_note' ? 'Credit' : 'Debit'} Notes
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'credit_note'
                ? 'Issue credit notes for returns, overcharges, or goodwill adjustments'
                : 'Issue debit notes for underbilling or additional charges'}
            </Text>
            <TouchableOpacity
              style={[
                styles.emptyBtn,
                { backgroundColor: activeTab === 'credit_note' ? '#16a34a' : '#dc2626' },
              ]}
              onPress={() => openCreate(activeTab)}
            >
              <Text style={styles.emptyBtnText}>
                + New {activeTab === 'credit_note' ? 'Credit' : 'Debit'} Note
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardNum,
                    { color: item.type === 'credit_note' ? '#16a34a' : '#dc2626' },
                  ]}
                >
                  {item.noteNumber}
                </Text>
                <Text style={styles.cardCust}>{item.customerName}</Text>
                <Text style={styles.cardReason} numberOfLines={1}>
                  {item.reason}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text
                  style={[
                    styles.cardAmount,
                    { color: item.type === 'credit_note' ? '#16a34a' : '#dc2626' },
                  ]}
                >
                  {item.type === 'credit_note' ? '-' : '+'}₹
                  {(item.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'issued' ? '#dcfce7' : '#f3f4f6' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.status === 'issued' ? '#16a34a' : '#6b7280' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
            {item.originalInvoice ? (
              <Text style={styles.metaText}>Ref: {item.originalInvoice}</Text>
            ) : null}
            {item.status === 'draft' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => issueNote(item.id)}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#4f46e5" />
                  <Text style={[styles.actionText, { color: '#4f46e5' }]}>Issue</Text>
                </TouchableOpacity>
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
              <Text style={styles.modalTitle}>
                New {createType === 'credit_note' ? 'Credit' : 'Debit'} Note
              </Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Field
                label="Customer Name *"
                value={custName}
                onChange={setCustName}
                placeholder="e.g. Rahul Sharma"
              />
              <Field
                label="Original Invoice # (optional)"
                value={originalInvoice}
                onChange={setOriginalInvoice}
                placeholder="e.g. INV-2024-0042"
              />
              <Field
                label="Reason *"
                value={reason}
                onChange={setReason}
                placeholder="e.g. Goods returned, defective item..."
                multiline
              />

              <Text style={styles.fieldLabel}>Items</Text>
              {formItems.map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <TextInput
                    style={[styles.itemInput, { flex: 2 }]}
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
                    placeholder="₹"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    value={String(it.price)}
                    onChangeText={(v) => updateItem(idx, 'price', v)}
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

              <View style={styles.totalBox}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { fontWeight: '700', fontSize: 15 }]}>
                    Total {createType === 'credit_note' ? 'Credit' : 'Debit'}
                  </Text>
                  <Text
                    style={[
                      styles.totalValue,
                      {
                        fontWeight: '800',
                        fontSize: 18,
                        color: createType === 'credit_note' ? '#16a34a' : '#dc2626',
                      },
                    ]}
                  >
                    ₹{totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: createType === 'credit_note' ? '#16a34a' : '#dc2626' },
                ]}
                onPress={createNote}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    Create {createType === 'credit_note' ? 'Credit' : 'Debit'} Note
                  </Text>
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
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  addBtn: {
    borderRadius: 20,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#16a34a' },
  tabActiveDebit: { borderBottomWidth: 2, borderBottomColor: '#dc2626' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
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
  cardTop: { flexDirection: 'row', marginBottom: 4 },
  cardNum: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  cardCust: { fontSize: 14, fontWeight: '600', color: '#111' },
  cardReason: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardAmount: { fontSize: 17, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  metaText: { fontSize: 12, color: '#9ca3af', marginBottom: 6 },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  actionText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  emptySub: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
  emptyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
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
  totalBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#6b7280' },
  totalValue: { fontSize: 13, color: '#374151' },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
