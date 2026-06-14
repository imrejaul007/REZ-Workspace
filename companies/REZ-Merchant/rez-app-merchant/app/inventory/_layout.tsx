import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="alerts"
        options={{
          title: 'Inventory Alerts',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
