// ==========================================
// MyTalent - Wealth Dashboard (9th Tab)
// Net Worth, Properties, Investments, Retirement
// ==========================================

import React, { useState } from 'react';
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
import { Card, ProgressRing, ProgressBar } from '../../src/components';
import { mockWealthData, mockRetirementProjection } from '../../src/data/mockData';

export default function WealthScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const wealth = mockWealthData;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalInvestmentsValue = wealth.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturns = wealth.investments.reduce((sum, inv) => sum + inv.returns, 0);
  const totalInsuranceCover = wealth.insurance.reduce((sum, ins) => sum + ins.sumAssured, 0);
  const retirementProgress = (wealth.retirementCorpus / wealth.targetCorpus) * 100;

  const wealthSummary = [
    {
      id: 'networth',
      title: 'Net Worth',
      value: wealth.netWorth,
      icon: '💎',
      color: Colors.primary,
      onPress: () => {},
    },
    {
      id: 'properties',
      title: 'Properties',
      value: wealth.properties.reduce((sum, p) => sum + p.currentValue, 0),
      icon: '🏠',
      color: Colors.success,
      onPress: () => navigation.navigate('Properties'),
    },
    {
      id: 'investments',
      title: 'Investments',
      value: totalInvestmentsValue,
      icon: '📈',
      color: Colors.secondary,
      onPress: () => navigation.navigate('Investments'),
    },
    {
      id: 'insurance',
      title: 'Insurance',
      value: totalInsuranceCover,
      icon: '🛡️',
      color: Colors.warning,
      onPress: () => navigation.navigate('InsurancePolicies'),
    },
  ];

  const quickActions = [
    { id: 'retirement', title: 'Retirement Calculator', icon: '🧮', color: Colors.primary, onPress: () => navigation.navigate('Retirement') },
    { id: 'emi', title: 'EMI Calculator', icon: '💳', color: Colors.secondary, onPress: () => navigation.navigate('EMI') },
    { id: 'tax', title: 'Tax Planning', icon: '📋', color: Colors.success, onPress: () => {} },
    { id: 'goals', title: 'Financial Goals', icon: '🎯', color: Colors.warning, onPress: () => {} },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wealth Dashboard</Text>
        <Text style={styles.headerSubtitle}>Your financial health at a glance</Text>
      </View>

      {/* Net Worth Card */}
      <Card style={styles.netWorthCard}>
        <View style={styles.netWorthHeader}>
          <View>
            <Text style={styles.netWorthLabel}>Total Net Worth</Text>
            <Text style={styles.netWorthValue}>{formatCurrency(wealth.netWorth)}</Text>
          </View>
          <ProgressRing
            progress={retirementProgress}
            size={80}
            strokeWidth={8}
            color={wealth.retirementScore >= 70 ? Colors.success : Colors.warning}
          />
        </View>
        <View style={styles.netWorthDetails}>
          <View style={styles.netWorthItem}>
            <Text style={styles.netWorthItemLabel}>Monthly Income</Text>
            <Text style={styles.netWorthItemValue}>{formatCurrency(wealth.monthlyIncome)}</Text>
          </View>
          <View style={styles.netWorthItem}>
            <Text style={styles.netWorthItemLabel}>Monthly Expenses</Text>
            <Text style={styles.netWorthItemValue}>{formatCurrency(wealth.monthlyExpenses)}</Text>
          </View>
          <View style={styles.netWorthItem}>
            <Text style={styles.netWorthItemLabel}>Savings Rate</Text>
            <Text style={[styles.netWorthItemValue, { color: Colors.success }]}>
              {wealth.savingsRate}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Wealth Summary Grid */}
      <View style={styles.summaryGrid}>
        {wealthSummary.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.summaryCard}
            onPress={item.onPress}
          >
            <View style={[styles.summaryIcon, { backgroundColor: `${item.color}20` }]}>
              <Text style={styles.summaryEmoji}>{item.icon}</Text>
            </View>
            <Text style={styles.summaryTitle}>{item.title}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(item.value)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Retirement Score Card */}
      <Card style={styles.retirementCard}>
        <View style={styles.retirementHeader}>
          <Text style={styles.cardTitle}>Retirement Readiness</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Retirement')}>
            <Text style={styles.viewAllText}>Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.retirementContent}>
          <View style={styles.retirementScore}>
            <Text style={[
              styles.retirementScoreValue,
              { color: wealth.retirementScore >= 70 ? Colors.success : Colors.warning }
            ]}>
              {wealth.retirementScore}%
            </Text>
            <Text style={styles.retirementScoreLabel}>Retirement Score</Text>
          </View>
          <View style={styles.retirementDetails}>
            <View style={styles.retirementRow}>
              <Text style={styles.retirementRowLabel}>Target Age</Text>
              <Text style={styles.retirementRowValue}>{wealth.retirementAge} years</Text>
            </View>
            <View style={styles.retirementRow}>
              <Text style={styles.retirementRowLabel}>Current Corpus</Text>
              <Text style={styles.retirementRowValue}>{formatCurrency(wealth.retirementCorpus)}</Text>
            </View>
            <View style={styles.retirementRow}>
              <Text style={styles.retirementRowLabel}>Target Corpus</Text>
              <Text style={styles.retirementRowValue}>{formatCurrency(wealth.targetCorpus)}</Text>
            </View>
            <View style={styles.retirementRow}>
              <Text style={styles.retirementRowLabel}>Projected</Text>
              <Text style={[styles.retirementRowValue, { color: Colors.success }]}>
                {formatCurrency(mockRetirementProjection.projectedCorpus)}
              </Text>
            </View>
          </View>
        </View>
        <ProgressBar
          progress={retirementProgress}
          color={wealth.retirementScore >= 70 ? Colors.success : Colors.warning}
          height={8}
        />
      </Card>

      {/* Investment Returns Summary */}
      <Card style={styles.returnsCard}>
        <Text style={styles.cardTitle}>Investment Returns</Text>
        <View style={styles.returnsContent}>
          <View style={styles.returnItem}>
            <Text style={styles.returnValue}>{formatCurrency(totalInvestmentsValue)}</Text>
            <Text style={styles.returnLabel}>Total Value</Text>
          </View>
          <View style={styles.returnDivider} />
          <View style={styles.returnItem}>
            <Text style={[styles.returnValue, { color: Colors.success }]}>
              +{formatCurrency(totalReturns)}
            </Text>
            <Text style={styles.returnLabel}>Total Returns</Text>
          </View>
        </View>
        <View style={styles.returnsBreakdown}>
          {wealth.investments.slice(0, 4).map((inv) => (
            <View key={inv.id} style={styles.returnsBreakdownItem}>
              <View style={styles.returnsBreakdownHeader}>
                <Text style={styles.returnsBreakdownName}>{inv.name}</Text>
                <Text style={[styles.returnsBreakdownPercent, { color: inv.returns >= 0 ? Colors.success : Colors.error }]}>
                  {inv.returnsPercent >= 0 ? '+' : ''}{inv.returnsPercent.toFixed(1)}%
                </Text>
              </View>
              <ProgressBar
                progress={Math.min((inv.currentValue / totalInvestmentsValue) * 100, 100)}
                color={inv.returns >= 0 ? Colors.success : Colors.error}
                height={4}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Financial Tools</Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionCard}
            onPress={action.onPress}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
              <Text style={styles.quickActionEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.quickActionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Properties Summary */}
      <Card style={styles.propertiesCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Properties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Properties')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {wealth.properties.slice(0, 2).map((property) => (
          <View key={property.id} style={styles.propertyItem}>
            <View style={styles.propertyIcon}>
              <Text style={styles.propertyEmoji}>
                {property.type === 'apartment' ? '🏢' : property.type === 'land' ? '🌍' : '🏠'}
              </Text>
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyName}>{property.name}</Text>
              <Text style={styles.propertyAddress}>{property.address}</Text>
            </View>
            <View style={styles.propertyValue}>
              <Text style={styles.propertyValueText}>{formatCurrency(property.currentValue)}</Text>
              <Text style={styles.propertyGain}>
                +{formatCurrency(property.currentValue - property.purchaseValue)} gain
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Insurance Summary */}
      <Card style={styles.insuranceCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Insurance Coverage</Text>
          <TouchableOpacity onPress={() => navigation.navigate('InsurancePolicies')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.insuranceOverview}>
          <View style={styles.insuranceItem}>
            <Text style={styles.insuranceIcon}>🛡️</Text>
            <Text style={styles.insuranceLabel}>Life Cover</Text>
            <Text style={styles.insuranceValue}>
              {formatCurrency(wealth.insurance.find(i => i.type === 'term')?.sumAssured || 0)}
            </Text>
          </View>
          <View style={styles.insuranceItem}>
            <Text style={styles.insuranceIcon}>🏥</Text>
            <Text style={styles.insuranceLabel}>Health Cover</Text>
            <Text style={styles.insuranceValue}>
              {formatCurrency(wealth.insurance.find(i => i.type === 'health')?.sumAssured || 0)}
            </Text>
          </View>
        </View>
        <View style={styles.insuranceTotal}>
          <Text style={styles.insuranceTotalLabel}>Total Coverage</Text>
          <Text style={styles.insuranceTotalValue}>{formatCurrency(totalInsuranceCover)}</Text>
        </View>
      </Card>

      {/* Integration Note */}
      <Card style={styles.integrationCard}>
        <View style={styles.integrationHeader}>
          <Text style={styles.integrationIcon}>🔗</Text>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationTitle}>RisnaEstate Integration</Text>
            <Text style={styles.integrationText}>
              Properties synced from your RisnaEstate account
            </Text>
          </View>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  netWorthCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  netWorthValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginTop: 4,
  },
  netWorthDetails: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  netWorthItem: {
    flex: 1,
  },
  netWorthItemLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  netWorthItemValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  summaryEmoji: {
    fontSize: 20,
  },
  summaryTitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  retirementCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  retirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  retirementContent: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  retirementScore: {
    marginRight: Spacing.lg,
  },
  retirementScoreValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  retirementScoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  retirementDetails: {
    flex: 1,
  },
  retirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  retirementRowLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  retirementRowValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  returnsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  returnsContent: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  returnItem: {
    flex: 1,
    alignItems: 'center',
  },
  returnDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  returnValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  returnLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  returnsBreakdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  returnsBreakdownItem: {
    marginBottom: Spacing.sm,
  },
  returnsBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  returnsBreakdownName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  returnsBreakdownPercent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  quickActionEmoji: {
    fontSize: 18,
  },
  quickActionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  propertiesCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  propertyIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  propertyEmoji: {
    fontSize: 22,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  propertyAddress: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  propertyValue: {
    alignItems: 'flex-end',
  },
  propertyValueText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  propertyGain: {
    fontSize: FontSize.xs,
    color: Colors.success,
    marginTop: 2,
  },
  insuranceCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  insuranceOverview: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  insuranceItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
    marginHorizontal: 4,
  },
  insuranceIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  insuranceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  insuranceValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  insuranceTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  insuranceTotalLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  insuranceTotalValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  integrationCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.backgroundDark,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  integrationIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  integrationText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
