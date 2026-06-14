/**
 * RoiSummaryCard — Phase G dashboard card.
 *
 * Renders the unified "₹ spent on REZ vs ₹ earned attributable to REZ"
 * summary with a single-line verdict (net lift + ROI multiple) and a
 * collapsed breakdown row. Advanced merchants can tap through to a
 * detailed ROI screen (follow-up route).
 *
 * The component is intentionally dumb — it receives the pre-fetched
 * RoiSummary from the shell. Visibility rules live in the registry.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { RoiSummary } from '@/services/api/roiSummary';

export interface RoiSummaryCardProps {
  summary: RoiSummary | null;
  /** When true, show a muted "preview" badge — used during
   *  MERCHANT_ROI_MODE=shadow rollout so merchants know the numbers
   *  aren't fully trusted yet. */
  isShadow?: boolean;
  /** Optional route to the detailed ROI breakdown screen. */
  detailRoute?: string;
}

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatMultiple(x: number): string {
  if (!Number.isFinite(x)) return '—';
  if (x >= 10) return `${Math.round(x)}×`;
  return `${x.toFixed(1)}×`;
}

export const RoiSummaryCard: React.FC<RoiSummaryCardProps> = ({ summary, isShadow, detailRoute }) => {
  const router = useRouter();
  if (!summary) return null;

  const positive = summary.netLift >= 0;
  const liftColor = positive ? '#10B981' : '#EF4444';

  const body = (
    <View style={styles.body}>
      <View style={styles.row}>
        <View style={styles.col}>
          <Caption style={styles.label}>Spent on REZ</Caption>
          <BodyText style={styles.valueMid}>{formatInr(summary.spent.total)}</BodyText>
        </View>
        <View style={styles.col}>
          <Caption style={styles.label}>Earned via REZ</Caption>
          <BodyText style={styles.valueMid}>{formatInr(summary.earned.total)}</BodyText>
        </View>
        <View style={styles.col}>
          <Caption style={styles.label}>ROI</Caption>
          <BodyText style={[styles.valueMid, { color: liftColor }]}>
            {formatMultiple(summary.roiMultiple)}
          </BodyText>
        </View>
      </View>
      <View style={[styles.liftPill, { backgroundColor: positive ? '#D1FAE5' : '#FEE2E2' }]}>
        <Ionicons
          name={positive ? 'trending-up' : 'trending-down'}
          size={14}
          color={liftColor}
        />
        <BodyText style={[styles.liftText, { color: liftColor }]}>
          {positive ? '+' : ''}
          {formatInr(summary.netLift)} net lift
        </BodyText>
      </View>
      {summary.earned.breakdown.newCustomerGMV > 0 && (
        <Caption style={styles.footnote}>
          {formatInr(summary.earned.breakdown.newCustomerGMV)} from{' '}
          {summary.earned.breakdown.uniqueCustomers} customers, first-time visitors contributed{' '}
          {Math.round(
            (summary.earned.breakdown.newCustomerGMV / Math.max(1, summary.earned.total)) * 100,
          )}
          %.
        </Caption>
      )}
      {summary.isEstimate && (
        <Caption style={styles.estimateNote}>
          Some numbers are estimates — exact BSP billing + subscription
          audit feed coming soon.
        </Caption>
      )}
    </View>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(150).springify()}
      style={styles.container}
      testID="dashboard-card-roi-summary"
      accessibilityLabel="ROI summary — spent vs earned"
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="analytics" size={16} color="#0369A1" />
        </View>
        <Heading3 style={styles.title}>ROI — last 30 days</Heading3>
        {isShadow && <View style={styles.shadowPill}><Caption style={styles.shadowPillText}>preview</Caption></View>}
      </View>

      {detailRoute ? (
        <TouchableOpacity
          onPress={() => router.push(detailRoute as unknown)}
          accessibilityRole="button"
          accessibilityLabel="Open full ROI breakdown"
        >
          {body}
        </TouchableOpacity>
      ) : (
        body
      )}
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
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  col: {
    flex: 1,
    alignItems: 'flex-start',
  },
  label: {
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  valueMid: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  liftPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liftText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footnote: {
    color: Colors.text.tertiary,
    marginTop: 8,
  },
  estimateNote: {
    color: Colors.text.tertiary,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default RoiSummaryCard;
