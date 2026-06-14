import React, { useState, useEffect, useCallback } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';

// ── Types ────────────────────────────────────────────────────────────────────

type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'phone';

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options: string[];
  required: boolean;
  placeholder: string;
  order: number;
}

interface FieldTypeOption {
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES: FieldTypeOption[] = [
  { type: 'text', label: 'Short Text', icon: 'text-outline', description: 'Single line answer' },
  {
    type: 'textarea',
    label: 'Long Text',
    icon: 'document-text-outline',
    description: 'Multi-line answer',
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: 'chevron-down-circle-outline',
    description: 'Pick one option',
  },
  {
    type: 'multiselect',
    label: 'Multiple Choice',
    icon: 'checkbox-outline',
    description: 'Pick multiple options',
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: 'checkmark-square-outline',
    description: 'Yes / No toggle',
  },
  { type: 'date', label: 'Date', icon: 'calendar-outline', description: 'Date picker' },
  { type: 'phone', label: 'Phone', icon: 'call-outline', description: 'Phone number' },
];

const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  text: 'text-outline',
  textarea: 'document-text-outline',
  select: 'chevron-down-circle-outline',
  multiselect: 'checkbox-outline',
  checkbox: 'checkmark-square-outline',
  date: 'calendar-outline',
  phone: 'call-outline',
};

function generateId(): string {
  return uuidv4();
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function FormBuilderScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  // Form meta
  const [formName, setFormName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);

  // UI state
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);

  // Add-field modal
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Edit-field sheet
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  // Load existing form
  useEffect(() => {
    if (!isEditing || !id) return;

    const load = async () => {
      try {
        const res = await apiClient.get<any>(`consultation-forms/${id}`);
        const data = res.data ?? res;
        setFormName(data.name || '');
        setDescription(data.description || '');
        setIsDefault(!!data.isDefault);
        setFields(
          (data.fields || []).map((f: any) => ({
            id: f.id || generateId(),
            label: f.label || '',
            type: f.type || 'text',
            options: f.options || [],
            required: !!f.required,
            placeholder: f.placeholder || '',
            order: f.order ?? 0,
          }))
        );
      } catch (err: any) {
        Toast.show({ type: 'error', text1: err?.message || 'Failed to load form' });
        router.back();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEditing]);

  const handleAddFieldType = (type: FieldType) => {
    setShowTypeModal(false);
    const newField: FormField = {
      id: generateId(),
      label: '',
      type,
      options: ['select', 'multiselect'].includes(type) ? ['Option 1'] : [],
      required: false,
      placeholder: '',
      order: fields.length,
    };
    setEditingField(newField);
    setShowFieldEditor(true);
  };

  const handleSaveField = (field: FormField) => {
    setFields((prev) => {
      const exists = prev.find((f) => f.id === field.id);
      if (exists) {
        return prev.map((f) => (f.id === field.id ? field : f));
      }
      return [...prev, { ...field, order: prev.length }];
    });
    setShowFieldEditor(false);
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    Alert.alert('Remove Field', 'Remove this field from the form?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          setFields((prev) =>
            prev.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i }))
          ),
      },
    ]);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= next.length) return prev;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next.map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Toast.show({ type: 'error', text1: 'Form name is required' });
      return;
    }

    const emptyLabel = fields.find((f) => !f.label.trim());
    if (emptyLabel) {
      Toast.show({ type: 'error', text1: 'All fields must have a label' });
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: formName.trim(),
        description: description.trim(),
        fields,
        isDefault,
      };

      if (isEditing && id) {
        await apiClient.put(`consultation-forms/${id}`, body);
        Toast.show({ type: 'success', text1: 'Form updated' });
      } else {
        await apiClient.post('consultation-forms', body);
        Toast.show({ type: 'success', text1: 'Form created' });
      }

      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err?.message || 'Failed to save form' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>

        {editingName ? (
          <TextInput
            style={styles.nameInput}
            value={formName}
            onChangeText={setFormName}
            onBlur={() => setEditingName(false)}
            autoFocus
            placeholder="Form name..."
            placeholderTextColor="#9ca3af"
            returnKeyType="done"
            onSubmitEditing={() => setEditingName(false)}
          />
        ) : (
          <TouchableOpacity style={styles.nameTouchable} onPress={() => setEditingName(true)}>
            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              {formName || (isEditing ? 'Edit Form' : 'New Form')}
            </ThemedText>
            <Ionicons name="pencil-outline" size={14} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.saveHeaderBtnText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Description */}
          <View style={styles.card}>
            <ThemedText style={styles.fieldLabel}>Description (optional)</ThemedText>
            <TextInput
              style={[styles.textInput, { height: 72 }]}
              placeholder="Brief description of this form..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <ThemedText style={styles.toggleLabel}>Default form</ThemedText>
                <ThemedText style={styles.toggleSubtitle}>
                  Automatically send to all new clients
                </ThemedText>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: '#e5e7eb', true: Colors.light.primary + '66' }}
                thumbColor={isDefault ? Colors.light.primary : '#9ca3af'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          </View>

          {/* Fields */}
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Fields</ThemedText>
            <ThemedText style={styles.sectionCount}>{fields.length}</ThemedText>
          </View>

          {fields.map((field, index) => (
            <FieldRow
              key={field.id}
              field={field}
              index={index}
              total={fields.length}
              onEdit={() => {
                setEditingField({ ...field });
                setShowFieldEditor(true);
              }}
              onDelete={() => handleDeleteField(field.id)}
              onMoveUp={() => moveField(index, 'up')}
              onMoveDown={() => moveField(index, 'down')}
            />
          ))}

          <TouchableOpacity style={styles.addFieldBtn} onPress={() => setShowTypeModal(true)}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.addFieldBtnText}>Add Field</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Field type picker modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ThemedText style={styles.sheetTitle}>Choose Field Type</ThemedText>
            {FIELD_TYPES.map((ft) => (
              <TouchableOpacity
                key={ft.type}
                style={styles.typeRow}
                onPress={() => handleAddFieldType(ft.type)}
              >
                <View style={styles.typeIconWrap}>
                  <Ionicons name={ft.icon as unknown as keyof typeof Ionicons.glyphMap} size={20} color={Colors.light.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.typeLabel}>{ft.label}</ThemedText>
                  <ThemedText style={styles.typeDesc}>{ft.description}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Field editor modal */}
      {editingField && (
        <FieldEditorModal
          visible={showFieldEditor}
          field={editingField}
          onSave={handleSaveField}
          onClose={() => {
            setShowFieldEditor(false);
            setEditingField(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── FieldRow ─────────────────────────────────────────────────────────────────

interface FieldRowProps {
  field: FormField;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function FieldRow({ field, index, total, onEdit, onDelete, onMoveUp, onMoveDown }: FieldRowProps) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldRowLeft}>
        <View style={styles.fieldIconWrap}>
          <Ionicons
            name={FIELD_TYPE_ICONS[field.type] as unknown as keyof typeof Ionicons.glyphMap}
            size={16}
            color={Colors.light.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.fieldRowLabel} numberOfLines={1}>
            {field.label || '(no label)'}
          </ThemedText>
          <View style={styles.fieldRowMeta}>
            <ThemedText style={styles.fieldRowType}>
              {FIELD_TYPES.find((ft) => ft.type === field.type)?.label || field.type}
            </ThemedText>
            {field.required && (
              <View style={styles.requiredBadge}>
                <ThemedText style={styles.requiredText}>Required</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.fieldRowActions}>
        <TouchableOpacity
          style={[styles.iconBtn, index === 0 && styles.iconBtnDisabled]}
          onPress={onMoveUp}
          disabled={index === 0}
        >
          <Ionicons
            name="chevron-up"
            size={16}
            color={index === 0 ? '#d1d5db' : Colors.light.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, index === total - 1 && styles.iconBtnDisabled]}
          onPress={onMoveDown}
          disabled={index === total - 1}
        >
          <Ionicons
            name="chevron-down"
            size={16}
            color={index === total - 1 ? '#d1d5db' : Colors.light.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── FieldEditorModal ──────────────────────────────────────────────────────────

interface FieldEditorModalProps {
  visible: boolean;
  field: FormField;
  onSave: (field: FormField) => void;
  onClose: () => void;
}

function FieldEditorModal({ visible, field, onSave, onClose }: FieldEditorModalProps) {
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder);
  const [required, setRequired] = useState(field.required);
  const [options, setOptions] = useState<string[]>(field.options);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    setLabel(field.label);
    setPlaceholder(field.placeholder);
    setRequired(field.required);
    setOptions(field.options);
    setNewOption('');
  }, [field]);

  const hasOptions = field.type === 'select' || field.type === 'multiselect';

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    setOptions((prev) => [...prev, trimmed]);
    setNewOption('');
  };

  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!label.trim()) {
      Toast.show({ type: 'error', text1: 'Field label is required' });
      return;
    }
    onSave({ ...field, label: label.trim(), placeholder, required, options });
  };

  const typeInfo = FIELD_TYPES.find((ft) => ft.type === field.type);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={[styles.sheet, { paddingBottom: 32 }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <View style={styles.typeIconWrap}>
                  <Ionicons name={typeInfo?.icon as unknown as keyof typeof Ionicons.glyphMap} size={18} color={Colors.light.primary} />
                </View>
                <ThemedText style={styles.sheetTitle}>{typeInfo?.label} Field</ThemedText>
              </View>

              {/* Label */}
              <ThemedText style={styles.inputLabel}>Label *</ThemedText>
              <TextInput
                style={styles.textInput}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Do you have any allergies?"
                placeholderTextColor="#9ca3af"
                returnKeyType="next"
              />

              {/* Placeholder (not for checkbox/date) */}
              {!['checkbox', 'date'].includes(field.type) && (
                <>
                  <ThemedText style={styles.inputLabel}>Placeholder (optional)</ThemedText>
                  <TextInput
                    style={styles.textInput}
                    value={placeholder}
                    onChangeText={setPlaceholder}
                    placeholder="Hint text shown inside the field..."
                    placeholderTextColor="#9ca3af"
                    returnKeyType="done"
                  />
                </>
              )}

              {/* Options for select/multiselect */}
              {hasOptions && (
                <>
                  <ThemedText style={styles.inputLabel}>Options</ThemedText>
                  {options.map((opt, idx) => (
                    <View key={idx} style={styles.optionRow}>
                      <ThemedText style={styles.optionText} numberOfLines={1}>
                        {opt}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removeOption(idx)}>
                        <Ionicons name="close-circle" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.addOptionRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                      value={newOption}
                      onChangeText={setNewOption}
                      placeholder="New option..."
                      placeholderTextColor="#9ca3af"
                      returnKeyType="done"
                      onSubmitEditing={addOption}
                    />
                    <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Required toggle */}
              <View style={[styles.toggleRow, { marginTop: 12 }]}>
                <ThemedText style={styles.toggleLabel}>Required field</ThemedText>
                <Switch
                  value={required}
                  onValueChange={setRequired}
                  trackColor={{ false: '#e5e7eb', true: Colors.light.primary + '66' }}
                  thumbColor={required ? Colors.light.primary : '#9ca3af'}
                  ios_backgroundColor="#e5e7eb"
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <ThemedText style={styles.saveBtnText}>Save Field</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.backgroundSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 8,
  },
  nameTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text, flex: 1 },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.primary,
    paddingBottom: 2,
  },
  saveHeaderBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveHeaderBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  content: { padding: 16, gap: 12, paddingBottom: 48 },

  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 12,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  toggleSubtitle: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.light.textSecondary },
  sectionCount: {
    backgroundColor: Colors.light.primary + '22',
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  fieldRow: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  fieldRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  fieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldRowLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  fieldRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  fieldRowType: { fontSize: 11, color: Colors.light.textSecondary },
  requiredBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  requiredText: { fontSize: 10, fontWeight: '600', color: '#d97706' },
  fieldRowActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 6 },
  iconBtnDisabled: { opacity: 0.3 },

  addFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    backgroundColor: Colors.light.primary + '08',
  },
  addFieldBtnText: { fontSize: 14, fontWeight: '600', color: Colors.light.primary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.light.text },

  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  typeDesc: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 6,
  },
  optionText: { fontSize: 14, color: Colors.light.text, flex: 1 },
  addOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addOptionBtn: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
