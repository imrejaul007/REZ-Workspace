/**
 * Influencer Marketing Layout
 * Tab-based navigation for influencer marketplace
 */

import { Tabs, Stack, Redirect } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/DesignTokens';

export default function InfluencerLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';

  const tabBarShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0 -4px 16px rgba(168, 85, 247, 0.15)' }
      : {
          shadowColor: '#A855F7',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        };

  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Campaign',
          headerShown: true,
          headerStyle: {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[500],
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Campaign Details',
          headerShown: true,
          headerStyle: {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[500],
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="influencer/[influencerId]"
        options={{
          title: 'Influencer Profile',
          headerShown: true,
          headerStyle: {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[500],
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="applications/[campaignId]"
        options={{
          title: 'Applications',
          headerShown: true,
          headerStyle: {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[500],
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="analytics/[campaignId]"
        options={{
          title: 'Campaign Analytics',
          headerShown: true,
          headerStyle: {
            backgroundColor: scheme === 'dark' ? Colors.gray[800] : Colors.primary[500],
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
    </Stack>
  );
}

// Tab layout for main influencer section
export function InfluencerTabs() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const scheme = colorScheme ?? 'light';

  const tabBarShadowStyle =
    Platform.OS === 'web'
      ? { boxShadow: '0 -4px 16px rgba(168, 85, 247, 0.15)' }
      : {
          shadowColor: '#A855F7',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#A855F7',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: scheme === 'dark' ? Colors.gray[800] : '#FFFFFF',
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          elevation: 16,
          ...tabBarShadowStyle,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
          gap: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        headerShown: true,
        headerTransparent: false,
        headerBackground: () => {
          const gradientColors =
            colorScheme === 'dark'
              ? (['#7C3AED', '#9333EA'] as const)
              : (['#A855F7', '#8B5CF6'] as const);
          return (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1 }}
            />
          );
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: 0.3,
        },
        headerRightContainerStyle: {
          paddingRight: 12,
        },
        headerLeftContainerStyle: {
          paddingLeft: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Marketplace',
          tabBarLabel: 'Marketplace',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          tabBarLabel: 'Campaigns',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? 'megaphone' : 'megaphone-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarLabel: 'Applications',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? 'documents' : 'documents-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
