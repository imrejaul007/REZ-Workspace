/**
 * StoreHealthScoreCard — Sprint -1a S-size extraction (#4 of 26).
 *
 * Source: app/(dashboard)/index.tsx lines 405-447 (pre-extraction).
 * A-05 store-health block with the circular score ring, trend arrow,
 * and percentile line. Pure presentation — no data fetch, no local state.
 *
 * Registry gate: `isVisible` when `health` is non-null.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { HealthData } from '@/hooks/useDashboardData';

export interface StoreHealthScoreCardProps {
  health: HealthData;
}

export const StoreHealthScoreCard: React.FC<StoreHealthScoreCardProps> = ({ health }) => {
  if (!health) return null;

  const trend = health.trend ?? 0;
  const trendColor = trend > 0 ? Colors.success[500] : Colors.error[500];
  const trendIcon = trend > 0 ? 'trending-up' : 'trending-down';

  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      style={styles.container}
      testID="dashboard-card-store-health-score"
    >
      <LinearGradient colors={['#F0F9FF', '#E0F2FE']} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.leftBlock}>
            <View style={styles.ring}>
              <Text style={styles.score}>{health.score || 0}</Text>
            </View>
          </View>
          <View style={styles.rightBlock}>
            <Heading3 style={styles.label}>Store Health</Heading3>
            <View style={styles.trendBadge}>
              <Ionicons name={trendIcon} size={16} color={trendColor} />
              <BodyText style={[styles.trendText, { color: trendColor }]}>
                {trend > 0 ? '+' : ''}
                {trend}% vs last week
              </BodyText>
            </View>
            {health.percentile !== undefined && (
              <Caption style={styles.percentileText}>
                Top {health.percentile}% of similar stores
              </Caption>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 14,
  },
  card: {
    borderRadius: 14,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  leftBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0284C7',
  },
  rightBlock: {
    flex: 1,
  },
  label: {
    color: Colors.text.primary,
    marginBottom: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  percentileText: {
    color: Colors.text.tertiary,
    marginTop: 4,
  },
});

export default StoreHealthScoreCard;
