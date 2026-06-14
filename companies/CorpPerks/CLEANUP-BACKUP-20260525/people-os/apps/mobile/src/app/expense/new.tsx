import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/config';
import { createExpenseClaim } from '../../services/api';
import Button from '../../components/Button';

const EXPENSE_TYPES = [
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'meals', label: 'Meals', icon: '🍽️' },
  { value: 'accommodation', label: 'Hotel', icon: '🏨' },
  { value: 'communication', label: 'Communication', icon: '📱' },
  { value: 'equipment', label: 'Equipment', icon: '💻' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export default function NewExpenseScreen() {
  const router = useRouter();
  const [expenseType, setExpenseType] = useState('travel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await createExpenseClaim({
        employeeId: 'EMP001',
        organizationId: 'ORG001',
        claimType: expenseType as 'travel' | 'meals' | 'accommodation' | 'communication' | 'equipment' | 'training' | 'other',
        amount: parseFloat(amount),
        expenseDate: new Date().toISOString(),
        description,
        projectCode: projectCode || undefined,
      });

      if (result) {
        Alert.alert('Success', 'Expense claim created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create expense claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Expense Type Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Expense Type</Text>
        <View style={styles.typeGrid}>
          {EXPENSE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                expenseType === type.value && styles.typeCardActive,
              ]}
              onPress={() => setExpenseType(type.value)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  expenseType === type.value && styles.typeLabelActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount (₹)</Text>
        <View style={styles.amountInput}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.amountPlaceholder}>
            {amount || '0.00'}
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <View style={styles.textArea}>
          <Text style={styles.textAreaPlaceholder}>
            {description || 'Describe your expense...'}
          </Text>
        </View>
      </View>

      {/* Project Code */}
      <View style={styles.section}>
        <Text style={styles.label}>Project Code (Optional)</Text>
        <View style={styles.input}>
          <Text style={styles.inputPlaceholder}>
            {projectCode || 'Enter project code'}
          </Text>
        </View>
      </View>

      {/* Receipt Upload Placeholder */}
      <View style={styles.section}>
        <Text style={styles.label}>Receipt</Text>
        <TouchableOpacity style={styles.uploadArea}>
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>Add Receipt Photo</Text>
          <Text style={styles.uploadHint}>Tap to capture or upload</Text>
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <View style={styles.submitSection}>
        <Button
          title="Submit Expense"
          onPress={handleSubmit}
          loading={loading}
          disabled={!amount || !description}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  typeCard: {
    width: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  typeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  amountInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  amountPlaceholder: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 100,
  },
  textAreaPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  uploadArea: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  uploadText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  uploadHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  submitSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
});
