import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { purchaseOrdersService, PurchaseOrder } from '@/services/api/purchaseOrders';
import { useAuth } from '@/contexts/AuthContext';
import { showAlert } from '@/utils/alert';

export default function PurchaseOrdersScreen() {
  const { merchant } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft'>('all');

  const fetchOrders = useCallback(async () => {
    if (!merchant?.id) return;
    try {
      setLoading(true);
      const response = await purchaseOrdersService.listPurchaseOrders(merchant.id);
      setOrders(response.data?.data?.items || []);
    } catch (error) {
      showAlert('Error', 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [merchant?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.title}>Purchase Orders</Text>
          <TouchableOpacity
            onPress={() => router.push('/purchase-orders/create')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown} style={styles.content}>
        {orders.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/purchase-orders/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.poNumber}>
                    <Text style={styles.poNumberText}>{item.poNumber}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.supplierName}>{item.supplierName}</Text>
                <View style={styles.meta}>
                  <Text style={styles.metaText}>{item.items.length} items</Text>
                  <Text style={styles.metaText}>₹{(item.total ?? 0).toFixed(2)}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => router.push(`/purchase-orders/create?prefillFromPO=${item.id}`)}
                  >
                    <Ionicons name="refresh" size={16} color={Colors.primary[500]} />
                    <Text style={styles.reorderButtonText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No purchase orders</Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/purchase-orders/create')}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.ctaButtonText}>New PO</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background?.primary ?? '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '700', flex: 1, marginLeft: Spacing.sm },
  addButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full ?? 999,
    padding: Spacing.xs,
  },
  content: { flex: 1, padding: Spacing.md },
  listContent: { gap: Spacing.sm },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  poNumber: {},
  poNumberText: { fontSize: 15, fontWeight: '600', color: Colors.primary[500] },
  statusBadge: {
    backgroundColor: Colors.primary[50] ?? '#eef',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontWeight: '600', color: Colors.primary[500] },
  supplierName: { fontSize: 14, color: Colors.text.secondary, marginBottom: Spacing.xs },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  metaText: { fontSize: 12, color: Colors.text.tertiary },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border?.default ?? '#eee',
    paddingTop: Spacing.xs,
  },
  reorderButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reorderButtonText: { color: Colors.primary[500], fontWeight: '600', fontSize: 13 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  emptyStateTitle: { fontSize: 15, fontWeight: '600', color: Colors.text.secondary },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ctaButtonText: { color: '#fff', fontWeight: '600' },
});
