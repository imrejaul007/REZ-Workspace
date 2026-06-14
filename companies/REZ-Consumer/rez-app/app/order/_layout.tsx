/**
 * app/order/_layout.tsx
 *
 * Stack layout for the Web QR Ordering flow.
 * Screens: [storeSlug]/index → [storeSlug]/checkout → [storeSlug]/confirmation
 */

import { Stack } from 'expo-router';

export default function WebOrderLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="[storeSlug]/index" />
      <Stack.Screen name="[storeSlug]/checkout" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="[storeSlug]/confirmation" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
