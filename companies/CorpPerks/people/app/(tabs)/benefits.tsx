// ==========================================
// MyTalent - Benefits Tab Screen (Benefits Hub)
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
import { Card, Button, ProgressBar } from '../../src/components';
import { mockBenefits, mockPartnerOffers, mockBenefitsSummary } from '../../src/data/mockData';
import { getEmployeeBenefits, getPartnerOffers, getBenefitsSummary } from '../../src/services/benefitsService';

export default function BenefitsScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [benefits, setBenefits] = useState(mockBenefits);
  const [offers, setOffers] = useState(mockPartnerOffers);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [summary, setSummary] = useState(mockBenefitsSummary);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    const benefitsResult = await getEmployeeBenefits('EMP001');
    const offersResult = await getPartnerOffers();
    const summaryResult = await getBenefitsSummary('EMP001');

    if (benefitsResult.success && benefitsResult.benefits) {
      setBenefits(benefitsResult.benefits);
    }
    if (offersResult.success && offersResult.offers) {
      setOffers(offersResult.offers);
    }
    if (summaryResult.success && summaryResult.summary) {
      setSummary(summaryResult.summary);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBenefits();
    setRefreshing(false);
  };

  const categories = [
    { key: 'all', label: 'All', icon: '📦' },
    { key: 'health', label: 'Health', icon: '🏥' },
    { key: 'wellness', label: 'Wellness', icon: '🧘' },
    { key: 'meal', label: 'Meal', icon: '🍽️' },
    { key: 'travel', label: 'Travel', icon: '🚗' },
    { key: 'learning', label: 'Learning', icon: '📚' },
    { key: 'insurance', label: 'Insurance', icon: '🛡️' },
  ];

  const filteredBenefits = selectedCategory === 'all'
    ? benefits
    : benefits.filter((b) => b.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      health: Colors.error,
      wellness: Colors.success,
      meal: Colors.warning,
      travel: Colors.secondary,
      learning: Colors.primary,
      insurance: Colors.primaryDark,
      perks: Colors.secondary,
    };
    return colors[category] || Colors.primary;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Total Benefits Value */}
      <View style={styles.totalValueCard}>
        <Text style={styles.totalValueLabel}>Your Total Benefits Package</Text>
        <Text style={styles.totalValueAmount}>{formatCurrency(summary.totalValue)}+/year</Text>
        <Text style={styles.totalValueSubtext}>Including health, wellness, learning & perks</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.activeCount}</Text>
          <Text style={styles.statLabel}>Active Benefits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{offers.length}</Text>
          <Text style={styles.statLabel}>Partner Offers</Text>
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryBtn,
              selectedCategory === cat.key && styles.categoryBtnActive,
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === cat.key && styles.categoryLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Benefits */}
      <Text style={styles.sectionTitle}>Your Benefits</Text>
      {filteredBenefits.map((benefit) => (
        <Card key={benefit.id} style={styles.benefitCard}>
          <View style={styles.benefitHeader}>
            <View style={[styles.benefitIcon, { backgroundColor: `${getCategoryColor(benefit.category)}20` }]}>
              <Text style={styles.benefitIconText}>{benefit.icon}</Text>
            </View>
            <View style={styles.benefitInfo}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDesc}>{benefit.description}</Text>
            </View>
          </View>
          <View style={styles.benefitFooter}>
            <View>
              <Text style={styles.benefitValue}>{benefit.value}</Text>
              {benefit.partner && (
                <Text style={styles.benefitPartner}>via {benefit.partner}</Text>
              )}
            </View>
            <View style={[styles.benefitStatus, { backgroundColor: `${Colors.success}20` }]}>
              <Text style={[styles.benefitStatusText, { color: Colors.success }]}>
                {benefit.status.charAt(0).toUpperCase() + benefit.status.slice(1)}
              </Text>
            </View>
          </View>
          {benefit.usagePercentage !== undefined && (
            <ProgressBar
              progress={benefit.usagePercentage}
              color={getCategoryColor(benefit.category)}
              height={6}
              style={styles.usageBar}
              showLabel
              label={`${benefit.usagePercentage}% used`}
            />
          )}
        </Card>
      ))}

      {/* Partner Offers */}
      <View style={styles.offersHeader}>
        <Text style={styles.sectionTitle}>Partner Offers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Offers')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {offers.slice(0, 3).map((offer) => (
        <Card key={offer.id} style={styles.offerCard}>
          <Text style={styles.offerIcon}>{offer.brandIcon}</Text>
          <View style={styles.offerInfo}>
            <Text style={styles.offerBrand}>{offer.brand}</Text>
            <Text style={styles.offerDiscount}>{offer.discount}</Text>
            <Text style={styles.offerExpiry}>Expires: {offer.expiry}</Text>
          </View>
          <Button
            title="Claim"
            variant="primary"
            size="sm"
            onPress={() => {}}
            style={styles.claimBtn}
          />
        </Card>
      ))}

      {/* Explore REZ App */}
      <Card style={styles.exploreCard}>
        <View style={styles.exploreContent}>
          <Text style={styles.exploreIcon}>🛍️</Text>
          <View style={styles.exploreInfo}>
            <Text style={styles.exploreTitle}>Explore More Offers</Text>
            <Text style={styles.exploreDesc}>Get exclusive deals from 500+ REZ Merchant partners</Text>
          </View>
        </View>
        <Button
          title="Open REZ App"
          variant="outline"
          size="sm"
          onPress={() => {}}
          style={styles.exploreBtn}
        />
      </Card>

      {/* Benefits Breakdown */}
      <Text style={styles.sectionTitle}>Benefits Breakdown</Text>
      <Card style={styles.breakdownCard}>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownIcon}>🏥</Text>
            <Text style={styles.breakdownValue}>{(summary.healthValue / 1000).toFixed(0)}K</Text>
            <Text style={styles.breakdownLabel}>Health</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownIcon}>🧘</Text>
            <Text style={styles.breakdownValue}>{(summary.wellnessValue / 1000).toFixed(0)}K</Text>
            <Text style={styles.breakdownLabel}>Wellness</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownIcon}>📚</Text>
            <Text style={styles.breakdownValue}>{(summary.learningValue / 1000).toFixed(0)}K</Text>
            <Text style={styles.breakdownLabel}>Learning</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownIcon}>🚗</Text>
            <Text style={styles.breakdownValue}>{(summary.travelValue / 1000).toFixed(0)}K</Text>
            <Text style={styles.breakdownLabel}>Travel</Text>
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
  totalValueCard: {
    backgroundColor: Colors.primary,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  totalValueLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
  },
  totalValueAmount: {
    color: Colors.textInverse,
    fontSize: 36,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  totalValueSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  categoriesScroll: {
    marginTop: Spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: Colors.textInverse,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  benefitCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitIconText: {
    fontSize: 24,
  },
  benefitInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  benefitTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  benefitDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  benefitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  benefitValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  benefitPartner: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  benefitStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  benefitStatusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  usageBar: {
    marginTop: Spacing.md,
  },
  offersHeader: {
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
  offerCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  offerInfo: {
    flex: 1,
  },
  offerBrand: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  offerDiscount: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
  offerExpiry: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  claimBtn: {
    paddingHorizontal: Spacing.md,
  },
  exploreCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  exploreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exploreIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  exploreInfo: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  exploreDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exploreBtn: {
    marginTop: Spacing.sm,
  },
  breakdownCard: {
    marginHorizontal: Spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 28,
  },
  breakdownValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
