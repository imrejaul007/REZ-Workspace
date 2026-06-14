import React, { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/api/client';
import { catalogService } from '@/services/api/catalogService';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  category?: string;
}

type StockFilter = 'all' | 'low' | 'out';

export default function InventoryScreen() {
  const { token } = useAuth();
  const { activeStore } = useStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filtered, setFiltered] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      // Get merchant ID
      const merchantId = activeStore?.merchantId || token?.merchantId || '';

      // Try catalog service first (real-time inventory)
      let products: unknown[] = [];
      try {
        const catalogResponse = await catalogService.getProducts(merchantId, { limit: 200 });
        products = catalogResponse.products || [];
      } catch (catalogError) {
        logger.warn('Catalog service unavailable, falling back to merchant service:', catalogError);
        // Fallback to merchant service
        const response = await apiClient.get<unknown>(
          'merchant/products?limit=200&sortBy=name&includeInventory=true'
        );
        products = response.data?.products || response.data || [];
      }

      const inventoryItems: InventoryItem[] = products.map((p) => ({
        id: p._id || p.id,
        name: p.name,
        sku: p.sku || p.inventory?.sku,
        stock: p.inventory?.stock ?? p.stock ?? 0,
        lowStockThreshold: p.inventory?.lowStockThreshold ?? 10,
        isAvailable: p.inventory?.isAvailable ?? p.isAvailable ?? true,
        category: p.category,
      }));

      setItems(inventoryItems);
    } catch (err) {
      logger.error('Inventory fetch error:', err);
      platformAlertSimple('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStore, token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    let result = items;
    if (stockFilter === 'low') {
      result = result.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold);
    } else if (stockFilter === 'out') {
      result = result.filter((i) => i.stock === 0);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [items, stockFilter, searchQuery]);

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditStock(String(item.stock));
    setEditThreshold(String(item.lowStockThreshold));
  };

  const saveEdit = async () => {
    if (!editItem) return;
    const newStock = parseInt(editStock, 10);
    const newThreshold = parseInt(editThreshold, 10);
    if (isNaN(newStock) || newStock < 0) {
      platformAlertSimple('Invalid', 'Stock must be a non-negative number');
      return;
    }
    try {
      setSaving(true);

      // Get merchant ID
      const merchantId = activeStore?.merchantId || token?.merchantId || '';

      // Update catalog service (real-time inventory)
      try {
        await catalogService.updateInventory(editItem.id, {
          stock: newStock,
          lowStockThreshold: isNaN(newThreshold) ? editItem.lowStockThreshold : newThreshold,
          isAvailable: newStock > 0,
        }, merchantId);
      } catch (catalogError) {
        logger.warn('Catalog inventory update failed, updating merchant service only:', catalogError);
      }

      // Update merchant service (primary)
      await apiClient.put(`merchant/products/${editItem.id}`, {
        inventory: {
          stock: newStock,
          lowStockThreshold: isNaN(newThreshold) ? editItem.lowStockThreshold : newThreshold,
          isAvailable: newStock > 0,
        },
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === editItem.id
            ? {
                ...i,
                stock: newStock,
                lowStockThreshold: isNaN(newThreshold) ? i.lowStockThreshold : newThreshold,
                isAvailable: newStock > 0,
              }
            : i
        )
      );
      setEditItem(null);
    } catch (err) {
      platformAlertSimple('Error', 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const lowCount = items.filter((i) => i.stock > 0 && i.stock <= i.lowStockThreshold).length;
  const outCount = items.filter((i) => i.stock === 0).length;

  const getStockColor = (item: InventoryItem): string => {
    if (item.stock === 0) return '#ef4444';
    if (item.stock <= item.lowStockThreshold) return '#f59e0b';
    return '#16a34a';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity onPress={() => fetchInventory(true)}>
          <Ionicons name="refresh-outline" size={22} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Alert Banner */}
      {(lowCount > 0 || outCount > 0) && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning-outline" size={16} color="#92400e" />
          <Text style={styles.alertText}>
            {outCount > 0 ? `${outCount} out of stock · ` : ''}
            {lowCount > 0 ? `${lowCount} low stock` : ''}
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/products/bulk-upload')}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#4f46e5" />
          <Text style={styles.quickActionText}>Bulk Upload</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => router.push('/products/stock-alerts')}
        >
          <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
          <Text style={styles.quickActionText}>Stock Alerts</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'low', 'out'] as StockFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, stockFilter === f && styles.filterChipActive]}
            onPress={() => setStockFilter(f)}
          >
            <Text style={[styles.filterChipText, stockFilter === f && styles.filterChipTextActive]}>
              {f === 'all'
                ? `All (${items.length})`
                : f === 'low'
                  ? `Low (${lowCount})`
                  : `Out (${outCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or SKU..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchInventory(true)} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.sku ? <Text style={styles.itemSku}>SKU: {item.sku}</Text> : null}
              {item.category ? <Text style={styles.itemCategory}>{item.category}</Text> : null}
            </View>
            <View style={styles.itemRight}>
              <View style={[styles.stockBadge, { backgroundColor: getStockColor(item) + '20' }]}>
                <Text style={[styles.stockValue, { color: getStockColor(item) }]}>
                  {item.stock}
                </Text>
                <Text style={[styles.stockLabel, { color: getStockColor(item) }]}>
                  {item.stock === 0
                    ? 'Out'
                    : item.stock <= item.lowStockThreshold
                      ? 'Low'
                      : 'units'}
                </Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Ionicons name="create-outline" size={18} color="#4f46e5" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal
        visible={!!editItem}
        transparent
        animationType="slide"
        onRequestClose={() => setEditItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Stock</Text>
              <TouchableOpacity onPress={() => setEditItem(null)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalProductName} numberOfLines={1}>
              {editItem?.name}
            </Text>

            <Text style={styles.fieldLabel}>Current Stock</Text>
            <TextInput
              style={styles.fieldInput}
              keyboardType="number-pad"
              value={editStock}
              onChangeText={setEditStock}
              placeholder="0"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.fieldLabel}>Low Stock Alert Threshold</Text>
            <TextInput
              style={styles.fieldInput}
              keyboardType="number-pad"
              value={editThreshold}
              onChangeText={setEditThreshold}
              placeholder="10"
              placeholderTextColor="#9ca3af"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    gap: 8,
  },
  loadingText: { fontSize: 14, color: '#6b7280' },
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  alertText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  listContent: { padding: 16, gap: 10, paddingBottom: 40 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemLeft: { flex: 1, gap: 2, paddingRight: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemSku: { fontSize: 12, color: '#9ca3af' },
  itemCategory: { fontSize: 11, color: '#6b7280', textTransform: 'capitalize' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBadge: {
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 56,
  },
  stockValue: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  stockLabel: { fontSize: 10, fontWeight: '600' },
  editBtn: { padding: 6 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  modalProductName: { fontSize: 14, color: '#4f46e5', fontWeight: '600', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  quickActionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
});
