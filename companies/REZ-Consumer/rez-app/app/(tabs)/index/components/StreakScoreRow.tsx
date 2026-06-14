/**
 * StreakScoreRow Component
 * Shows streak count and rez score in a row
 * Extracted from index.tsx
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface StreakScoreRowProps {
  streakCount: number;
  rezScore?: number;
  onStreakPress?: () => void;
  onScorePress?: () => void;
}

export default function StreakScoreRow({
  streakCount,
  rezScore = 0,
  onStreakPress,
  onScorePress
}: StreakScoreRowProps) {
  const router = useRouter();

  const handleStreakPress = onStreakPress ?? (() => router.push('/(tabs)/earn'));
  const handleScorePress = onScorePress ?? (() => router.push('/karma'));

  return (
    <View style={styles.container}>
      {/* Streak Card */}
      <Pressable onPress={handleStreakPress} style={styles.streakCard}>
        <LinearGradient
          colors={['#FF9F1C', '#FFBF69']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakGradient}
        >
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakCount}>{streakCount}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </LinearGradient>
      </Pressable>

      {/* REZ Score Card */}
      <Pressable onPress={handleScorePress} style={styles.scoreCard}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreGradient}
        >
          <Text style={styles.scoreEmoji}>⭐</Text>
          <Text style={styles.scoreCount}>{rezScore}</Text>
          <Text style={styles.scoreLabel}>REZ Score</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    gap: 14,
  },
  streakCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  streakGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  scoreCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  scoreGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  scoreEmoji: {
    fontSize: 32,
  },
  scoreCount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  scoreLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
});
