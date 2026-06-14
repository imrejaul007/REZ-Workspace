// ==========================================
// MyTalent - Insurance Policies Screen
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, ProgressBar } from '../../src/components';
import { mockWealthData } from '../../src/data/mockData';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  life: { icon: '🛡️', color: Colors.primary },
  health: { icon: '🏥', color: Colors.success },
  term: { icon: '⏰', color: Colors.secondary },
  ulip: { icon: '📈', color: Colors.warning },
  vehicle: { icon: '🚗', color: '#EC4899' },
  home: { icon: '🏠', color: '#06B6D4' },
};

export default function InsuranceScreen() {
  const policies = mockWealthData.insurance;
  const totalCover = policies.reduce((sum, ins) => sum + ins.sumAssured, 0);
  const totalPremium = policies.reduce((sum, ins) => sum + ins.premium, 0);

  const daysUntilDue = (dateStr: string) => {
    const due = new Date(dateStr);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Coverage</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCover)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Annual Premium</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPremium)}</Text>
          </View>
        </View>
      </Card>

      {/* Policies List */}
      {policies.map((policy) => {
        const config = TYPE_CONFIG[policy.type] || TYPE_CONFIG.life;
        const days = daysUntilDue(policy.nextDueDate);
        const isDueSoon = days <= 30;

        return (
          <Card key={policy.id} style={styles.policyCard}>
            <View style={styles.policyHeader}>
              <View style={[styles.policyIcon, { backgroundColor: `${config.color}20` }]}>
                <Text style={styles.policyEmoji}>{config.icon}</Text>
              </View>
              <View style={styles.policyInfo}>
                <Text style={styles.policyName}>{policy.name}</Text>
                <Text style={styles.policyProvider}>{policy.provider}</Text>
              </View>
              <View style={[styles.statusBadge, {
                backgroundColor: policy.status === 'active' ? `${Colors.success}20` : `${Colors.error}20`
              }]}>
                <Text style={[styles.statusText, {
                  color: policy.status === 'active' ? Colors.success : Colors.error
                }]}>
                  {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.policyDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Sum Assured</Text>
                  <Text style={styles.detailValue}>{formatCurrency(policy.sumAssured)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Premium</Text>
                  <Text style={styles.detailValue}>
                    {formatCurrency(policy.premium)}/{policy.premiumFrequency === 'yearly' ? 'yr' : policy.premiumFrequency === 'quarterly' ? 'qtr' : 'mo'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Next Due Date */}
            <View style={[styles.dueBanner, {
              backgroundColor: isDueSoon ? `${Colors.warning}20` : `${Colors.success}20`
            }]}>
              <Text style={styles.dueIcon}>📅</Text>
              <View style={styles.dueInfo}>
                <Text style={styles.dueLabel}>Next Premium Due</Text>
                <Text style={[styles.dueDate, { color: isDueSoon ? Colors.warning : Colors.success }]}>
                  {policy.nextDueDate}
                </Text>
              </View>
              <View style={styles.dueCountdown}>
                <Text style={[styles.dueDays, { color: isDueSoon ? Colors.warning : Colors.success }]}>
                  {days} days
                </Text>
                <Text style={styles.dueDaysLabel}>remaining</Text>
              </View>
            </View>

            {policy.maturityDate && (
              <View style={styles.maturityRow}>
                <Text style={styles.maturityLabel}>Maturity Date</Text>
                <Text style={styles.maturityDate}>{policy.maturityDate}</Text>
              </View>
            )}

            {/* Coverage Visualization */}
            <View style={styles.coverageSection}>
              <Text style={styles.coverageLabel}>Coverage Ratio</Text>
              <ProgressBar
                progress={(policy.premium / policy.sumAssured) * 1000000}
                color={config.color}
                height={6}
              />
              <Text style={styles.coverageNote}>
                Premium ratio: {(policy.premium / policy.sumAssured * 100000).toFixed(2)}%
              </Text>
            </View>
          </Card>
        );
      })}

      {/* Add New Policy */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addIcon}>+</Text>
        <Text style={styles.addText}>Add New Policy</Text>
      </TouchableOpacity>

      {/* Tips */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Insurance Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Ensure coverage is 10-15x your annual income
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Review your policies annually as life changes
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>
            Consider health insurance with rising medical costs
          </Text>
        </View>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryCard: {
    margin: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  policyCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  policyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  policyEmoji: {
    fontSize: 24,
  },
  policyInfo: {
    flex: 1,
  },
  policyName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  policyProvider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  policyDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  dueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  dueIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  dueInfo: {
    flex: 1,
  },
  dueLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  dueDate: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  dueCountdown: {
    alignItems: 'flex-end',
  },
  dueDays: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  dueDaysLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  maturityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  maturityLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  maturityDate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  coverageSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  coverageLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  coverageNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addIcon: {
    fontSize: 24,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  addText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  tipsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundDark,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  tipBullet: {
    fontSize: FontSize.md,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
