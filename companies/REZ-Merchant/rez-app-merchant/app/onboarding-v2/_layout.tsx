/**
 * Onboarding V2 Layout
 * Shared layout for all onboarding steps with progress indicator
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import { Colors } from '@/constants/Colors';
import ProgressBar from './components/ProgressBar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

const stepNames = ['Business', 'Services', 'Setup', 'Complete'];

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const router = useRouter();
  const { currentStep, totalSteps, canGoBack, goBack, exitOnboarding } = useOnboardingStore();

  const handleBack = () => {
    if (canGoBack()) {
      goBack();
    } else {
      exitOnboarding();
    }
  };

  const handleClose = () => {
    exitOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Set Up Your Store</Text>
          {currentStep > 0 && currentStep <= totalSteps && (
            <Text style={styles.stepIndicator}>
              Step {currentStep} of {totalSteps}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {currentStep > 0 && currentStep <= totalSteps && (
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} stepNames={stepNames} />
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
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
    minWidth: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  stepIndicator: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
});
