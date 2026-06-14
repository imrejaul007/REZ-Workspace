import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Achievements Gallery — Sprint 11
// Grid of all achievements with unlock status, progress, and share

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  SafeAreaView,
  RefreshControl,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import apiClient from '@/services/apiClient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.md) / 2;

// ============================================================================
// TYPES
// ============================================================================

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  icon?: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// ============================================================================
// HARDCODED FALLBACK (7 gamification service achievements)
// ============================================================================

const FALLBACK_ACHIEVEMENTS: Achievement[] = [
  {
    achievementId: 'first_checkin',
    name: 'First Check-in',
    description: 'Complete your very first store check-in',
    icon: '🏆',
    progress: 0,
    maxProgress: 1,
  },
  {
    achievementId: 'first_5_checkins',
    name: 'Regular',
    description: 'Check in at 5 different stores',
    icon: '⭐',
    progress: 0,
    maxProgress: 5,
  },
  {
    achievementId: 'first_10_checkins',
    name: 'Loyal Customer',
    description: 'Check in at 10 different stores',
    icon: '🌟',
    progress: 0,
    maxProgress: 10,
  },
  {
    achievementId: 'streak_3',
    name: '3-Day Streak',
    description: 'Check in 3 days in a row',
    icon: '🔥',
    progress: 0,
    maxProgress: 3,
  },
  {
    achievementId: 'streak_7',
    name: 'Week Warrior',
    description: 'Check in 7 days in a row',
    icon: '🔥',
    progress: 0,
    maxProgress: 7,
  },
  {
    achievementId: 'coins_100',
    name: 'Century',
    description: 'Earn 100 REZ coins',
    icon: '💰',
    progress: 0,
    maxProgress: 100,
  },
  {
    achievementId: 'coins_1000',
    name: 'High Roller',
    description: 'Earn 1,000 REZ coins',
    icon: '👑',
    progress: 0,
    maxProgress: 1000,
  },
];

const ACHIEVEMENT_EMOJIS: Record<string, string> = {
  first_checkin: '🏆',
  first_5_checkins: '⭐',
  first_10_checkins: '🌟',
  streak_3: '🔥',
  streak_7: '🔥',
  coins_100: '💰',
  coins_1000: '👑',
};

// ============================================================================
// HELPERS
// ============================================================================

function formatUnlockDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ============================================================================
// SCREEN
// ============================================================================

function AchievementsGalleryScreen() {
  const router = useRouter();

  const {
    data: apiAchievements,
    isLoading,
    isError,
    refetch,
  } = useQuery<Achievement[]>({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      const res = await apiClient.get<Achievement[]>('/user/achievements');
      if (!res.success || !res.data) throw new Error('Not found');
      return res.data;
    },
    retry: 1,
    staleTime: 2 * 60_000,
  });

  const achievements: Achievement[] =
    apiAchievements && apiAchievements.length > 0 ? apiAchievements : FALLBACK_ACHIEVEMENTS;

  const unlockedCount = achievements.filter((a) => !!a.unlockedAt).length;

  const handleShare = useCallback(async (achievement: Achievement) => {
    try {
      await Share.share({
        message: `I just unlocked '${achievement.name}' on REZ! 🏆 Download REZ and earn rewards: https://rez.money`,
      });
    } catch {
      // user cancelled
    }
  }, []);

  const renderCard = (achievement: Achievement) => {
    const isUnlocked = !!achievement.unlockedAt;
    const emoji =
      achievement.icon && achievement.icon.length <= 4
        ? achievement.icon
        : (ACHIEVEMENT_EMOJIS[achievement.achievementId] ?? '🎯');
    const progress = achievement.progress ?? 0;
    const maxProgress = achievement.maxProgress ?? 1;
    const progressPct = Math.min(Math.round((progress / maxProgress) * 100), 100);

    return (
      <View key={achievement.achievementId} style={[styles.card, !isUnlocked && styles.cardLocked]}>
        {/* Icon */}
        <View style={[styles.emojiContainer, isUnlocked && styles.emojiContainerUnlocked]}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>

        {/* Name */}
        <ThemedText style={[styles.cardName, !isUnlocked && styles.cardNameLocked]} numberOfLines={2}>
          {achievement.name}
        </ThemedText>

        {/* Description */}
        <ThemedText style={styles.cardDescription} numberOfLines={2}>
          {achievement.description}
        </ThemedText>

        {/* Progress bar (only when locked and maxProgress > 1) */}
        {!isUnlocked && maxProgress > 1 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <ThemedText style={styles.progressText}>
              {progress}/{maxProgress}
            </ThemedText>
          </View>
        )}

        {/* Unlocked date */}
        {isUnlocked && achievement.unlockedAt && (
          <View style={styles.unlockedRow}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
            <ThemedText style={styles.unlockedText}>Unlocked {formatUnlockDate(achievement.unlockedAt)}</ThemedText>
          </View>
        )}

        {/* Share button for unlocked */}
        {isUnlocked && (
          <Pressable
            style={styles.shareButton}
            onPress={() => handleShare(achievement)}
            accessibilityLabel={`Share ${achievement.name} achievement`}
            accessibilityRole="button"
          >
            <Ionicons name="share-social-outline" size={14} color={colors.primary[300]} />
            <ThemedText style={styles.shareButtonText}>Share</ThemedText>
          </Pressable>
        )}
      </View>
    );
  };

  const rows: Achievement[][] = [];
  for (let i = 0; i < achievements.length; i += 2) {
    rows.push(achievements.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[400]} translucent={false} />

      {/* Header */}
      <LinearGradient colors={[Colors.gold, colors.nileBlue ?? '#1a3a52']} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <View style={styles.headerTextContainer}>
            <ThemedText style={styles.headerTitle}>Achievements</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              {unlockedCount} of {achievements.length} unlocked
            </ThemedText>
          </View>

          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[300]} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary[300]}
              colors={[colors.primary[300]]}
            />
          }
        >
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(renderCard)}
            </View>
          ))}
          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  headerSubtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLocked: {
    opacity: 0.55,
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  emojiContainerUnlocked: {
    backgroundColor: '#FFF9E6',
  },
  emoji: {
    fontSize: 28,
  },
  cardName: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  cardNameLocked: {
    color: colors.text.tertiary,
  },
  cardDescription: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 5,
    backgroundColor: colors.border.default,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[300],
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
  unlockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  unlockedText: {
    ...Typography.caption,
    color: Colors.gold,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: BorderRadius.sm,
  },
  shareButtonText: {
    ...Typography.caption,
    color: colors.primary[300],
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});

export default withErrorBoundary(AchievementsGalleryScreen, 'AchievementsGallery');
