/**
 * REZ Verify QR - Root Layout
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366F1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'REZ Verify QR' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan QR Code' }} />
        <Stack.Screen name="verify" options={{ title: 'Verify Product' }} />
        <Stack.Screen name="warranty" options={{ title: 'Warranty' }} />
        <Stack.Screen name="claims" options={{ title: 'My Claims' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="service-center" options={{ title: 'Service Centers' }} />
      </Stack>
    </QueryClientProvider>
  );
}
