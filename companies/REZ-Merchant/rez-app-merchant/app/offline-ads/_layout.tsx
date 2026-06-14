/**
 * Offline Ads Layout
 *
 * Stack navigation for offline advertising management:
 * - List view (index)
 * - Create ad (create)
 * - Ad details with QR (id)
 */

import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function OfflineAdsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: Colors.light.backgroundSecondary,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Offline Ads',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Ad',
          presentation: 'modal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Ad Details',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
