/**
 * NBKC Leaderboard Screen
 * Shows ward and global NBKC rankings.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { NBKCHeader } from './_layout';
import * as nbkcService from '@/services/nbkcService';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import type { LeaderboardEntry } from '@/types/entities/nbkc';

const TIER_CONFIG: Record<string, { color: string; bg: string }> = {
  citizen: { color: '#22C55E', bg: '#DCFCE7' },
  active: { color: '#3B82F6', bg: '#DBEAFE' },
  civic_leader: { color: '#8B5CF6', bg: '#EDE9FE' },
  ambassador: { color: '#F59E0B', bg: '#FEF3C7' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <View style={[styles.rankBadge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.rankText, { color: '#D97706' }]}>🥇</Text>
      </View>
    );
  if (rank === 2)
    return (
      <View style={[styles.rankBadge, { backgroundColor: '#F3F4F6' }]}>
        <Text style={[styles.rankText, { color: '#6B7280' }]}>🥈</Text>
      </View>
    );
  if (rank === 3)
    return (
      <View style={[styles.rankBadge, { backgroundColor: '#FFF7ED' }]}>
        <Text style={[styles.rankText, { color: '#C2410C' }]}>🥉</Text>
      </View>
    );
  return (
    <View style={[styles.rankBadge, { backgroundColor: '#F9FAFB' }]}>
      <Text style={styles.rankNum}>{rank}</Text>
    </View>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const tier = TIER_CONFIG[entry.tier] ?? TIER_CONFIG.citizen;

  return (
    <View style={styles.row}>
      <RankBadge rank={entry.rank} />
      <View style={styles.rowMain}>
        <View style={styles.rowTop}>
          <Text style={styles.memberNum}>{entry.memberNumber}</Text>
          <View style={[styles.tierChip, { backgroundColor: tier.bg }]}>
            <Text style={[styles.tierChipText, { color: tier.color }]}>{entry.tier.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.rowStats}>
          <View style={styles.rowStat}>
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text style={styles.rowStatText}>{entry.totalCivicHours.toFixed(1)} hrs</Text>
          </View>
          <View style={styles.rowStat}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#9CA3AF" />
            <Text style={styles.rowStatText}>{entry.missionsCompleted} missions</Text>
          </View>
          {entry.greenBengaluruScore != null && (
            <View style={styles.rowStat}>
              <Ionicons name="leaf-outline" size={12} color="#9CA3AF" />
              <Text style={styles.rowStatText}>{entry.greenBengaluruScore}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default withErrorBoundary(function NBKCLeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scope, setScope] = useState<'global' | 'ward'>('global');

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res =
        scope === 'global' ? await nbkcService.getGlobalLeaderboard(20) : await nbkcService.getWardLeaderboard('', 20);
      if (res.success && res.data) {
        setEntries(res.data);
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [fetchLeaderboard]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  return (
    <View style={styles.container}>
      <NBKCHeader title="Leaderboard" subtitle="NBKC Rankings" showBack />

      {/* Scope Toggle */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, scope === 'global' && styles.toggleBtnActive]}
          onPress={() => setScope('global')}
        >
          <Text style={[styles.toggleBtnText, scope === 'global' && styles.toggleBtnTextActive]}>Global</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, scope === 'ward' && styles.toggleBtnActive]}
          onPress={() => setScope('ward')}
        >
          <Text style={[styles.toggleBtnText, scope === 'ward' && styles.toggleBtnTextActive]}>My Ward</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlashList
          data={entries}
          estimatedItemSize={80}
          contentContainerStyle={{ padding: Spacing.base }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          renderItem={({ item }) => <LeaderboardRow entry={item} />}
          ListHeaderComponent={
            entries.length > 0 ? (
              <View style={styles.topThree}>
                {entries.slice(0, 3).map((entry) => (
                  <View key={entry.memberNumber} style={styles.topCard}>
                    <View style={styles.topAvatar}>
                      <Ionicons name="person" size={24} color="#6B7280" />
                    </View>
                    <RankBadge rank={entry.rank} />
                    <Text style={styles.topMemberNum}>{entry.memberNumber}</Text>
                    <Text style={styles.topHours}>{entry.totalCivicHours.toFixed(0)} hrs</Text>
                  </View>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>Complete missions to appear on the leaderboard</Text>
            </View>
          }
        />
      )}
    </View>
  );
}, 'NBKCLeaderboard');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  toggleBtnActive: { backgroundColor: '#059669' },
  toggleBtnText: { ...Typography.body2, color: '#6B7280' },
  toggleBtnTextActive: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rankBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 18 },
  rankNum: { ...Typography.body2, fontWeight: '700', color: '#6B7280' },
  rowMain: { flex: 1, marginLeft: Spacing.sm },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberNum: { ...Typography.body2, fontWeight: '600', color: colors.text.primary },
  tierChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tierChipText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  rowStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  rowStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowStatText: { ...Typography.bodySmall, color: '#9CA3AF' },
  topThree: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  topCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  topMemberNum: { ...Typography.bodySmall, fontWeight: '600', color: colors.text.primary, marginTop: 2 },
  topHours: { ...Typography.bodySmall, color: '#059669', fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { ...Typography.h4, color: '#9CA3AF', marginTop: Spacing.base },
  emptySubtext: { ...Typography.bodySmall, color: '#D1D5DB', marginTop: 4, textAlign: 'center' },
});
