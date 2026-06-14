import { logger } from '../../shared/logger';
/**
 * MyRisa Mobile App
 * "Your Health. Understood."
 *
 * Personal Wellbeing Intelligence Platform
 */

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import Women'sHealthScreen from './src/screens/WomensHealthScreen';
import MentalHealthScreen from './src/screens/MentalHealthScreen';
import SleepScreen from './src/screens/SleepScreen';
import WorkLifeScreen from './src/screens/WorkLifeScreen';
import LifestyleScreen from './src/screens/LifestyleScreen';
import RelationshipsScreen from './src/screens/RelationshipsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ConsultationScreen from './src/screens/ConsultationScreen';
import TwinScreen from './src/screens/TwinScreen';

// Theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E57373',
    secondary: '#BA68C8',
    tertiary: '#7986CB',
    quaternary: '#4DB6AC',
  },
};

// Navigation
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 28 : 24, opacity: focused ? 1 : 0.6 }}>
    {emoji}
  </Text>
);

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Home: '🏠',
            Health: '🌸',
            Mind: '🧠',
            Sleep: '😴',
            Life: '⚡',
            Profile: '👤',
          };
          return <TabIcon emoji={icons[route.name] || '•'} focused={focused} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Health" component={Women'sHealthScreen} options={{ title: 'Health' }} />
      <Tab.Screen name="Mind" component={MentalHealthScreen} options={{ title: 'Mind' }} />
      <Tab.Screen name="Sleep" component={SleepScreen} options={{ title: 'Sleep' }} />
      <Tab.Screen name="Life" component={WorkLifeScreen} options={{ title: 'Life' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

// App Component
export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userId');
      if (stored) {
        setUserId(stored);
      } else {
        const newId = `user_${Date.now()}`;
        await AsyncStorage.setItem('userId', newId);
        setUserId(newId);
      }
    } catch (error) {
      logger.error('Error initializing user:', error);
      // Generate fallback ID
      setUserId(`user_${Date.now()}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E57373' }}>
        <Text style={{ fontSize: 24, color: '#fff', fontWeight: 'bold' }}>MyRisa</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>Your Health. Understood.</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#E57373" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
            }}
          >
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{ title: 'Dashboard' }}
            />
            <Stack.Screen
              name="Consultation"
              component={ConsultationScreen}
              options={{ title: 'Consultations' }}
            />
            <Stack.Screen
              name="Twin"
              component={TwinScreen}
              options={{ title: 'Health Twin' }}
            />
            <Stack.Screen
              name="Lifestyle"
              component={LifestyleScreen}
              options={{ title: 'Lifestyle' }}
            />
            <Stack.Screen
              name="Relationships"
              component={RelationshipsScreen}
              options={{ title: 'Relationships' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}