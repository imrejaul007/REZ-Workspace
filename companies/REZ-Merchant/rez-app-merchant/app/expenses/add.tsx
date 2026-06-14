/**
 * AddExpenseScreen
 * Form to log a new expense.
 * API: POST /api/merchant/expenses
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';
import { useStore } from '@/contexts/StoreContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = ['Food', 'Utilities', 'Salary', 'Marketing', 'Other'] as const;
type Category = (typeof CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount greater than 0';
    }
    if (!date.trim()) {
      newErrors.date = 'Date is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        storeId: activeStore?._id || '',
        amount: parseFloat(amount),
        category,
        date,
        note: note.trim() || undefined,
      };
      const res = await apiClient.post('/merchant/expenses', payload);
      if (res.success) {
        showAlert('Success', 'Expense logged successfully');
        router.back();
      } else {
        showAlert('Error', res.message || 'Failed to save expense');
      }
    } catch (err) {
      showAlert('Error', err?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, category, date, note, activeStore]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Amount (₹) <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrapper, errors.amount ? styles.inputError : undefined]}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={Colors.light.icon}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  if (errors.amount) setErrors({ ...errors, amount: '' });
                }}
                editable={!isSubmitting}
              />
            </View>
            {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Date <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrapper, errors.date ? styles.inputError : undefined]}>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.light.icon}
                value={date}
                onChangeText={(t) => {
                  setDate(t);
                  if (errors.date) setErrors({ ...errors, date: '' });
                }}
                editable={!isSubmitting}
              />
            </View>
            {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
            <Text style={styles.helperText}>Format: YYYY-MM-DD (e.g. 2026-04-03)</Text>
          </View>

          {/* Note */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Note (optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Add a note..."
                placeholderTextColor={Colors.light.icon}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Actions */}
        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.btn, styles.btnCancel]}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.btnCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSubmit]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.light.card} />
            ) : (
              <Text style={styles.btnSubmitText}>Save Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.card },

  content: { flex: 1, padding: 16 },

  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.light.text, marginBottom: 8 },
  required: { color: Colors.light.error },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputError: { borderColor: Colors.light.error, backgroundColor: `${Colors.light.error}10` },
  currencyPrefix: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginRight: 4 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.light.text },
  noteInput: { minHeight: 80, paddingVertical: 12, textAlignVertical: 'top' },
  errorText: { marginTop: 6, fontSize: 12, color: Colors.light.error },
  helperText: { marginTop: 4, fontSize: 12, color: Colors.light.icon },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  categoryChipActive: {
    borderColor: Colors.light.tint,
    backgroundColor: `${Colors.light.tint}15`,
  },
  categoryChipText: { fontSize: 13, color: Colors.light.icon, fontWeight: '500' },
  categoryChipTextActive: { color: Colors.light.tint, fontWeight: '700' },

  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  btnCancelText: { color: Colors.light.text, fontWeight: '600', fontSize: 16 },
  btnSubmit: { backgroundColor: Colors.light.tint },
  btnSubmitText: { color: Colors.light.card, fontWeight: '600', fontSize: 16 },
});
