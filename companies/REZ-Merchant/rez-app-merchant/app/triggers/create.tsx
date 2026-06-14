/**
 * Create Trigger Rule Screen
 *
 * Form for creating a new trigger rule with conditions and actions.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { showAlert } from '@/utils/alert';
import { Colors } from '@/constants/Colors';
import { useCreateRule } from './hooks';
import {
  TriggerType,
  TriggerStatus,
  ActionType,
  TriggerCondition,
  TriggerAction,
  CreateRuleData,
  InactivityCondition,
  LocationCondition,
  BirthdayCondition,
  FirstVisitCondition,
  LoyaltyCondition,
} from './types';

const ACCENT = Colors.light.primary;

const TRIGGER_TYPES: {
  type: TriggerType;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    type: 'inactivity',
    label: 'Inactivity',
    description: 'Trigger when customer is inactive for a period',
    icon: 'time-outline',
    color: '#8B5CF6',
  },
  {
    type: 'location',
    label: 'Location',
    description: 'Trigger based on customer location',
    icon: 'location-outline',
    color: '#3B82F6',
  },
  {
    type: 'birthday',
    label: 'Birthday',
    description: 'Trigger on customer birthday',
    icon: 'gift-outline',
    color: '#EC4899',
  },
  {
    type: 'first_visit',
    label: 'First Visit',
    description: 'Trigger on first customer visit',
    icon: 'footsteps-outline',
    color: '#10B981',
  },
  {
    type: 'loyalty_milestone',
    label: 'Loyalty Milestone',
    description: 'Trigger on loyalty milestones',
    icon: 'star-outline',
    color: '#F59E0B',
  },
];

const ACTION_TYPES: {
  type: ActionType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { type: 'push', label: 'Push Notification', icon: 'notifications-outline', color: '#3B82F6' },
  { type: 'sms', label: 'SMS', icon: 'chatbubbles-outline', color: '#10B981' },
  { type: 'email', label: 'Email', icon: 'mail-outline', color: '#8B5CF6' },
  { type: 'in_app', label: 'In-App Message', icon: 'alert-circle-outline', color: '#F59E0B' },
];

interface ConditionEditorProps {
  condition: TriggerCondition;
  onUpdate: (condition: TriggerCondition) => void;
  onRemove: () => void;
  type: TriggerType;
}

function ConditionEditor({ condition, onUpdate, onRemove, type }: ConditionEditorProps) {
  const renderTypeSpecificFields = () => {
    switch (type) {
      case 'inactivity':
        const inactCond = condition as InactivityCondition;
        return (
          <View style={styles.conditionField}>
            <Text style={styles.fieldLabel}>Days of Inactivity</Text>
            <TextInput
              style={styles.input}
              value={String(inactCond.days)}
              onChangeText={(text) =>
                onUpdate({ ...condition, days: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="e.g. 30"
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>
        );

      case 'location':
        const locCond = condition as LocationCondition;
        return (
          <>
            <View style={styles.conditionField}>
              <Text style={styles.fieldLabel}>Location Type</Text>
              <View style={styles.chipRow}>
                {(['enter', 'exit', 'nearby'] as const).map((locType) => (
                  <TouchableOpacity
                    key={locType}
                    style={[
                      styles.chip,
                      locCond.locationType === locType && styles.chipActive,
                    ]}
                    onPress={() => onUpdate({ ...locCond, locationType: locType })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        locCond.locationType === locType && styles.chipTextActive,
                      ]}
                    >
                      {locType.charAt(0).toUpperCase() + locType.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.conditionRow}>
              <View style={[styles.conditionField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Latitude</Text>
                <TextInput
                  style={styles.input}
                  value={String(locCond.latitude)}
                  onChangeText={(text) =>
                    onUpdate({ ...locCond, latitude: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="e.g. 28.6139"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
              <View style={[styles.conditionField, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.fieldLabel}>Longitude</Text>
                <TextInput
                  style={styles.input}
                  value={String(locCond.longitude)}
                  onChangeText={(text) =>
                    onUpdate({ ...locCond, longitude: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="e.g. 77.2090"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
            </View>
            <View style={styles.conditionField}>
              <Text style={styles.fieldLabel}>Radius (meters)</Text>
              <TextInput
                style={styles.input}
                value={String(locCond.radius)}
                onChangeText={(text) =>
                  onUpdate({ ...locCond, radius: parseInt(text) || 0 })
                }
                keyboardType="numeric"
                placeholder="e.g. 1000"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </>
        );

      case 'birthday':
        const birthCond = condition as BirthdayCondition;
        return (
          <>
            <View style={styles.conditionRow}>
              <View style={[styles.conditionField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Days Before</Text>
                <TextInput
                  style={styles.input}
                  value={String(birthCond.daysBefore)}
                  onChangeText={(text) =>
                    onUpdate({ ...birthCond, daysBefore: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="e.g. 7"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
              <View style={[styles.conditionField, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.fieldLabel}>Days After</Text>
                <TextInput
                  style={styles.input}
                  value={String(birthCond.daysAfter)}
                  onChangeText={(text) =>
                    onUpdate({ ...birthCond, daysAfter: parseInt(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="e.g. 1"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
            </View>
          </>
        );

      case 'first_visit':
        const visitCond = condition as FirstVisitCondition;
        return (
          <View style={styles.conditionField}>
            <Text style={styles.fieldLabel}>Within Days of First Visit</Text>
            <TextInput
              style={styles.input}
              value={String(visitCond.withinDays)}
              onChangeText={(text) =>
                onUpdate({ ...visitCond, withinDays: parseInt(text) || 0 })
              }
              keyboardType="numeric"
              placeholder="e.g. 7"
              placeholderTextColor={Colors.light.textMuted}
            />
          </View>
        );

      case 'loyalty_milestone':
        const loyaltyCond = condition as LoyaltyCondition;
        return (
          <>
            <View style={styles.conditionField}>
              <Text style={styles.fieldLabel}>Milestone Type</Text>
              <View style={styles.chipRow}>
                {(['points', 'visits', 'spending'] as const).map((milestoneType) => (
                  <TouchableOpacity
                    key={milestoneType}
                    style={[
                      styles.chip,
                      loyaltyCond.milestoneType === milestoneType && styles.chipActive,
                    ]}
                    onPress={() => onUpdate({ ...loyaltyCond, milestoneType })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        loyaltyCond.milestoneType === milestoneType && styles.chipTextActive,
                      ]}
                    >
                      {milestoneType.charAt(0).toUpperCase() + milestoneType.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.conditionField}>
              <Text style={styles.fieldLabel}>Milestone Value</Text>
              <TextInput
                style={styles.input}
                value={String(loyaltyCond.milestoneValue)}
                onChangeText={(text) =>
                  onUpdate({ ...loyaltyCond, milestoneValue: parseInt(text) || 0 })
                }
                keyboardType="numeric"
                placeholder="e.g. 1000"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.conditionCard}>
      <View style={styles.conditionHeader}>
        <Text style={styles.conditionTitle}>
          {type.charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)} Condition
        </Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={24} color={Colors.light.error} />
        </TouchableOpacity>
      </View>
      {renderTypeSpecificFields()}
    </View>
  );
}

interface ActionEditorProps {
  action: TriggerAction;
  onUpdate: (action: TriggerAction) => void;
  onRemove: () => void;
}

function ActionEditor({ action, onUpdate, onRemove }: ActionEditorProps) {
  const typeConfig = ACTION_TYPES.find((t) => t.type === action.type) || ACTION_TYPES[0];

  const renderTypeSpecificFields = () => {
    switch (action.type) {
      case 'push':
        return (
          <>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={action.title}
                onChangeText={(text) => onUpdate({ ...action, title: text })}
                placeholder="Push notification title"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Body</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={action.body}
                onChangeText={(text) => onUpdate({ ...action, body: text })}
                placeholder="Push notification message"
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Deep Link (optional)</Text>
              <TextInput
                style={styles.input}
                value={action.deepLink || ''}
                onChangeText={(text) => onUpdate({ ...action, deepLink: text })}
                placeholder="e.g. /offers/promo123"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
          </>
        );

      case 'sms':
        return (
          <View style={styles.actionField}>
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={action.message}
              onChangeText={(text) => onUpdate({ ...action, message: text })}
              placeholder="SMS message content"
              placeholderTextColor={Colors.light.textMuted}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.charCount}>{action.message.length} / 160 characters</Text>
          </View>
        );

      case 'email':
        return (
          <>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={action.subject}
                onChangeText={(text) => onUpdate({ ...action, subject: text })}
                placeholder="Email subject line"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Body</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={action.body}
                onChangeText={(text) => onUpdate({ ...action, body: text })}
                placeholder="Email body content"
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={6}
              />
            </View>
          </>
        );

      case 'in_app':
        return (
          <>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={action.title}
                onChangeText={(text) => onUpdate({ ...action, title: text })}
                placeholder="In-app message title"
                placeholderTextColor={Colors.light.textMuted}
              />
            </View>
            <View style={styles.actionField}>
              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={action.message}
                onChangeText={(text) => onUpdate({ ...action, message: text })}
                placeholder="In-app message content"
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Dismissible</Text>
              <Switch
                value={action.dismissible}
                onValueChange={(value) => onUpdate({ ...action, dismissible: value })}
                trackColor={{ false: Colors.light.border, true: ACCENT }}
                thumbColor="#fff"
              />
            </View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHeader}>
        <View style={[styles.actionTypeIcon, { backgroundColor: typeConfig.color + '20' }]}>
          <Ionicons name={typeConfig.icon} size={18} color={typeConfig.color} />
        </View>
        <Text style={styles.actionTypeLabel}>{typeConfig.label}</Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={24} color={Colors.light.error} />
        </TouchableOpacity>
      </View>
      {renderTypeSpecificFields()}
    </View>
  );
}

export default function CreateRuleScreen() {
  const router = useRouter();
  const { createRule, isLoading } = useCreateRule();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('inactivity');
  const [status, setStatus] = useState<TriggerStatus>('draft');
  const [priority, setPriority] = useState('5');
  const [conditions, setConditions] = useState<TriggerCondition[]>([]);
  const [conditionLogic, setConditionLogic] = useState<'and' | 'or'>('and');
  const [actions, setActions] = useState<TriggerAction[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxExecutions, setMaxExecutions] = useState('');
  const [tags, setTags] = useState('');

  // UI state
  const [showActionPicker, setShowActionPicker] = useState(false);

  const handleAddCondition = () => {
    const newCondition = createDefaultCondition(triggerType);
    setConditions([...conditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, condition: TriggerCondition) => {
    const updated = [...conditions];
    updated[index] = condition;
    setConditions(updated);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddAction = (actionType: ActionType) => {
    const newAction = createDefaultAction(actionType);
    setActions([...actions, newAction]);
    setShowActionPicker(false);
  };

  const handleUpdateAction = (index: number, action: TriggerAction) => {
    const updated = [...actions];
    updated[index] = action;
    setActions(updated);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const createDefaultCondition = (type: TriggerType): TriggerCondition => {
    const id = `cond_${Date.now()}`;
    switch (type) {
      case 'inactivity':
        return { id, type: 'inactivity', operator: 'greater_than', days: 30, value: 30 } as InactivityCondition;
      case 'location':
        return {
          id,
          type: 'location',
          operator: 'equals',
          locationType: 'nearby',
          latitude: 0,
          longitude: 0,
          radius: 1000,
          value: '',
        } as LocationCondition;
      case 'birthday':
        return {
          id,
          type: 'birthday',
          operator: 'equals',
          daysBefore: 7,
          daysAfter: 1,
          value: '',
        } as BirthdayCondition;
      case 'first_visit':
        return {
          id,
          type: 'first_visit',
          operator: 'less_than',
          withinDays: 7,
          value: 7,
        } as FirstVisitCondition;
      case 'loyalty_milestone':
        return {
          id,
          type: 'loyalty',
          operator: 'equals',
          milestoneType: 'points',
          milestoneValue: 1000,
          value: 1000,
        } as LoyaltyCondition;
      default:
        return { id, type: 'custom', operator: 'equals', eventName: '', value: '' };
    }
  };

  const createDefaultAction = (type: ActionType): TriggerAction => {
    const id = `action_${Date.now()}`;
    switch (type) {
      case 'push':
        return { id, type: 'push', title: '', body: '' };
      case 'sms':
        return { id, type: 'sms', message: '' };
      case 'email':
        return { id, type: 'email', subject: '', body: '' };
      case 'in_app':
        return { id, type: 'in_app', title: '', message: '', dismissible: true };
      default:
        return { id, type: 'push', title: '', body: '' };
    }
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Rule name is required';
    if (conditions.length === 0) return 'At least one condition is required';
    if (actions.length === 0) return 'At least one action is required';

    for (const condition of conditions) {
      if (condition.type === 'inactivity') {
        if ((condition as InactivityCondition).days <= 0) {
          return 'Inactivity days must be greater than 0';
        }
      }
    }

    for (const action of actions) {
      switch (action.type) {
        case 'push':
          if (!action.title.trim()) return 'Push notification title is required';
          if (!action.body.trim()) return 'Push notification body is required';
          break;
        case 'sms':
          if (!action.message.trim()) return 'SMS message is required';
          break;
        case 'email':
          if (!action.subject.trim()) return 'Email subject is required';
          if (!action.body.trim()) return 'Email body is required';
          break;
        case 'in_app':
          if (!action.title.trim()) return 'In-app message title is required';
          if (!action.message.trim()) return 'In-app message is required';
          break;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      showAlert('Validation Error', error);
      return;
    }

    try {
      const ruleData: CreateRuleData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: triggerType,
        status,
        conditions,
        conditionLogic,
        actions,
        priority: parseInt(priority) || 5,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        maxExecutions: maxExecutions ? parseInt(maxExecutions) : undefined,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
      };

      const newRule = await createRule(ruleData);
      if (newRule) {
        showAlert('Success', 'Trigger rule created successfully');
        router.back();
      }
    } catch (err) {
      showAlert('Error', 'Failed to create trigger rule');
    }
  };

  const selectedTypeConfig = TRIGGER_TYPES.find((t) => t.type === triggerType) || TRIGGER_TYPES[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ACCENT, '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bgGradient}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Rule</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Rule Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Win-back after 30 days"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Brief description of this rule"
                  placeholderTextColor={Colors.light.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.chipRow}>
                  {(['draft', 'active', 'inactive'] as TriggerStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, status === s && styles.chipActive]}
                      onPress={() => setStatus(s)}
                    >
                      <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Priority (1-10)</Text>
                <TextInput
                  style={styles.input}
                  value={priority}
                  onChangeText={setPriority}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
            </View>

            {/* Trigger Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trigger Type</Text>
              <View style={styles.typeGrid}>
                {TRIGGER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.type}
                    style={[
                      styles.typeCard,
                      triggerType === type.type && { borderColor: type.color, borderWidth: 2 },
                    ]}
                    onPress={() => {
                      setTriggerType(type.type);
                      setConditions([]);
                    }}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                      <Ionicons name={type.icon} size={24} color={type.color} />
                    </View>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                    {triggerType === type.type && (
                      <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Conditions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Conditions</Text>
                {conditions.length > 1 && (
                  <View style={styles.logicToggle}>
                    <TouchableOpacity
                      style={[
                        styles.logicBtn,
                        conditionLogic === 'and' && styles.logicBtnActive,
                      ]}
                      onPress={() => setConditionLogic('and')}
                    >
                      <Text
                        style={[
                          styles.logicBtnText,
                          conditionLogic === 'and' && styles.logicBtnTextActive,
                        ]}
                      >
                        AND
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.logicBtn,
                        conditionLogic === 'or' && styles.logicBtnActive,
                      ]}
                      onPress={() => setConditionLogic('or')}
                    >
                      <Text
                        style={[
                          styles.logicBtnText,
                          conditionLogic === 'or' && styles.logicBtnTextActive,
                        ]}
                      >
                        OR
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {conditions.map((condition, index) => (
                <ConditionEditor
                  key={condition.id}
                  condition={condition}
                  onUpdate={(c) => handleUpdateCondition(index, c)}
                  onRemove={() => handleRemoveCondition(index)}
                  type={triggerType}
                />
              ))}

              <TouchableOpacity style={styles.addButton} onPress={handleAddCondition}>
                <Ionicons name="add-circle-outline" size={20} color={ACCENT} />
                <Text style={styles.addButtonText}>Add Condition</Text>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>

              {actions.map((action, index) => (
                <ActionEditor
                  key={action.id}
                  action={action}
                  onUpdate={(a) => handleUpdateAction(index, a)}
                  onRemove={() => handleRemoveAction(index)}
                />
              ))}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowActionPicker(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={ACCENT} />
                <Text style={styles.addButtonText}>Add Action</Text>
              </TouchableOpacity>
            </View>

            {/* Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Start Date (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>End Date (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Max Executions (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={maxExecutions}
                  onChangeText={setMaxExecutions}
                  keyboardType="numeric"
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tags (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="e.g. winback, retention, promotional"
                  placeholderTextColor={Colors.light.textMuted}
                />
              </View>
            </View>

            {/* Submit */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => router.back()}
                disabled={isLoading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[ACCENT, '#9333EA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtnGrad}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Create Rule</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Action Picker Modal */}
      <Modal visible={showActionPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Action</Text>
              <TouchableOpacity onPress={() => setShowActionPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.light.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ACTION_TYPES}
              keyExtractor={(item) => item.type}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.actionTypeItem}
                  onPress={() => handleAddAction(item.type)}
                >
                  <View style={[styles.actionTypeIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.actionTypeLabel}>{item.label}</Text>
                  <Ionicons name="add-circle-outline" size={24} color={ACCENT} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  bgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 200,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textTertiary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  chipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },

  // Type Grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  typeDescription: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  typeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Condition & Action Cards
  conditionCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  conditionField: {
    marginBottom: 12,
  },
  conditionRow: {
    flexDirection: 'row',
  },
  removeBtn: {
    padding: 4,
  },

  actionCard: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTypeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginLeft: 10,
  },
  actionField: {
    marginBottom: 12,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT,
  },

  // Logic Toggle
  logicToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    padding: 2,
  },
  logicBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logicBtnActive: {
    backgroundColor: ACCENT,
  },
  logicBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  logicBtnTextActive: {
    color: '#fff',
  },

  // Switch Row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  submitBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textHeading,
  },
  actionTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
});
