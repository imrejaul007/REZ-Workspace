/**
 * Restaurant Module Layout
 * Shared layout for all restaurant management screens
 */

import { Stack } from 'expo-router';
import { Colors } from '@/constants/DesignTokens';

export default function RestaurantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: Colors.gray[50],
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Restaurant Dashboard',
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'Orders',
        }}
      />
      <Stack.Screen
        name="menu"
        options={{
          title: 'Menu',
        }}
      />
      <Stack.Screen
        name="tables"
        options={{
          title: 'Tables',
        }}
      />
      <Stack.Screen
        name="reservations"
        options={{
          title: 'Reservations',
        }}
      />
      <Stack.Screen
        name="kitchen"
        options={{
          title: 'Kitchen Display',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
