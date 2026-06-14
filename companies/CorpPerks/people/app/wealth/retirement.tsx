// ==========================================
// MyTalent - Retirement Calculator Screen
// ==========================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow, formatCurrency } from '../../src/components/Badge';
import { Card, ProgressRing, ProgressBar, Button } from '../../src/components';
import { mockRetirementProjection } from '../../src/data/mockData';

export default function RetirementScreen() {
  const [currentAge, setCurrentAge] = useState(mockRetirementProjection.currentAge);
  const [retirementAge, setRetirementAge] = useState(mockRetirementProjection.retirementAge);
  const [currentSavings, setCurrentSavings] = useState(mockRetirementProjection.currentSavings);
  const [monthlyContribution, setMonthlyContribution] = useState(mockRetirementProjection.monthlyContribution);
  const [expectedReturns, setExpectedReturns] = useState(mockRetirementProjection.expectedReturns);
  const [inflationRate, setInflationRate] = useState(mockRetirementProjection.inflationRate);

  const projection = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;
    const monthlyRate = expectedReturns / 12 / 100;
    const months = yearsToRetirement * 12;

    // Future value of current savings
    const futureValueSavings = currentSavings * Math.pow(1 + monthlyRate, months);

    // Future value of monthly contributions
    const futureValueContributions = monthlyContribution *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const projectedCorpus = futureValueSavings + futureValueContributions;

    // Inflation-adjusted target
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsToRetirement);
    const targetCorpus = mockRetirementProjection.targetCorpus * inflationFactor;

    const gap = targetCorpus - projectedCorpus;
    const progressPercent = (projectedCorpus / targetCorpus) * 100;

    return {
      projectedCorpus,
      targetCorpus,
      gap,
      progressPercent: Math.min(progressPercent, 100),
      yearsToRetirement,
      retirementScore: Math.min(Math.round(progressPercent), 100),
    };
  }, [currentAge, retirementAge, currentSavings, monthlyContribution, expectedReturns, inflationRate]);

  const yearsOfRetirement = 25; // Assume 25 years in retirement
  const monthlyRetirementIncome = (projection.projectedCorpus * (expectedReturns / 100)) / 12 / yearsOfRetirement;

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.scoreContainer}>
            <ProgressRing
              progress={projection.retirementScore}
              size={100}
              strokeWidth={10}
              color={projection.retirementScore >= 80 ? Colors.success : projection.retirementScore >= 60 ? Colors.warning : Colors.error}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Retirement Score</Text>
            <Text style={styles.headerSubtitle}>
              {projection.retirementScore >= 80 ? 'On Track' :
               projection.retirementScore >= 60 ? 'Needs Attention' : 'Planning Required'}
            </Text>
            <Text style={styles.headerYears}>{projection.yearsToRetirement} years to retirement</Text>
          </View>
        </View>
      </Card>

      {/* Corpus Summary */}
      <Card style={styles.corpusCard}>
        <View style={styles.corpusRow}>
          <View style={styles.corpusItem}>
            <Text style={styles.corpusLabel}>Projected Corpus</Text>
            <Text style={[styles.corpusValue, { color: Colors.success }]}>
              {formatCurrency(Math.round(projection.projectedCorpus))}
            </Text>
          </View>
          <View style={styles.corpusItem}>
            <Text style={styles.corpusLabel}>Target Corpus</Text>
            <Text style={styles.corpusValue}>{formatCurrency(Math.round(projection.targetCorpus))}</Text>
          </View>
        </View>

        {projection.gap > 0 ? (
          <View style={[styles.gapBanner, { backgroundColor: `${Colors.error}20` }]}>
            <Text style={styles.gapText}>
              Gap: {formatCurrency(Math.round(projection.gap))}
            </Text>
            <Text style={styles.gapHint}>
              Increase monthly contribution by {formatCurrency(Math.round(projection.gap / (projection.yearsToRetirement * 12)))}/month
            </Text>
          </View>
        ) : (
          <View style={[styles.gapBanner, { backgroundColor: `${Colors.success}20` }]}>
            <Text style={[styles.gapText, { color: Colors.success }]}>
              Surplus: {formatCurrency(Math.round(Math.abs(projection.gap)))}
            </Text>
            <Text style={styles.gapHint}>You're on track for a comfortable retirement!</Text>
          </View>
        )}

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress to Goal</Text>
            <Text style={styles.progressPercent}>{projection.progressPercent.toFixed(1)}%</Text>
          </View>
          <ProgressBar
            progress={projection.progressPercent}
            color={projection.retirementScore >= 80 ? Colors.success : projection.retirementScore >= 60 ? Colors.warning : Colors.error}
            height={12}
          />
        </View>
      </Card>

      {/* Monthly Income Preview */}
      <Card style={styles.incomeCard}>
        <Text style={styles.cardTitle}>Retirement Income Preview</Text>
        <View style={styles.incomeContent}>
          <Text style={styles.incomeValue}>{formatCurrency(Math.round(monthlyRetirementIncome))}</Text>
          <Text style={styles.incomeLabel}>per month in retirement</Text>
        </View>
        <View style={styles.incomeAssumptions}>
          <Text style={styles.assumptionText}>
            Based on {expectedReturns}% returns for {yearsOfRetirement} years
          </Text>
        </View>
      </Card>

      {/* Adjustable Inputs */}
      <Text style={styles.sectionTitle}>Adjust Your Plan</Text>

      {/* Current Age */}
      <Card style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>Current Age</Text>
          <Text style={styles.inputValue}>{currentAge} years</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={22}
          maximumValue={60}
          step={1}
          value={currentAge}
          onValueChange={setCurrentAge}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>22</Text>
          <Text style={styles.sliderRangeText}>60</Text>
        </View>
      </Card>

      {/* Retirement Age */}
      <Card style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>Retirement Age</Text>
          <Text style={styles.inputValue}>{retirementAge} years</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={70}
          step={1}
          value={retirementAge}
          onValueChange={setRetirementAge}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>50</Text>
          <Text style={styles.sliderRangeText}>70</Text>
        </View>
      </Card>

      {/* Current Savings */}
      <Card style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>Current Retirement Savings</Text>
          <Text style={styles.inputValue}>{formatCurrency(currentSavings)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={5000000}
          step={50000}
          value={currentSavings}
          onValueChange={setCurrentSavings}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>{formatCurrency(0)}</Text>
          <Text style={styles.sliderRangeText}>{formatCurrency(5000000)}</Text>
        </View>
      </Card>

      {/* Monthly Contribution */}
      <Card style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>Monthly Contribution</Text>
          <Text style={styles.inputValue}>{formatCurrency(monthlyContribution)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5000}
          maximumValue={200000}
          step={5000}
          value={monthlyContribution}
          onValueChange={setMonthlyContribution}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>{formatCurrency(5000)}</Text>
          <Text style={styles.sliderRangeText}>{formatCurrency(200000)}</Text>
        </View>
      </Card>

      {/* Expected Returns */}
      <Card style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Text style={styles.inputLabel}>Expected Annual Returns</Text>
          <Text style={styles.inputValue}>{expectedReturns}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={6}
          maximumValue={18}
          step={0.5}
          value={expectedReturns}
          onValueChange={setExpectedReturns}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.primary}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>6% (FD)</Text>
          <Text style={styles.sliderRangeText}>18% (Equity)</Text>
        </View>
      </Card>

      {/* Tips Card */}
      <Card style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Tips to Close the Gap</Text>
        {projection.gap > 0 && (
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>💰</Text>
              <Text style={styles.tipText}>Increase monthly contribution by 10% each year</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📈</Text>
              <Text style={styles.tipText}>Consider increasing equity allocation as you age</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🎯</Text>
              <Text style={styles.tipText}>Use tax-advantaged accounts like NPS and PPF</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🏠</Text>
              <Text style={styles.tipText}>Plan to have home loan cleared before retirement</Text>
            </View>
          </View>
        )}
        {projection.gap <= 0 && (
          <View style={styles.successBanner}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successText}>Great job! You're on track for a comfortable retirement.</Text>
          </View>
        )}
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
  headerCard: {
    margin: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    marginRight: Spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerYears: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  corpusCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  corpusRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  corpusItem: {
    flex: 1,
  },
  corpusLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  corpusValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  gapBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  gapText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
  gapHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  incomeCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  incomeContent: {
    alignItems: 'center',
  },
  incomeValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  incomeLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
  incomeAssumptions: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  assumptionText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  inputValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderRangeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  tipsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tipsList: {
    gap: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  tipIcon: {
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: `${Colors.success}20`,
    borderRadius: BorderRadius.md,
  },
  successIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  successText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
