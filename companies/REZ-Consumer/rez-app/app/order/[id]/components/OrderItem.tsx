/**
 * OrderItem Component - Extracted from order screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface OrderItemProps {
  id: string;
  productName: string;
  image?: string;
  price: number;
  quantity: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  onPress?: () => void;
}

const statusConfig = {
  pending: { color: '#F59E0B', label: 'Pending' },
  processing: { color: '#3B82F6', label: 'Processing' },
  shipped: { color: '#8B5CF6', label: 'Shipped' },
  delivered: { color: '#22C55E', label: 'Delivered' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

export default function OrderItem({ productName, image, price, quantity, status, onPress }: OrderItemProps) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{productName}</Text>
        <Text style={styles.price}>₹{price.toLocaleString()} x {quantity}</Text>
        <View style={[styles.status, { backgroundColor: config.color + '20' }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.background.primary, borderBottomWidth: 1, borderBottomColor: colors.border.default },
  image: { width: 60, height: 60, borderRadius: borderRadius.md, marginRight: spacing.md },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginBottom: 4 },
  price: { fontSize: 13, color: colors.text.secondary, marginBottom: spacing.xs },
  status: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
