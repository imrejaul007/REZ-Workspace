/**
 * StreakCard - Stub component
 * Placeholder for future implementation
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface StreakCardProps {
  id: string;
  currentStreak: number;
  maxStreak: number;
  title?: string;
  onPress?: () => void;
}

export default function StreakCard({ currentStreak, maxStreak, title = 'Daily Streak', onPress }: StreakCardProps) {
  const progress = maxStreak > 0 ? currentStreak / maxStreak : 0;

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[colors.brand.orange, colors.brand.orangeDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <Ionicons name="flame" size={24} color="#FFFFFF" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.streakContainer}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
        <Text style={styles.maxStreak}>Goal: {maxStreak} days</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: 160,
    marginRight: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  streakContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.8)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  maxStreak: {
    fontSize: typography.caption.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
