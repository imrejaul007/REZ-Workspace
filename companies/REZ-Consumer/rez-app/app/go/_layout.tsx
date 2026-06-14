import { Stack } from 'expo-router';
import { GoProvider } from '@/components/go/GoContext';
import { View, StyleSheet } from 'react-native';

export default function GoLayout() {
  return (
    <GoProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'REZ Go' }} />
        <Stack.Screen name="store/[storeId]" options={{ title: 'Store' }} />
        <Stack.Screen name="scan" options={{ title: 'Scan Products' }} />
        <Stack.Screen name="cart" options={{ title: 'Your Cart' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="success" options={{ title: 'Success' }} />
      </Stack>
    </GoProvider>
  );
}
