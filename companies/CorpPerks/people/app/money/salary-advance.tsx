// ==========================================
// MyTalent - Salary Advance Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, formatCurrency } from '../../src/components/Badge';
import { Card, Button, ProgressBar } from '../../src/components';
import { mockSalaryAdvances } from '../../src/data/mockData';
import { getSalaryAdvanceEligibility, getSalaryAdvanceHistory, applySalaryAdvance } from '../../src/services/ridzaService';

export default function SalaryAdvanceScreen() {
  const [maxAmount, setMaxAmount] = useState(50000);
  const [eligible, setEligible] = useState(true);
  const [history, setHistory] = useState(mockSalaryAdvances);
  const [selectedAmount, setSelectedAmount] = useState(10000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const eligibility = await getSalaryAdvanceEligibility('EMP001');
    if (eligibility.success) {
      setEligible(eligibility.eligible || false);
      setMaxAmount(eligibility.maxAmount || 50000);
    }
    const historyResult = await getSalaryAdvanceHistory('EMP001');
    if (historyResult.success && historyResult.advances) {
      setHistory(historyResult.advances);
    }
  };

  const handleApply = async () => {
    const result = await applySalaryAdvance('EMP001', selectedAmount);
    if (result.success) {
      Alert.alert(
        'Request Submitted',
        `Your salary advance request for ${formatCurrency(selectedAmount)} has been submitted.`,
        [{ text: 'OK' }]
      );
    }
  };

  const earnedThisMonth = 42000;
  const maxAdvance = Math.min(earnedThisMonth * 0.5, maxAmount);
  const advancePercentage = (selectedAmount / maxAdvance) * 100;

  return (
    <ScrollView style={styles.container}>
      {/* Eligibility Card */}
      <Card style={styles.eligibilityCard}>
        <View style={styles.eligibilityHeader}>
          <Text style={styles.eligibilityTitle}>Salary Advance</Text>
          <View style={[styles.eligibilityBadge, { backgroundColor: eligible ? Colors.successLight : Colors.errorLight }]}>
            <Text style={[styles.eligibilityBadgeText, { color: eligible ? Colors.success : Colors.error }]}>
              {eligible ? 'Eligible' : 'Not Eligible'}
            </Text>
          </View>
        </View>
        <View style={styles.amountDisplay}>
          <Text style={styles.amountLabel}>Available Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(maxAdvance)}</Text>
        </View>
      </Card>

      {/* Earned Wage Visualization */}
      <Card style={styles.earnedCard}>
        <Text style={styles.cardTitle}>Earned This Month</Text>
        <View style={styles.earnedBar}>
          <ProgressBar progress={(earnedThisMonth / 70000) * 100} color={Colors.success} height={12} />
        </View>
        <View style={styles.earnedRow}>
          <Text style={styles.earnedLabel}>Earned</Text>
          <Text style={styles.earnedValue}>{formatCurrency(earnedThisMonth)}</Text>
        </View>
        <View style={styles.earnedRow}>
          <Text style={styles.earnedLabel}>Total Salary</Text>
          <Text style={styles.earnedValue}>{formatCurrency(70000)}</Text>
        </View>
      </Card>

      {/* Amount Selector */}
      <Card style={styles.selectorCard}>
        <Text style={styles.cardTitle}>Select Amount</Text>
        <View style={styles.amountSelector}>
          {[5000, 10000, 15000, 20000, 25000].map((amount) => (
            <Button
              key={amount}
              title={formatCurrency(amount)}
              variant={selectedAmount === amount ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setSelectedAmount(amount)}
              style={styles.amountBtn}
            />
          ))}
        </View>
        <View style={styles.customAmount}>
          <Text style={styles.customLabel}>Or enter custom amount:</Text>
          <View style={styles.customInput}>
            <Text style={styles.customCurrency}>₹</Text>
            <Text style={styles.customValue}>{selectedAmount.toLocaleString()}</Text>
          </View>
        </View>
        <ProgressBar progress={advancePercentage} color={Colors.primary} height={8} style={styles.progressBar} />
        <Text style={styles.percentageText}>{Math.round(advancePercentage)}% of available</Text>
      </Card>

      {/* Loan Terms */}
      <Card style={styles.termsCard}>
        <Text style={styles.cardTitle}>Terms & Conditions</Text>
        <View style={styles.termItem}>
          <Text style={styles.termIcon}>✓</Text>
          <Text style={styles.termText}>Repayment over 3 months</Text>
        </View>
        <View style={styles.termItem}>
          <Text style={styles.termIcon}>✓</Text>
          <Text style={styles.termText}>Processing fee: 1%</Text>
        </View>
        <View style={styles.termItem}>
          <Text style={styles.termIcon}>✓</Text>
          <Text style={styles.termText}>Interest rate: 0% (employee benefit)</Text>
        </View>
        <View style={styles.termItem}>
          <Text style={styles.termIcon}>✓</Text>
          <Text style={styles.termText}>Instant disbursement to wallet</Text>
        </View>
      </Card>

      {/* Apply Button */}
      <Button
        title={`Apply for ${formatCurrency(selectedAmount)}`}
        variant="primary"
        fullWidth
        onPress={handleApply}
        style={styles.applyBtn}
      />

      {/* History */}
      <Text style={styles.sectionTitle}>Request History</Text>
      {history.map((advance) => (
        <Card key={advance.id} style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyAmount}>{formatCurrency(advance.amount)}</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: advance.status === 'disbursed' ? Colors.successLight : Colors.warningLight
            }]}>
              <Text style={[styles.statusText, {
                color: advance.status === 'disbursed' ? Colors.success : Colors.warning
              }]}>
                {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.historyDetails}>
            <Text style={styles.historyDate}>Requested: {advance.requestedOn}</Text>
            <Text style={styles.historyDate}>Repayment: {advance.repaymentDate}</Text>
          </View>
        </Card>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  eligibilityCard: {
    margin: Spacing.md,
    backgroundColor: Colors.primary,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eligibilityTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  eligibilityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  eligibilityBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  amountDisplay: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  amountLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginTop: Spacing.xs,
  },
  earnedCard: {
    marginHorizontal: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  earnedBar: {
    marginBottom: Spacing.md,
  },
  earnedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  earnedLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  earnedValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  selectorCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  amountSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amountBtn: {
    minWidth: 80,
  },
  customAmount: {
    marginTop: Spacing.lg,
  },
  customLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDark,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  customCurrency: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  customValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  progressBar: {
    marginTop: Spacing.lg,
  },
  percentageText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  termsCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  termIcon: {
    fontSize: FontSize.md,
    color: Colors.success,
    marginRight: Spacing.sm,
  },
  termText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  applyBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  historyCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
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
  historyDetails: {
    marginTop: Spacing.sm,
  },
  historyDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
