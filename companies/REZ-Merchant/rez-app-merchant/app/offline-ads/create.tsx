/**
 * Create Offline Ad Screen
 *
 * Form to create a new offline advertisement:
 * - Ad type selection (rickshaw, bus, hoarding, billboard)
 * - Location selection
 * - Duration and budget
 * - Offer/discount attachment
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors } from '@/constants/Colors';
import { useMerchant } from '@/contexts/MerchantContext';
import { offlineAdsService, AdType, OfflineAdPayload } from '@/services/offlineAdsService';
import { logger } from '@/utils/logger';

// Ad type configuration
const AD_TYPES: Array<{
  type: AdType;
  label: string;
  icon: string;
  description: string;
  priceRange: string;
}> = [
  {
    type: 'rickshaw',
    label: 'Rickshaw',
    icon: 'car-outline',
    description: 'Auto-rickshaw advertisements',
    priceRange: '₹500 - ₹2,000/month',
  },
  {
    type: 'bus',
    label: 'Bus',
    icon: 'bus-outline',
    description: 'Public transport advertisements',
    priceRange: '₹3,000 - ₹10,000/month',
  },
  {
    type: 'hoarding',
    label: 'Hoarding',
    icon: 'albums-outline',
    description: 'Static billboard displays',
    priceRange: '₹10,000 - ₹50,000/month',
  },
  {
    type: 'billboard',
    label: 'Billboard',
    icon: 'grid-outline',
    description: 'Large format digital displays',
    priceRange: '₹20,000 - ₹1,00,000/month',
  },
];

// Popular locations by city
const POPULAR_LOCATIONS = [
  'Connaught Place, Delhi',
  'Bandra West, Mumbai',
  'MG Road, Bangalore',
  'Koramangala, Bangalore',
  'Jubilee Hills, Hyderabad',
  'Kolkata Park Street',
  'Ahmedabad SG Highway',
  'Pune Koregaon Park',
  'Chennai T Nagar',
  'Jaipur MI Road',
  'Chandigarh Sector 17',
  'Lucknow Hazratganj',
  'Indore AB Road',
  'Nagpur Wardha Road',
  'Varanasi Godowlia',
];

export default function CreateAdScreen() {
  const insets = useSafeAreaInsets();
  const { merchant } = useMerchant();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<AdType | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [customLocation, setCustomLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [budget, setBudget] = useState('');
  const [attachedOffer, setAttachedOffer] = useState('');
  const [terms, setTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const merchantId = merchant?._id || '';

  const handleLocationToggle = useCallback((location: string) => {
    setSelectedLocations((prev) =>
      prev.includes(location) ? prev.filter((l) => l !== location) : [...prev, location]
    );
  }, []);

  const handleAddCustomLocation = useCallback(() => {
    if (customLocation.trim() && !selectedLocations.includes(customLocation.trim())) {
      setSelectedLocations((prev) => [...prev, customLocation.trim()]);
      setCustomLocation('');
    }
  }, [customLocation, selectedLocations]);

  const handleRemoveLocation = useCallback((location: string) => {
    setSelectedLocations((prev) => prev.filter((l) => l !== location));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedType) {
      Alert.alert('Required', 'Please select an ad type');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an ad title');
      return;
    }
    if (selectedLocations.length === 0) {
      Alert.alert('Required', 'Please select at least one location');
      return;
    }
    if (endDate <= startDate) {
      Alert.alert('Invalid Dates', 'End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: OfflineAdPayload = {
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        locations: selectedLocations,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        budget: budget ? parseFloat(budget) : undefined,
        attachedOffer: attachedOffer.trim() || undefined,
        terms: terms.trim() || undefined,
      };

      const result = await offlineAdsService.createOfflineAd(merchantId, payload);

      if (result.success && result.data) {
        Alert.alert('Success', 'Your offline ad has been created!', [
          {
            text: 'View Ad',
            onPress: () => {
              const adId = result.data?.id || result.data?._id;
              if (adId) {
                router.replace(`/offline-ads/${adId}`);
              } else {
                router.back();
              }
            },
          },
          {
            text: 'Back to List',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create ad');
      }
    } catch (error) {
      logger.error('[CreateAd] Error:', error);
      Alert.alert('Error', error?.message || 'Failed to create ad');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    merchantId,
    title,
    description,
    selectedType,
    selectedLocations,
    startDate,
    endDate,
    budget,
    attachedOffer,
    terms,
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {step}
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              currentStep >= step && styles.stepLabelActive,
            ]}
          >
            {step === 1 ? 'Type' : step === 2 ? 'Details' : 'Locations'}
          </Text>
          {step < 3 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Select Ad Type</Text>
      <Text style={styles.sectionSubtitle}>
        Choose the type of offline advertisement you want to create
      </Text>

      <View style={styles.typeGrid}>
        {AD_TYPES.map((adType) => (
          <TouchableOpacity
            key={adType.type}
            style={[
              styles.typeCard,
              selectedType === adType.type && styles.typeCardSelected,
            ]}
            onPress={() => setSelectedType(adType.type)}
          >
            <View
              style={[
                styles.typeIconContainer,
                selectedType === adType.type && styles.typeIconContainerSelected,
              ]}
            >
              <Ionicons
                name={adType.icon as unknown}
                size={28}
                color={selectedType === adType.type ? '#fff' : Colors.light.primary}
              />
            </View>
            <Text
              style={[
                styles.typeLabel,
                selectedType === adType.type && styles.typeLabelSelected,
              ]}
            >
              {adType.label}
            </Text>
            <Text style={styles.typeDescription}>{adType.description}</Text>
            <Text style={styles.typePriceRange}>{adType.priceRange}</Text>
            {selectedType === adType.type && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.secondary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !selectedType && styles.nextButtonDisabled]}
        onPress={() => setCurrentStep(2)}
        disabled={!selectedType}
      >
        <Text style={styles.nextButtonText}>Next: Ad Details</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderDetailsForm = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Ad Details</Text>
      <Text style={styles.sectionSubtitle}>
        Enter the details for your offline advertisement
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ad Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Summer Sale - 50% Off"
          placeholderTextColor={Colors.light.icon}
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your advertisement..."
          placeholderTextColor={Colors.light.icon}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Attached Offer (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Get 20% off on your first order"
          placeholderTextColor={Colors.light.icon}
          value={attachedOffer}
          onChangeText={setAttachedOffer}
          maxLength={200}
        />
      </View>

      <View style={styles.dateRow}>
        <View style={[styles.inputGroup, styles.dateInput]}>
          <Text style={styles.inputLabel}>Start Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.light.icon} />
            <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.inputGroup, styles.dateInput]}>
          <Text style={styles.inputLabel}>End Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.light.icon} />
            <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          minimumDate={startDate}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Budget (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 10000"
          placeholderTextColor={Colors.light.icon}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Terms & Conditions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter unknown terms and conditions..."
          placeholderTextColor={Colors.light.icon}
          value={terms}
          onChangeText={setTerms}
          multiline
          numberOfLines={3}
          maxLength={1000}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(1)}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.light.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, styles.flex1]}
          onPress={() => setCurrentStep(3)}
          disabled={!title.trim()}
        >
          <Text style={styles.nextButtonText}>Next: Locations</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLocationSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Select Locations</Text>
      <Text style={styles.sectionSubtitle}>
        Choose where your ad will be displayed ({selectedLocations.length} selected)
      </Text>

      <View style={styles.locationGrid}>
        {POPULAR_LOCATIONS.map((location) => (
          <TouchableOpacity
            key={location}
            style={[
              styles.locationChip,
              selectedLocations.includes(location) && styles.locationChipSelected,
            ]}
            onPress={() => handleLocationToggle(location)}
          >
            <Ionicons
              name={
                selectedLocations.includes(location)
                  ? 'checkmark-circle'
                  : 'location-outline'
              }
              size={16}
              color={
                selectedLocations.includes(location)
                  ? Colors.light.primary
                  : Colors.light.icon
              }
            />
            <Text
              style={[
                styles.locationChipText,
                selectedLocations.includes(location) && styles.locationChipTextSelected,
              ]}
              numberOfLines={1}
            >
              {location}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.customLocationContainer}>
        <Text style={styles.inputLabel}>Add Custom Location</Text>
        <View style={styles.customLocationRow}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Enter custom location..."
            placeholderTextColor={Colors.light.icon}
            value={customLocation}
            onChangeText={setCustomLocation}
          />
          <TouchableOpacity
            style={styles.addLocationButton}
            onPress={handleAddCustomLocation}
            disabled={!customLocation.trim()}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {selectedLocations.length > 0 && (
        <View style={styles.selectedLocationsContainer}>
          <Text style={styles.selectedLocationsTitle}>Selected Locations:</Text>
          <View style={styles.selectedLocationsList}>
            {selectedLocations.map((location) => (
              <View key={location} style={styles.selectedLocationChip}>
                <Text style={styles.selectedLocationText} numberOfLines={1}>
                  {location}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveLocation(location)}>
                  <Ionicons name="close-circle" size={18} color={Colors.light.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep(2)}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.light.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (selectedLocations.length === 0 || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selectedLocations.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Create Ad</Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" />

      {renderStepIndicator()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderTypeSelection()}
        {currentStep === 2 && renderDetailsForm()}
        {currentStep === 3 && renderLocationSelection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.primary,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#fff',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepNumberActive: {
    color: Colors.light.primary,
  },
  stepLabel: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  stepLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    width: '47%',
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight2,
  },
  typeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.light.primaryLight2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconContainerSelected: {
    backgroundColor: Colors.light.primary,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.textHeading,
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: Colors.light.primary,
  },
  typeDescription: {
    fontSize: 11,
    color: Colors.light.icon,
    marginBottom: 8,
    lineHeight: 16,
  },
  typePriceRange: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateButtonText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locationChipSelected: {
    backgroundColor: Colors.light.primaryLight2,
    borderColor: Colors.light.primary,
  },
  locationChipText: {
    fontSize: 12,
    color: Colors.light.text,
    maxWidth: 140,
  },
  locationChipTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  customLocationContainer: {
    marginBottom: 20,
  },
  customLocationRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  addLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationsContainer: {
    marginBottom: 20,
  },
  selectedLocationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textHeading,
    marginBottom: 10,
  },
  selectedLocationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryLight2,
  },
  selectedLocationText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
    maxWidth: 160,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    flex: 1,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
