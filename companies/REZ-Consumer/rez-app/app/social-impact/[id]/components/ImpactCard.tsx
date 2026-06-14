/**
 * ImpactCard Component - Extracted from social-impact/[id].tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface ImpactCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  impact: { value: number; unit: string };
  onPress?: () => void;
}

export default function ImpactCard({ title, description, image, impact, onPress }: ImpactCardProps) {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <View style={styles.content}>
        <View style={styles.impactBadge}>
          <Ionicons name="heart" size={14} color="#E11D48" />
          <Text style={styles.impactText}>{impact.value} {impact.unit}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.md },
  image: { width: '100%', height: 120 },
  content: { padding: spacing.md },
  impactBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, marginBottom: spacing.sm },
  impactText: { fontSize: 12, fontWeight: '600', color: '#E11D48' },
  title: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.xs },
  description: { fontSize: 13, color: colors.text.secondary },
});
