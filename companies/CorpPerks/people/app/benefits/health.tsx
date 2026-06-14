// ==========================================
// MyTalent - Health Benefits Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, formatCurrency } from '../../src/components/Badge';
import { Card, Button, StatusBadge, ProgressBar } from '../../src/components';
import { mockBenefits } from '../../src/data/mockData';
import { getHealthBenefits } from '../../src/services/benefitsService';

export default function HealthBenefitsScreen() {
  const [benefits, setBenefits] = useState(mockBenefits.filter((b) => b.category === 'health' || b.category === 'insurance'));

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    const result = await getHealthBenefits('EMP001');
    if (result.success && result.benefits) {
      setBenefits(result.benefits);
    }
  };

  const healthBenefit = benefits.find((b) => b.id === 'ben-1');
  const lifeBenefit = benefits.find((b) => b.id === 'ben-2');

  return (
    <ScrollView style={styles.container}>
      {/* Health Insurance */}
      <Card style={styles.insuranceCard}>
        <View style={styles.insuranceHeader}>
          <View style={styles.insuranceIcon}>
            <Text style={styles.iconEmoji}>🏥</Text>
          </View>
          <View style={styles.insuranceInfo}>
            <Text style={styles.insuranceTitle}>Health Insurance</Text>
            <Text style={styles.insuranceProvider}>via ICICI Lombard</Text>
          </View>
          <StatusBadge status="active" />
        </View>
        <View style={styles.coverageRow}>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Coverage</Text>
            <Text style={styles.coverageValue}>{formatCurrency(500000)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Premium</Text>
            <Text style={styles.coverageValue}>{formatCurrency(12000)}/yr</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Next Due</Text>
            <Text style={styles.coverageValue}>Jan 15, 2027</Text>
          </View>
        </View>
        <View style={styles.familyCover}>
          <Text style={styles.familyTitle}>Family Covered</Text>
          <View style={styles.familyList}>
            <Text style={styles.familyMember}>Self</Text>
            <Text style={styles.familyMember}>Spouse</Text>
            <Text style={styles.familyMember}>2 Children</Text>
          </View>
        </View>
      </Card>

      {/* Life Insurance */}
      <Card style={styles.insuranceCard}>
        <View style={styles.insuranceHeader}>
          <View style={styles.insuranceIcon}>
            <Text style={styles.iconEmoji}>🛡️</Text>
          </View>
          <View style={styles.insuranceInfo}>
            <Text style={styles.insuranceTitle}>Life Insurance</Text>
            <Text style={styles.insuranceProvider}>via HDFC Life</Text>
          </View>
          <StatusBadge status="active" />
        </View>
        <View style={styles.coverageRow}>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Sum Assured</Text>
            <Text style={styles.coverageValue}>{formatCurrency(2000000)}</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Premium</Text>
            <Text style={styles.coverageValue}>{formatCurrency(5000)}/mo</Text>
          </View>
          <View style={styles.coverageItem}>
            <Text style={styles.coverageLabel}>Term</Text>
            <Text style={styles.coverageValue}>20 years</Text>
          </View>
        </View>
      </Card>

      {/* Mental Wellness */}
      <Card style={styles.wellnessCard}>
        <View style={styles.wellnessHeader}>
          <View style={styles.wellnessIcon}>
            <Text style={styles.iconEmoji}>🧠</Text>
          </View>
          <View style={styles.wellnessInfo}>
            <Text style={styles.wellnessTitle}>Mental Wellness</Text>
            <Text style={styles.wellnessSubtitle}>Therapy & Counseling Sessions</Text>
          </View>
        </View>
        <View style={styles.sessionsRow}>
          <View style={styles.sessionsUsed}>
            <Text style={styles.sessionsNum}>2</Text>
            <Text style={styles.sessionsLabel}>Used</Text>
          </View>
          <View style={styles.sessionsDivider} />
          <View style={styles.sessionsRemaining}>
            <Text style={styles.sessionsNum}>4</Text>
            <Text style={styles.sessionsLabel}>Remaining</Text>
          </View>
          <View style={styles.sessionsDivider} />
          <View style={styles.sessionsTotal}>
            <Text style={styles.sessionsNum}>6</Text>
            <Text style={styles.sessionsLabel}>Total/Year</Text>
          </View>
        </View>
        <Button
          title="Book Session"
          variant="outline"
          fullWidth
          onPress={() => Alert.alert('Coming Soon', 'Session booking will be available soon!')}
          style={styles.bookBtn}
        />
      </Card>

      {/* Dental & Vision */}
      <Text style={styles.sectionTitle}>Dental & Vision</Text>
      <Card style={styles.dentalCard}>
        <View style={styles.dentalRow}>
          <View>
            <Text style={styles.dentalTitle}>Dental Coverage</Text>
            <Text style={styles.dentalDesc}>Annual checkup + treatments</Text>
          </View>
          <View style={styles.dentalStatus}>
            <Text style={styles.dentalValue}>₹5,000</Text>
            <Text style={styles.dentalLabel}>/year</Text>
          </View>
        </View>
      </Card>
      <Card style={styles.dentalCard}>
        <View style={styles.dentalRow}>
          <View>
            <Text style={styles.dentalTitle}>Vision Coverage</Text>
            <Text style={styles.dentalDesc}>Eye tests + eyewear allowance</Text>
          </View>
          <View style={styles.dentalStatus}>
            <Text style={styles.dentalValue}>₹3,000</Text>
            <Text style={styles.dentalLabel}>/year</Text>
          </View>
        </View>
      </Card>

      {/* Health Checkup */}
      <Card style={styles.checkupCard}>
        <View style={styles.checkupHeader}>
          <Text style={styles.checkupIcon}>🔬</Text>
          <View style={styles.checkupInfo}>
            <Text style={styles.checkupTitle}>Annual Health Checkup</Text>
            <Text style={styles.checkupDesc}>Comprehensive health screening</Text>
          </View>
        </View>
        <View style={styles.checkupDetails}>
          <View style={styles.checkupItem}>
            <Text style={styles.checkupValue}>Complete Blood Count</Text>
          </View>
          <View style={styles.checkupItem}>
            <Text style={styles.checkupValue}>Lipid Profile</Text>
          </View>
          <View style={styles.checkupItem}>
            <Text style={styles.checkupValue}>Liver Function</Text>
          </View>
          <View style={styles.checkupItem}>
            <Text style={styles.checkupValue}>Kidney Function</Text>
          </View>
          <View style={styles.checkupItem}>
            <Text style={styles.checkupValue}>Thyroid Panel</Text>
          </View>
        </View>
        <Button
          title="Schedule Checkup"
          variant="primary"
          fullWidth
          onPress={() => Alert.alert('Coming Soon', 'Checkup scheduling will be available soon!')}
          style={styles.scheduleBtn}
        />
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
  insuranceCard: {
    margin: Spacing.md,
  },
  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insuranceIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 24,
  },
  insuranceInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  insuranceTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  insuranceProvider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  coverageRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  coverageItem: {
    flex: 1,
    alignItems: 'center',
  },
  coverageLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  coverageValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  familyCover: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  familyTitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  familyList: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  familyMember: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  wellnessCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wellnessIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  wellnessTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  wellnessSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sessionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  sessionsUsed: {
    flex: 1,
    alignItems: 'center',
  },
  sessionsRemaining: {
    flex: 1,
    alignItems: 'center',
  },
  sessionsTotal: {
    flex: 1,
    alignItems: 'center',
  },
  sessionsDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  sessionsNum: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  sessionsLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  bookBtn: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dentalCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dentalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dentalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  dentalDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dentalStatus: {
    alignItems: 'flex-end',
  },
  dentalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  dentalLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  checkupCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  checkupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkupIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  checkupInfo: {
    flex: 1,
  },
  checkupTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  checkupDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkupDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  checkupItem: {
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  checkupValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  scheduleBtn: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
