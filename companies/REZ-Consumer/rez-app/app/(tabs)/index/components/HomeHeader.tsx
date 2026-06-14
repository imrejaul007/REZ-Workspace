// @ts-nocheck
/**
 * HomeHeader Component
 * Header with location, streak, and actions
 * Extracted from index.tsx
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface HomeHeaderProps {
  streakCount: number;
  isDark?: boolean;
  themeColors?: Record<string, string>;
}

export default function HomeHeader({ streakCount, isDark, themeColors }: HomeHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, isDark && themeColors && { backgroundColor: themeColors.card || themeColors.primary || colors.background.primary }]}>
      <View style={styles.headerTop}>
        {/* Location Button */}
        <Pressable style={styles.locationButton}>
          <View style={styles.locationIconWrapper}>
            <Ionicons name="location" size={12} color={colors.text.inverse} />
          </View>
          <Text style={styles.locationText}>Select Location</Text>
          <Text style={styles.locationChevron}>⌄</Text>
        </Pressable>

        {/* Header Actions */}
        <View style={styles.headerActions}>
          {/* Streak Pill */}
          {streakCount > 0 && (
            <Pressable
              onPress={() => router.push('/(tabs)/earn' as unknown)}
              style={styles.headerStreakPill}
            >
              <Text style={styles.headerStreakEmoji}>🔥</Text>
              <Text style={styles.headerStreakText}>{streakCount}</Text>
            </Pressable>
          )}

          {/* Coin Balance */}
          <Pressable onPress={() => router.push('/wallet-screen')} style={styles.headerCoin}>
            <Ionicons name="wallet-outline" size={20} color={colors.text.primary} />
          </Pressable>

          {/* Cart */}
          <Pressable onPress={() => router.push('/cart')} style={styles.headerCart}>
            <Ionicons name="cart-outline" size={20} color={colors.text.primary} />
          </Pressable>

          {/* Notifications */}
          <Pressable onPress={() => router.push('/account/notification-history' as unknown)} style={styles.headerNotification}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
          </Pressable>

          {/* Profile */}
          <Pressable onPress={() => router.push('/profile')} style={styles.headerProfile}>
            <Ionicons name="person-circle-outline" size={24} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,178,60,.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  locationChevron: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,40,.82)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  headerStreakEmoji: {
    fontSize: 12,
  },
  headerStreakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  headerCoin: {
    padding: spacing.xs,
  },
  headerCart: {
    padding: spacing.xs,
  },
  headerNotification: {
    padding: spacing.xs,
  },
  headerProfile: {
    padding: spacing.xs,
  },
});
