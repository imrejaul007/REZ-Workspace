/**
 * StoreCard Component - Extracted from stores screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface StoreCardProps {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  reviews?: number;
  deliveryTime?: string;
  distance?: string;
  cuisines?: string[];
  onPress?: () => void;
}

export default function StoreCard({ name, image, rating, reviews, deliveryTime, distance, cuisines, onPress }: StoreCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {cuisines && <Text style={styles.cuisines} numberOfLines={1}>{cuisines.join(', ')}</Text>}
        <View style={styles.meta}>
          {rating && (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              {reviews && <Text style={styles.reviews}>({reviews})</Text>}
            </View>
          )}
          {deliveryTime && (
            <Text style={styles.delivery}>{deliveryTime}</Text>
          )}
        </View>
        {distance && <Text style={styles.distance}>{distance}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  image: { width: '100%', height: 140 },
  content: { padding: spacing.md },
  name: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  cuisines: { fontSize: 12, color: colors.text.secondary, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  reviews: { fontSize: 11, color: colors.text.tertiary },
  delivery: { fontSize: 11, color: colors.text.tertiary },
  distance: { fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
});
