/**
 * Create Offer — 3-step wizard for creating merchant offers/campaigns
 * Step 1: Goal selection → Step 2: Configure → Step 3: Review & Publish
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '@/constants/Colors';
import { useStore } from '@/contexts/StoreContext';
import { showAlert } from '@/utils/alert';
import GoalSelector, { OfferGoal, OFFER_GOALS } from '@/components/offers/GoalSelector';
import OfferConfigForm, { OfferConfig } from '@/components/offers/OfferConfigForm';
import OfferReviewCard from '@/components/offers/OfferReviewCard';
import { apiClient } from '@/services/api';

type Step = 1 | 2 | 3;

export default function CreateOfferScreen() {
  const router = useRouter();
  const { activeStore } = useStore();
  const { preset: presetParam } = useLocalSearchParams<{ preset?: string }>();

  /** Maps deep-link preset IDs to pre-selected goal + config overrides. */
  const PRESET_MAP: Record<string, { goalId: string; title: string; description: string }> = {
    happyhour: {
      goalId: 'increase_visits',
      title: 'Happy Hour Special',
      description: 'Boost your afternoon traffic with an exclusive happy hour deal!',
    },
    acquire: {
      goalId: 'new_customers',
      title: 'First Visit Offer',
      description: 'New customer exclusive — come try us today!',
    },
    awareness: {
      goalId: 'increase_bill',
      title: 'Special Offer',
      description: "Don't miss out on this special deal!",
    },
    loyalty: {
      goalId: 'reward_loyal',
      title: 'Thank You Reward',
      description: 'Loyalty rewards just for you!',
    },
    welcome: {
      goalId: 'new_customers',
      title: 'Welcome Offer',
      description: 'Welcome! Enjoy an exclusive discount on your first visit.',
    },
  };

  // Resolve preset goal and config at initialization time
  const resolvePreset = (presetId: string | undefined) => {
    if (!presetId || !(presetId in PRESET_MAP)) return { goal: null, config: null };
    const preset = PRESET_MAP[presetId];
    const goal = OFFER_GOALS.find((g) => g.id === preset.goalId) ?? null;
    if (!goal) return { goal: null, config: null };
    return {
      goal,
      config: {
        type: goal.defaults.type,
        value: goal.defaults.value,
        minSpend: goal.defaults.minSpend,
        durationDays: goal.defaults.durationDays,
        budgetCap: goal.defaults.budgetCap,
        title: preset.title,
        description: preset.description,
        imageUrl: '',
      },
    };
  };

  const { goal: presetGoal, config: presetConfig } = resolvePreset(presetParam);

  const [step, setStep] = useState<Step>(1);
  const [selectedGoal, setSelectedGoal] = useState<OfferGoal | null>(presetGoal);
  const [isPublishing, setIsPublishing] = useState(false);
  const [projectedROI, setProjectedROI] = useState<number | null>(null);

  const [config, setConfig] = useState<OfferConfig>(
    presetConfig ?? {
      type: 'cashback',
      value: 10,
      minSpend: 300,
      durationDays: 14,
      budgetCap: 10000,
      title: '',
      description: '',
      imageUrl: '',
    }
  );
  const [targetAudience, setTargetAudience] = useState<
    'everyone' | 'student' | 'corporate' | 'both'
  >('everyone');

  const handleGoalSelect = useCallback((goal: OfferGoal) => {
    setSelectedGoal(goal);
    setConfig((prev) => ({
      ...prev,
      type: goal.defaults.type,
      value: goal.defaults.value,
      minSpend: goal.defaults.minSpend,
      durationDays: goal.defaults.durationDays,
      budgetCap: goal.defaults.budgetCap,
    }));
  }, []);

  const handleConfigChange = useCallback((field: keyof OfferConfig, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!selectedGoal) {
        showAlert('Select a Goal', 'Please choose a campaign goal to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!config.title.trim()) {
        showAlert('Missing Title', 'Please enter an offer title.');
        return;
      }
      // Validate discount/reward value (must be 0-100 for percentage-based)
      if (config.value <= 0 || config.value > 100) {
        showAlert('Invalid Discount', 'Discount/reward value must be between 1 and 100.');
        return;
      }
      // Validate duration
      if (config.durationDays <= 0) {
        showAlert('Invalid Duration', 'Campaign duration must be greater than 0 days.');
        return;
      }
      // Try to get ROI projection
      try {
        const simRes = await apiClient.post('/merchant/campaign-simulator/simulate', {
          campaignType: config.type,
          rewardValue: config.value,
          budgetCap: config.budgetCap,
          durationDays: config.durationDays,
        });
        if (simRes.success && simRes.data?.roi) {
          setProjectedROI(simRes.data.roi);
        }
      } catch {
        /* non-critical */
      }
      setStep(3);
    }
  }, [step, selectedGoal, config]);

  const handleBack = useCallback(() => {
    if (step === 1) {
      router.back();
    } else {
      setStep((step - 1) as Step);
    }
  }, [step, router]);

  const handlePublish = useCallback(async () => {
    if (!activeStore?._id) {
      showAlert('Error', 'No active store selected');
      return;
    }
    // Final validation before publish
    if (!config.title.trim()) {
      showAlert('Missing Title', 'Please enter an offer title.');
      return;
    }
    if (config.value <= 0 || config.value > 100) {
      showAlert('Invalid Discount', 'Discount/reward value must be between 1 and 100.');
      return;
    }
    if (config.durationDays <= 0) {
      showAlert('Invalid Duration', 'Campaign duration must be greater than 0 days.');
      return;
    }
    setIsPublishing(true);
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + config.durationDays * 24 * 60 * 60 * 1000);

      // Backend Joi schema requires: storeId, title, image (uri), cashbackPercentage,
      // validity.{ startDate, endDate, isActive }, type. Optional: description, restrictions.
      // Field names differ from the form state — map them here before sending.
      const res = await apiClient.post('/merchant/offers', {
        storeId: activeStore._id,
        title: config.title,
        description: config.description,
        type: config.type === 'voucher' ? 'walk_in' : config.type,
        // Backend schema uses a single cashbackPercentage field for all offer types
        cashbackPercentage: config.value,
        image: config.imageUrl?.trim() || 'https://via.placeholder.com/400x300?text=Offer',
        validity: {
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          isActive: true,
        },
        restrictions: {
          minOrderValue: config.minSpend,
          usageLimit:
            config.budgetCap > 0
              ? Math.floor(config.budgetCap / Math.max(config.value, 1))
              : undefined,
        },
        ...(targetAudience !== 'everyone' && {
          metadata: {
            tags: targetAudience === 'both' ? ['student', 'corporate'] : [targetAudience],
          },
        }),
      });

      if (res.success) {
        showAlert('Offer Published!', 'Your offer is now live and visible to customers.');
        router.back();
      } else {
        showAlert('Error', res.message || 'Failed to create offer');
      }
    } catch (err) {
      showAlert('Error', err.message || 'Failed to create offer');
    } finally {
      setIsPublishing(false);
    }
  }, [activeStore, config, targetAudience, router]);

  const stepLabels = ['Goal', 'Configure', 'Review'];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Create Offer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicators */}
      <View style={styles.stepIndicator}>
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step >= stepNum;
          return (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>
                  {stepNum}
                </Text>
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{label}</Text>
              {i < 2 && <View style={[styles.stepLine, step > stepNum && styles.stepLineActive]} />}
            </View>
          );
        })}
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <GoalSelector
              selectedGoalId={selectedGoal?.id || null}
              onSelectGoal={handleGoalSelect}
            />
          )}
          {step === 2 && (
            <>
              <OfferConfigForm
                config={config}
                goalTitle={selectedGoal?.title || ''}
                onChange={handleConfigChange}
              />
              {/* Target Audience — Zone Targeting */}
              <View style={styles.zoneTargetSection}>
                <Text style={styles.zoneTargetLabel}>Target Audience</Text>
                <View style={styles.zoneTargetChips}>
                  {(
                    [
                      { id: 'everyone', label: 'Everyone' },
                      { id: 'student', label: 'Students Only' },
                      { id: 'corporate', label: 'Employees Only' },
                      { id: 'both', label: 'Both Verified' },
                    ] as const
                  ).map((opt) => (
                    <Pressable
                      key={opt.id}
                      style={[
                        styles.zoneTargetChip,
                        targetAudience === opt.id && {
                          backgroundColor: '#7C3AED',
                          borderColor: '#7C3AED',
                        },
                      ]}
                      onPress={() => setTargetAudience(opt.id)}
                    >
                      <Text
                        style={[
                          styles.zoneTargetChipText,
                          targetAudience === opt.id && { color: '#fff' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  {targetAudience === 'everyone'
                    ? 'Visible to all customers'
                    : targetAudience === 'student'
                      ? 'Only visible to verified students'
                      : targetAudience === 'corporate'
                        ? 'Only visible to verified employees'
                        : 'Visible to verified students and employees'}
                </Text>
              </View>
            </>
          )}
          {step === 3 && (
            <OfferReviewCard
              config={config}
              goalTitle={selectedGoal?.title || ''}
              projectedROI={projectedROI || undefined}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {step < 3 ? (
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={[Colors.light.primary || '#7C3AED', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextButton, isPublishing && { opacity: 0.6 }]}
            onPress={handlePublish}
            disabled={isPublishing}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              {isPublishing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="rocket" size={18} color="#fff" />
                  <Text style={styles.nextText}>Publish Offer</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 16,
    gap: 0,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: '#7C3AED' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  stepDotTextActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginLeft: 4, marginRight: 8 },
  stepLabelActive: { color: '#7C3AED', fontWeight: '600' },
  stepLine: { width: 24, height: 2, backgroundColor: '#E5E7EB', marginRight: 8 },
  stepLineActive: { backgroundColor: '#7C3AED' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: { borderRadius: 14, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  zoneTargetSection: { marginTop: 20, paddingHorizontal: 16 },
  zoneTargetLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  zoneTargetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneTargetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  zoneTargetChipText: { fontSize: 13, fontWeight: '500' },
});
