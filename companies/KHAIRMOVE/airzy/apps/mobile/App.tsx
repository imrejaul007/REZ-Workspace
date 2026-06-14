/**
 * Airzy Mobile App
 * Smart companion for frequent travelers
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import HomeScreen from './screens/HomeScreen';
import FlightsScreen from './screens/FlightsScreen';
import FlightSearchScreen from './screens/FlightSearchScreen';
import FlightDetailsScreen from './screens/FlightDetailsScreen';
import LoungeSearchScreen from './screens/LoungeSearchScreen';
import LoungeDetailsScreen from './screens/LoungeDetailsScreen';
import ItineraryScreen from './screens/ItineraryScreen';
import ItineraryDetailsScreen from './screens/ItineraryDetailsScreen';
import WalletScreen from './screens/WalletScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  FlightSearch: undefined;
  FlightDetails: { offerId: string };
  LoungeSearch: { airport?: string };
  LoungeDetails: { loungeId: string };
  ItineraryDetails: { itineraryId: string };
  CreateTrip: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Flights: undefined;
  Lounges: undefined;
  Trips: undefined;
  Wallet: undefined;
};

// Create navigation
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Tab Icons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>
      {name[0]}
    </Text>
  </View>
);

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Flights"
        component={FlightsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Flights" focused={focused} />,
          tabBarLabel: 'Flights',
        }}
      />
      <Tab.Screen
        name="Lounges"
        component={LoungeSearchScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Lounges" focused={focused} />,
          tabBarLabel: 'Lounges',
        }}
      />
      <Tab.Screen
        name="Trips"
        component={ItineraryScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Trips" focused={focused} />,
          tabBarLabel: 'Trips',
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="Wallet" focused={focused} />,
          tabBarLabel: 'Coins',
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main App Stack
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#6366F1' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FlightSearch"
        component={FlightSearchScreen}
        options={{ title: 'Search Flights' }}
      />
      <Stack.Screen
        name="FlightDetails"
        component={FlightDetailsScreen}
        options={{ title: 'Flight Details' }}
      />
      <Stack.Screen
        name="LoungeSearch"
        component={LoungeSearchScreen}
        options={{ title: 'Find Lounges' }}
      />
      <Stack.Screen
        name="LoungeDetails"
        component={LoungeDetailsScreen}
        options={{ title: 'Lounge Details' }}
      />
      <Stack.Screen
        name="ItineraryDetails"
        component={ItineraryDetailsScreen}
        options={{ title: 'Trip Details' }}
      />
      <Stack.Screen
        name="CreateTrip"
        component={ItineraryScreen}
        options={{ title: 'Create Trip' }}
      />
    </Stack.Navigator>
  );
}

// Root Navigator
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Replace with Auth check */}
          <Stack.Screen name="Main" component={AppStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconFocused: {
    backgroundColor: '#EEF2FF',
  },
  tabIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabIconTextFocused: {
    color: '#6366F1',
  },
});
