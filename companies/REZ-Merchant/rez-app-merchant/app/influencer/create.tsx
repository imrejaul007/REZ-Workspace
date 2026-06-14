/**
 * Create Campaign - Campaign Creation Form
 * Multi-step form to create a new influencer marketing campaign
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as yup from 'yup';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/DesignTokens';
import { campaignService } from '@/services/api/influencer';
import type {
  CampaignObjective,
  InfluencerNiche,
  InfluencerPlatform,
  DeliverableType,
  CreateCampaignPayload,
  Deliverable,
} from '@/types/influencer';
import { Button } from '@/components/ui/Button';
import { logger } from '@/utils/logger';

const OBJECTIVE_OPTIONS: { value: CampaignObjective; label: string; icon: string }[] = [
  { value: 'brand_awareness', label: 'Brand Awareness', icon: 'eye-outline' },
  { value: 'product_launch', label: 'Product Launch', icon: 'rocket-outline' },
  { value: 'sales', label: 'Drive Sales', icon: 'cart-outline' },
  { value: 'engagement', label: 'Increase Engagement', icon: 'heart-outline' },
  { value: 'followers', label: 'Gain Followers', icon: 'people-outline' },
  { value: 'app_installs', label: 'App Installs', icon: 'download-outline' },
  { value: 'website_traffic', label: 'Website Traffic', icon: 'globe-outline' },
  { value: 'lead_generation', label: 'Lead Generation', icon: 'call-outline' },
];

const NICHE_OPTIONS: { value: InfluencerNiche; label: string }[] = [
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'travel', label: 'Travel' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'tech', label: 'Technology' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'business', label: 'Business & Finance' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'health', label: 'Health & Wellness' },
];

const PLATFORM_OPTIONS: { value: InfluencerPlatform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { value: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'logo-tiktok' },
  { value: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
  { value: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
];

const DELIVERABLE_TYPES: { value: DeliverableType; label: string; icon: string }[] = [
  { value: 'story', label: 'Story', icon: 'radio-button-on' },
  { value: 'post', label: 'Feed Post', icon: 'grid-outline' },
  { value: 'reel', label: 'Reel', icon: 'play-circle-outline' },
  { value: 'video', label: 'Video', icon: 'videocam-outline' },
  { value: 'carousel', label: 'Carousel', icon: 'albums-outline' },
  { value: 'live_session', label: 'Live Session', icon: 'radio-outline' },
  { value: 'short_video', label: 'Short Video', icon: 'film-outline' },
  { value: 'review', label: 'Review', icon: 'star-outline' },
];

const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed Budget' },
  { value: 'per_deliverable', label: 'Per Deliverable' },
  { value: 'negotiable', label: 'Negotiable' },
];

interface CampaignFormData {
  name: string;
  description: string;
  objectives: CampaignObjective[];
  niche: InfluencerNiche[];
  platforms: InfluencerPlatform[];
  targetInfluencers: number;
  budgetTotal: number;
  budgetPerInfluencer: number;
  budgetType: 'fixed' | 'per_deliverable' | 'negotiable';
  startDate: Date;
  endDate: Date;
  deliverables: Array<{
    type: DeliverableType;
    title: string;
    description: string;
    quantity: number;
    price: number;
    isRequired: boolean;
  }>;
  terms: string;
  requirements: {
    minFollowers: string;
    minEngagementRate: string;
    verifiedOnly: boolean;
  };
}

const validationSchema = yup.object({
  name: yup.string().required('Campaign name is required').min(3, 'Name must be at least 3 characters'),
  description: yup.string().required('Description is required').min(20, 'Description must be at least 20 characters'),
  objectives: yup.array().min(1, 'Select at least one objective'),
  niche: yup.array().min(1, 'Select at least one niche'),
  platforms: yup.array().min(1, 'Select at least one platform'),
  targetInfluencers: yup.number().required().min(1, 'Target at least 1 influencer'),
  budgetTotal: yup.number().required('Budget is required').min(100, 'Minimum budget is 100'),
  budgetPerInfluencer: yup.number().required('Per-influencer budget is required').min(50, 'Minimum per-influencer budget is 50'),
  budgetType: yup.string().required(),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().required('End date is required').moreThan(yup.ref('startDate'), 'End date must be after start date'),
  deliverables: yup.array().min(1, 'Add at least one deliverable'),
  terms: yup.string(),
  requirements: yup.object({
    minFollowers: yup.string(),
    minEngagementRate: yup.string(),
    verifiedOnly: yup.boolean(),
  }),
});

export default function CreateCampaign() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const scheme = colorScheme ?? 'light';

  const [currentStep, setCurrentStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  const totalSteps = 4;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<CampaignFormData>({
    resolver: yupResolver(validationSchema) as unknown,
    defaultValues: {
      name: '',
      description: '',
      objectives: [],
      niche: [],
      platforms: [],
      targetInfluencers: 5,
      budgetTotal: 10000,
      budgetPerInfluencer: 2000,
      budgetType: 'fixed',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deliverables: [],
      terms: '',
      requirements: {
        minFollowers: '10000',
        minEngagementRate: '2',
        verifiedOnly: false,
      },
    },
  });

  const { fields: deliverableFields, append: appendDeliverable, remove: removeDeliverable } = useFieldArray({
    control,
    name: 'deliverables',
  });

  // Watch form values
  const watchedValues = watch();

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const payload: CreateCampaignPayload = {
        name: data.name,
        description: data.description,
        objectives: data.objectives,
        niche: data.niche,
        platforms: data.platforms,
        targetInfluencers: data.targetInfluencers,
        budget: {
          total: data.budgetTotal,
          perInfluencer: data.budgetPerInfluencer,
          currency: 'INR',
          spendingType: data.budgetType,
        },
        deliverables: data.deliverables.map((d, index) => ({
          id: `deliverable-${index}`,
          type: d.type,
          title: d.title,
          description: d.description,
          quantity: d.quantity,
          platforms: data.platforms,
          isRequired: d.isRequired,
          price: d.price,
        })),
        requirements: [
          ...(data.requirements.minFollowers
            ? [{ id: 'req-1', type: 'min_followers' as const, value: data.requirements.minFollowers, isMandatory: true }]
            : []),
          ...(data.requirements.minEngagementRate
            ? [{ id: 'req-2', type: 'min_engagement_rate' as const, value: data.requirements.minEngagementRate, isMandatory: true }]
            : []),
          ...(data.requirements.verifiedOnly
            ? [{ id: 'req-3', type: 'verified_only' as const, value: 'true', isMandatory: true }]
            : []),
        ],
        timeline: {
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          reviewPeriod: 3,
        },
        terms: data.terms,
      };
      return campaignService.createCampaign(payload);
    },
    onSuccess: (data) => {
      logger.info('[CreateCampaign] Campaign created successfully', { campaignId: data.id });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      Alert.alert('Success', 'Campaign created successfully!', [
        { text: 'View Campaign', onPress: () => router.push(`/influencer/${data.id}`) },
        { text: 'Back to List', onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      logger.error('[CreateCampaign] Failed to create campaign', error);
      Alert.alert('Error', 'Failed to create campaign. Please try again.');
    },
  });

  // Step navigation
  const nextStep = useCallback(async () => {
    let isValid = true;
    if (currentStep === 1) {
      isValid = await trigger(['name', 'description', 'objectives', 'niche', 'platforms']);
    } else if (currentStep === 2) {
      isValid = await trigger(['targetInfluencers', 'budgetTotal', 'budgetPerInfluencer', 'budgetType']);
    } else if (currentStep === 3) {
      isValid = await trigger(['deliverables', 'startDate', 'endDate']);
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  }, [currentStep, router]);

  // Toggle array values
  const toggleArrayValue = useCallback(
    <T extends string>(field: 'objectives' | 'niche' | 'platforms', value: T) => {
      const current = watchedValues[field] as T[];
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setValue(field, newValue as unknown);
    },
    [watchedValues, setValue]
  );

  // Add deliverable
  const addDeliverable = useCallback(() => {
    appendDeliverable({
      type: 'post',
      title: '',
      description: '',
      quantity: 1,
      price: watchedValues.budgetPerInfluencer || 1000,
      isRequired: true,
    });
  }, [appendDeliverable, watchedValues.budgetPerInfluencer]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: step <= currentStep ? Colors.primary[500] : Colors.gray[200],
              },
            ]}
          >
            {step < currentStep ? (
              <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  { color: step <= currentStep ? Colors.text.inverse : Colors.text.secondary },
                ]}
              >
                {step}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.stepLabel,
              { color: step <= currentStep ? Colors.primary[500] : Colors.text.tertiary },
            ]}
          >
            {step === 1 && 'Basics'}
            {step === 2 && 'Budget'}
            {step === 3 && 'Deliverables'}
            {step === 4 && 'Requirements'}
          </Text>
          {step < totalSteps && (
            <View
              style={[
                styles.stepLine,
                { backgroundColor: step < currentStep ? Colors.primary[500] : Colors.gray[200] },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Campaign Basics
            </Text>

            {/* Campaign Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Campaign Name *
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                        color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                        borderColor: errors.name ? Colors.error[500] : Colors.border.default,
                      },
                    ]}
                    placeholder="e.g., Summer Collection Launch 2024"
                    placeholderTextColor={Colors.text.tertiary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Description *
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                        color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                        borderColor: errors.description ? Colors.error[500] : Colors.border.default,
                      },
                    ]}
                    placeholder="Describe your campaign goals and what you're looking for..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                )}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description.message}</Text>
              )}
            </View>

            {/* Objectives */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Campaign Objectives *
              </Text>
              <View style={styles.optionsGrid}>
                {OBJECTIVE_OPTIONS.map((option) => {
                  const isSelected = watchedValues.objectives.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? Colors.primary[500]
                            : scheme === 'dark'
                            ? Colors.gray[800]
                            : Colors.card,
                          borderColor: isSelected ? Colors.primary[500] : Colors.border.default,
                        },
                      ]}
                      onPress={() => toggleArrayValue('objectives', option.value)}
                    >
                      <Ionicons
                        name={option.icon as unknown}
                        size={24}
                        color={isSelected ? Colors.text.inverse : Colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.optionLabel,
                          {
                            color: isSelected ? Colors.text.inverse : Colors.text.secondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.objectives && (
                <Text style={styles.errorText}>{errors.objectives.message}</Text>
              )}
            </View>

            {/* Niche */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Target Niche *
              </Text>
              <View style={styles.chipContainer}>
                {NICHE_OPTIONS.map((option) => {
                  const isSelected = watchedValues.niche.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? Colors.primary[500]
                            : scheme === 'dark'
                            ? Colors.gray[800]
                            : Colors.gray[100],
                        },
                      ]}
                      onPress={() => toggleArrayValue('niche', option.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? Colors.text.inverse : Colors.text.secondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.niche && (
                <Text style={styles.errorText}>{errors.niche.message}</Text>
              )}
            </View>

            {/* Platforms */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Target Platforms *
              </Text>
              <View style={styles.platformContainer}>
                {PLATFORM_OPTIONS.map((option) => {
                  const isSelected = watchedValues.platforms.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.platformCard,
                        {
                          backgroundColor: isSelected
                            ? Colors.primary[500]
                            : scheme === 'dark'
                            ? Colors.gray[800]
                            : Colors.card,
                          borderColor: isSelected ? Colors.primary[500] : Colors.border.default,
                        },
                      ]}
                      onPress={() => toggleArrayValue('platforms', option.value)}
                    >
                      <Ionicons
                        name={option.icon as unknown}
                        size={28}
                        color={isSelected ? Colors.text.inverse : Colors.text.secondary}
                      />
                      <Text
                        style={[
                          styles.platformLabel,
                          {
                            color: isSelected ? Colors.text.inverse : Colors.text.secondary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.platforms && (
                <Text style={styles.errorText}>{errors.platforms.message}</Text>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Budget & Timeline
            </Text>

            {/* Target Influencers */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Target Number of Influencers *
              </Text>
              <Controller
                control={control}
                name="targetInfluencers"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.numberInputContainer}>
                    <TouchableOpacity
                      style={[styles.numberButton, { backgroundColor: Colors.gray[200] }]}
                      onPress={() => onChange(Math.max(1, value - 1))}
                    >
                      <Ionicons name="remove" size={20} color={Colors.text.primary} />
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.numberInput,
                        {
                          backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                          color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                        },
                      ]}
                      value={value.toString()}
                      onChangeText={(text) => onChange(parseInt(text) || 0)}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity
                      style={[styles.numberButton, { backgroundColor: Colors.gray[200] }]}
                      onPress={() => onChange(value + 1)}
                    >
                      <Ionicons name="add" size={20} color={Colors.text.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>

            {/* Budget Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Budget Type *
              </Text>
              <View style={styles.budgetTypeContainer}>
                {BUDGET_TYPES.map((type) => {
                  const isSelected = watchedValues.budgetType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.budgetTypeCard,
                        {
                          backgroundColor: isSelected
                            ? Colors.primary[500]
                            : scheme === 'dark'
                            ? Colors.gray[800]
                            : Colors.card,
                          borderColor: isSelected ? Colors.primary[500] : Colors.border.default,
                        },
                      ]}
                      onPress={() => setValue('budgetType', type.value as unknown)}
                    >
                      <Text
                        style={[
                          styles.budgetTypeLabel,
                          {
                            color: isSelected ? Colors.text.inverse : Colors.text.secondary,
                          },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Total Budget */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Total Budget (INR) *
              </Text>
              <Controller
                control={control}
                name="budgetTotal"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.currencyInputContainer}>
                    <Text style={[styles.currencySymbol, { color: Colors.text.secondary }]}>
                      INR
                    </Text>
                    <TextInput
                      style={[
                        styles.currencyInput,
                        {
                          backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                          color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                          borderColor: errors.budgetTotal ? Colors.error[500] : Colors.border.default,
                        },
                      ]}
                      placeholder="10,000"
                      placeholderTextColor={Colors.text.tertiary}
                      value={value.toString()}
                      onChangeText={(text) => onChange(parseInt(text.replace(/,/g, '')) || 0)}
                      keyboardType="number-pad"
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
              {errors.budgetTotal && (
                <Text style={styles.errorText}>{errors.budgetTotal.message}</Text>
              )}
            </View>

            {/* Per Influencer Budget */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Per Influencer Budget (INR) *
              </Text>
              <Controller
                control={control}
                name="budgetPerInfluencer"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.currencyInputContainer}>
                    <Text style={[styles.currencySymbol, { color: Colors.text.secondary }]}>
                      INR
                    </Text>
                    <TextInput
                      style={[
                        styles.currencyInput,
                        {
                          backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                          color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                          borderColor: errors.budgetPerInfluencer ? Colors.error[500] : Colors.border.default,
                        },
                      ]}
                      placeholder="2,000"
                      placeholderTextColor={Colors.text.tertiary}
                      value={value.toString()}
                      onChangeText={(text) => onChange(parseInt(text.replace(/,/g, '')) || 0)}
                      keyboardType="number-pad"
                      onBlur={onBlur}
                    />
                  </View>
                )}
              />
              {errors.budgetPerInfluencer && (
                <Text style={styles.errorText}>{errors.budgetPerInfluencer.message}</Text>
              )}
            </View>

            {/* Estimated Total */}
            <View
              style={[
                styles.estimateCard,
                { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[50] },
              ]}
            >
              <Ionicons name="calculator-outline" size={24} color={Colors.primary[500]} />
              <View style={styles.estimateContent}>
                <Text style={[styles.estimateLabel, { color: Colors.text.secondary }]}>
                  Estimated Total Payout
                </Text>
                <Text style={[styles.estimateValue, { color: Colors.primary[500] }]}>
                  INR {(watchedValues.targetInfluencers * watchedValues.budgetPerInfluencer).toLocaleString('en-IN')}
                </Text>
                <Text style={[styles.estimateNote, { color: Colors.text.tertiary }]}>
                  Based on {watchedValues.targetInfluencers} influencers at INR {watchedValues.budgetPerInfluencer.toLocaleString('en-IN')} each
                </Text>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Deliverables & Timeline
            </Text>

            {/* Deliverables */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                  Content Deliverables *
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: Colors.primary[500] }]}
                  onPress={addDeliverable}
                >
                  <Ionicons name="add" size={16} color={Colors.text.inverse} />
                  <Text style={styles.addButtonText}>Add Deliverable</Text>
                </TouchableOpacity>
              </View>

              {deliverableFields.length === 0 ? (
                <View
                  style={[
                    styles.emptyDeliverables,
                    { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.gray[50] },
                  ]}
                >
                  <Ionicons name="copy-outline" size={48} color={Colors.text.tertiary} />
                  <Text style={[styles.emptyText, { color: Colors.text.tertiary }]}>
                    No deliverables added yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: Colors.text.tertiary }]}>
                    Add the type of content you want influencers to create
                  </Text>
                </View>
              ) : (
                deliverableFields.map((field, index) => (
                  <View
                    key={field.id}
                    style={[
                      styles.deliverableCard,
                      { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                    ]}
                  >
                    <View style={styles.deliverableHeader}>
                      <Text style={[styles.deliverableTitle, { color: Colors.text.primary }]}>
                        Deliverable {index + 1}
                      </Text>
                      <TouchableOpacity onPress={() => removeDeliverable(index)}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error[500]} />
                      </TouchableOpacity>
                    </View>

                    <Controller
                      control={control}
                      name={`deliverables.${index}.type`}
                      render={({ field: { onChange, value } }) => (
                        <View style={styles.deliverableTypeGrid}>
                          {DELIVERABLE_TYPES.map((type) => (
                            <TouchableOpacity
                              key={type.value}
                              style={[
                                styles.deliverableTypeButton,
                                {
                                  backgroundColor:
                                    value === type.value
                                      ? Colors.primary[500]
                                      : scheme === 'dark'
                                      ? Colors.gray[700]
                                      : Colors.gray[100],
                                },
                              ]}
                              onPress={() => onChange(type.value)}
                            >
                              <Ionicons
                                name={type.icon as unknown}
                                size={16}
                                color={value === type.value ? Colors.text.inverse : Colors.text.secondary}
                              />
                              <Text
                                style={[
                                  styles.deliverableTypeText,
                                  {
                                    color:
                                      value === type.value
                                        ? Colors.text.inverse
                                        : Colors.text.secondary,
                                  },
                                ]}
                              >
                                {type.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    />

                    <Controller
                      control={control}
                      name={`deliverables.${index}.title`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={[
                            styles.deliverableInput,
                            {
                              backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[50],
                              color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                            },
                          ]}
                          placeholder="Deliverable title"
                          placeholderTextColor={Colors.text.tertiary}
                          value={value}
                          onChangeText={onChange}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name={`deliverables.${index}.description`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={[
                            styles.deliverableTextArea,
                            {
                              backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[50],
                              color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                            },
                          ]}
                          placeholder="Describe what you want..."
                          placeholderTextColor={Colors.text.tertiary}
                          value={value}
                          onChangeText={onChange}
                          multiline
                          numberOfLines={2}
                        />
                      )}
                    />

                    <View style={styles.deliverableRow}>
                      <View style={styles.deliverableHalf}>
                        <Text style={[styles.smallLabel, { color: Colors.text.secondary }]}>
                          Quantity
                        </Text>
                        <Controller
                          control={control}
                          name={`deliverables.${index}.quantity`}
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              style={[
                                styles.smallInput,
                                {
                                  backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[50],
                                  color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                                },
                              ]}
                              value={value.toString()}
                              onChangeText={(text) => onChange(parseInt(text) || 1)}
                              keyboardType="number-pad"
                            />
                          )}
                        />
                      </View>
                      <View style={styles.deliverableHalf}>
                        <Text style={[styles.smallLabel, { color: Colors.text.secondary }]}>
                          Price (INR)
                        </Text>
                        <Controller
                          control={control}
                          name={`deliverables.${index}.price`}
                          render={({ field: { onChange, value } }) => (
                            <TextInput
                              style={[
                                styles.smallInput,
                                {
                                  backgroundColor: scheme === 'dark' ? Colors.gray[700] : Colors.gray[50],
                                  color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                                },
                              ]}
                              value={value.toString()}
                              onChangeText={(text) => onChange(parseInt(text) || 0)}
                              keyboardType="number-pad"
                            />
                          )}
                        />
                      </View>
                    </View>

                    <Controller
                      control={control}
                      name={`deliverables.${index}.isRequired`}
                      render={({ field: { onChange, value } }) => (
                        <View style={styles.switchRow}>
                          <Text style={[styles.smallLabel, { color: Colors.text.secondary }]}>
                            Required Deliverable
                          </Text>
                          <Switch
                            value={value}
                            onValueChange={onChange}
                            trackColor={{ false: Colors.gray[300], true: Colors.primary[300] }}
                            thumbColor={value ? Colors.primary[500] : Colors.gray[100]}
                          />
                        </View>
                      )}
                    />
                  </View>
                ))
              )}
              {errors.deliverables && (
                <Text style={styles.errorText}>{errors.deliverables.message}</Text>
              )}
            </View>

            {/* Timeline */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Campaign Timeline
              </Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                  ]}
                  onPress={() => setShowDatePicker('start')}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary[500]} />
                  <View style={styles.dateContent}>
                    <Text style={[styles.dateLabel, { color: Colors.text.tertiary }]}>
                      Start Date
                    </Text>
                    <Text style={[styles.dateValue, { color: Colors.text.primary }]}>
                      {formatDate(watchedValues.startDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card },
                  ]}
                  onPress={() => setShowDatePicker('end')}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary[500]} />
                  <View style={styles.dateContent}>
                    <Text style={[styles.dateLabel, { color: Colors.text.tertiary }]}>
                      End Date
                    </Text>
                    <Text style={[styles.dateValue, { color: Colors.text.primary }]}>
                      {formatDate(watchedValues.endDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              {errors.endDate && (
                <Text style={styles.errorText}>{errors.endDate.message}</Text>
              )}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: Colors.text.primary }]}>
              Influencer Requirements
            </Text>

            {/* Minimum Followers */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Minimum Followers
              </Text>
              <Controller
                control={control}
                name="requirements.minFollowers"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.followerInputContainer}>
                    {['1K', '10K', '50K', '100K', '500K', '1M'].map((range) => {
                      const isSelected = value === range.replace('K', '000').replace('M', '000000');
                      return (
                        <TouchableOpacity
                          key={range}
                          style={[
                            styles.followerChip,
                            {
                              backgroundColor: isSelected
                                ? Colors.primary[500]
                                : scheme === 'dark'
                                ? Colors.gray[800]
                                : Colors.gray[100],
                            },
                          ]}
                          onPress={() => onChange(range.replace('K', '000').replace('M', '000000'))}
                        >
                          <Text
                            style={[
                              styles.followerChipText,
                              {
                                color: isSelected ? Colors.text.inverse : Colors.text.secondary,
                              },
                            ]}
                          >
                            {range}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
            </View>

            {/* Minimum Engagement Rate */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Minimum Engagement Rate
              </Text>
              <Controller
                control={control}
                name="requirements.minEngagementRate"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.engagementInputContainer}>
                    {['1%', '2%', '3%', '5%', '7%', '10%'].map((rate) => {
                      const isSelected = value === rate.replace('%', '');
                      return (
                        <TouchableOpacity
                          key={rate}
                          style={[
                            styles.followerChip,
                            {
                              backgroundColor: isSelected
                                ? Colors.primary[500]
                                : scheme === 'dark'
                                ? Colors.gray[800]
                                : Colors.gray[100],
                            },
                          ]}
                          onPress={() => onChange(rate.replace('%', ''))}
                        >
                          <Text
                            style={[
                              styles.followerChipText,
                              {
                                color: isSelected ? Colors.text.inverse : Colors.text.secondary,
                              },
                            ]}
                          >
                            {rate}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
            </View>

            {/* Verified Only */}
            <View style={styles.inputGroup}>
              <Controller
                control={control}
                name="requirements.verifiedOnly"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    style={[
                      styles.toggleCard,
                      {
                        backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                        borderColor: value ? Colors.primary[500] : Colors.border.default,
                      },
                    ]}
                    onPress={() => onChange(!value)}
                  >
                    <View style={styles.toggleContent}>
                      <View style={styles.toggleIcon}>
                        <Ionicons name="checkmark-circle" size={28} color={Colors.primary[500]} />
                      </View>
                      <View style={styles.toggleTextContent}>
                        <Text style={[styles.toggleTitle, { color: Colors.text.primary }]}>
                          Verified Influencers Only
                        </Text>
                        <Text style={[styles.toggleDescription, { color: Colors.text.tertiary }]}>
                          Only show influencers with verified accounts
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: Colors.gray[300], true: Colors.primary[300] }}
                      thumbColor={value ? Colors.primary[500] : Colors.gray[100]}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Campaign Terms */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: Colors.text.secondary }]}>
                Campaign Terms & Conditions
              </Text>
              <Controller
                control={control}
                name="terms"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
                        color: scheme === 'dark' ? Colors.gray[100] : Colors.text.primary,
                        borderColor: Colors.border.default,
                      },
                    ]}
                    placeholder="Enter unknown specific terms, guidelines, or requirements for influencers..."
                    placeholderTextColor={Colors.text.tertiary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                )}
              />
            </View>

            {/* Summary Card */}
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[50] },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: Colors.primary[500] }]}>
                Campaign Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.text.secondary }]}>
                  Campaign Name
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.text.primary }]}>
                  {watchedValues.name || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.text.secondary }]}>
                  Target Platforms
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.text.primary }]}>
                  {watchedValues.platforms.join(', ') || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.text.secondary }]}>
                  Total Budget
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.text.primary }]}>
                  INR {watchedValues.budgetTotal?.toLocaleString('en-IN') || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.text.secondary }]}>
                  Timeline
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.text.primary }]}>
                  {formatDate(watchedValues.startDate)} - {formatDate(watchedValues.endDate)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.text.secondary }]}>
                  Deliverables
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.text.primary }]}>
                  {deliverableFields.length} type(s)
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: scheme === 'dark' ? Colors.gray[900] : Colors.gray[50] },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>

      {/* Bottom Buttons */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.card,
            paddingBottom: insets.bottom + Spacing.base,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: Colors.border.default },
          ]}
          onPress={prevStep}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          <Text style={[styles.secondaryButtonText, { color: Colors.text.primary }]}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.primary[500] }]}
            onPress={nextStep}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.primary[500] }]}
            onPress={handleSubmit((data) => createCampaignMutation.mutate(data))}
            disabled={createCampaignMutation.isPending}
          >
            {createCampaignMutation.isPending ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Create Campaign</Text>
                <Ionicons name="checkmark" size={20} color={Colors.text.inverse} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={
            showDatePicker === 'start'
              ? watchedValues.startDate
              : watchedValues.endDate
          }
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(null);
            if (date) {
              setValue(showDatePicker === 'start' ? 'startDate' : 'endDate', date);
            }
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary[500],
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  stepLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: 4,
    display: 'none',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  stepContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
  },
  errorText: {
    color: Colors.error[500],
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionCard: {
    width: '48%',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  platformContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  platformCard: {
    width: '30%',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  platformLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  numberButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  budgetTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  budgetTypeCard: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  budgetTypeLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  currencySymbol: {
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    backgroundColor: Colors.gray[100],
    height: 48,
    textAlignVertical: 'center',
    lineHeight: 48,
  },
  currencyInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
  },
  estimateCard: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.base,
    marginTop: Spacing.base,
  },
  estimateContent: {
    flex: 1,
  },
  estimateLabel: {
    fontSize: Typography.fontSize.sm,
  },
  estimateValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginVertical: Spacing.xs,
  },
  estimateNote: {
    fontSize: Typography.fontSize.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  addButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyDeliverables: {
    padding: Spacing['2xl'],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  deliverableCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  deliverableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  deliverableTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  deliverableTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  deliverableTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  deliverableTypeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  deliverableInput: {
    height: 40,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  deliverableTextArea: {
    height: 60,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  deliverableRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  deliverableHalf: {
    flex: 1,
  },
  smallLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
  },
  smallInput: {
    height: 40,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    gap: Spacing.base,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
  },
  dateValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 2,
  },
  followerInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  followerChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  followerChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  engagementInputContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  toggleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  toggleIcon: {},
  toggleTextContent: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  toggleDescription: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  summaryCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    marginBottom: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.inverse,
  },
});
