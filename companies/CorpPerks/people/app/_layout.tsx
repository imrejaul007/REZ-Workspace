import { logger } from '../../shared/logger';
// ==========================================
// MyTalent - Root Layout
// Integrates auth state with Expo Router
// ==========================================

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Auth
import { useAuthStore } from '../src/store/authStore';

// Push Notification Service URL
const PUSH_SERVICE_URL = Constants.expoConfig?.extra?.pushServiceUrl || 'http://localhost:4749';

// ==========================================
// Configure Notification Handler
// ==========================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==========================================
// Register for Push Notifications
// ==========================================

async function registerForPushNotificationsAsync(userId: string, companyId?: string): Promise<string | null> {
  if (!Device.isDevice) {
    logger.info('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.info('Permission for notifications was not granted');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.ios?.bundleId || Constants.expoConfig?.android?.package,
    });

    const token = tokenData.data;

    // Register token with backend
    if (userId && companyId) {
      try {
        await fetch(`${PUSH_SERVICE_URL}/api/push/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            companyId,
            expoPushToken: token,
            platform: Platform.OS,
            appVersion: Constants.expoConfig?.version,
            osVersion: Platform.Version?.toString(),
          }),
        });
        logger.info('Push token registered with backend');
      } catch (error) {
        logger.error('Failed to register push token:', error);
      }
    }

    return token;
  } catch (error) {
    logger.error('Failed to get push token:', error);
    return null;
  }
}

// ==========================================
// Colors
// ==========================================

const COLORS = {
  background: '#0F172A',
  primary: '#6366F1',
  card: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
};

// ==========================================
// Loading Screen
// ==========================================

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

// ==========================================
// Root Layout Component
// ==========================================

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  const { initialize, isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
      } catch (error) {
        logger.error('Auth initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };

    init();

    // Setup notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      logger.info('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      logger.info('Notification tapped:', response);
      // Handle notification tap - navigate to relevant screen
      const data = response.notification.request.content.data;
      if (data?.deepLink) {
        // Handle deep link navigation
        logger.info('Deep link:', data.deepLink);
      }
    });

    // Register for push notifications after auth is ready
    if (isAuthenticated && user) {
      registerForPushNotificationsAsync(user.id, user.companyId).then(token => {
        if (token) {
          logger.info('Push token obtained:', token);
        }
      });
    }

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [initialize, isAuthenticated, user]);

  // Show loading while initializing
  if (!isReady || !isInitialized) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen
          name="auth/login"
          options={{
            title: 'Sign In',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="auth/register"
          options={{
            title: 'Create Account',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            title: 'Reset Password',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="auth/otp-verify"
          options={{
            title: 'Verify',
            animation: 'fade',
            gestureEnabled: false,
          }}
        />

        {/* Main App Tabs */}
        <Stack.Screen
          name="(tabs)"
          options={{
            title: 'MyTalent',
            animation: 'fade',
          }}
        />

        {/* All other screens are handled by tabs/nested stacks */}
      </Stack>
    </SafeAreaProvider>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
