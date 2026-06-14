/**
 * BasketSizeTrendCard — Sprint -1a S-size extraction (#8 of 26).
 *
 * Source: app/(dashboard)/index.tsx lines 894-929 (pre-extraction).
 * Gradient-backed banner showing whether average order value is up or down
 * vs last week. Part of the "LI WEI merchant ROI" family. Registry gate:
 * `isVisible` when `trend && trend.percentChange !== 0`.
 *
 * Pure presentation — no data fetch, no local state.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { BasketSizeTrend } from '@/services/api/dashboard';

export interface BasketSizeTrendCardProps {
  trend: BasketSizeTrend;
}

export const BasketSizeTrendCard: React.FC<BasketSizeTrendCardProps> = ({ trend }) => {
  if (!trend || trend.percentChange === 0) return null;

  const isDecline = trend.isDecline;
  const pct = Math.abs(trend.percentChange ?? 0).toFixed(1);
  const avg = (trend.thisWeekAvg ?? 0).toFixed(0);

  return (
    <Animated.View
      entering={FadeInDown.delay(350).springify()}
      style={styles.container}
      testID="dashboard-card-basket-size-trend"
    >
      <LinearGradient
        colors={isDecline ? ['#F87171', '#EF4444'] : ['#60A5FA', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.row}>
          <Ionicons
            name={isDecline ? 'alert-circle' : 'checkmark-circle'}
            size={24}
            color="#fff"
          />
          <View style={styles.body}>
            <BodyText style={styles.title}>
              {isDecline ? 'Average Order Value Declining' : 'Strong Basket Growth'}
            </BodyText>
            <Caption style={styles.subtitle}>
              {isDecline ? `Down ${pct}%` : `Up ${pct}%`} this week • ₹{avg} avg order value
            </Caption>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 14 },
  gradient: { borderRadius: 14, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { flex: 1 },
  title: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});

export default BasketSizeTrendCard;
