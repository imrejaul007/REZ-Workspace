/**
 * Product Catalog Screen — Browse, add, edit, and delete products.
 *
 * Also includes a "Menu Availability" section that lists items from the
 * web-ordering Menu model (served at now.rez.money) with live toggles so
 * merchants can mark items sold out mid-service without leaving this screen.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/services/api/client';
import { Colors, Shadows } from '@/constants/DesignTokens';
import { useStore } from '@/contexts/StoreContext';
import { setItemAvailability } from '@/services/api/menuAvailability';

// ─── Types ────────────────────────────────────────────────────────────────────

type StockStatus = 'in-stock' | 'low' | 'out-of-stock';

// ─── Menu Availability Types ──────────────────────────────────────────────────

interface MenuAvailabilityItem {
  id: string;
  name: string;
  category: string;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  items: Array<{ id: string; name: string; isAvailable?: boolean }>;
}

interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  stock: number;
}

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  description: string;
  stock: string;
}

interface ProductsApiResponse {
  data?: {
    items?: Product[];
    products?: Product[];
  };
  items?: Product[];
  products?: Product[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 5) return 'low';
  return 'in-stock';
}

const STOCK_CONFIG: Record<StockStatus, { label: string; bg: string; color: string }> = {
  'in-stock': { label: 'In Stock', bg: '#D1FAE5', color: '#065F46' },
  low: { label: 'Low Stock', bg: '#FEF3C7', color: '#92400E' },
  'out-of-stock': { label: 'Out of Stock', bg: '#FEE2E2', color: '#991B1B' },
};

function getProductId(product: Product): string {
  return product.id || product._id || '';
}

function extractProducts(resp): Product[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.data?.items)) return resp.data.items;
  if (Array.isArray(resp.data?.products)) return resp.data.products;
  if (Array.isArray(resp.items)) return resp.items;
  if (Array.isArray(resp.products)) return resp.products;
  return [];
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  price: '',
  category: '',
  description: '',
  stock: '',
};

// ─── Stock Badge ──────────────────────────────────────────────────────────────

function StockBadge({ status }: { status: StockStatus }) {
  const cfg = STOCK_CONFIG[status];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

function ProductCard({ product, onPress }: ProductCardProps) {
  const status = getStockStatus(product.stock);
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={cardStyles.cardContent}>
        <View style={cardStyles.cardLeft}>
          <View style={cardStyles.iconWrap}>
            <Ionicons name="cube-outline" size={22} color="#6366F1" />
          </View>
          <View style={cardStyles.info}>
            <Text style={cardStyles.name} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={cardStyles.category} numberOfLines={1}>
              {product.category}
            </Text>
          </View>
        </View>
        <View style={cardStyles.cardRight}>
          <Text style={cardStyles.price}>₹{product.price.toLocaleString('en-IN')}</Text>
          <StockBadge status={status} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={cardStyles.chevron} />
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827' },
  category: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 14, fontWeight: '700', color: '#6366F1' },
  chevron: { marginLeft: 8 },
});

// ─── Product Form ─────────────────────────────────────────────────────────────

interface ProductFormProps {
  visible: boolean;
  title: string;
  initialData: ProductFormData;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
  saving: boolean;
  deleting?: boolean;
}

function ProductForm({
  visible,
  title,
  initialData,
  onSubmit,
  onClose,
  onDelete,
  saving,
  deleting,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(initialData);

  useEffect(() => {
    if (visible) setForm(initialData);
  }, [visible, initialData]);

  const set = (key: keyof ProductFormData) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.price.trim() || !form.category.trim()) {
      Alert.alert('Missing fields', 'Name, price, and category are required.');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }
    onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={formStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={formStyles.sheet}>
          {/* Header */}
          <View style={formStyles.sheetHeader}>
            <Text style={formStyles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Fields */}
            {(
              [
                {
                  key: 'name',
                  label: 'Product Name',
                  placeholder: 'e.g. Masala Chai',
                  keyboard: 'default',
                },
                { key: 'price', label: 'Price (₹)', placeholder: 'e.g. 150', keyboard: 'numeric' },
                {
                  key: 'category',
                  label: 'Category',
                  placeholder: 'e.g. Beverages',
                  keyboard: 'default',
                },
                {
                  key: 'description',
                  label: 'Description',
                  placeholder: 'Optional...',
                  keyboard: 'default',
                },
                {
                  key: 'stock',
                  label: 'Stock Quantity',
                  placeholder: 'e.g. 100',
                  keyboard: 'numeric',
                },
              ] as const
            ).map(({ key, label, placeholder, keyboard }) => (
              <View key={key} style={formStyles.fieldGroup}>
                <Text style={formStyles.fieldLabel}>{label}</Text>
                <TextInput
                  style={[formStyles.input, key === 'description' && formStyles.inputMulti]}
                  placeholder={placeholder}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={keyboard as import('react-native').KeyboardTypeOptions}
                  value={form[key]}
                  onChangeText={set(key)}
                  multiline={key === 'description'}
                  numberOfLines={key === 'description' ? 3 : 1}
                />
              </View>
            ))}

            {/* Action Buttons */}
            <TouchableOpacity
              style={[formStyles.submitButton, saving && formStyles.disabledButton]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              )}
              <Text style={formStyles.submitText}>{saving ? 'Saving...' : 'Save Product'}</Text>
            </TouchableOpacity>

            {onDelete && (
              <TouchableOpacity
                style={[formStyles.deleteButton, deleting && formStyles.disabledButton]}
                onPress={onDelete}
                disabled={deleting}
                activeOpacity={0.8}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                )}
                <Text style={formStyles.deleteText}>
                  {deleting ? 'Deleting...' : 'Delete Product'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const formStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputMulti: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  disabledButton: { opacity: 0.65 },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 13,
    backgroundColor: '#FEF2F2',
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});

// ─── Menu Availability Section ────────────────────────────────────────────────

function MenuAvailabilitySection({ storeSlug }: { storeSlug: string }) {
  const [menuItems, setMenuItems] = useState<MenuAvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ menu?: { categories?: MenuCategory[] } }>(
        `web-ordering/store/${storeSlug}`
      );
      const categories: MenuCategory[] = (res as unknown as { data?: { menu?: { categories?: MenuCategory[] } } })?.data?.menu?.categories ?? [];
      const flat: MenuAvailabilityItem[] = [];
      for (const cat of categories) {
        for (const item of cat.items) {
          flat.push({
            id: item.id,
            name: item.name,
            category: cat.name,
            isAvailable: item.isAvailable !== false,
          });
        }
      }
      setMenuItems(flat);
    } catch (err) {
      logger.warn('[Catalog] Menu availability fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleToggle = async (itemId: string, newValue: boolean) => {
    // Optimistic update
    setMenuItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isAvailable: newValue } : i))
    );
    setTogglingIds((prev) => new Set(prev).add(itemId));
    try {
      await setItemAvailability(storeSlug, itemId, newValue);
    } catch (err) {
      // Revert on failure
      setMenuItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !newValue } : i))
      );
      Alert.alert('Error', err?.message || 'Could not update item availability.');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <View style={menuAvailStyles.loadWrap}>
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={menuAvailStyles.loadText}>Loading menu items...</Text>
      </View>
    );
  }

  if (menuItems.length === 0) {
    return (
      <View style={menuAvailStyles.emptyWrap}>
        <Text style={menuAvailStyles.emptyText}>No menu items found for this store.</Text>
      </View>
    );
  }

  return (
    <View style={menuAvailStyles.container}>
      {menuItems.map((item) => (
        <View key={item.id} style={menuAvailStyles.row}>
          <View style={menuAvailStyles.rowInfo}>
            <Text style={menuAvailStyles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={menuAvailStyles.categoryLabel} numberOfLines={1}>
              {item.category}
            </Text>
          </View>
          <View style={menuAvailStyles.rowRight}>
            <Text
              style={[
                menuAvailStyles.statusLabel,
                { color: item.isAvailable ? '#059669' : '#DC2626' },
              ]}
            >
              {item.isAvailable ? 'Available' : 'Sold Out'}
            </Text>
            <Switch
              value={item.isAvailable}
              onValueChange={(val) => handleToggle(item.id, val)}
              disabled={togglingIds.has(item.id)}
              trackColor={{ false: '#FCA5A5', true: '#6EE7B7' }}
              thumbColor={item.isAvailable ? '#059669' : '#DC2626'}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const menuAvailStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  loadWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  loadText: { fontSize: 13, color: '#6B7280' },
  emptyWrap: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  categoryLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CatalogScreen() {
  const router = useRouter();
  const { activeStore } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showMenuAvailability, setShowMenuAvailability] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const resp = await apiClient.get<ProductsApiResponse>('merchant/products?page=1&limit=20');
      // apiClient returns ApiResponse<T> — unwrap .data if present
      const payload = (resp as unknown as { data?: unknown })?.data ?? resp;
      setProducts(extractProducts(payload));
    } catch (err) {
      logger.warn('[Catalog] Fetch error:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts().finally(() => setLoading(false));
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
  });

  const handleAdd = async (form: ProductFormData) => {
    setSaving(true);
    try {
      await apiClient.post('merchant/products', {
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category.trim(),
        description: form.description.trim(),
        stock: parseInt(form.stock, 10) || 0,
      });
      setAddVisible(false);
      await fetchProducts();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to add product.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form: ProductFormData) => {
    if (!editProduct) return;
    const pid = getProductId(editProduct);
    setSaving(true);
    try {
      await apiClient.patch(`merchant/products/${pid}`, {
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category.trim(),
        description: form.description.trim(),
        stock: parseInt(form.stock, 10) || 0,
      });
      setEditProduct(null);
      await fetchProducts();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editProduct) return;
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${editProduct.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const pid = getProductId(editProduct);
            setDeleting(true);
            try {
              await apiClient.delete(`merchant/products/${pid}`);
              setEditProduct(null);
              await fetchProducts();
            } catch (err) {
              Alert.alert('Error', err?.message || 'Failed to delete product.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const editFormData = (p: Product): ProductFormData => ({
    name: p.name,
    price: String(p.price),
    category: p.category,
    description: p.description || '',
    stock: String(p.stock),
  });

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={52} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No products yet</Text>
      <Text style={styles.emptySubtitle}>Add your first product to get started.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Product Catalog</Text>
          {activeStore?.slug ? (
            <TouchableOpacity
              style={styles.availabilityToggleBtn}
              onPress={() => setShowMenuAvailability((v) => !v)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={showMenuAvailability ? 'toggle' : 'toggle-outline'}
                size={16}
                color="#fff"
              />
              <Text style={styles.availabilityToggleBtnText}>
                {showMenuAvailability ? 'Hide Availability' : 'Menu Availability'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={styles.headerSubtitle}>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or category..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {showMenuAvailability && activeStore?.slug ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionHeading}>REZ Now Menu Availability</Text>
          <Text style={styles.sectionSubheading}>
            Toggle items sold out — customers see changes instantly without refreshing.
          </Text>
          <MenuAvailabilitySection storeSlug={activeStore.slug} />
        </ScrollView>
      ) : loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => getProductId(item)}
          renderItem={({ item }) => (
            <ProductCard product={item} onPress={() => setEditProduct(item)} />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredProducts.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — Add Product */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <ProductForm
        visible={addVisible}
        title="Add Product"
        initialData={EMPTY_FORM}
        onSubmit={handleAdd}
        onClose={() => setAddVisible(false)}
        saving={saving}
      />

      {/* Edit Modal */}
      <ProductForm
        visible={editProduct !== null}
        title="Edit Product"
        initialData={editProduct ? editFormData(editProduct) : EMPTY_FORM}
        onSubmit={handleEdit}
        onClose={() => setEditProduct(null)}
        onDelete={handleDelete}
        saving={saving}
        deleting={deleting}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 10,
    alignSelf: 'flex-start',
    padding: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    flex: 1,
  },
  availabilityToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  availabilityToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 17,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});
