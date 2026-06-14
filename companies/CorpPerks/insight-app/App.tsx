/**
 * InsightCampus - Student Intelligence Mobile App
 *
 * AI-powered student success and campus management platform
 *
 * @author RTNM Digital
 * @version 1.0.0
 */

import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

// Theme - Green for Education
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#10b981', // Green
    secondary: '#059669', // Darker green
    tertiary: '#34d399', // Light green
    background: '#f0fdf4',
    surface: '#ffffff',
    error: '#ef4444',
  },
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Screens
import HomeScreen from './app/(tabs)/home';
import CoursesScreen from './app/(tabs)/courses';
import ScheduleScreen from './app/(tabs)/schedule';
import ProfileScreen from './app/(tabs)/profile';
import LoginScreen from './app/auth/login';

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Courses') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else iconName = 'help-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Courses" component={CoursesScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}