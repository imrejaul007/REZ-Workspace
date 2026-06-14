/**
 * CampaignSimulatorScreen
 * Form to simulate a campaign before launching.
 * API: POST /api/merchant/campaign-simulator
 * Payload: { budget, targetSegment, discountPercent, duration }
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/services/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TargetSegment = 'all' | 'new' | 'loyal' | 'lapsed';

interface SimulatorInput {
  budget: string;
  discountPercent: string;
  targetSegment: TargetSegment;
  duration: string;
}

interface SimulatorResult {
  estimatedReach: number;
  expectedRedemptions: number;
  projectedRevenue: number;
  estimatedROI: number;
  costPerRedemption: number;
  breakEvenDays: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENTS: { key: TargetSegment; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All Customers', icon: 'people' },
  { key: 'new', label: 'New', icon: 'person-add' },
  { key: 'loyal', label: 'Loyal', icon: 'heart' },
  { key: 'lapsed', label: 'Lapsed', icon: 'time' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number) =>
  `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const clamp = (val: number, max: number) => Math.min(Math.max(val, 0), max);

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? clamp((value / max) * 100, 100) : 0;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: pct > 0 ? `${pct}%` : 0, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CampaignSimulatorScreen() {
  const [form, setForm] = useState<SimulatorInput>({
    budget: '',
    discountPercent: '',
    targetSegment: 'all',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFormValid =
    form.budget.trim() !== '' &&
    form.discountPercent.trim() !== '' &&
    form.duration.trim() !== '' &&
    Number(form.budget) > 0 &&
    Number(form.discountPercent) > 0 &&
    Number(form.duration) > 0;

  const handleSimulate = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        budget: Number(form.budget),
        targetSegment: form.targetSegment,
        discountPercent: Number(form.discountPercent),
        duration: Number(form.duration),
      };
      const res = await apiClient.post<SimulatorResult>('merchant/campaign-simulator', payload);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        throw new Error(res.message || 'Simulation failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maxReach = result ? result.estimatedReach : 1;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Configure Campaign</Text>

            {/* Budget */}
            <Text style={styles.fieldLabel}>Budget (&#8377;)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="cash-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 5000"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={form.budget}
                onChangeText={(v) => setForm((p) => ({ ...p, budget: v }))}
              />
            </View>

            {/* Discount % */}
            <Text style={styles.fieldLabel}>Discount %</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={form.discountPercent}
                onChangeText={(v) => setForm((p) => ({ ...p, discountPercent: v }))}
              />
            </View>

            {/* Duration */}
            <Text style={styles.fieldLabel}>Duration (days)</Text>
            <View style={styles.inputRow}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 30"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={form.duration}
                onChangeText={(v) => setForm((p) => ({ ...p, duration: v }))}
              />
            </View>

            {/* Target Segment */}
            <Text style={styles.fieldLabel}>Target Segment</Text>
            <View style={styles.segmentRow}>
              {SEGMENTS.map((seg) => (
                <TouchableOpacity
                  key={seg.key}
                  style={[
                    styles.segmentChip,
                    form.targetSegment === seg.key && styles.segmentChipActive,
                  ]}
                  onPress={() => setForm((p) => ({ ...p, targetSegment: seg.key }))}
                >
                  <Ionicons
                    name={seg.icon}
                    size={14}
                    color={form.targetSegment === seg.key ? '#fff' : '#6b7280'}
                  />
                  <Text
                    style={[
                      styles.segmentLabel,
                      form.targetSegment === seg.key && styles.segmentLabelActive,
                    ]}
                  >
                    {seg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Simulate Button */}
            <TouchableOpacity
              style={[styles.simulateBtn, (!isFormValid || loading) && styles.simulateBtnDisabled]}
              onPress={handleSimulate}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" />
                  <Text style={styles.simulateBtnText}>Simulate Campaign</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Results Card */}
          {result && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Simulation Results</Text>

              {/* Key Metrics */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricBox}>
                  <Ionicons name="people-outline" size={22} color="#6366f1" />
                  <Text style={[styles.metricValue, { color: '#6366f1' }]}>
                    {result.estimatedReach.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.metricLabel}>Estimated Reach</Text>
                </View>
                <View style={styles.metricBox}>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                  <Text style={[styles.metricValue, { color: '#10b981' }]}>
                    {result.expectedRedemptions.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.metricLabel}>Redemptions</Text>
                </View>
                <View style={styles.metricBox}>
                  <Ionicons name="cash-outline" size={22} color="#3b82f6" />
                  <Text style={[styles.metricValue, { color: '#3b82f6' }]}>
                    {formatCurrency(result.projectedRevenue)}
                  </Text>
                  <Text style={styles.metricLabel}>Projected Revenue</Text>
                </View>
                <View style={styles.metricBox}>
                  <Ionicons name="trending-up-outline" size={22} color="#f59e0b" />
                  <Text
                    style={[
                      styles.metricValue,
                      { color: result.estimatedROI >= 0 ? '#10b981' : '#ef4444' },
                    ]}
                  >
                    {result.estimatedROI >= 0 ? '+' : ''}
                    {result.estimatedROI.toFixed(1)}%
                  </Text>
                  <Text style={styles.metricLabel}>Est. ROI</Text>
                </View>
              </View>

              {/* Progress Bars */}
              <Text style={styles.barsTitle}>Reach Breakdown</Text>

              <View style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>Estimated Reach</Text>
                  <Text style={styles.barVal}>
                    {result.estimatedReach.toLocaleString('en-IN')} customers
                  </Text>
                </View>
                <ProgressBar value={result.estimatedReach} max={maxReach} color="#6366f1" />
              </View>

              <View style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>Expected Redemptions</Text>
                  <Text style={styles.barVal}>
                    {result.expectedRedemptions.toLocaleString('en-IN')}
                  </Text>
                </View>
                <ProgressBar value={result.expectedRedemptions} max={maxReach} color="#10b981" />
              </View>

              {/* Additional Stats */}
              <View style={styles.extraStats}>
                <View style={styles.extraRow}>
                  <Text style={styles.extraLabel}>Cost per Redemption</Text>
                  <Text style={styles.extraValue}>{formatCurrency(result.costPerRedemption)}</Text>
                </View>
                <View style={styles.extraRow}>
                  <Text style={styles.extraLabel}>Break-even Days</Text>
                  <Text style={styles.extraValue}>{result.breakEvenDays} days</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Form
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    height: 46,
    fontSize: 15,
    color: '#111827',
  },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segmentChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  segmentLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  segmentLabelActive: { color: '#fff' },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  simulateBtnDisabled: { opacity: 0.5 },
  simulateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#dc2626', flex: 1 },

  // Results
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultsTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 20 },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  metricValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  metricLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  barsTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  barRow: { marginBottom: 14 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barLabel: { fontSize: 13, color: '#6b7280' },
  barVal: { fontSize: 13, fontWeight: '600', color: '#111827' },
  extraStats: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    gap: 12,
  },
  extraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extraLabel: { fontSize: 14, color: '#6b7280' },
  extraValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
});
