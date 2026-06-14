/**
 * SearchResultItem Component - Extracted from search functionality
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface SearchResultItemProps {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
}

export default function SearchResultItem({ title, subtitle, image, price, onPress, onAddToCart }: SearchResultItemProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        {price !== undefined && <Text style={styles.price}>₹{price.toLocaleString()}</Text>}
      </View>
      {onAddToCart && (
        <Pressable style={styles.addBtn} onPress={onAddToCart}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  image: { width: 56, height: 56, borderRadius: borderRadius.md, marginRight: spacing.md },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: colors.text.primary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary[500] ?? '#FF6B35', alignItems: 'center', justifyContent: 'center' },
});
