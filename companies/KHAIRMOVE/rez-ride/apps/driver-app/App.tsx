import { logger } from '../../shared/logger';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Services
import { pushService } from './src/services/push.service';
import { secureStorage } from './src/services/secure-storage';
import { biometricService } from './src/services/biometric.service';
import { driverApi } from './src/services/api.service';
import analytics from './src/services/analytics.service';
import crashReporting from './src/services/crash-reporting';

// Screens
import DriverLoginScreen from './src/screens/DriverLoginScreen';
import DriverOTPScreen from './src/screens/DriverOTPScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import IncomingRideScreen from './src/screens/IncomingRideScreen';
import DriverRideActiveScreen from './src/screens/DriverRideActiveScreen';
import DriverEarningsScreen from './src/screens/DriverEarningsScreen';
import DriverProfileScreen from './src/screens/DriverProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Deep linking for driver app
const linking: LinkingOptions<any> = {
  prefixes: ['rezridedriver://', 'https://driver.rezride.com'],
  config: {
    screens: {
      Home: {
        path: 'home',
      },
      Earnings: {
        path: 'earnings',
      },
      Profile: {
        path: 'profile',
      },
    },
  },
};

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName = 'home';
        if (route.name === 'Earnings') iconName = 'cash';
        else if (route.name === 'Profile') iconName = 'person';
        return <Ionicons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6B4EFF',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2d2d44' },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={DriverHomeScreen} />
    <Tab.Screen name="Earnings" component={DriverEarningsScreen} />
    <Tab.Screen name="Profile" component={DriverProfileScreen} />
  </Tab.Navigator>
);

type AuthState = 'loading' | 'phone' | 'otp' | 'authenticated';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [pendingPhone, setPendingPhone] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      crashReporting.initialize();
      analytics.initialize();
      await biometricService.initialize();
      await pushService.initialize();

      const token = await secureStorage.getToken();
      if (token) {
        driverApi.setToken(token);
        setAuthState('authenticated');
      } else {
        setAuthState('phone');
      }

      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        handleNotificationTap(data);
      });
    } catch (error) {
      logger.error('App initialization failed:', error);
      setAuthState('phone');
    }
  };

  const handleNotificationTap = (data: any) => {
    if (!data) return;
    // Handle driver-specific notifications
  };

  const handlePhoneSubmitted = (phone: string) => {
    setPendingPhone(phone);
    setAuthState('otp');
  };

  const handleOTPVerified = (token: string, driver: any) => {
    driverApi.setToken(token);
    analytics.track('driver_login');
    setAuthState('authenticated');
  };

  const handleOTPBack = () => {
    setPendingPhone('');
    setAuthState('phone');
  };

  const handleLogout = async () => {
    await secureStorage.clearAll();
    driverApi.setToken('');
    analytics.track('driver_logout');
    setAuthState('phone');
    setPendingPhone('');
  };

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>ReZ Ride</Text>
        <Text style={{ color: '#6B4EFF', fontSize: 14, marginTop: 8 }}>Driver App</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer linking={linking}>
        <StatusBar style="light" />
        {authState === 'phone' && (
          <DriverLoginScreen onPhoneSubmitted={handlePhoneSubmitted} />
        )}
        {authState === 'otp' && (
          <DriverOTPScreen
            phone={pendingPhone}
            onVerified={handleOTPVerified}
            onBack={handleOTPBack}
          />
        )}
        {authState === 'authenticated' && (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main">
              {() => <MainTabs />}
            </Stack.Screen>
            <Stack.Screen
              name="IncomingRide"
              component={IncomingRideScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="ActiveRide" component={DriverRideActiveScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </ErrorBoundary>
  );
}
