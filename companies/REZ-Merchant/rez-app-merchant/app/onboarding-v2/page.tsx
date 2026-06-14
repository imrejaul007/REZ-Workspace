/**
 * Onboarding V2 - Streamlined Merchant Onboarding (< 5 minutes)
 * Entry Point
 *
 * This is the main entry for the new streamlined onboarding flow.
 * Redirects to step 1 (business details) or shows appropriate step based on progress.
 */

import { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import { Colors } from '@/constants/Colors';

export default function OnboardingV2Entry() {
  const router = useRouter();
  const { currentStep, loadProgress } = useOnboardingStore();

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    try {
      // Load any existing progress
      await loadProgress();

      // Navigate to appropriate step
      if (currentStep > 0) {
        router.replace(`/onboarding-v2/steps/${getStepRoute(currentStep)}`);
      } else {
        router.replace('/onboarding-v2/steps/business');
      }
    } catch (error) {
      // Start fresh on error
      router.replace('/onboarding-v2/steps/business');
    }
  };

  const getStepRoute = (step: number): string => {
    const routes: Record<number, string> = {
      1: 'business',
      2: 'services',
      3: 'quick-setup',
      4: 'complete',
    };
    return routes[step] || 'business';
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
