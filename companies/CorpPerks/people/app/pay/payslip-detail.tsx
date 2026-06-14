// ==========================================
// MyTalent - Payslip Detail Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, formatCurrency } from '../../src/components/Badge';
import { Card, Button, StatusBadge } from '../../src/components';
import { mockPayslips } from '../../src/data/mockData';
import { getPayslip, downloadPayslip } from '../../src/services/payrollService';

type PayStackParamList = {
  PayslipDetail: { payslipId: string };
};

export default function PayslipDetailScreen() {
  const route = useRoute<RouteProp<PayStackParamList, 'PayslipDetail'>>();
  const { payslipId } = route.params;
  const [payslip, setPayslip] = useState(mockPayslips.find((p) => p.id === payslipId) || mockPayslips[0]);

  useEffect(() => {
    loadPayslip();
  }, [payslipId]);

  const loadPayslip = async () => {
    const result = await getPayslip('EMP001', payslipId);
    if (result.success && result.payslip) {
      setPayslip(result.payslip);
    }
  };

  const handleDownload = async () => {
    const result = await downloadPayslip('EMP001', payslipId);
    if (result.success && result.url) {
      Alert.alert('Download', 'Payslip downloaded successfully!');
    } else {
      Alert.alert('Download', 'Feature coming soon!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Payslip Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerMonth}>{payslip.month} {payslip.year}</Text>
            <Text style={styles.headerCompany}>CorpPerks</Text>
          </View>
          <StatusBadge status={payslip.status} />
        </View>
        <View style={styles.netPayRow}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayValue}>{formatCurrency(payslip.netPay)}</Text>
        </View>
        <Text style={styles.paymentDate}>
          {payslip.status === 'paid' ? `Paid on ${payslip.paymentDate}` : `Payment due: ${payslip.paymentDate}`}
        </Text>
      </Card>

      {/* Earnings */}
      <Text style={styles.sectionTitle}>Earnings</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>Basic Salary</Text>
          <Text style={styles.lineValue}>{formatCurrency(payslip.basic)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>HRA</Text>
          <Text style={styles.lineValue}>{formatCurrency(payslip.allowances.hra)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>Transport Allowance</Text>
          <Text style={styles.lineValue}>{formatCurrency(payslip.allowances.transport)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>Medical Allowance</Text>
          <Text style={styles.lineValue}>{formatCurrency(payslip.allowances.medical)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>Other Allowances</Text>
          <Text style={styles.lineValue}>{formatCurrency(payslip.allowances.other)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.lineItem}>
          <Text style={styles.totalLabel}>Gross Pay</Text>
          <Text style={styles.totalValue}>{formatCurrency(payslip.grossPay)}</Text>
        </View>
      </Card>

      {/* Deductions */}
      <Text style={styles.sectionTitle}>Deductions</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>Provident Fund (PF)</Text>
          <Text style={[styles.lineValue, { color: Colors.error }]}>-{formatCurrency(payslip.deductions.pf)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>ESI</Text>
          <Text style={[styles.lineValue, { color: Colors.error }]}>-{formatCurrency(payslip.deductions.esic)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>TDS</Text>
          <Text style={[styles.lineValue, { color: Colors.error }]}>-{formatCurrency(payslip.deductions.tds)}</Text>
        </View>
        <View style={styles.lineItem}>
          <Text style={styles.lineLabel}>Other Deductions</Text>
          <Text style={[styles.lineValue, { color: Colors.error }]}>-{formatCurrency(payslip.deductions.other)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.lineItem}>
          <Text style={styles.totalLabel}>Total Deductions</Text>
          <Text style={[styles.totalValue, { color: Colors.error }]}>-{formatCurrency(payslip.deductions.total)}</Text>
        </View>
      </Card>

      {/* Net Pay Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Gross Pay</Text>
          <Text style={styles.summaryValue}>{formatCurrency(payslip.grossPay)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Deductions</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>-{formatCurrency(payslip.deductions.total)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.netLabel}>Net Pay</Text>
          <Text style={styles.netValue}>{formatCurrency(payslip.netPay)}</Text>
        </View>
      </Card>

      {/* Days Paid */}
      <Card style={styles.daysCard}>
        <View style={styles.daysRow}>
          <Text style={styles.daysLabel}>Days Paid</Text>
          <Text style={styles.daysValue}>{payslip.daysPaid} days</Text>
        </View>
      </Card>

      {/* Download Button */}
      <Button
        title="Download Payslip"
        variant="primary"
        fullWidth
        onPress={handleDownload}
        style={styles.downloadBtn}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCard: {
    margin: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerMonth: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerCompany: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  netPayRow: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  netPayLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  netPayValue: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: Colors.success,
    marginTop: 4,
  },
  paymentDate: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  lineLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  lineValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  netLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  netValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  daysCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  daysValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  downloadBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
