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

interface QuotationItem {
  name: string;
  qty: number;
  price: number;
  gstRate: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  customerPhone: string;
  items: QuotationItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  notes?: string;
  createdAt: string;
}

const EMPTY_ITEM: QuotationItem = { name: '', qty: 1, price: 0, gstRate: 18 };

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  sent: '#2563eb',
  accepted: '#16a34a',
  rejected: '#dc2626',
};

export default function QuotationsScreen() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState('30');
  const [formItems, setFormItems] = useState<QuotationItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const fetchQuotations = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const merchantData = await storageService.getMerchantData<unknown>();
      const storeId = merchantData?.activeStoreId || merchantData?.storeId || merchantData?.id;
      const res = await apiClient.get<unknown>(
        `merchant/bizdocs?type=quotation&storeId=${storeId}&limit=50`
      );
      setQuotations(res.data?.docs || res.data || []);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const calcTotals = (items: QuotationItem[]) => {
    let subtotal = 0;
    let gstTotal = 0;
    for (const it of items) {
      const lineAmt = it.qty * it.price;
      subtotal += lineAmt;
      gstTotal += lineAmt * (it.gstRate / 100);
    }
    return { subtotal, gstTotal, grandTotal: subtotal + gstTotal };
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string) => {
    setFormItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      if (field === 'name') item.name = value;
      else if (field === 'qty') item.qty = parseFloat(value) || 0;
      else if (field === 'price') item.price = parseFloat(value) || 0;
      else if (field === 'gstRate') item.gstRate = parseFloat(value) || 0;
      updated[index] = item;
      return updated;
    });
  };

  const createQuotation = async () => {
    if (!custName.trim()) {
      platformAlertSimple('Validation', 'Customer name is required');
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
      const { subtotal, gstTotal, grandTotal } = calcTotals(formItems);
      const validUntil = new Date(
        Date.now() + parseInt(validDays || '30') * 86400000
      ).toISOString();

      await apiClient.post('merchant/bizdocs', {
        type: 'quotation',
        storeId,
        customerName: custName.trim(),
        customerPhone: custPhone.trim(),
        items: formItems,
        subtotal,
        gstTotal,
        grandTotal,
        validUntil,
        notes: notes.trim(),
        status: 'draft',
      });

      setShowCreate(false);
      setCustName('');
      setCustPhone('');
      setNotes('');
      setValidDays('30');
      setFormItems([{ ...EMPTY_ITEM }]);
      fetchQuotations(true);
    } catch (err) {
      platformAlertSimple('Error', 'Failed to create quotation');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: Quotation['status']) => {
    try {
      await apiClient.patch(`merchant/bizdocs/${id}`, { status });
      setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
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
        <Text style={styles.title}>Quotations</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={quotations}
        keyExtractor={(q) => q.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchQuotations(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={56} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Quotations Yet</Text>
            <Text style={styles.emptySub}>Create your first quotation for a customer</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.emptyBtnText}>+ Create Quotation</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardNum}>{item.quotationNumber}</Text>
                <Text style={styles.cardCust}>{item.customerName}</Text>
                {item.customerPhone ? (
                  <Text style={styles.cardPhone}>{item.customerPhone}</Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>
                  ₹{(item.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>
                {item.items?.length || 0} items · Valid till{' '}
                {new Date(item.validUntil).toLocaleDateString('en-IN')}
              </Text>
            </View>
            {item.status === 'draft' || item.status === 'sent' ? (
              <View style={styles.actionRow}>
                {item.status === 'draft' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateStatus(item.id, 'sent')}
                  >
                    <Ionicons name="send-outline" size={14} color="#2563eb" />
                    <Text style={[styles.actionText, { color: '#2563eb' }]}>Mark Sent</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => updateStatus(item.id, 'accepted')}
                >
                  <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                  <Text style={[styles.actionText, { color: '#16a34a' }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => updateStatus(item.id, 'rejected')}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
                  <Text style={[styles.actionText, { color: '#dc2626' }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      />

      {/* Create Modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Quotation</Text>
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
                label="Customer Phone"
                value={custPhone}
                onChange={setCustPhone}
                placeholder="+91 9000000000"
                keyboard="phone-pad"
              />
              <Field
                label="Valid for (days)"
                value={validDays}
                onChange={setValidDays}
                placeholder="30"
                keyboard="number-pad"
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
                    placeholder="₹Price"
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

              {formItems.length > 0 && (
                <View style={styles.totalBox}>
                  {(() => {
                    const { subtotal, gstTotal, grandTotal } = calcTotals(formItems);
                    return (
                      <>
                        <TotalRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
                        <TotalRow label="GST" value={`₹${gstTotal.toFixed(2)}`} />
                        <TotalRow label="Grand Total" value={`₹${grandTotal.toFixed(2)}`} bold />
                      </>
                    );
                  })()}
                </View>
              )}

              <Field
                label="Notes (optional)"
                value={notes}
                onChange={setNotes}
                placeholder="Payment terms, delivery notes..."
                multiline
              />

              <TouchableOpacity style={styles.saveBtn} onPress={createQuotation} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Create Quotation</Text>
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
        style={[styles.fieldInput, multiline && { height: 72, textAlignVertical: 'top' }]}
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

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && { fontWeight: '700', color: '#111' }]}>{label}</Text>
      <Text style={[styles.totalValue, bold && { fontWeight: '700', color: '#4f46e5' }]}>
        {value}
      </Text>
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
  cardTop: { flexDirection: 'row', marginBottom: 8 },
  cardNum: { fontSize: 13, fontWeight: '700', color: '#4f46e5', marginBottom: 2 },
  cardCust: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardPhone: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardAmount: { fontSize: 18, fontWeight: '800', color: '#111' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  cardMeta: { marginBottom: 8 },
  metaText: { fontSize: 12, color: '#9ca3af' },
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
  totalBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 13, color: '#6b7280' },
  totalValue: { fontSize: 13, color: '#374151' },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
