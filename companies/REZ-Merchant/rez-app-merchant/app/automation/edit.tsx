/**
 * Automation Rule Editor Screen
 *
 * Create or edit an automation rule.
 * POST /api/automation-rules (new) or PUT /api/automation-rules/:id (edit)
 *
 * Query params:
 *   id      — existing rule ID to edit
 *   prefill — JSON-encoded partial rule to pre-fill (from template presets)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TriggerType =
  | 'rebooking_overdue'
  | 'birthday'
  | 'post_visit_review'
  | 'visit_anniversary'
  | 'inactive_client'
  | 'first_visit';

type ActionType = 'send_push' | 'send_sms' | 'send_email' | 'give_coins';

type RuleStatus = 'active' | 'paused' | 'draft';

interface TriggerOption {
  type: TriggerType;
  label: string;
  icon: string;
  color: string;
  configLabel: string;
  configKey: 'daysSinceLastVisit' | 'daysBeforeBirthday' | 'hoursAfterVisit' | 'yearsAnniversary';
  configDefault: number;
  configUnit: string;
}

interface ActionOption {
  type: ActionType;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIGGERS: TriggerOption[] = [
  {
    type: 'rebooking_overdue',
    label: "Hasn't Rebooked",
    icon: 'calendar-outline',
    color: '#6366f1',
    configLabel: 'Days since last visit',
    configKey: 'daysSinceLastVisit',
    configDefault: 30,
    configUnit: 'days',
  },
  {
    type: 'birthday',
    label: 'Birthday',
    icon: 'gift-outline',
    color: '#f59e0b',
    configLabel: 'Days before birthday',
    configKey: 'daysBeforeBirthday',
    configDefault: 1,
    configUnit: 'days',
  },
  {
    type: 'post_visit_review',
    label: 'After Visit',
    icon: 'star-outline',
    color: '#10b981',
    configLabel: 'Hours after appointment',
    configKey: 'hoursAfterVisit',
    configDefault: 2,
    configUnit: 'hours',
  },
  {
    type: 'inactive_client',
    label: 'Inactive Client',
    icon: 'person-outline',
    color: '#ef4444',
    configLabel: 'Days without visit',
    configKey: 'daysSinceLastVisit',
    configDefault: 60,
    configUnit: 'days',
  },
  {
    type: 'first_visit',
    label: 'First Visit',
    icon: 'sparkles-outline',
    color: '#8b5cf6',
    configLabel: '',
    configKey: 'daysSinceLastVisit',
    configDefault: 0,
    configUnit: '',
  },
];

const ACTIONS: ActionOption[] = [
  {
    type: 'send_push',
    label: 'Push Notification',
    icon: 'notifications',
    color: '#6366f1',
    bg: '#ede9fe',
  },
  { type: 'send_sms', label: 'SMS', icon: 'chatbubble-ellipses', color: '#007aff', bg: '#dbeafe' },
  { type: 'send_email', label: 'Email', icon: 'mail', color: '#ea4335', bg: '#fee2e2' },
  {
    type: 'give_coins',
    label: 'Give Coins',
    icon: 'logo-bitcoin',
    color: '#f59e0b',
    bg: '#fef3c7',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function previewMessage(message: string): string {
  return message.replace(/\{name\}/g, 'Priya');
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AutomationEditScreen() {
  const { id, prefill } = useLocalSearchParams<{ id?: string; prefill?: string }>();
  const { activeStore } = useStore();

  const isEdit = !!id;

  // Form state
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('rebooking_overdue');
  const [triggerConfigValue, setTriggerConfigValue] = useState('30');
  const [actionType, setActionType] = useState<ActionType>('send_push');
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [coinAmount, setCoinAmount] = useState('');

  const [loadingRule, setLoadingRule] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const selectedTrigger = TRIGGERS.find((t) => t.type === triggerType) ?? TRIGGERS[0];

  // Apply prefill or fetch existing rule
  useEffect(() => {
    if (prefill) {
      try {
        const parsed = JSON.parse(prefill);
        if (parsed.name) setName(parsed.name);
        if (parsed.trigger?.type) {
          setTriggerType(parsed.trigger.type);
          const tOpt = TRIGGERS.find((t) => t.type === parsed.trigger.type);
          if (tOpt && parsed.trigger.config?.[tOpt.configKey] !== undefined) {
            setTriggerConfigValue(String(parsed.trigger.config[tOpt.configKey]));
          } else if (tOpt) {
            setTriggerConfigValue(String(tOpt.configDefault));
          }
        }
        if (parsed.action?.type) setActionType(parsed.action.type);
        if (parsed.action?.config?.title) setActionTitle(parsed.action.config.title);
        if (parsed.action?.config?.message) setActionMessage(parsed.action.config.message);
        if (parsed.action?.config?.coinAmount)
          setCoinAmount(String(parsed.action.config.coinAmount));
      } catch {
        // ignore malformed prefill
      }
    }
  }, [prefill]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await apiClient.get<unknown>(`automation-rules/${id}`);
        if (res.success && res.data?.rule) {
          const rule = res.data.rule;
          setName(rule.name ?? '');
          setTriggerType(rule.trigger?.type ?? 'rebooking_overdue');
          const tOpt = TRIGGERS.find((t) => t.type === rule.trigger?.type);
          if (tOpt && rule.trigger?.config?.[tOpt.configKey] !== undefined) {
            setTriggerConfigValue(String(rule.trigger.config[tOpt.configKey]));
          }
          setActionType(rule.action?.type ?? 'send_push');
          setActionTitle(rule.action?.config?.title ?? '');
          setActionMessage(rule.action?.config?.message ?? '');
          setCoinAmount(
            rule.action?.config?.coinAmount ? String(rule.action.config.coinAmount) : ''
          );
        }
      } catch {
        Alert.alert('Error', 'Could not load rule. Please go back and try again.');
      } finally {
        setLoadingRule(false);
      }
    })();
  }, [id, isEdit]);

  // When trigger type changes, reset config value to default
  const handleTriggerTypeChange = useCallback((type: TriggerType) => {
    setTriggerType(type);
    const tOpt = TRIGGERS.find((t) => t.type === type);
    if (tOpt) setTriggerConfigValue(String(tOpt.configDefault));
  }, []);

  const buildPayload = (status: RuleStatus) => {
    const tOpt = TRIGGERS.find((t) => t.type === triggerType) ?? TRIGGERS[0];
    const triggerConfig: Record<string, number> = {};
    if (tOpt.configKey && tOpt.configUnit) {
      triggerConfig[tOpt.configKey] = parseInt(triggerConfigValue, 10) || tOpt.configDefault;
    }

    const actionConfig: Record<string, string | number> = {
      message: actionMessage.trim(),
    };
    if (actionType === 'send_push' && actionTitle.trim()) {
      actionConfig.title = actionTitle.trim();
    }
    if (actionType === 'give_coins' && coinAmount) {
      actionConfig.coinAmount = parseInt(coinAmount, 10) || 0;
    }

    return {
      storeId: activeStore?._id,
      name: name.trim(),
      status,
      trigger: { type: triggerType, config: triggerConfig },
      action: { type: actionType, config: actionConfig },
    };
  };

  const handleSave = useCallback(
    async (status: RuleStatus) => {
      if (!name.trim()) {
        Alert.alert('Validation', 'Please enter a rule name.');
        return;
      }
      if (!actionMessage.trim()) {
        Alert.alert('Validation', 'Please enter the message to send.');
        return;
      }
      if (!activeStore?._id) {
        Alert.alert('Error', 'No active store selected.');
        return;
      }

      setSaving(true);
      try {
        const payload = buildPayload(status);
        let res;
        if (isEdit) {
          res = await apiClient.put(`automation-rules/${id}`, payload);
        } else {
          res = await apiClient.post('automation-rules', payload);
        }
        if (res.success) {
          router.back();
        } else {
          throw new Error(res.message || 'Save failed');
        }
      } catch (err) {
        Alert.alert('Error', err.message || 'Could not save rule. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [
      name,
      actionMessage,
      activeStore,
      isEdit,
      id,
      triggerType,
      triggerConfigValue,
      actionType,
      actionTitle,
      coinAmount,
    ]
  );

  if (loadingRule) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Rule' : 'New Rule'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Rule Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rule Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rebooking Reminder"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Trigger Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When this happens</Text>
          <View style={styles.triggerGrid}>
            {TRIGGERS.map((t) => {
              const active = triggerType === t.type;
              return (
                <TouchableOpacity
                  key={t.type}
                  style={[styles.triggerCard, active && { borderColor: t.color, borderWidth: 2 }]}
                  onPress={() => handleTriggerTypeChange(t.type)}
                  activeOpacity={0.82}
                >
                  <View
                    style={[styles.triggerIconBox, active && { backgroundColor: t.color + '18' }]}
                  >
                    <Ionicons name={t.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={active ? t.color : '#9ca3af'} />
                  </View>
                  <Text
                    style={[styles.triggerLabel, active && { color: t.color, fontWeight: '700' }]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Trigger config input */}
          {selectedTrigger.configKey && selectedTrigger.configUnit ? (
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>{selectedTrigger.configLabel}</Text>
              <View style={styles.configInputRow}>
                <TextInput
                  style={styles.configInput}
                  value={triggerConfigValue}
                  onChangeText={setTriggerConfigValue}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Text style={styles.configUnit}>{selectedTrigger.configUnit}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Action Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send this</Text>

          {/* Action type picker */}
          <View style={styles.actionRow}>
            {ACTIONS.map((a) => {
              const active = actionType === a.type;
              return (
                <TouchableOpacity
                  key={a.type}
                  style={[
                    styles.actionChip,
                    active && { backgroundColor: a.bg, borderColor: a.color },
                  ]}
                  onPress={() => setActionType(a.type)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={a.icon as unknown as keyof typeof Ionicons.glyphMap} size={14} color={active ? a.color : '#9ca3af'} />
                  <Text style={[styles.actionChipText, active && { color: a.color }]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Title (push only) */}
          {actionType === 'send_push' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Notification Title</Text>
              <TextInput
                style={styles.textInput}
                value={actionTitle}
                onChangeText={setActionTitle}
                placeholder="e.g. Time for your next visit!"
                placeholderTextColor="#9ca3af"
              />
            </View>
          )}

          {/* Message */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.textarea]}
              value={actionMessage}
              onChangeText={setActionMessage}
              placeholder="Write your message here..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.mergeHint}>
              Tip: use <Text style={styles.mergeTag}>{'{name}'}</Text> to personalise with the
              client's name.
            </Text>
          </View>

          {/* Coin amount (give_coins only) */}
          {actionType === 'give_coins' && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Coin Amount</Text>
              <TextInput
                style={styles.textInput}
                value={coinAmount}
                onChangeText={setCoinAmount}
                keyboardType="number-pad"
                placeholder="e.g. 50"
                placeholderTextColor="#9ca3af"
                maxLength={6}
              />
            </View>
          )}
        </View>

        {/* Preview */}
        {actionMessage.trim() ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewBox}>
              {actionType === 'send_push' && actionTitle.trim() ? (
                <Text style={styles.previewTitle}>{previewMessage(actionTitle)}</Text>
              ) : null}
              <Text style={styles.previewMessage}>{previewMessage(actionMessage)}</Text>
              <Text style={styles.previewNote}>Sample name: Priya</Text>
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={() => handleSave('draft')}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.activateButton}
            onPress={() => handleSave('active')}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.activateButtonText}>
                {isEdit ? 'Save & Activate' : 'Activate'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },

  // Scroll
  scrollContent: { padding: 16 },

  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12 },

  // Text input
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  textarea: { minHeight: 88, paddingTop: 12 },

  // Trigger grid
  triggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  triggerCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    minWidth: 90,
    gap: 6,
  },
  triggerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerLabel: { fontSize: 11, color: '#6b7280', textAlign: 'center', fontWeight: '500' },

  // Trigger config
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  configLabel: { fontSize: 13, color: '#374151', flex: 1 },
  configInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  configInput: {
    width: 64,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  configUnit: { fontSize: 13, color: '#6b7280' },

  // Action picker
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  actionChipText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },

  // Field group
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '600' },
  mergeHint: { fontSize: 11, color: '#9ca3af', marginTop: 5 },
  mergeTag: { color: '#6366f1', fontWeight: '700' },

  // Preview
  previewBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  previewTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  previewMessage: { fontSize: 13, color: '#374151', lineHeight: 19 },
  previewNote: { fontSize: 11, color: '#9ca3af', marginTop: 6 },

  // Buttons
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  draftButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  draftButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  activateButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  activateButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
