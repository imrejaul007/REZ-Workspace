import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { showAlert } from '@/utils/alert';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { priveCampaignsService } from '@/services/api';
import { logger } from '@/utils/logger';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  title: string;
  hashtag: string;
  platforms: {
    instagram: boolean;
    twitter: boolean;
    youtube: boolean;
  };
  deadline: Date;
  coinsPerApproval: number;
  rewardType: 'rez' | 'promo';
  maxSubmissions: number;
  minFollowers: number;
  priveTierRequired: 'none' | 'entry' | 'signature' | 'elite';
}

const INITIAL_FORM: FormData = {
  title: '',
  hashtag: '',
  platforms: { instagram: false, twitter: false, youtube: false },
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  coinsPerApproval: 100,
  rewardType: 'rez',
  maxSubmissions: 1000,
  minFollowers: 1000,
  priveTierRequired: 'none',
};

export default function CreateCampaignScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const storeId = params.id as string;

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleDateChange = (event, selectedDate?: Date) => {
    if (selectedDate) {
      updateForm({ deadline: selectedDate });
    }
    setShowDatePicker(false);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.title.trim()) {
        showAlert('Error', 'Please enter a campaign title');
        return;
      }
      if (!form.hashtag.trim()) {
        showAlert('Error', 'Please enter a hashtag');
        return;
      }
      const hasPlatform =
        form.platforms.instagram || form.platforms.twitter || form.platforms.youtube;
      if (!hasPlatform) {
        showAlert('Error', 'Please select at least one platform');
        return;
      }
      const now = new Date();
      if (form.deadline <= now) {
        showAlert('Error', 'Deadline must be in the future');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (form.coinsPerApproval <= 0) {
        showAlert('Error', 'Coins per approval must be greater than 0');
        return;
      }
      if (form.maxSubmissions <= 0) {
        showAlert('Error', 'Max submissions must be greater than 0');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (form.minFollowers < 0) {
        showAlert('Error', 'Minimum followers cannot be negative');
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const payload = {
        title: form.title,
        hashtag: form.hashtag,
        platforms: form.platforms,
        deadline: form.deadline.toISOString(),
        coinsPerApproval: form.coinsPerApproval,
        rewardType: form.rewardType,
        maxSubmissions: form.maxSubmissions,
        minFollowers: form.minFollowers,
        priveTierRequired: form.priveTierRequired,
        isDraft: true,
      };
      await priveCampaignsService.createCampaign(storeId, payload);
      showAlert('Success', 'Campaign saved as draft');
      router.back();
    } catch (err) {
      if (__DEV__) console.error('Error saving draft:', err);
      showAlert('Error', err.message || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      const payload = {
        title: form.title,
        hashtag: form.hashtag,
        platforms: form.platforms,
        deadline: form.deadline.toISOString(),
        coinsPerApproval: form.coinsPerApproval,
        rewardType: form.rewardType,
        maxSubmissions: form.maxSubmissions,
        minFollowers: form.minFollowers,
        priveTierRequired: form.priveTierRequired,
        isDraft: false,
      };
      await priveCampaignsService.createCampaign(storeId, payload);
      showAlert('Success', 'Campaign published successfully');
      router.back();
    } catch (err) {
      if (__DEV__) console.error('Error publishing campaign:', err);
      showAlert('Error', err.message || 'Failed to publish campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Campaign</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.progressItem}>
            <View style={[styles.progressCircle, s <= step && styles.progressCircleActive]}>
              <Text style={[styles.progressNumber, s <= step && styles.progressNumberActive]}>
                {s}
              </Text>
            </View>
            {s < 4 && <View style={[styles.progressLine, s < step && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <View style={styles.stepIndicator}>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Campaign Details</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Campaign Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Summer Special 2024"
                value={form.title}
                onChangeText={(text) => updateForm({ title: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hashtag</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., #SummerSpecial2024"
                value={form.hashtag}
                onChangeText={(text) => updateForm({ hashtag: text })}
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>Platforms</Text>
            <View style={styles.platformGroup}>
              {[
                { key: 'instagram', label: 'Instagram' },
                { key: 'twitter', label: 'Twitter' },
                { key: 'youtube', label: 'YouTube' },
              ].map((platform) => (
                <TouchableOpacity
                  key={platform.key}
                  style={[
                    styles.platformOption,
                    form.platforms[platform.key as keyof typeof form.platforms] &&
                      styles.platformOptionSelected,
                  ]}
                  onPress={() =>
                    updateForm({
                      platforms: {
                        ...form.platforms,
                        [platform.key]:
                          !form.platforms[platform.key as keyof typeof form.platforms],
                      },
                    })
                  }
                >
                  <Ionicons
                    name={
                      form.platforms[platform.key as keyof typeof form.platforms]
                        ? 'checkbox'
                        : 'checkbox-outline'
                    }
                    size={20}
                    color={
                      form.platforms[platform.key as keyof typeof form.platforms]
                        ? '#3B82F6'
                        : '#D1D5DB'
                    }
                  />
                  <Text style={styles.platformLabel}>{platform.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Deadline</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                <Text style={styles.dateText}>{form.deadline.toLocaleDateString('en-IN')}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.deadline}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>
          </View>
        )}

        {/* Step 2: Rewards */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Rewards Setup</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Coins Per Approval</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 100"
                value={String(form.coinsPerApproval)}
                onChangeText={(text) => updateForm({ coinsPerApproval: parseInt(text) || 0 })}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Reward Type</Text>
              <View style={styles.radioGroup}>
                {[
                  { key: 'rez', label: 'REZ Coins' },
                  { key: 'promo', label: 'Promo Coins' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={styles.radioOption}
                    onPress={() => updateForm({ rewardType: type.key as 'rez' | 'promo' })}
                  >
                    <Ionicons
                      name={form.rewardType === type.key ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={form.rewardType === type.key ? '#3B82F6' : '#D1D5DB'}
                    />
                    <Text style={styles.radioLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Max Submissions Allowed</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1000"
                value={String(form.maxSubmissions)}
                onChangeText={(text) => updateForm({ maxSubmissions: parseInt(text) || 0 })}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          </View>
        )}

        {/* Step 3: Eligibility */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Eligibility Requirements</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Minimum Followers</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1000"
                value={String(form.minFollowers)}
                onChangeText={(text) => updateForm({ minFollowers: parseInt(text) || 0 })}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Privé Tier Required</Text>
              <View style={styles.tierGroup}>
                {[
                  { key: 'none', label: 'No Requirement' },
                  { key: 'silver', label: 'Silver & Above' },
                  { key: 'gold', label: 'Gold & Above' },
                  { key: 'platinum', label: 'Platinum Only' },
                ].map((tier) => (
                  <TouchableOpacity
                    key={tier.key}
                    style={[
                      styles.tierOption,
                      form.priveTierRequired === tier.key && styles.tierOptionSelected,
                    ]}
                    onPress={() => updateForm({ priveTierRequired: tier.key as 'none' | 'entry' | 'signature' | 'elite' })}
                  >
                    <Text
                      style={[
                        styles.tierLabel,
                        form.priveTierRequired === tier.key && styles.tierLabelSelected,
                      ]}
                    >
                      {tier.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Review Campaign</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Title</Text>
              <Text style={styles.reviewValue}>{form.title}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Hashtag</Text>
              <Text style={styles.reviewValue}>{form.hashtag}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Platforms</Text>
              <Text style={styles.reviewValue}>
                {[
                  form.platforms.instagram && 'Instagram',
                  form.platforms.twitter && 'Twitter',
                  form.platforms.youtube && 'YouTube',
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Deadline</Text>
              <Text style={styles.reviewValue}>{form.deadline.toLocaleDateString('en-IN')}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Reward</Text>
              <Text style={styles.reviewValue}>
                {form.coinsPerApproval} {form.rewardType === 'rez' ? 'REZ' : 'Promo'} coins per
                approval
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Max Submissions</Text>
              <Text style={styles.reviewValue}>{form.maxSubmissions}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Min Followers</Text>
              <Text style={styles.reviewValue}>{form.minFollowers}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Privé Tier</Text>
              <Text style={styles.reviewValue}>
                {form.priveTierRequired.charAt(0).toUpperCase() + form.priveTierRequired.slice(1)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleBack}
          disabled={step === 1 || loading}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>

        {step < 4 ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.finalButtonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { flex: 1 }]}
              onPress={handleSaveDraft}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.secondaryButtonText}>Save Draft</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { flex: 1, marginLeft: 12 }]}
              onPress={handlePublish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  progressItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#3B82F6',
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  progressLineActive: {
    backgroundColor: '#3B82F6',
  },
  stepIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  platformGroup: {
    gap: 10,
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  platformOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  platformLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  radioGroup: {
    gap: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  tierGroup: {
    gap: 10,
  },
  tierOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  tierOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  tierLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  tierLabelSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  finalButtonContainer: {
    flexDirection: 'row',
    flex: 1,
  },
});
