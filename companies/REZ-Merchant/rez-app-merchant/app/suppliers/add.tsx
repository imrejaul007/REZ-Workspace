import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignTokens';
import FormInput from '@/components/forms/FormInput';
import { suppliersService, CreateSupplierPayload } from '@/services/api/suppliers';
import { useAuth } from '@/contexts/AuthContext';
import { showAlert } from '@/utils/alert';

const supplierSchema = z.object({
  businessName: z.string().min(3, 'Business name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('')),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN')
    .optional()
    .or(z.literal('')),
  paymentTerms: z.enum(['immediate', 'net_7', 'net_15', 'net_30']).optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function AddSupplierScreen() {
  const { merchant } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { businessName: '', phone: '', address: '', city: '', state: '' },
  });

  const onSubmit = async (data: SupplierFormData) => {
    try {
      setLoading(true);
      await suppliersService.createSupplier(data as CreateSupplierPayload);
      showAlert('Success', 'Supplier added successfully');
      router.back();
    } catch (error) {
      showAlert('Error', error.message || 'Failed to add supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Supplier</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FormInput
            name="businessName"
            control={control}
            label="Business Name *"
            placeholder="Supplier business name"
            icon="business"
          />
          <FormInput
            name="phone"
            control={control}
            label="Phone *"
            placeholder="9876543210"
            keyboardType="phone-pad"
            icon="call-outline"
            maxLength={10}
          />
          <FormInput
            name="address"
            control={control}
            label="Address *"
            placeholder="Complete address"
            icon="location-outline"
            multiline
            numberOfLines={2}
          />
          <View style={styles.row}>
            <View style={styles.columnHalf}>
              <FormInput
                name="city"
                control={control}
                label="City *"
                placeholder="City"
                icon="map-outline"
              />
            </View>
            <View style={styles.columnHalf}>
              <FormInput
                name="state"
                control={control}
                label="State *"
                placeholder="State"
                icon="flag-outline"
              />
            </View>
          </View>
          <FormInput
            name="email"
            control={control}
            label="Email"
            placeholder="supplier@business.com"
            keyboardType="email-address"
            icon="mail-outline"
          />
          <FormInput
            name="gstin"
            control={control}
            label="GSTIN"
            placeholder="29ABCDE1234F1Z5"
            icon="document-outline"
            maxLength={15}
            autoCapitalize="characters"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.submitButtonText}>Add Supplier</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: { flexDirection: 'row', gap: Spacing.md },
  columnHalf: { flex: 1 },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: 'white', fontSize: Typography.fontSize.base, fontWeight: '700' },
});
