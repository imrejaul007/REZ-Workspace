// ==========================================
// MyTalent - Protected Route Component
// Wraps routes that require authentication
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';

// ==========================================
// Types
// ==========================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

type RouteType = 'auth' | 'tabs' | 'profile' | 'settings';

// ==========================================
// Component
// ==========================================

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isReady, setIsReady] = useState(false);

  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth to initialize
    if (isInitialized) {
      setIsReady(true);

      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.replace('/auth/login');
      }
    }
  }, [isInitialized, isAuthenticated]);

  // Show loading state while checking auth
  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show fallback or null while redirecting
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Redirecting...</Text>
    </View>
  );
}

// ==========================================
// Guest Route (for login/register pages)
// ==========================================

interface GuestRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function GuestRoute({ children, fallback }: GuestRouteProps) {
  const [isReady, setIsReady] = useState(false);

  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized) {
      setIsReady(true);

      // Redirect to home if already authenticated
      if (isAuthenticated) {
        router.replace('/(tabs)');
      }
    }
  }, [isInitialized, isAuthenticated]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show login/register pages only if not authenticated
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}

// ==========================================
// Auth Guard Hook
// ==========================================

export function useAuthGuard() {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStore();

  const checkAuth = (): boolean => {
    if (!isInitialized || isLoading) {
      return false;
    }
    return isAuthenticated;
  };

  const requireAuth = (redirectTo: string = '/auth/login'): boolean => {
    if (!checkAuth()) {
      router.replace(redirectTo);
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    isInitialized,
    isLoading,
    checkAuth,
    requireAuth,
  };
}

// ==========================================
// Loading Screen
// ==========================================

export function AuthLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>MT</Text>
        </View>
        <Text style={styles.appName}>MyTalent</Text>
      </View>
      <ActivityIndicator size="small" color="#6366F1" style={styles.spinner} />
    </View>
  );
}

// ==========================================
// Logout Confirmation Modal
// ==========================================

export function useLogoutConfirmation() {
  const { logout } = useAuthStore();

  const confirmLogout = async (): Promise<boolean> => {
    try {
      await logout();
      router.replace('/auth/login');
      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      return false;
    }
  };

  return { confirmLogout };
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#94A3B8',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  spinner: {
    marginTop: 24,
  },
});

export default ProtectedRoute;
