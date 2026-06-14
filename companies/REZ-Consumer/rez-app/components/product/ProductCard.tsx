/**
 * ProductCard - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  cashback?: number;
  onPress?: () => void;
}

export default function ProductCard({ name, price, originalPrice, image, cashback, onPress }: ProductCardProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price}</Text>
          {originalPrice && <Text style={styles.originalPrice}>₹{originalPrice}</Text>}
        </View>
        {cashback && (
          <View style={styles.cashbackBadge}>
            <Text style={styles.cashbackText}>{cashback}% CB</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 160,
    marginRight: spacing.md,
  },
  imageContainer: {
    height: 160,
    backgroundColor: colors.neutral[100],
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    color: colors.text.primary,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  price: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
    marginLeft: spacing.xs,
  },
  cashbackBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
});
