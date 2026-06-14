/**
 * Custom Discount Builder Screen
 *
 * Creates a new discount rule via POST /api/merchant/discounts
 * Fields: name, type (percentage|fixed), value, minOrderValue, validFrom, validUntil
 * Shows a live preview card before saving.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { apiClient } from '@/services/api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DiscountType = 'percent' | 'fixed';

interface FormState {
  name: string;
  type: DiscountType;
  value: string;
  hasMinSpend: boolean;
  minSpend: string;
  maxDiscount: string;
  validFrom: string;
  validTo: string;
  maxUsage: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'percent',
  value: '',
  hasMinSpend: false,
  minSpend: '',
  maxDiscount: '',
  validFrom: '',
  validTo: '',
  maxUsage: '',
};

/** Pre-filled discount templates for growth action deep-links. */
const PRESET_TEMPLATES: Record<string, Partial<FormState>> = {
  welcome: {
    name: 'Welcome Offer',
    type: 'percent',
    value: '20',
    validTo: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })(),
  },
  happyhour: {
    name: 'Happy Hour',
    type: 'percent',
    value: '15',
    validTo: new Date().toISOString().split('T')[0],
  },
  acquire: {
    name: 'First Visit Discount',
    type: 'percent',
    value: '10',
    maxUsage: '1',
    validTo: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
  },
  loyalty: {
    name: 'Loyalty Reward',
    type: 'percent',
    value: '5',
    hasMinSpend: true,
    minSpend: '300',
    validTo: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 90);
      return d.toISOString().split('T')[0];
    })(),
  },
  awareness: {
    name: 'Special Offer',
    type: 'percent',
    value: '10',
    validTo: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().split('T')[0];
    })(),
  },
};

// ---------------------------------------------------------------------------
// Preview card
// ---------------------------------------------------------------------------

interface PreviewCardProps {
  form: FormState;
}

function PreviewCard({ form }: PreviewCardProps) {
  const hasContent = form.name || form.value;
  if (!hasContent) return null;

  const valueLabel =
    form.type === 'percent' ? `${form.value || '?'}% off` : `\u20B9${form.value || '?'} off`;

  const minLabel =
    form.hasMinSpend && form.minSpend ? ` on orders above \u20B9${form.minSpend}` : '';

  const capLabel =
    form.type === 'percent' && form.maxDiscount ? ` (max \u20B9${form.maxDiscount})` : '';

  const dateLabel =
    form.validFrom && form.validTo ? `, valid ${form.validFrom} – ${form.validTo}` : '';

  return (
    <View style={previewStyles.card}>
      <View style={previewStyles.topRow}>
        <Ionicons name="pricetag" size={18} color="#6366f1" />
        <Text style={previewStyles.label}>Preview</Text>
      </View>
      <Text style={previewStyles.title}>{form.name || 'Discount Name'}</Text>
      <Text style={previewStyles.desc}>
        {valueLabel}
        {minLabel}
        {capLabel}
        {dateLabel}
      </Text>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#3730a3', marginBottom: 4 },
  desc: { fontSize: 13, color: '#4338ca' },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DiscountBuilderScreen() {
  const { discountId, storeId, preset } = useLocalSearchParams<{
    discountId?: string;
    storeId?: string;
    preset?: string;
  }>();

  const [form, setForm] = useState<FormState>(() => {
    // Apply preset template on mount if provided via deep-link
    if (preset && preset in PRESET_TEMPLATES) {
      const template = PRESET_TEMPLATES[preset];
      return {
        ...DEFAULT_FORM,
        ...template,
        validFrom: new Date().toISOString().split('T')[0],
      };
    }
    return DEFAULT_FORM;
  });
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Please enter a discount name';
    const val = parseFloat(form.value);
    if (!form.value || isNaN(val) || val <= 0) return 'Please enter a valid discount value';
    if (form.type === 'percent' && val > 100) return 'Percentage cannot exceed 100';
    if (form.maxDiscount) {
      const cap = parseFloat(form.maxDiscount);
      if (isNaN(cap) || cap <= 0) return 'Max discount cap must be a positive number';
    }
    if (form.maxUsage) {
      const mu = parseInt(form.maxUsage);
      if (isNaN(mu) || mu <= 0) return 'Max usage must be a positive number';
    }
    if (form.hasMinSpend) {
      const ms = parseFloat(form.minSpend);
      if (!form.minSpend || isNaN(ms) || ms <= 0)
        return 'Please enter a valid minimum spend amount';
    }
    if (!form.validFrom.trim()) return 'Please enter a start date (YYYY-MM-DD)';
    if (!form.validTo.trim()) return 'Please enter an end date (YYYY-MM-DD)';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }

    try {
      setSaving(true);
      // FIX: Correct endpoint is merchant/discounts (not merchant/discount-rules).
      // FIX: Backend field names: type→percentage/fixed, validUntil (not validTo),
      //      minOrderValue (not minSpend), maxDiscountAmount (not maxDiscount),
      //      usageLimit (not maxUsage). applicableOn is required by backend.
      const payload: any = {
        name: form.name.trim(),
        type: form.type === 'percent' ? 'percentage' : 'fixed',
        value: parseFloat(form.value),
        validFrom: new Date(form.validFrom.trim()).toISOString(),
        validUntil: new Date(form.validTo.trim()).toISOString(),
        applicableOn: 'bill_payment',
        minOrderValue: form.hasMinSpend && form.minSpend ? parseFloat(form.minSpend) : 0,
        isActive: true,
      };
      if (form.maxDiscount && parseFloat(form.maxDiscount) > 0) {
        payload.maxDiscountAmount = parseFloat(form.maxDiscount);
      }
      if (form.maxUsage && parseInt(form.maxUsage) > 0) {
        payload.usageLimit = parseInt(form.maxUsage);
      }
      const res = await apiClient.post('merchant/discounts', payload);
      if (res.success) {
        Alert.alert('Success', 'Discount created', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('Error', (res as unknown as { message?: string }).message || 'Failed to create discount');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Build a Discount</Text>

          {/* Preset badge — shown when opened via deep-link */}
          {preset && preset in PRESET_TEMPLATES && (
            <View style={styles.presetBadge}>
              <Ionicons name="flash" size={13} color="#7c3aed" />
              <Text style={styles.presetBadgeText}>
                {preset === 'welcome' && 'Welcome Offer Template'}
                {preset === 'happyhour' && 'Happy Hour Template'}
                {preset === 'acquire' && 'First Visit Template'}
                {preset === 'loyalty' && 'Loyalty Reward Template'}
                {preset === 'awareness' && 'Special Offer Template'}
              </Text>
            </View>
          )}

          {/* Discount name */}
          <View style={styles.field}>
            <Text style={styles.label}>Discount Name</Text>
            <TextInput
              style={styles.input}
              placeholder='e.g. "Weekend Special"'
              placeholderTextColor="#9ca3af"
              value={form.name}
              onChangeText={(t) => update({ name: t })}
              returnKeyType="next"
            />
          </View>

          {/* Type selector */}
          <View style={styles.field}>
            <Text style={styles.label}>Discount Type</Text>
            <View style={styles.typeRow}>
              {(['percent', 'fixed'] as DiscountType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                  onPress={() => update({ type: t })}
                >
                  <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                    {t === 'percent' ? '% Off' : 'Fixed Amount (\u20B9)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Value */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {form.type === 'percent'
                ? 'Percentage Off (e.g. 20)'
                : 'Amount Off in \u20B9 (e.g. 50)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={form.type === 'percent' ? '20' : '50'}
              placeholderTextColor="#9ca3af"
              value={form.value}
              onChangeText={(t) => update({ value: t })}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />
          </View>

          {/* Min spend toggle */}
          <View style={styles.field}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.label}>Minimum Spend</Text>
                <Text style={styles.sublabel}>Require a minimum order amount</Text>
              </View>
              <Switch
                value={form.hasMinSpend}
                onValueChange={(v) => update({ hasMinSpend: v })}
                trackColor={{ false: '#e5e7eb', true: '#a5b4fc' }}
                thumbColor={form.hasMinSpend ? '#6366f1' : '#9ca3af'}
              />
            </View>
            {form.hasMinSpend && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="e.g. 500"
                placeholderTextColor="#9ca3af"
                value={form.minSpend}
                onChangeText={(t) => update({ minSpend: t })}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            )}
          </View>

          {/* Max discount cap — only for percentage */}
          {form.type === 'percent' && (
            <View style={styles.field}>
              <Text style={styles.label}>Max Discount Cap in \u20B9 (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 200"
                placeholderTextColor="#9ca3af"
                value={form.maxDiscount}
                onChangeText={(t) => update({ maxDiscount: t })}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
          )}

          {/* Max usage count */}
          <View style={styles.field}>
            <Text style={styles.label}>Max Usage Count (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              placeholderTextColor="#9ca3af"
              value={form.maxUsage}
              onChangeText={(t) => update({ maxUsage: t })}
              keyboardType="number-pad"
              returnKeyType="next"
            />
          </View>

          {/* Date range */}
          <View style={styles.field}>
            <Text style={styles.label}>Validity Period</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={form.validFrom}
                  onChangeText={(t) => update({ validFrom: t })}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.dateArrow}>
                <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={form.validTo}
                  onChangeText={(t) => update({ validTo: t })}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* Preview */}
          <PreviewCard form={form} />

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save Discount</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  screenTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 24 },

  presetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#a855f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  presetBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },

  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  sublabel: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
  },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeChipActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  typeChipTextActive: { color: '#4f46e5' },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  dateArrow: { paddingBottom: 12 },

  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
