// ==========================================
// MyTalent - Investments Screen
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, ProgressRing, ProgressBar } from '../../src/components';
import { mockWealthData } from '../../src/data/mockData';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  stocks: { icon: '📊', color: Colors.primary },
  mutual_funds: { icon: '📈', color: Colors.success },
  fixed_deposit: { icon: '🏦', color: Colors.secondary },
  ppf: { icon: '📉', color: Colors.warning },
  nps: { icon: '🛡️', color: '#8B5CF6' },
  gold: { icon: '🥇', color: '#F59E0B' },
  crypto: { icon: '₿', color: '#EC4899' },
  other: { icon: '💰', color: Colors.textMuted },
};

export default function InvestmentsScreen() {
  const investments = mockWealthData.investments;
  const [selectedType, setSelectedType] = useState<string | 'all'>('all');

  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturns = investments.reduce((sum, inv) => sum + inv.returns, 0);
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  const filteredInvestments = selectedType === 'all'
    ? investments
    : investments.filter(inv => inv.type === selectedType);

  const typeLabels: Record<string, string> = {
    all: 'All',
    stocks: 'Stocks',
    mutual_funds: 'Mutual Funds',
    fixed_deposit: 'Fixed Deposits',
    ppf: 'PPF',
    nps: 'NPS',
    gold: 'Gold',
    crypto: 'Crypto',
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryLabel}>Total Investment Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
          </View>
          <ProgressRing
            progress={(totalReturns / totalInvested) * 100}
            size={60}
            strokeWidth={6}
            color={totalReturns >= 0 ? Colors.success : Colors.error}
          />
        </View>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>Invested</Text>
            <Text style={styles.summaryStatValue}>{formatCurrency(totalInvested)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatLabel}>Returns</Text>
            <Text style={[styles.summaryStatValue, { color: totalReturns >= 0 ? Colors.success : Colors.error }]}>
              {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {Object.entries(typeLabels).map(([type, label]) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, selectedType === type && styles.filterTabActive]}
            onPress={() => setSelectedType(type)}
          >
            <Text style={[styles.filterLabel, selectedType === type && styles.filterLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Investments List */}
      {filteredInvestments.map((investment) => {
        const config = TYPE_CONFIG[investment.type] || TYPE_CONFIG.other;
        const portfolioPercent = (investment.currentValue / totalValue) * 100;

        return (
          <Card key={investment.id} style={styles.investmentCard}>
            <View style={styles.investmentHeader}>
              <View style={[styles.investmentIcon, { backgroundColor: `${config.color}20` }]}>
                <Text style={styles.investmentEmoji}>{config.icon}</Text>
              </View>
              <View style={styles.investmentInfo}>
                <Text style={styles.investmentName}>{investment.name}</Text>
                <Text style={styles.investmentProvider}>{investment.provider}</Text>
              </View>
              <View style={styles.investmentReturns}>
                <Text style={[styles.investmentReturnValue, { color: investment.returns >= 0 ? Colors.success : Colors.error }]}>
                  {investment.returns >= 0 ? '+' : ''}{investment.returnsPercent.toFixed(1)}%
                </Text>
                <Text style={styles.investmentReturnLabel}>all time</Text>
              </View>
            </View>

            <View style={styles.investmentValues}>
              <View style={styles.valueColumn}>
                <Text style={styles.valueLabel}>Invested</Text>
                <Text style={styles.valueAmount}>{formatCurrency(investment.amount)}</Text>
              </View>
              <View style={styles.valueColumn}>
                <Text style={styles.valueLabel}>Current Value</Text>
                <Text style={styles.valueAmount}>{formatCurrency(investment.currentValue)}</Text>
              </View>
              <View style={styles.valueColumn}>
                <Text style={styles.valueLabel}>Returns</Text>
                <Text style={[styles.valueAmount, { color: investment.returns >= 0 ? Colors.success : Colors.error }]}>
                  {investment.returns >= 0 ? '+' : ''}{formatCurrency(investment.returns)}
                </Text>
              </View>
            </View>

            <View style={styles.portfolioSection}>
              <View style={styles.portfolioHeader}>
                <Text style={styles.portfolioLabel}>Portfolio Weight</Text>
                <Text style={styles.portfolioPercent}>{portfolioPercent.toFixed(1)}%</Text>
              </View>
              <ProgressBar progress={portfolioPercent} color={config.color} height={6} />
            </View>

            <Text style={styles.lastUpdated}>Last updated: {investment.lastUpdated}</Text>
          </Card>
        );
      })}

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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  summaryValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  summaryStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  summaryStatValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  filterContainer: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    ...Shadow.sm,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.textInverse,
  },
  investmentCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  investmentIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  investmentEmoji: {
    fontSize: 24,
  },
  investmentInfo: {
    flex: 1,
  },
  investmentName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  investmentProvider: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  investmentReturns: {
    alignItems: 'flex-end',
  },
  investmentReturnValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  investmentReturnLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  investmentValues: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundDark,
    borderRadius: BorderRadius.md,
  },
  valueColumn: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  valueAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  portfolioSection: {
    marginBottom: Spacing.sm,
  },
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  portfolioLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  portfolioPercent: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  lastUpdated: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
