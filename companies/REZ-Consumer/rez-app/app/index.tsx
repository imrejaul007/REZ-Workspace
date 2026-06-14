import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, usePathname, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingScreen from '@/components/onboarding/LoadingScreen';
import { useAuthUser, useIsAuthenticated, useAuthLoading } from '@/stores/selectors';
import { getAuthToken, getUser } from '@/utils/authStorage';
import { useIsMounted } from '@/hooks/useIsMounted';
import { initializeRezConsumerIntelligence } from '@/services/rez-consumer-intelligence';

function AppEntry() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();

  // Initialize REZ Consumer Intelligence on app startup
  useEffect(() => {
    initializeRezConsumerIntelligence({
      emitToParent: async (signal) => {
        try {
          await fetch(`${process.env.EXPO_PUBLIC_REZ_INTELLIGENCE_URL || 'http://localhost:4200'}/api/intelligence/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...signal, source: 'rez-app' }),
          });
        } catch (e) {
          // Parent not available - continue with local intelligence
        }
      }
    }).catch(console.warn);
  }, []);

  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();

  const [isChecking, setIsChecking] = useState(true);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRestoreRetryCountRef = useRef(0);
  const lastRedirectRef = useRef<{ path: string; at: number } | null>(null);
  // Keep a ref to authLoading so checkAppState (memoized) always reads the latest value
  const authLoadingRef = useRef(authLoading);
  useEffect(() => {
    authLoadingRef.current = authLoading;
  }, [authLoading]);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const safeReplace = useCallback(
    (targetPath: string) => {
      const now = Date.now();
      const last = lastRedirectRef.current;

      // Avoid rapid repeated redirects to the same route.
      if (last && last.path === targetPath && now - last.at < 1500) {
        return;
      }

      lastRedirectRef.current = { path: targetPath, at: now };
      router.replace(targetPath as unknown as string);
    },
    [router],
  );

  const checkAppState = useCallback(async () => {
    try {
      setIsChecking(true);

      // Check authentication first
      if (isAuthenticated && user) {
        authRestoreRetryCountRef.current = 0;

        // User is authenticated, check onboarding status
        const onboardingCompletedFlag = await AsyncStorage.getItem('onboarding_completed');
        const isOnboarded = user.isOnboarded || onboardingCompletedFlag === 'true';

        if (isOnboarded) {
          safeReplace('/(tabs)/');
        } else if (!pathname.includes('/onboarding/')) {
          safeReplace('/onboarding/location');
        }

        if (!isMounted()) return;
        setIsChecking(false);
        return;
      }

      // If we reach here, user is not authenticated.
      // Check storage briefly to avoid racing with AuthContext restoration.
      const [storedToken, storedUser] = await Promise.all([getAuthToken(), getUser()]);

      // Wait for AuthContext to finish restoring the session.
      // If authLoading is still true, we have a stored token, OR we're within our retry window,
      // keep waiting instead of redirecting to sign-in. Cap at 20 retries (8s) to prevent
      // hanging indefinitely on genuinely expired tokens.
      if (storedToken && storedUser && (authLoadingRef.current || authRestoreRetryCountRef.current < 20)) {
        if (!authLoadingRef.current) {
          authRestoreRetryCountRef.current += 1;
        }
        clearPendingTimer();
        if (!isMounted()) return;
        pendingTimerRef.current = setTimeout(() => {
          checkAppState();
        }, 400);
        return;
      }

      authRestoreRetryCountRef.current = 0;

      const onboardingCompleted = await AsyncStorage.getItem('onboarding_completed');
      if (onboardingCompleted === 'true') {
        safeReplace('/sign-in');
      } else {
        safeReplace('/onboarding/splash');
      }

      if (!isMounted()) return;
      setIsChecking(false);
    } catch (_error) {
      safeReplace('/onboarding/splash');
      if (!isMounted()) return;
      setIsChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, clearPendingTimer, pathname, safeReplace]);

  useEffect(() => {
    clearPendingTimer();

    // Wait for router to be ready before any navigation
    if (!rootNavigationState?.key) return;

    // IMPORTANT: Only run redirect logic if we're actually on the root "/" path
    // On web, page refreshes on other routes should stay on those routes
    // This prevents redirect loops when refreshing on /(tabs)/ or other pages
    const isRootPath = pathname === '/' || pathname === '';

    if (!isRootPath) {
      // User is on a specific page, don't redirect - let them stay there
      setIsChecking(false);
      return;
    }

    // Wait for auth context to initialize and react to auth changes
    if (!authLoading) {
      // Check app state immediately to prevent navigation race conditions
      checkAppState();
    }
    return () => {
      clearPendingTimer();
    };
  }, [authLoading, isAuthenticated, user, checkAppState, clearPendingTimer, pathname, rootNavigationState?.key]);

  // Only show loading screen on root path - other pages handle their own loading
  const isRootPath = pathname === '/' || pathname === '';

  if (isChecking && isRootPath) {
    return (
      <View style={styles.container}>
        <LoadingScreen duration={1000} />
      </View>
    );
  }

  // Not on root path or done checking - render nothing (let the actual page render)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default withErrorBoundary(AppEntry, 'Index');
