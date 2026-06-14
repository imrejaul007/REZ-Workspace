/**
 * Rendez Social Offers Layout
 *
 * Social offers allow merchants to create couple and group dining experiences
 * with context-based rules (specific days, holidays, etc.)
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function RendezLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Social Offers',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Offer',
          presentation: 'modal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Offer Details',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
