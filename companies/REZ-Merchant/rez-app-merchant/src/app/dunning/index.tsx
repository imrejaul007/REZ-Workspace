/**
 * Dunning Screen
 * Reminder sequences, templates, send reminders
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getReminderTemplates,
  createReminderTemplate,
  updateReminderTemplate,
  deleteReminderTemplate,
  getPendingReminders,
  sendReminder,
  sendBulkReminders,
  ReminderTemplate,
  DunningReminder,
} from '@/services/b2bApi';
import { ReminderTemplateCard } from '@/components/b2b';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';

type TabType = 'reminders' | 'templates';

export default function DunningScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('reminders');
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [reminders, setReminders] = useState<DunningReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template modal
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    daysAfterDue: '0',
    priority: 'medium' as 'low' | 'medium' | 'high',
    channel: 'whatsapp' as 'sms' | 'whatsapp' | 'email',
  });

  // Sending state
  const [sending, setSending] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<Set<string>>(new Set());

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!merchantId) return;

    try {
      const data = await getReminderTemplates(merchantId);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, [merchantId]);

  // Fetch pending reminders
  const fetchReminders = useCallback(async () => {
    if (!merchantId) return;

    try {
      const data = await getPendingReminders(merchantId);
      setReminders(data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchReminders()]);
      setLoading(false);
    };
    load();
  }, [fetchTemplates, fetchReminders]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTemplates(), fetchReminders()]);
    setRefreshing(false);
  }, [fetchTemplates, fetchReminders]);

  // Open add template modal
  const openAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      message: '',
      daysAfterDue: '0',
      priority: 'medium',
      channel: 'whatsapp',
    });
    setTemplateModalVisible(true);
  };

  // Open edit template modal
  const openEditTemplate = (template: ReminderTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject || '',
      message: template.message,
      daysAfterDue: template.daysAfterDue.toString(),
      priority: template.priority,
      channel: template.channel,
    });
    setTemplateModalVisible(true);
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.message.trim()) {
      alert('Please enter template name and message');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
        daysAfterDue: parseInt(formData.daysAfterDue, 10) || 0,
        priority: formData.priority,
        channel: formData.channel,
      };

      if (editingTemplate) {
        await updateReminderTemplate(editingTemplate.id, data);
      } else {
        await createReminderTemplate(data);
      }

      setTemplateModalVisible(false);
      fetchTemplates();
      Alert.alert('Success', editingTemplate ? 'Template updated' : 'Template created');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (template: ReminderTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminderTemplate(template.id);
              fetchTemplates();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // Toggle template active
  const handleToggleActive = async (template: ReminderTemplate) => {
    try {
      await updateReminderTemplate(template.id, { isActive: !template.isActive });
      fetchTemplates();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update');
    }
  };

  // Send single reminder
  const handleSendReminder = async (reminder: DunningReminder) => {
    setSending(true);
    try {
      await sendReminder(reminder.id);
      fetchReminders();
      Alert.alert('Success', 'Reminder sent');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedReminders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedReminders(newSet);
  };

  // Send bulk reminders
  const handleSendBulk = async () => {
    if (selectedReminders.size === 0) {
      alert('Please select at least one reminder');
      return;
    }

    Alert.alert(
      'Send Reminders',
      `Send ${selectedReminders.size} reminders?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const result = await sendBulkReminders(Array.from(selectedReminders));
              setSelectedReminders(new Set());
              fetchReminders();
              Alert.alert('Success', `Sent ${result.sent} reminders${result.failed > 0 ? `, ${result.failed} failed` : ''}`);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Reminder item
  const renderReminderItem = ({ item }: { item: DunningReminder }) => {
    const isSelected = selectedReminders.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.reminderItem, isSelected && styles.reminderItemSelected]}
        onPress={() => handleToggleSelect(item.id)}
      >
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          onPress={() => handleToggleSelect(item.id)}
        >
          {isSelected && <Text style={styles.checkboxCheck}>OK</Text>}
        </TouchableOpacity>

        <View style={styles.reminderContent}>
          <View style={styles.reminderHeader}>
            <Text style={styles.reminderSupplier}>{item.supplierName}</Text>
            <Text style={styles.reminderAmount}>{formatCurrency(item.amount)}</Text>
          </View>
          <Text style={styles.reminderOrder}>Order #{item.orderNumber}</Text>
          <View style={styles.reminderMeta}>
            <Text style={styles.reminderDue}>Due: {formatDate(item.dueDate)}</Text>
            <Text style={styles.reminderOverdue}>
              {item.daysOverdue} days overdue
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSendReminder(item)}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Template item
  const renderTemplateItem = ({ item }: { item: ReminderTemplate }) => (
    <ReminderTemplateCard
      template={item}
      onEdit={() => openEditTemplate(item)}
      onDelete={() => handleDeleteTemplate(item)}
      onToggleActive={() => handleToggleActive(item)}
    />
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dunning..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dunning</Text>
        {activeTab === 'templates' && (
          <TouchableOpacity style={styles.addButton} onPress={openAddTemplate}>
            <Text style={styles.addButtonText}>+ Add Template</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reminders' && styles.tabActive]}
          onPress={() => setActiveTab('reminders')}
        >
          <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>
            Pending Reminders
          </Text>
          {reminders.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'reminders' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'reminders' && styles.tabBadgeTextActive]}>
                {reminders.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && (
        <View style={styles.tabContent}>
          {reminders.length > 0 && selectedReminders.size > 0 && (
            <TouchableOpacity
              style={styles.bulkSendButton}
              onPress={handleSendBulk}
              disabled={sending}
            >
              <Text style={styles.bulkSendButtonText}>
                Send {selectedReminders.size} Selected
              </Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={reminders}
            renderItem={renderReminderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primaryMain]}
                tintColor={colors.primaryMain}
              />
            }
            ListEmptyComponent={
              <EmptyState
                title="No pending reminders"
                message="All suppliers are up to date"
              />
            }
          />
        </View>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <FlatList
          data={templates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primaryMain]}
              tintColor={colors.primaryMain}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No templates"
              message="Create reminder templates to automate collection"
              actionLabel="Add Template"
              onAction={openAddTemplate}
            />
          }
        />
      )}

      {/* Template Modal */}
      <Modal
        visible={templateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTemplateModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </Text>
            <TouchableOpacity onPress={handleSaveTemplate} disabled={saving}>
              <Text style={[styles.modalSave, saving && styles.modalSaveDisabled]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., First Reminder"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput
                style={styles.formInput}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="Email subject (optional)"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder="Dear {{supplier_name}}, your payment of {{amount}} for order {{order_number}} is {{days_overdue}} days overdue."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={6}
              />
              <Text style={styles.formHint}>
                Variables: {'{{supplier_name}}'}, {'{{amount}}'}, {'{{order_number}}'}, {'{{due_date}}'}, {'{{days_overdue}}'}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Days After Due *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.daysAfterDue}
                onChangeText={(text) => setFormData({ ...formData, daysAfterDue: text })}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority</Text>
              <View style={styles.optionsRow}>
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.optionButton,
                      formData.priority === priority && styles.optionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, priority })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.priority === priority && styles.optionButtonTextActive,
                      ]}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Channel</Text>
              <View style={styles.optionsRow}>
                {(['sms', 'whatsapp', 'email'] as const).map((channel) => (
                  <TouchableOpacity
                    key={channel}
                    style={[
                      styles.optionButton,
                      formData.channel === channel && styles.optionButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, channel })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        formData.channel === channel && styles.optionButtonTextActive,
                      ]}
                    >
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  } as TextStyle,
  addButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  addButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface.primary,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  } as ViewStyle,
  tabActive: {
    borderBottomColor: colors.primary[500],
  } as ViewStyle,
  tabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  tabTextActive: {
    color: colors.primary[600],
    fontWeight: typography.fontWeight.semibold,
  } as TextStyle,
  tabBadge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  } as ViewStyle,
  tabBadgeActive: {
    backgroundColor: colors.primary[100],
  } as ViewStyle,
  tabBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  } as TextStyle,
  tabBadgeTextActive: {
    color: colors.primary[600],
  } as TextStyle,
  tabContent: {
    flex: 1,
  } as ViewStyle,
  bulkSendButton: {
    backgroundColor: colors.success[500],
    margin: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  } as ViewStyle,
  bulkSendButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  } as ViewStyle,
  reminderItemSelected: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  } as ViewStyle,
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  checkboxSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  } as ViewStyle,
  checkboxCheck: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  } as TextStyle,
  reminderContent: {
    flex: 1,
  } as ViewStyle,
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  reminderSupplier: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  reminderAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.error[600],
  } as TextStyle,
  reminderOrder: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  reminderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  } as ViewStyle,
  reminderDue: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  } as TextStyle,
  reminderOverdue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[500],
  } as TextStyle,
  sendButton: {
    backgroundColor: colors.success[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  } as ViewStyle,
  sendButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success[600],
  } as TextStyle,
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  } as ViewStyle,
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
  } as TextStyle,
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  } as ViewStyle,
  modalCancel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  } as TextStyle,
  modalTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  modalSave: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  modalSaveDisabled: {
    color: colors.text.tertiary,
  } as TextStyle,
  modalContent: {
    flex: 1,
    padding: spacing.base,
  } as ViewStyle,
  formGroup: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  } as TextStyle,
  formInput: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  } as TextStyle,
  formTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  } as TextStyle,
  formHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  } as TextStyle,
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,
  optionButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  } as ViewStyle,
  optionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  optionButtonTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
});
