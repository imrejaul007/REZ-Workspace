/**
 * Hyperlocal Network - Create Partnership Screen
 *
 * Create a new partnership with a merchant.
 * Supports referral, campaign, and cross-promotion partnerships.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Colors } from '@/constants/DesignTokens';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PartnershipForm {
  partnerName: string;
  partnershipType: 'referral' | 'campaign' | 'cross_promotion';
  description: string;
  revenueSharePercent: number;
  costShareEnabled: boolean;
  costSharePercent: number;
  minOrderValue: number;
  maxDiscountPercent: number;
  validDays: number;
  categories: string[];
}

const DEFAULT_FORM: PartnershipForm = {
  partnerName: '',
  partnershipType: 'referral',
  description: '',
  revenueSharePercent: 50,
  costShareEnabled: false,
  costSharePercent: 50,
  minOrderValue: 0,
  maxDiscountPercent: 10,
  validDays: 30,
  categories: [],
};

// Partnership types with icons and descriptions
const PARTNERSHIP_TYPES = [
  {
    id: 'referral' as const,
    label: 'Referral',
    icon: 'people-outline',
    description: 'Send customers to partner and earn referral rewards',
  },
  {
    id: 'campaign' as const,
    label: 'Campaign',
    icon: 'megaphone-outline',
    description: 'Joint marketing campaigns with shared costs',
  },
  {
    id: 'cross_promotion' as const,
    label: 'Cross-Promo',
    icon: 'git-merge-outline',
    description: 'Bundle offers and shared loyalty rewards',
  },
];

const CATEGORIES = [
  'Cafe',
  'Restaurant',
  'Fitness',
  'Beauty',
  'Retail',
  'Health',
  'Entertainment',
  'Travel',
];

// ---------------------------------------------------------------------------
// Partnership Type Card
// ---------------------------------------------------------------------------

interface TypeCardProps {
  type: (typeof PARTNERSHIP_TYPES)[number];
  selected: boolean;
  onSelect: () => void;
}

const TypeCard = ({ type, selected, onSelect }: TypeCardProps) => (
  <TouchableOpacity
    style={[typeStyles.container, selected && typeStyles.containerSelected]}
    onPress={onSelect}
    activeOpacity={0.7}
  >
    <View style={[typeStyles.iconWrap, selected && typeStyles.iconWrapSelected]}>
      <Ionicons
        name={type.icon as unknown}
        size={22}
        color={selected ? '#fff' : Colors.primary[500]}
      />
    </View>
    <Text style={[typeStyles.label, selected && typeStyles.labelSelected]}>{type.label}</Text>
    <Text style={typeStyles.description}>{type.description}</Text>
    {selected && (
      <View style={typeStyles.checkmark}>
        <Ionicons name="checkmark-circle" size={18} color={Colors.primary[500]} />
      </View>
    )}
  </TouchableOpacity>
);

const typeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray[200],
    position: 'relative',
  },
  containerSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapSelected: {
    backgroundColor: Colors.primary[500],
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  labelSelected: {
    color: Colors.primary[600],
  },
  description: {
    fontSize: 10,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 14,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

// ---------------------------------------------------------------------------
// Category Chip
// ---------------------------------------------------------------------------

interface CategoryChipProps {
  category: string;
  selected: boolean;
  onToggle: () => void;
}

const CategoryChip = ({ category, selected, onToggle }: CategoryChipProps) => (
  <TouchableOpacity
    style={[chipStyles.container, selected && chipStyles.containerSelected]}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <Text style={[chipStyles.text, selected && chipStyles.textSelected]}>{category}</Text>
    {selected && <Ionicons name="close" size={14} color={Colors.primary[600]} />}
  </TouchableOpacity>
);

const chipStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  containerSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[300],
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray[600],
  },
  textSelected: {
    color: Colors.primary[600],
  },
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CreatePartnershipScreen() {
  const { partnerId, partnerName: prefilledName } = useLocalSearchParams<{
    partnerId?: string;
    partnerName?: string;
  }>();

  const [form, setForm] = useState<PartnershipForm>({
    ...DEFAULT_FORM,
    partnerName: prefilledName || '',
  });
  const [saving, setSaving] = useState(false);

  const updateForm = (updates: Partial<PartnershipForm>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const toggleCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSubmit = async () => {
    if (!form.partnerName.trim()) {
      Alert.alert('Validation', 'Please enter partner name');
      return;
    }
    if (form.partnershipType === 'cross_promotion' && form.categories.length === 0) {
      Alert.alert('Validation', 'Please select at least one category for cross-promotion');
      return;
    }

    setSaving(true);
    try {
      logger.info('[Hyperlocal] Creating partnership:', form);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        'Success',
        'Partnership request has been sent!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      logger.error('[Hyperlocal] Failed to create partnership:', error);
      Alert.alert('Error', error?.message || 'Failed to create partnership');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = form.partnerName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Partnership Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partnership Type</Text>
            <View style={styles.typesGrid}>
              {PARTNERSHIP_TYPES.map((type) => (
                <TypeCard
                  key={type.id}
                  type={type}
                  selected={form.partnershipType === type.id}
                  onSelect={() => updateForm({ partnershipType: type.id })}
                />
              ))}
            </View>
          </View>

          {/* Partner Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partner Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter partner business name"
              placeholderTextColor={Colors.gray[400]}
              value={form.partnerName}
              onChangeText={(text) => updateForm({ partnerName: text })}
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the partnership terms..."
              placeholderTextColor={Colors.gray[400]}
              value={form.description}
              onChangeText={(text) => updateForm({ description: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Revenue Share */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Revenue Share: {form.revenueSharePercent}%
            </Text>
            <Text style={styles.sectionSubtitle}>
              Your share of the revenue from referrals or conversions
            </Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={10}
                maximumValue={90}
                step={5}
                value={form.revenueSharePercent}
                onValueChange={(value) => updateForm({ revenueSharePercent: value })}
                minimumTrackTintColor={Colors.primary[500]}
                maximumTrackTintColor={Colors.gray[200]}
                thumbTintColor={Colors.primary[500]}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>10%</Text>
                <Text style={styles.sliderLabel}>50%</Text>
                <Text style={styles.sliderLabel}>90%</Text>
              </View>
            </View>
          </View>

          {/* Cost Share (Campaign only) */}
          {form.partnershipType === 'campaign' && (
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.sectionTitle}>Split Campaign Costs</Text>
                  <Text style={styles.sectionSubtitle}>
                    Share marketing and promotion expenses
                  </Text>
                </View>
                <Switch
                  value={form.costShareEnabled}
                  onValueChange={(value) => updateForm({ costShareEnabled: value })}
                  trackColor={{ false: Colors.gray[200], true: Colors.primary[300] }}
                  thumbColor={form.costShareEnabled ? Colors.primary[500] : Colors.gray[100]}
                />
              </View>
              {form.costShareEnabled && (
                <View style={styles.costShareSlider}>
                  <Text style={styles.sliderValueText}>
                    Your share: {form.costSharePercent}%
                  </Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={10}
                    maximumValue={90}
                    step={5}
                    value={form.costSharePercent}
                    onValueChange={(value) => updateForm({ costSharePercent: value })}
                    minimumTrackTintColor={Colors.warning[500]}
                    maximumTrackTintColor={Colors.gray[200]}
                    thumbTintColor={Colors.warning[500]}
                  />
                </View>
              )}
            </View>
          )}

          {/* Categories (Cross-Promo only) */}
          {form.partnershipType === 'cross_promotion' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Offer Categories</Text>
              <Text style={styles.sectionSubtitle}>
                Select categories for joint offers
              </Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((category) => (
                  <CategoryChip
                    key={category}
                    category={category}
                    selected={form.categories.includes(category)}
                    onToggle={() => toggleCategory(category)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Additional Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Settings</Text>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Min Order Value</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="0"
                  placeholderTextColor={Colors.gray[400]}
                  keyboardType="numeric"
                  value={form.minOrderValue > 0 ? form.minOrderValue.toString() : ''}
                  onChangeText={(text) => updateForm({ minOrderValue: parseInt(text) || 0 })}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Max Discount</Text>
              <View style={styles.inputWithSuffix}>
                <TextInput
                  style={styles.smallInput}
                  placeholder="10"
                  placeholderTextColor={Colors.gray[400]}
                  keyboardType="numeric"
                  value={form.maxDiscountPercent > 0 ? form.maxDiscountPercent.toString() : ''}
                  onChangeText={(text) => updateForm({ maxDiscountPercent: parseInt(text) || 0 })}
                />
                <Text style={styles.inputSuffix}>%</Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Valid For</Text>
              <View style={styles.inputWithSuffix}>
                <TextInput
                  style={styles.smallInput}
                  placeholder="30"
                  placeholderTextColor={Colors.gray[400]}
                  keyboardType="numeric"
                  value={form.validDays > 0 ? form.validDays.toString() : ''}
                  onChangeText={(text) => updateForm({ validDays: parseInt(text) || 0 })}
                />
                <Text style={styles.inputSuffix}>days</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>Send Partnership Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: 12,
  },
  typesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.gray[900],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    marginTop: 8,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  sliderContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 11,
    color: Colors.gray[400],
  },
  sliderValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  costShareSlider: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.warning[200],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.gray[700],
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputPrefix: {
    fontSize: 15,
    color: Colors.gray[500],
  },
  inputSuffix: {
    fontSize: 15,
    color: Colors.gray[500],
  },
  smallInput: {
    fontSize: 15,
    color: Colors.gray[900],
    textAlign: 'right',
    minWidth: 60,
    padding: 0,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
