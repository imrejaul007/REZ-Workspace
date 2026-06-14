import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useStore } from '@/contexts/StoreContext';

type Segment = 'high_value' | 'at_risk' | 'new_users';

interface MessageTemplate {
  _id: string;
  name: string;
  title: string;
  body: string;
}

const SEGMENT_OPTIONS: { key: Segment; label: string; estimatedReach: number }[] = [
  { key: 'high_value', label: 'High Value', estimatedReach: 120 },
  { key: 'at_risk', label: 'At Risk', estimatedReach: 85 },
  { key: 'new_users', label: 'New Users', estimatedReach: 200 },
];

function SegmentPill({
  option,
  selected,
  onPress,
}: {
  option: (typeof SEGMENT_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[pillStyles.pill, selected && pillStyles.pillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[pillStyles.text, selected && pillStyles.textSelected]}>{option.label}</Text>
    </TouchableOpacity>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
    marginRight: 8,
  },
  pillSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  textSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});

export default function CustomerMessageScreen() {
  const { activeStore } = useStore();

  const [selectedSegment, setSelectedSegment] = useState<Segment>('high_value');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const res = await apiClient.get<unknown>('merchant/marketing/templates');
      const payload = res.data ?? res;
      const list: MessageTemplate[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.templates)
          ? payload.templates
          : [];
      setTemplates(list);
      if (list.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(list[0]._id);
      }
    } catch (err) {
      logger.error('[CustomerMessage] templates error:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId) ?? null;

  const previewTitle = useCustomMessage ? customTitle : (selectedTemplate?.title ?? '');
  const previewBody = useCustomMessage ? customBody : (selectedTemplate?.body ?? '');

  const estimatedReach =
    SEGMENT_OPTIONS.find((s) => s.key === selectedSegment)?.estimatedReach ?? 0;

  const handleSend = async () => {
    if (!useCustomMessage && !selectedTemplateId) {
      platformAlertSimple('Validation', 'Please select a message template.');
      return;
    }
    if (useCustomMessage && !customTitle.trim()) {
      platformAlertSimple('Validation', 'Please enter a message title.');
      return;
    }
    if (useCustomMessage && !customBody.trim()) {
      platformAlertSimple('Validation', 'Please enter a message body.');
      return;
    }

    try {
      setSending(true);
      const payload: Record<string, unknown> = {
        segment: selectedSegment,
        merchantId: activeStore?._id,
      };
      if (useCustomMessage) {
        payload.title = customTitle.trim();
        payload.body = customBody.trim();
      } else {
        payload.templateId = selectedTemplateId;
      }
      await apiClient.post('merchant/broadcasts/send', payload);
      platformAlertSimple('Sent', 'Your message has been broadcast successfully.');
      router.back();
    } catch (err) {
      logger.error('[CustomerMessage] send error:', err);
      platformAlertSimple('Error', err.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Send Message to Customers</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Segment Selector */}
          <Text style={styles.sectionLabel}>Target Segment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {SEGMENT_OPTIONS.map((opt) => (
              <SegmentPill
                key={opt.key}
                option={opt}
                selected={selectedSegment === opt.key}
                onPress={() => setSelectedSegment(opt.key)}
              />
            ))}
          </ScrollView>

          <View style={styles.reachRow}>
            <Ionicons name="people-outline" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.reachText}>Estimated reach: ~{estimatedReach} customers</Text>
          </View>

          {/* Rate Limit Warning */}
          <View style={styles.warningRow}>
            <Ionicons name="time-outline" size={15} color="#D97706" />
            <Text style={styles.warningText}>Max 1 broadcast per hour</Text>
          </View>

          {/* Custom Message Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.sectionLabel} numberOfLines={1}>
              Use custom message
            </Text>
            <Switch
              value={useCustomMessage}
              onValueChange={setUseCustomMessage}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Template Picker (when not using custom) */}
          {!useCustomMessage && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Message Template</Text>
              {templatesLoading ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.light.primary}
                  style={{ marginVertical: 8 }}
                />
              ) : templates.length === 0 ? (
                <Text style={styles.emptyTemplateText}>No templates available</Text>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowTemplatePicker((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownBtnText} numberOfLines={1}>
                      {selectedTemplate ? selectedTemplate.name : 'Select a template'}
                    </Text>
                    <Ionicons
                      name={showTemplatePicker ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.light.textSecondary}
                    />
                  </TouchableOpacity>
                  {showTemplatePicker && (
                    <View style={styles.dropdownList}>
                      {templates.map((t) => (
                        <TouchableOpacity
                          key={t._id}
                          style={[
                            styles.dropdownItem,
                            selectedTemplateId === t._id && styles.dropdownItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedTemplateId(t._id);
                            setShowTemplatePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedTemplateId === t._id && styles.dropdownItemTextSelected,
                            ]}
                          >
                            {t.name}
                          </Text>
                          {selectedTemplateId === t._id && (
                            <Ionicons name="checkmark" size={16} color={Colors.light.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Custom Message Inputs */}
          {useCustomMessage && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Message title"
                placeholderTextColor={Colors.light.textSecondary}
                value={customTitle}
                onChangeText={setCustomTitle}
              />
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Body *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Message body"
                placeholderTextColor={Colors.light.textSecondary}
                value={customBody}
                onChangeText={setCustomBody}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Preview Card */}
          {(previewTitle || previewBody) && (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Ionicons name="notifications" size={16} color={Colors.light.primary} />
                <Text style={styles.previewHeaderText}>Message Preview</Text>
              </View>
              {previewTitle ? <Text style={styles.previewTitle}>{previewTitle}</Text> : null}
              {previewBody ? <Text style={styles.previewBody}>{previewBody}</Text> : null}
            </View>
          )}

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>Send Broadcast</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textHeading,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 10,
    marginTop: 4,
  },
  pillRow: { flexDirection: 'row', marginBottom: 10 },
  reachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reachText: { fontSize: 13, color: Colors.light.textSecondary },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: { fontSize: 12, color: '#92400E', fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 6,
  },
  emptyTemplateText: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  dropdownBtnText: { fontSize: 14, color: Colors.light.text, flex: 1 },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  dropdownItemSelected: { backgroundColor: Colors.light.primaryLight2 },
  dropdownItemText: { fontSize: 14, color: Colors.light.text },
  dropdownItemTextSelected: { color: Colors.light.primary, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: 11,
  },
  previewCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  previewBody: { fontSize: 13, color: Colors.light.textDark, lineHeight: 19 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 4,
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
