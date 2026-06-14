/**
 * Inventory Alerts Screen
 * Displays out-of-stock and low-stock products with inline threshold editing and alert toggles
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { Ionicons } from '@expo/vector-icons';

interface AlertProduct {
  _id: string;
  name: string;
  stock: number;
  stockAlertThreshold: number;
  stockAlertsEnabled: boolean;
}

const DEFAULT_THRESHOLD = 10;

function parseProducts(raw: unknown[]): AlertProduct[] {
  return raw.map((p) => ({
    _id: p._id ?? p.id ?? '',
    name: p.name ?? 'Unnamed Product',
    stock: p.inventory?.stock ?? p.stock ?? 0,
    stockAlertThreshold:
      p.inventory?.lowStockThreshold ?? p.stockAlertThreshold ?? DEFAULT_THRESHOLD,
    stockAlertsEnabled: p.stockAlertsEnabled ?? true,
  }));
}

export default function InventoryAlertsScreen() {
  const [products, setProducts] = useState<AlertProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Map of productId -> pending threshold string (for inline edit)
  const [thresholdInputs, setThresholdInputs] = useState<Record<string, string>>({});
  // Map of productId -> patch in-flight
  const [patching, setPatching] = useState<Record<string, boolean>>({});

  const fetchProducts = useCallback(async () => {
    try {
      const res = await apiClient.get<unknown>('merchant/products?page=1&limit=50');
      const raw: unknown[] =
        res?.data?.data?.items ?? res?.data?.data ?? res?.data?.products ?? res?.data ?? [];
      setProducts(parseProducts(Array.isArray(raw) ? raw : []));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleThresholdChange = (id: string, value: string) => {
    setThresholdInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleThresholdBlur = async (product: AlertProduct) => {
    const raw = thresholdInputs[product._id];
    if (raw === undefined) return;
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) return;
    if (parsed === product.stockAlertThreshold) return;

    setPatching((prev) => ({ ...prev, [product._id]: true }));
    try {
      await apiClient.patch(`merchant/products/${product._id}`, {
        stockAlertThreshold: parsed,
      });
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, stockAlertThreshold: parsed } : p))
      );
    } catch {
      // revert input on failure
      setThresholdInputs((prev) => ({
        ...prev,
        [product._id]: String(product.stockAlertThreshold),
      }));
    } finally {
      setPatching((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  const handleToggleAlert = async (product: AlertProduct) => {
    const newValue = !product.stockAlertsEnabled;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, stockAlertsEnabled: newValue } : p))
    );
    try {
      await apiClient.patch(`merchant/products/${product._id}`, {
        stockAlertsEnabled: newValue,
      });
    } catch {
      // revert
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, stockAlertsEnabled: !newValue } : p))
      );
    }
  };

  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= DEFAULT_THRESHOLD);
  const inStockCount = products.filter((p) => p.stock > DEFAULT_THRESHOLD).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={styles.loadingText}>Loading inventory...</ThemedText>
      </View>
    );
  }

  const renderProductCard = (product: AlertProduct) => {
    const isOut = product.stock === 0;
    const thresholdValue =
      thresholdInputs[product._id] !== undefined
        ? thresholdInputs[product._id]
        : String(product.stockAlertThreshold);
    const isPatchingThis = patching[product._id] ?? false;

    return (
      <View key={product._id} style={styles.productCard}>
        <View style={styles.productHeader}>
          <ThemedText style={styles.productName} numberOfLines={1}>
            {product.name}
          </ThemedText>
          <View style={styles.stockBadge}>
            <ThemedText style={[styles.stockCount, isOut ? styles.stockOut : styles.stockLow]}>
              {product.stock} units
            </ThemedText>
          </View>
        </View>

        <View style={styles.productControls}>
          <View style={styles.thresholdRow}>
            <ThemedText style={styles.controlLabel}>Alert below</ThemedText>
            <View style={styles.thresholdInputWrapper}>
              <TextInput
                style={styles.thresholdInput}
                value={thresholdValue}
                onChangeText={(v) => handleThresholdChange(product._id, v)}
                onBlur={() => handleThresholdBlur(product)}
                keyboardType="number-pad"
                maxLength={5}
                selectTextOnFocus
              />
              {isPatchingThis && (
                <ActivityIndicator
                  size="small"
                  color={Colors.light.primary}
                  style={styles.patchSpinner}
                />
              )}
            </View>
          </View>

          <View style={styles.toggleRow}>
            <ThemedText style={styles.controlLabel}>Alerts enabled</ThemedText>
            <Switch
              value={product.stockAlertsEnabled}
              onValueChange={() => handleToggleAlert(product)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={product.stockAlertsEnabled ? Colors.light.primary : '#9CA3AF'}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryNum}>{inStockCount}</ThemedText>
          <ThemedText style={styles.summaryLabel}>In Stock</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryNum, styles.warnText]}>{lowStock.length}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Low</ThemedText>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryNum, styles.errorText]}>{outOfStock.length}</ThemedText>
          <ThemedText style={styles.summaryLabel}>Out</ThemedText>
        </View>
      </View>

      {/* Out of Stock section */}
      {outOfStock.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <ThemedText style={[styles.sectionTitle, styles.errorText]}>
              Out of Stock ({outOfStock.length})
            </ThemedText>
          </View>
          {outOfStock.map(renderProductCard)}
        </View>
      )}

      {/* Low Stock section */}
      {lowStock.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={18} color="#F59E0B" />
            <ThemedText style={[styles.sectionTitle, styles.warnText]}>
              Low Stock ({lowStock.length})
            </ThemedText>
          </View>
          {lowStock.map(renderProductCard)}
        </View>
      )}

      {outOfStock.length === 0 && lowStock.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={56} color="#10B981" />
          <ThemedText style={styles.emptyTitle}>All stocked up</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            No products are below the alert threshold.
          </ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.textSecondary,
  },
  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.light.border,
  },
  warnText: {
    color: '#F59E0B',
  },
  errorText: {
    color: '#EF4444',
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Product card
  productCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginRight: 8,
  },
  stockBadge: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  stockOut: {
    color: '#EF4444',
  },
  stockLow: {
    color: '#F59E0B',
  },
  productControls: {
    gap: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  thresholdInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thresholdInput: {
    width: 64,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  patchSpinner: {
    marginLeft: 4,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
