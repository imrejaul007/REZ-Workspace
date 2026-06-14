import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import {
  campaignSimulatorService,
  CampaignType,
  SimulationResult,
} from '@/services/api/campaignSimulator';
import { StatCard } from '@/components/analytics/StatCard';

const CAMPAIGN_TYPES: { key: CampaignType; label: string; hint: string }[] = [
  { key: 'cashback_percentage', label: 'Cashback %', hint: 'Percentage of bill as coins' },
  { key: 'flat_bonus', label: 'Flat Bonus', hint: 'Fixed coins per visit' },
  { key: 'multiplier', label: 'Multiplier', hint: 'Multiply base cashback (e.g. 2×)' },
];

export default function CampaignSimulatorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { activeStore } = useStore();

  // Input state
  const [campaignType, setCampaignType] = useState<CampaignType>('cashback_percentage');
  const [rewardValue, setRewardValue] = useState('');
  const [budgetCap, setBudgetCap] = useState('');
  const [durationDays, setDurationDays] = useState('30');
  const [dailyFootfall, setDailyFootfall] = useState('');
  const [avgBill, setAvgBill] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Result state
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = useCallback(async () => {
    if (!activeStore?._id) {
      setError('No store selected');
      return;
    }
    const rv = Number(rewardValue);
    const bc = Number(budgetCap);
    const dd = Number(durationDays);

    if (!rv || rv <= 0) {
      setError('Enter a valid reward value');
      return;
    }
    if (!bc || bc <= 0) {
      setError('Enter a valid budget cap');
      return;
    }
    if (!dd || dd < 1) {
      setError('Enter a valid duration');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const data = await campaignSimulatorService.simulate({
        storeId: activeStore._id,
        campaignType,
        rewardValue: rv,
        budgetCap: bc,
        durationDays: dd,
        estimatedDailyFootfall: dailyFootfall ? Number(dailyFootfall) : undefined,
        estimatedAvgBill: avgBill ? Number(avgBill) : undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    } finally {
      setIsLoading(false);
    }
  }, [activeStore, campaignType, rewardValue, budgetCap, durationDays, dailyFootfall, avgBill]);

  const getRewardLabel = () => {
    switch (campaignType) {
      case 'cashback_percentage':
        return 'Cashback %';
      case 'flat_bonus':
        return 'Bonus Coins per Visit';
      case 'multiplier':
        return 'Multiplier (e.g. 2 for 2×)';
    }
  };

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(n % 1 === 0 ? 0 : 2);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="calculator" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Campaign Simulator</Text>
            <Text style={styles.headerSubtitle}>Estimate ROI before you launch</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Input Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Campaign Parameters</Text>

        {/* Type Picker */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Campaign Type</Text>
        <View style={styles.typePicker}>
          {CAMPAIGN_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typePill, campaignType === t.key && styles.typePillActive]}
              onPress={() => setCampaignType(t.key)}
            >
              <Text
                style={[styles.typePillText, campaignType === t.key && styles.typePillTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {CAMPAIGN_TYPES.find((t) => t.key === campaignType)?.hint}
        </Text>

        {/* Reward Value */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>{getRewardLabel()}</Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          placeholder={
            campaignType === 'cashback_percentage'
              ? 'e.g. 10'
              : campaignType === 'multiplier'
                ? 'e.g. 2'
                : 'e.g. 50'
          }
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={rewardValue}
          onChangeText={setRewardValue}
        />

        {/* Budget Cap */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Total Budget (coins)</Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          placeholder="e.g. 10000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={budgetCap}
          onChangeText={setBudgetCap}
        />

        {/* Duration */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (days)</Text>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
          ]}
          placeholder="e.g. 30"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={durationDays}
          onChangeText={setDurationDays}
        />

        {/* Advanced Overrides */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={16} color="#7C3AED" />
          <Text style={styles.advancedText}>Custom estimates (optional)</Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedSection}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Daily Footfall (orders/day)
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
              ]}
              placeholder="Leave blank to use store history"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={dailyFootfall}
              onChangeText={setDailyFootfall}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Average Bill Value</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
              ]}
              placeholder="Leave blank to use store history"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={avgBill}
              onChangeText={setAvgBill}
            />
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calculateBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleSimulate}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.calculateBtnText}>Calculate ROI</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section */}
      {result && (
        <>
          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Projected Impact</Text>
            <View style={styles.statGrid}>
              <StatCard
                title="Expected Liability"
                value={`${fmt(result.expectedLiability)} coins`}
                icon="wallet-outline"
                color="#EF4444"
                style={styles.statCard}
              />
              <StatCard
                title="Budget Lasts"
                value={`${result.budgetLastsDays} days`}
                icon="time-outline"
                color="#F59E0B"
                style={styles.statCard}
              />
              <StatCard
                title="Repeat Uplift"
                value={`+${(result.projectedRepeatRate - result.currentRepeatRate).toFixed(1)}%`}
                icon="people-outline"
                color="#10B981"
                growth={result.projectedRepeatRate - result.currentRepeatRate}
                style={styles.statCard}
              />
              <StatCard
                title="Projected ROI"
                value={`${result.projectedROI.toFixed(0)}%`}
                icon="trending-up-outline"
                color="#7C3AED"
                growth={result.projectedROI}
                style={styles.statCard}
              />
            </View>
          </View>

          {/* Breakdown */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cost Breakdown</Text>
            <View
              style={[
                styles.breakdownCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <BreakdownRow
                label="Daily Liability"
                value={`${fmt(result.dailyLiability)} coins/day`}
                color={colors}
              />
              <BreakdownRow
                label={`Coin Breakage (~${result.breakageRate}%)`}
                value={`-${fmt(result.coinBreakageEstimate)} coins`}
                color={colors}
                isPositive
              />
              <BreakdownRow
                label="Effective Cost"
                value={`${fmt(result.effectiveCost)} coins`}
                color={colors}
                bold
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <BreakdownRow
                label="Revenue Uplift"
                value={`+${fmt(result.projectedRevenueUplift)}`}
                color={colors}
                isPositive
              />
              <BreakdownRow
                label="Break-Even"
                value={`${result.breakEvenDays} days`}
                color={colors}
              />
              <BreakdownRow
                label="Extra Repeat Visits"
                value={`+${result.additionalRepeatVisits}`}
                color={colors}
                isPositive
              />
            </View>
          </View>

          {/* Store Baseline */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Store Baseline (90-day avg)
            </Text>
            <View
              style={[
                styles.breakdownCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <BreakdownRow
                label="Daily Orders"
                value={`${result.baseline.dailyOrders}`}
                color={colors}
              />
              <BreakdownRow
                label="Avg Order Value"
                value={`${result.baseline.avgOrderValue.toFixed(2)}`}
                color={colors}
              />
              <BreakdownRow
                label="Daily Revenue"
                value={`${fmt(result.baseline.dailyRevenue)}`}
                color={colors}
              />
              <BreakdownRow
                label="Repeat Rate"
                value={`${result.baseline.repeatRate.toFixed(1)}%`}
                color={colors}
              />
              <BreakdownRow
                label="Total Customers"
                value={`${result.baseline.totalCustomers}`}
                color={colors}
              />
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function BreakdownRow({
  label,
  value,
  color,
  bold,
  isPositive,
}: {
  label: string;
  value: string;
  color;
  bold?: boolean;
  isPositive?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text
        style={[
          styles.breakdownLabel,
          { color: color.textSecondary },
          bold && { fontWeight: '700', color: color.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.breakdownValue,
          { color: color.text },
          bold && { fontWeight: '700' },
          isPositive && { color: '#10B981' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  section: { padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 14 },

  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  hint: { fontSize: 12, marginTop: -4, marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },

  typePicker: { flexDirection: 'row', gap: 8 },
  typePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  typePillActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  typePillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typePillTextActive: { color: '#fff' },

  advancedToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  advancedText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  advancedSection: { marginTop: 4 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  errorText: { fontSize: 13, color: '#EF4444' },

  calculateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  calculateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', minWidth: 150 },

  breakdownCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: { fontSize: 14 },
  breakdownValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 4 },
});
