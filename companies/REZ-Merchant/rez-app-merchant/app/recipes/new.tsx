import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { showAlert } from '@/utils/alert';

const COURSE_TYPES = ['Starter', 'Main', 'Dessert', 'Beverage', 'Side', 'Other'] as const;
type CourseType = (typeof COURSE_TYPES)[number];

export default function NewRecipeScreen() {
  const [name, setName] = useState('');
  const [courseType, setCourseType] = useState<CourseType>('Main');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [servings, setServings] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Recipe name is required';
    if (costPrice && (isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      newErrors.costPrice = 'Enter a valid cost price';
    }
    if (sellingPrice && (isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0)) {
      newErrors.sellingPrice = 'Enter a valid selling price';
    }
    if (servings && (isNaN(Number(servings)) || Number(servings) <= 0)) {
      newErrors.servings = 'Servings must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const margin =
    costPrice && sellingPrice && Number(sellingPrice) > 0
      ? (((Number(sellingPrice) - Number(costPrice)) / Number(sellingPrice)) * 100).toFixed(1)
      : null;

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        name: name.trim(),
        courseType,
        servings: servings ? Number(servings) : 1,
      };
      if (costPrice) payload.costPrice = Number(costPrice);
      if (sellingPrice) payload.sellingPrice = Number(sellingPrice);
      if (notes.trim()) payload.notes = notes.trim();

      const res = await apiClient.post('merchant/recipes', payload);
      if (res.success) {
        showAlert('Success', 'Recipe created successfully');
        router.back();
      } else {
        showAlert('Error', (res as unknown as { message?: string }).message || 'Failed to create recipe');
      }
    } catch (err) {
      showAlert('Error', err?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, courseType, costPrice, sellingPrice, servings, notes]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.card} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Recipe</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Recipe Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dal Makhani"
                placeholderTextColor={Colors.light.icon}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                editable={!isSubmitting}
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          {/* Course Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Course Type</Text>
            <View style={styles.chipRow}>
              {COURSE_TYPES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, courseType === c && styles.chipActive]}
                  onPress={() => setCourseType(c)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.chipText, courseType === c && styles.chipTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cost & Selling Price */}
          <View style={styles.row2col}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Cost Price (₹)</Text>
              <View style={[styles.inputWrapper, errors.costPrice && styles.inputError]}>
                <Text style={styles.prefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="decimal-pad"
                  value={costPrice}
                  onChangeText={(t) => {
                    setCostPrice(t);
                    if (errors.costPrice) setErrors({ ...errors, costPrice: '' });
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {errors.costPrice ? <Text style={styles.errorText}>{errors.costPrice}</Text> : null}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Selling Price (₹)</Text>
              <View style={[styles.inputWrapper, errors.sellingPrice && styles.inputError]}>
                <Text style={styles.prefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="decimal-pad"
                  value={sellingPrice}
                  onChangeText={(t) => {
                    setSellingPrice(t);
                    if (errors.sellingPrice) setErrors({ ...errors, sellingPrice: '' });
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {errors.sellingPrice ? (
                <Text style={styles.errorText}>{errors.sellingPrice}</Text>
              ) : null}
            </View>
          </View>

          {/* Margin callout */}
          {margin !== null && (
            <View style={styles.marginBanner}>
              <Ionicons name="trending-up-outline" size={16} color="#059669" />
              <Text style={styles.marginText}>Gross margin: {margin}%</Text>
            </View>
          )}

          {/* Servings */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Servings</Text>
            <View
              style={[styles.inputWrapper, { maxWidth: 120 }, errors.servings && styles.inputError]}
            >
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={Colors.light.icon}
                keyboardType="number-pad"
                value={servings}
                onChangeText={(t) => {
                  setServings(t);
                  if (errors.servings) setErrors({ ...errors, servings: '' });
                }}
                editable={!isSubmitting}
              />
            </View>
            {errors.servings ? <Text style={styles.errorText}>{errors.servings}</Text> : null}
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Notes (optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Ingredients, preparation steps, allergens..."
                placeholderTextColor={Colors.light.icon}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
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
              <Text style={styles.btnSubmitText}>Save Recipe</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  backButton: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.card,
    textAlign: 'center',
  },
  headerSpacer: { width: 32 },
  body: { flex: 1, padding: 16 },
  formGroup: { marginBottom: 18 },
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
  prefix: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginRight: 4 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.light.text },
  notesInput: { minHeight: 80, paddingVertical: 12, textAlignVertical: 'top' },
  errorText: { marginTop: 4, fontSize: 12, color: Colors.light.error },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  chipActive: { borderColor: Colors.light.tint, backgroundColor: `${Colors.light.tint}15` },
  chipText: { fontSize: 13, color: Colors.light.icon, fontWeight: '500' },
  chipTextActive: { color: Colors.light.tint, fontWeight: '700' },
  row2col: { flexDirection: 'row' },
  marginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
  },
  marginText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
