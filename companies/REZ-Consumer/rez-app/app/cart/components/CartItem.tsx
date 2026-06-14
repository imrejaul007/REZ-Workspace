/**
 * CartItem Component - Extracted from cart.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface CartItemProps {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
}

export default function CartItem({ name, image, price, quantity, onIncrement, onDecrement, onRemove }: CartItemProps) {
  return (
    <View style={styles.container}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.price}>₹{price.toLocaleString()}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onDecrement} style={styles.qtyBtn}>
          <Ionicons name="remove" size={16} color={colors.text.secondary} />
        </Pressable>
        <Text style={styles.qty}>{quantity}</Text>
        <Pressable onPress={onIncrement} style={styles.qtyBtn}>
          <Ionicons name="add" size={16} color={colors.primary[500] ?? '#FF6B35'} />
        </Pressable>
        <Pressable onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.primary, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  image: { width: 60, height: 60, borderRadius: borderRadius.md, marginRight: spacing.md },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center' },
  qty: { fontSize: 14, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeBtn: { marginLeft: spacing.sm },
});
