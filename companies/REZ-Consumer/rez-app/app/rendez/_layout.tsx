/**
 * Rendez Social Offers Layout
 *
 * Couple and group dining experiences
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/DesignSystem';

export default function RendezLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? Colors.gray[900] : Colors.background,
        },
        headerTintColor: isDark ? Colors.gray[100] : Colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: isDark ? Colors.gray[900] : Colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'rendez',
          headerShown: false,
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
