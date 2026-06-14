/**
 * Create Rendez Social Offer Screen
 *
 * Form for creating couple and group social offers with context rules.
 * Supports setting up special days, dates, and time restrictions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Types
interface ContextRuleInput {
  id: string;
  type: 'day' | 'date' | 'time';
  value: string;
  label: string;
  isActive: boolean;
}

interface OfferFormData {
  name: string;
  description: string;
  type: 'couple' | 'group';
  category: string;
  minPeople: number;
  maxPeople: number;
  price: string;
  originalPrice: string;
  enableDiscount: boolean;
  discount: string;
  contextRules: ContextRuleInput[];
  validFrom: string;
  validTo: string;
  terms: string;
}

const initialFormData: OfferFormData = {
  name: '',
  description: '',
  type: 'couple',
  category: '',
  minPeople: 2,
  maxPeople: 2,
  price: '',
  originalPrice: '',
  enableDiscount: false,
  discount: '',
  contextRules: [],
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  terms: '',
};

const categories = [
  { id: 'dining', label: 'Dining', icon: 'restaurant' },
  { id: 'wellness', label: 'Wellness', icon: 'spa' },
  { id: 'entertainment', label: 'Entertainment', icon: 'game-controller' },
  { id: 'celebration', label: 'Celebration', icon: 'balloon' },
  { id: 'adventure', label: 'Adventure', icon: 'compass' },
  { id: 'other', label: 'Other', icon: 'grid' },
];

const dayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const dateOptions = [
  { value: 'valentines', label: "Valentine's Day" },
  { value: 'newyear', label: 'New Year' },
  { value: 'christmas', label: 'Christmas' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'birthday', label: 'Birthday Week' },
  { value: 'weekend', label: 'Weekends' },
];

const timeOptions = [
  { value: 'morning', label: 'Morning (6AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
  { value: 'evening', label: 'Evening (5PM - 10PM)' },
  { value: 'night', label: 'Night (10PM - 6AM)' },
];

// Section Header Component
const SectionHeader: React.FC<{ title: string; subtitle?: string; icon?: string }> = ({
  title,
  subtitle,
  icon,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight2 }]}>
            <Ionicons name={icon as unknown} size={16} color={colors.primary} />
          </View>
        )}
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
};

// Form Input Component
const FormInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  error?: string;
  prefix?: string;
  suffix?: string;
  colors: typeof Colors.light;
}> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType = 'default',
  error,
  prefix,
  suffix,
  colors,
}) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
    <View style={styles.inputWrapper}>
      {prefix && <Text style={[styles.inputPrefix, { color: colors.textSecondary }]}>{prefix}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.backgroundTertiary,
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
          },
          multiline && { height: 80, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
      />
      {suffix && <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>{suffix}</Text>}
    </View>
    {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
  </View>
);

// Type Selector Component
const TypeSelector: React.FC<{
  selected: 'couple' | 'group';
  onSelect: (type: 'couple' | 'group') => void;
  colors: typeof Colors.light;
}> = ({ selected, onSelect, colors }) => (
  <View style={styles.typeSelectorContainer}>
    <TouchableOpacity
      style={[
        styles.typeOption,
        {
          backgroundColor: selected === 'couple' ? '#fce7f3' : colors.backgroundTertiary,
          borderColor: selected === 'couple' ? '#ec4899' : colors.border,
        },
      ]}
      onPress={() => onSelect('couple')}
    >
      <Ionicons
        name="heart"
        size={28}
        color={selected === 'couple' ? '#ec4899' : colors.textMuted}
      />
      <Text
        style={[
          styles.typeOptionLabel,
          { color: selected === 'couple' ? '#ec4899' : colors.text },
        ]}
      >
        Couple
      </Text>
      <Text style={[styles.typeOptionDesc, { color: colors.textSecondary }]}>
        For 2 people
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.typeOption,
        {
          backgroundColor: selected === 'group' ? '#ede9fe' : colors.backgroundTertiary,
          borderColor: selected === 'group' ? '#8b5cf6' : colors.border,
        },
      ]}
      onPress={() => onSelect('group')}
    >
      <Ionicons
        name="people"
        size={28}
        color={selected === 'group' ? '#8b5cf6' : colors.textMuted}
      />
      <Text
        style={[
          styles.typeOptionLabel,
          { color: selected === 'group' ? '#8b5cf6' : colors.text },
        ]}
      >
        Group
      </Text>
      <Text style={[styles.typeOptionDesc, { color: colors.textSecondary }]}>
        For 3+ people
      </Text>
    </TouchableOpacity>
  </View>
);

// Category Selector Component
const CategorySelector: React.FC<{
  selected: string;
  onSelect: (category: string) => void;
  colors: typeof Colors.light;
}> = ({ selected, onSelect, colors }) => (
  <View style={styles.categoryContainer}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryOption,
            {
              backgroundColor: selected === cat.id ? colors.primaryLight2 : colors.backgroundTertiary,
              borderColor: selected === cat.id ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelect(cat.id)}
        >
          <Ionicons
            name={cat.icon as unknown}
            size={20}
            color={selected === cat.id ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.categoryLabel,
              { color: selected === cat.id ? colors.primary : colors.text },
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// Context Rules Editor Component
const ContextRulesEditor: React.FC<{
  rules: ContextRuleInput[];
  onAddRule: (rule: ContextRuleInput) => void;
  onRemoveRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  colors: typeof Colors.light;
}> = ({ rules, onAddRule, onRemoveRule, onToggleRule, colors }) => {
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const addDayRule = (day: { value: string; label: string }) => {
    onAddRule({
      id: `day-${Date.now()}`,
      type: 'day',
      value: day.value,
      label: day.label,
      isActive: true,
    });
    setShowDayPicker(false);
  };

  const addDateRule = (date: { value: string; label: string }) => {
    onAddRule({
      id: `date-${Date.now()}`,
      type: 'date',
      value: date.value,
      label: date.label,
      isActive: true,
    });
    setShowDatePicker(false);
  };

  const addTimeRule = (time: { value: string; label: string }) => {
    onAddRule({
      id: `time-${Date.now()}`,
      type: 'time',
      value: time.value,
      label: time.label,
      isActive: true,
    });
    setShowTimePicker(false);
  };

  return (
    <View style={styles.rulesEditor}>
      {/* Existing Rules */}
      {rules.map((rule) => (
        <View key={rule.id} style={[styles.ruleItem, { backgroundColor: colors.backgroundTertiary }]}>
          <View style={styles.ruleInfo}>
            <View
              style={[
                styles.ruleIcon,
                {
                  backgroundColor:
                    rule.type === 'day'
                      ? '#fef3c7'
                      : rule.type === 'date'
                      ? '#fce7f3'
                      : '#dbeafe',
                },
              ]}
            >
              <Ionicons
                name={rule.type === 'day' ? 'calendar' : rule.type === 'date' ? 'heart' : 'time'}
                size={14}
                color={
                  rule.type === 'day'
                    ? '#92400e'
                    : rule.type === 'date'
                    ? '#ec4899'
                    : '#1d4ed8'
                }
              />
            </View>
            <Text style={[styles.ruleLabel, { color: colors.text }]}>{rule.label}</Text>
          </View>
          <View style={styles.ruleActions}>
            <Switch
              value={rule.isActive}
              onValueChange={() => onToggleRule(rule.id)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
            <TouchableOpacity
              style={styles.removeRuleButton}
              onPress={() => onRemoveRule(rule.id)}
            >
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Add Rules Buttons */}
      <View style={styles.addRuleButtons}>
        <TouchableOpacity
          style={[styles.addRuleButton, { borderColor: colors.border }]}
          onPress={() => setShowDayPicker(!showDayPicker)}
        >
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={[styles.addRuleText, { color: colors.primary }]}>Add Day</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addRuleButton, { borderColor: colors.border }]}
          onPress={() => setShowDatePicker(!showDatePicker)}
        >
          <Ionicons name="heart-outline" size={16} color={colors.primary} />
          <Text style={[styles.addRuleText, { color: colors.primary }]}>Add Date</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addRuleButton, { borderColor: colors.border }]}
          onPress={() => setShowTimePicker(!showTimePicker)}
        >
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={[styles.addRuleText, { color: colors.primary }]}>Add Time</Text>
        </TouchableOpacity>
      </View>

      {/* Day Picker */}
      {showDayPicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {dayOptions.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={styles.pickerOption}
              onPress={() => addDayRule(day)}
            >
              <Text style={[styles.pickerOptionText, { color: colors.text }]}>{day.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {dateOptions.map((date) => (
            <TouchableOpacity
              key={date.value}
              style={styles.pickerOption}
              onPress={() => addDateRule(date)}
            >
              <Text style={[styles.pickerOptionText, { color: colors.text }]}>{date.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {timeOptions.map((time) => (
            <TouchableOpacity
              key={time.value}
              style={styles.pickerOption}
              onPress={() => addTimeRule(time)}
            >
              <Text style={[styles.pickerOptionText, { color: colors.text }]}>{time.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// People Counter Component
const PeopleCounter: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  colors: typeof Colors.light;
}> = ({ label, value, onChange, min, max, colors }) => (
  <View style={styles.counterContainer}>
    <Text style={[styles.counterLabel, { color: colors.text }]}>{label}</Text>
    <View style={styles.counterControls}>
      <TouchableOpacity
        style={[
          styles.counterButton,
          { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
          value <= min && styles.counterButtonDisabled,
        ]}
        onPress={() => value > min && onChange(value - 1)}
        disabled={value <= min}
      >
        <Ionicons
          name="remove"
          size={20}
          color={value <= min ? colors.textMuted : colors.text}
        />
      </TouchableOpacity>
      <Text style={[styles.counterValue, { color: colors.text }]}>{value}</Text>
      <TouchableOpacity
        style={[
          styles.counterButton,
          { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
          value >= max && styles.counterButtonDisabled,
        ]}
        onPress={() => value < max && onChange(value + 1)}
        disabled={value >= max}
      >
        <Ionicons
          name="add"
          size={20}
          color={value >= max ? colors.textMuted : colors.text}
        />
      </TouchableOpacity>
    </View>
  </View>
);

export default function CreateOfferScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<OfferFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OfferFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof OfferFormData>(key: K, value: OfferFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addContextRule = (rule: ContextRuleInput) => {
    setFormData((prev) => ({
      ...prev,
      contextRules: [...prev.contextRules, rule],
    }));
  };

  const removeContextRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contextRules: prev.contextRules.filter((r) => r.id !== id),
    }));
  };

  const toggleContextRule = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contextRules: prev.contextRules.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      ),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OfferFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Offer name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    if (formData.type === 'group' && formData.minPeople < 3) {
      newErrors.minPeople = 'Group offers require at least 3 people';
    }
    if (formData.enableDiscount && (!formData.discount || parseInt(formData.discount) <= 0)) {
      newErrors.discount = 'Please enter a valid discount percentage';
    }
    if (!formData.validFrom) {
      newErrors.validFrom = 'Start date is required';
    }
    if (!formData.validTo) {
      newErrors.validTo = 'End date is required';
    }
    if (formData.validFrom && formData.validTo && formData.validFrom > formData.validTo) {
      newErrors.validTo = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Success',
        'Your social offer has been created successfully!',
        [
          {
            text: 'View Offers',
            onPress: () => router.replace('/rendez'),
          },
          {
            text: 'Create Another',
            onPress: () => {
              setFormData(initialFormData);
              setErrors({});
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Offer Type */}
          <SectionHeader
            title="Offer Type"
            subtitle="Choose between couple or group experience"
            icon="heart"
          />
          <TypeSelector
            selected={formData.type}
            onSelect={(type) => {
              updateField('type', type);
              if (type === 'couple') {
                updateField('minPeople', 2);
                updateField('maxPeople', 2);
              } else {
                updateField('minPeople', 3);
                updateField('maxPeople', 6);
              }
            }}
            colors={colors}
          />

          {/* Basic Info */}
          <SectionHeader
            title="Basic Information"
            subtitle="Name, description, and category"
            icon="document-text"
          />
          <FormInput
            label="Offer Name *"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="e.g., Romantic Candlelight Dinner"
            error={errors.name}
            colors={colors}
          />
          <FormInput
            label="Description *"
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Describe what's included in this offer..."
            multiline
            numberOfLines={3}
            error={errors.description}
            colors={colors}
          />
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
          {errors.category && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.category}</Text>
          )}
          <CategorySelector
            selected={formData.category}
            onSelect={(cat) => updateField('category', cat)}
            colors={colors}
          />

          {/* Group Size (only for group offers) */}
          {formData.type === 'group' && (
            <>
              <SectionHeader
                title="Group Size"
                subtitle="Set minimum and maximum number of people"
                icon="people"
              />
              <View style={styles.counterRow}>
                <PeopleCounter
                  label="Minimum"
                  value={formData.minPeople}
                  onChange={(v) => updateField('minPeople', v)}
                  min={3}
                  max={formData.maxPeople - 1}
                  colors={colors}
                />
                <PeopleCounter
                  label="Maximum"
                  value={formData.maxPeople}
                  onChange={(v) => updateField('maxPeople', v)}
                  min={formData.minPeople + 1}
                  max={20}
                  colors={colors}
                />
              </View>
            </>
          )}

          {/* Pricing */}
          <SectionHeader
            title="Pricing"
            subtitle="Set your offer price"
            icon="cash"
          />
          <FormInput
            label="Price *"
            value={formData.price}
            onChangeText={(text) => updateField('price', text.replace(/[^0-9]/g, ''))}
            placeholder="2999"
            keyboardType="numeric"
            prefix="₹"
            error={errors.price}
            colors={colors}
          />
          <FormInput
            label="Original Price (Optional)"
            value={formData.originalPrice}
            onChangeText={(text) => updateField('originalPrice', text.replace(/[^0-9]/g, ''))}
            placeholder="4500"
            keyboardType="numeric"
            prefix="₹"
            colors={colors}
          />

          {/* Discount Toggle */}
          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Enable Discount</Text>
              <Text style={[styles.switchSublabel, { color: colors.textSecondary }]}>
                Show percentage discount on the offer
              </Text>
            </View>
            <Switch
              value={formData.enableDiscount}
              onValueChange={(value) => updateField('enableDiscount', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {formData.enableDiscount && (
            <FormInput
              label="Discount Percentage"
              value={formData.discount}
              onChangeText={(text) => updateField('discount', text.replace(/[^0-9]/g, ''))}
              placeholder="25"
              keyboardType="numeric"
              suffix="%"
              error={errors.discount}
              colors={colors}
            />
          )}

          {/* Context Rules */}
          <SectionHeader
            title="Context Rules"
            subtitle="Set when this offer applies (optional)"
            icon="calendar"
          />
          <Text style={[styles.rulesHint, { color: colors.textSecondary }]}>
            Define specific days, dates, or times when this offer is available. Leave empty for all times.
          </Text>
          <ContextRulesEditor
            rules={formData.contextRules}
            onAddRule={addContextRule}
            onRemoveRule={removeContextRule}
            onToggleRule={toggleContextRule}
            colors={colors}
          />

          {/* Validity Period */}
          <SectionHeader
            title="Validity Period"
            subtitle="When can customers book this offer"
            icon="time"
          />
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Start Date *</Text>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.text,
                    borderColor: errors.validFrom ? colors.error : colors.border,
                  },
                ]}
                value={formData.validFrom}
                onChangeText={(text) => updateField('validFrom', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
              {errors.validFrom && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.validFrom}</Text>
              )}
            </View>
            <View style={styles.dateField}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>End Date *</Text>
              <TextInput
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.text,
                    borderColor: errors.validTo ? colors.error : colors.border,
                  },
                ]}
                value={formData.validTo}
                onChangeText={(text) => updateField('validTo', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
              {errors.validTo && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.validTo}</Text>
              )}
            </View>
          </View>

          {/* Terms */}
          <SectionHeader
            title="Terms & Conditions"
            subtitle="Define offer rules (optional)"
            icon="document"
          />
          <FormInput
            label="Terms"
            value={formData.terms}
            onChangeText={(text) => updateField('terms', text)}
            placeholder="e.g., Reservation required 24 hours in advance..."
            multiline
            numberOfLines={3}
            colors={colors}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Create Offer</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  typeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  typeOptionDesc: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    fontSize: 16,
    marginRight: 8,
  },
  inputSuffix: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  counterContainer: {
    flex: 1,
  },
  counterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  counterButtonDisabled: {
    opacity: 0.5,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  switchSublabel: {
    fontSize: 13,
    marginTop: 2,
  },
  rulesHint: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  rulesEditor: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  ruleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  ruleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeRuleButton: {
    padding: 4,
  },
  addRuleButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addRuleText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pickerDropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
