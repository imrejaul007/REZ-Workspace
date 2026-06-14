/**
 * Leaderboard Screen
 * Shows karma leaderboards with different scopes and time periods.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from './_layout';
import karmaService, { LeaderboardEntry, LeaderboardResult, UserRankResult } from '@/services/karmaService';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const GOLD_COLOR = '#F59E0B';
const SILVER_COLOR = '#9CA3AF';
const BRONZE_COLOR = '#D97706';

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  L1: { bg: '#DCFCE7', color: '#22C55E' },
  L2: { bg: '#ECFEFF', color: '#06B6D4' },
  L3: { bg: '#FFF1F2', color: '#F43F5E' },
  L4: { bg: '#FEF9C3', color: '#EAB308' },
};

type Scope = 'global' | 'city' | 'cause';
type Period = 'all-time' | 'monthly' | 'weekly';

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'city', label: 'City' },
  { value: 'cause', label: 'Cause' },
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'all-time', label: 'All Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
];

interface RankCardProps {
  rank: number;
  totalParticipants: number;
  percentile?: number;
}

function RankCard({ rank, totalParticipants, percentile }: RankCardProps) {
  const percentileBadge = percentile
    ? percentile <= 10
      ? 'Top 10%'
      : percentile <= 25
        ? 'Top 25%'
        : percentile <= 50
          ? 'Top 50%'
          : null
    : null;

  return (
    <View style={styles.rankCard}>
      <View style={styles.rankLeft}>
        <View style={styles.rankNumberWrap}>
          <Text style={styles.rankNumber}>#{rank}</Text>
        </View>
        <View style={styles.rankInfo}>
          <Text style={styles.rankLabel}>Your Rank</Text>
          <Text style={styles.rankSub}>of {totalParticipants.toLocaleString()} participants</Text>
        </View>
      </View>
      <View style={styles.rankRight}>
        {percentileBadge && (
          <View style={styles.percentileBadge}>
            <Ionicons name="trophy" size={14} color={GOLD_COLOR} />
            <Text style={styles.percentileText}>{percentileBadge}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface TopThreeCardProps {
  entry: LeaderboardEntry;
  position: 1 | 2 | 3;
}

function TopThreeCard({ entry, position }: TopThreeCardProps) {
  const medalColors = {
    1: GOLD_COLOR,
    2: SILVER_COLOR,
    3: BRONZE_COLOR,
  };
  const medalColor = medalColors[position];
  const levelCfg = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.L1;

  return (
    <View style={[styles.topThreeCard, { borderColor: medalColor + '40' }]}>
      {/* Medal */}
      <View style={[styles.medalBadge, { backgroundColor: medalColor + '20' }]}>
        <Ionicons name={position === 1 ? 'trophy' : 'medal'} size={position === 1 ? 28 : 24} color={medalColor} />
      </View>

      {/* Avatar placeholder */}
      <View style={[styles.avatarCircle, { backgroundColor: levelCfg.bg }]}>
        {entry.avatar ? (
          <Text style={[styles.avatarText, { color: levelCfg.color }]}>
            {entry.displayName.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Ionicons name="person" size={24} color={levelCfg.color} />
        )}
      </View>

      {/* Name */}
      <Text style={styles.topThreeName} numberOfLines={1}>
        {entry.displayName}
      </Text>

      {/* Level badge */}
      <View style={[styles.levelBadge, { backgroundColor: levelCfg.bg }]}>
        <Text style={[styles.levelText, { color: levelCfg.color }]}>{entry.level}</Text>
      </View>

      {/* Karma score */}
      <Text style={[styles.topThreeKarma, { color: medalColor }]}>{entry.karmaScore.toLocaleString()}</Text>
      <Text style={styles.topThreeKarmaLabel}>karma</Text>
    </View>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isLast?: boolean;
}

function LeaderboardRow({ entry, isLast }: LeaderboardRowProps) {
  const levelCfg = LEVEL_COLORS[entry.level] ?? LEVEL_COLORS.L1;

  return (
    <View style={[styles.leaderboardRow, !isLast && styles.leaderboardRowBorder]}>
      {/* Rank */}
      <View style={styles.rowRank}>
        <Text style={styles.rowRankText}>{entry.rank}</Text>
      </View>

      {/* Avatar */}
      <View style={[styles.rowAvatar, { backgroundColor: levelCfg.bg }]}>
        {entry.avatar ? (
          <Text style={[styles.rowAvatarText, { color: levelCfg.color }]}>
            {entry.displayName.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Ionicons name="person" size={18} color={levelCfg.color} />
        )}
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.displayName}
        </Text>
        <View style={styles.rowMeta}>
          <View style={[styles.rowLevelBadge, { backgroundColor: levelCfg.bg }]}>
            <Text style={[styles.rowLevelText, { color: levelCfg.color }]}>{entry.level}</Text>
          </View>
          <Text style={styles.rowEvents}>{entry.eventsCompleted} events</Text>
        </View>
      </View>

      {/* Karma */}
      <View style={styles.rowKarma}>
        <Text style={styles.rowKarmaText}>{entry.karmaScore.toLocaleString()}</Text>
        <Text style={styles.rowKarmaLabel}>karma</Text>
      </View>
    </View>
  );
}

function EmptyLeaderboard() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptySub}>Join events and complete actions to appear on the leaderboard</Text>
    </View>
  );
}

function LeaderboardScreen() {
  const isMounted = useIsMounted();
  const [scope, setScope] = useState<Scope>('global');
  const [period, setPeriod] = useState<Period>('monthly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [userRank, setUserRank] = useState<UserRankResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLeaderboard = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        const [lbRes, rankRes] = await Promise.all([
          karmaService.getLeaderboard(scope, period, 50, 0),
          karmaService.getMyRank(scope, period),
        ]);

        if (isMounted()) {
          if (lbRes.success && lbRes.data) {
            setLeaderboard(lbRes.data);
          }
          if (rankRes.success && rankRes.data) {
            setUserRank(rankRes.data);
          }
        }
      } catch {
        // Silently handle error
      } finally {
        if (isMounted()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [scope, period, isMounted],
  );

  const loadMore = useCallback(async () => {
    if (!leaderboard || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await karmaService.getLeaderboard(scope, period, 50, leaderboard.entries.length);
      if (res.success && res.data) {
        setLeaderboard((prev) => {
          if (!prev) return res.data ?? null;
          return {
            ...prev,
            entries: [...prev.entries, ...res.data!.entries],
          };
        });
      }
    } catch {
      // Silently handle error
    } finally {
      setLoadingMore(false);
    }
  }, [leaderboard, scope, period, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [fetchLeaderboard]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(true);
  };

  const handleScopeChange = (newScope: Scope) => {
    setScope(newScope);
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  // Split top 3 from rest
  const topThree = leaderboard?.entries.slice(0, 3) ?? [];
  const restEntries = leaderboard?.entries.slice(3) ?? [];

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Leaderboard" subtitle="See how you rank" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KarmaHeader title="Leaderboard" subtitle="See how you rank" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[KARMA_PURPLE]}
            tintColor={KARMA_PURPLE}
          />
        }
        onScrollEndDrag={(e) => {
          // Simple infinite scroll detection
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* User Rank Card */}
        {userRank && (
          <View style={styles.rankCardContainer}>
            <RankCard
              rank={userRank.rank}
              totalParticipants={userRank.totalParticipants}
              percentile={userRank.percentile}
            />
          </View>
        )}

        {/* Scope Tabs */}
        <View style={styles.scopeTabs}>
          {SCOPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.scopeTab, scope === option.value && styles.scopeTabActive]}
              onPress={() => handleScopeChange(option.value)}
            >
              <Text style={[styles.scopeTabText, scope === option.value && styles.scopeTabTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {PERIOD_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.periodTab, period === option.value && styles.periodTabActive]}
              onPress={() => handlePeriodChange(option.value)}
            >
              <Text style={[styles.periodTabText, period === option.value && styles.periodTabTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Top 3 */}
        {topThree.length > 0 ? (
          <View style={styles.topThreeContainer}>
            <View style={styles.topThreeRow}>
              {topThree[1] && <TopThreeCard entry={topThree[1]} position={2} />}
              {topThree[0] && <TopThreeCard entry={topThree[0]} position={1} />}
              {topThree[2] && <TopThreeCard entry={topThree[2]} position={3} />}
            </View>
          </View>
        ) : (
          <EmptyLeaderboard />
        )}

        {/* Rest of leaderboard */}
        {restEntries.length > 0 && (
          <View style={styles.leaderboardSection}>
            <Text style={styles.sectionTitle}>Rankings</Text>
            <View style={styles.leaderboardList}>
              {restEntries.map((entry, index) => (
                <LeaderboardRow key={entry.userId} entry={entry} isLast={index === restEntries.length - 1} />
              ))}
            </View>
            {loadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={KARMA_PURPLE} />
              </View>
            )}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },

  // Rank Card
  rankCardContainer: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNumberWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: KARMA_PURPLE,
  },
  rankInfo: {},
  rankLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
  },
  rankSub: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rankRight: {},
  percentileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  percentileText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: '#D97706',
  },

  // Scope Tabs
  scopeTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  scopeTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  scopeTabActive: {
    backgroundColor: KARMA_PURPLE,
  },
  scopeTabText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scopeTabTextActive: {
    color: colors.text.inverse,
  },

  // Period Tabs
  periodTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  periodTab: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  periodTabActive: {
    backgroundColor: '#F5F3FF',
    borderColor: KARMA_PURPLE,
  },
  periodTabText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  periodTabTextActive: {
    color: KARMA_PURPLE,
  },

  // Top Three
  topThreeContainer: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  topThreeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  topThreeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    minHeight: 160,
  },
  medalBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  topThreeName: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    textAlign: 'center',
    maxWidth: '100%',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  topThreeKarma: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  topThreeKarmaLabel: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },

  // Leaderboard List
  leaderboardSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginBottom: Spacing.md,
  },
  leaderboardList: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  leaderboardRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  rowRank: {
    width: 36,
    alignItems: 'center',
  },
  rowRankText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  rowAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rowAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: colors.deepNavy,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  rowLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rowLevelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rowEvents: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  rowKarma: {
    alignItems: 'flex-end',
  },
  rowKarmaText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
  },
  rowKarmaLabel: {
    fontSize: Typography.overline.fontSize,
    color: Colors.textSecondary,
  },
  loadingMore: {
    padding: Spacing.md,
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.base,
    color: colors.deepNavy,
  },
  emptySub: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default withErrorBoundary(LeaderboardScreen, 'Leaderboard');
