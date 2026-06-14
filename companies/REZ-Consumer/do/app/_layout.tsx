import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@/theme/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useReZMindSetup } from '@/hooks/useReZMind';
import { linkingConfig } from '@/hooks/useDeepLinking';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function REZMindInitializer() {
  // Initialize REZ Mind on app start
  useReZMindSetup();
  return null;
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <StatusBar style="light" />
      <Stack
        linking={linkingConfig}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'slide_from_right',
        }}
      >
        {/* Public routes */}
        <Stack.Screen
          name="onboarding"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            animation: 'fade',
          }}
        />

        {/* Protected routes */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="complaints"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="refunds"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings/addresses"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="settings/edit-profile"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <REZMindInitializer />
            <RootLayoutNav />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
