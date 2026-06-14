/**
 * StayOwn Guest Mobile App
 *
 * Features:
 * - Hotel search & booking
 * - Digital check-in (Room QR)
 * - In-stay services (room service, housekeeping)
 * - Chat with hotel
 * - Post-stay reviews
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Screens
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import HotelDetailScreen from './screens/HotelDetailScreen';
import BookingScreen from './screens/BookingScreen';
import CheckInScreen from './screens/CheckInScreen';
import ServicesScreen from './screens/ServicesScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import MyTripsScreen from './screens/MyTripsScreen';

// Types
export type RootStackParamList = {
  Main: undefined;
  Search: { query?: string };
  HotelDetail: { hotelId: string };
  Booking: { hotelId: string; roomId: string };
  CheckIn: { bookingId: string };
  Services: { bookingId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  MyTrips: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Theme
const COLORS = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  accent: '#F59E0B',
  background: '#F9FAFB',
  white: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  success: '#10B981',
  error: '#EF4444',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Search: '🔍',
    MyTrips: '🧳',
    Messages: '💬',
    Profile: '👤',
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 22 }}>{icons[name] || '•'}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {name}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="MyTrips" component={MyTripsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Search Hotels' }}
        />
        <Stack.Screen
          name="HotelDetail"
          component={HotelDetailScreen}
          options={{ title: 'Hotel Details' }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ title: 'Book Room' }}
        />
        <Stack.Screen
          name="CheckIn"
          component={CheckInScreen}
          options={{ title: 'Digital Check-in' }}
        />
        <Stack.Screen
          name="Services"
          component={ServicesScreen}
          options={{ title: 'Hotel Services' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: 80,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
