// KHAIRMOVE User App - Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RideScreen from '../screens/RideScreen';
import TrackingScreen from '../screens/TrackingScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Main: undefined;
  Ride: undefined;
  Tracking: { rideId: string };
};

export type TabParamList = {
  Home: undefined;
  Rides: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Rides: '📋',
    Profile: '👤',
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>{icons[name]}</Text>
      <Text
        style={{
          fontSize: 10,
          color: focused ? '#3B82F6' : '#6B7280',
          fontWeight: focused ? '600' : '400',
          marginTop: 2,
        }}
      >
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
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Rides" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Ride" component={RideScreen} />
        <Stack.Screen name="Tracking" component={TrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
