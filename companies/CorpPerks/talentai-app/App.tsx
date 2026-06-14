/**
 * TalentAI - Career Intelligence Mobile App
 *
 * AI-powered career development and professional growth platform
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

// Theme colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1', // Indigo
    secondary: '#8b5cf6', // Purple
    tertiary: '#ec4899', // Pink
    background: '#f8fafc',
    surface: '#ffffff',
    error: '#ef4444',
  },
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Screens
import HomeScreen from './app/(tabs)/home';
import ExploreScreen from './app/(tabs)/explore';
import ChatScreen from './app/(tabs)/chat';
import ProfileScreen from './app/(tabs)/profile';

// Auth Screens
import LoginScreen from './app/auth/login';
import RegisterScreen from './app/auth/register';

// Feature Screens
import ResumeScreen from './app/resume';
import InterviewScreen from './app/interview';
import JobsScreen from './app/jobs';
import CoursesScreen from './app/courses';
import SkillsScreen from './app/skills';
import CareerPathScreen from './app/career-path';
import AIInsightsScreen from './app/ai-insights';

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
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
            {/* Auth */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />

            {/* Main App */}
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />

            {/* Features */}
            <Stack.Screen
              name="Resume"
              component={ResumeScreen}
              options={{ title: 'AI Resume Builder' }}
            />
            <Stack.Screen
              name="Interview"
              component={InterviewScreen}
              options={{ title: 'AI Interview Prep' }}
            />
            <Stack.Screen
              name="Jobs"
              component={JobsScreen}
              options={{ title: 'Job Recommendations' }}
            />
            <Stack.Screen
              name="Courses"
              component={CoursesScreen}
              options={{ title: 'Learning Courses' }}
            />
            <Stack.Screen
              name="Skills"
              component={SkillsScreen}
              options={{ title: 'Skill Assessment' }}
            />
            <Stack.Screen
              name="CareerPath"
              component={CareerPathScreen}
              options={{ title: 'Career Path' }}
            />
            <Stack.Screen
              name="AIInsights"
              component={AIInsightsScreen}
              options={{ title: 'AI Insights' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}