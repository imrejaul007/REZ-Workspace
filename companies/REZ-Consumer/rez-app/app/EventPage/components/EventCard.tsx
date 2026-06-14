/**
 * EventCard Component
 * Card display for events in EventPage
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface EventCardProps {
  id: string;
  title: string;
  image: string;
  date: string;
  location: string;
  price: number;
  rating?: number;
  onPress?: () => void;
  onBookmark?: () => void;
}

export default function EventCard({
  title,
  image,
  date,
  location,
  price,
  rating,
  onPress,
  onBookmark,
}: EventCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.bookmarkBtn}>
        <Pressable onPress={onBookmark}>
          <Ionicons name="bookmark-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.metaText}>{date}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}

          <Text style={styles.price}>
            {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
          </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[500] ?? '#FF6B35',
  },
});
