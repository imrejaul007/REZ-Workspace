/**
 * Onboarding Index Screen
 * Entry point for the onboarding wizard - determines where user should go
 */

import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { onboardingService } from '@/services/api/onboarding';
import type { OnboardingStatus } from '@/types/onboarding';
import { getRedirectRoute, getStepRoute, isOnboardingComplete } from '@/utils/onboardingHelpers';
import { NAVIGATION_ROUTES, ONBOARDING_STATUS } from '@/constants/onboarding';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';

export default function OnboardingIndex() {
  const { merchant, isAuthenticated, isLoading: authLoading } = useAuth();
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectedResumeStep, setRejectedResumeStep] = useState(1);

  useEffect(() => {
    checkOnboardingStatus();
  }, [isAuthenticated, authLoading, merchant]);

  const handleRetry = async () => {
    setError(false);
    setRetrying(true);
    await checkOnboardingStatus();
    setRetrying(false);
  };

  const handleResubmit = () => {
    const route = getStepRoute(rejectedResumeStep);
    router.replace(route as string);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@rez.in?subject=Onboarding%20Rejection%20Query').catch((e) => console.warn('[Onboarding] Failed to open support email:', e));
  };

  const checkOnboardingStatus = async () => {
    try {
      // Wait for auth to finish loading
      if (authLoading) return;

      // If not authenticated, redirect to login
      if (!isAuthenticated || !merchant) {
        if (__DEV__) logger.log('Not authenticated, redirecting to login');
        router.replace(NAVIGATION_ROUTES.LOGIN as string);
        return;
      }

      if (__DEV__) logger.log('Checking onboarding status for merchant:', merchant.id);

      // Fetch current onboarding status
      const response = await onboardingService.getOnboardingStatus();

      if ((response as unknown as { success?: boolean }).success !== false && response) {
        const responseData = response as { data?: unknown };
        const status = (responseData.data || response) as { status?: string; currentStep?: number; rejectionReason?: string };
        logger.info(`Onboarding status: ${status.status ?? 'unknown'}, Step: ${status.currentStep ?? 0}`);

        // If rejected, show rejection reason before redirecting
        if ((status as { status?: string }).status === ONBOARDING_STATUS.REJECTED) {
          setRejected(true);
          setRejectionReason(
            (status as { rejectionReason?: string }).rejectionReason ||
              'Your application was not approved. Please review and resubmit.'
          );
          setRejectedResumeStep((status as { currentStep?: number }).currentStep || 1);
          return;
        }

        // Determine where to redirect based on status
        const redirectRoute = getRedirectRoute(status as unknown as OnboardingStatus);
        if (__DEV__) logger.log('Redirecting to:', redirectRoute);

        router.replace(redirectRoute as string);
      } else {
        // No status found, start from welcome
        if (__DEV__) logger.log('No onboarding status found, starting from welcome');
        router.replace(NAVIGATION_ROUTES.WELCOME as string);
      }
    } catch (error) {
      if (__DEV__) logger.error('Error checking onboarding status:', error);

      // If error, check if it's a 404 (no onboarding started yet)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        if (__DEV__) logger.log('Starting new onboarding');
        router.replace(NAVIGATION_ROUTES.WELCOME as string);
      } else {
        // Other error - show error UI and allow retry
        if (__DEV__) logger.error('Failed to check onboarding:', error.message);
        setError(true);
        return;
      }
    }
  };

  if (rejected) {
    return (
      <ScrollView contentContainerStyle={styles.rejectedContainer}>
        <View style={styles.rejectedIconWrap}>
          <Ionicons name="close-circle" size={56} color="#DC2626" />
        </View>

        <ThemedText style={styles.rejectedTitle}>Application Rejected</ThemedText>

        <View style={styles.rejectedBanner}>
          <Ionicons name="alert-circle" size={20} color="#991B1B" style={{ marginTop: 2 }} />
          <ThemedText style={styles.rejectedReasonText}>{rejectionReason}</ThemedText>
        </View>

        <ThemedText style={styles.rejectedHint}>
          Please review the details below, correct unknown issues, and resubmit your application.
        </ThemedText>

        <TouchableOpacity
          style={styles.resubmitButton}
          onPress={handleResubmit}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <ThemedText style={styles.resubmitButtonText}>Review & Resubmit</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactSupportButton}
          onPress={handleContactSupport}
          activeOpacity={0.8}
        >
          <Ionicons name="mail-outline" size={18} color={Colors.light.primary} />
          <ThemedText style={styles.contactSupportText}>Contact Support</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.errorText}>Something went wrong</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry} disabled={retrying}>
          <ThemedText style={styles.retryButtonText}>
            {retrying ? 'Retrying...' : 'Retry'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <ThemedText style={styles.loadingText}>Loading your onboarding status...</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Rejection UI styles
  rejectedContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  rejectedIconWrap: {
    marginBottom: 16,
  },
  rejectedTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  rejectedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  rejectedReasonText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#991B1B',
    fontWeight: '500',
  },
  rejectedHint: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  resubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  contactSupportText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
