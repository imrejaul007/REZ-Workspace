import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../../constants/config';
import { createLeaveRequest } from '../../services/api';
import Button from '../../components/Button';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', icon: '🌴' },
  { value: 'sick', label: 'Sick Leave', icon: '🏥' },
  { value: 'casual', label: 'Casual Leave', icon: '🌤️' },
  { value: 'unpaid', label: 'Unpaid Leave', icon: '📝' },
];

export default function NewLeaveScreen() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!startDate || !endDate || !reason) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await createLeaveRequest({
        employeeId: 'EMP001',
        organizationId: 'ORG001',
        leaveType: leaveType as 'annual' | 'sick' | 'casual' | 'unpaid',
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
        isHalfDay,
      });

      if (result) {
        Alert.alert('Success', 'Leave request created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Leave Type Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Leave Type</Text>
        <View style={styles.typeGrid}>
          {LEAVE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeCard,
                leaveType === type.value && styles.typeCardActive,
              ]}
              onPress={() => setLeaveType(type.value)}
            >
              <Text style={styles.typeIcon}>{type.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  leaveType === type.value && styles.typeLabelActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Date Range */}
      <View style={styles.section}>
        <Text style={styles.label}>Date Range</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>From</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.datePlaceholder}>
                {startDate || 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>To</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.datePlaceholder}>
                {endDate || 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Half Day */}
      <TouchableOpacity
        style={styles.halfDayRow}
        onPress={() => setIsHalfDay(!isHalfDay)}
      >
        <View style={[styles.checkbox, isHalfDay && styles.checkboxActive]}>
          {isHalfDay && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.halfDayLabel}>Half Day Leave</Text>
      </TouchableOpacity>

      {/* Reason */}
      <View style={styles.section}>
        <Text style={styles.label}>Reason</Text>
        <View style={styles.textArea}>
          <Text style={styles.textAreaPlaceholder}>
            {reason || 'Describe the reason for your leave...'}
          </Text>
        </View>
      </View>

      {/* Submit */}
      <View style={styles.submitSection}>
        <Button
          title="Submit Request"
          onPress={handleSubmit}
          loading={loading}
          disabled={!startDate || !endDate || !reason}
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
    width: '48%',
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
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  typeLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
  },
  dateField: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  dateLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  dateInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  halfDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  halfDayLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 120,
  },
  textAreaPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  submitSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
});
