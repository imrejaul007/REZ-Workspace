/**
 * CpaBillingCard — Phase J dashboard card.
 *
 * Renders the merchant's month-to-date CPA spend with a breakdown by
 * outcome kind (new customers / lapsed returns). When the merchant
 * hasn't opted in (plan.isActive=false), shows a "you are not on
 * performance pricing" marker and the card falls back to no-op.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/DesignTokens';
import { Heading3, BodyText, Caption } from '@/components/ui/DesignSystemComponents';
import type { CpaBillingSummary } from '@/services/api/cpaBilling';

export interface CpaBillingCardProps {
  summary: CpaBillingSummary | null;
  isShadow?: boolean;
}

function formatInr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

const KIND_LABEL: Record<string, string> = {
  'new-customer-conversion': 'New customers',
  'lapsed-reactivation': 'Won back (lapsed)',
  'scan-conversion': 'Scan conversions',
  adjustment: 'Adjustments',
};

export const CpaBillingCard: React.FC<CpaBillingCardProps> = ({ summary, isShadow }) => {
  if (!summary) return null;

  const { plan, monthToDate } = summary;
  const capHit = plan.monthlyCap > 0 && monthToDate.total >= plan.monthlyCap;

  return (
    <Animated.View
      entering={FadeInDown.delay(170).springify()}
      style={styles.container}
      testID="dashboard-card-cpa-billing"
      accessibilityLabel="Performance pricing summary"
    >
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="pricetags" size={16} color="#7C3AED" />
        </View>
        <Heading3 style={styles.title}>Performance Pricing — this month</Heading3>
        {isShadow && (
          <View style={styles.shadowPill}>
            <Caption style={styles.shadowPillText}>preview</Caption>
          </View>
        )}
      </View>

      {!plan.isActive ? (
        <View style={styles.bodyMuted}>
          <BodyText style={styles.mutedText}>
            You're not on performance-based pricing yet. Contact your account manager to switch on
            per-outcome billing (only pay when you win new or lapsed customers).
          </BodyText>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.topline}>
            <View>
              <Caption style={styles.label}>Spent this month</Caption>
              <Heading3 style={styles.totalValue}>{formatInr(monthToDate.total)}</Heading3>
              <Caption style={styles.footnote}>
                {monthToDate.count} outcomes billed{' '}
                {plan.monthlyCap > 0
                  ? `• cap ${formatInr(plan.monthlyCap)}`
                  : '• no monthly cap'}
              </Caption>
            </View>
            {capHit && (
              <View style={styles.capPill}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Caption style={styles.capText}>Cap reached</Caption>
              </View>
            )}
          </View>

          <View style={styles.kindsBlock}>
            {Object.entries(monthToDate.byKind).map(([kind, bucket]) => (
              <View key={kind} style={styles.kindRow}>
                <BodyText style={styles.kindLabel}>{KIND_LABEL[kind] ?? kind}</BodyText>
                <View style={styles.kindRight}>
                  <BodyText style={styles.kindCount}>× {bucket.count}</BodyText>
                  <BodyText style={styles.kindAmount}>{formatInr(bucket.subtotal)}</BodyText>
                </View>
              </View>
            ))}
            {Object.keys(monthToDate.byKind).length === 0 && (
              <Caption style={styles.emptyNote}>
                No billable outcomes yet this month — you'll only be charged when REZ delivers new
                or lapsed customers to you.
              </Caption>
            )}
          </View>
        </View>
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
    backgroundColor: '#DDD6FE',
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
  bodyMuted: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: 12,
  },
  mutedText: {
    color: Colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  topline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  label: {
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  totalValue: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  footnote: {
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  capPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  capText: {
    color: '#065F46',
    fontWeight: '600',
    fontSize: 10,
  },
  kindsBlock: {
    borderTopWidth: 1,
    borderColor: Colors.gray[200],
    paddingTop: 10,
    gap: 6,
  },
  kindRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindLabel: {
    color: Colors.text.primary,
    fontSize: 13,
  },
  kindRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kindCount: {
    color: Colors.text.tertiary,
    fontSize: 12,
  },
  kindAmount: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyNote: {
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
});

export default CpaBillingCard;
