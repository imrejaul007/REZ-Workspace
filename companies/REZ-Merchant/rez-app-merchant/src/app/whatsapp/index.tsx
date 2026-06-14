/**
 * WhatsApp Screen
 * WhatsApp message templates, send updates
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
  Linking,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
  sendWhatsAppMessage,
  getWhatsAppMessageHistory,
  WhatsAppTemplate,
  WhatsAppMessage,
} from '@/services/b2bApi';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';

type TabType = 'templates' | 'history';

export default function WhatsAppScreen(): React.JSX.Element {
  const { merchantId } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [messageHistory, setMessageHistory] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template modal
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  // Send message modal
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [sendForm, setSendForm] = useState({
    recipientPhone: '',
    recipientName: '',
    message: '',
    templateId: '',
  });
  const [sending, setSending] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'general' as WhatsAppTemplate['category'],
    content: '',
  });

  const categories: { key: WhatsAppTemplate['category']; label: string }[] = [
    { key: 'order_update', label: 'Order Update' },
    { key: 'payment_reminder', label: 'Payment Reminder' },
    { key: 'promotion', label: 'Promotion' },
    { key: 'general', label: 'General' },
  ];

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!merchantId) return;

    try {
      const data = await getWhatsAppTemplates(merchantId);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  }, [merchantId]);

  // Fetch message history
  const fetchMessageHistory = useCallback(async () => {
    if (!merchantId) return;

    try {
      const response = await getWhatsAppMessageHistory(merchantId);
      setMessageHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [merchantId]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTemplates(), fetchMessageHistory()]);
      setLoading(false);
    };
    load();
  }, [fetchTemplates, fetchMessageHistory]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTemplates(), fetchMessageHistory()]);
    setRefreshing(false);
  }, [fetchTemplates, fetchMessageHistory]);

  // Open add template modal
  const openAddTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'general',
      content: '',
    });
    setTemplateModalVisible(true);
  };

  // Open edit template modal
  const openEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setTemplateModalVisible(true);
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Please enter template name and content');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        category: formData.category,
        content: formData.content.trim(),
      };

      if (editingTemplate) {
        await updateWhatsAppTemplate(editingTemplate.id, data);
      } else {
        await createWhatsAppTemplate(data);
      }

      setTemplateModalVisible(false);
      fetchTemplates();
      Alert.alert('Success', editingTemplate ? 'Template updated' : 'Template created');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDeleteTemplate = async (template: WhatsAppTemplate) => {
    Alert.alert(
      'Delete Template',
      `Delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWhatsAppTemplate(template.id);
              fetchTemplates();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // Open send modal with template
  const openSendModal = (template?: WhatsAppTemplate) => {
    setSendForm({
      recipientPhone: '',
      recipientName: '',
      message: template?.content || '',
      templateId: template?.id || '',
    });
    setSendModalVisible(true);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!sendForm.recipientPhone.trim() || !sendForm.message.trim()) {
      alert('Please enter recipient phone and message');
      return;
    }

    // Validate phone number (basic)
    const phone = sendForm.recipientPhone.replace(/\D/g, '');
    if (phone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    setSending(true);
    try {
      const result = await sendWhatsAppMessage({
        recipientPhone: sendForm.recipientPhone.trim(),
        recipientName: sendForm.recipientName.trim() || undefined,
        templateId: sendForm.templateId || undefined,
        message: sendForm.message.trim(),
      });

      setSendModalVisible(false);
      fetchMessageHistory();

      // Open WhatsApp if available
      const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(sendForm.message.trim())}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      Alert.alert(
        'Message Queued',
        canOpen
          ? 'Your message is ready. Open WhatsApp to send?'
          : 'Your message has been queued for sending.',
        canOpen
          ? [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Open WhatsApp',
                onPress: () => Linking.openURL(whatsappUrl),
              },
            ]
          : [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: WhatsAppMessage['status']) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return colors.success[500];
      case 'queued':
        return colors.warning[500];
      case 'failed':
        return colors.error[500];
      default:
        return colors.gray[500];
    }
  };

  // Template item
  const renderTemplateItem = ({ item }: { item: WhatsAppTemplate }) => {
    const categoryLabel = categories.find((c) => c.key === item.category)?.label || item.category;

    return (
      <TouchableOpacity style={styles.templateCard} onPress={() => openEditTemplate(item)}>
        <View style={styles.templateHeader}>
          <View>
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={styles.templateCategory}>{categoryLabel}</Text>
          </View>
          <View style={styles.templateActions}>
            <Badge
              label={item.isActive ? 'Active' : 'Inactive'}
              variant={item.isActive ? 'success' : 'default'}
            />
            <Text style={styles.useCount}>{item.useCount} uses</Text>
          </View>
        </View>

        <View style={styles.templateContent}>
          <Text style={styles.templatePreview} numberOfLines={3}>
            {item.content}
          </Text>
        </View>

        <View style={styles.templateFooter}>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => openSendModal(item)}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditTemplate(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Message history item
  const renderMessageItem = ({ item }: { item: WhatsAppMessage }) => (
    <View style={styles.messageItem}>
      <View style={styles.messageHeader}>
        <View>
          <Text style={styles.messageRecipient}>{item.recipientName || item.recipientPhone}</Text>
          <Text style={styles.messagePhone}>{item.recipientPhone}</Text>
        </View>
        <Badge
          label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          variant={item.status === 'delivered' ? 'success' : item.status === 'failed' ? 'error' : 'default'}
        />
      </View>
      <Text style={styles.messageContent} numberOfLines={2}>
        {item.message}
      </Text>
      <Text style={styles.messageDate}>{formatDate(item.sentAt || item.createdAt)}</Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading WhatsApp..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>WhatsApp</Text>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => openSendModal()}
        >
          <Text style={styles.sendButtonText}>+ Send</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
          {messageHistory.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'history' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'history' && styles.tabBadgeTextActive]}>
                {messageHistory.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <View style={styles.tabContent}>
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
                message="Create message templates for quick sending"
                actionLabel="Add Template"
                onAction={openAddTemplate}
              />
            }
            ListHeaderComponent={
              <TouchableOpacity style={styles.addTemplateCard} onPress={openAddTemplate}>
                <Text style={styles.addTemplateText}>+ Create New Template</Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <FlatList
          data={messageHistory}
          renderItem={renderMessageItem}
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
              title="No messages"
              message="Your sent messages will appear here"
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
                placeholder="e.g., Order Delivered"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.categoryOptions}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryOption,
                      formData.category === cat.key && styles.categoryOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat.key })}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        formData.category === cat.key && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message Content *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                placeholder="Hi {{customer_name}}, your order #{{order_id}} has been delivered!"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={6}
              />
              <Text style={styles.formHint}>
                Variables: {'{{customer_name}}'}, {'{{order_id}}'}, {'{{amount}}'}, {'{{date}}'}
              </Text>
            </View>

            {editingTemplate && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setTemplateModalVisible(false);
                  setTimeout(() => handleDeleteTemplate(editingTemplate), 100);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete Template</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Send Message Modal */}
      <Modal
        visible={sendModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSendModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSendModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Send Message</Text>
            <TouchableOpacity onPress={handleSendMessage} disabled={sending}>
              <Text style={[styles.modalSave, sending && styles.modalSaveDisabled]}>
                {sending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Recipient Phone *</Text>
              <TextInput
                style={styles.formInput}
                value={sendForm.recipientPhone}
                onChangeText={(text) => setSendForm({ ...sendForm, recipientPhone: text })}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Recipient Name</Text>
              <TextInput
                style={styles.formInput}
                value={sendForm.recipientName}
                onChangeText={(text) => setSendForm({ ...sendForm, recipientName: text })}
                placeholder="Customer name (optional)"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Message *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={sendForm.message}
                onChangeText={(text) => setSendForm({ ...sendForm, message: text })}
                placeholder="Your message..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={8}
              />
            </View>

            {templates.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Or use a template</Text>
                <View style={styles.templateOptions}>
                  {templates.filter((t) => t.isActive).map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[
                        styles.templateOption,
                        sendForm.templateId === template.id && styles.templateOptionActive,
                      ]}
                      onPress={() =>
                        setSendForm({
                          ...sendForm,
                          templateId: template.id,
                          message: template.content,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.templateOptionText,
                          sendForm.templateId === template.id && styles.templateOptionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {template.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
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
  listContent: {
    padding: spacing.base,
    paddingBottom: 100,
  } as ViewStyle,
  addTemplateCard: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
  } as ViewStyle,
  addTemplateText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  } as TextStyle,
  templateCard: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  } as ViewStyle,
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  } as ViewStyle,
  templateName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  templateCategory: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  templateActions: {
    alignItems: 'flex-end',
  } as ViewStyle,
  useCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  } as TextStyle,
  templateContent: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as ViewStyle,
  templatePreview: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  } as TextStyle,
  templateFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  sendButton: {
    flex: 1,
    backgroundColor: colors.success[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  } as ViewStyle,
  sendButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
  } as TextStyle,
  editButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  } as ViewStyle,
  editButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
  } as TextStyle,
  messageItem: {
    backgroundColor: colors.surface.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
  } as ViewStyle,
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  } as ViewStyle,
  messageRecipient: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  } as TextStyle,
  messagePhone: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  } as TextStyle,
  messageContent: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  } as TextStyle,
  messageDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
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
    minHeight: 150,
    textAlignVertical: 'top',
  } as TextStyle,
  formHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  } as TextStyle,
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } as ViewStyle,
  categoryOption: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,
  categoryOptionActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  } as ViewStyle,
  categoryOptionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  } as TextStyle,
  categoryOptionTextActive: {
    color: colors.text.inverse,
  } as TextStyle,
  templateOptions: {
    gap: spacing.sm,
  } as ViewStyle,
  templateOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border.light,
  } as ViewStyle,
  templateOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  } as ViewStyle,
  templateOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  } as TextStyle,
  templateOptionTextActive: {
    color: colors.primary[700],
    fontWeight: typography.fontWeight.medium,
  } as TextStyle,
  deleteButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.error[50],
    marginBottom: spacing['2xl'],
  } as ViewStyle,
  deleteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error[600],
  } as TextStyle,
});
