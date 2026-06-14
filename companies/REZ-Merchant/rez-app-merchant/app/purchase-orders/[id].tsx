import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/DesignTokens';
import { purchaseOrdersService, PurchaseOrder } from '@/services/api/purchaseOrders';
import { showAlert } from '@/utils/alert';

export default function PurchaseOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await purchaseOrdersService.getPurchaseOrder(id);
      setOrder(response.data || null);
    } catch (error) {
      showAlert('Error', 'Failed to load purchase order');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Purchase order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
        <Text style={styles.title}>{order.poNumber}</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <View style={styles.poHeader}>
            <View>
              <Text style={styles.label}>PO Number</Text>
              <Text style={styles.value}>{order.poNumber}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.label}>Supplier</Text>
              <Text style={styles.value}>{order.supplierName}</Text>
            </View>
            <View>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.value}>₹{order.total.toFixed(2)}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemPrice}>₹{item.unitCost.toFixed(2)}</Text>
              </View>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: Typography.fontSize.base, color: Colors.error[500] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  poHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  value: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.text.primary },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.warning[50],
  },
  statusText: { fontSize: Typography.fontSize.xs, fontWeight: '700', color: Colors.warning[700] },
  divider: { height: 1, backgroundColor: Colors.border.light, marginVertical: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  itemName: { fontSize: Typography.fontSize.sm, fontWeight: '600', color: Colors.text.primary },
  itemPrice: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.primary[500] },
  itemQty: { fontSize: Typography.fontSize.xs, color: Colors.text.tertiary },
});
