import { logger } from '../../shared/logger';
/**
 * ReZ Ride User App - Production Ready
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Services
import { secureStorage } from './src/services/secure-storage';
import { offlineQueue } from './src/services/offline-queue';
import { biometricService } from './src/services/biometric.service';
import crashReporting from './src/services/crash-reporting';
import analytics from './src/services/analytics.service';
import { pushService } from './src/services/push.service';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import HomeScreen from './src/screens/HomeScreen';
import LocationSearchScreen from './src/screens/LocationSearchScreen';
import AddStopScreen from './src/screens/AddStopScreen';
import ConfirmRideScreen from './src/screens/ConfirmRideScreen';
import FindingDriverScreen from './src/screens/FindingDriverScreen';
import InRideScreen from './src/screens/InRideScreen';
import RideDetailsScreen from './src/screens/RideDetailsScreen';
import RatingScreen from './src/screens/RatingScreen';
import WalletScreen from './src/screens/WalletScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RideHistoryScreen from './src/screens/RideHistoryScreen';
import SupportScreen from './src/screens/SupportScreen';

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Deep linking configuration
const linking: LinkingOptions<any> = {
  prefixes: ['rezride://', 'https://rezride.com', 'https://www.rezride.com'],
  config: {
    screens: {
      Home: { path: 'home' },
      ConfirmRide: { path: 'ride/:rideId' },
      RideDetails: { path: 'ride/:rideId/details' },
      Profile: { path: 'profile' },
      Wallet: { path: 'wallet' },
      Support: { path: 'support' },
    },
  },
};

// Loading screen component
const LoadingScreen: React.FC = () => (
  <ErrorBoundary>
    <StatusBar barStyle="dark-content" backgroundColor="#fff" />
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#6B4EFF' }}>ReZ Ride</Text>
      <ActivityIndicator size="large" color="#6B4EFF" style={{ marginTop: 20 }} />
    </View>
  </ErrorBoundary>
);

// Import required components
import { View, Text, ActivityIndicator } from 'react-native';

// Main Tab Navigator
const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'home';
        if (route.name === 'Rides') iconName = 'car';
        else if (route.name === 'Wallet') iconName = 'wallet';
        else if (route.name === 'Profile') iconName = 'person';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#6B4EFF',
      tabBarInactiveTintColor: '#666',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Rides" component={RideHistoryScreen} options={{ title: 'My Rides' }} />
    <Tab.Screen name="Wallet" component={WalletScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
);

// Auth Stack
const AuthStack: React.FC<{ onVerified: () => void }> = ({ onVerified }) => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login">
      {({ navigation }: any) => <LoginScreen navigation={navigation} onBiometricAuth={onVerified} />}
    </Stack.Screen>
    <Stack.Screen name="OTP">
      {({ route }: any) => (
        <OTPScreen
          phone={route.params?.phone}
          onVerified={onVerified}
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

// Main App Stack
const AppStack: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
    <Stack.Screen name="LocationSearch">
      {({ navigation, route }: any) => <LocationSearchScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="AddStop">
      {({ navigation, route }: any) => <AddStopScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="ConfirmRide">
      {({ navigation, route }: any) => <ConfirmRideScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="FindingDriver">
      {({ navigation, route }: any) => <FindingDriverScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="InRide">
      {({ navigation, route }: any) => <InRideScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="RideDetails">
      {({ navigation, route }: any) => <RideDetailsScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="Rating">
      {({ navigation, route }: any) => <RatingScreen navigation={navigation} route={route} />}
    </Stack.Screen>
    <Stack.Screen name="Support">
      {({ navigation, route }: any) => <SupportScreen navigation={navigation} route={route} />}
    </Stack.Screen>
  </Stack.Navigator>
);

// Root App Component
const RootApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      crashReporting.initialize();
      analytics.initialize();
      await biometricService.initialize();
      await pushService.initialize();

      const hasToken = await secureStorage.isLoggedIn();
      setIsAuthenticated(hasToken);

      setupNotificationListeners();
      setupConnectivityMonitoring();
    } catch (error) {
      logger.error('App initialization failed:', error);
      crashReporting.captureError(error as Error, { context: 'initialization' });
    } finally {
      setIsLoading(false);
    }
  };

  const setupNotificationListeners = () => {
    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationTap(data);
      }
    );

    const notificationSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        crashReporting.addBreadcrumb('Notification received', {
          title: notification.request.content.title,
        });
      }
    );

    return () => {
      notificationResponseSubscription.remove();
      notificationSubscription.remove();
    };
  };

  const handleNotificationTap = (data: any) => {
    if (!data) return;
    switch (data.type) {
      case 'ride_confirmed':
      case 'driver_arrived':
      case 'ride_started':
      case 'ride_completed':
        crashReporting.logUserAction('notification_tap', { type: data.type, rideId: data.rideId });
        break;
      case 'offer':
        crashReporting.logUserAction('notification_tap', { type: 'offer' });
        break;
    }
  };

  const setupConnectivityMonitoring = () => {
    offlineQueue.onConnectivityChange((online) => {
      if (online) {
        analytics.track('network_online');
      } else {
        analytics.track('network_offline');
      }
    });
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    analytics.track('user_login');
    crashReporting.logUserAction('authenticated');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer
        linking={linking}
        onReady={() => {
          analytics.track('app_ready');
          crashReporting.addBreadcrumb('App ready');
        }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {isAuthenticated ? <AppStack /> : <AuthStack onVerified={handleAuthenticated} />}
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default function App() {
  return <RootApp />;
}
