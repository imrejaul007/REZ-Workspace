/**
 * StoreVisitCard Component - Extracted from store-visit.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface StoreVisitCardProps {
  id: string;
  name: string;
  image?: string;
  address: string;
  rating?: number;
  distance?: string;
  cashback: number;
  onPress?: () => void;
}

export default function StoreVisitCard({ name, image, address, rating, distance, cashback, onPress }: StoreVisitCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.address} numberOfLines={1}>{address}</Text>
        <View style={styles.footer}>
          {rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          {distance && <Text style={styles.distance}>{distance}</Text>}
        </View>
        <View style={styles.cashback}>
          <Text style={styles.cashbackText}>Earn {cashback}% cashback</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  image: { width: 80, height: 80, borderRadius: borderRadius.md },
  content: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  address: { fontSize: 13, color: colors.text.secondary, marginBottom: spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  distance: { fontSize: 12, color: colors.text.tertiary },
  cashback: { backgroundColor: '#D1FAE5', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
  cashbackText: { fontSize: 12, fontWeight: '600', color: '#059669' },
});
