// ==========================================
// MyTalent - Loans Screen
// ==========================================

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, formatCurrency } from '../../src/components/Badge';
import { Card, Button } from '../../src/components';
import { getLoanOffers } from '../../src/services/ridzaService';

export default function LoansScreen() {
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    const result = await getLoanOffers();
    if (result.success && result.loans) {
      setLoans(result.loans);
    }
  };

  const handleApply = (loan: any) => {
    Alert.alert(
      'Check Eligibility',
      `Check your eligibility for ${loan.name}?\n\nAmount: ${formatCurrency(loan.minAmount)} - ${formatCurrency(loan.maxAmount)}\nInterest: ${loan.interestRate}% p.a.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Eligibility', onPress: () => Alert.alert('Coming Soon', 'Eligibility check will be available soon!') },
      ]
    );
  };

  const loanTypes = [
    { key: 'all', label: 'All' },
    { key: 'personal', label: 'Personal' },
    { key: 'salary-based', label: 'Salary Based' },
    { key: 'home', label: 'Home' },
    { key: 'education', label: 'Education' },
  ];

  const filteredLoans = selectedType === 'all'
    ? loans
    : loans.filter((l) => l.type === selectedType);

  return (
    <ScrollView style={styles.container}>
      {/* Loan Types */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typesScroll}
        contentContainerStyle={styles.typesContainer}
      >
        {loanTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.typeBtn, selectedType === type.key && styles.typeBtnActive]}
            onPress={() => setSelectedType(type.key)}
          >
            <Text style={[styles.typeText, selectedType === type.key && styles.typeTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loan Cards */}
      {filteredLoans.map((loan) => (
        <Card key={loan.id} style={styles.loanCard}>
          <View style={styles.loanHeader}>
            <View>
              <Text style={styles.loanName}>{loan.name}</Text>
              <Text style={styles.loanAmount}>
                {formatCurrency(loan.minAmount)} - {formatCurrency(loan.maxAmount)}
              </Text>
            </View>
            <View style={styles.interestBadge}>
              <Text style={styles.interestValue}>{loan.interestRate}%</Text>
              <Text style={styles.interestLabel}>p.a.</Text>
            </View>
          </View>

          <View style={styles.loanDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tenure</Text>
              <Text style={styles.detailValue}>{loan.minTenure} - {loan.maxTenure} months</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Processing Fee</Text>
              <Text style={styles.detailValue}>{loan.processingFee}%</Text>
            </View>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Features</Text>
            <View style={styles.featuresList}>
              {loan.features.map((feature: string, index: number) => (
                <View key={index} style={styles.featureTag}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.eligibilitySection}>
            <Text style={styles.eligibilityLabel}>Eligibility:</Text>
            <Text style={styles.eligibilityValue}>{loan.eligibility}</Text>
          </View>

          <Button
            title="Check Eligibility"
            variant="primary"
            fullWidth
            onPress={() => handleApply(loan)}
            style={styles.applyBtn}
          />
        </Card>
      ))}

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoTitle}>Quick Tips</Text>
        </View>
        <Text style={styles.infoText}>• Compare interest rates before applying</Text>
        <Text style={styles.infoText}>• Check your credit score for better rates</Text>
        <Text style={styles.infoText}>• Consider prepayment options</Text>
        <Text style={styles.infoText}>• Read all terms and conditions carefully</Text>
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
  typesScroll: {
    marginTop: Spacing.md,
  },
  typesContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  typeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeTextActive: {
    color: Colors.textInverse,
  },
  loanCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  loanAmount: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  interestBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  interestValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  interestLabel: {
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  loanDetails: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  featuresSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  featuresTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  featuresList: {},
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureIcon: {
    fontSize: FontSize.sm,
    color: Colors.success,
    marginRight: Spacing.xs,
  },
  featureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  eligibilitySection: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  eligibilityLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginRight: 4,
  },
  eligibilityValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  applyBtn: {
    marginTop: Spacing.md,
  },
  infoCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.primaryLight,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
