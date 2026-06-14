import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
}

interface Bundle {
  _id: string;
  name: string;
  items: BundleItem[];
  comboPrice: number;
  originalTotal: number;
  savings: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
}

export default function BundlesScreen() {
  const { activeStore } = useStore();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editBundle, setEditBundle] = useState<Bundle | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [items, setItems] = useState<BundleItem[]>([
    { productId: '', productName: '', quantity: 1, basePrice: 0 },
    { productId: '', productName: '', quantity: 1, basePrice: 0 },
  ]);

  const loadBundles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Bundle[]>(
        `merchant/bundles${activeStore?._id ? `?storeId=${activeStore._id}` : ''}`
      );
      if (res.success && res.data) setBundles(res.data);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }, [activeStore?._id]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const resetForm = () => {
    setName('');
    setComboPrice('');
    setItems([
      { productId: '', productName: '', quantity: 1, basePrice: 0 },
      { productId: '', productName: '', quantity: 1, basePrice: 0 },
    ]);
    setEditBundle(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (b: Bundle) => {
    setEditBundle(b);
    setName(b.name);
    setComboPrice(String(b.comboPrice));
    setItems(
      b.items.length >= 2
        ? b.items
        : [...b.items, { productId: '', productName: '', quantity: 1, basePrice: 0 }]
    );
    setShowModal(true);
  };

  const addItem = () =>
    setItems((prev) => [...prev, { productId: '', productName: '', quantity: 1, basePrice: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof BundleItem, value) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === idx
          ? {
              ...it,
              [field]: field === 'quantity' || field === 'basePrice' ? Number(value) || 0 : value,
            }
          : it
      )
    );
  };

  const originalTotal = items.reduce((s, i) => s + i.basePrice * i.quantity, 0);
  const savings = originalTotal - (parseFloat(comboPrice) || 0);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Bundle name is required');
    if (!comboPrice || parseFloat(comboPrice) <= 0)
      return Alert.alert('Error', 'Combo price must be > 0');
    const validItems = items.filter((i) => i.productName.trim() && i.basePrice > 0);
    if (validItems.length < 2)
      return Alert.alert('Error', 'At least 2 items with names and prices are required');
    if (parseFloat(comboPrice) >= originalTotal)
      return Alert.alert('Error', 'Combo price must be less than the sum of individual prices');

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        items: validItems,
        comboPrice: parseFloat(comboPrice),
        storeId: activeStore?._id,
      };
      if (editBundle) {
        await apiClient.put(`merchant/bundles/${editBundle._id}`, payload);
      } else {
        await apiClient.post('merchant/bundles', payload);
      }
      setShowModal(false);
      resetForm();
      loadBundles();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  const toggleBundle = async (bundle: Bundle) => {
    try {
      await apiClient.patch(`merchant/bundles/${bundle._id}/toggle`, {});
      setBundles((prev) =>
        prev.map((b) => (b._id === bundle._id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch {
      Alert.alert('Error', 'Failed to toggle bundle');
    }
  };

  const deleteBundle = (bundle: Bundle) => {
    Alert.alert('Delete Bundle', `Delete "${bundle.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`merchant/bundles/${bundle._id}`);
            setBundles((prev) => prev.filter((b) => b._id !== bundle._id));
          } catch {
            Alert.alert('Error', 'Failed to delete bundle');
          }
        },
      },
    ]);
  };

  const renderBundle = ({ item }: { item: Bundle }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bundleName}>{item.name}</Text>
          <Text style={styles.itemCount}>{item.items.length} items</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.comboPrice}>₹{item.comboPrice}</Text>
          <Text style={styles.originalPrice}>₹{item.originalTotal}</Text>
        </View>
      </View>
      <View style={styles.savingsBadge}>
        <Ionicons name="pricetag" size={12} color="#059669" />
        <Text style={styles.savingsText}>Save ₹{item.savings.toFixed(2)}</Text>
      </View>
      <View style={styles.itemList}>
        {item.items.map((it, idx) => (
          <Text key={idx} style={styles.itemRow}>
            • {it.productName} ×{it.quantity} — ₹{it.basePrice}
          </Text>
        ))}
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Ionicons name="pencil" size={16} color="#7C3AED" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleBundle(item)}>
          <Ionicons
            name={item.isActive ? 'eye-off' : 'eye'}
            size={16}
            color={item.isActive ? '#d97706' : '#059669'}
          />
          <Text style={[styles.actionBtnText, { color: item.isActive ? '#d97706' : '#059669' }]}>
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => deleteBundle(item)}>
          <Ionicons name="trash" size={16} color="#ef4444" />
          <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Combo Bundles</Text>
        <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createBtnText}>New Bundle</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={Colors.light.primary} />
      ) : (
        <FlatList
          data={bundles}
          keyExtractor={(b) => b._id}
          renderItem={renderBundle}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No bundles yet</Text>
              <Text style={styles.emptyText}>
                Create combo deals to increase average order value
              </Text>
              <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
                <Text style={styles.createBtnText}>Create First Bundle</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editBundle ? 'Edit Bundle' : 'Create Bundle'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#7C3AED" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View>
              <Text style={styles.label}>Bundle Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Hair + Beard Combo"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View>
              <Text style={styles.label}>Items *</Text>
              {items.map((item, idx) => (
                <View key={idx} style={styles.itemRow2}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    value={item.productName}
                    onChangeText={(v) => updateItem(idx, 'productName', v)}
                    placeholder="Item name"
                    placeholderTextColor="#9ca3af"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={item.basePrice ? String(item.basePrice) : ''}
                    onChangeText={(v) => updateItem(idx, 'basePrice', v)}
                    placeholder="₹ Price"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={[styles.input, { width: 50 }]}
                    value={String(item.quantity)}
                    onChangeText={(v) => updateItem(idx, 'quantity', v)}
                    placeholder="Qty"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                  />
                  {items.length > 2 && (
                    <TouchableOpacity onPress={() => removeItem(idx)}>
                      <Ionicons name="remove-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                <Ionicons name="add-circle-outline" size={18} color="#7C3AED" />
                <Text style={{ color: '#7C3AED', fontWeight: '600' }}>Add item</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.priceSummary}>
              <Text style={styles.label}>
                Original total: <Text style={styles.bold}>₹{originalTotal.toFixed(2)}</Text>
              </Text>
              <View>
                <Text style={styles.label}>Bundle price *</Text>
                <TextInput
                  style={styles.input}
                  value={comboPrice}
                  onChangeText={setComboPrice}
                  placeholder="Set a discounted price"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
              </View>
              {savings > 0 && (
                <View style={styles.savingsBadge}>
                  <Ionicons name="pricetag" size={14} color="#059669" />
                  <Text style={[styles.savingsText, { fontSize: 14 }]}>
                    Customer saves ₹{savings.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  createBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bundleName: { fontSize: 16, fontWeight: '700', color: '#111' },
  itemCount: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  priceBlock: { alignItems: 'flex-end' },
  comboPrice: { fontSize: 18, fontWeight: '800', color: '#7C3AED' },
  originalPrice: { fontSize: 13, color: '#9ca3af', textDecorationLine: 'line-through' },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  savingsText: { color: '#059669', fontWeight: '600', fontSize: 12 },
  itemList: { gap: 3, marginBottom: 10 },
  itemRow: { fontSize: 13, color: '#374151' },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', maxWidth: 280 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  saveText: { fontSize: 16, fontWeight: '700', color: '#7C3AED' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  bold: { fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  itemRow2: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  priceSummary: { gap: 10 },
});
