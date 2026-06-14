/**
 * SmartSpendingDashboard
 *
 * Phase 2.1 — Intelligence Layer
 * Full-screen spending intelligence dashboard:
 *  - Savings Score gauge (circular 0-100%)
 *  - Monthly spend by category (View-based segments)
 *  - 6-month savings trend (bar chart)
 *  - Top merchants
 *  - Missed savings card
 *  - Peer comparison
 *
 * Data: GET /api/insights/dashboard via React Query
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { colors } from '@/constants/theme';
import {
  getSpendingInsights,
  SpendingInsightsDashboard,
  CategoryBreakdown,
  MonthlySavingsTrend,
  TopMerchant,
} from '@/services/insightsApi';

// ============================================================================
// QUERY KEY
// ============================================================================

const INSIGHTS_QUERY_KEY = ['insights', 'dashboard'] as const;

// ============================================================================
// MONTH SELECTOR
// ============================================================================

function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
  }
  return months;
}

// ============================================================================
// CATEGORY COLORS
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6B6B',
  Groceries: '#4ECDC4',
  Shopping: '#45B7D1',
  Travel: '#96CEB4',
  Entertainment: '#FFEAA7',
  Healthcare: '#DDA0DD',
  Others: colors.gray[300],
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Others;
}

// ============================================================================
// SAVINGS SCORE GAUGE
// ============================================================================

function SavingsGauge({ score }: { score: number }) {
  const clampedScore = Math.min(Math.max(score, 0), 100);
  const label = clampedScore >= 30 ? 'Great Saver' : clampedScore >= 15 ? 'Good Progress' : 'Room to Grow';
  const gaugeColor = clampedScore >= 30 ? colors.success : clampedScore >= 15 ? colors.lightMustard : colors.warning;

  return (
    <View style={gaugeStyles.wrapper}>
      {/* Outer ring */}
      <View style={[gaugeStyles.outerRing, { borderColor: colors.gray[200] }]}>
        {/* Filled portion using a clip trick */}
        <View
          style={[
            gaugeStyles.filledArc,
            {
              backgroundColor: gaugeColor,
              // Represent progress as a height fill (simplified visual)
              height: `${clampedScore}%`,
              bottom: 0,
              opacity: 0.15,
            },
          ]}
        />
        <View style={gaugeStyles.innerCircle}>
          <ThemedText style={[gaugeStyles.scoreNumber, { color: gaugeColor }]}>{clampedScore}%</ThemedText>
          <ThemedText style={gaugeStyles.scoreLabel}>savings rate</ThemedText>
        </View>
      </View>
      <ThemedText style={[gaugeStyles.tierLabel, { color: gaugeColor }]}>{label}</ThemedText>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 6 },
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.tint.coolGray,
  },
  filledArc: {
    position: 'absolute',
    width: '100%',
    left: 0,
    right: 0,
  },
  innerCircle: { alignItems: 'center', gap: 2 },
  scoreNumber: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  scoreLabel: { fontSize: 10, color: colors.gray[500], textTransform: 'uppercase', letterSpacing: 0.5 },
  tierLabel: { fontSize: 13, fontWeight: '700' },
});

// ============================================================================
// CATEGORY DONUT (simplified as horizontal bars)
// ============================================================================

function CategoryBreakdownSection({ data }: { data: CategoryBreakdown[] }) {
  const sorted = [...data].sort((a, b) => b.percentage - a.percentage).slice(0, 5);

  return (
    <View style={sectionStyles.container}>
      <ThemedText style={sectionStyles.title}>Spend by Category</ThemedText>
      <View style={sectionStyles.segmentRow}>
        {sorted.map((item) => (
          <View
            key={item.category}
            style={[sectionStyles.segment, { flex: item.percentage, backgroundColor: getCategoryColor(item.category) }]}
          />
        ))}
      </View>
      <View style={sectionStyles.legend}>
        {sorted.map((item) => (
          <View key={item.category} style={sectionStyles.legendItem}>
            <View style={[sectionStyles.legendDot, { backgroundColor: getCategoryColor(item.category) }]} />
            <ThemedText style={sectionStyles.legendLabel}>{item.category}</ThemedText>
            <ThemedText style={sectionStyles.legendPct}>{item.percentage.toFixed(0)}%</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  segmentRow: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 },
  segment: { borderRadius: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.gray[600] },
  legendPct: { fontSize: 11, fontWeight: '600', color: colors.text.primary },
});

// ============================================================================
// 6-MONTH TREND BAR CHART
// ============================================================================

function TrendBarChart({ data }: { data: MonthlySavingsTrend[] }) {
  const last6 = [...data].slice(-6);
  const maxSaved = Math.max(...last6.map((d) => d.totalSaved), 1);

  return (
    <View style={trendStyles.container}>
      <ThemedText style={trendStyles.title}>6-Month Savings Trend</ThemedText>
      <View style={trendStyles.chart}>
        {last6.map((entry, i) => {
          const heightPct = (entry.totalSaved / maxSaved) * 100;
          return (
            <View key={i} style={trendStyles.barGroup}>
              <ThemedText style={trendStyles.barValue}>
                {entry.totalSaved >= 1000 ? `${(entry.totalSaved / 1000).toFixed(1)}k` : entry.totalSaved}
              </ThemedText>
              <View style={trendStyles.barTrack}>
                <View
                  style={[
                    trendStyles.bar,
                    {
                      height: `${Math.max(heightPct, 4)}%`,
                      backgroundColor: heightPct === 100 ? colors.lightMustard : colors.brand.nileBlueLight,
                    },
                  ]}
                />
              </View>
              <ThemedText style={trendStyles.barMonth}>
                {entry.month.slice(5, 7)}/{entry.month.slice(2, 4)}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const trendStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 },
  barGroup: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: colors.gray[500], textAlign: 'center' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barMonth: { fontSize: 9, color: colors.gray[400], textAlign: 'center' },
});

// ============================================================================
// TOP MERCHANTS
// ============================================================================

function TopMerchantsSection({ merchants }: { merchants: TopMerchant[] }) {
  return (
    <View style={tmStyles.container}>
      <ThemedText style={tmStyles.title}>Your Top Merchants</ThemedText>
      {merchants.slice(0, 5).map((m, i) => (
        <View key={m.merchantId} style={tmStyles.row}>
          <View style={tmStyles.rank}>
            <ThemedText style={tmStyles.rankNum}>{i + 1}</ThemedText>
          </View>
          <View style={tmStyles.info}>
            <ThemedText style={tmStyles.name} numberOfLines={1}>
              {m.merchantName}
            </ThemedText>
            <ThemedText style={tmStyles.sub}>
              {m.visitCount} visits · Rs.{m.totalSpent.toLocaleString('en-IN')} spent
            </ThemedText>
          </View>
          <View style={tmStyles.saved}>
            <ThemedText style={tmStyles.savedAmt}>Rs.{m.totalSaved.toLocaleString('en-IN')}</ThemedText>
            <ThemedText style={tmStyles.savedLabel}>saved</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const tmStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tint.coolGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: { fontSize: 12, fontWeight: '700', color: colors.gray[600] },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  sub: { fontSize: 11, color: colors.gray[500] },
  saved: { alignItems: 'flex-end' },
  savedAmt: { fontSize: 13, fontWeight: '700', color: colors.success },
  savedLabel: { fontSize: 10, color: colors.gray[400] },
});

// ============================================================================
// MISSED SAVINGS CARD
// ============================================================================

function MissedSavingsCard({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <View style={msStyles.container}>
      <View style={msStyles.iconCol}>
        <ThemedText style={msStyles.icon}>💸</ThemedText>
      </View>
      <View style={msStyles.content}>
        <ThemedText style={msStyles.title}>Missed Savings</ThemedText>
        <ThemedText style={msStyles.desc}>
          You could have saved <ThemedText style={msStyles.amount}>Rs.{amount.toLocaleString('en-IN')}</ThemedText> more
          this month by using REZ merchants
        </ThemedText>
      </View>
    </View>
  );
}

const msStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.errorScale[50],
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.errorScale[100],
  },
  iconCol: { width: 40, alignItems: 'center', paddingTop: 2 },
  icon: { fontSize: 24 },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 14, fontWeight: '700', color: colors.errorScale[700] },
  desc: { fontSize: 12, color: colors.errorScale[500], lineHeight: 17 },
  amount: { fontWeight: '800' },
});

// ============================================================================
// PEER COMPARISON CARD
// ============================================================================

function PeerComparisonCard({ percentile }: { percentile: number }) {
  return (
    <View style={pcStyles.container}>
      <ThemedText style={pcStyles.number}>{percentile}%</ThemedText>
      <View style={pcStyles.textCol}>
        <ThemedText style={pcStyles.title}>Better than peers</ThemedText>
        <ThemedText style={pcStyles.sub}>You save more than {percentile}% of REZ users in your area</ThemedText>
      </View>
      <ThemedText style={pcStyles.trophy}>🏆</ThemedText>
    </View>
  );
}

const pcStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  number: { fontSize: 28, fontWeight: '900', color: colors.lightMustard, minWidth: 56 },
  textCol: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text.inverse },
  sub: { fontSize: 12, color: colors.lightPeach, lineHeight: 16 },
  trophy: { fontSize: 28 },
});

// ============================================================================
// MONTH PILL
// ============================================================================

function MonthPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[pillStyles.pill, selected && pillStyles.selected]} onPress={onPress}>
      <ThemedText style={[pillStyles.text, selected && pillStyles.selectedText]}>{label}</ThemedText>
    </Pressable>
  );
}

const pillStyles = StyleSheet.create({
  pill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.tint.coolGray },
  selected: { backgroundColor: colors.nileBlue },
  text: { fontSize: 12, fontWeight: '600', color: colors.gray[500] },
  selectedText: { color: colors.lightMustard },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function SmartSpendingDashboard() {
  const router = useRouter();
  const months = getLastNMonths(6);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<SpendingInsightsDashboard>({
    queryKey: INSIGHTS_QUERY_KEY,
    queryFn: getSpendingInsights,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Smart Spending',
          headerStyle: { backgroundColor: colors.background.dark },
          headerTintColor: colors.lightMustard,
          headerTitleStyle: { fontWeight: '700', color: colors.lightMustard },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingLeft: 4 }}>
              <Ionicons name="chevron-back" size={24} color={colors.lightMustard} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.lightMustard} />
        }
      >
        {/* Section header */}
        <View style={styles.headerSection}>
          <ThemedText style={styles.headerTitle}>Your Smart Spending</ThemedText>
          <ThemedText style={styles.headerSub}>Understand your savings habits</ThemedText>
        </View>

        {/* Month selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthRow}>
          {months.map((m) => (
            <MonthPill key={m} label={m} selected={m === selectedMonth} onPress={() => setSelectedMonth(m)} />
          ))}
        </ScrollView>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.lightMustard} />
            <ThemedText style={styles.loadingText}>Loading your insights...</ThemedText>
          </View>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <View style={styles.errorWrapper}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
            <ThemedText style={styles.errorText}>Could not load insights</ThemedText>
            <Pressable style={styles.retryBtn} onPress={() => refetch()}>
              <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Dashboard content */}
        {data && !isLoading && (
          <>
            {/* Summary row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <ThemedText style={styles.summaryValue}>Rs.{data.totalSpent.toLocaleString('en-IN')}</ThemedText>
                <ThemedText style={styles.summaryLabel}>Spent</ThemedText>
              </View>
              <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                <ThemedText style={[styles.summaryValue, styles.summaryValueGreen]}>
                  Rs.{data.totalSaved.toLocaleString('en-IN')}
                </ThemedText>
                <ThemedText style={styles.summaryLabel}>Saved</ThemedText>
              </View>
            </View>

            {/* Savings Score Gauge */}
            <View style={styles.gaugeSection}>
              <SavingsGauge score={data.savingsRate} />
              <ThemedText style={styles.gaugeSub}>
                This month: Rs.{data.totalSpent.toLocaleString('en-IN')} spent, Rs.
                {data.totalSaved.toLocaleString('en-IN')} saved ({data.savingsRate.toFixed(1)}%)
              </ThemedText>
            </View>

            {/* Category breakdown */}
            {data.categoryBreakdown.length > 0 && <CategoryBreakdownSection data={data.categoryBreakdown} />}

            {/* 6-month trend */}
            {data.monthlyTrend.length > 0 && <TrendBarChart data={data.monthlyTrend} />}

            {/* Top merchants */}
            {data.topMerchants.length > 0 && <TopMerchantsSection merchants={data.topMerchants} />}

            {/* Missed savings */}
            <MissedSavingsCard amount={data.missedSavings} />

            {/* Peer comparison */}
            <PeerComparisonCard percentile={data.peerPercentile} />
          </>
        )}
      </ScrollView>
    </>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  headerSection: {
    gap: 3,
    paddingTop: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSub: {
    fontSize: 14,
    color: colors.gray[500],
  },
  monthRow: {
    gap: 8,
    paddingVertical: 4,
  },
  loadingWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  errorWrapper: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: colors.lightMustard,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  summaryCardGreen: {
    borderColor: colors.successScale[200],
    backgroundColor: colors.successScale[50],
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  summaryValueGreen: {
    color: colors.success,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  gaugeSection: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  gaugeSub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
