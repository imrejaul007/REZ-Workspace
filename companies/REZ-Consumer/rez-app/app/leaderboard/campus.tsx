// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { View, StyleSheet, Pressable, ActivityIndicator, Share } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { useAuthUser } from '@/stores';
import * as identityApi from '@/services/identityApi';
import analyticsService, { IdentityAnalyticsEvents } from '@/services/analyticsService';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

function CampusLeaderboardPage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const user = useAuthUser();
  const { instituteName } = useUserIdentityStore();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!instituteName) return;
    analyticsService.track(IdentityAnalyticsEvents.LEADERBOARD_OPENED, { institutionName: instituteName });

    identityApi
      .getCampusLeaderboard(instituteName)
      .then(setData)
      .catch(() => {})
      .finally(() => {
        if (isMounted()) setLoading(false);
      });
  }, [instituteName, isMounted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data when navigating back to this screen
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      fetchData();
    }, [fetchData]),
  );

  const handleShare = async () => {
    analyticsService.track(IdentityAnalyticsEvents.LEADERBOARD_SHARED, { institutionName: instituteName });
    try {
      await Share.share({
        message: `Students at ${instituteName} saved \u20B9${data?.totalSaved?.toLocaleString() || 0} this month on REZ!`,
      });
    } catch (err) {
      // R2-H1 FIX: Log Share failure so attribution can be retried.
      if (__DEV__) logger.warn('[leaderboard/campus] Share failed:', { error: err });
    }
  };

  const userId = (user as unknown)?._id || (user as unknown)?.id;

  const renderItem = useCallback(
    ({ item }: { item: unknown }) => {
      const isCurrentUser = userId && item.userId === userId;
      return (
        <View style={[styles.row, isCurrentUser ? styles.currentUserRow : null]}>
          <View style={[styles.rankCircle, item.rank <= 3 ? styles.topRankCircle : null]}>
            <ThemedText style={[styles.rankText, item.rank <= 3 ? styles.topRankText : null]}>{item.rank}</ThemedText>
          </View>
          <ThemedText style={[styles.name, isCurrentUser ? styles.currentUserName : null]} numberOfLines={1}>
            {item.name}
            {isCurrentUser ? ' (You)' : ''}
          </ThemedText>
          <ThemedText style={styles.amount}>
            {'\u20B9'}
            {item.totalEarned.toLocaleString()}
          </ThemedText>
        </View>
      );
    },
    [userId],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.purple} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Campus Rankings</ThemedText>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={22} color={colors.brand.purple} />
        </Pressable>
      </View>

      <FlashList
        data={data?.leaderboard || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.statsCard}>
            <ThemedText style={styles.institutionName}>{instituteName}</ThemedText>
            <ThemedText style={styles.totalSaved}>
              {'\u20B9'}
              {data?.totalSaved?.toLocaleString() || 0}
            </ThemedText>
            <ThemedText style={styles.statsLabel}>saved by {data?.studentCount || 0} students this month</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No leaderboard data yet</ThemedText>
          </View>
        }
        estimatedItemSize={72}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  backButton: { padding: spacing.sm },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text.primary, marginLeft: spacing.sm },
  shareButton: { padding: spacing.sm },
  listContent: { paddingHorizontal: spacing.base, paddingBottom: 120 },
  statsCard: {
    backgroundColor: colors.secondary[700],
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  institutionName: { fontSize: 16, fontWeight: '700', color: colors.primary[500], marginBottom: 4 },
  totalSaved: { fontSize: 36, fontWeight: '800', color: colors.primary[500], marginBottom: 4 },
  statsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  currentUserRow: { backgroundColor: colors.primary[50] },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  topRankCircle: { backgroundColor: colors.primary[500] },
  rankText: { fontSize: 13, fontWeight: '700', color: colors.text.secondary },
  topRankText: { color: colors.secondary[800] },
  name: { flex: 1, fontSize: 15, color: colors.text.primary },
  currentUserName: { fontWeight: '700', color: colors.brand.purple },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: colors.text.tertiary },
});

export default withErrorBoundary(CampusLeaderboardPage, 'CampusLeaderboard');
