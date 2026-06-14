/**
 * CardOfferItem - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface CardOfferItemProps {
  id: string;
  title: string;
  subtitle?: string;
  discount?: number;
  onPress?: () => void;
}

export default function CardOfferItem({ title, subtitle, discount, onPress }: CardOfferItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
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
    padding: spacing.md,
    marginRight: spacing.md,
    width: 160,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  discountBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '700',
    color: '#000000',
  },
});
