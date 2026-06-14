import React, { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { apiClient } from '@/services/api/client';
import { useAlert } from '@/hooks';
import { useStore } from '@/contexts/StoreContext';

export default function KhataAddScreen() {
  const insets = useSafeAreaInsets();
  const { activeStore } = useStore();
  const alert = useAlert();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim()) newErrors.customerName = 'Customer name is required';
    const phoneValue = phone.trim();
    if (!phoneValue) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phoneValue.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerName, phone]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const payload = {
        storeId: activeStore?._id || '',
        customerName: customerName.trim(),
        customerPhone: phone.trim().replace(/\s/g, ''),
        amount: initialBalance.trim() ? parseFloat(initialBalance) : 0,
        note: notes.trim(),
      };
      const response = await apiClient.post('/merchant/khata', payload);
      if (response.success) {
        alert.show('Success', 'Customer added to khata successfully', 'success');
        setTimeout(() => router.back(), 500);
      } else {
        const errorMsg = response.message || 'Failed to add customer';
        setSubmitError(errorMsg);
        alert.show('Error', errorMsg, 'error');
      }
    } catch (error) {
      logger.error('Error adding khata customer:', error);
      const errorMsg = error?.message || 'Something went wrong. Please try again.';
      setSubmitError(errorMsg);
      alert.show('Error', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [customerName, phone, initialBalance, notes, activeStore?._id, validateForm]);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^\d\s]/g, '');
    setPhone(cleaned);
    if (errors.phone) setErrors({ ...errors, phone: '' });
  };

  const handleNameChange = (text: string) => {
    setCustomerName(text);
    if (errors.customerName) setErrors({ ...errors, customerName: '' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.light.card} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Add Customer</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {submitError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.light.error} />
              <ThemedText style={styles.errorBoxText}>{submitError}</ThemedText>
            </View>
          )}
          <View style={styles.formSection}>
            <ThemedText style={styles.sectionTitle}>Customer Details</ThemedText>
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>
                Customer Name <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={[styles.inputWrapper, errors.customerName && styles.inputWrapperError]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter customer name"
                  placeholderTextColor={Colors.light.icon}
                  value={customerName}
                  onChangeText={handleNameChange}
                  editable={!isSubmitting}
                />
              </View>
              {errors.customerName && (
                <ThemedText style={styles.errorText}>{errors.customerName}</ThemedText>
              )}
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>
                Phone Number <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={[styles.inputWrapper, errors.phone && styles.inputWrapperError]}>
                <ThemedText style={styles.phonePrefix}>+91</ThemedText>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="phone-pad"
                  maxLength={14}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  editable={!isSubmitting}
                />
              </View>
              {errors.phone && <ThemedText style={styles.errorText}>{errors.phone}</ThemedText>}
              <ThemedText style={styles.helperText}>10 digits required</ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Initial Balance (₹)</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter initial balance (optional)"
                  placeholderTextColor={Colors.light.icon}
                  keyboardType="decimal-pad"
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  editable={!isSubmitting}
                />
              </View>
              <ThemedText style={styles.helperText}>
                Leave blank for 0. Positive = credit owed, Negative = advance paid
              </ThemedText>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Notes</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Add notes about this customer (optional)"
                  placeholderTextColor={Colors.light.icon}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={notes}
                  onChangeText={setNotes}
                  editable={!isSubmitting}
                />
              </View>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.light.tint} />
            <View style={styles.infoContent}>
              <ThemedText style={styles.infoTitle}>About Khata</ThemedText>
              <ThemedText style={styles.infoText}>
                Khata is your customer credit ledger. Track money owed by customers or advances
                paid.
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCancel]}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <ThemedText style={styles.buttonCancelText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSubmit]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.light.card} />
            ) : (
              <ThemedText style={styles.buttonSubmitText}>Create Khata</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <Alert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          type={alert.type as 'success' | 'error' | 'warning' | 'info'}
          onClose={alert.close}
        />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.tint,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.light.card },
  content: { flex: 1, paddingTop: 20, paddingHorizontal: 16 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.light.error}15`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
    gap: 10,
  },
  errorBoxText: { flex: 1, fontSize: 13, color: Colors.light.error, fontWeight: '500' },
  formSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: Colors.light.text },
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
  inputWrapperError: {
    borderColor: Colors.light.error,
    backgroundColor: `${Colors.light.error}10`,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    fontSize: 16,
    color: Colors.light.text,
  },
  phonePrefix: { fontSize: 16, fontWeight: '500', marginRight: 4, color: Colors.light.text },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    fontSize: 16,
    color: Colors.light.text,
  },
  notesInput: { minHeight: 100, paddingVertical: 12, textAlignVertical: 'top' },
  errorText: { marginTop: 6, fontSize: 13, color: Colors.light.error },
  helperText: { marginTop: 6, fontSize: 12, color: Colors.light.icon },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 100,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: `${Colors.light.tint}15`,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  infoContent: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  infoText: { fontSize: 13, color: Colors.light.icon, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  buttonCancelText: { color: Colors.light.text, fontWeight: '600', fontSize: 16 },
  buttonSubmit: { backgroundColor: Colors.light.tint },
  buttonSubmitText: { color: Colors.light.card, fontWeight: '600', fontSize: 16 },
});
