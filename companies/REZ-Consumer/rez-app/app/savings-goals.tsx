// @ts-nocheck
/**
 * SavingsGoalsScreen
 * Phase 3.3 — Habit Reinforcement
 *
 * - User sets monthly savings target
 * - Animated progress bar filling up
 * - Projected savings based on current pace
 * - Celebration when goal is hit
 * - Editable goal amount
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Animated,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Platform,
  Easing,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';
import { platformAlertSimple } from '@/utils/platformAlert';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SavingsGoal {
  id: string;
  targetAmount: number;
  currentAmount: number;
  month: string;
  isAchieved: boolean;
  progressPct: number;
  remaining: number;
  achievedDate?: string;
}

interface PastGoal {
  id: string;
  targetAmount: number;
  currentAmount: number;
  month: string;
  isAchieved: boolean;
  progressPct: number;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function fetchCurrentGoal(): Promise<SavingsGoal | null> {
  const { default: apiService } = await import('@/services/apiClient');
  const res = (await apiService.get('/goals/current'));
  return (res.data as unknown)?.data ?? null;
}

async function fetchGoalHistory(): Promise<PastGoal[]> {
  const { default: apiService } = await import('@/services/apiClient');
  const res = (await apiService.get('/goals/history?limit=6'));
  return (res.data as unknown)?.data ?? [];
}

async function saveGoal(targetAmount: number): Promise<SavingsGoal> {
  const { default: apiService } = await import('@/services/apiClient');
  const res = (await apiService.post('/goals', { targetAmount }));
  return (res.data as unknown)?.data ?? res.data;
}

// ---------------------------------------------------------------------------
// Animated circular progress ring
// ---------------------------------------------------------------------------
function CircularProgress({ pct, size = 160 }: { pct: number; size?: number }) {
  const animPct = useRef(new Animated.Value(0)).current;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animPct, {
      toValue: pct,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, animPct]);

  // We can't easily animate SVG strokeDashoffset in RN without a library,
  // so we use a linear bar approximation here.
  return (
    <View style={[circleStyles.container, { width: size, height: size }]}>
      <View style={[circleStyles.ring, { borderRadius: size / 2, width: size, height: size }]}>
        <LinearGradient
          colors={pct >= 100 ? ['#10b981', '#34d399'] : ['#1a3a52', '#FFC857']}
          style={[circleStyles.fill, { width: size, height: size, borderRadius: size / 2 }]}
        />
        <View
          style={[
            circleStyles.inner,
            {
              width: size - strokeWidth * 2,
              height: size - strokeWidth * 2,
              borderRadius: (size - strokeWidth * 2) / 2,
            },
          ]}
        >
          <Text style={circleStyles.pctText}>{pct.toFixed(0)}%</Text>
          <Text style={circleStyles.pctLabel}>of goal</Text>
        </View>
      </View>
    </View>
  );
}

const circleStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ring: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  inner: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  pctText: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  pctLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});

// ---------------------------------------------------------------------------
// Set Goal Modal
// ---------------------------------------------------------------------------
function SetGoalModal({
  visible,
  currentTarget,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentTarget?: number;
  onSave: (amount: number) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState(currentTarget ? String(currentTarget) : '');
  const [saving, setSaving] = useState(false);

  const QUICK_AMOUNTS = [1000, 2000, 3000, 5000, 10000];

  const handleSave = async () => {
    const amount = parseInt(input, 10);
    if (isNaN(amount) || amount < 1) {
      platformAlertSimple('Invalid Amount', 'Please enter a valid savings target');
      return;
    }
    setSaving(true);
    try {
      await onSave(amount);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Set Monthly Savings Goal</Text>
          <Text style={modalStyles.subtitle}>How much do you want to save this month with REZ?</Text>

          {/* Quick pick buttons */}
          <View style={modalStyles.quickRow}>
            {QUICK_AMOUNTS.map((amt) => (
              <Pressable
                key={amt}
                style={[modalStyles.quickBtn, input === String(amt) && modalStyles.quickBtnActive]}
                onPress={() => setInput(String(amt))}
                accessibilityLabel={`Set goal to Rs.${amt}`}
              >
                <Text style={[modalStyles.quickBtnText, input === String(amt) && modalStyles.quickBtnTextActive]}>
                  ₹{amt.toLocaleString('en-IN')}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={modalStyles.inputRow}>
            <Text style={modalStyles.currencyPrefix}>Rs.</Text>
            <TextInput
              style={modalStyles.input}
              value={input}
              onChangeText={setInput}
              keyboardType="numeric"
              placeholder="Enter amount"
              maxLength={7}
              accessibilityLabel="Savings goal amount"
            />
          </View>

          <Pressable
            style={[modalStyles.saveBtn, { opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Save savings goal"
            accessibilityRole="button"
          >
            <LinearGradient colors={['#1a3a52', '#FFC857']} style={modalStyles.saveBtnGradient}>
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.saveBtnText}>Save Goal</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  quickBtnActive: { backgroundColor: '#ede9fe' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  quickBtnTextActive: { color: '#1a3a52' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  currencyPrefix: { fontSize: 18, fontWeight: '700', color: '#475569', marginRight: 8 },
  input: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1e293b', paddingVertical: 12 },
  saveBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#94a3b8' },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function SavingsGoalsScreen() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [history, setHistory] = useState<PastGoal[]>([]);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const wasAchieved = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const [current, hist] = await Promise.allSettled([fetchCurrentGoal(), fetchGoalHistory()]);
      if (!isMounted()) return;
      if (current.status === 'fulfilled') {
        const g = current.value;
        setGoal(g);
        if (g?.isAchieved && !wasAchieved.current) {
          wasAchieved.current = true;
          setShowCelebration(true);
        }
      }
      if (hist.status === 'fulfilled') setHistory(hist.value);
    } catch {
      /* Non-critical */
    } finally {
      if (isMounted()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleSaveGoal = useCallback(
    async (amount: number) => {
      try {
        const updated = await saveGoal(amount);
        if (!isMounted()) return;
        setGoal(updated as SavingsGoal);
        setShowSetModal(false);
      } catch (err) {
        platformAlertSimple('Error', err?.message ?? 'Could not save goal');
      }
    },
    [isMounted],
  );

  // Projected savings calculation
  const projectedSavings = (() => {
    if (!goal) return 0;
    const d = new Date();
    const dayOfMonth = d.getDate();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (dayOfMonth === 0) return goal.currentAmount;
    return Math.round((goal.currentAmount / dayOfMonth) * daysInMonth);
  })();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#1a3a52" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={goal?.isAchieved ? ['#059669', '#34d399'] : ['#1a3a52', '#FFC857']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Savings Goal</Text>
          <Pressable
            style={styles.editBtn}
            onPress={() => setShowSetModal(true)}
            accessibilityLabel="Edit savings goal"
          >
            <Ionicons name="pencil" size={18} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.headerMonth}>
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* No goal set yet */}
        {!goal ? (
          <View style={styles.noGoalCard}>
            <Text style={styles.noGoalEmoji}>🎯</Text>
            <Text style={styles.noGoalTitle}>Set Your Savings Goal</Text>
            <Text style={styles.noGoalBody}>
              How much do you want to save with REZ this month? Track your progress and celebrate when you hit your
              target!
            </Text>
            <Pressable
              style={styles.setGoalBtn}
              onPress={() => setShowSetModal(true)}
              accessibilityLabel="Set savings goal"
              accessibilityRole="button"
            >
              <LinearGradient colors={['#1a3a52', '#FFC857']} style={styles.setGoalGradient}>
                <Text style={styles.setGoalBtnText}>Set My Goal</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Goal achieved celebration */}
            {goal.isAchieved && (
              <View style={styles.achievedBanner}>
                <Text style={styles.achievedEmoji}>🎉</Text>
                <View style={styles.achievedInfo}>
                  <Text style={styles.achievedTitle}>Goal Achieved!</Text>
                  <Text style={styles.achievedBody}>
                    You hit your Rs.{goal.targetAmount.toLocaleString('en-IN')} savings goal!
                  </Text>
                </View>
              </View>
            )}

            {/* Circular progress */}
            <View style={styles.progressCard}>
              <CircularProgress pct={goal.progressPct} />
              <View style={styles.amountsRow}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountValue}>Rs.{goal.currentAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.amountLabel}>Saved</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={styles.amountValue}>Rs.{goal.targetAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.amountLabel}>Goal</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountItem}>
                  <Text style={[styles.amountValue, { color: goal.remaining === 0 ? '#10b981' : '#1a3a52' }]}>
                    Rs.{goal.remaining.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.amountLabel}>{goal.remaining === 0 ? 'Done!' : 'Left'}</Text>
                </View>
              </View>

              {/* Linear progress bar */}
              <View style={styles.linearBar}>
                <View
                  style={[
                    styles.linearFill,
                    {
                      width: `${Math.min(100, goal.progressPct)}%` as unknown,
                      backgroundColor: goal.isAchieved ? '#10b981' : '#1a3a52',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Projected savings */}
            <View style={styles.projectionCard}>
              <Ionicons name="trending-up" size={20} color="#1a3a52" />
              <View style={styles.projectionInfo}>
                <Text style={styles.projectionTitle}>At your current pace...</Text>
                <Text style={styles.projectionBody}>
                  You're projected to save{' '}
                  <Text style={styles.projectionBold}>Rs.{projectedSavings.toLocaleString('en-IN')}</Text> this month.{' '}
                  {projectedSavings >= goal.targetAmount
                    ? "You're on track to hit your goal!"
                    : 'Keep spending with REZ to reach your goal!'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Past Months</Text>
            {history.map((item, idx) => (
              <View key={idx} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyMonth}>
                    {new Date(item.month + '-01').toLocaleString('default', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <View style={styles.historyBar}>
                    <View
                      style={[
                        styles.historyBarFill,
                        {
                          width: `${item.progressPct}%` as unknown,
                          backgroundColor: item.isAchieved ? '#10b981' : '#1a3a52',
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>Rs.{item.currentAmount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.historyTarget}>of {item.targetAmount.toLocaleString('en-IN')}</Text>
                </View>
                {item.isAchieved ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                ) : (
                  <Ionicons name="ellipse-outline" size={20} color="#cbd5e1" />
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Set Goal Modal */}
      <SetGoalModal
        visible={showSetModal}
        currentTarget={goal?.targetAmount}
        onSave={handleSaveGoal}
        onClose={() => setShowSetModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerMonth: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },

  content: { padding: Spacing.lg },

  // No goal state
  noGoalCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  noGoalEmoji: { fontSize: 56, marginBottom: 16 },
  noGoalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  noGoalBody: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  setGoalBtn: { borderRadius: 14, overflow: 'hidden', alignSelf: 'stretch' },
  setGoalGradient: { paddingVertical: 16, alignItems: 'center' },
  setGoalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Achieved banner
  achievedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 12,
  },
  achievedEmoji: { fontSize: 32 },
  achievedInfo: { flex: 1 },
  achievedTitle: { fontSize: 16, fontWeight: '800', color: '#15803d' },
  achievedBody: { fontSize: 13, color: '#16a34a', marginTop: 2 },

  // Progress card
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
  },
  amountItem: { alignItems: 'center', flex: 1 },
  amountValue: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  amountLabel: { fontSize: 11, color: '#94a3b8' },
  amountDivider: { width: 1, backgroundColor: '#e2e8f0', height: 40 },
  linearBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  linearFill: { height: '100%', borderRadius: 4 },

  // Projection
  projectionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3e8ff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    gap: 10,
  },
  projectionInfo: { flex: 1 },
  projectionTitle: { fontSize: 13, fontWeight: '700', color: '#1a3a52', marginBottom: 4 },
  projectionBody: { fontSize: 13, color: '#1a3a52', lineHeight: 18 },
  projectionBold: { fontWeight: '800' },

  // History
  historySection: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  historyLeft: { flex: 1 },
  historyMonth: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  historyBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  historyBarFill: { height: '100%', borderRadius: 3 },
  historyRight: { alignItems: 'flex-end', minWidth: 70 },
  historyAmount: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  historyTarget: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
});

export default withErrorBoundary(SavingsGoalsScreen, 'SavingsGoals');
