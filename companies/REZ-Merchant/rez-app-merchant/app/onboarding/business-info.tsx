/**
 * Business Info Screen - Onboarding Step 1/5
 * Collects business information including business name, type, registration details, owner info
 */

import React, { useState, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import FormInput from '../../components/forms/FormInput';
import { onboardingService } from '../../services/api/onboarding';
import { BusinessInfoStep } from '../../types/onboarding';
import { Colors } from '../../constants/Colors';
import { logger } from '@/utils/logger';

// Define validation schema matching BusinessInfoStep
const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .min(3, 'Business name must be at least 3 characters'),
  ownerName: z
    .string()
    .min(1, 'Owner name is required')
    .min(3, 'Owner name must be at least 3 characters'),
  ownerEmail: z.string().min(1, 'Email is required').email('Invalid email format'),
  ownerPhone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  businessType: z.enum(
    ['sole_proprietor', 'partnership', 'pvt_ltd', 'llp', 'other'] as const,
    { message: 'Please select a business type' }
  ),
  businessCategory: z.string().min(1, 'Business category is required'),
  businessSubcategory: z.string().optional(),
  yearsInBusiness: z
    .number()
    .min(0, 'Years in business cannot be negative')
    .max(150, 'Invalid years in business'),
  businessDescription: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  isGstRegistered: z.boolean().optional(),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  gstRate: z.enum(['0', '5', '12', '18', '28'] as const).optional(),
  defaultHsnSac: z.string().optional(),
});

type BusinessInfoFormData = z.infer<typeof businessInfoSchema>;

const gstRateOptions = [
  { label: 'No GST (0%)', value: '0' },
  { label: '5%', value: '5' },
  { label: '12%', value: '12' },
  { label: '18%', value: '18' },
  { label: '28%', value: '28' },
];

const businessTypes = [
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'other', label: 'Other' },
];

const businessCategories = [
  'Retail',
  'Food & Beverage',
  'Fashion & Apparel',
  'Electronics',
  'Health & Wellness',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Services',
  'Travel & Tourism',
  'Hotel & Hospitality',
  'Other',
];

const hotelPropertyTypes = [
  { value: 'boutique', label: 'Boutique' },
  { value: 'resort', label: 'Resort' },
  { value: 'business', label: 'Business Hotel' },
  { value: 'budget', label: 'Budget / Economy' },
  { value: 'heritage', label: 'Heritage / Homestay' },
];

export default function BusinessInfoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Removed selectedBusinessType / selectedCategory local state —
  // they duplicated what react-hook-form already tracks. Use watch() values
  // directly so there is a single source of truth and no sync risk.
  const [showGstFields, setShowGstFields] = useState(false);
  const [hotelPropertyType, setHotelPropertyType] = useState('');
  const [hotelRoomCount, setHotelRoomCount] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: '',
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      businessType: 'sole_proprietor',
      businessCategory: '',
      businessSubcategory: '',
      yearsInBusiness: 0,
      businessDescription: '',
      website: '',
      isGstRegistered: false,
      gstin: '',
      gstRate: '18',
      defaultHsnSac: '',
    },
  });

  // Watch form values directly — no local state needed for these
  const isGstRegistered = watch('isGstRegistered');
  const selectedBusinessType = watch('businessType') ?? '';
  const selectedCategory = watch('businessCategory') ?? '';

  useEffect(() => {
    setShowGstFields(isGstRegistered || false);
  }, [isGstRegistered]);

  // Load existing data if available
  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const status = await onboardingService.getOnboardingStatus();
      if (status.data.businessInfo) {
        const businessInfo = status.data.businessInfo;
        Object.keys(businessInfo).forEach((key) => {
          setValue(key as keyof BusinessInfoFormData, (businessInfo as unknown as Record<string, unknown>)[key] as BusinessInfoFormData[keyof BusinessInfoFormData]);
        });
        // No separate local state to set — watch() derives values from the form
      }
    } catch (error) {
      if (__DEV__) console.error('Error loading business info:', error);
    }
  };

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      setLoading(true);

      // Convert form data to BusinessInfoStep
      const stepData: BusinessInfoStep = {
        ...data,
        socialMediaLinks: {},
      };

      // Submit step to API
      await onboardingService.submitStep(1, stepData);

      // Navigate to next step
      router.push('/onboarding/store-details');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to save business information');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepBar}>
        <View style={[styles.stepProgress, { width: '20%' }]} />
      </View>
      <Text style={styles.stepText}>Step 1 of 5</Text>
    </View>
  );

  const renderBusinessTypeSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Business Type *</Text>
      <View style={styles.optionsGrid}>
        {businessTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.optionButton,
              selectedBusinessType === type.value && styles.optionButtonSelected,
            ]}
            onPress={() => {
              setValue('businessType', type.value as 'sole_proprietor' | 'partnership' | 'pvt_ltd' | 'llp' | 'other');
            }}
          >
            <Text
              style={[
                styles.optionText,
                selectedBusinessType === type.value && styles.optionTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.businessType && <Text style={styles.errorText}>{errors.businessType.message}</Text>}
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Business Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {businessCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipSelected,
            ]}
            onPress={() => {
              setValue('businessCategory', category);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextSelected,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.businessCategory && (
        <Text style={styles.errorText}>{errors.businessCategory.message}</Text>
      )}
    </View>
  );

  const renderHotelFields = () => {
    if (selectedCategory !== 'Hotel & Hospitality') return null;
    return (
      <View style={styles.hotelSection}>
        <View style={styles.hotelSectionHeader}>
          <Ionicons name="bed-outline" size={18} color="#0891B2" />
          <Text style={styles.hotelSectionTitle}>Hotel Details</Text>
        </View>

        <View style={styles.selectorContainer}>
          <Text style={styles.label}>Property Type</Text>
          <View style={styles.optionsGrid}>
            {hotelPropertyTypes.map((pt) => (
              <TouchableOpacity
                key={pt.value}
                style={[
                  styles.optionButton,
                  hotelPropertyType === pt.value && styles.optionButtonSelected,
                ]}
                onPress={() => setHotelPropertyType(pt.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    hotelPropertyType === pt.value && styles.optionTextSelected,
                  ]}
                >
                  {pt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.roomCountRow}>
          <Text style={styles.label}>Number of Rooms</Text>
          <View style={styles.roomCountControls}>
            <TouchableOpacity
              style={styles.roomCountBtn}
              onPress={() => setHotelRoomCount((v) => String(Math.max(1, (parseInt(v) || 1) - 1)))}
            >
              <Ionicons name="remove" size={18} color="#0891B2" />
            </TouchableOpacity>
            <Text style={styles.roomCountValue}>{hotelRoomCount || '—'}</Text>
            <TouchableOpacity
              style={styles.roomCountBtn}
              onPress={() => setHotelRoomCount((v) => String((parseInt(v) || 0) + 1))}
            >
              <Ionicons name="add" size={18} color="#0891B2" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hotelInfoBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#0891B2" />
          <Text style={styles.hotelInfoText}>
            After onboarding, connect your Property Management System (PMS) from the hotel settings
            to sync live inventory and enable REZ bookings.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Information</Text>
        <View style={styles.placeholder} />
      </View>

      {renderStepIndicator()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Tell us about your business</Text>
        <Text style={styles.sectionDescription}>
          This information helps us verify your business and set up your account
        </Text>

        <FormInput
          name="businessName"
          control={control}
          label="Business Name *"
          placeholder="Enter your business name"
          icon="business-outline"
          autoCapitalize="words"
        />

        {renderBusinessTypeSelector()}

        {renderCategorySelector()}

        {renderHotelFields()}

        <FormInput
          name="businessSubcategory"
          control={control}
          label="Business Subcategory (Optional)"
          placeholder="E.g., Italian Restaurant, Men's Fashion"
          icon="pricetag-outline"
          autoCapitalize="words"
        />

        <FormInput
          name="yearsInBusiness"
          control={control}
          label="Years in Business *"
          placeholder="0"
          keyboardType="numeric"
          icon="calendar-outline"
        />

        <FormInput
          name="businessDescription"
          control={control}
          label="Business Description (Optional)"
          placeholder="Brief description of your business"
          multiline
          numberOfLines={3}
          maxLength={500}
          showCharCount
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Owner Information</Text>

        <FormInput
          name="ownerName"
          control={control}
          label="Owner Name *"
          placeholder="Enter owner's full name"
          icon="person-outline"
          autoCapitalize="words"
        />

        <FormInput
          name="ownerEmail"
          control={control}
          label="Email Address *"
          placeholder="owner@business.com"
          keyboardType="email-address"
          icon="mail-outline"
          autoCapitalize="none"
          autoComplete="email"
        />

        <FormInput
          name="ownerPhone"
          control={control}
          label="Phone Number *"
          placeholder="9876543210"
          keyboardType="phone-pad"
          icon="call-outline"
          maxLength={10}
          helperText="10-digit mobile number without country code"
        />

        <FormInput
          name="website"
          control={control}
          label="Website (Optional)"
          placeholder="https://www.yourbusiness.com"
          keyboardType="url"
          icon="globe-outline"
          autoCapitalize="none"
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>GST Details (Optional)</Text>

        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Is your business GST registered?</Text>
          <TouchableOpacity
            style={[styles.toggleButton, showGstFields && styles.toggleButtonActive]}
            onPress={() => {
              setValue('isGstRegistered', !isGstRegistered);
              setShowGstFields(!showGstFields);
            }}
          >
            <Animated.View style={[styles.toggleCircle, { marginLeft: showGstFields ? 20 : 2 }]} />
          </TouchableOpacity>
        </View>

        {showGstFields && (
          <>
            <FormInput
              name="gstin"
              control={control}
              label="GSTIN (15 characters)"
              placeholder="29ABCDE1234F1Z5"
              icon="document-outline"
              maxLength={15}
              autoCapitalize="characters"
              helperText="Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>GST Rate *</Text>
              <View style={styles.pickerWrapper}>
                {gstRateOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.gstRateButton,
                      watch('gstRate') === option.value && styles.gstRateButtonSelected,
                    ]}
                    onPress={() => setValue('gstRate', option.value as '0' | '5' | '12' | '18' | '28')}
                  >
                    <Text
                      style={[
                        styles.gstRateText,
                        watch('gstRate') === option.value && styles.gstRateTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FormInput
              name="defaultHsnSac"
              control={control}
              label="Default HSN/SAC Code (Optional)"
              placeholder="1234"
              icon="code-outline"
              maxLength={8}
              keyboardType="numeric"
              helperText="6 or 8-digit code for invoicing"
            />
          </>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
  },
  stepBar: {
    height: 4,
    backgroundColor: Colors.light.borderLight,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  stepProgress: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
    minWidth: '48%',
  },
  optionButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
    marginHorizontal: 4,
  },
  categoryChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 6,
  },
  spacer: {
    height: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  toggleButton: {
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.borderMedium,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gstRateButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
  },
  gstRateButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  gstRateText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  gstRateTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },

  // Hotel-specific styles
  hotelSection: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
    marginBottom: 16,
  },
  hotelSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  hotelSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0891B2',
  },
  roomCountRow: {
    marginBottom: 16,
  },
  roomCountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roomCountBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 40,
    textAlign: 'center',
  },
  hotelInfoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 10,
  },
  hotelInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
});
