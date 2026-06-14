/**
 * RezScoreScreen
 *
 * Phase 2.3 — REZ Score — Universal Savings Score
 * Full screen with:
 *  - Large circular score display (0-999) with tier name
 *  - Trend indicator vs last month
 *  - 5 pillar breakdown bars
 *  - Score Boosters section
 *  - Peer percentile
 *  - Share button
 *
 * Data: GET /api/score and GET /api/score/boosters via React Query
 */

import React, { useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Animated, Share } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import { getScore, getScoreBoosters, RezScore, ScoreBooster, ScorePillar, RezScoreTier } from '@/services/rezScoreApi';

// ============================================================================
// QUERY KEYS
// ============================================================================

const SCORE_QUERY_KEY = ['rez-score'] as const;
const BOOSTERS_QUERY_KEY = ['rez-score', 'boosters'] as const;

// ============================================================================
// TIER CONFIG
// ============================================================================

const TIER_CONFIG: Record<RezScoreTier, { color: string; bg: string; emoji: string }> = {
  Beginner: { color: colors.gray[500], bg: colors.tint.slate, emoji: '🌱' },
  'Smart Saver': { color: colors.brand.sky, bg: colors.tint.blue, emoji: '💡' },
  'Super Saver': { color: colors.brand.amberDark, bg: colors.tint.amber, emoji: '⭐' },
  'Elite Saver': { color: colors.brand.orangeDark, bg: colors.tint.orange, emoji: '🔥' },
  Legend: { color: '#1a3a52', bg: '#e8f0f7', emoji: '👑' },
};

// ============================================================================
// LARGE CIRCULAR SCORE
// ============================================================================

function LargeScoreDisplay({
  score,
  tier,
  trendPoints,
  lastMonthScore,
}: {
  score: number;
  tier: RezScoreTier;
  trendPoints: number;
  lastMonthScore: number;
}) {
  const config = TIER_CONFIG[tier];
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 10,
      stiffness: 80,
    }).start();
  }, [scaleAnim]);

  const trendIsUp = trendPoints > 0;
  const trendIsDown = trendPoints < 0;

  return (
    <View style={scoreStyles.wrapper}>
      <Animated.View style={[scoreStyles.outerRing, { borderColor: config.color, transform: [{ scale: scaleAnim }] }]}>
        <View style={[scoreStyles.innerRing, { backgroundColor: config.bg }]}>
          <ThemedText style={scoreStyles.emoji}>{config.emoji}</ThemedText>
          <ThemedText style={[scoreStyles.number, { color: config.color }]}>{score}</ThemedText>
          <ThemedText style={scoreStyles.outOf}>/ 999</ThemedText>
        </View>
      </Animated.View>

      {/* Tier badge */}
      <View style={[scoreStyles.tierBadge, { backgroundColor: config.bg }]}>
        <ThemedText style={[scoreStyles.tierText, { color: config.color }]}>{tier}</ThemedText>
      </View>

      {/* Trend vs last month */}
      <View style={scoreStyles.trendRow}>
        <Ionicons
          name={trendIsUp ? 'trending-up' : trendIsDown ? 'trending-down' : 'remove'}
          size={16}
          color={trendIsUp ? colors.success : trendIsDown ? colors.error : colors.gray[400]}
        />
        <ThemedText
          style={[
            scoreStyles.trendText,
            { color: trendIsUp ? colors.success : trendIsDown ? colors.error : colors.gray[400] },
          ]}
        >
          {trendIsUp ? '+' : ''}
          {trendPoints} pts vs last month (was {lastMonthScore})
        </ThemedText>
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 12 },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  innerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  number: { fontSize: 52, fontWeight: '900', lineHeight: 56, letterSpacing: -2 },
  outOf: { fontSize: 14, color: colors.gray[400], fontWeight: '500' },
  tierBadge: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tierText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trendText: { fontSize: 13, fontWeight: '500' },
});

// ============================================================================
// PILLAR BAR
// ============================================================================

function PillarBar({ pillar }: { pillar: ScorePillar }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pillar.score / 100,
      duration: 900,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [pillar.score, widthAnim]);

  const barColor = pillar.score >= 70 ? colors.success : pillar.score >= 40 ? colors.lightMustard : colors.warning;

  return (
    <View style={pillarStyles.row}>
      <View style={pillarStyles.labelCol}>
        <ThemedText style={pillarStyles.name}>{pillar.name}</ThemedText>
        <ThemedText style={pillarStyles.weight}>{(pillar.weight * 100).toFixed(0)}% of score</ThemedText>
      </View>
      <View style={pillarStyles.trackWrapper}>
        <View style={pillarStyles.track}>
          <Animated.View
            style={[
              pillarStyles.fill,
              {
                width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: barColor,
              },
            ]}
          />
        </View>
        <ThemedText style={[pillarStyles.scoreLabel, { color: barColor }]}>{pillar.score}</ThemedText>
      </View>
    </View>
  );
}

const pillarStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labelCol: { width: 110, gap: 2 },
  name: { fontSize: 12, fontWeight: '600', color: colors.text.primary },
  weight: { fontSize: 10, color: colors.gray[400] },
  trackWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 8, backgroundColor: colors.gray[200], borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  scoreLabel: { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right' },
});

// ============================================================================
// BOOSTER CARD
// ============================================================================

const DIFFICULTY_COLORS: Record<ScoreBooster['difficulty'], string> = {
  easy: colors.success,
  medium: colors.lightMustard,
  hard: colors.warning,
};

function BoosterCard({ booster }: { booster: ScoreBooster }) {
  return (
    <View style={boosterStyles.card}>
      <View style={boosterStyles.left}>
        <View style={[boosterStyles.diffPill, { backgroundColor: DIFFICULTY_COLORS[booster.difficulty] + '22' }]}>
          <ThemedText style={[boosterStyles.diff, { color: DIFFICULTY_COLORS[booster.difficulty] }]}>
            {booster.difficulty}
          </ThemedText>
        </View>
        <ThemedText style={boosterStyles.title}>{booster.title}</ThemedText>
        <ThemedText style={boosterStyles.desc} numberOfLines={2}>
          {booster.description}
        </ThemedText>
      </View>
      <View style={boosterStyles.right}>
        <ThemedText style={boosterStyles.boost}>+{booster.estimatedBoost}</ThemedText>
        <ThemedText style={boosterStyles.pts}>pts</ThemedText>
      </View>
    </View>
  );
}

const boosterStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  left: { flex: 1, gap: 4 },
  diffPill: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  diff: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 13, fontWeight: '700', color: colors.text.primary },
  desc: { fontSize: 12, color: colors.gray[500], lineHeight: 16 },
  right: { alignItems: 'center', justifyContent: 'center', gap: 0, minWidth: 44 },
  boost: { fontSize: 20, fontWeight: '900', color: colors.success, lineHeight: 24 },
  pts: { fontSize: 10, color: colors.gray[400] },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function RezScoreScreen() {
  const router = useRouter();

  const {
    data: scoreData,
    isLoading: scoreLoading,
    isError: scoreError,
    refetch: refetchScore,
  } = useQuery<RezScore>({
    queryKey: SCORE_QUERY_KEY,
    queryFn: getScore,
    staleTime: 1000 * 60 * 10,
  });

  const { data: boosters, isLoading: boostersLoading } = useQuery<ScoreBooster[]>({
    queryKey: BOOSTERS_QUERY_KEY,
    queryFn: getScoreBoosters,
    staleTime: 1000 * 60 * 10,
    enabled: !!scoreData,
  });

  const handleShare = async () => {
    if (!scoreData) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `My REZ Score is ${scoreData.score}/999 — I'm a ${scoreData.tier}! I save more than ${scoreData.peerPercentile}% of users in my area 🏆 #REZScore`,
        title: 'My REZ Score',
      });
    } catch {
      // User cancelled
    }
  };

  const isLoading = scoreLoading;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'REZ Score',
          headerStyle: { backgroundColor: colors.background.dark },
          headerTintColor: colors.lightMustard,
          headerTitleStyle: { fontWeight: '700', color: colors.lightMustard },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingLeft: 4 }}>
              <Ionicons name="chevron-back" size={24} color={colors.lightMustard} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleShare} hitSlop={8} style={{ paddingRight: 4 }}>
              <Ionicons name="share-social-outline" size={22} color={colors.lightMustard} />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {isLoading && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.lightMustard} />
            <ThemedText style={styles.loadingText}>Calculating your score...</ThemedText>
          </View>
        )}

        {scoreError && !isLoading && (
          <View style={styles.errorWrapper}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <ThemedText style={styles.errorText}>Could not load your REZ Score</ThemedText>
            <Pressable style={styles.retryBtn} onPress={() => refetchScore()}>
              <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
            </Pressable>
          </View>
        )}

        {scoreData && !isLoading && (
          <>
            {/* Hero score */}
            <View style={styles.heroSection}>
              <LargeScoreDisplay
                score={scoreData.score}
                tier={scoreData.tier}
                trendPoints={scoreData.trendPoints}
                lastMonthScore={scoreData.lastMonthScore}
              />
            </View>

            {/* Peer percentile banner */}
            <View style={styles.percentileBanner}>
              <ThemedText style={styles.percentileEmoji}>🌍</ThemedText>
              <ThemedText style={styles.percentileText}>
                Your score is higher than{' '}
                <ThemedText style={styles.percentileBold}>{scoreData.peerPercentile}% of users</ThemedText> in your area
              </ThemedText>
            </View>

            {/* Score pillars */}
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>Score Breakdown</ThemedText>
              <ThemedText style={styles.cardSub}>5 pillars that make up your score</ThemedText>
              <View style={styles.pillarsContainer}>
                {scoreData.pillars.map((pillar) => (
                  <PillarBar key={pillar.name} pillar={pillar} />
                ))}
              </View>
            </View>

            {/* Score boosters */}
            {boostersLoading && <ActivityIndicator size="small" color={colors.lightMustard} style={{ marginTop: 8 }} />}
            {boosters && boosters.length > 0 && (
              <View style={styles.boostersSection}>
                <View style={styles.boostersHeader}>
                  <ThemedText style={styles.cardTitle}>Score Boosters</ThemedText>
                  <View style={styles.boostersBadge}>
                    <ThemedText style={styles.boostersBadgeText}>{boosters.length} available</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.cardSub}>Take these actions to improve your score</ThemedText>
                {boosters.slice(0, 4).map((booster) => (
                  <BoosterCard key={booster.id} booster={booster} />
                ))}
              </View>
            )}

            {/* Share button */}
            <Pressable
              style={({ pressed }) => [styles.shareBtn, pressed ? styles.shareBtnPressed : null]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={18} color={colors.background.dark} />
              <ThemedText style={styles.shareBtnText}>Share my score</ThemedText>
            </Pressable>

            {/* View savings share card */}
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                styles.shareBtnSecondary,
                pressed ? styles.shareBtnPressed : null,
              ]}
              onPress={() => router.push('/share-savings' as unknown as string)}
            >
              <Ionicons name="image-outline" size={18} color={colors.lightMustard} />
              <ThemedText style={[styles.shareBtnText, styles.shareBtnTextSecondary]}>View savings card</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  loadingWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  errorWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 80,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: colors.lightMustard,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  heroSection: {
    backgroundColor: colors.background.primary,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  percentileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background.dark,
    borderRadius: 14,
    padding: 14,
  },
  percentileEmoji: {
    fontSize: 20,
  },
  percentileText: {
    flex: 1,
    fontSize: 13,
    color: colors.lightPeach,
    lineHeight: 18,
  },
  percentileBold: {
    fontWeight: '800',
    color: colors.lightMustard,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: -4,
  },
  pillarsContainer: {
    gap: 14,
    marginTop: 4,
  },
  boostersSection: {
    gap: 10,
  },
  boostersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  boostersBadge: {
    backgroundColor: colors.tint.greenLight,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  boostersBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lightMustard,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  shareBtnPressed: {
    opacity: 0.85,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background.dark,
  },
  shareBtnSecondary: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.lightMustard,
  },
  shareBtnTextSecondary: {
    color: colors.lightMustard,
  },
});
