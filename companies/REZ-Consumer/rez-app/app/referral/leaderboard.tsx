// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useReferral } from '../../hooks/useReferral';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { leaderboard, isLoading, getLeaderboard, stats } = useReferral();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getLeaderboard(20);
  }, [getLeaderboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getLeaderboard(20);
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'diamond': return '#E5E4E2';
      case 'platinum': return '#E5E4E2';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze':
      default: return '#CD7F32';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top Referrers</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Your Rank */}
        <View style={styles.yourRankCard}>
          <Text style={styles.yourRankLabel}>Your Ranking</Text>
          <View style={styles.yourRankRow}>
            <View>
              <Text style={styles.yourRankValue}>
                #{stats?.totalReferrals || 0}
              </Text>
              <Text style={styles.yourRankSubtext}>
                {stats?.qualifiedReferrals || 0} qualified referrals
              </Text>
            </View>
            <View style={styles.yourRankStats}>
              <Text style={styles.yourStatValue}>
                {stats?.conversionRate?.toFixed(0) || 0}%
              </Text>
              <Text style={styles.yourStatLabel}>Conversion</Text>
            </View>
          </View>
        </View>

        {/* Leaderboard List */}
        <View style={styles.leaderboardList}>
          {leaderboard.map((entry, index) => (
            <View
              key={entry.rank || index}
              style={[
                styles.leaderboardItem,
                entry.rank <= 3 && styles.topThreeItem,
              ]}
            >
              <View style={styles.rankSection}>
                <Text style={styles.rankIcon}>{getRankIcon(entry.rank || index + 1)}</Text>
                <View style={styles.userInfo}>
                  <View style={styles.rankBadge}>
                    <Text
                      style={[
                        styles.tierText,
                        { color: getTierColor(entry.tier) },
                      ]}
                    >
                      {entry.tier?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsSection}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{entry.qualifiedReferrals}</Text>
                  <Text style={styles.statLabel}>Qualified</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    ₹{entry.lifetimeEarnings}
                  </Text>
                  <Text style={styles.statLabel}>Earned</Text>
                </View>
              </View>
            </View>
          ))}

          {leaderboard.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>
                Be the first to top the leaderboard!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366F1',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  yourRankCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  yourRankLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  yourRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  yourRankSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  yourRankStats: {
    alignItems: 'flex-end',
  },
  yourStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  yourStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  leaderboardList: {
    padding: 16,
    paddingTop: 0,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  topThreeItem: {
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 40,
    textAlign: 'center',
  },
  userInfo: {
    justifyContent: 'center',
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tierText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
