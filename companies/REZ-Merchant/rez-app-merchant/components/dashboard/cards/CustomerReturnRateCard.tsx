/**
 * CustomerReturnRateCard — Sprint -1a S-size extraction (#7 of 26).
 *
 * Source: app/(dashboard)/index.tsx lines 837-890 (pre-extraction).
 * Purple gradient KPI showing today's returning-customer rate with a
 * circular % badge. Part of the "LI WEI merchant ROI" family. Registry
 * gate: `isVisible` when `retention` is non-null.
 *
 * Pure presentation — no data fetch, no local state.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Heading2, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { CustomerRetentionMetrics } from '@/services/api/dashboard';

export interface CustomerReturnRateCardProps {
  retention: CustomerRetentionMetrics;
}

export const CustomerReturnRateCard: React.FC<CustomerReturnRateCardProps> = ({ retention }) => {
  if (!retention) return null;

  const pct = retention.returnRatePercent ?? 0;
  const returning = retention.returningCustomersToday ?? 0;
  const total = retention.totalCustomersToday ?? 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(300).springify()}
      style={styles.container}
      testID="dashboard-card-customer-return-rate"
    >
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.row}>
          <View style={styles.leftBlock}>
            <BodyText style={styles.label}>RETURNING CUSTOMERS</BodyText>
            <Heading2 style={styles.bigPercent}>{pct.toFixed(1)}%</Heading2>
            <Caption style={styles.caption}>
              {returning} of {total} today
            </Caption>
          </View>
          <View style={styles.badgeOuter}>
            <View style={styles.badgeInner}>
              <BodyText style={styles.badgeText}>{pct.toFixed(0)}%</BodyText>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 14 },
  gradient: { borderRadius: 14, padding: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftBlock: { flex: 1 },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  bigPercent: { color: '#fff', marginTop: 4 },
  caption: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  badgeOuter: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 18 },
});

export default CustomerReturnRateCard;
