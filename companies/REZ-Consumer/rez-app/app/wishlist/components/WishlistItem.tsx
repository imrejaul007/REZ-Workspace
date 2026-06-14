/**
 * WishlistItem Component - Extracted from wishlist.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface WishlistItemProps {
  id: string;
  name: string;
  image?: string;
  price: number;
  originalPrice?: number;
  onPress?: () => void;
  onRemove?: () => void;
  onAddToCart?: () => void;
}

export default function WishlistItem({ name, image, price, originalPrice, onPress, onRemove, onAddToCart }: WishlistItemProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price.toLocaleString()}</Text>
          {originalPrice && (
            <Text style={styles.original}>₹{originalPrice.toLocaleString()}</Text>
          )}
        </View>
        {discount > 0 && <Text style={styles.discount}>{discount}% off</Text>}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="heart-dislike" size={20} color="#EF4444" />
        </Pressable>
        {onAddToCart && (
          <Pressable style={styles.cartBtn} onPress={onAddToCart}>
            <Ionicons name="cart" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.background.primary, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  image: { width: 70, height: 70, borderRadius: borderRadius.md, marginRight: spacing.md },
  content: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  price: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  original: { fontSize: 13, color: colors.text.tertiary, textDecorationLine: 'line-through' },
  discount: { fontSize: 12, color: '#059669', fontWeight: '500', marginTop: 4 },
  actions: { justifyContent: 'center', gap: spacing.sm },
  removeBtn: { padding: spacing.xs },
  cartBtn: { backgroundColor: colors.primary[500] ?? '#FF6B35', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
