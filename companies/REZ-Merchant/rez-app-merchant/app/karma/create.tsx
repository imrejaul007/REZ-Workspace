/**
 * Create Karma Campaign Screen
 * Form for creating a new karma campaign
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

import {
  karmaCampaignService,
  CreateCampaignData,
  KarmaCampaignType,
} from '@/services/api/karma';
import { BRAND } from '@/constants/brand';
import { logger } from '@/utils/logger';
import ErrorModal from '@/components/common/ErrorModal';
import SuccessModal from '@/components/common/SuccessModal';

// Campaign type options
const CAMPAIGN_TYPES: { value: KarmaCampaignType; label: string; emoji: string }[] = [
  { value: 'blood-donation', label: 'Blood Donation', emoji: '🩸' },
  { value: 'food-distribution', label: 'Food Distribution', emoji: '🍱' },
  { value: 'ngo-support', label: 'NGO Support', emoji: '🤝' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

// Verification methods
const VERIFICATION_METHODS = [
  { value: 'manual' as const, label: 'Manual Approval', icon: 'person' },
  { value: 'qr' as const, label: 'QR Code Scan', icon: 'qr-code' },
  { value: 'geo' as const, label: 'Location Check', icon: 'location' },
];

export default function CreateCampaignScreen() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState<KarmaCampaignType>('blood-donation');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [coinsReward, setCoinsReward] = useState('');
  const [bonusCoins, setBonusCoins] = useState('');
  const [capacityGoal, setCapacityGoal] = useState('');
  const [selectedVerificationMethods, setSelectedVerificationMethods] = useState<('manual' | 'qr' | 'geo')[]>(['manual']);
  const [geoFenceRadius, setGeoFenceRadius] = useState('500');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [requirements, setRequirements] = useState<{ text: string; isMandatory: boolean }[]>([]);
  const [newRequirement, setNewRequirement] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, title: '', message: '' });

  const toggleVerificationMethod = (method: 'manual' | 'qr' | 'geo') => {
    setSelectedVerificationMethods((prev) => {
      if (prev.includes(method)) {
        return prev.filter((m) => m !== method);
      }
      return [...prev, method];
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setRequirements([...requirements, { text: newRequirement.trim(), isMandatory: false }]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const toggleRequirementMandatory = (index: number) => {
    setRequirements(
      requirements.map((req, i) =>
        i === index ? { ...req, isMandatory: !req.isMandatory } : req
      )
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setErrorModal({ visible: true, title: 'Validation Error', message: 'Campaign name is required' });
      return false;
    }
    if (!description.trim()) {
      setErrorModal({ visible: true, title: 'Validation Error', message: 'Description is required' });
      return false;
    }
    if (!coinsReward || parseInt(coinsReward) < 1) {
      setErrorModal({ visible: true, title: 'Validation Error', message: 'Reward coins must be at least 1' });
      return false;
    }
    if (selectedVerificationMethods.length === 0) {
      setErrorModal({ visible: true, title: 'Validation Error', message: 'Select at least one verification method' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const campaignData: CreateCampaignData = {
        name: name.trim(),
        description: description.trim(),
        type: campaignType,
        location: locationAddress.trim()
          ? {
              address: locationAddress.trim(),
              city: locationCity.trim() || undefined,
            }
          : undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        rewards: {
          coins: parseInt(coinsReward),
          bonusCoins: bonusCoins ? parseInt(bonusCoins) : undefined,
        },
        capacity: capacityGoal ? { goal: parseInt(capacityGoal) } : undefined,
        benefits: benefits.length > 0 ? benefits : undefined,
        requirements: requirements.length > 0 ? requirements : undefined,
        verificationMethods: selectedVerificationMethods,
        geoFenceRadius:
          selectedVerificationMethods.includes('geo') && geoFenceRadius
            ? parseInt(geoFenceRadius)
            : undefined,
      };

      await karmaCampaignService.createCampaign(campaignData);

      setSuccessModal({
        visible: true,
        title: 'Success',
        message: 'Campaign created successfully!',
      });

      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      logger.error('Error creating campaign:', error);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to create campaign',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Campaign Type Selection */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text style={styles.sectionTitle}>Campaign Type</Text>
            <View style={styles.typeGrid}>
              {CAMPAIGN_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeCard,
                    campaignType === type.value && styles.typeCardSelected,
                  ]}
                  onPress={() => setCampaignType(type.value)}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      campaignType === type.value && styles.typeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Basic Info */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Blood Donation Drive"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your campaign..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          {/* Location */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={locationAddress}
                onChangeText={setLocationAddress}
                placeholder="Event venue address"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <TextInput
                style={styles.textInput}
                value={locationCity}
                onChangeText={setLocationCity}
                placeholder="City name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </Animated.View>

          {/* Dates */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  <Text style={styles.dateText}>
                    {startDate ? formatDate(startDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  <Text style={styles.dateText}>
                    {endDate ? formatDate(endDate) : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Rewards */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.sectionTitle}>Rewards</Text>
            <View style={styles.rewardsGrid}>
              <View style={styles.rewardField}>
                <Text style={styles.inputLabel}>{BRAND.COIN_NAME} *</Text>
                <View style={styles.coinInputContainer}>
                  <Ionicons name="wallet" size={18} color="#10B981" />
                  <TextInput
                    style={styles.coinInput}
                    value={coinsReward}
                    onChangeText={setCoinsReward}
                    placeholder="100"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.rewardField}>
                <Text style={styles.inputLabel}>Bonus Coins</Text>
                <View style={styles.coinInputContainer}>
                  <Ionicons name="star" size={18} color="#F59E0B" />
                  <TextInput
                    style={styles.coinInput}
                    value={bonusCoins}
                    onChangeText={setBonusCoins}
                    placeholder="50"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Capacity */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <Text style={styles.sectionTitle}>Capacity</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Participants</Text>
              <View style={styles.coinInputContainer}>
                <Ionicons name="people" size={18} color="#8B5CF6" />
                <TextInput
                  style={[styles.coinInput, { flex: 1 }]}
                  value={capacityGoal}
                  onChangeText={setCapacityGoal}
                  placeholder="100"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Animated.View>

          {/* Verification Methods */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text style={styles.sectionTitle}>Verification Methods</Text>
            <View style={styles.verificationGrid}>
              {VERIFICATION_METHODS.map((method) => {
                const isSelected = selectedVerificationMethods.includes(method.value);
                return (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.verificationCard,
                      isSelected && styles.verificationCardSelected,
                    ]}
                    onPress={() => toggleVerificationMethod(method.value)}
                  >
                    <Ionicons
                      name={method.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={isSelected ? '#8B5CF6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.verificationLabel,
                        isSelected && styles.verificationLabelSelected,
                      ]}
                    >
                      {method.label}
                    </Text>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedVerificationMethods.includes('geo') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Geo-fence Radius (meters)</Text>
                <View style={styles.coinInputContainer}>
                  <Ionicons name="location" size={18} color="#3B82F6" />
                  <TextInput
                    style={[styles.coinInput, { flex: 1 }]}
                    value={geoFenceRadius}
                    onChangeText={setGeoFenceRadius}
                    placeholder="500"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Benefits */}
          <Animated.View entering={FadeInDown.delay(450).springify()}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={newBenefit}
                onChangeText={setNewBenefit}
                placeholder="Add a benefit..."
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={addBenefit}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addBenefit}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsContainer}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{benefit}</Text>
                  <TouchableOpacity onPress={() => removeBenefit(index)}>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Requirements */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={newRequirement}
                onChangeText={setNewRequirement}
                placeholder="Add a requirement..."
                placeholderTextColor="#9CA3AF"
                onSubmitEditing={addRequirement}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={addRequirement}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.requirementsList}>
              {requirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <TouchableOpacity
                    style={styles.requirementCheck}
                    onPress={() => toggleRequirementMandatory(index)}
                  >
                    <Ionicons
                      name={req.isMandatory ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={req.isMandatory ? '#EF4444' : '#6B7280'}
                    />
                  </TouchableOpacity>
                  <Text style={styles.requirementText}>
                    {req.text}
                    {req.isMandatory && <Text style={styles.mandatory}> *</Text>}
                  </Text>
                  <TouchableOpacity onPress={() => removeRequirement(index)}>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInDown.delay(550)} style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Create Campaign</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      {/* Modals */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ visible: false, title: '', message: '' })}
      />
      <SuccessModal
        visible={successModal.visible}
        title={successModal.title}
        message={successModal.message}
        onClose={() => setSuccessModal({ visible: false, title: '', message: '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#8B5CF6',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    fontSize: 15,
    color: '#1F2937',
  },
  rewardsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rewardField: {
    flex: 1,
  },
  coinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  coinInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  verificationGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  verificationCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  verificationCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  verificationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  verificationLabelSelected: {
    color: '#8B5CF6',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addTagButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tagText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  requirementCheck: {
    padding: 2,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  mandatory: {
    color: '#EF4444',
    fontWeight: '600',
  },
  submitContainer: {
    marginTop: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
