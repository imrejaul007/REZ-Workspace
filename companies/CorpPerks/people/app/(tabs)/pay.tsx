// ==========================================
// MyTalent - Pay Tab Screen (Payroll Hub)
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, StatusBadge, Button } from '../../src/components';
import { mockPayslips, mockTaxDetail } from '../../src/data/mockData';
import { getPayslips, getTaxDetails } from '../../src/services/payrollService';

export default function PayScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [payslips, setPayslips] = useState(mockPayslips);
  const [expandedTax, setExpandedTax] = useState(false);

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    const result = await getPayslips('EMP001');
    if (result.success && result.payslips) {
      setPayslips(result.payslips);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayslips();
    setRefreshing(false);
  };

  const latestPayslip = payslips[0];
  const totalEarnings = payslips.reduce((sum, p) => sum + p.grossPay, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Salary Summary Card */}
      <Card style={styles.salaryCard}>
        <View style={styles.salaryHeader}>
          <Text style={styles.salaryLabel}>Current Month Salary</Text>
          <StatusBadge status={latestPayslip?.status || 'pending'} />
        </View>
        <Text style={styles.salaryAmount}>{formatCurrency(latestPayslip?.netPay || 0)}</Text>
        <Text style={styles.salarySubtext}>Net Pay for {latestPayslip?.month} {latestPayslip?.year}</Text>

        <View style={styles.salaryBreakdown}>
          <View style={styles.salaryBreakdownItem}>
            <Text style={styles.salaryBreakdownLabel}>Basic</Text>
            <Text style={styles.salaryBreakdownValue}>{formatCurrency(latestPayslip?.basic || 0)}</Text>
          </View>
          <View style={styles.salaryBreakdownItem}>
            <Text style={styles.salaryBreakdownLabel}>Allowances</Text>
            <Text style={styles.salaryBreakdownValue}>{formatCurrency(latestPayslip?.allowances.total || 0)}</Text>
          </View>
          <View style={styles.salaryBreakdownItem}>
            <Text style={styles.salaryBreakdownLabel}>Deductions</Text>
            <Text style={[styles.salaryBreakdownValue, { color: Colors.error }]}>
              -{formatCurrency(latestPayslip?.deductions.total || 0)}
            </Text>
          </View>
        </View>

        <Button
          title="View Full Payslip"
          variant="primary"
          fullWidth
          onPress={() => navigation.navigate('PayslipDetail', { payslipId: latestPayslip?.id })}
          style={styles.viewPayslipBtn}
        />
      </Card>

      {/* PF/ESI Card */}
      <Card style={styles.pfCard}>
        <Text style={styles.cardTitle}>PF & ESI Details</Text>
        <View style={styles.pfRow}>
          <View style={styles.pfItem}>
            <Text style={styles.pfLabel}>UAN</Text>
            <Text style={styles.pfValue}>123456789012</Text>
          </View>
          <View style={styles.pfItem}>
            <Text style={styles.pfLabel}>Your Contribution</Text>
            <Text style={styles.pfValue}>{formatCurrency(latestPayslip?.deductions.pf || 0)}</Text>
          </View>
        </View>
        <View style={styles.pfRow}>
          <View style={styles.pfItem}>
            <Text style={styles.pfLabel}>PF Balance</Text>
            <Text style={styles.pfValue}>{formatCurrency(45600)}</Text>
          </View>
          <View style={styles.pfItem}>
            <Text style={styles.pfLabel}>Pension Balance</Text>
            <Text style={styles.pfValue}>{formatCurrency(85000)}</Text>
          </View>
        </View>
      </Card>

      {/* Tax Details */}
      <TouchableOpacity onPress={() => setExpandedTax(!expandedTax)}>
        <Card style={styles.taxCard}>
          <View style={styles.taxHeader}>
            <Text style={styles.cardTitle}>Tax Details</Text>
            <Text style={styles.expandIcon}>{expandedTax ? '−' : '+'}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Financial Year</Text>
            <Text style={styles.taxValue}>{mockTaxDetail.financialYear}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Total Income</Text>
            <Text style={styles.taxValue}>{formatCurrency(mockTaxDetail.totalIncome)}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Total Deductions</Text>
            <Text style={styles.taxValue}>{formatCurrency(mockTaxDetail.totalDeductions)}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Taxable Income</Text>
            <Text style={styles.taxValue}>{formatCurrency(mockTaxDetail.taxableIncome)}</Text>
          </View>
          {expandedTax && (
            <View style={styles.taxExpanded}>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Tax Slab</Text>
                <Text style={styles.taxValue}>{mockTaxDetail.taxSlab}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Estimated Tax</Text>
                <Text style={[styles.taxValue, { color: Colors.error }]}>
                  {formatCurrency(mockTaxDetail.estimatedTax)}
                </Text>
              </View>
            </View>
          )}
        </Card>
      </TouchableOpacity>

      {/* Bonus History */}
      <Card style={styles.bonusCard}>
        <View style={styles.bonusHeader}>
          <Text style={styles.cardTitle}>Bonus History</Text>
        </View>
        <View style={styles.bonusItem}>
          <View>
            <Text style={styles.bonusTitle}>Performance Bonus</Text>
            <Text style={styles.bonusDate}>March 2026</Text>
          </View>
          <Text style={styles.bonusAmount}>{formatCurrency(25000)}</Text>
        </View>
        <View style={styles.bonusItem}>
          <View>
            <Text style={styles.bonusTitle}>Festival Bonus</Text>
            <Text style={styles.bonusDate}>October 2025</Text>
          </View>
          <Text style={styles.bonusAmount}>{formatCurrency(15000)}</Text>
        </View>
        <View style={styles.bonusItem}>
          <View>
            <Text style={styles.bonusTitle}>Annual Bonus</Text>
            <Text style={styles.bonusDate}>April 2025</Text>
          </View>
          <Text style={styles.bonusAmount}>{formatCurrency(50000)}</Text>
        </View>
      </Card>

      {/* Incentive Earnings */}
      <Card style={styles.incentiveCard}>
        <Text style={styles.cardTitle}>Incentive Earnings</Text>
        <View style={styles.incentiveRow}>
          <View style={styles.incentiveItem}>
            <Text style={styles.incentiveValue}>{formatCurrency(12500)}</Text>
            <Text style={styles.incentiveLabel}>This Quarter</Text>
          </View>
          <View style={styles.incentiveItem}>
            <Text style={styles.incentiveValue}>{formatCurrency(45000)}</Text>
            <Text style={styles.incentiveLabel}>This Year</Text>
          </View>
        </View>
      </Card>

      {/* Reimbursements */}
      <Card style={styles.reimbursementCard}>
        <Text style={styles.cardTitle}>Reimbursements</Text>
        <View style={styles.reimbursementItem}>
          <View style={styles.reimbursementInfo}>
            <Text style={styles.reimbursementType}>Travel</Text>
            <StatusBadge status="paid" size="sm" />
          </View>
          <Text style={styles.reimbursementAmount}>{formatCurrency(5000)}</Text>
        </View>
        <View style={styles.reimbursementItem}>
          <View style={styles.reimbursementInfo}>
            <Text style={styles.reimbursementType}>Medical</Text>
            <StatusBadge status="pending" size="sm" />
          </View>
          <Text style={styles.reimbursementAmount}>{formatCurrency(8000)}</Text>
        </View>
        <View style={styles.reimbursementItem}>
          <View style={styles.reimbursementInfo}>
            <Text style={styles.reimbursementType}>Equipment</Text>
            <StatusBadge status="approved" size="sm" />
          </View>
          <Text style={styles.reimbursementAmount}>{formatCurrency(15000)}</Text>
        </View>
      </Card>

      {/* Overtime */}
      <Card style={styles.overtimeCard}>
        <View style={styles.overtimeHeader}>
          <Text style={styles.cardTitle}>Overtime Earnings</Text>
          <View style={styles.overtimeBadge}>
            <Text style={styles.overtimeBadgeText}>12 hours</Text>
          </View>
        </View>
        <Text style={styles.overtimeAmount}>{formatCurrency(3600)}</Text>
        <Text style={styles.overtimeSubtext}>This month</Text>
      </Card>

      {/* Payslip History */}
      <Text style={styles.sectionTitle}>Payslip History</Text>
      {payslips.map((payslip) => (
        <TouchableOpacity
          key={payslip.id}
          onPress={() => navigation.navigate('PayslipDetail', { payslipId: payslip.id })}
        >
          <Card style={styles.payslipItem}>
            <View style={styles.payslipInfo}>
              <Text style={styles.payslipMonth}>{payslip.month} {payslip.year}</Text>
              <StatusBadge status={payslip.status} size="sm" />
            </View>
            <View style={styles.payslipAmounts}>
              <View>
                <Text style={styles.payslipAmountLabel}>Gross</Text>
                <Text style={styles.payslipAmountValue}>{formatCurrency(payslip.grossPay)}</Text>
              </View>
              <View>
                <Text style={styles.payslipAmountLabel}>Net</Text>
                <Text style={[styles.payslipAmountValue, { color: Colors.success }]}>
                  {formatCurrency(payslip.netPay)}
                </Text>
              </View>
            </View>
            <Text style={styles.payslipArrow}>›</Text>
          </Card>
        </TouchableOpacity>
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
  salaryCard: {
    margin: Spacing.md,
  },
  salaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  salaryAmount: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  salarySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  salaryBreakdown: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  salaryBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  salaryBreakdownLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  salaryBreakdownValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  viewPayslipBtn: {
    marginTop: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  pfCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  pfRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  pfItem: {
    flex: 1,
  },
  pfLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  pfValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  taxCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  taxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 24,
    color: Colors.primary,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  taxLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  taxValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  taxExpanded: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  bonusCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  bonusHeader: {
    marginBottom: Spacing.md,
  },
  bonusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bonusTitle: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  bonusDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bonusAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  incentiveCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  incentiveRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  incentiveItem: {
    flex: 1,
    alignItems: 'center',
  },
  incentiveValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  incentiveLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  reimbursementCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  reimbursementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  reimbursementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reimbursementType: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  reimbursementAmount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  overtimeCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  overtimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overtimeBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  overtimeBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },
  overtimeAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  overtimeSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  payslipItem: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  payslipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  payslipMonth: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  payslipAmounts: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginRight: Spacing.md,
  },
  payslipAmountLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  payslipAmountValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  payslipArrow: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
