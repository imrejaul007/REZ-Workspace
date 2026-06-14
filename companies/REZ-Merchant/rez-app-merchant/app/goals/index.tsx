/**
 * Revenue Goals Screen — Set and track monthly revenue and visit targets.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '@/services/api/client';
import { Colors, Shadows } from '@/constants/DesignTokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GoalMetric {
  target: number;
  current: number;
}

interface GoalsData {
  monthlyRevenue: GoalMetric;
  monthlyVisits: GoalMetric;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

function getDaysUntilMonthEnd(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

function getMotivationMessage(pct: number): string {
  if (pct >= 75) return 'Final push!';
  if (pct >= 50) return 'Almost there!';
  if (pct >= 25) return 'Keep going!';
  return 'Great start!';
}

function clampPct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ProgressCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  current: number;
  target: number;
  formatValue: (n: number) => string;
  reachedMessage?: string;
}

function ProgressCard({
  title,
  icon,
  iconColor,
  iconBg,
  current,
  target,
  formatValue,
  reachedMessage,
}: ProgressCardProps) {
  const pct = clampPct(current, target);
  const reached = current >= target && target > 0;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardHeader}>
        <View style={[cardStyles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <View style={cardStyles.cardTitleGroup}>
          <Text style={cardStyles.cardTitle}>{title}</Text>
          <Text style={cardStyles.motivationText}>{getMotivationMessage(pct)}</Text>
        </View>
        {reached && (
          <View style={cardStyles.goalBadge}>
            <Text style={cardStyles.goalBadgeStar}>★</Text>
            <Text style={cardStyles.goalBadgeText}>Goal Reached!</Text>
          </View>
        )}
      </View>

      <View style={cardStyles.progressBarBg}>
        <View
          style={[
            cardStyles.progressBarFill,
            { width: pct > 0 ? `${pct}%` : 0, backgroundColor: reached ? '#F59E0B' : iconColor },
          ]}
        />
      </View>

      <View style={cardStyles.cardFooter}>
        <Text style={cardStyles.currentText}>{formatValue(current)}</Text>
        <Text style={cardStyles.pctText}>{pct}%</Text>
        <Text style={cardStyles.targetText}>of {formatValue(target)}</Text>
      </View>

      {reached && reachedMessage && (
        <View style={cardStyles.celebrationBanner}>
          <Text style={cardStyles.celebrationText}>{reachedMessage}</Text>
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  motivationText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  goalBadgeStar: {
    fontSize: 13,
    color: '#F59E0B',
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  pctText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#6366F1',
  },
  targetText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  celebrationBanner: {
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  celebrationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
});

// ─── Onboarding Form ──────────────────────────────────────────────────────────

interface OnboardingFormProps {
  onSubmit: (revenue: number, visits: number) => Promise<void>;
  saving: boolean;
}

function OnboardingForm({ onSubmit, saving }: OnboardingFormProps) {
  const [revenue, setRevenue] = useState('');
  const [visits, setVisits] = useState('');

  const handleSubmit = () => {
    const r = parseInt(revenue, 10);
    const v = parseInt(visits, 10);
    if (!r || r <= 0 || !v || v <= 0) {
      Alert.alert('Invalid input', 'Please enter valid positive numbers for both targets.');
      return;
    }
    onSubmit(r, v);
  };

  return (
    <View style={onboardStyles.container}>
      <View style={onboardStyles.iconRow}>
        <Ionicons name="flag" size={40} color="#6366F1" />
      </View>
      <Text style={onboardStyles.title}>Set Your Goals</Text>
      <Text style={onboardStyles.subtitle}>
        Define your monthly revenue and visit targets to track progress.
      </Text>

      <View style={onboardStyles.inputGroup}>
        <Text style={onboardStyles.inputLabel}>Revenue Target (₹)</Text>
        <TextInput
          style={onboardStyles.input}
          placeholder="e.g. 100000"
          keyboardType="numeric"
          value={revenue}
          onChangeText={setRevenue}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={onboardStyles.inputGroup}>
        <Text style={onboardStyles.inputLabel}>Visit Target</Text>
        <TextInput
          style={onboardStyles.input}
          placeholder="e.g. 500"
          keyboardType="numeric"
          value={visits}
          onChangeText={setVisits}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <TouchableOpacity
        style={[onboardStyles.submitButton, saving && onboardStyles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
        )}
        <Text style={onboardStyles.submitText}>{saving ? 'Saving...' : 'Set Goals'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const onboardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Shadows.md,
  },
  iconRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
    width: '100%',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

// ─── Edit Goals Modal ─────────────────────────────────────────────────────────

interface EditGoalsProps {
  goals: GoalsData;
  onSave: (revenue: number, visits: number) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function EditGoalsForm({ goals, onSave, onCancel, saving }: EditGoalsProps) {
  const [revenue, setRevenue] = useState(String(goals.monthlyRevenue.target));
  const [visits, setVisits] = useState(String(goals.monthlyVisits.target));

  const handleSave = () => {
    const r = parseInt(revenue, 10);
    const v = parseInt(visits, 10);
    if (!r || r <= 0 || !v || v <= 0) {
      Alert.alert('Invalid input', 'Please enter valid positive numbers.');
      return;
    }
    onSave(r, v);
  };

  return (
    <View style={editStyles.overlay}>
      <View style={editStyles.modal}>
        <View style={editStyles.modalHeader}>
          <Text style={editStyles.modalTitle}>Edit Goals</Text>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={editStyles.inputGroup}>
          <Text style={editStyles.inputLabel}>Revenue Target (₹)</Text>
          <TextInput
            style={editStyles.input}
            keyboardType="numeric"
            value={revenue}
            onChangeText={setRevenue}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={editStyles.inputGroup}>
          <Text style={editStyles.inputLabel}>Visit Target</Text>
          <TextInput
            style={editStyles.input}
            keyboardType="numeric"
            value={visits}
            onChangeText={setVisits}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={editStyles.buttonRow}>
          <TouchableOpacity style={editStyles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
            <Text style={editStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[editStyles.saveButton, saving && editStyles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={editStyles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const editStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '88%',
    ...Shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.65 },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<GoalsData | null>(null);
  const [editing, setEditing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const daysLeft = getDaysUntilMonthEnd();

  const fetchGoals = useCallback(async () => {
    setFetchError(null);
    try {
      const resp = await apiClient.get<GoalsData>('merchant/goals');
      const data = (resp as unknown as { data?: GoalsData })?.data ?? resp;
      setGoals(data as GoalsData);
    } catch (err) {
      // 404 or similar means no goals set yet — treat as null
      if (err?.response?.status === 404) {
        setGoals(null);
      } else {
        setFetchError(err?.message || 'Failed to load goals.');
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchGoals().finally(() => setLoading(false));
  }, [fetchGoals]);

  const handleSetGoals = async (revenue: number, visits: number) => {
    setSaving(true);
    try {
      const resp = await apiClient.post<GoalsData>('merchant/goals', {
        monthlyRevenue: { target: revenue },
        monthlyVisits: { target: visits },
      });
      const data = (resp as unknown as { data?: GoalsData })?.data ?? resp;
      setGoals(data as GoalsData);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditGoals = async (revenue: number, visits: number) => {
    setSaving(true);
    try {
      const resp = await apiClient.put<GoalsData>('merchant/goals', {
        monthlyRevenue: { target: revenue },
        monthlyVisits: { target: visits },
      });
      const data = (resp as unknown as { data?: GoalsData })?.data ?? resp;
      setGoals(data as GoalsData);
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to update goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const revPct = goals ? clampPct(goals.monthlyRevenue.current, goals.monthlyRevenue.target) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6366F1']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue Goals</Text>
        <Text style={styles.headerSubtitle}>Track your monthly performance targets</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.errorText}>{fetchError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchGoals().finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !goals ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <OnboardingForm onSubmit={handleSetGoals} saving={saving} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Streak / Days countdown */}
          <View style={styles.streakBanner}>
            <Ionicons name="time-outline" size={18} color="#6366F1" />
            <Text style={styles.streakText}>
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} until month end
            </Text>
          </View>

          {/* Overall motivation */}
          <View style={styles.motivationBanner}>
            <Text style={styles.motivationBig}>{getMotivationMessage(revPct)}</Text>
            <Text style={styles.motivationSub}>
              You're at {revPct}% of your revenue goal for the month.
            </Text>
          </View>

          {/* Revenue Goal Card */}
          <ProgressCard
            title="Monthly Revenue Goal"
            icon="trending-up"
            iconColor="#10B981"
            iconBg="#D1FAE5"
            current={goals.monthlyRevenue.current}
            target={goals.monthlyRevenue.target}
            formatValue={formatCurrency}
            reachedMessage="Outstanding! You've hit your revenue target this month."
          />

          {/* Visit Goal Card */}
          <ProgressCard
            title="Monthly Visit Goal"
            icon="people"
            iconColor="#3B82F6"
            iconBg="#DBEAFE"
            current={goals.monthlyVisits.current}
            target={goals.monthlyVisits.target}
            formatValue={(n) => `${n.toLocaleString('en-IN')} visits`}
            reachedMessage="Brilliant! You've reached your visit target this month."
          />

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="#6366F1" />
            <Text style={styles.editButtonText}>Edit Goals</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Edit Modal */}
      {editing && goals && (
        <EditGoalsForm
          goals={goals}
          onSave={handleEditGoals}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    padding: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  motivationBanner: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    ...Shadows.sm,
  },
  motivationBig: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7C3AED',
    marginBottom: 4,
  },
  motivationSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
});
