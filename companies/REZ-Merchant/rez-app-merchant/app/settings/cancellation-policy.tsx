/**
 * Cancellation Policy Settings Screen
 * Configure free-cancel window and late / no-show fees.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type FeeType = 'none' | 'percentage' | 'fixed';

interface PolicyState {
  enabled: boolean;
  freeCancelHours: string;
  lateFeeType: FeeType;
  lateFeeValue: string;
  noShowFeeType: FeeType;
  noShowFeeValue: string;
}

const DEFAULT_POLICY: PolicyState = {
  enabled: false,
  freeCancelHours: '24',
  lateFeeType: 'none',
  lateFeeValue: '0',
  noShowFeeType: 'none',
  noShowFeeValue: '0',
};

// ─── Fee Type Selector ────────────────────────────────────────────────────────

interface FeeTypeSelectorProps {
  value: FeeType;
  onChange: (v: FeeType) => void;
}

function FeeTypeSelector({ value, onChange }: FeeTypeSelectorProps) {
  const options: { key: FeeType; label: string }[] = [
    { key: 'none', label: 'None' },
    { key: 'percentage', label: 'Percentage' },
    { key: 'fixed', label: 'Fixed ₹' },
  ];

  return (
    <View style={feeStyles.row}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[feeStyles.chip, value === opt.key && feeStyles.chipActive]}
          onPress={() => onChange(opt.key)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === opt.key }}
        >
          <Text style={[feeStyles.chipText, value === opt.key && feeStyles.chipTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const feeStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#7C3AED' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CancellationPolicyScreen() {
  const { activeStore } = useStore();
  const [policy, setPolicy] = useState<PolicyState>(DEFAULT_POLICY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load existing policy ──────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = activeStore?._id ? `?storeId=${activeStore._id}` : '';
      const res = await apiClient.get<
        PolicyState & { freeCancelHours: number; lateFeeValue: number; noShowFeeValue: number }
      >(`cancellation-policy${params}`);
      const data = res.data;
      if (data) {
        setPolicy({
          enabled: !!data.enabled,
          freeCancelHours: String(data.freeCancelHours ?? 24),
          lateFeeType: (data.lateFeeType as FeeType) ?? 'none',
          lateFeeValue: String(data.lateFeeValue ?? 0),
          noShowFeeType: (data.noShowFeeType as FeeType) ?? 'none',
          noShowFeeValue: String(data.noShowFeeValue ?? 0),
        });
      }
    } catch {
      // Non-critical — use defaults
    } finally {
      setIsLoading(false);
    }
  }, [activeStore?._id]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!activeStore?._id) {
      Alert.alert('Error', 'No active store selected.');
      return;
    }

    const freeCancelHoursNum = parseInt(policy.freeCancelHours, 10);
    if (isNaN(freeCancelHoursNum) || freeCancelHoursNum < 0) {
      Alert.alert('Validation', 'Free cancel window must be a non-negative number.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('cancellation-policy', {
        storeId: activeStore._id,
        enabled: policy.enabled,
        freeCancelHours: freeCancelHoursNum,
        lateFeeType: policy.lateFeeType,
        lateFeeValue: parseFloat(policy.lateFeeValue) || 0,
        noShowFeeType: policy.noShowFeeType,
        noShowFeeValue: parseFloat(policy.noShowFeeValue) || 0,
      });
      Alert.alert('Saved', 'Cancellation policy updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save policy. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <NavHeader title="Cancellation Policy" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading policy...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavHeader title="Cancellation Policy" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Enable toggle */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Enable Cancellation Policy</Text>
                <Text style={styles.toggleSubtitle}>
                  Apply fees when clients cancel late or no-show
                </Text>
              </View>
              <Switch
                value={policy.enabled}
                onValueChange={(v) => setPolicy((p) => ({ ...p, enabled: v }))}
                trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                thumbColor={policy.enabled ? '#7C3AED' : '#9CA3AF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* Free cancel window */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Free Cancel Window</Text>
            <Text style={styles.sectionSubtitle}>
              Clients can cancel for free up to X hours before the appointment
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.numInput}
                value={policy.freeCancelHours}
                onChangeText={(v) => setPolicy((p) => ({ ...p, freeCancelHours: v }))}
                keyboardType="numeric"
                maxLength={4}
                accessibilityLabel="Free cancel hours"
              />
              <Text style={styles.inputSuffix}>hours before</Text>
            </View>
          </View>

          {/* Late cancellation fee */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Late Cancellation Fee</Text>
            <Text style={styles.sectionSubtitle}>
              Charged when client cancels inside the free-cancel window
            </Text>
            <FeeTypeSelector
              value={policy.lateFeeType}
              onChange={(v) => setPolicy((p) => ({ ...p, lateFeeType: v }))}
            />
            {policy.lateFeeType !== 'none' && (
              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <TextInput
                  style={styles.numInput}
                  value={policy.lateFeeValue}
                  onChangeText={(v) => setPolicy((p) => ({ ...p, lateFeeValue: v }))}
                  keyboardType="decimal-pad"
                  maxLength={8}
                  accessibilityLabel="Late fee value"
                />
                <Text style={styles.inputSuffix}>
                  {policy.lateFeeType === 'percentage' ? '% of service price' : '₹ fixed'}
                </Text>
              </View>
            )}
          </View>

          {/* No-show fee */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>No-Show Fee</Text>
            <Text style={styles.sectionSubtitle}>
              Charged when the client does not appear for their appointment
            </Text>
            <FeeTypeSelector
              value={policy.noShowFeeType}
              onChange={(v) => setPolicy((p) => ({ ...p, noShowFeeType: v }))}
            />
            {policy.noShowFeeType !== 'none' && (
              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <TextInput
                  style={styles.numInput}
                  value={policy.noShowFeeValue}
                  onChangeText={(v) => setPolicy((p) => ({ ...p, noShowFeeValue: v }))}
                  keyboardType="decimal-pad"
                  maxLength={8}
                  accessibilityLabel="No-show fee value"
                />
                <Text style={styles.inputSuffix}>
                  {policy.noShowFeeType === 'percentage' ? '% of service price' : '₹ fixed'}
                </Text>
              </View>
            )}
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save cancellation policy"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Policy</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Nav Header ───────────────────────────────────────────────────────────────

function NavHeader({ title }: { title: string }) {
  return (
    <View style={styles.navHeader}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color="#374151" />
      </TouchableOpacity>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40 },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: { color: '#6B7280', fontSize: 14 },
  scroll: { flex: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  toggleSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  numInput: {
    width: 80,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
  },
  inputSuffix: { fontSize: 14, color: '#6B7280', flex: 1 },
  saveBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { backgroundColor: '#C4B5FD', shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
