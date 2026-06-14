import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { tryApi } from '@/services/tryApi';
import { logger } from '@/utils/logger';

type Period = 'weekly' | 'monthly' | 'alltime';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  trialCount: number;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number;
  userScore: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'This Week',
  monthly: 'This Month',
  alltime: 'All Time',
};

const MEDAL_EMOJIS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('weekly');
  const [city, setCity] = useState('Mumbai');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tryApi.getLeaderboard(city, period);
      setLeaderboard(data);
    } catch (err) {
      if (__DEV__) logger.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [city, period]);

  useEffect(() => {
    loadLeaderboard();
  }, [period, city, loadLeaderboard]);

  // Refresh data when navigating back to this screen
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      loadLeaderboard();
    }, [loadLeaderboard]),
  );

  const renderPodium = () => {
    if (!leaderboard || !leaderboard.entries || leaderboard.entries.length === 0) return null;

    const top3 = leaderboard.entries.slice(0, 3);

    return (
      <View style={styles.podiumContainer}>
        {/* Second Place (Left) */}
        {top3.length >= 2 && (
          <View style={styles.podiumPosition}>
            <View style={[styles.podiumMedal, styles.podiumSecond]}>
              <Text style={styles.medalEmoji}>{MEDAL_EMOJIS[2]}</Text>
            </View>
            <View style={styles.podiumContent}>
              <Text style={styles.podiumName} numberOfLines={1}>
                {top3[1].name}
              </Text>
              <Text style={styles.podiumScore}>{top3[1].score} pts</Text>
              <Text style={styles.podiumTrials}>{top3[1].trialCount} trials</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumSecondBar]} />
          </View>
        )}

        {/* First Place (Center) */}
        {top3.length >= 1 && (
          <View style={styles.podiumPosition}>
            <View style={[styles.podiumMedal, styles.podiumFirst]}>
              <Text style={styles.medalEmoji}>{MEDAL_EMOJIS[1]}</Text>
            </View>
            <View style={styles.podiumContent}>
              <Text style={styles.podiumName} numberOfLines={1}>
                {top3[0].name}
              </Text>
              <Text style={styles.podiumScore}>{top3[0].score} pts</Text>
              <Text style={styles.podiumTrials}>{top3[0].trialCount} trials</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumFirstBar]} />
          </View>
        )}

        {/* Third Place (Right) */}
        {top3.length >= 3 && (
          <View style={styles.podiumPosition}>
            <View style={[styles.podiumMedal, styles.podiumThird]}>
              <Text style={styles.medalEmoji}>{MEDAL_EMOJIS[3]}</Text>
            </View>
            <View style={styles.podiumContent}>
              <Text style={styles.podiumName} numberOfLines={1}>
                {top3[2].name}
              </Text>
              <Text style={styles.podiumScore}>{top3[2].score} pts</Text>
              <Text style={styles.podiumTrials}>{top3[2].trialCount} trials</Text>
            </View>
            <View style={[styles.podiumBar, styles.podiumThirdBar]} />
          </View>
        )}
      </View>
    );
  };

  const renderLeaderboardEntry = ({ item }: { item: LeaderboardEntry }) => {
    const isMedal = item.rank <= 3;
    const medal = MEDAL_EMOJIS[item.rank];

    return (
      <View style={[styles.entry, item.isCurrentUser ? styles.entryHighlighted : null]}>
        <View style={styles.entryRank}>
          {isMedal ? <Text style={styles.medal}>{medal}</Text> : <Text style={styles.rankNumber}>#{item.rank}</Text>}
        </View>

        <View style={styles.entryInfo}>
          <Text style={[styles.entryName, item.isCurrentUser ? styles.entryNameHighlighted : null]} numberOfLines={1}>
            {item.isCurrentUser ? `${item.name} (You)` : item.name}
          </Text>
          <Text style={styles.entryTrials}>{item.trialCount} trials</Text>
        </View>

        <View style={styles.entryScore}>
          <Text style={[styles.score, item.isCurrentUser ? styles.scoreHighlighted : null]}>{item.score}</Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>City Explorer Leaderboard</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.purple} />
        </View>
      </SafeAreaView>
    );
  }

  const remainingEntries = leaderboard?.entries.slice(3) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>City Explorer Leaderboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlashList
        data={remainingEntries}
        renderItem={renderLeaderboardEntry}
        keyExtractor={(item) => `${item.rank}-${item.name}`}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        ListHeaderComponent={
          <>
            {/* City Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.citySelector}
              contentContainerStyle={styles.citySelectorContent}
            >
              {['Mumbai', 'Delhi', 'Bangalore', 'Pune'].map((c) => (
                <Pressable
                  key={c}
                  style={[styles.cityChip, city === c ? styles.cityChipActive : null]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.cityChipText, city === c ? styles.cityChipTextActive : null]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Period Tabs */}
            <View style={styles.periodTabs}>
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <Pressable
                  key={p}
                  style={[styles.periodTab, period === p ? styles.periodTabActive : null]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodTabText, period === p ? styles.periodTabTextActive : null]}>
                    {PERIOD_LABELS[p]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Podium */}
            {renderPodium()}

            {/* User Rank (if not in top 3) */}
            {leaderboard && leaderboard.userRank > 3 && (
              <View style={[styles.entry, styles.entryHighlighted, styles.userRankCard]}>
                <View style={styles.entryRank}>
                  <Text style={styles.rankNumber}>#{leaderboard.userRank}</Text>
                </View>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, styles.entryNameHighlighted]}>Your rank</Text>
                </View>
                <View style={styles.entryScore}>
                  <Text style={[styles.score, styles.scoreHighlighted]}>{leaderboard.userScore}</Text>
                </View>
              </View>
            )}

            <Text style={styles.moreLabel}>More Explorers</Text>
          </>
        }
        estimatedItemSize={72}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  citySelector: {
    marginBottom: spacing.lg,
  },
  citySelectorContent: {
    gap: spacing.sm,
  },
  cityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cityChipActive: {
    backgroundColor: colors.brand.purple,
    borderColor: colors.brand.purple,
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cityChipTextActive: {
    color: '#fff',
  },
  periodTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  periodTab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  periodTabActive: {
    borderBottomColor: colors.brand.purple,
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  periodTabTextActive: {
    color: colors.brand.purple,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  podiumPosition: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  podiumMedal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
  },
  podiumFirst: {
    borderColor: '#FFD700',
  },
  podiumSecond: {
    borderColor: '#C0C0C0',
  },
  podiumThird: {
    borderColor: '#CD7F32',
  },
  medalEmoji: {
    fontSize: 28,
  },
  podiumContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    maxWidth: 80,
  },
  podiumScore: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  podiumTrials: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: borderRadius.sm,
  },
  podiumFirstBar: {
    height: 80,
    backgroundColor: '#FFD70033',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  podiumSecondBar: {
    height: 60,
    backgroundColor: '#C0C0C033',
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  podiumThirdBar: {
    height: 40,
    backgroundColor: '#CD7F3233',
    borderWidth: 1,
    borderColor: '#CD7F32',
  },
  userRankCard: {
    marginBottom: spacing.lg,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  entryHighlighted: {
    backgroundColor: colors.tint.purple,
    borderColor: colors.brand.purple,
  },
  entryRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  medal: {
    fontSize: 20,
  },
  entryInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  entryNameHighlighted: {
    fontWeight: '700',
    color: colors.brand.purple,
  },
  entryTrials: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  entryScore: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  score: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scoreHighlighted: {
    color: colors.brand.purple,
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  moreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
