import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '../src/store/appStore';
import { offline } from '../src/services/offline';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const { setIsOnline, setSyncStatus } = useAppStore();

  useEffect(() => {
    // Check initial online status
    const checkOnline = async () => {
      const status = await offline.getSyncStatus();
      setIsOnline(status.isOnline);
      setSyncStatus({
        lastSyncAt: status.lastSyncAt,
        pendingActions: status.pendingActions,
      });
    };

    checkOnline();
  }, [setIsOnline, setSyncStatus]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="post/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Post Details',
            }}
          />
          <Stack.Screen
            name="create"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Create Post',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
