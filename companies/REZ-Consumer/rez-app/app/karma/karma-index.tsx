/**
 * KarmaScore Index Screen — consumer app
 * Shows the user's 300-900 KarmaScore with all 5 components.
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
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { karmaScoreApi, type KarmaScoreResponse, type ScoreHistoryEntry } from '@/services/karmaScoreApi';
import { KarmaHeader } from './_layout';
import { useIsMounted } from '@/hooks/useIsMounted';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.55, 240);

const BAND_GRADIENTS: Record<string, readonly [string, string, string]> = {
  starter: ['#9CA3AF', '#6B7280', '#4B5563'],
  active: ['#10B981', '#059669', '#047857'],
  performer: ['#3B82F6', '#2563EB', '#1D4ED8'],
  leader: ['#8B5CF6', '#7C3AED', '#6D28D9'],
  elite: ['#F59E0B', '#D97706', '#B45309'],
  pinnacle: ['#EF4444', '#DC2626', '#B91C1C'],
};

const TRUST_GRADE_COLORS: Record<string, string> = {
  S: '#EF4444',
  A: '#F59E0B',
  B: '#3B82F6',
  C: '#6B7280',
  D: '#9CA3AF',
};

const MOMENTUM_ICONS: Record<string, string> = {
  cold: 'snow-outline',
  slow: 'leaf-outline',
  steady: 'trending-up-outline',
  hot: 'flame-outline',
  blazing: 'bonfire-outline',
};

function ScoreCircle({ score, band }: { score: number; band: string }) {
  const gradient = BAND_GRADIENTS[band] ?? BAND_GRADIENTS.starter;
  const maxScore = 900;
  const progress = (score / maxScore) * 100;

  return (
    <View style={styles.circleContainer}>
      <View style={styles.circleOuter}>
        <LinearGradient colors={gradient} style={styles.circleInner}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.maxLabel}>/ 900</Text>
        </LinearGradient>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: gradient[0] }]} />
      </View>
    </View>
  );
}

function ComponentBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={styles.componentRow}>
      <Text style={styles.componentLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.componentValue}>{value}</Text>
    </View>
  );
}

function StreakCard({ streak }: { streak: { current: number; longest: number } | null }) {
  return (
    <View style={styles.streakCard}>
      <Ionicons name="flame" size={20} color="#F59E0B" />
      <Text style={styles.streakText}>{streak?.current ?? 0}-day streak</Text>
      <Text style={styles.streakSub}>Best: {streak?.longest ?? 0}</Text>
    </View>
  );
}

function LeaderboardPreview({ rank, percentile }: { rank: number | null; percentile: number }) {
  if (rank === null) return null;
  return (
    <View style={styles.leaderCard}>
      <View style={styles.leaderRow}>
        <Ionicons name="medal" size={18} color="#F59E0B" />
        <Text style={styles.leaderLabel}>Your Rank</Text>
        <Text style={styles.leaderValue}>#{rank}</Text>
      </View>
      <View style={styles.leaderRow}>
        <Ionicons name="analytics" size={18} color="#3B82F6" />
        <Text style={styles.leaderLabel}>Percentile</Text>
        <Text style={styles.leaderValue}>{percentile.toFixed(1)}%</Text>
      </View>
    </View>
  );
}

export default function KarmaScoreIndex() {
  const [score, setScore] = useState<KarmaScoreResponse | null>(null);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useIsMounted();

  const loadData = useCallback(async () => {
    try {
      const [scoreData, historyData] = await Promise.all([
        karmaScoreApi.getMyScore(),
        karmaScoreApi.getScoreHistory(30),
      ]);
      if (isMounted()) {
        setScore(scoreData);
        setHistory(historyData);
      }
    } catch (err) {
      // non-fatal — score may not exist yet for new users
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, [isMounted]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const band = score?.band ?? 'starter';
  const gradient = BAND_GRADIENTS[band] ?? BAND_GRADIENTS.starter;

  if (loading) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="KarmaScore" subtitle="Your Impact Score" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={gradient[0]} />
        </View>
      </View>
    );
  }

  if (!score) {
    return (
      <View style={styles.container}>
        <KarmaHeader title="KarmaScore" subtitle="Your Impact Score" />
        <View style={styles.emptyState}>
          <Ionicons name="leaf" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Start your journey</Text>
          <Text style={styles.emptySub}>Complete events to earn KarmaPoints</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient} style={styles.heroHeader}>
        <KarmaHeader title="KarmaScore" subtitle={score.bandMeta?.label} />
        <ScoreCircle score={score.display} band={score.band} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={gradient[0]} />}
      >
        {/* Band info */}
        <View style={[styles.bandCard, { backgroundColor: score.bandMeta?.bgColor }]}>
          <Text style={[styles.bandLabel, { color: score.bandMeta?.color }]}>
            {score.bandMeta?.label?.toUpperCase()}
          </Text>
          <Text style={styles.bandRange}>
            {score.bandMeta?.minScore} – {score.bandMeta?.maxScore} points
          </Text>
          {score.bandMeta?.perks?.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={14} color={score.bandMeta?.color} />
              <Text style={styles.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* Component breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          <ComponentBar label="Base" value={score.components.base} max={300} color="#6B7280" />
          <ComponentBar label="Impact" value={score.components.impact} max={250} color="#10B981" />
          <ComponentBar label="Rank" value={score.components.relativeRank} max={180} color="#8B5CF6" />
          <ComponentBar label="Trust" value={score.components.trust} max={100} color="#3B82F6" />
          <ComponentBar label="Momentum" value={score.components.momentum} max={70} color="#F59E0B" />
        </View>

        {/* Grades */}
        <View style={styles.gradesRow}>
          <View style={styles.gradeCard}>
            <Text style={styles.gradeLabel}>Trust Grade</Text>
            <Text style={[styles.gradeValue, { color: TRUST_GRADE_COLORS[score.trustGrade] ?? '#6B7280' }]}>
              {score.trustGrade}
            </Text>
          </View>
          <View style={styles.gradeCard}>
            <Text style={styles.gradeLabel}>Momentum</Text>
            <View style={styles.momentumRow}>
              <Ionicons name={MOMENTUM_ICONS[score.momentumLabel] ?? 'trending-up'} size={20} color="#F59E0B" />
              <Text style={styles.gradeValue}>{score.momentumLabel}</Text>
            </View>
          </View>
        </View>

        {/* Leaderboard preview */}
        <LeaderboardPreview rank={null} percentile={score.percentile} />

        {/* Recent history */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>30-Day Trend</Text>
            <View style={styles.historyChart}>
              {history.slice(-14).map((entry, i) => {
                const max = Math.max(...history.map((h) => h.displayScore));
                const height = max > 0 ? (entry.displayScore / max) * 80 : 0;
                return (
                  <View key={i} style={styles.chartBar}>
                    <View style={[styles.chartBarFill, { height, backgroundColor: gradient[0] }]} />
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  heroHeader: { paddingBottom: 24 },
  circleContainer: { alignItems: 'center', marginTop: 8 },
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  circleInner: { flex: 1, borderRadius: CIRCLE_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 56, fontWeight: '800', color: '#fff' },
  maxLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: -4 },
  progressBar: {
    width: CIRCLE_SIZE,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  bandCard: { margin: Spacing.base, padding: Spacing.base, borderRadius: BorderRadius.lg },
  bandLabel: { fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  bandRange: { fontSize: 13, color: colors.text.secondary, marginTop: 2, marginBottom: 12 },
  perkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  perkText: { fontSize: 14, color: colors.text.primary, marginLeft: 8 },
  section: { paddingHorizontal: Spacing.base, marginTop: Spacing.lg },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  componentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  componentLabel: { width: 90, fontSize: 13, color: colors.text.secondary },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.background.tertiary, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  componentValue: { width: 30, textAlign: 'right', fontSize: 13, fontWeight: '600', color: colors.text.primary },
  gradesRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, marginTop: Spacing.md, gap: Spacing.sm },
  gradeCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
  },
  gradeLabel: { fontSize: 12, color: colors.text.secondary, marginBottom: 4 },
  gradeValue: { fontSize: 24, fontWeight: '800' },
  momentumRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: 8,
  },
  streakText: { fontSize: 15, fontWeight: '600', color: colors.text.primary },
  streakSub: { fontSize: 13, color: colors.text.secondary, marginLeft: 'auto' },
  leaderCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    gap: 8,
  },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leaderLabel: { fontSize: 14, color: colors.text.secondary, flex: 1 },
  leaderValue: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  historyChart: { flexDirection: 'row', height: 100, alignItems: 'flex-end', gap: 4 },
  chartBar: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBarFill: { width: '100%', borderRadius: 3, minHeight: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { ...Typography.h3, marginTop: 16, color: colors.text.primary },
  emptySub: { fontSize: 14, color: colors.text.secondary, marginTop: 8, textAlign: 'center' },
});
