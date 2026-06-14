/**
 * REZ Capital — working capital loans for merchants.
 * Eligibility scoring, score breakdown, stats, improvement tips,
 * application status timeline, and apply CTA.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { apiClient } from '@/services/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EligibilityData {
  scored: boolean;
  eligible: boolean;
  totalScore: number;
  preApprovedAmountRupees: number;
  monthlyInterestRate: number;
  applicationStatus: string;
  breakdown: {
    gmvScore: number;
    repaymentScore: number;
    consistencyScore: number;
    cashbackScore: number;
  };
  gmv30dRupees: number;
  khataRepaymentRate: number;
  activeDays30d: number;
  improvementTips: string[];
}

interface StatusData {
  applicationStatus: string;
  appliedAt?: string;
  preApprovedAmountRupees: number;
  monthlyInterestRate: number;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const fetchEligibility = async (): Promise<EligibilityData> => {
  const r = await apiClient.get('/merchant/rez-capital/eligibility');
  return r.data?.data ?? r.data;
};

const fetchStatus = async (): Promise<StatusData> => {
  const r = await apiClient.get('/merchant/rez-capital/status');
  return r.data?.data ?? r.data;
};

const postApply = async (payload: { requestedAmountPaise: number; purposeNote?: string }) => {
  const r = await apiClient.post('/merchant/rez-capital/apply', payload);
  return r.data?.data ?? r.data;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ScoreBar({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <ThemedText style={s.scoreLabel}>{label}</ThemedText>
        <ThemedText style={s.scoreValue}>
          {score}/{max}
        </ThemedText>
      </View>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            { width: `${Math.min(score / max, 1) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const TIMELINE = [
  { key: 'applied', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursed', label: 'Disbursed' },
];

function StatusTimeline({ current }: { current: string }) {
  const idx = TIMELINE.findIndex((t) => t.key === current);
  return (
    <View style={s.card}>
      <ThemedText style={s.sectionTitle}>Application Status</ThemedText>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {TIMELINE.map((step, i) => {
          const done = i <= idx;
          return (
            <React.Fragment key={step.key}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={[s.dot, done && s.dotDone, i === idx && s.dotActive]}>
                  {done && (
                    <Ionicons
                      name={i === idx ? 'time-outline' : 'checkmark'}
                      size={11}
                      color="#fff"
                    />
                  )}
                </View>
                <ThemedText style={[s.stepLabel, done && { color: Colors.light.text }]}>
                  {step.label}
                </ThemedText>
              </View>
              {i < TIMELINE.length - 1 && <View style={[s.line, done && i < idx && s.lineDone]} />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RezCapitalScreen() {
  const { activeStore } = useStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [amountPaise, setAmountPaise] = useState('');
  const [purposeNote, setPurposeNote] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const {
    data: eligibility,
    isLoading: eligLoading,
    error: eligError,
    refetch: refetchElig,
  } = useQuery({
    queryKey: ['rez-capital-eligibility'],
    queryFn: fetchEligibility,
    staleTime: 5 * 60 * 1000,
  });

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['rez-capital-status'],
    queryFn: fetchStatus,
    staleTime: 5 * 60 * 1000,
  });

  const applyMutation = useMutation({
    mutationFn: postApply,
    onSuccess: (data) => {
      setApplySuccess(true);
      queryClient.invalidateQueries({ queryKey: ['rez-capital-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['rez-capital-status'] });
      Alert.alert('Application Submitted', data?.message ?? 'Your application is under review.');
    },
    onError: () => Alert.alert('Error', 'Failed to submit application. Please try again.'),
  });

  useEffect(() => {
    if (eligibility?.preApprovedAmountRupees && !amountPaise) {
      setAmountPaise(String(eligibility.preApprovedAmountRupees * 100));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibility?.preApprovedAmountRupees]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchElig(), refetchStatus()]);
    setRefreshing(false);
  }, [refetchElig, refetchStatus]);

  const handleApply = useCallback(() => {
    const paise = parseInt(amountPaise, 10);
    if (!paise || paise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid loan amount.');
      return;
    }
    applyMutation.mutate({
      requestedAmountPaise: paise,
      purposeNote: purposeNote.trim() || undefined,
    });
  }, [amountPaise, purposeNote, applyMutation]);

  const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  if (eligLoading && !eligibility) {
    return (
      <ThemedView style={[s.container, s.centered]}>
        <Stack.Screen options={{ title: 'REZ Capital' }} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={s.loadingText}>Loading eligibility...</ThemedText>
      </ThemedView>
    );
  }

  if (eligError && !eligibility) {
    return (
      <ThemedView style={[s.container, s.centered]}>
        <Stack.Screen options={{ title: 'REZ Capital' }} />
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <ThemedText style={{ marginTop: 12, color: '#ef4444', textAlign: 'center' }}>
          Failed to load eligibility data.
        </ThemedText>
        <TouchableOpacity style={s.retryBtn} onPress={() => refetchElig()}>
          <ThemedText style={s.retryBtnText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const scored = eligibility?.scored ?? false;
  const eligible = eligibility?.eligible ?? false;
  const appStatus = status?.applicationStatus ?? eligibility?.applicationStatus ?? 'none';
  const showApplyCta = eligible && appStatus === 'none' && !applySuccess;
  const heroColors: [string, string] = eligible ? ['#059669', '#34d399'] : ['#64748b', '#94a3b8'];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: 'REZ Capital', headerBackTitle: 'Back' }} />

      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <ThemedText style={s.headerTitle}>REZ Capital</ThemedText>
        <ThemedText style={s.headerSubtitle}>Working Capital for Your Business</ThemedText>
      </View>

      {/* Hero card */}
      <LinearGradient
        colors={heroColors}
        style={s.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {!scored ? (
          <View style={s.heroBody}>
            <Ionicons name="time-outline" size={40} color="rgba(255,255,255,0.85)" />
            <ThemedText style={s.heroTitle}>Profile Being Computed</ThemedText>
            <ThemedText style={s.heroSub}>
              Your eligibility profile is being calculated. Check back in a few days.
            </ThemedText>
          </View>
        ) : eligible ? (
          <View style={s.heroBody}>
            <ThemedText style={s.heroEligibleLabel}>Pre-approved limit</ThemedText>
            <ThemedText style={s.heroAmount}>
              {fmt(eligibility?.preApprovedAmountRupees ?? 0)}
            </ThemedText>
            <View style={s.heroPill}>
              <Ionicons name="trending-up" size={14} color="#fff" style={{ marginRight: 4 }} />
              <ThemedText style={s.heroPillText}>
                {eligibility?.monthlyInterestRate ?? 0}% per month
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={s.heroBody}>
            <Ionicons name="lock-closed-outline" size={36} color="rgba(255,255,255,0.85)" />
            <ThemedText style={s.heroTitle}>Not Yet Eligible</ThemedText>
            <ThemedText style={[s.heroSub, { fontWeight: '700', fontSize: 15, marginBottom: 4 }]}>
              Score: {eligibility?.totalScore ?? 0}/100
            </ThemedText>
            <ThemedText style={s.heroSub}>
              Improve your metrics to unlock working capital.
            </ThemedText>
          </View>
        )}
      </LinearGradient>

      {/* Score breakdown */}
      {scored && eligibility?.breakdown && (
        <View style={s.card}>
          <ThemedText style={s.sectionTitle}>Score Breakdown</ThemedText>
          <ScoreBar
            label="GMV Score"
            score={eligibility.breakdown.gmvScore}
            max={40}
            color="#7c3aed"
          />
          <ScoreBar
            label="Repayment Score"
            score={eligibility.breakdown.repaymentScore}
            max={30}
            color="#10b981"
          />
          <ScoreBar
            label="Consistency Score"
            score={eligibility.breakdown.consistencyScore}
            max={20}
            color="#f59e0b"
          />
          <ScoreBar
            label="Cashback Score"
            score={eligibility.breakdown.cashbackScore}
            max={10}
            color="#3b82f6"
          />
          <View style={s.totalRow}>
            <ThemedText style={s.totalLabel}>Total Score</ThemedText>
            <ThemedText style={s.totalValue}>{eligibility.totalScore}/100</ThemedText>
          </View>
        </View>
      )}

      {/* Supporting stats */}
      {scored && eligibility && (
        <View style={[s.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }]}>
          {[
            { label: '30d GMV', value: fmt(eligibility.gmv30dRupees) },
            { label: 'Khata Repayment', value: `${eligibility.khataRepaymentRate.toFixed(1)}%` },
            { label: 'Active Days', value: String(eligibility.activeDays30d) },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <ThemedText style={s.statValue}>{stat.value}</ThemedText>
                <ThemedText style={s.statLabel}>{stat.label}</ThemedText>
              </View>
              {i < arr.length - 1 && <View style={s.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Improvement tips */}
      {scored && !eligible && (eligibility?.improvementTips?.length ?? 0) > 0 && (
        <View style={s.card}>
          <ThemedText style={s.sectionTitle}>How to Improve</ThemedText>
          {(eligibility?.improvementTips ?? []).map((tip, i) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}
            >
              <Ionicons
                name="chevron-forward-circle"
                size={16}
                color="#f59e0b"
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <ThemedText style={s.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Application status timeline */}
      {appStatus !== 'none' && <StatusTimeline current={appStatus} />}

      {/* Apply CTA */}
      {showApplyCta && (
        <View style={s.card}>
          <ThemedText style={s.sectionTitle}>Apply for Capital</ThemedText>
          <ThemedText style={s.inputLabel}>Requested Amount (in Paise)</ThemedText>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={amountPaise}
            onChangeText={setAmountPaise}
            placeholder="e.g. 50000000"
            placeholderTextColor={Colors.light.textMuted}
            accessibilityLabel="Requested amount in paise"
          />
          <ThemedText style={s.inputHint}>
            {amountPaise
              ? `= ${fmt(Math.round(parseInt(amountPaise, 10) / 100))}`
              : `Max: ${fmt(eligibility?.preApprovedAmountRupees ?? 0)}`}
          </ThemedText>
          <ThemedText style={[s.inputLabel, { marginTop: 12 }]}>Purpose Note (optional)</ThemedText>
          <TextInput
            style={[s.input, { minHeight: 72, textAlignVertical: 'top' }]}
            value={purposeNote}
            onChangeText={setPurposeNote}
            placeholder="e.g. Buying inventory for festive season"
            placeholderTextColor={Colors.light.textMuted}
            multiline
            numberOfLines={3}
            accessibilityLabel="Purpose note for loan application"
          />
          <TouchableOpacity
            style={[s.applyBtn, applyMutation.isPending && { opacity: 0.6 }]}
            onPress={handleApply}
            disabled={applyMutation.isPending}
            accessibilityLabel="Submit loan application"
          >
            <LinearGradient
              colors={['#059669', '#34d399']}
              style={s.applyBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {applyMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <ThemedText style={s.applyBtnText}>Apply Now</ThemedText>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Post-apply success nudge */}
      {applySuccess && (
        <View
          style={[
            s.card,
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderLeftWidth: 4,
              borderLeftColor: '#10b981',
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={28} color="#10b981" />
          <ThemedText style={{ flex: 1, fontSize: 14, color: Colors.light.text, lineHeight: 20 }}>
            Application submitted! We will review and get back to you shortly.
          </ThemedText>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  content: { padding: 16 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: Colors.light.textSecondary },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.light.text },
  headerSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 2 },

  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    minHeight: 140,
    justifyContent: 'center',
  },
  heroBody: { alignItems: 'center' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  heroEligibleLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroAmount: { color: '#fff', fontSize: 44, fontWeight: '900', lineHeight: 50, marginBottom: 10 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroPillText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginBottom: 14 },

  scoreLabel: { fontSize: 13, color: Colors.light.textSecondary, fontWeight: '500' },
  scoreValue: { fontSize: 13, color: Colors.light.text, fontWeight: '700' },
  track: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  totalValue: { fontSize: 14, fontWeight: '800', color: Colors.light.primary },

  statValue: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  statLabel: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.light.backgroundSecondary },

  tipText: { flex: 1, fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 },

  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dotDone: { backgroundColor: '#10b981' },
  dotActive: { backgroundColor: '#f59e0b' },
  stepLabel: {
    fontSize: 10,
    color: Colors.light.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  line: { flex: 1, height: 2, backgroundColor: '#e2e8f0', marginTop: 11 },
  lineDone: { backgroundColor: '#10b981' },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  inputHint: { fontSize: 12, color: Colors.light.textMuted, marginTop: 4, marginBottom: 2 },
  applyBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 18 },
  applyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
