/**
 * Savings Module Layout
 * Wraps all savings screens with SavingsProvider
 */

import { Stack } from 'expo-router';
import { SavingsProvider } from '@/contexts/SavingsContext';
import { Colors } from '@/constants/DesignSystem';

export default function SavingsLayout() {
  return (
    <SavingsProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'My Savings',
          }}
        />
        <Stack.Screen
          name="goals"
          options={{
            title: 'Savings Goals',
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            title: 'Savings History',
          }}
        />
      </Stack>
    </SavingsProvider>
  );
}
