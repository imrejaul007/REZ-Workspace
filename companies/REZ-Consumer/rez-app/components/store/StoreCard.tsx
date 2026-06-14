/**
 * StoreCard - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface StoreCardProps {
  id: string;
  name: string;
  rating?: number;
  distance?: string;
  image?: string;
  cashback?: number;
  onPress?: () => void;
}

export default function StoreCard({ name, rating, distance, image, cashback, onPress }: StoreCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🏪</Text>
          </View>
        )}
        {cashback && (
          <View style={styles.cashbackBadge}>
            <Text style={styles.cashbackText}>{cashback}% CB</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.metaRow}>
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={colors.gold} />
              <Text style={styles.rating}>{rating}</Text>
            </View>
          )}
          {distance && <Text style={styles.distance}>{distance}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    width: 140,
    marginRight: spacing.md,
  },
  imageContainer: {
    height: 100,
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
  cashbackBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    padding: spacing.sm,
  },
  name: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: typography.caption.fontSize,
    color: colors.text.primary,
    marginLeft: 2,
  },
  distance: {
    fontSize: typography.caption.fontSize,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
});
