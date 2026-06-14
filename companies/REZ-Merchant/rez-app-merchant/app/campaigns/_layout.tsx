import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/DesignTokens';

export default function CampaignsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary[500] },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="roi" options={{ title: 'Campaign ROI' }} />
      <Stack.Screen name="simulator" options={{ title: 'Campaign Simulator' }} />
      <Stack.Screen name="recommendations" options={{ title: 'AI Recommendations' }} />
      <Stack.Screen name="performance" options={{ title: 'Campaign Performance' }} />
      <Stack.Screen name="discounts" options={{ title: 'Discount Rules' }} />
      <Stack.Screen name="loyalty" options={{ title: 'Loyalty Programs' }} />
    </Stack>
  );
}
