/**
 * Rebooking Reminder Template Screen
 * Pre-built automation that reminds clients to rebook after their last appointment.
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

type Channel = 'sms' | 'push' | 'both';

interface TemplateState {
  enabled: boolean;
  weeks: string;
  channel: Channel;
  existingRuleId: string | null;
}

interface AutomationRule {
  _id: string;
  name: string;
  status: string;
  trigger: {
    type: string;
    config: { daysSinceLastVisit?: number };
  };
  action: {
    type: string;
    config: { message: string };
  };
}

const DEFAULT_STATE: TemplateState = {
  enabled: false,
  weeks: '4',
  channel: 'both',
  existingRuleId: null,
};

// ─── Channel Selector ─────────────────────────────────────────────────────────

interface ChannelSelectorProps {
  value: Channel;
  onChange: (v: Channel) => void;
}

function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  const options: { key: Channel; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'sms', label: 'SMS', icon: 'chatbubble-outline' },
    { key: 'push', label: 'Push', icon: 'notifications-outline' },
    { key: 'both', label: 'Both', icon: 'layers-outline' },
  ];

  return (
    <View style={chanStyles.row}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[chanStyles.chip, value === opt.key && chanStyles.chipActive]}
          onPress={() => onChange(opt.key)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === opt.key }}
        >
          <Ionicons name={opt.icon} size={16} color={value === opt.key ? '#7C3AED' : '#6B7280'} />
          <Text style={[chanStyles.chipText, value === opt.key && chanStyles.chipTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chanStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  chipActive: { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#7C3AED' },
});

// ─── Message Preview ──────────────────────────────────────────────────────────

function MessagePreview({ weeks }: { weeks: string }) {
  const weeksNum = parseInt(weeks, 10);
  const weeksLabel = !isNaN(weeksNum) && weeksNum > 0 ? weeksNum : 4;

  return (
    <View style={previewStyles.container}>
      <View style={previewStyles.labelRow}>
        <Ionicons name="eye-outline" size={14} color="#6B7280" />
        <Text style={previewStyles.label}>Message Preview</Text>
      </View>
      <View style={previewStyles.bubble}>
        <Text style={previewStyles.text}>
          Hi <Text style={previewStyles.var}>{'{clientName}'}</Text>, it&apos;s been{' '}
          <Text style={previewStyles.var}>{weeksLabel} weeks</Text> since your last visit at{' '}
          <Text style={previewStyles.var}>{'{storeName}'}</Text>. Ready to book your next
          appointment?
        </Text>
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: { marginTop: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bubble: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 14,
  },
  text: { fontSize: 14, color: '#374151', lineHeight: 20 },
  var: { color: '#7C3AED', fontWeight: '700' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RebookingTemplateScreen() {
  const { activeStore } = useStore();
  const [state, setState] = useState<TemplateState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load existing rebooking rule ──────────────────────────────────────────

  const load = useCallback(async () => {
    if (!activeStore?._id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.get<AutomationRule[]>(
        `automation-rules?storeId=${activeStore._id}`
      );
      const rules: AutomationRule[] = res.data ?? [];
      const existing = rules.find(
        (r) => r.name === 'Rebooking Reminder' || r.trigger?.type === 'rebooking_overdue'
      );

      if (existing) {
        const daysSince = existing.trigger?.config?.daysSinceLastVisit ?? 28;
        const channelGuess: Channel =
          existing.action?.type === 'send_sms'
            ? 'sms'
            : existing.action?.type === 'send_push'
              ? 'push'
              : 'both';

        setState({
          enabled: existing.status === 'active',
          weeks: String(Math.round(daysSince / 7)),
          channel: channelGuess,
          existingRuleId: existing._id,
        });
      }
    } catch {
      // Non-critical — start from defaults
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

    const weeksNum = parseInt(state.weeks, 10);
    if (isNaN(weeksNum) || weeksNum < 1) {
      Alert.alert('Validation', 'Weeks must be at least 1.');
      return;
    }

    const delayDays = weeksNum * 7;
    const actionType =
      state.channel === 'sms' ? 'send_sms' : state.channel === 'push' ? 'send_push' : 'send_push'; // 'both' → push as primary; SMS handled by backend fan-out

    const message = `Hi {clientName}, it's been ${weeksNum} ${weeksNum === 1 ? 'week' : 'weeks'} since your last visit at {storeName}. Ready to book your next appointment?`;

    setIsSaving(true);
    try {
      if (state.existingRuleId) {
        // Update existing rule
        await apiClient.put(`automation-rules/${state.existingRuleId}`, {
          name: 'Rebooking Reminder',
          status: state.enabled ? 'active' : 'paused',
          trigger: {
            type: 'rebooking_overdue',
            config: { daysSinceLastVisit: delayDays },
          },
          action: {
            type: actionType,
            config: { message },
          },
        });
      } else {
        // Create new rule
        const res = await apiClient.post<AutomationRule>('automation-rules', {
          storeId: activeStore._id,
          name: 'Rebooking Reminder',
          status: state.enabled ? 'active' : 'paused',
          trigger: {
            type: 'rebooking_overdue',
            config: { daysSinceLastVisit: delayDays },
          },
          action: {
            type: actionType,
            config: { message },
          },
        });
        if (res.data?._id) {
          setState((s) => ({ ...s, existingRuleId: res.data?._id ?? null }));
        }
      }

      Alert.alert('Saved', 'Rebooking reminder updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <NavHeader title="Rebooking Reminder" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading automation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavHeader title="Rebooking Reminder" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Description banner */}
          <View style={styles.banner}>
            <Ionicons name="repeat-outline" size={20} color="#7C3AED" />
            <Text style={styles.bannerText}>
              Automatically remind clients to rebook after their appointment to keep your calendar
              full.
            </Text>
          </View>

          {/* Enable toggle */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Enable Reminder</Text>
                <Text style={styles.toggleSubtitle}>
                  Clients receive a reminder when it&apos;s time to rebook
                </Text>
              </View>
              <Switch
                value={state.enabled}
                onValueChange={(v) => setState((s) => ({ ...s, enabled: v }))}
                trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                thumbColor={state.enabled ? '#7C3AED' : '#9CA3AF'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* Weeks field */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Reminder Timing</Text>
            <Text style={styles.sectionSubtitle}>
              Send reminder after the client&apos;s last appointment
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.numInput}
                value={state.weeks}
                onChangeText={(v) => setState((s) => ({ ...s, weeks: v }))}
                keyboardType="numeric"
                maxLength={2}
                accessibilityLabel="Weeks after last appointment"
              />
              <Text style={styles.inputSuffix}>weeks after last appointment</Text>
            </View>
          </View>

          {/* Channel */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notification Channel</Text>
            <Text style={styles.sectionSubtitle}>How the reminder is delivered to clients</Text>
            <ChannelSelector
              value={state.channel}
              onChange={(v) => setState((s) => ({ ...s, channel: v }))}
            />
          </View>

          {/* Message preview */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Message</Text>
            <MessagePreview weeks={state.weeks} />
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save rebooking reminder"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Reminder</Text>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  bannerText: { flex: 1, fontSize: 13, color: '#5B21B6', lineHeight: 18 },
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
    width: 64,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
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
