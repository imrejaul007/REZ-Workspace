/**
 * FlashSaleCard - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface FlashSaleCardProps {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  image?: string;
  endsAt: string;
  onPress?: () => void;
}

export default function FlashSaleCard({ name, originalPrice, salePrice, image, endsAt, onPress }: FlashSaleCardProps) {
  const discount = Math.round((1 - salePrice / originalPrice) * 100);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>⚡</Text>
          </View>
        )}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.salePrice}>₹{salePrice}</Text>
          <Text style={styles.originalPrice}>₹{originalPrice}</Text>
        </View>
        <Text style={styles.endsAt}>Ends {new Date(endsAt).toLocaleTimeString()}</Text>
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
    height: 120,
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
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    fontSize: typography.caption.fontSize,
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
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  salePrice: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.error,
  },
  originalPrice: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
    marginLeft: spacing.xs,
  },
  endsAt: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
