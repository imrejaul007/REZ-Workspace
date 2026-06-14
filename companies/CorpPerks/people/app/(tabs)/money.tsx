// ==========================================
// MyTalent - Money Tab Screen (RidZa Integration)
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
import { Card, Button, ProgressRing, ScoreCard } from '../../src/components';
import { mockFinancialHealth } from '../../src/data/mockData';
import { getFinancialHealth } from '../../src/services/ridzaService';

export default function MoneyScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [financialHealth, setFinancialHealth] = useState(mockFinancialHealth);

  useEffect(() => {
    loadFinancialHealth();
  }, []);

  const loadFinancialHealth = async () => {
    const result = await getFinancialHealth('EMP001');
    if (result.success && result.health) {
      setFinancialHealth(result.health);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinancialHealth();
    setRefreshing(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  const moneyActions = [
    {
      id: 'salary-advance',
      title: 'Salary Advance',
      subtitle: 'Get paid early',
      icon: '💰',
      color: Colors.primary,
      onPress: () => navigation.navigate('SalaryAdvance'),
    },
    {
      id: 'credit-cards',
      title: 'Credit Cards',
      subtitle: 'Compare & Apply',
      icon: '💳',
      color: Colors.secondary,
      onPress: () => navigation.navigate('CreditCards'),
    },
    {
      id: 'loans',
      title: 'Loans',
      subtitle: 'Personal, Home, Education',
      icon: '🏦',
      color: Colors.success,
      onPress: () => navigation.navigate('Loans'),
    },
    {
      id: 'insurance',
      title: 'Insurance',
      subtitle: 'Health & Life',
      icon: '🛡️',
      color: Colors.warning,
      onPress: () => navigation.navigate('Insurance'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Financial Health Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Financial Health Score</Text>
          <View style={[styles.scoreBadge, { backgroundColor: `${getScoreColor(financialHealth.score)}20` }]}>
            <Text style={[styles.scoreBadgeText, { color: getScoreColor(financialHealth.score) }]}>
              {financialHealth.score >= 80 ? 'Good' : financialHealth.score >= 60 ? 'Fair' : 'Needs Work'}
            </Text>
          </View>
        </View>
        <View style={styles.scoreMain}>
          <ProgressRing
            progress={financialHealth.score}
            size={120}
            strokeWidth={12}
            color={getScoreColor(financialHealth.score)}
          />
          <View style={styles.scoreDetails}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Income Health</Text>
              <View style={styles.scoreItemBar}>
                <View style={[styles.scoreItemProgress, { width: `${financialHealth.incomeHealth}%`, backgroundColor: Colors.success }]} />
              </View>
              <Text style={styles.scoreItemValue}>{financialHealth.incomeHealth}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Savings Health</Text>
              <View style={styles.scoreItemBar}>
                <View style={[styles.scoreItemProgress, { width: `${financialHealth.savingsHealth}%`, backgroundColor: Colors.primary }]} />
              </View>
              <Text style={styles.scoreItemValue}>{financialHealth.savingsHealth}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Debt Health</Text>
              <View style={styles.scoreItemBar}>
                <View style={[styles.scoreItemProgress, { width: `${financialHealth.debtHealth}%`, backgroundColor: Colors.warning }]} />
              </View>
              <Text style={styles.scoreItemValue}>{financialHealth.debtHealth}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Card style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>Monthly Income</Text>
          <Text style={styles.quickStatValue}>{formatCurrency(financialHealth.monthlyIncome)}</Text>
        </Card>
        <Card style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>Savings Rate</Text>
          <Text style={[styles.quickStatValue, { color: Colors.success }]}>
            {financialHealth.savingsRate}%
          </Text>
        </Card>
      </View>

      {/* Money Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {moneyActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
              <Text style={styles.actionEmoji}>{action.icon}</Text>
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Salary Advance Section */}
      <Card style={styles.advanceCard}>
        <View style={styles.advanceHeader}>
          <View>
            <Text style={styles.advanceTitle}>Salary Advance</Text>
            <Text style={styles.advanceSubtitle}>Available: {formatCurrency(50000)}</Text>
          </View>
          <Button
            title="Apply"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('SalaryAdvance')}
          />
        </View>
        <View style={styles.advanceInfo}>
          <View style={styles.advanceInfoItem}>
            <Text style={styles.advanceInfoLabel}>Earned This Month</Text>
            <Text style={styles.advanceInfoValue}>{formatCurrency(42000)}</Text>
          </View>
          <View style={styles.advanceInfoItem}>
            <Text style={styles.advanceInfoLabel}>Next Payday</Text>
            <Text style={styles.advanceInfoValue}>June 1</Text>
          </View>
        </View>
      </Card>

      {/* Credit Card Marketplace */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Credit Card Marketplace</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreditCards')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
        <Card style={styles.cardOffer}>
          <View style={styles.cardOfferHeader}>
            <Text style={styles.cardOfferIcon}>💳</Text>
            <View>
              <Text style={styles.cardOfferName}>RidZa Cashback</Text>
              <Text style={styles.cardOfferBank}>RidZa Bank</Text>
            </View>
          </View>
          <Text style={styles.cardOfferFeature}>5% Cashback</Text>
          <Text style={styles.cardOfferFee}>No Annual Fee</Text>
          <Button
            title="Apply"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('CreditCards')}
            style={styles.cardApplyBtn}
          />
        </Card>
        <Card style={styles.cardOffer}>
          <View style={styles.cardOfferHeader}>
            <Text style={styles.cardOfferIcon}>💳</Text>
            <View>
              <Text style={styles.cardOfferName}>RidZa Platinum</Text>
              <Text style={styles.cardOfferBank}>RidZa Bank</Text>
            </View>
          </View>
          <Text style={styles.cardOfferFeature}>10% Cashback</Text>
          <Text style={styles.cardOfferFee}>₹999/year</Text>
          <Button
            title="Apply"
            variant="outline"
            size="sm"
            onPress={() => navigation.navigate('CreditCards')}
            style={styles.cardApplyBtn}
          />
        </Card>
      </ScrollView>

      {/* Loan Marketplace */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Loan Offers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Loans')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.loanCard}>
        <View style={styles.loanCardHeader}>
          <Text style={styles.loanIcon}>🏦</Text>
          <View style={styles.loanCardInfo}>
            <Text style={styles.loanTitle}>Personal Loan</Text>
            <Text style={styles.loanSubtitle}>Up to {formatCurrency(500000)}</Text>
          </View>
          <View style={styles.loanRate}>
            <Text style={styles.loanRateValue}>10.5%</Text>
            <Text style={styles.loanRateLabel}>p.a.</Text>
          </View>
        </View>
        <View style={styles.loanFeatures}>
          <Text style={styles.loanFeature}>Quick approval</Text>
          <Text style={styles.loanFeature}>No collateral</Text>
          <Text style={styles.loanFeature}>Flexible tenure</Text>
        </View>
        <Button
          title="Check Eligibility"
          variant="primary"
          fullWidth
          onPress={() => navigation.navigate('Loans')}
          style={styles.loanApplyBtn}
        />
      </Card>

      {/* Insurance Marketplace */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Insurance Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Insurance')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.insuranceCard}>
        <View style={styles.insuranceItem}>
          <View style={styles.insuranceIcon}>🏥</View>
          <View style={styles.insuranceInfo}>
            <Text style={styles.insuranceTitle}>Health Cover</Text>
            <Text style={styles.insuranceCoverage}>₹5L coverage @ ₹500/month</Text>
          </View>
          <Button
            title="Apply"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Insurance')}
          />
        </View>
        <View style={[styles.insuranceItem, styles.insuranceItemBorder]}>
          <View style={styles.insuranceIcon}>🛡️</View>
          <View style={styles.insuranceInfo}>
            <Text style={styles.insuranceTitle}>Term Life</Text>
            <Text style={styles.insuranceCoverage}>₹50L @ ₹300/month</Text>
          </View>
          <Button
            title="Apply"
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Insurance')}
          />
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
  scoreCard: {
    backgroundColor: Colors.card,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  scoreBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  scoreDetails: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  scoreItem: {
    marginBottom: Spacing.sm,
  },
  scoreItemLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  scoreItemBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreItemProgress: {
    height: '100%',
    borderRadius: 4,
  },
  scoreItemValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  quickStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadow.sm,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  advanceCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  advanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advanceTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  advanceSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
    marginTop: 4,
  },
  advanceInfo: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  advanceInfoItem: {
    flex: 1,
  },
  advanceInfoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  advanceInfoValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  cardsScroll: {
    paddingLeft: Spacing.md,
  },
  cardOffer: {
    width: 180,
    marginRight: Spacing.sm,
  },
  cardOfferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardOfferIcon: {
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  cardOfferName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  cardOfferBank: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  cardOfferFeature: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  cardOfferFee: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cardApplyBtn: {
    marginTop: Spacing.md,
  },
  loanCard: {
    marginHorizontal: Spacing.md,
  },
  loanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  loanCardInfo: {
    flex: 1,
  },
  loanTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  loanSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loanRate: {
    alignItems: 'center',
  },
  loanRateValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  loanRateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  loanFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loanFeature: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  loanApplyBtn: {
    marginTop: Spacing.md,
  },
  insuranceCard: {
    marginHorizontal: Spacing.md,
  },
  insuranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  insuranceItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  insuranceIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  insuranceCoverage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
