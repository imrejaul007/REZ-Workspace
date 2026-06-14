/**
 * SocialCard Component - Extracted from earn-from-social-media.tsx
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface SocialCardProps {
  id: string;
  title: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'whatsapp';
  reward: number;
  action: string;
  onPress?: () => void;
}

export default function SocialCard({ title, platform, reward, action, onPress }: SocialCardProps) {
  const platformIcons = {
    instagram: 'logo-instagram',
    twitter: 'logo-twitter',
    facebook: 'logo-facebook',
    whatsapp: 'logo-whatsapp',
  };

  const platformColors = {
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    facebook: '#1877F2',
    whatsapp: '#25D366',
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: platformColors[platform] + '20' }]}>
        <Ionicons name={platformIcons[platform] as unknown} size={24} color={platformColors[platform]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.action}>{action}</Text>
      </View>
      <View style={styles.reward}>
        <Text style={styles.rewardText}>+{reward}</Text>
        <Text style={styles.rewardLabel}>coins</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.primary, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  iconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, marginLeft: spacing.md },
  title: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 4 },
  action: { fontSize: 12, color: colors.text.secondary },
  reward: { alignItems: 'center' },
  rewardText: { fontSize: 16, fontWeight: '700', color: colors.primary[500] ?? '#FF6B35' },
  rewardLabel: { fontSize: 10, color: colors.text.tertiary },
});
