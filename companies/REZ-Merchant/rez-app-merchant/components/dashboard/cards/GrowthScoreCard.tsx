/**
 * GrowthScoreCard — Phase H dashboard card.
 *
 * Renders the merchant's daily 0-100 health score with a big
 * ring-style number + 4 sub-score bars. The rendering is intentionally
 * dumb: the shell fetches the score via TanStack Query and passes
 * it in.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { GrowthScoreBreakdown } from '@/services/api/growthScore';

export interface GrowthScoreCardProps {
  total: number | null;
  breakdown: GrowthScoreBreakdown | null;
  stale?: boolean;
  isShadow?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Steady';
  if (score >= 25) return 'Slipping';
  return 'Struggling';
}

const BAR_LABELS: Array<[keyof GrowthScoreBreakdown, string]> = [
  ['gmvGrowth', 'Revenue growth'],
  ['newCustomerPct', 'New customers'],
  ['retention', 'Retention'],
  ['campaignCadence', 'Campaign activity'],
];

export const GrowthScoreCard: React.FC<GrowthScoreCardProps> = ({
  total,
  breakdown,
  stale,
  isShadow,
}) => {
  if (total == null || !breakdown) return null;

  const color = scoreColor(total);

  return (
    <Animated.View
      entering={FadeInDown.delay(130).springify()}
      style={styles.container}
      testID="dashboard-card-growth-score"
      accessibilityLabel={`Growth score ${total} out of 100`}
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="stats-chart" size={16} color="#0369A1" />
        </View>
        <Heading3 style={styles.title}>Growth Score</Heading3>
        {isShadow && <View style={styles.shadowPill}><Caption style={styles.shadowPillText}>preview</Caption></View>}
      </View>

      <View style={styles.body}>
        <View style={[styles.bigNumberContainer, { borderColor: color }]}>
          <BodyText style={[styles.bigNumber, { color }]}>{total}</BodyText>
          <Caption style={styles.bigNumberSuffix}>/ 100</Caption>
        </View>
        <View style={styles.rightCol}>
          <BodyText style={[styles.label, { color }]}>{scoreLabel(total)}</BodyText>
          {stale && <Caption style={styles.staleNote}>Computed yesterday</Caption>}
          <View style={styles.bars}>
            {BAR_LABELS.map(([key, label]) => (
              <View key={key} style={styles.barRow}>
                <View style={styles.barTop}>
                  <Caption style={styles.barLabel}>{label}</Caption>
                  <Caption style={styles.barValue}>{breakdown[key]}</Caption>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(0, Math.min(100, breakdown[key]))}%`, backgroundColor: scoreColor(breakdown[key]) },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconBadge: {
    backgroundColor: '#BAE6FD',
    borderRadius: 8,
    padding: 8,
  },
  title: {
    color: Colors.text.primary,
    flex: 1,
  },
  shadowPill: {
    backgroundColor: Colors.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shadowPillText: {
    color: Colors.text.tertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  bigNumberContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumber: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  bigNumberSuffix: {
    color: Colors.text.tertiary,
    fontSize: 10,
  },
  rightCol: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  staleNote: {
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  bars: {
    marginTop: 4,
    gap: 6,
  },
  barRow: {
    width: '100%',
  },
  barTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  barLabel: {
    color: Colors.text.primary,
    fontSize: 11,
  },
  barValue: {
    color: Colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
});

export default GrowthScoreCard;
