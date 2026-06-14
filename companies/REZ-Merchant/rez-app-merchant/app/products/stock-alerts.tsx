import React, { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';

interface LowStockProduct {
  _id: string;
  name: string;
  category?: string;
  inventory: {
    stock: number;
    lowStockThreshold?: number;
    isAvailable?: boolean;
  };
  lowStockAlert?: boolean;
}

type StockStatus = 'out' | 'critical' | 'low';

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return 'out';
  if (stock <= 3) return 'critical';
  return 'low';
}

const STATUS_CONFIG: Record<
  StockStatus,
  { label: string; bg: string; text: string; icon: string }
> = {
  out: { label: 'Out of Stock', bg: '#FEECEC', text: '#C62828', icon: 'close-circle' },
  critical: { label: 'Critical', bg: '#FFF3E0', text: '#E65100', icon: 'warning' },
  low: { label: 'Low Stock', bg: '#FFFDE7', text: '#F57F17', icon: 'alert-circle' },
};

export default function StockAlertsScreen() {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchLowStock = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get<unknown>('merchant/products?lowStock=true&limit=100');
      const raw: unknown[] = res.data?.data ?? res.data?.products ?? res.data ?? [];

      const items: LowStockProduct[] = raw.map((p) => ({
        _id: p._id || p.id,
        name: p.name,
        category: p.category,
        inventory: {
          stock: p.inventory?.stock ?? p.stock ?? 0,
          lowStockThreshold: p.inventory?.lowStockThreshold ?? 10,
          isAvailable: p.inventory?.isAvailable ?? true,
        },
        lowStockAlert: p.lowStockAlert ?? false,
      }));

      setProducts(items);
    } catch (err) {
      logger.error('StockAlerts fetch error:', err);
      const msg = err.message || 'Failed to load low stock products';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const handleToggleAlert = async (product: LowStockProduct, value: boolean) => {
    setTogglingId(product._id);
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p._id === product._id ? { ...p, lowStockAlert: value } : p))
    );
    try {
      await apiClient.patch(`merchant/products/${product._id}`, { lowStockAlert: value });
    } catch (err) {
      logger.error('Toggle alert error:', err);
      // Roll back
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? { ...p, lowStockAlert: !value } : p))
      );
      platformAlertSimple('Error', err.message || 'Failed to update alert setting');
    } finally {
      setTogglingId(null);
    }
  };

  const renderProduct = ({ item }: { item: LowStockProduct }) => {
    const stock = item.inventory.stock;
    const threshold = item.inventory.lowStockThreshold ?? 10;
    const status = getStockStatus(stock);
    const cfg = STATUS_CONFIG[status];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <ThemedText style={styles.productName} numberOfLines={2}>
              {item.name}
            </ThemedText>
            {item.category ? (
              <ThemedText style={styles.productCategory}>{item.category}</ThemedText>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as unknown as keyof typeof Ionicons.glyphMap} size={12} color={cfg.text} />
            <ThemedText style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</ThemedText>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.stockInfo}>
            <View style={styles.stockStat}>
              <ThemedText style={styles.stockStatLabel}>In Stock</ThemedText>
              <ThemedText
                style={[
                  styles.stockStatValue,
                  stock === 0 && styles.stockZero,
                  stock > 0 && stock <= 3 && styles.stockCritical,
                ]}
              >
                {stock}
              </ThemedText>
            </View>
            <View style={styles.stockDivider} />
            <View style={styles.stockStat}>
              <ThemedText style={styles.stockStatLabel}>Threshold</ThemedText>
              <ThemedText style={styles.stockStatValue}>{threshold}</ThemedText>
            </View>
          </View>
          <View style={styles.alertToggle}>
            <ThemedText style={styles.alertToggleLabel}>Alerts</ThemedText>
            {togglingId === item._id ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Switch
                value={item.lowStockAlert ?? false}
                onValueChange={(v) => handleToggleAlert(item, v)}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                thumbColor="#fff"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Low Stock Alerts
        </ThemedText>
        <TouchableOpacity
          onPress={() => fetchLowStock(true)}
          style={styles.refreshBtn}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading stock alerts...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.destructive} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchLowStock()}>
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={products.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLowStock(true)}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={56} color="#4CAF50" />
              <ThemedText style={styles.emptyTitle}>All products well stocked</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                No products are below their low-stock threshold right now.
              </ThemedText>
            </View>
          }
          ListHeaderComponent={
            products.length > 0 ? (
              <View style={styles.summaryBanner}>
                <Ionicons name="warning-outline" size={16} color="#E65100" />
                <ThemedText style={styles.summaryText}>
                  {products.length} product{products.length !== 1 ? 's' : ''} need restocking
                </ThemedText>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  refreshBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 8 },
  errorText: { fontSize: 14, color: Colors.light.destructive, textAlign: 'center' },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  listContent: { padding: 12, gap: 10 },
  emptyContainer: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
    marginTop: 60,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: Colors.light.text },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  summaryText: { fontSize: 13, fontWeight: '500', color: '#E65100' },
  // Product card
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardInfo: { flex: 1, gap: 3 },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  productCategory: { fontSize: 12, color: Colors.light.textSecondary },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stockStat: { alignItems: 'center', gap: 2 },
  stockStatLabel: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stockStatValue: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  stockZero: { color: '#C62828' },
  stockCritical: { color: '#E65100' },
  stockDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.light.border,
  },
  alertToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertToggleLabel: { fontSize: 12, color: Colors.light.textSecondary },
});
