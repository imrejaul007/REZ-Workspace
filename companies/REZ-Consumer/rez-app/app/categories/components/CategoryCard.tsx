/**
 * CategoryCard Component - Extracted from categories screens
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface CategoryCardProps {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  count?: number;
  onPress?: () => void;
}

export default function CategoryCard({ name, icon, image, count, onPress }: CategoryCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : icon ? (
        <View style={styles.iconContainer}>
          <Ionicons name={icon as unknown} size={24} color={colors.primary[500] ?? '#FF6B35'} />
        </View>
      ) : null}
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      {count !== undefined && <Text style={styles.count}>{count} items</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 80, marginRight: spacing.md },
  image: { width: 56, height: 56, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  name: { fontSize: 12, fontWeight: '500', color: colors.text.primary, textAlign: 'center' },
  count: { fontSize: 10, color: colors.text.tertiary, textAlign: 'center', marginTop: 2 },
});
