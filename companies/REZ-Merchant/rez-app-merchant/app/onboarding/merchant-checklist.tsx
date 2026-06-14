/**
 * Sprint 15: Merchant Onboarding Checklist
 * Shown to new merchants on first launch.
 * Tracks completion in AsyncStorage under key `onboardingComplete`.
 * 5 required steps with progress bar, "Go" deep links, dismiss option,
 * and a scale/opacity celebration burst when all 5 are done.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';

const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';
const ONBOARDING_PROGRESS_KEY = 'onboardingProgress';

interface Step {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const STEPS: Step[] = [
  {
    id: 'business_profile',
    title: 'Complete business profile',
    description: 'Add your logo, description, and opening hours',
    icon: 'storefront-outline',
    route: '/settings/profile',
  },
  {
    id: 'first_offer',
    title: 'Add your first offer',
    description: 'Create a cashback or discount offer for customers',
    icon: 'pricetag-outline',
    route: '/(dashboard)/create-offer',
  },
  {
    id: 'qr_code',
    title: 'Create QR code for check-ins',
    description: 'Generate your store QR code so customers can check in',
    icon: 'qr-code-outline',
    route: '/qr-generator',
  },
  {
    id: 'payout_account',
    title: 'Set up payout account',
    description: 'Link your bank account to receive payments',
    icon: 'card-outline',
    route: '/onboarding/bank-details',
  },
  {
    id: 'first_staff',
    title: 'Invite first staff member',
    description: 'Add a team member to help manage your store',
    icon: 'person-add-outline',
    route: '/(dashboard)/team',
  },
];

export default function MerchantChecklistScreen() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  // Animation values for celebration burst
  const celebrateScale = useRef(new Animated.Value(0)).current;
  const celebrateOpacity = useRef(new Animated.Value(0)).current;

  const completedCount = STEPS.filter((s) => completed[s.id]).length;
  const progressPercent = (completedCount / STEPS.length) * 100;
  const allDone = completedCount === STEPS.length;

  const loadProgress = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY);
      if (raw) {
        setCompleted(JSON.parse(raw));
      }
    } catch {
      // silently ignore storage errors
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Trigger celebration when all steps are newly completed
  useEffect(() => {
    if (allDone && !celebrating) {
      setCelebrating(true);
      celebrateScale.setValue(0);
      celebrateOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(celebrateScale, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(celebrateOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(1800),
          Animated.timing(celebrateOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start(async () => {
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      });
    }
  }, [allDone, celebrating, celebrateScale, celebrateOpacity]);

  const toggleStep = async (stepId: string) => {
    const next = { ...completed, [stepId]: !completed[stepId] };
    setCompleted(next);
    try {
      await AsyncStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // silently ignore
    }
  };

  const handleGo = (step: Step) => {
    router.push(step.route);
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'dismissed');
    } catch {
      // silently ignore
    }
    router.back();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgress();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Get Started</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Complete these steps to unlock your store
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissBtn}
            accessibilityRole="button"
            accessibilityLabel="Dismiss onboarding"
          >
            <ThemedText style={styles.dismissText}>Dismiss</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <ThemedText style={styles.progressLabel}>
              {completedCount}/{STEPS.length} complete
            </ThemedText>
            <ThemedText style={styles.progressPercent}>{Math.round(progressPercent)}%</ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressPercent > 0 ? `${progressPercent}%` : 0,
                  backgroundColor: allDone ? '#10B981' : '#7C3AED',
                },
              ]}
            />
          </View>
        </View>

        {/* Celebration burst overlay */}
        {celebrating && (
          <Animated.View
            style={[
              styles.celebrationContainer,
              { transform: [{ scale: celebrateScale }], opacity: celebrateOpacity },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['#7C3AED', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.celebrationCard}
            >
              <ThemedText style={styles.celebrationEmoji}>🎉</ThemedText>
              <ThemedText style={styles.celebrationTitle}>You're all set!</ThemedText>
              <ThemedText style={styles.celebrationSub}>Your store is ready to go live</ThemedText>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Steps */}
        <View style={styles.stepList}>
          {STEPS.map((step, index) => {
            const done = !!completed[step.id];
            return (
              <View key={step.id} style={[styles.stepCard, done && styles.stepCardDone]}>
                <View style={styles.stepLeft}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    onPress={() => toggleStep(step.id)}
                    style={[styles.checkbox, done && styles.checkboxDone]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: done }}
                    accessibilityLabel={`Mark step ${index + 1} as ${done ? 'incomplete' : 'complete'}`}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <ThemedText style={styles.checkboxNumber}>{index + 1}</ThemedText>
                    )}
                  </TouchableOpacity>

                  {/* Step connector line (not for last) */}
                  {index < STEPS.length - 1 && (
                    <View style={[styles.connector, done && styles.connectorDone]} />
                  )}
                </View>

                <View style={styles.stepBody}>
                  <View style={styles.stepIconRow}>
                    <View style={[styles.stepIconBg, done && styles.stepIconBgDone]}>
                      <Ionicons name={step.icon} size={18} color={done ? '#10B981' : '#7C3AED'} />
                    </View>
                    <View style={styles.stepTextWrap}>
                      <ThemedText style={[styles.stepTitle, done && styles.stepTitleDone]}>
                        {step.title}
                      </ThemedText>
                      <ThemedText style={styles.stepDesc} numberOfLines={2}>
                        {step.description}
                      </ThemedText>
                    </View>
                  </View>

                  {!done && (
                    <TouchableOpacity
                      onPress={() => handleGo(step)}
                      style={styles.goBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to ${step.title}`}
                    >
                      <ThemedText style={styles.goBtnText}>Go</ThemedText>
                      <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom dismiss link */}
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.bottomDismiss}
          accessibilityRole="button"
        >
          <ThemedText style={styles.bottomDismissText}>Dismiss for now</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    marginTop: 2,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  dismissBtn: {
    paddingTop: 4,
  },
  dismissText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  celebrationContainer: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    zIndex: 999,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  celebrationCard: {
    padding: 24,
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  celebrationSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  stepList: {
    paddingHorizontal: 16,
    gap: 0,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepCardDone: {
    backgroundColor: '#F0FDF4',
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 12,
    width: 28,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 4,
    backgroundColor: '#E5E7EB',
    minHeight: 16,
  },
  connectorDone: {
    backgroundColor: '#10B981',
  },
  stepBody: {
    flex: 1,
    gap: 8,
  },
  stepIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconBgDone: {
    backgroundColor: '#DCFCE7',
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  stepTitleDone: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  stepDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 17,
  },
  goBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  bottomDismiss: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bottomDismissText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
