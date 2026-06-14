/**
 * Smart Onboarding - "REZ Learns You"
 *
 * Philosophy: Don't make users learn REZ. Make REZ learn users.
 *
 * This onboarding transforms REZ from:
 * - "complex cashback app"
 * into:
 * - "intelligent savings companion"
 *
 * The Aha Moment: Users see value BEFORE their first purchase.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { colors, spacing, borderRadius, typography } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================

interface LifestyleSignal {
  id: string;
  question: string;
  subtitle: string;
  options: LifestyleOption[];
  icon: string;
}

interface LifestyleOption {
  id: string;
  label: string;
  value: string;
}

interface SmartSnapshot {
  category: string;
  insight: string;
  value: string;
  icon: string;
  type: 'savings' | 'behavior' | 'social' | 'location';
}

// ============================================================================
// LIFESTYLE SIGNAL QUESTIONS
// ============================================================================

const LIFESTYLE_SIGNALS: LifestyleSignal[] = [
  {
    id: 'food',
    question: 'What do you usually spend on food?',
    subtitle: 'Help us find nearby savings',
    icon: '🍽️',
    options: [
      { id: 'food-1', label: 'Under ₹2,000/month', value: '<2000' },
      { id: 'food-2', label: '₹2,000-5,000', value: '2000-5000' },
      { id: 'food-3', label: '₹5,000-10,000', value: '5000-10000' },
      { id: 'food-4', label: '₹10,000+', value: '>10000' },
    ],
  },
  {
    id: 'dining',
    question: 'How often do you dine out?',
    subtitle: 'We\'ll find the best local deals',
    icon: '🏪',
    options: [
      { id: 'dining-1', label: 'Rarely (1-2x/week)', value: 'rare' },
      { id: 'dining-2', label: 'Sometimes (3-4x/week)', value: 'sometimes' },
      { id: 'dining-3', label: 'Often (5-6x/week)', value: 'often' },
      { id: 'dining-4', label: 'Daily', value: 'daily' },
    ],
  },
  {
    id: 'shopping',
    question: 'What\'s your shopping style?',
    subtitle: 'Personalized offers for you',
    icon: '🛍️',
    options: [
      { id: 'shop-1', label: 'Essentials only', value: 'essentials' },
      { id: 'shop-2', label: 'Occasional treats', value: 'occasional' },
      { id: 'shop-3', label: 'Regular shopping', value: 'regular' },
      { id: 'shop-4', label: 'Fashion forward', value: 'fashion' },
    ],
  },
  {
    id: 'travel',
    question: 'How do you usually travel?',
    subtitle: 'Find savings on every journey',
    icon: '🚗',
    options: [
      { id: 'travel-1', label: 'Public transport', value: 'public' },
      { id: 'travel-2', label: 'Ride shares', value: 'rideshare' },
      { id: 'travel-3', label: 'Own vehicle', value: 'own' },
      { id: 'travel-4', label: 'Mix of everything', value: 'mixed' },
    ],
  },
  {
    id: 'wellness',
    question: 'Do you use wellness services?',
    subtitle: 'Salons, gyms, health shops nearby',
    icon: '💆',
    options: [
      { id: 'wellness-1', label: 'No, not really', value: 'none' },
      { id: 'wellness-2', label: 'Occasionally', value: 'occasional' },
      { id: 'wellness-3', label: 'Regularly', value: 'regular' },
      { id: 'wellness-4', label: 'Very important to me', value: 'priority' },
    ],
  },
  {
    id: 'social',
    question: 'Do you shop with friends or family?',
    subtitle: 'Unlock group savings together',
    icon: '👥',
    options: [
      { id: 'social-1', label: 'Usually alone', value: 'alone' },
      { id: 'social-2', label: 'Sometimes together', value: 'sometimes' },
      { id: 'social-3', label: 'Often with others', value: 'often' },
      { id: 'social-4', label: 'Always a group activity', value: 'always' },
    ],
  },
];

// ============================================================================
// MOCK SMART SNAPSHOTS (Generated from signals)
// ============================================================================

const generateSmartSnapshot = (answers: Record<string, string>): SmartSnapshot[] => {
  const snapshots: SmartSnapshot[] = [];

  // Spending insight
  const foodSpend = answers['food'] || '2000-5000';
  const monthlyEst = foodSpend === '<2000' ? 1500
    : foodSpend === '2000-5000' ? 3500
    : foodSpend === '5000-10000' ? 7500 : 12000;

  const potentialSavings = Math.round(monthlyEst * 0.15); // 15% cashback potential

  snapshots.push({
    category: 'Food & Delivery',
    insight: `You likely spend ₹${monthlyEst.toLocaleString('en-IN')}/month on food`,
    value: `Save up to ₹${potentialSavings.toLocaleString('en-IN')}/month with REZ`,
    icon: '🍽️',
    type: 'savings',
  });

  // Location insight
  snapshots.push({
    category: 'Nearby Savings',
    insight: '12 partner merchants within 2km of your location',
    value: 'Average 18% cashback on your usual spots',
    icon: '📍',
    type: 'location',
  });

  // Social insight
  const socialStyle = answers['social'] || 'sometimes';
  if (socialStyle === 'sometimes' || socialStyle === 'often' || socialStyle === 'always') {
    snapshots.push({
      category: 'Group Buying',
      insight: '3 friends already use REZ nearby',
      value: 'Pool rewards for extra 5% group bonus',
      icon: '👥',
      type: 'social',
    });
  }

  // Behavior insight
  const dining = answers['dining'] || 'sometimes';
  const diningFrequency = dining === 'rare' ? '1-2 times' :
    dining === 'sometimes' ? '3-4 times' :
    dining === 'often' ? '5-6 times' : 'daily';

  snapshots.push({
    category: 'Your Pattern',
    insight: `You dine out ${diningFrequency} per week`,
    value: 'Peak dining hours have extra 5% cashback',
    icon: '⏰',
    type: 'behavior',
  });

  // Wellness insight
  const wellness = answers['wellness'] || 'occasional';
  if (wellness !== 'none') {
    snapshots.push({
      category: 'Wellness Partners',
      insight: '4 wellness stores match your preferences nearby',
      value: 'First visit rewards + regular cashback',
      icon: '💆',
      type: 'savings',
    });
  }

  // Annual projection
  const annualSavings = potentialSavings * 12;
  snapshots.push({
    category: 'Your Potential',
    insight: `Estimated annual savings with REZ`,
    value: `₹${annualSavings.toLocaleString('en-IN')}/year`,
    icon: '🎯',
    type: 'savings',
  });

  return snapshots;
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface SignalCardProps {
  signal: LifestyleSignal;
  selected: string | null;
  onSelect: (id: string, value: string) => void;
  index: number;
}

function SignalCard({ signal, selected, onSelect, index }: SignalCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={styles.signalCard}
    >
      <View style={styles.signalHeader}>
        <Text style={styles.signalIcon}>{signal.icon}</Text>
        <View style={styles.signalText}>
          <Text style={styles.signalQuestion}>{signal.question}</Text>
          <Text style={styles.signalSubtitle}>{signal.subtitle}</Text>
        </View>
      </View>

      <View style={styles.optionsGrid}>
        {signal.options.map((option) => (
          <Pressable
            key={option.id}
            style={[
              styles.optionButton,
              selected === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => onSelect(signal.id, option.value)}
          >
            <Text
              style={[
                styles.optionText,
                selected === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

interface SnapshotCardProps {
  snapshot: SmartSnapshot;
  index: number;
}

function SnapshotCard({ snapshot, index }: SnapshotCardProps) {
  const getTypeStyle = () => {
    switch (snapshot.type) {
      case 'savings':
        return { bg: '#E8F5E9', icon: colors.success };
      case 'behavior':
        return { bg: '#E3F2FD', icon: '#2196F3' };
      case 'social':
        return { bg: '#FCE4EC', icon: '#E91E63' };
      case 'location':
        return { bg: '#FFF3E0', icon: '#FF9800' };
      default:
        return { bg: '#F5F5F5', icon: colors.text.secondary };
    }
  };

  const typeStyle = getTypeStyle();

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 150).duration(400)}
      style={[styles.snapshotCard, { backgroundColor: typeStyle.bg }]}
    >
      <View style={styles.snapshotHeader}>
        <Text style={styles.snapshotIcon}>{snapshot.icon}</Text>
        <Text style={styles.snapshotCategory}>{snapshot.category}</Text>
      </View>
      <Text style={styles.snapshotInsight}>{snapshot.insight}</Text>
      <Text style={styles.snapshotValue}>{snapshot.value}</Text>
    </Animated.View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SmartOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const totalSteps = LIFESTYLE_SIGNALS.length;
  const progress = (currentStep + 1) / totalSteps;
  const canContinue = currentStep < totalSteps - 1;
  const canFinish = currentStep === totalSteps - 1 && Object.keys(answers).length >= 3;

  const handleSelect = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (canContinue) {
      setCurrentStep((prev) => prev + 1);
    } else if (canFinish) {
      // Generate smart snapshot
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowSnapshot(true);
      }, 2000); // Simulated analysis time
    }
  }, [canContinue, canFinish]);

  const handleFinish = useCallback(() => {
    // Store preferences
    router.replace('/(tabs)/index');
  }, [router]);

  const handleSkip = useCallback(() => {
    // Skip onboarding, go directly to app
    router.replace('/(tabs)/index');
  }, [router]);

  const currentSignal = LIFESTYLE_SIGNALS[currentStep];
  const smartSnapshots = generateSmartSnapshot(answers);

  // ============================================================================
  // RENDER: WELCOME SCREEN
  // ============================================================================

  if (currentStep === 0 && Object.keys(answers).length === 0) {
    return (
      <LinearGradient
        colors={[colors.brand.primary, '#FF8F00']}
        style={styles.container}
      >
        <SafeAreaView style={styles.welcomeContainer}>
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <View style={styles.welcomeContent}>
            <Animated.View entering={FadeIn.duration(600)}>
              <Text style={styles.welcomeEmoji}>🎯</Text>
              <Text style={styles.welcomeTitle}>REZ Learns You</Text>
              <Text style={styles.welcomeSubtitle}>
                We analyze your lifestyle to find the best savings{'\n'}
                and recommendations — automatically.
              </Text>
            </Animated.View>
          </View>

          <View style={styles.welcomeFeatures}>
            <View style={styles.featureRow}>
              <Ionicons name="location" size={24} color="#FFF" />
              <Text style={styles.featureText}>Location-aware savings</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="trending-down" size={24} color="#FFF" />
              <Text style={styles.featureText}>Personalized spending insights</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="wallet" size={24} color="#FFF" />
              <Text style={styles.featureText}>Smart reward optimization</Text>
            </View>
          </View>

          <View style={styles.welcomeActions}>
            <Pressable style={styles.getStartedButton} onPress={() => setCurrentStep(1)}>
              <Text style={styles.getStartedText}>Let's Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.brand.primary} />
            </Pressable>
            <Text style={styles.privacyNote}>
              Takes about 30 seconds. You can update anytime.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================================================
  // RENDER: SMART SNAPSHOT
  // ============================================================================

  if (showSnapshot) {
    return (
      <LinearGradient
        colors={[colors.brand.primary, '#FF8F00']}
        style={styles.container}
      >
        <SafeAreaView style={styles.snapshotContainer}>
          <Pressable style={styles.skipButton} onPress={handleFinish}>
            <Text style={styles.skipTextWhite}>Skip</Text>
          </Pressable>

          <Animated.View entering={FadeIn.duration(600)} style={styles.snapshotHeader}>
            <Text style={styles.snapshotEmoji}>✨</Text>
            <Text style={styles.snapshotTitle}>Your REZ Snapshot</Text>
            <Text style={styles.snapshotSubtitle}>
              Here's what REZ found for you
            </Text>
          </Animated.View>

          <ScrollView
            style={styles.snapshotScroll}
            contentContainerStyle={styles.snapshotList}
            showsVerticalScrollIndicator={false}
          >
            {smartSnapshots.map((snapshot, index) => (
              <SnapshotCard key={snapshot.category} snapshot={snapshot} index={index} />
            ))}

            <View style={styles.annualHighlight}>
              <Text style={styles.annualLabel}>Potential First Year Savings</Text>
              <Text style={styles.annualValue}>
                ₹{(smartSnapshots[0]?.value.match(/\d+/g)?.join('') || '0')}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.snapshotActions}>
            <Pressable style={styles.exploreButton} onPress={handleFinish}>
              <Text style={styles.exploreText}>Start Saving with REZ</Text>
            </Pressable>
            <Text style={styles.updateNote}>
              Update your preferences anytime in Settings
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================================================
  // RENDER: ANALYZING
  // ============================================================================

  if (isAnalyzing) {
    return (
      <LinearGradient
        colors={[colors.brand.primary, '#FF8F00']}
        style={styles.container}
      >
        <SafeAreaView style={styles.analyzingContainer}>
          <Animated.View
            entering={FadeIn.duration(400)}
            style={styles.analyzingContent}
          >
            <Text style={styles.analyzingEmoji}>🔍</Text>
            <Text style={styles.analyzingTitle}>Analyzing Your Lifestyle</Text>
            <Text style={styles.analyzingSubtitle}>
              Finding the best savings for you...
            </Text>

            <View style={styles.analyzingDots}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  entering={FadeIn.delay(i * 200)}
                  style={styles.analyzingDot}
                />
              ))}
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ============================================================================
  // RENDER: SIGNAL COLLECTION
  // ============================================================================

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.signalContainer}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {totalSteps}
          </Text>
        </View>

        {/* Skip */}
        <Pressable style={styles.skipButtonDark} onPress={handleSkip}>
          <Text style={styles.skipTextDark}>Skip</Text>
        </Pressable>

        {/* Signal */}
        <ScrollView
          style={styles.signalScroll}
          contentContainerStyle={styles.signalContent}
          showsVerticalScrollIndicator={false}
        >
          <SignalCard
            key={currentSignal.id}
            signal={currentSignal}
            selected={answers[currentSignal.id] || null}
            onSelect={handleSelect}
            index={0}
          />
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <Pressable
              style={styles.backButton}
              onPress={() => setCurrentStep((prev) => prev - 1)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.nextButton,
              !canFinish && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canFinish}
          >
            <Text
              style={[
                styles.nextText,
                !canFinish && styles.nextTextDisabled,
              ]}
            >
              {canContinue ? 'Continue' : 'See Your Snapshot'}
            </Text>
            {canFinish && (
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  welcomeTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeSubtitle: {
    fontSize: typography.bodyLarge.fontSize,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
  },
  welcomeFeatures: {
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  featureText: {
    fontSize: typography.body.fontSize,
    color: '#FFF',
    marginLeft: spacing.md,
  },
  welcomeActions: {
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
    marginBottom: spacing.md,
  },
  getStartedText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
    marginRight: spacing.sm,
  },
  privacyNote: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
    minWidth: 50,
    textAlign: 'right',
  },

  // Skip Buttons
  skipButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  skipButtonDark: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  skipTextDark: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
  },
  skipTextWhite: {
    fontSize: typography.body.fontSize,
    color: '#FFF',
  },

  // Signal Collection
  signalContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  signalScroll: {
    flex: 1,
  },
  signalContent: {
    paddingBottom: spacing.xl,
  },
  signalCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  signalIcon: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  signalText: {
    flex: 1,
  },
  signalQuestion: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  signalSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text.tertiary,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  optionButton: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: colors.primary[100] + '20',
    borderColor: colors.brand.primary,
  },
  optionText: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: colors.brand.primary,
    fontWeight: '600',
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  backText: {
    fontSize: typography.body.fontSize,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  },
  nextButtonDisabled: {
    backgroundColor: colors.background.tertiary,
  },
  nextText: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFF',
    marginRight: spacing.xs,
  },
  nextTextDisabled: {
    color: colors.text.tertiary,
  },

  // Analyzing
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingContent: {
    alignItems: 'center',
  },
  analyzingEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  analyzingTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: spacing.sm,
  },
  analyzingSubtitle: {
    fontSize: typography.bodyLarge.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xl,
  },
  analyzingDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  analyzingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Smart Snapshot
  snapshotContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  snapshotHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  snapshotEmoji: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  snapshotTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: spacing.xs,
  },
  snapshotSubtitle: {
    fontSize: typography.bodyLarge.fontSize,
    color: 'rgba(255,255,255,0.8)',
  },
  snapshotScroll: {
    flex: 1,
  },
  snapshotList: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  snapshotCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  snapshotIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  snapshotCategory: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  snapshotInsight: {
    fontSize: typography.body.fontSize,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  snapshotValue: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.text.primary,
  },
  annualHighlight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  annualLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  annualValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },
  snapshotActions: {
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  exploreButton: {
    backgroundColor: '#FFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  exploreText: {
    fontSize: typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  updateNote: {
    fontSize: typography.bodySmall.fontSize,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.md,
  },
});
