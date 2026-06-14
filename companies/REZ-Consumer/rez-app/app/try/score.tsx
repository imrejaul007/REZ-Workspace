// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

interface ScoreEvent {
  id: string;
  description: string;
  points: number;
  date: string;
  emoji?: string;
}

interface TierInfo {
  name: string;
  minPoints: number;
  benefits: string[];
  color: string;
  icon: string;
}

const TIER_INFO: Record<string, TierInfo> = {
  curious: {
    name: 'Curious Explorer',
    minPoints: 0,
    benefits: ['Access to trial feed', 'Earn coins on first trials'],
    color: '#3B82F6',
    icon: 'eye-outline',
  },
  explorer: {
    name: 'Seasoned Explorer',
    minPoints: 500,
    benefits: ['Extra coin multiplier', 'Priority access to new trials', 'Exclusive merchant offers'],
    color: '#1a3a52',
    icon: 'compass-outline',
  },
  adventurer: {
    name: 'Adventurer',
    minPoints: 1500,
    benefits: ['2x coin multiplier', 'VIP merchant status', 'Early access to trials', 'Bonus rewards'],
    color: '#FFC857',
    icon: 'rocket-outline',
  },
  pioneer: {
    name: 'Pioneer',
    minPoints: 3500,
    benefits: ['3x coin multiplier', 'Platinum status', 'Exclusive trials', 'Personal merchant connections'],
    color: '#F59E0B',
    icon: 'star-outline',
  },
};

interface ScoreData {
  score: number;
  tier: 'curious' | 'explorer' | 'adventurer' | 'pioneer';
  nextTierPoints: number;
  nextTierName: string;
  stats: {
    categoriesTried: number;
    merchantsDiscovered: number;
    currentStreak: number;
    reviewsGiven: number;
  };
  recentEvents?: Array<{
    id: string;
    description: string;
    points: number;
    date: string;
    emoji?: string;
  }>;
  leaderboardPercentile?: number;
  leaderboardCity?: string;
}

export default function ExplorerScoreScreen() {
  const router = useRouter();
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScoreData = async () => {
      try {
        const data = await tryApi.getScore();
        setScoreData(data);
      } catch (err) {
        if (__DEV__) logger.error('Failed to load score data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadScoreData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  if (!scoreData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load score data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tierInfo = TIER_INFO[scoreData.tier];
  const progressPercentage =
    ((scoreData.score - tierInfo.minPoints) / (scoreData.nextTierPoints - tierInfo.minPoints)) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Explorer Score</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Card */}
        <LinearGradient
          colors={[tierInfo.color, `${tierInfo.color}dd`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.scoreCard}
        >
          <View style={styles.scoreContent}>
            <View>
              <Text style={styles.scoreLabel}>Your Score</Text>
              <Text style={styles.scoreValue}>{scoreData.score}</Text>
              <Text style={styles.scoreSubtext}>points</Text>
            </View>
            <View style={styles.tierBadge}>
              <Ionicons name={tierInfo.icon} size={32} color="#fff" />
            </View>
          </View>

          {/* Tier Badge */}
          <View style={styles.tierNameBox}>
            <Text style={styles.tierName}>{tierInfo.name}</Text>
          </View>
        </LinearGradient>

        {/* Tier Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress to Next Tier</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={[tierInfo.color, `${tierInfo.color}aa`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.min(progressPercentage, 100)}%` }]}
              />
            </View>
          </View>

          {/* Tier Info */}
          <View style={styles.tierInfoBox}>
            <View style={styles.tierInfoRow}>
              <Text style={styles.tierInfoLabel}>Current Points</Text>
              <Text style={styles.tierInfoValue}>{scoreData.score}</Text>
            </View>
            <View style={styles.tierInfoDivider} />
            <View style={styles.tierInfoRow}>
              <Text style={styles.tierInfoLabel}>Points to Next Tier</Text>
              <Text style={styles.tierInfoValue}>{scoreData.nextTierPoints - scoreData.score}</Text>
            </View>
          </View>

          {/* Next Tier Info */}
          {(() => {
            const getNextTierKey = (currentTier: string): string => {
              if (currentTier === 'curious') return 'explorer';
              if (currentTier === 'explorer') return 'adventurer';
              if (currentTier === 'adventurer') return 'pioneer';
              return 'pioneer';
            };
            const nextTierKey = getNextTierKey(scoreData.tier);
            const nextTierInfo = TIER_INFO[nextTierKey];
            return (
              <View style={styles.nextTierCard}>
                <Ionicons name={nextTierInfo.icon} size={24} color={nextTierInfo.color} />
                <View style={styles.nextTierInfo}>
                  <Text style={styles.nextTierLabel}>Next Tier</Text>
                  <Text style={styles.nextTierName}>{nextTierInfo.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </View>
            );
          })()}
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color={colors.brand.purple} />
              <Text style={styles.statValue}>{scoreData.stats.categoriesTried}</Text>
              <Text style={styles.statLabel}>Categories</Text>
              <Text style={styles.statSublabel}>Tried</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="location" size={24} color={colors.brand.orange} />
              <Text style={styles.statValue}>{scoreData.stats.merchantsDiscovered}</Text>
              <Text style={styles.statLabel}>Merchants</Text>
              <Text style={styles.statSublabel}>Discovered</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={colors.warningScale[500]} />
              <Text style={styles.statValue}>{scoreData.stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Day</Text>
              <Text style={styles.statSublabel}>Streak</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color={colors.brand.goldAccent} />
              <Text style={styles.statValue}>{scoreData.stats.reviewsGiven}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
              <Text style={styles.statSublabel}>Given</Text>
            </View>
          </View>
        </View>

        {/* Tier Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Tier Benefits</Text>
          {tierInfo.benefits.map((benefit, idx) => (
            <View key={idx} style={styles.benefitItem}>
              <View style={[styles.benefitCheck, { backgroundColor: `${tierInfo.color}20` }]}>
                <Ionicons name="checkmark" size={16} color={tierInfo.color} />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Recent Events */}
        {scoreData.recentEvents && scoreData.recentEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <FlashList
              scrollEnabled={false}
              data={scoreData.recentEvents.slice(0, 10)}
              renderItem={({ item }: { item: ScoreEvent }) => (
                <View style={styles.eventItem}>
                  <View style={styles.eventEmoji}>
                    <Text style={styles.emojiText}>{item.emoji || '✨'}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventDesc}>{item.description}</Text>
                    <Text style={styles.eventDate}>{item.date}</Text>
                  </View>
                  <Text style={[styles.eventPoints, { color: tierInfo.color }]}>+{item.points}</Text>
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.eventsList}
              estimatedItemSize={60}
            />
          </View>
        )}

        {/* My Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Badges</Text>
            <Pressable onPress={() => router.push('/try/badges')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </Pressable>
          </View>
          <View style={styles.badgesPreview}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.badgeChip}>
                <Text style={styles.badgeEmoji}>🥇</Text>
              </View>
            ))}
          </View>
        </View>

        {/* This Week's Mission */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>This Week's Mission</Text>
            <Pressable onPress={() => router.push('/try/missions')}>
              <Text style={styles.viewAllLink}>View All →</Text>
            </Pressable>
          </View>
          <View style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle} numberOfLines={1}>
                Try 3 cafes this weekend
              </Text>
              <Text style={styles.missionReward}>+200 🪙</Text>
            </View>
            <View style={styles.missionProgress}>
              <View style={styles.missionProgressBar}>
                <View style={[styles.missionProgressFill, { width: '66%' }]} />
              </View>
              <Text style={styles.missionProgressText}>2 / 3 completed</Text>
            </View>
          </View>
        </View>

        {/* Weekly Surprise */}
        <View style={styles.section}>
          <Pressable style={styles.surpriseCard} onPress={() => router.push('/try/surprise')}>
            <Text style={styles.surpriseEmoji}>🎁</Text>
            <View style={styles.surpriseContent}>
              <Text style={styles.surpriseLabel}>Weekly Surprise</Text>
              <Text style={styles.surpriseText}>Surprise awaits</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.brand.purple} />
          </Pressable>
        </View>

        {/* Leaderboard Teaser */}
        {scoreData.leaderboardPercentile && (
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <Ionicons name="podium" size={24} color={colors.brand.goldAccent} />
              <View>
                <Text style={styles.leaderboardLabel}>Leaderboard Rank</Text>
                <Text style={styles.leaderboardText}>
                  Top {scoreData.leaderboardPercentile}% in {scoreData.leaderboardCity || 'your city'}
                </Text>
              </View>
            </View>
            <Pressable style={styles.leaderboardButton} onPress={() => router.push('/try/leaderboard')}>
              <Text style={styles.leaderboardButtonText}>View Leaderboard →</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header - Modern glass
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },

  // Score Card - Premium gradient
  scoreCard: {
    borderRadius: 24,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 6 },
    }),
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
    letterSpacing: -2,
  },
  scoreSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  tierBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierNameBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  tierName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // Section
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },

  // Progress - Clean bar
  progressContainer: {
    gap: spacing.md,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  tierInfoBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  tierInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierInfoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  tierInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  tierInfoDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  nextTierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    marginTop: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  nextTierInfo: {
    flex: 1,
  },
  nextTierLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  nextTierName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },

  // Stats Grid - Premium cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statSublabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },

  // Benefits - Clean list
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  benefitCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },

  // Events - Premium list
  eventsList: {
    gap: spacing.md,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  eventEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  eventInfo: {
    flex: 1,
  },
  eventDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  eventDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  eventPoints: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Leaderboard - Premium card
  leaderboardCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  leaderboardLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  leaderboardText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  leaderboardButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  leaderboardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Badges - Premium chips
  badgesPreview: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  badgeChip: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#6366F1',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  badgeEmoji: {
    fontSize: 24,
  },

  // Mission Card - Clean design
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  missionReward: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: 'rgba(99,102,241,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 10,
  },
  missionProgress: {
    gap: spacing.sm,
  },
  missionProgressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  missionProgressText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Surprise Card - Premium
  surpriseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.2)',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  surpriseEmoji: {
    fontSize: 28,
  },
  surpriseContent: {
    flex: 1,
    gap: spacing.xs,
  },
  surpriseLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  surpriseText: {
    fontSize: 13,
    color: colors.text.secondary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
});
