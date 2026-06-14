/**
 * Dynamic Pricing Screen - Time-based price adjustments
 * Features: View rules, create/edit rules, toggle active/inactive, delete with confirmation
 */

import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignTokens';
import { apiClient } from '@/services/api/client';
import { useStore } from '@/contexts/StoreContext';

// Type definitions
interface IDynamicPricingRule {
  _id: string;
  name: string;
  label: 'peak' | 'off-peak' | 'happy-hour' | 'custom';
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  adjustmentType: 'percent_off' | 'percent_on' | 'fixed_off' | 'fixed_on';
  adjustmentValue: number;
  isActive: boolean;
  serviceIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface CreateRulePayload {
  storeId: string;
  serviceIds?: string[];
  name: string;
  dayOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  adjustmentType: 'percent_off' | 'percent_on' | 'fixed_off' | 'fixed_on';
  adjustmentValue: number;
  label: 'peak' | 'off-peak' | 'happy-hour' | 'custom';
}

// Constants
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LABEL_OPTIONS: { value: 'peak' | 'off-peak' | 'happy-hour' | 'custom'; label: string }[] = [
  { value: 'peak', label: 'Peak Hours' },
  { value: 'off-peak', label: 'Off-Peak' },
  { value: 'happy-hour', label: 'Happy Hour' },
  { value: 'custom', label: 'Custom' },
];

const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  peak: { bg: '#FFEDD5', text: '#B45309' },
  'off-peak': { bg: '#DBEAFE', text: '#1E40AF' },
  'happy-hour': { bg: '#DCFCE7', text: '#166534' },
  custom: { bg: '#F3F4F6', text: '#4B5563' },
};

// Fallback for unknown/unrecognized label values coming from the backend.
const DEFAULT_LABEL_COLOR = { bg: '#F3F4F6', text: '#4B5563' };
const getLabelColor = (label?: string) => (label && LABEL_COLORS[label]) || DEFAULT_LABEL_COLOR;

const ADJUSTMENT_TYPES = [
  { value: 'percent_off' as const, label: '% Off' },
  { value: 'percent_on' as const, label: '% On' },
  { value: 'fixed_off' as const, label: '₹ Off' },
  { value: 'fixed_on' as const, label: '₹ On' },
];

export default function DynamicPricingScreen() {
  const { activeStore } = useStore();
  const queryClient = useQueryClient();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<IDynamicPricingRule | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState<'peak' | 'off-peak' | 'happy-hour' | 'custom'>(
    'custom'
  );
  const [formDays, setFormDays] = useState<number[]>([]);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formAdjustmentType, setFormAdjustmentType] = useState<
    'percent_off' | 'percent_on' | 'fixed_off' | 'fixed_on'
  >('percent_off');
  const [formAdjustmentValue, setFormAdjustmentValue] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const storeId = activeStore?._id || '';

  // Fetch rules
  const {
    data: rulesData,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['dynamic-pricing-rules', storeId],
    queryFn: async () => {
      if (!storeId) return { success: false, data: [] };
      const response = await apiClient.get(`/merchant/dynamic-pricing?storeId=${storeId}`);
      return response;
    },
    enabled: !!storeId,
  });

  const rules = useMemo(() => (rulesData?.data as IDynamicPricingRule[]) || [], [rulesData?.data]);

  // Create rule mutation
  const { mutate: createRule, isPending: isCreating } = useMutation({
    mutationFn: async (payload: CreateRulePayload) => {
      return apiClient.post('/merchant/dynamic-pricing', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules', storeId] });
      resetForm();
      setShowModal(false);
      platformAlertSimple('Success', 'Pricing rule created successfully');
    },
    onError: (error) => {
      platformAlertSimple('Error', error?.message || 'Failed to create pricing rule');
    },
  });

  // Update rule mutation
  const { mutate: updateRule, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: { id: string; data: Partial<IDynamicPricingRule> }) => {
      return apiClient.patch(`/merchant/dynamic-pricing/${payload.id}`, payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules', storeId] });
      resetForm();
      setShowModal(false);
      platformAlertSimple('Success', 'Pricing rule updated successfully');
    },
    onError: (error) => {
      platformAlertSimple('Error', error?.message || 'Failed to update pricing rule');
    },
  });

  // Delete rule mutation
  const { mutate: deleteRule } = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiClient.delete(`/merchant/dynamic-pricing/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules', storeId] });
      platformAlertSimple('Success', 'Pricing rule deleted successfully');
    },
    onError: (error) => {
      platformAlertSimple('Error', error?.message || 'Failed to delete pricing rule');
    },
  });

  // Toggle active status
  const { mutate: toggleActive } = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiClient.patch(`/merchant/dynamic-pricing/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing-rules', storeId] });
    },
    onError: (error) => {
      platformAlertSimple('Error', error?.message || 'Failed to update rule status');
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormLabel('custom');
    setFormDays([]);
    setFormStartTime('09:00');
    setFormEndTime('17:00');
    setFormAdjustmentType('percent_off');
    setFormAdjustmentValue('');
    setEditingRule(null);
  };

  const openEditModal = (rule: IDynamicPricingRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormLabel(rule.label);
    setFormDays(rule.dayOfWeek || []);
    setFormStartTime(rule.startTime || '09:00');
    setFormEndTime(rule.endTime || '17:00');
    setFormAdjustmentType(rule.adjustmentType);
    setFormAdjustmentValue(rule.adjustmentValue.toString());
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSaveRule = () => {
    if (!formName.trim()) {
      platformAlertSimple('Validation', 'Please enter a rule name');
      return;
    }

    if (!formAdjustmentValue) {
      platformAlertSimple('Validation', 'Please enter an adjustment value');
      return;
    }

    const adjustmentValue = parseFloat(formAdjustmentValue);
    if (isNaN(adjustmentValue) || adjustmentValue < 0) {
      platformAlertSimple('Validation', 'Adjustment value must be a positive number');
      return;
    }

    // Percent adjustments must be within 0-100.
    if (
      (formAdjustmentType === 'percent_off' || formAdjustmentType === 'percent_on') &&
      adjustmentValue > 100
    ) {
      platformAlertSimple('Validation', 'Percent adjustment cannot exceed 100%');
      return;
    }

    // Validate time format (HH:MM) if provided.
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (formStartTime && !timeRegex.test(formStartTime)) {
      platformAlertSimple('Validation', 'Start time must be in HH:MM format (e.g. 09:00)');
      return;
    }
    if (formEndTime && !timeRegex.test(formEndTime)) {
      platformAlertSimple('Validation', 'End time must be in HH:MM format (e.g. 17:00)');
      return;
    }

    // Guard: make sure a store is selected before sending.
    if (!storeId) {
      platformAlertSimple('Validation', 'Please select a store before creating a pricing rule');
      return;
    }

    const payload: CreateRulePayload = {
      storeId,
      name: formName,
      label: formLabel,
      dayOfWeek: formDays.length > 0 ? formDays : undefined,
      startTime: formStartTime || undefined,
      endTime: formEndTime || undefined,
      adjustmentType: formAdjustmentType,
      adjustmentValue: adjustmentValue,
    };

    if (editingRule) {
      updateRule({ id: editingRule._id, data: payload });
    } else {
      createRule(payload);
    }
  };

  const handleDeleteRule = (rule: IDynamicPricingRule) => {
    platformAlertDestructive('Delete Rule', `Are you sure you want to delete "${rule.name}"?`, () =>
      deleteRule(rule._id)
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Generate preview text
  const getPreviewText = () => {
    if (!formName) return 'Preview will appear here';

    let adjustment = '';
    if (formAdjustmentType === 'percent_off') {
      adjustment = `${formAdjustmentValue}% cheaper`;
    } else if (formAdjustmentType === 'percent_on') {
      adjustment = `${formAdjustmentValue}% more expensive`;
    } else if (formAdjustmentType === 'fixed_off') {
      adjustment = `₹${formAdjustmentValue} cheaper`;
    } else {
      adjustment = `₹${formAdjustmentValue} more expensive`;
    }

    let days = '';
    if (formDays.length > 0) {
      const dayNames = formDays.map((d) => DAYS[d]).join('–');
      days = dayNames;
    } else {
      days = 'every day';
    }

    const timeRange = formStartTime && formEndTime ? `${formStartTime}–${formEndTime}` : '';

    return `Items will be ${adjustment} on ${days}${timeRange ? ` ${timeRange}` : ''}`;
  };

  const formatDayRange = (days: number[]) => {
    if (days.length === 0) return 'All Days';
    if (days.length === 7) return 'All Days';
    if (
      days.length === 5 &&
      days.includes(1) &&
      days.includes(5) &&
      !days.includes(0) &&
      !days.includes(6)
    ) {
      return 'Mon–Fri';
    }
    return days.map((d) => DAYS[d]).join(', ');
  };

  const getAdjustmentBadge = (rule: IDynamicPricingRule) => {
    let symbol = '';
    if (rule.adjustmentType === 'percent_off' || rule.adjustmentType === 'percent_on') {
      symbol = `${rule.adjustmentValue}%`;
    } else {
      symbol = `₹${rule.adjustmentValue}`;
    }

    const sign = rule.adjustmentType.includes('off') ? '−' : '+';
    return `${sign}${symbol}`;
  };

  if (!storeId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="storefront-outline" size={56} color={Colors.gray[400]} />
          <ThemedText style={[styles.loadingText, { marginTop: Spacing.base }]}>
            Please select a store to manage pricing rules
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <ThemedText style={styles.loadingText}>Loading pricing rules...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.gray[400]} />
          <ThemedText
            style={[styles.loadingText, { marginTop: Spacing.base, textAlign: 'center' }]}
          >
            {(queryError as unknown as { message?: string })?.message || 'Failed to load pricing rules.'}
          </ThemedText>
          <TouchableOpacity
            style={[styles.emptyButton, { marginTop: Spacing.base }]}
            onPress={() => refetch()}
          >
            <ThemedText style={styles.emptyButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[Colors.primary[500], Colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <ThemedText style={styles.headerTitle}>Dynamic Pricing</ThemedText>
            <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.headerSubtitle}>
            Create time-based price rules to boost sales during peak hours
          </ThemedText>
        </View>
      </LinearGradient>

      {/* Rules List */}
      {rules.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
            />
          }
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="pricetag-outline" size={48} color={Colors.gray[400]} />
            </View>
            <ThemedText style={styles.emptyTitle}>No pricing rules yet</ThemedText>
            <ThemedText style={styles.emptyText}>
              Add your first rule to boost sales during peak hours
            </ThemedText>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <ThemedText style={styles.emptyButtonText}>Create First Rule</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.rulesContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary[500]]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {rules.map((rule) => (
            <View key={rule._id} style={styles.ruleCard}>
              <View style={styles.ruleCardTop}>
                <View style={styles.ruleInfo}>
                  <View style={styles.ruleHeader}>
                    <ThemedText style={styles.ruleName}>{rule.name}</ThemedText>
                    <View
                      style={[styles.labelBadge, { backgroundColor: getLabelColor(rule.label).bg }]}
                    >
                      <ThemedText
                        style={[styles.labelBadgeText, { color: getLabelColor(rule.label).text }]}
                      >
                        {LABEL_OPTIONS.find((o) => o.value === rule.label)?.label ||
                          rule.label ||
                          'Rule'}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.ruleDetails}>
                    <View style={styles.detail}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.gray[500]} />
                      <ThemedText style={styles.detailText}>
                        {formatDayRange(rule.dayOfWeek || [])}
                      </ThemedText>
                    </View>
                    {rule.startTime && rule.endTime && (
                      <View style={styles.detail}>
                        <Ionicons name="time-outline" size={14} color={Colors.gray[500]} />
                        <ThemedText style={styles.detailText}>
                          {rule.startTime} – {rule.endTime}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.ruleActions}>
                  <View style={styles.adjustmentBadge}>
                    <ThemedText style={styles.adjustmentText}>
                      {getAdjustmentBadge(rule)}
                    </ThemedText>
                  </View>

                  <Switch
                    value={rule.isActive}
                    onValueChange={(newValue) => toggleActive({ id: rule._id, isActive: newValue })}
                    trackColor={{ false: Colors.gray[300], true: Colors.success[300] }}
                    thumbColor={rule.isActive ? Colors.success[500] : Colors.gray[400]}
                  />
                </View>
              </View>

              <View style={styles.ruleCardBottom}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(rule)}>
                  <Ionicons name="pencil" size={16} color={Colors.primary[500]} />
                  <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteRule(rule)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error[500]} />
                  <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={styles.footerSpacer} />
        </ScrollView>
      )}

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {editingRule ? 'Edit Pricing Rule' : 'Create Pricing Rule'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBodyContent}
            >
              {/* Name Input */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Rule Name</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Weekend Discount"
                  value={formName}
                  onChangeText={setFormName}
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>

              {/* Label Dropdown */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Label</ThemedText>
                <View style={styles.labelDropdown}>
                  {LABEL_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.labelOption,
                        formLabel === option.value && styles.labelOptionActive,
                      ]}
                      onPress={() => setFormLabel(option.value)}
                    >
                      <ThemedText
                        style={[
                          styles.labelOptionText,
                          formLabel === option.value && styles.labelOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day Picker */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Days</ThemedText>
                <View style={styles.dayGrid}>
                  {DAYS.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dayButton, formDays.includes(index) && styles.dayButtonActive]}
                      onPress={() => {
                        if (formDays.includes(index)) {
                          setFormDays(formDays.filter((d) => d !== index));
                        } else {
                          setFormDays([...formDays, index]);
                        }
                      }}
                    >
                      <ThemedText
                        style={[styles.dayText, formDays.includes(index) && styles.dayTextActive]}
                      >
                        {day}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Inputs */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText style={styles.formLabel}>Start Time</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="09:00"
                    value={formStartTime}
                    onChangeText={setFormStartTime}
                    placeholderTextColor={Colors.gray[400]}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <ThemedText style={styles.formLabel}>End Time</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    placeholder="17:00"
                    value={formEndTime}
                    onChangeText={setFormEndTime}
                    placeholderTextColor={Colors.gray[400]}
                  />
                </View>
              </View>

              {/* Adjustment Type */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Adjustment Type</ThemedText>
                <View style={styles.adjustmentTypeGrid}>
                  {ADJUSTMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.adjustmentTypeButton,
                        formAdjustmentType === type.value && styles.adjustmentTypeButtonActive,
                      ]}
                      onPress={() => setFormAdjustmentType(type.value)}
                    >
                      <ThemedText
                        style={[
                          styles.adjustmentTypeText,
                          formAdjustmentType === type.value && styles.adjustmentTypeTextActive,
                        ]}
                      >
                        {type.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Adjustment Value */}
              <View style={styles.formGroup}>
                <ThemedText style={styles.formLabel}>Adjustment Value</ThemedText>
                <TextInput
                  style={styles.textInput}
                  placeholder="20"
                  value={formAdjustmentValue}
                  onChangeText={setFormAdjustmentValue}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.gray[400]}
                />
              </View>

              {/* Preview */}
              <View style={styles.previewBox}>
                <Ionicons name="information-circle" size={16} color={Colors.primary[500]} />
                <ThemedText style={styles.previewText}>{getPreviewText()}</ThemedText>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowModal(false)}>
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveRule}
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>
                    {editingRule ? 'Update' : 'Create'} Rule
                  </ThemedText>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  // Header
  headerGradient: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  headerContent: {
    gap: Spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: Typography.fontWeight.normal,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    maxWidth: 280,
  },
  emptyButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },

  // Rules Container
  rulesContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.base,
  },

  // Rule Card
  ruleCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  ruleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  ruleInfo: {
    flex: 1,
    marginRight: Spacing.base,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  ruleName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  labelBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
  },
  labelBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },
  ruleDetails: {
    gap: Spacing.xs,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  ruleActions: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  adjustmentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  adjustmentText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[600],
  },

  // Rule Card Bottom
  ruleCardBottom: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.base,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary[500],
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.error[500],
  },

  footerSpacer: {
    height: Spacing.base,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },

  // Form Groups
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    backgroundColor: Colors.background.primary,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },

  // Label Dropdown
  labelDropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  labelOption: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    flex: 0,
  },
  labelOptionActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  labelOptionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  labelOptionTextActive: {
    color: Colors.text.inverse,
  },

  // Day Grid
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayButton: {
    width: '14%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
  },
  dayButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  dayText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  dayTextActive: {
    color: Colors.text.inverse,
  },

  // Adjustment Type Grid
  adjustmentTypeGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  adjustmentTypeButton: {
    flex: 1,
    paddingVertical: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustmentTypeButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  adjustmentTypeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  adjustmentTypeTextActive: {
    color: Colors.text.inverse,
  },

  // Preview Box
  previewBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.sm,
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  previewText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[800],
    fontWeight: Typography.fontWeight.normal,
    flex: 1,
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },
});
