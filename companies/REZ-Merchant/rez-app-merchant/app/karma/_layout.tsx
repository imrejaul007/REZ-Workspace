/**
 * Karma Campaigns Layout
 * Handles navigation stack for karma campaign screens
 */

import { Stack } from 'expo-router';

export default function KarmaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Campaign List */}
      <Stack.Screen name="index" />

      {/* Create Campaign */}
      <Stack.Screen
        name="create"
        options={{
          presentation: 'card',
          headerShown: true,
          headerTitle: 'Create Campaign',
          headerStyle: {
            backgroundColor: '#F8F9FE',
          },
          headerTintColor: '#1F2937',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />

      {/* Campaign Details */}
      <Stack.Screen name="[id]" />

      {/* Participants List */}
      <Stack.Screen
        name="[id]/participants"
        options={{
          presentation: 'card',
          headerShown: true,
          headerTitle: 'Participants',
          headerStyle: {
            backgroundColor: '#F8F9FE',
          },
          headerTintColor: '#1F2937',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />
    </Stack>
  );
}
