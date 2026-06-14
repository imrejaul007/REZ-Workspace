/**
 * ExploreCard Component
 * Card for explore/search results
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface ExploreCardProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  rating?: number;
  distance?: string;
  price?: string;
  onPress?: () => void;
}

export default function ExploreCard({
  title,
  subtitle,
  image,
  rating,
  distance,
  price,
  onPress,
}: ExploreCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}

        <View style={styles.footer}>
          {rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}

          {distance && (
            <View style={styles.distance}>
              <Ionicons name="location-outline" size={12} color={colors.text.tertiary} />
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}

          {price && <Text style={styles.price}>{price}</Text>}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  image: {
    width: '100%',
    height: 140,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  distance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[500] ?? '#FF6B35',
  },
});
