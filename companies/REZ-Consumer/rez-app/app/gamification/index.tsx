// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CardGridSkeleton } from '@/components/skeletons';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '@/services/apiClient';
import { useRezBalance, useRefreshWallet } from '@/stores/selectors';
import coinSyncService from '@/services/coinSyncService';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useStreakShield } from '@/hooks/useStreakShield';

function GamificationDashboard() {
  const coinBalance = useRezBalance();
  const refreshWallet = useRefreshWallet();
  const isMounted = useIsMounted();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'achievements' | 'leaderboards'>('challenges');

  const [challenges, setChallenges] = useState<unknown[]>([]);
  const [achievements, setAchievements] = useState<unknown[]>([]);
  const [streaks, setStreaks] = useState<unknown>({});
  const [stats, setStats] = useState<unknown>({});
  const [shieldUsedFeedback, setShieldUsedFeedback] = useState(false);

  const { shieldAvailable, shieldFn, isLoading: shieldLoading } = useStreakShield();

  const handleUseShield = async () => {
    const success = await shieldFn();
    if (success) {
      setShieldUsedFeedback(true);
      setTimeout(() => setShieldUsedFeedback(false), 2500);
    }
  };

  useEffect(() => {
    loadGamificationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);

      const [challengesRes, achievementsRes, streaksRes, statsRes] = await Promise.all([
        apiClient.get('/gamification/challenges/my-progress'),
        apiClient.get('/gamification/achievements'),
        apiClient.get('/gamification/streaks'),
        apiClient.get('/gamification/stats'),
      ]);

      if (!isMounted()) return;
      setChallenges((challengesRes.data as unknown)?.data || []);
      if (!isMounted()) return;
      setAchievements((achievementsRes.data as unknown)?.data || []);
      if (!isMounted()) return;
      setStreaks((streaksRes.data as unknown)?.data || {});
      if (!isMounted()) return;
      setStats((statsRes.data as unknown)?.data || {});

      // Refresh wallet balance via context
      await refreshWallet();
    } catch (error) {
      // silently handle
    } finally {
      if (!isMounted()) return;
      setLoading(false);
      if (!isMounted()) return;
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGamificationData();
  };

  const handleClaimChallenge = async (challengeId: string) => {
    try {
      const response = await apiClient.post(`/gamification/challenges/${challengeId}/claim`);

      // apiClient wraps responses: check response.success or nested response.data.success
      const responseData = (response as unknown).success ? response : (response.data as unknown);
      if (responseData?.success) {
        const coinsEarned = responseData?.data?.rewards?.coins ?? responseData?.data?.coins ?? 0;

        const syncResult = await coinSyncService.handleChallengeReward(
          challengeId,
          responseData?.data?.challenge?.title || 'Challenge',
          coinsEarned,
        );

        if (syncResult.success) {
          platformAlertSimple(
            'Reward Claimed',
            `Claimed ${coinsEarned} coins! New balance: ${syncResult.newWalletBalance}`,
          );
        } else {
          platformAlertSimple('Reward Claimed', `Claimed ${coinsEarned} coins!`);
        }

        // Refresh wallet balance via context + reload gamification data
        await refreshWallet();
        loadGamificationData();
      }
    } catch (error) {
      platformAlertSimple('Error', error.response?.data?.message || 'Failed to claim rewards');
    }
  };

  if (loading) {
    return <CardGridSkeleton />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.brand.purpleLight} />
        }
      >
        {/* Modern Gradient Header */}
        <LinearGradient
          colors={[colors.brand.purpleLight, colors.brand.purple, colors.brand.purpleDeep]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Gamification Hub</Text>
              <Text style={styles.subtitle}>Complete challenges, earn rewards!</Text>
            </View>
            <Pressable style={styles.coinsBadge} onPress={() => router.push('/wallet-screen' as unknown as string)}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                style={styles.coinsBadgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={24} color={colors.brand.goldBright} />
                <Text style={styles.coinsText}>{coinBalance.toLocaleString()}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Modern Streak Section */}
        <View style={styles.streakContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Streaks</Text>
            <Ionicons name="flame" size={24} color="#FF6B6B" />
          </View>
          <View style={styles.streakRow}>
            {Object.entries(streaks).map(([type, data]: [string, unknown]) => (
              <View key={type} style={styles.streakCard}>
                <LinearGradient
                  colors={
                    type === 'login'
                      ? ['#667EEA', '#764BA2']
                      : type === 'order'
                        ? ['#F093FB', '#F5576C']
                        : ['#4FACFE', '#00F2FE']
                  }
                  style={styles.streakGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.streakIconContainer}>
                    <Text style={styles.streakIcon}>{type === 'login' ? '📅' : type === 'order' ? '🛒' : '⭐'}</Text>
                  </View>
                  <Text style={styles.streakCount}>{data.current}</Text>
                  <Text style={styles.streakLabel}>{type}</Text>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>+{data.current} days</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Streak Shield — shown when the order streak is at zero */}
          {(() => {
            const orderStreak = (streaks as unknown)?.order?.current ?? null;
            const streakIsBroken = orderStreak === 0;
            if (!streakIsBroken) return null;
            if (shieldUsedFeedback) {
              return (
                <View style={styles.shieldFeedback}>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                  <Text style={styles.shieldFeedbackText}>Streak Protected!</Text>
                </View>
              );
            }
            if (shieldAvailable) {
              return (
                <Pressable
                  style={styles.shieldBtn}
                  onPress={handleUseShield}
                  disabled={shieldLoading}
                  accessibilityLabel="Use streak shield to protect your streak"
                  accessibilityRole="button"
                >
                  {shieldLoading ? (
                    <ActivityIndicator size="small" color="#92400E" />
                  ) : (
                    <>
                      <Text style={styles.shieldBtnIcon}>🛡️</Text>
                      <Text style={styles.shieldBtnText}>Use Streak Shield</Text>
                    </>
                  )}
                </Pressable>
              );
            }
            return <Text style={styles.shieldResetText}>Shield resets Monday</Text>;
          })()}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
            onPress={() => setActiveTab('challenges')}
          >
            <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>Challenges</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>Achievements</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'leaderboards' && styles.activeTab]}
            onPress={() => setActiveTab('leaderboards')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboards' && styles.activeTabText]}>Leaderboards</Text>
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === 'challenges' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Active Challenges</Text>
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge._id} challenge={challenge} onClaim={handleClaimChallenge} />
            ))}

            {challenges.length === 0 && <Text style={styles.emptyText}>No active challenges</Text>}
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            {achievements.slice(0, 10).map((achievement) => (
              <AchievementCard key={achievement._id} achievement={achievement} />
            ))}

            <Pressable style={styles.viewAllButton} onPress={() => router.push('/badges' as unknown as string)}>
              <Text style={styles.viewAllText}>View All Achievements</Text>
            </Pressable>
          </View>
        )}

        {activeTab === 'leaderboards' && (
          <View style={styles.content}>
            <Pressable
              style={styles.leaderboardCard}
              onPress={() => router.push('/playandearn/leaderboard' as unknown as string)}
            >
              <Ionicons name="trophy" size={24} color={colors.brand.goldBright} />
              <Text style={styles.leaderboardTitle}>View Leaderboards</Text>
              <Ionicons name="chevron-forward" size={24} color={colors.midGray} />
            </Pressable>
          </View>
        )}

        {/* Modern Mini Games Section */}
        <View style={styles.quickAccess}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mini Games</Text>
            <Ionicons name="game-controller" size={24} color={colors.brand.purpleLight} />
          </View>
          <View style={styles.gameRow}>
            <Pressable style={styles.gameCard} onPress={() => router.push('/games/spin-wheel' as unknown as string)}>
              <LinearGradient
                colors={['#FF6B6B', '#EE5A6F']}
                style={styles.gameGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gameIconBg}>
                  <Text style={styles.gameIcon}>🎡</Text>
                </View>
                <Text style={styles.gameTitle}>Spin Wheel</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.gameCard} onPress={() => router.push('/scratch-card' as unknown as string)}>
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.gameGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gameIconBg}>
                  <Text style={styles.gameIcon}>🎫</Text>
                </View>
                <Text style={styles.gameTitle}>Scratch Card</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.gameCard} onPress={() => router.push('/games/quiz' as unknown as string)}>
              <LinearGradient
                colors={['#A8E6CF', '#88D4AB']}
                style={styles.gameGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gameIconBg}>
                  <Text style={styles.gameIcon}>🧠</Text>
                </View>
                <Text style={styles.gameTitle}>Quiz</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function ChallengeCard({ challenge, onClaim }) {
  const progress = (challenge.progress / challenge.target) * 100;
  const isCompleted = challenge.completed;
  const canClaim = isCompleted && !challenge.rewardsClaimed;

  return (
    <View style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <Text style={styles.challengeIcon}>{challenge.challenge?.icon || '🎯'}</Text>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{challenge.challenge?.title}</Text>
          <Text style={styles.challengeDesc}>{challenge.challenge?.description}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {challenge.progress}/{challenge.target}
        </Text>
      </View>

      {/* Rewards */}
      <View style={styles.rewardsContainer}>
        <Text style={styles.rewardText}>💰 {challenge.challenge?.rewards.coins} coins</Text>
        {canClaim && (
          <Pressable style={styles.claimButton} onPress={() => onClaim(challenge._id)}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </Pressable>
        )}
        {challenge.rewardsClaimed && <Text style={styles.claimedText}>✅ Claimed</Text>}
      </View>
    </View>
  );
}

function AchievementCard({ achievement }) {
  const progress = (achievement.progress / achievement.target) * 100;

  return (
    <View style={styles.achievementCard}>
      <View style={styles.achievementHeader}>
        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDesc}>{achievement.description}</Text>
        </View>
        {achievement.unlocked && <Text style={styles.unlockedBadge}>✅</Text>}
      </View>

      {!achievement.unlocked && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.target}
          </Text>
        </View>
      )}

      <View style={styles.achievementRewards}>
        <Text style={styles.tierBadge}>{achievement.tier.toUpperCase()}</Text>
        <Text style={styles.rewardText}>💰 {achievement.rewards.coins}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    fontWeight: 'bold',
    color: colors.background.primary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: Spacing.xs,
  },
  coinsBadge: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.strong,
  },
  coinsBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  coinsText: {
    ...Typography.h4,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  streakContainer: {
    padding: Spacing.lg,
    backgroundColor: colors.background.primary,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  streakCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.strong,
  },
  streakGradient: {
    padding: Spacing.base,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  streakIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  streakIcon: {
    ...Typography.h1,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.background.primary,
    marginBottom: Spacing.xs,
  },
  streakLabel: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  streakBadgeText: {
    fontSize: 11,
    color: colors.background.primary,
    fontWeight: 'bold',
  },
  shieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.base,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  shieldBtnIcon: {
    fontSize: 18,
  },
  shieldBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  shieldResetText: {
    marginTop: Spacing.base,
    textAlign: 'center',
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  shieldFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.base,
    paddingVertical: 10,
  },
  shieldFeedbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    ...Shadows.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.brand.purpleLight,
  },
  tabText: {
    ...Typography.body,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.brand.purpleLight,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
  },
  challengeCard: {
    backgroundColor: colors.background.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    ...Shadows.medium,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  challengeIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
  },
  challengeDesc: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border.default,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.purpleLight,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginLeft: Spacing.sm,
    minWidth: 50,
    textAlign: 'right',
  },
  rewardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: {
    ...Typography.body,
    color: colors.text.tertiary,
  },
  claimButton: {
    backgroundColor: colors.brand.purpleLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    shadowColor: colors.brand.purpleLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  claimButtonText: {
    color: colors.background.primary,
    fontWeight: 'bold',
  },
  claimedText: {
    color: Colors.gold,
    fontWeight: 'bold',
  },
  achievementCard: {
    backgroundColor: colors.background.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    ...Shadows.medium,
  },
  achievementHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  achievementIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
  },
  achievementDesc: {
    ...Typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  unlockedBadge: {
    ...Typography.h2,
  },
  achievementRewards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.background.primary,
    backgroundColor: colors.brand.purpleLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  leaderboardCard: {
    backgroundColor: colors.background.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.medium,
  },
  leaderboardTitle: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: Spacing.md,
  },
  quickAccess: {
    padding: Spacing.lg,
    backgroundColor: colors.background.primary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  gameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  gameCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.strong,
  },
  gameGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  gameIconBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.full,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  gameIcon: {
    ...Typography.h1,
  },
  gameTitle: {
    ...Typography.body,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.background.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.tertiary,
    padding: Spacing['2xl'],
  },
  viewAllButton: {
    backgroundColor: colors.brand.purpleLight,
    padding: 18,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.base,
    shadowColor: colors.brand.purpleLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewAllText: {
    color: colors.background.primary,
    ...Typography.bodyLarge,
    fontWeight: 'bold' as const,
  },
});

export default withErrorBoundary(GamificationDashboard, 'GamificationIndex');
