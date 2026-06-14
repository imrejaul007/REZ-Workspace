/**
 * DealCard Component - Extracted from deals/[campaignId]/[dealIndex].tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface DealCardProps {
  id: string;
  title: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  endsAt?: string;
  onPress?: () => void;
}

export default function DealCard({ title, image, originalPrice, discountedPrice, discount, endsAt, onPress }: DealCardProps) {
  const savings = originalPrice - discountedPrice;
  const savingsPercent = Math.round((savings / originalPrice) * 100);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{discount}% OFF</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.discountedPrice}>₹{discountedPrice}</Text>
          <Text style={styles.originalPrice}>₹{originalPrice}</Text>
        </View>
        {endsAt && (
          <View style={styles.timer}>
            <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
            <Text style={styles.timerText}>Ends {endsAt}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  image: { width: '100%', height: 140 },
  badge: { position: 'absolute', top: spacing.sm, left: spacing.sm, backgroundColor: colors.primary[500] ?? '#FF6B35', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  content: { padding: spacing.md },
  title: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  discountedPrice: { fontSize: 18, fontWeight: '700', color: colors.primary[500] ?? '#FF6B35' },
  originalPrice: { fontSize: 14, color: colors.text.tertiary, textDecorationLine: 'line-through' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 12, color: colors.text.tertiary },
});
