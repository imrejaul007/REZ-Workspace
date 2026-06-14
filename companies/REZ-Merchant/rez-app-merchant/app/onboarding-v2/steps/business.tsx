/**
 * Business Step - Combined Business + Store Information
 * Step 1 of 4: Essential info in under 3 minutes
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import StepCard from '../components/StepCard';
import FormField from '../components/FormFields';
import CategorySelector from '../components/CategorySelector';
import { Colors } from '@/constants/Colors';

// Category options with smart defaults
const businessCategories = [
  { value: 'Food & Beverage', label: 'Restaurant', icon: 'restaurant-outline', defaultServices: ['onlineOrdering', 'scanAndPay', 'loyaltyStamps', 'menuQr'] },
  { value: 'Retail', label: 'Retail Shop', icon: 'storefront-outline', defaultServices: ['scanAndPay', 'loyaltyStamps'] },
  { value: 'Hotel', label: 'Hotel', icon: 'bed-outline', defaultServices: ['menuQr', 'tableReservations'] },
  { value: 'Services', label: 'Services', icon: 'build-outline', defaultServices: ['scanAndPay', 'loyaltyStamps'] },
  { value: 'Salon', label: 'Salon & Spa', icon: 'cut-outline', defaultServices: ['scanAndPay', 'loyaltyStamps'] },
  { value: 'Gym', label: 'Fitness', icon: 'fitness-outline', defaultServices: ['scanAndPay'] },
];

const businessTypes = [
  { value: 'sole_proprietor', label: 'Individual' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'pvt_ltd', label: 'Company' },
];

export default function BusinessStep() {
  const router = useRouter();
  const { businessInfo, setBusinessInfo, applySmartDefaults, setStep, nextStep } = useOnboardingStore();

  // Form state
  const [businessName, setBusinessName] = useState(businessInfo.businessName || '');
  const [ownerName, setOwnerName] = useState(businessInfo.ownerName || '');
  const [phone, setPhone] = useState(businessInfo.phone || '');
  const [email, setEmail] = useState(businessInfo.email || '');
  const [businessType, setBusinessType] = useState(businessInfo.businessType || 'sole_proprietor');
  const [category, setCategory] = useState(businessInfo.businessCategory || '');
  const [storeName, setStoreName] = useState(businessInfo.storeName || '');
  const [address, setAddress] = useState(businessInfo.address?.street || '');
  const [city, setCity] = useState(businessInfo.address?.city || '');
  const [state, setState] = useState(businessInfo.address?.state || '');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect location (mock - in real app would use geolocation)
  const detectLocation = () => {
    // Simulated location detection
    setAddress('123 Main Street, Sector 15');
    setCity('Mumbai');
    setState('Maharashtra');
  };

  // Auto-fill from GSTIN (mock - in real app would call GST API)
  const handleGstinLookup = () => {
    // Mock GSTIN lookup
    const mockGstData = {
      businessName: 'Sharma Enterprises Pvt Ltd',
      businessType: 'pvt_ltd',
      address: '45 Industrial Area, Phase II',
      city: 'Delhi',
      state: 'Delhi',
    };

    setBusinessName(mockGstData.businessName);
    setBusinessType(mockGstData.businessType);
    setAddress(mockGstData.address);
    setCity(mockGstData.city);
    setState(mockGstData.state);
  };

  // Handle category selection with smart defaults
  const handleCategorySelect = (value: string, defaultServices?: string[]) => {
    setCategory(value);
    applySmartDefaults(value);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (businessName.trim().length < 3) {
      newErrors.businessName = 'Business name must be at least 3 characters';
    }

    if (!ownerName.trim()) {
      newErrors.ownerName = 'Owner name is required';
    } else if (ownerName.trim().length < 3) {
      newErrors.ownerName = 'Owner name must be at least 3 characters';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Enter valid 10-digit phone';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!category) {
      newErrors.category = 'Select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue
  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    // Save to store
    setBusinessInfo({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      businessType,
      businessCategory: category,
      storeName: storeName.trim() || businessName.trim(), // Default to business name
      address: address.trim() ? {
        street: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: '',
        country: 'India',
      } : undefined,
    });

    // Move to next step
    setStep(2);
    nextStep();
    router.push('/onboarding-v2/steps/services');
  };

  // Handle skip
  const handleSkip = () => {
    Alert.alert(
      'Skip Address?',
      'You can add your store address later from settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => {
            setBusinessInfo({
              businessName: businessName.trim(),
              ownerName: ownerName.trim(),
              phone: phone.trim(),
              email: email.trim() || undefined,
              businessType,
              businessCategory: category,
              storeName: storeName.trim() || businessName.trim(),
            });
            setStep(2);
            nextStep();
            router.push('/onboarding-v2/steps/services');
          },
        },
      ]
    );
  };

  return (
    <StepCard
      title="Let's set up your store"
      subtitle="Takes less than 5 minutes. Fill what you can now, add the rest later."
      onContinue={handleContinue}
      continueLabel="Continue"
      disabled={!businessName || !ownerName || !phone || !category}
    >
      {/* Required Fields Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required</Text>

        <FormField
          label="Business Name"
          icon="business-outline"
          placeholder="Your business name"
          value={businessName}
          onChangeText={setBusinessName}
          error={errors.businessName}
          required
          autoCapitalize="words"
        />

        <FormField
          label="Owner Name"
          icon="person-outline"
          placeholder="Your full name"
          value={ownerName}
          onChangeText={setOwnerName}
          error={errors.ownerName}
          required
          autoCapitalize="words"
        />

        <FormField
          label="Phone Number"
          icon="call-outline"
          placeholder="10-digit mobile number"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          required
          keyboardType="phone-pad"
          maxLength={10}
          helperText="Auto-filled via OTP verification"
        />

        <FormField
          label="Email"
          icon="mail-outline"
          placeholder="owner@business.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          optional
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Business Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Type</Text>
        <View style={styles.typeRow}>
          {businessTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.typeButton, businessType === type.value && styles.typeButtonSelected]}
              onPress={() => setBusinessType(type.value)}
            >
              <Text style={[styles.typeText, businessType === type.value && styles.typeTextSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.section}>
        <CategorySelector
          label="What type of business? *"
          options={businessCategories}
          selectedValue={category}
          onSelect={handleCategorySelect}
          error={errors.category}
        />
      </View>

      {/* Optional Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Details (Optional)</Text>

        <FormField
          label="Store Name"
          icon="storefront-outline"
          placeholder="Same as business name"
          value={storeName}
          onChangeText={setStoreName}
          optional
          helperText="If different from business name"
        />

        <View style={styles.addressRow}>
          <TouchableOpacity style={styles.detectButton} onPress={detectLocation}>
            <Ionicons name="location" size={18} color={Colors.light.primary} />
            <Text style={styles.detectText}>Detect Location</Text>
          </TouchableOpacity>
        </View>

        <FormField
          label="Street Address"
          icon="location-outline"
          placeholder="Building, street, landmark"
          value={address}
          onChangeText={setAddress}
          optional
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField
              label="City"
              placeholder="City"
              value={city}
              onChangeText={setCity}
              optional
            />
          </View>
          <View style={styles.halfField}>
            <FormField
              label="State"
              placeholder="State"
              value={state}
              onChangeText={setState}
              optional
            />
          </View>
        </View>

        {/* GSTIN Lookup */}
        <TouchableOpacity style={styles.gstinButton} onPress={handleGstinLookup}>
          <Ionicons name="search" size={18} color={Colors.light.primary} />
          <Text style={styles.gstinText}>Look up GSTIN details</Text>
        </TouchableOpacity>
      </View>

      {/* Skip notice */}
      <View style={styles.skipNotice}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.light.textSecondary} />
        <Text style={styles.skipNoticeText}>
          Fields marked optional can be completed later from Settings
        </Text>
      </View>
    </StepCard>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
  },
  typeButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  typeTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: `${Colors.light.primary}10`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  detectText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  gstinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    marginTop: 4,
  },
  gstinText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  skipNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    marginTop: 8,
  },
  skipNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
