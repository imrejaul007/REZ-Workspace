/**
 * ProductCard Component - Extracted from product-page.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  onPress?: () => void;
}

export default function ProductCard({ name, image, price, originalPrice, rating, reviews, onPress }: ProductCardProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.image} />
      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% off</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price.toLocaleString()}</Text>
          {originalPrice && <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString()}</Text>}
        </View>
        {(rating || reviews) && (
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{rating?.toFixed(1)}</Text>
            <Text style={styles.reviews}>({reviews} reviews)</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  image: { width: '100%', height: 160 },
  discountBadge: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: '#EF4444', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: spacing.md },
  name: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginBottom: spacing.xs },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  price: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  originalPrice: { fontSize: 13, color: colors.text.tertiary, textDecorationLine: 'line-through' },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  reviews: { fontSize: 12, color: colors.text.tertiary },
});
