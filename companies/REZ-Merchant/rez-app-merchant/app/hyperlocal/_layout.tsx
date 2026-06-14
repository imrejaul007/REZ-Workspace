/**
 * Hyperlocal Network Layout
 *
 * Handles the Hyperlocal Network feature for merchant-to-merchant partnerships:
 * - Discover nearby merchants
 * - Create cross-promotion partnerships
 * - Split cost campaigns
 * - Track mutual referrals
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';

export default function HyperlocalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.gray[50],
        },
        headerTintColor: Colors.gray[900],
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Hyperlocal Network',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="discover"
        options={{
          title: 'Discover Partners',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Partnership',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Partnership Details',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
