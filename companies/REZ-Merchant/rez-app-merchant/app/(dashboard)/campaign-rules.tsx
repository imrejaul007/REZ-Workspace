import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import {
  CAMPAIGN_DEFAULT_COINS,
  CAMPAIGN_VIP_SPEND_MILESTONE,
  CAMPAIGN_WINBACK_DAYS,
  CAMPAIGN_WINBACK_COOLDOWN_DAYS,
  CAMPAIGN_BIRTHDAY_COOLDOWN_DAYS,
  CAMPAIGN_LOYALTY_VISIT_MILESTONE,
} from '@/constants/merchantConstants';
import { logger } from '@/utils/logger';

type TriggerType =
  | 'days_since_visit'
  | 'birthday'
  | 'spend_milestone'
  | 'visit_count'
  | 'first_visit';
type ActionType = 'coin_drop' | 'push' | 'sms';

interface CampaignRule {
  _id: string;
  name: string;
  trigger: { type: TriggerType; params: Record<string, unknown> };
  action: { type: ActionType; params: Record<string, unknown> };
  cooldownDays: number;
  isActive: boolean;
  firedCount?: number;
  usersReached?: number;
  totalCoinsIssued?: number;
  lastFiredAt?: string;
}

interface FormState {
  name: string;
  triggerType: TriggerType | null;
  triggerParams: Record<string, string>;
  actionType: ActionType | null;
  actionParams: Record<string, string>;
  cooldownDays: string;
}

// A-04: Campaign Templates
interface CampaignTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  config: {
    trigger: { type: TriggerType; value?: number };
    action: { type: ActionType; coinAmount?: number; message?: string };
    cooldownDays: number;
  };
  impact: string;
  color: string;
}

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'winback',
    name: 'Win-Back Lapsed Customers',
    icon: '🔄',
    description: `Send ${CAMPAIGN_DEFAULT_COINS.winBack} coins to customers who haven't visited in ${CAMPAIGN_WINBACK_DAYS} days`,
    config: {
      trigger: { type: 'days_since_visit', value: CAMPAIGN_WINBACK_DAYS },
      action: {
        type: 'coin_drop',
        coinAmount: CAMPAIGN_DEFAULT_COINS.winBack,
        message: `We miss you! Here's ${CAMPAIGN_DEFAULT_COINS.winBack} coins for your next visit.`,
      },
      cooldownDays: CAMPAIGN_WINBACK_COOLDOWN_DAYS,
    },
    impact: '~25% of lapsed customers return within 7 days',
    color: Colors.light.error,
  },
  {
    id: 'birthday',
    name: 'Birthday Bonus',
    icon: '🎂',
    description: `Auto-send ${CAMPAIGN_DEFAULT_COINS.birthday} coins on customer's birthday`,
    config: {
      trigger: { type: 'birthday' },
      action: {
        type: 'coin_drop',
        coinAmount: CAMPAIGN_DEFAULT_COINS.birthday,
        message: `Happy Birthday! ${CAMPAIGN_DEFAULT_COINS.birthday} coins just for you 🎉`,
      },
      cooldownDays: CAMPAIGN_BIRTHDAY_COOLDOWN_DAYS,
    },
    impact: 'Birthday visitors spend 2.4× more than regular visits',
    color: Colors.light.warning,
  },
  {
    id: 'first_visit',
    name: 'First Visit Welcome',
    icon: '👋',
    description: `Welcome new customers with ${CAMPAIGN_DEFAULT_COINS.firstVisit} coins`,
    config: {
      trigger: { type: 'first_visit' },
      action: {
        type: 'coin_drop',
        coinAmount: CAMPAIGN_DEFAULT_COINS.firstVisit,
        message: `Welcome! You've earned ${CAMPAIGN_DEFAULT_COINS.firstVisit} REZ coins on your first visit.`,
      },
      cooldownDays: 999,
    },
    impact: 'Customers who earn coins on first visit are 3× more likely to return',
    color: Colors.light.success,
  },
  {
    id: 'vip',
    name: 'VIP Milestone',
    icon: '👑',
    description: `Reward customers who cross ₹${CAMPAIGN_VIP_SPEND_MILESTONE.toLocaleString()} lifetime spend`,
    config: {
      trigger: { type: 'spend_milestone', value: CAMPAIGN_VIP_SPEND_MILESTONE },
      action: {
        type: 'coin_drop',
        coinAmount: CAMPAIGN_DEFAULT_COINS.vipMilestone,
        message: `You're a VIP! ${CAMPAIGN_DEFAULT_COINS.vipMilestone} bonus coins for being a top customer.`,
      },
      cooldownDays: 999,
    },
    impact: 'VIP-tagged customers spend 68% more in next 90 days',
    color: Colors.light.primary,
  },
  {
    id: 'loyal',
    name: `Loyalty Milestone (${CAMPAIGN_LOYALTY_VISIT_MILESTONE} visits)`,
    icon: '🏆',
    description: `Celebrate ${CAMPAIGN_LOYALTY_VISIT_MILESTONE}th visit with a bonus coin drop`,
    config: {
      trigger: { type: 'visit_count', value: CAMPAIGN_LOYALTY_VISIT_MILESTONE },
      action: {
        type: 'coin_drop',
        coinAmount: CAMPAIGN_DEFAULT_COINS.loyaltyMilestone10Visits,
        message: `Your ${CAMPAIGN_LOYALTY_VISIT_MILESTONE}th visit! Here's a loyalty bonus of ${CAMPAIGN_DEFAULT_COINS.loyaltyMilestone10Visits} coins.`,
      },
      cooldownDays: 999,
    },
    impact: 'Reinforces habit loop at the most critical retention point',
    color: Colors.light.primaryLight,
  },
];

const TRIGGER_TYPES: { type: TriggerType; label: string }[] = [
  { type: 'days_since_visit', label: 'Days Since Visit' },
  { type: 'birthday', label: 'Birthday' },
  { type: 'spend_milestone', label: 'Spend Milestone' },
  { type: 'visit_count', label: 'Visit Count' },
  { type: 'first_visit', label: 'First Visit' },
];

const ACTION_TYPES: { type: ActionType; label: string }[] = [
  { type: 'coin_drop', label: 'Coin Drop' },
  { type: 'push', label: 'Push Notification' },
  { type: 'sms', label: 'SMS' },
];

export default function CampaignRulesScreen() {
  const [rules, setRules] = useState<CampaignRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '',
    triggerType: null,
    triggerParams: {},
    actionType: null,
    actionParams: {},
    cooldownDays: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRules = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setIsLoading(true);
      const response = await apiClient.get('/merchant/campaign-rules');
      if (response.success && response.data) {
        // Backend returns { items, pagination } — extract items array
        const items = Array.isArray(response.data)
          ? response.data
          : ((response.data as unknown as { items?: unknown[] }).items ?? []);
        setRules(items);
      } else {
        showAlert('Error', response.message || 'Failed to load campaign rules');
      }
    } catch (error) {
      if (__DEV__) console.error('Error fetching campaign rules:', error);
      showAlert('Error', error?.message || 'Failed to load campaign rules');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleRefresh = () => {
    fetchRules(true);
  };

  // A-04: Create rule from template
  const handleCreateFromTemplate = useCallback(
    async (template: CampaignTemplate) => {
      try {
        setIsSubmitting(true);
        const payload = {
          name: template.name,
          trigger: {
            type: template.config.trigger.type,
            params: template.config.trigger.value ? { value: template.config.trigger.value } : {},
          },
          action: {
            type: template.config.action.type,
            params: template.config.action.coinAmount
              ? {
                  coins: template.config.action.coinAmount,
                  message: template.config.action.message,
                }
              : {},
          },
          cooldownDays: template.config.cooldownDays,
        };
        const response = await apiClient.post('/merchant/campaign-rules', payload);
        if (response.success) {
          showAlert('Success', `Campaign "${template.name}" created successfully!`);
          await fetchRules(false);
        } else {
          showAlert('Error', response.message || 'Failed to create rule');
        }
      } catch (error) {
        if (__DEV__) console.error('Error creating rule from template:', error);
        showAlert('Error', error?.message || 'Failed to create rule');
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchRules]
  );

  const handleAddRule = useCallback(async () => {
    if (!form.name.trim()) {
      showAlert('Validation', 'Please enter a rule name');
      return;
    }
    if (!form.triggerType) {
      showAlert('Validation', 'Please select a trigger type');
      return;
    }
    if (!form.actionType) {
      showAlert('Validation', 'Please select an action type');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        trigger: { type: form.triggerType, params: form.triggerParams },
        action: { type: form.actionType, params: form.actionParams },
        cooldownDays: parseInt(form.cooldownDays) || 0,
      };
      const response = await apiClient.post('/merchant/campaign-rules', payload);
      if (response.success) {
        showAlert('Success', 'Campaign rule created successfully');
        resetForm();
        setShowAddModal(false);
        await fetchRules(false);
      } else {
        showAlert('Error', response.message || 'Failed to create rule');
      }
    } catch (error) {
      if (__DEV__) console.error('Error creating campaign rule:', error);
      showAlert('Error', error?.message || 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, fetchRules]);

  const handleToggleRule = useCallback(
    async (ruleId: string, newActive: boolean) => {
      try {
        const response = await apiClient.put(`/merchant/campaign-rules/${ruleId}`, {
          isActive: newActive,
        });
        if (response.success) {
          await fetchRules(false);
        } else {
          showAlert('Error', 'Failed to update rule');
        }
      } catch (error) {
        if (__DEV__) console.error('Error toggling rule:', error);
        showAlert('Error', 'Failed to update rule');
      }
    },
    [fetchRules]
  );

  const handleDeleteRule = useCallback(
    async (ruleId: string) => {
      showAlert('Confirm', 'Delete this rule?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete(`/merchant/campaign-rules/${ruleId}`);
              if (response.success) {
                await fetchRules(false);
                showAlert('Success', 'Rule deleted successfully');
              } else {
                showAlert('Error', 'Failed to delete rule');
              }
            } catch (error) {
              if (__DEV__) console.error('Error deleting rule:', error);
              showAlert('Error', 'Failed to delete rule');
            }
          },
        },
      ]);
    },
    [fetchRules]
  );

  const resetForm = () => {
    setForm({
      name: '',
      triggerType: null,
      triggerParams: {},
      actionType: null,
      actionParams: {},
      cooldownDays: '0',
    });
  };

  const getTriggerDescription = (rule: CampaignRule): string => {
    const trigger = rule.trigger;
    switch (trigger.type) {
      case 'days_since_visit':
        return `After ${trigger.params.days} days of no visit`;
      case 'birthday':
        return 'On customer birthday';
      case 'spend_milestone':
        return `When customer spends ₹${trigger.params.amount}`;
      case 'visit_count':
        return `After ${trigger.params.count} visits`;
      case 'first_visit':
        return 'On first visit';
      default:
        return 'Unknown trigger';
    }
  };

  const getActionDescription = (rule: CampaignRule): string => {
    const action = rule.action;
    switch (action.type) {
      case 'coin_drop':
        return `Drop ${action.params.coins} coins`;
      case 'push':
        return `Push: "${action.params.title}"`;
      case 'sms':
        return `SMS: "${action.params.message}"`;
      default:
        return 'Unknown action';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <ThemedText style={styles.loadingText}>Loading campaign rules...</ThemedText>
      </ThemedView>
    );
  }

  const renderRuleRow = ({ item }: { item: CampaignRule }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleHeader}>
        <View style={styles.ruleTitle}>
          <ThemedText style={styles.ruleName}>{item.name}</ThemedText>
          {item.cooldownDays > 0 && (
            <ThemedText style={styles.cooldownBadge}>{item.cooldownDays}d cooldown</ThemedText>
          )}
        </View>
        <Switch
          value={item.isActive}
          onValueChange={(value) => handleToggleRule(item._id, value)}
          trackColor={{ false: Colors.light.icon, true: Colors.light.success }}
          thumbColor={item.isActive ? Colors.light.success : Colors.light.icon}
        />
      </View>

      <View style={styles.ruleContent}>
        <View style={styles.triggerBox}>
          <Ionicons name="flash" size={16} color={Colors.light.warning} />
          <ThemedText style={styles.ruleDescription}>{getTriggerDescription(item)}</ThemedText>
        </View>
        <View style={styles.arrowContainer}>
          <Ionicons name="arrow-down" size={16} color={Colors.light.icon} />
        </View>
        <View style={styles.actionBox}>
          <Ionicons name="send" size={16} color={Colors.light.success} />
          <ThemedText style={styles.ruleDescription}>{getActionDescription(item)}</ThemedText>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{item.firedCount || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Fired</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{item.usersReached || 0}</ThemedText>
          <ThemedText style={styles.statLabel}>Users</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>
            {item.totalCoinsIssued ? `${item.totalCoinsIssued}` : '0'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Coins sent</ThemedText>
        </View>
        {item.lastFiredAt && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>
                {new Date(item.lastFiredAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Last fired</ThemedText>
            </View>
          </>
        )}
      </View>

      <View style={styles.ruleActions}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRule(item._id)}>
          <Ionicons name="trash-outline" size={16} color={Colors.light.error} />
          <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Campaign Rules</ThemedText>
      </View>

      {/* A-04: Templates Section */}
      <View style={styles.templatesSection}>
        <ThemedText style={styles.templatesTitle}>Quick Templates</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.templatesScroll}
        >
          {CAMPAIGN_TEMPLATES.map((template) => (
            <View
              key={template.id}
              style={[styles.templateCard, { borderLeftColor: template.color }]}
            >
              <Text style={styles.templateIcon}>{template.icon}</Text>
              <ThemedText style={styles.templateName}>{template.name}</ThemedText>
              <ThemedText style={styles.templateDesc} numberOfLines={2}>
                {template.description}
              </ThemedText>
              <ThemedText style={styles.templateImpact} numberOfLines={1}>
                📊 {template.impact}
              </ThemedText>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => handleCreateFromTemplate(template)}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.templateButtonText}>Use Template</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={rules.length === 0 ? { flex: 1 } : undefined}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {rules.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="sparkles" size={64} color={Colors.light.icon} />
            <ThemedText style={styles.emptyStateTitle}>No campaign rules yet</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Create automated campaigns to engage customers based on their behavior
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {rules.map((item) => (
              <View key={item._id}>{renderRuleRow({ item })}</View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Ionicons name="add" size={32} color={Colors.light.card} />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create Rule</ThemedText>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Rule Name</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Win back inactive users"
                  placeholderTextColor={Colors.light.icon}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Trigger Type</ThemedText>
                <View style={styles.pickerContainer}>
                  {TRIGGER_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.pickerItem,
                        form.triggerType === item.type && styles.pickerItemActive,
                      ]}
                      onPress={() =>
                        setForm({ ...form, triggerType: item.type, triggerParams: {} })
                      }
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          form.triggerType === item.type && styles.pickerItemTextActive,
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {form.triggerType === 'days_since_visit' && (
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Days Since Last Visit</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 30"
                    placeholderTextColor={Colors.light.icon}
                    keyboardType="number-pad"
                    value={form.triggerParams.days || ''}
                    onChangeText={(text) =>
                      setForm({ ...form, triggerParams: { ...form.triggerParams, days: text } })
                    }
                    editable={!isSubmitting}
                  />
                </View>
              )}

              {form.triggerType === 'spend_milestone' && (
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Amount (₹)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 1000"
                    placeholderTextColor={Colors.light.icon}
                    keyboardType="decimal-pad"
                    value={form.triggerParams.amount || ''}
                    onChangeText={(text) =>
                      setForm({ ...form, triggerParams: { ...form.triggerParams, amount: text } })
                    }
                    editable={!isSubmitting}
                  />
                </View>
              )}

              {form.triggerType === 'visit_count' && (
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Number of Visits</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 5"
                    placeholderTextColor={Colors.light.icon}
                    keyboardType="number-pad"
                    value={form.triggerParams.count || ''}
                    onChangeText={(text) =>
                      setForm({ ...form, triggerParams: { ...form.triggerParams, count: text } })
                    }
                    editable={!isSubmitting}
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Action Type</ThemedText>
                <View style={styles.pickerContainer}>
                  {ACTION_TYPES.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.pickerItem,
                        form.actionType === item.type && styles.pickerItemActive,
                      ]}
                      onPress={() => setForm({ ...form, actionType: item.type, actionParams: {} })}
                    >
                      <ThemedText
                        style={[
                          styles.pickerItemText,
                          form.actionType === item.type && styles.pickerItemTextActive,
                        ]}
                      >
                        {item.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {form.actionType === 'coin_drop' && (
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>Number of Coins</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 100"
                    placeholderTextColor={Colors.light.icon}
                    keyboardType="number-pad"
                    value={form.actionParams.coins || ''}
                    onChangeText={(text) =>
                      setForm({ ...form, actionParams: { ...form.actionParams, coins: text } })
                    }
                    editable={!isSubmitting}
                  />
                </View>
              )}

              {form.actionType === 'push' && (
                <>
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Title</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Special Offer!"
                      placeholderTextColor={Colors.light.icon}
                      value={form.actionParams.title || ''}
                      onChangeText={(text) =>
                        setForm({ ...form, actionParams: { ...form.actionParams, title: text } })
                      }
                      editable={!isSubmitting}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.label}>Message</ThemedText>
                    <TextInput
                      style={[styles.input, styles.textareaInput]}
                      placeholder="Notification message"
                      placeholderTextColor={Colors.light.icon}
                      multiline
                      numberOfLines={3}
                      value={form.actionParams.body || ''}
                      onChangeText={(text) =>
                        setForm({ ...form, actionParams: { ...form.actionParams, body: text } })
                      }
                      editable={!isSubmitting}
                    />
                  </View>
                </>
              )}

              {form.actionType === 'sms' && (
                <View style={styles.formGroup}>
                  <ThemedText style={styles.label}>SMS Message</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textareaInput]}
                    placeholder="SMS message text"
                    placeholderTextColor={Colors.light.icon}
                    multiline
                    numberOfLines={3}
                    value={form.actionParams.message || ''}
                    onChangeText={(text) =>
                      setForm({ ...form, actionParams: { ...form.actionParams, message: text } })
                    }
                    editable={!isSubmitting}
                  />
                </View>
              )}

              <View style={styles.formGroup}>
                <ThemedText style={styles.label}>Cooldown Days (optional)</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 7 (min days before rule triggers again)"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="number-pad"
                  value={form.cooldownDays}
                  onChangeText={(text) => setForm({ ...form, cooldownDays: text })}
                  editable={!isSubmitting}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <ThemedText style={styles.buttonCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSubmit]}
                onPress={handleAddRule}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.light.card} />
                ) : (
                  <ThemedText style={styles.buttonSubmitText}>Create Rule</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: Colors.light.tint },
  headerTitle: { fontSize: 24, fontWeight: '600', color: Colors.light.card },
  templatesSection: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: Colors.light.text,
  },
  templatesScroll: { paddingHorizontal: 16, gap: 12, paddingRight: 32 },
  templateCard: {
    width: 180,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    marginRight: 4,
  },
  templateIcon: { fontSize: 28, marginBottom: 6 },
  templateName: { fontSize: 13, fontWeight: '700', marginBottom: 6, color: Colors.light.text },
  templateDesc: { fontSize: 11, color: Colors.light.icon, marginBottom: 6, lineHeight: 14 },
  templateImpact: { fontSize: 10, color: Colors.light.icon, marginBottom: 10, fontStyle: 'italic' },
  templateButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  templateButtonText: { fontSize: 12, fontWeight: '700', color: Colors.light.card },
  list: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 100 },
  ruleCard: {
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleTitle: { flex: 1 },
  ruleName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cooldownBadge: {
    fontSize: 11,
    color: Colors.light.icon,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.light.background,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  ruleContent: { marginBottom: 12 },
  triggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: `${Colors.light.warning}15`,
    borderRadius: 6,
    marginBottom: 8,
  },
  arrowContainer: { alignItems: 'center', marginVertical: 4 },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: `${Colors.light.success}15`,
    borderRadius: 6,
  },
  ruleDescription: { fontSize: 13, marginLeft: 8, flex: 1 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  statLabel: { fontSize: 11, marginTop: 2, color: Colors.light.icon },
  statDivider: { width: 1, backgroundColor: Colors.light.border },
  ruleActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${Colors.light.error}30`,
  },
  deleteButtonText: { marginLeft: 4, fontSize: 12, color: Colors.light.error, fontWeight: '500' },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: Colors.light.icon, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  formScroll: { maxHeight: '60%', marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.card,
  },
  textareaInput: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerItem: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    backgroundColor: Colors.light.card,
  },
  pickerItemActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  pickerItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  pickerItemTextActive: { color: Colors.light.card },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonCancelText: { color: Colors.light.text, fontWeight: '600' },
  buttonSubmit: { backgroundColor: Colors.light.tint },
  buttonSubmitText: { color: Colors.light.card, fontWeight: '600' },
});
