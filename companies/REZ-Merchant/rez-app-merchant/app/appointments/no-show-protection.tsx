import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Switch,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

interface DepositPolicy {
  storeId: string;
  enabled: boolean;
  depositType: 'fixed' | 'percentage';
  depositValue: number;
  requireForNewClients: boolean;
  requireForAll: boolean;
  cancellationPolicy: {
    hoursNotice: number;
    lateFee: number;
    lateFeeType: 'fixed' | 'percentage';
    message: string;
  };
}

const DEFAULT_POLICY: Omit<DepositPolicy, 'storeId'> = {
  enabled: false,
  depositType: 'percentage',
  depositValue: 20,
  requireForNewClients: true,
  requireForAll: false,
  cancellationPolicy: {
    hoursNotice: 24,
    lateFee: 0,
    lateFeeType: 'fixed',
    message: 'Cancellations within 24 hours may incur a fee.',
  },
};

export default function NoShowProtectionScreen() {
  const { activeStore } = useStore();
  const storeId = activeStore?._id || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Policy state
  const [enabled, setEnabled] = useState(DEFAULT_POLICY.enabled);
  const [depositType, setDepositType] = useState<'fixed' | 'percentage'>(
    DEFAULT_POLICY.depositType
  );
  const [depositValue, setDepositValue] = useState(String(DEFAULT_POLICY.depositValue));
  const [requireForNewClients, setRequireForNewClients] = useState(
    DEFAULT_POLICY.requireForNewClients
  );
  const [requireForAll, setRequireForAll] = useState(DEFAULT_POLICY.requireForAll);
  const [hoursNotice, setHoursNotice] = useState(
    String(DEFAULT_POLICY.cancellationPolicy.hoursNotice)
  );
  const [lateFee, setLateFee] = useState(String(DEFAULT_POLICY.cancellationPolicy.lateFee));
  const [lateFeeType, setLateFeeType] = useState<'fixed' | 'percentage'>(
    DEFAULT_POLICY.cancellationPolicy.lateFeeType
  );
  const [policyMessage, setPolicyMessage] = useState(DEFAULT_POLICY.cancellationPolicy.message);

  const fetchPolicy = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<DepositPolicy>(`/deposit-policy?storeId=${storeId}`);
      const p = res.data;
      if (p) {
        setEnabled(p.enabled ?? false);
        setDepositType(p.depositType ?? 'percentage');
        setDepositValue(String(p.depositValue ?? 20));
        setRequireForNewClients(p.requireForNewClients ?? true);
        setRequireForAll(p.requireForAll ?? false);
        setHoursNotice(String(p.cancellationPolicy?.hoursNotice ?? 24));
        setLateFee(String(p.cancellationPolicy?.lateFee ?? 0));
        setLateFeeType(p.cancellationPolicy?.lateFeeType ?? 'fixed');
        setPolicyMessage(
          p.cancellationPolicy?.message ?? DEFAULT_POLICY.cancellationPolicy.message
        );
      }
    } catch {
      // silently keep defaults
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSave = async () => {
    if (!storeId) {
      Toast.show({ type: 'error', text1: 'No active store selected' });
      return;
    }
    const parsedDepositValue = parseFloat(depositValue);
    if (isNaN(parsedDepositValue) || parsedDepositValue < 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid deposit amount' });
      return;
    }
    if (depositType === 'percentage' && parsedDepositValue > 100) {
      Toast.show({ type: 'error', text1: 'Percentage cannot exceed 100%' });
      return;
    }
    const parsedHours = parseInt(hoursNotice, 10);
    if (isNaN(parsedHours) || parsedHours < 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid hours notice' });
      return;
    }
    const parsedLateFee = parseFloat(lateFee);
    if (isNaN(parsedLateFee) || parsedLateFee < 0) {
      Toast.show({ type: 'error', text1: 'Enter a valid late fee amount' });
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/deposit-policy', {
        storeId,
        enabled,
        depositType,
        depositValue: parsedDepositValue,
        requireForNewClients,
        requireForAll,
        cancellationPolicy: {
          hoursNotice: parsedHours,
          lateFee: parsedLateFee,
          lateFeeType,
          message: policyMessage.trim(),
        },
      });
      Toast.show({ type: 'success', text1: 'No-show protection saved' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to save policy' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>No-show Protection</ThemedText>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>No-show Protection</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Enable toggle */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.switchLabel}>Require deposit to confirm booking</ThemedText>
              <ThemedText style={styles.switchHint}>
                Clients must pay a deposit before their appointment is confirmed
              </ThemedText>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Deposit settings — only when enabled */}
        {enabled && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Deposit Settings</ThemedText>
            </View>

            <View style={styles.card}>
              {/* Deposit type */}
              <ThemedText style={styles.fieldLabel}>Deposit type</ThemedText>
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  style={[styles.segmentBtn, depositType === 'fixed' && styles.segmentBtnActive]}
                  onPress={() => setDepositType('fixed')}
                >
                  <ThemedText
                    style={[
                      styles.segmentText,
                      depositType === 'fixed' && styles.segmentTextActive,
                    ]}
                  >
                    Fixed ₹
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    depositType === 'percentage' && styles.segmentBtnActive,
                  ]}
                  onPress={() => setDepositType('percentage')}
                >
                  <ThemedText
                    style={[
                      styles.segmentText,
                      depositType === 'percentage' && styles.segmentTextActive,
                    ]}
                  >
                    Percentage %
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Deposit value */}
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.fieldLabel}>
                  {depositType === 'fixed' ? 'Deposit amount (₹)' : 'Deposit percentage (%)'}
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={depositValue}
                  onChangeText={setDepositValue}
                  keyboardType="decimal-pad"
                  placeholder={depositType === 'fixed' ? '200' : '20'}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Who pays deposit */}
              <View style={[styles.switchRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.switchLabel}>New clients only</ThemedText>
                  <ThemedText style={styles.switchHint}>
                    Only require deposit from first-time clients
                  </ThemedText>
                </View>
                <Switch
                  value={requireForNewClients && !requireForAll}
                  onValueChange={(val) => {
                    setRequireForNewClients(val);
                    if (val) setRequireForAll(false);
                  }}
                  trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={[styles.switchRow, { marginTop: 8 }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.switchLabel}>All clients</ThemedText>
                  <ThemedText style={styles.switchHint}>
                    Require deposit from every client
                  </ThemedText>
                </View>
                <Switch
                  value={requireForAll}
                  onValueChange={(val) => {
                    setRequireForAll(val);
                    if (val) setRequireForNewClients(false);
                  }}
                  trackColor={{ false: '#D1D5DB', true: Colors.light.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Cancellation policy */}
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Cancellation Policy</ThemedText>
            </View>

            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.fieldLabel}>
                  Free cancellation until (hours before appointment)
                </ThemedText>
                <TextInput
                  style={styles.textInput}
                  value={hoursNotice}
                  onChangeText={setHoursNotice}
                  keyboardType="number-pad"
                  placeholder="24"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                <ThemedText style={styles.fieldLabel}>Late cancellation fee</ThemedText>
                <View style={styles.feeRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={lateFee}
                    onChangeText={setLateFee}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={styles.feeTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.feeTypeBtn,
                        lateFeeType === 'fixed' && styles.feeTypeBtnActive,
                      ]}
                      onPress={() => setLateFeeType('fixed')}
                    >
                      <ThemedText
                        style={[
                          styles.feeTypeText,
                          lateFeeType === 'fixed' && styles.feeTypeTextActive,
                        ]}
                      >
                        ₹
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.feeTypeBtn,
                        lateFeeType === 'percentage' && styles.feeTypeBtnActive,
                      ]}
                      onPress={() => setLateFeeType('percentage')}
                    >
                      <ThemedText
                        style={[
                          styles.feeTypeText,
                          lateFeeType === 'percentage' && styles.feeTypeTextActive,
                        ]}
                      >
                        %
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                <ThemedText style={styles.fieldLabel}>Policy message shown to clients</ThemedText>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={policyMessage}
                  onChangeText={setPolicyMessage}
                  placeholder="e.g. Cancellations within 24 hours may incur a fee."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Save button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveBtnText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeader: { marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchLabel: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  switchHint: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  fieldGroup: {},
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  segmentBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  segmentTextActive: { color: '#fff' },
  feeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  feeTypeRow: { flexDirection: 'row', gap: 4 },
  feeTypeBtn: {
    width: 40,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  feeTypeBtnActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  feeTypeText: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
  feeTypeTextActive: { color: '#fff' },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
