// @ts-nocheck
/**
 * WeeklyChallengeScreen
 * Phase 3.3 — Habit Reinforcement
 *
 * Shows:
 * - Current week's challenge(s) with animated progress bars
 * - Reward preview (coins)
 * - Timer showing days left
 * - Past challenges history
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { Spacing, BorderRadius, Typography, Colors } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { platformAlertSimple } from '@/utils/platformAlert';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WeeklyChallenge {
  challenge: {
    _id: string;
    title: string;
    description: string;
    icon: string;
    difficulty: 'easy' | 'medium' | 'hard';
    rewards: { coins: number };
  };
  progress: number;
  target: number;
  progressPct: number;
  completed: boolean;
  rewardsClaimed: boolean;
  daysLeft: number;
}

interface PastChallenge {
  challenge: {
    _id: string;
    title: string;
    icon: string;
    rewards: { coins: number };
  };
  progress: number;
  target: number;
  completed: boolean;
  rewardsClaimed: boolean;
  completedAt?: string;
}

// ---------------------------------------------------------------------------
// API helpers (lazy import pattern matching the codebase)
// ---------------------------------------------------------------------------
async function fetchCurrentChallenges(): Promise<WeeklyChallenge[]> {
  const { default: apiService } = await import('@/services/apiClient');
  const res = (await apiService.get('/gamification/challenges/weekly/current'));
  return (res.data as unknown)?.data ?? res.data ?? [];
}

async function fetchPastChallenges(): Promise<PastChallenge[]> {
  const { default: apiService } = await import('@/services/apiClient');
  const res = (await apiService.get('/gamification/challenges/weekly/history?limit=5'));
  return (res.data as unknown)?.data ?? res.data ?? [];
}

async function claimChallenge(progressId: string): Promise<{ coins: number }> {
  const { default: apiService } = await import('@/services/apiClient');
  const res = (await apiService.post(`/gamification/challenges/weekly/${progressId}/claim`));
  return (res.data as unknown)?.data ?? res.data;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const DIFFICULTY_COLORS = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

function AnimatedProgressBar({ pct }: { pct: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: pct,
      damping: 20,
      stiffness: 120,
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={progressStyles.bar}>
      <Animated.View style={[progressStyles.fill, { width }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  bar: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#1a3a52',
  },
});

function DaysLeftBadge({ days }: { days: number }) {
  const isUrgent = days <= 2;
  return (
    <View style={[daysStyles.badge, { backgroundColor: isUrgent ? '#fef2f2' : '#e8f0f7' }]}>
      <Ionicons name="time" size={12} color={isUrgent ? '#dc2626' : '#1a3a52'} />
      <Text style={[daysStyles.text, { color: isUrgent ? '#dc2626' : '#1a3a52' }]}>
        {days === 0 ? 'Last day!' : `${days}d left`}
      </Text>
    </View>
  );
}

const daysStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  text: { fontSize: 11, fontWeight: '600' },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function WeeklyChallengeScreen() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>([]);
  const [pastChallenges, setPastChallenges] = useState<PastChallenge[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [current, past] = await Promise.allSettled([fetchCurrentChallenges(), fetchPastChallenges()]);
      if (!isMounted()) return;
      if (current.status === 'fulfilled') setChallenges(current.value);
      if (past.status === 'fulfilled') setPastChallenges(past.value);
    } catch {
      // Non-critical
    } finally {
      if (isMounted()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isMounted]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleClaim = useCallback(
    async (item: WeeklyChallenge) => {
      if (!item.challenge._id) return;
      setClaiming(item.challenge._id);
      try {
        const result = await claimChallenge(item.challenge._id);
        platformAlertSimple('Reward Claimed!', `You earned ${result.coins} bonus coins!`);
        await loadData();
      } catch (err) {
        platformAlertSimple('Error', err?.message ?? 'Could not claim reward');
      } finally {
        if (isMounted()) setClaiming(null);
      }
    },
    [isMounted, loadData],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#1a3a52', '#0f2438']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Weekly Challenges</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Complete challenges. Earn up to 200 bonus coins.</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Current challenges */}
        {challenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No challenges this week yet</Text>
            <Text style={styles.emptyBody}>Weekly challenges drop every Monday at 6 AM. Check back soon!</Text>
          </View>
        ) : (
          challenges.map((item) => (
            <View key={item.challenge._id} style={styles.challengeCard}>
              {/* Header row */}
              <View style={styles.challengeTopRow}>
                <View style={styles.challengeIconCircle}>
                  <Text style={styles.challengeIcon}>{item.challenge.icon}</Text>
                </View>
                <View style={styles.challengeInfo}>
                  <View style={styles.challengeTitleRow}>
                    <Text style={styles.challengeTitle} numberOfLines={1}>
                      {item.challenge.title}
                    </Text>
                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor: DIFFICULTY_COLORS[item.challenge.difficulty] + '20',
                        },
                      ]}
                    >
                      <Text style={[styles.difficultyText, { color: DIFFICULTY_COLORS[item.challenge.difficulty] }]}>
                        {item.challenge.difficulty}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.challengeDesc} numberOfLines={2}>
                    {item.challenge.description}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>
                    {item.progress} / {item.target}
                  </Text>
                  <Text style={styles.progressPct}>{item.progressPct}%</Text>
                </View>
                <AnimatedProgressBar pct={item.progressPct} />
              </View>

              {/* Footer: reward + timer + claim */}
              <View style={styles.challengeFooter}>
                <View style={styles.rewardChip}>
                  <Ionicons name="cash" size={14} color="#d97706" />
                  <Text style={styles.rewardText}>{item.challenge.rewards.coins} coins</Text>
                </View>

                <DaysLeftBadge days={item.daysLeft} />

                {item.completed && !item.rewardsClaimed ? (
                  <Pressable
                    style={styles.claimBtn}
                    onPress={() => handleClaim(item)}
                    disabled={claiming === item.challenge._id}
                    accessibilityLabel="Claim reward"
                    accessibilityRole="button"
                  >
                    {claiming === item.challenge._id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.claimBtnText}>Claim</Text>
                    )}
                  </Pressable>
                ) : item.rewardsClaimed ? (
                  <View style={styles.claimedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                    <Text style={styles.claimedText}>Claimed</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}

        {/* Past challenges history */}
        {pastChallenges.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historySectionTitle}>Past Challenges</Text>
            {pastChallenges.map((item, idx) => (
              <View key={idx} style={styles.historyRow}>
                <Text style={styles.historyIcon}>{item.challenge.icon}</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{item.challenge.title}</Text>
                  <Text style={styles.historySubtitle}>
                    {item.progress} / {item.target}
                    {item.completed ? ' • Completed' : ' • Missed'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.historyStatusBadge,
                    {
                      backgroundColor: item.completed ? '#f0fdf4' : '#fef2f2',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={item.completed ? '#16a34a' : '#dc2626'}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h3, fontWeight: '700', color: '#fff' },
  headerSub: { ...Typography.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  content: { padding: Spacing.lg },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { ...Typography.h4, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyBody: { ...Typography.body, color: '#64748b', textAlign: 'center' },

  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  challengeTopRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  challengeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeIcon: { fontSize: 24 },
  challengeInfo: { flex: 1 },
  challengeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  challengeTitle: { flex: 1, ...Typography.body, fontWeight: '700', color: '#1e293b' },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  difficultyText: { fontSize: 11, fontWeight: '600' },
  challengeDesc: { ...Typography.bodySmall, color: '#64748b' },

  progressSection: { marginBottom: 12 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { ...Typography.bodySmall, color: '#475569' },
  progressPct: { ...Typography.bodySmall, color: '#1a3a52', fontWeight: '600' },

  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    flex: 1,
  },
  rewardText: { fontSize: 12, fontWeight: '600', color: '#b45309' },
  claimBtn: {
    backgroundColor: '#1a3a52',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  claimBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimedText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },

  historySection: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  historySectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyIcon: { fontSize: 22 },
  historyInfo: { flex: 1 },
  historyTitle: { ...Typography.body, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  historySubtitle: { ...Typography.bodySmall, color: '#94a3b8' },
  historyStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default withErrorBoundary(WeeklyChallengeScreen, 'WeeklyChallenge');
