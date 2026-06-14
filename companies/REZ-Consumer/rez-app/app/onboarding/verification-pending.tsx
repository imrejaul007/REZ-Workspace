import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React from 'react';
import { View, StyleSheet, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { useAuthUser, useAuthActions } from '@/stores/selectors';
import { useBackButton } from '@/hooks/useSafeNavigation';

// REZ brand colors
const NILE_BLUE = '#1A3A5C';
const MUSTARD = '#F5A623';

function VerificationPendingPage() {
  const router = useRouter();
  const user = useAuthUser();
  const actions = useAuthActions();
  useBackButton(() => false); // Allow back navigation from pending screen

  const handleContinue = async () => {
    if (!user?.isOnboarded) {
      try {
        await actions.completeOnboarding({
          preferences: {
            notifications: { push: true, email: true, sms: true },
            theme: 'light',
          },
        });
      } catch {
        // Proceed regardless — home screen handles the fallback
      }
    }
    router.replace('/(tabs)');
  };

  const handleCheckStatus = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Clock / Pending Icon */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={72} color={MUSTARD} />
          </View>
        </Animated.View>

        {/* Heading */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.textContainer}>
          <ThemedText style={styles.heading}>Verification in Progress</ThemedText>
          <ThemedText style={styles.subtitle}>We're reviewing your documents. This usually takes 2–4 hours.</ThemedText>
        </Animated.View>

        {/* Info badge */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.infoBadge}>
          <Ionicons name="information-circle-outline" size={18} color={NILE_BLUE} />
          <ThemedText style={styles.infoText}>
            You'll receive a notification once your identity is confirmed.
          </ThemedText>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.actionsContainer}>
          <Pressable onPress={handleContinue} style={styles.primaryButton}>
            <ThemedText style={styles.primaryButtonText}>Continue to App</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>

          <Pressable onPress={handleCheckStatus} style={styles.secondaryButton}>
            <ThemedText style={styles.secondaryButtonText}>Check Status</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3CD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: NILE_BLUE,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#EBF2FA',
    borderColor: '#BDD5EA',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing['2xl'],
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: NILE_BLUE,
    lineHeight: 18,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: NILE_BLUE,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.medium,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: MUSTARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: MUSTARD,
  },
});

export default withErrorBoundary(VerificationPendingPage, 'OnboardingVerificationPending');
