/**
 * CoinRewardCard - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface CoinRewardCardProps {
  id: string;
  title: string;
  coins: number;
  description?: string;
  onPress?: () => void;
}

export default function CoinRewardCard({ title, coins, description, onPress }: CoinRewardCardProps) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[colors.gold, colors.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.info}>
          <Text style={styles.coins}>+{coins} coins</Text>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  coins: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  description: {
    fontSize: typography.caption.fontSize,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
