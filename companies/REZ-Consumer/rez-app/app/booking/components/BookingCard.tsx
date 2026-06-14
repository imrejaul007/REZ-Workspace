/**
 * BookingCard Component
 * Card display for bookings
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface BookingCardProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  date: string;
  time?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  onPress?: () => void;
}

export default function BookingCard({ title, subtitle, image, date, time, status, onPress }: BookingCardProps) {
  const statusColors = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    confirmed: { bg: '#D1FAE5', text: '#059669' },
    completed: { bg: '#E0E7FF', text: '#4F46E5' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[status].bg }]}>
            <Text style={[styles.statusText, { color: statusColors[status].text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
          {time && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
