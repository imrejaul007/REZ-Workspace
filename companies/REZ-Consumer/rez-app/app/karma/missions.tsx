/**
 * Karma Missions Screen
 * Shows active missions with progress and rewards.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { KarmaHeader } from './_layout';
import karmaService, { KarmaMission } from '@/services/karmaService';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const KARMA_PURPLE = '#8B5CF6';
const KARMA_GRADIENT = ['#7C3AED', '#8B5CF6', '#A78BFA'] as const;

const MISSION_CATEGORY_COLORS: Record<string, string> = {
  mission_first_event: '#22C55E',
  mission_10_events: '#3B82F6',
  mission_50_hours: '#F59E0B',
  mission_7_streak: '#EF4444',
};

const MISSION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  mission_first_event: 'ribbon',
  mission_10_events: 'medal',
  mission_50_hours: 'time',
  mission_7_streak: 'flame',
};

function MissionCard({ mission }: { mission: KarmaMission }) {
  const progressPercent = mission.requirement > 0 ? Math.min((mission.progress / mission.requirement) * 100, 100) : 0;
  const accentColor = MISSION_CATEGORY_COLORS[mission.id] ?? KARMA_PURPLE;
  const icon = MISSION_ICONS[mission.id] ?? 'star';

  return (
    <View style={styles.missionCard}>
      {/* Header */}
      <View style={styles.missionHeader}>
        <View style={[styles.missionIconWrap, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name={icon} size={22} color={accentColor} />
        </View>
        <View style={styles.missionHeaderInfo}>
          <Text style={styles.missionName}>{mission.name}</Text>
          <Text style={styles.missionDesc}>{mission.description}</Text>
        </View>
        {mission.isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          </View>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: accentColor }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>
            {mission.progress} / {mission.requirement}
            {mission.id.includes('hour') ? 'h' : mission.id.includes('streak') ? ' days' : ' events'}
          </Text>
          <Text style={styles.progressPct}>{Math.round(progressPercent)}%</Text>
        </View>
      </View>

      {/* Reward */}
      {mission.reward?.karmaBonus && (
        <View style={styles.rewardRow}>
          <View style={styles.rewardPill}>
            <Ionicons name="star" size={12} color="#FCD34D" />
            <Text style={styles.rewardText}>+{mission.reward.karmaBonus} Karma</Text>
          </View>
          {mission.reward.badgeId && (
            <View style={styles.rewardPill}>
              <Ionicons name="trophy" size={12} color="#8B5CF6" />
              <Text style={styles.rewardText}>Badge</Text>
            </View>
          )}
          {mission.isComplete && (
            <View style={[styles.completePill, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.completePillText, { color: '#22C55E' }]}>Complete</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function MissionEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="compass" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Missions Yet</Text>
      <Text style={styles.emptySub}>Complete your first event to start earning missions</Text>
      <Pressable
        style={styles.exploreBtn}
        onPress={() => {
          // Navigation handled by expo-router
        }}
      >
        <Text style={styles.exploreBtnText}>Explore Events</Text>
      </Pressable>
    </View>
  );
}

function StatsSummary({ missions }: { missions: KarmaMission[] }) {
  const completed = missions.filter((m) => m.isComplete).length;
  const totalKarma = missions.filter((m) => m.isComplete).reduce((sum, m) => sum + (m.reward?.karmaBonus ?? 0), 0);
  const totalRemaining = missions.filter((m) => !m.isComplete).reduce((sum, m) => sum + (m.reward?.karmaBonus ?? 0), 0);

  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{completed}</Text>
        <Text style={styles.statLabel}>Done</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{missions.length - completed}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: '#FCD34D' }]}>+{totalKarma}</Text>
        <Text style={styles.statLabel}>Earned</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: KARMA_PURPLE }]}>+{totalRemaining}</Text>
        <Text style={styles.statLabel}>Available</Text>
      </View>
    </View>
  );
}

function KarmaMissionsScreen() {
  const isMounted = useIsMounted();
  const [missions, setMissions] = useState<KarmaMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchMissions = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError(false);
      try {
        const res = await karmaService.getMissions();
        if (isMounted()) {
          if (res.success && res.data) {
            setMissions(res.data.missions ?? []);
          } else {
            setError(true);
          }
        }
      } catch {
        if (isMounted()) setError(true);
      } finally {
        if (isMounted()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [isMounted],
  );

  useFocusEffect(
    useCallback(() => {
      fetchMissions();
    }, [fetchMissions]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMissions(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="Missions" subtitle="Your Active Goals" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KarmaHeader title="Missions" subtitle="Your Active Goals" showBack />

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
      >
        {/* Stats summary */}
        {missions.length > 0 && <StatsSummary missions={missions} />}

        {/* Mission list */}
        {error || missions.length === 0 ? (
          <MissionEmptyState />
        ) : (
          <View style={styles.missionList}>
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.text.inverse,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 22, fontWeight: '800', color: colors.deepNavy },
  statLabel: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border.default },
  missionList: { paddingHorizontal: Spacing.base, marginTop: Spacing.base, gap: Spacing.md },
  missionCard: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  missionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  missionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  missionHeaderInfo: { flex: 1 },
  missionName: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.deepNavy },
  missionDesc: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  completeBadge: { marginLeft: Spacing.sm },
  progressSection: { marginBottom: Spacing.sm },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary },
  progressPct: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, fontWeight: '600' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: { fontSize: Typography.caption.fontSize, fontWeight: '600', color: '#D97706' },
  completePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completePillText: { fontSize: Typography.caption.fontSize, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl * 2,
  },
  emptyTitle: { ...Typography.h3, marginTop: Spacing.base, color: colors.deepNavy },
  emptySub: { fontSize: Typography.body.fontSize, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },
  exploreBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
  },
  exploreBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
});

export default withErrorBoundary(KarmaMissionsScreen, 'KarmaMissions');
