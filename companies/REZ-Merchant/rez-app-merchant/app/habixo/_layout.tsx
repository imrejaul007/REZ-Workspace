// Habixo Merchant Dashboard Layout - Host Panel
import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const HABIXO_HOST_TABS = [
  { name: 'Dashboard', href: '/habixo', icon: '📊' },
  { name: 'Properties', href: '/habixo/properties', icon: '🏠' },
  { name: 'Bookings', href: '/habixo/bookings', icon: '📅' },
  { name: 'Calendar', href: '/habixo/calendar', icon: '🗓️' },
  { name: 'Earnings', href: '/habixo/earnings', icon: '💰' },
  { name: 'Notifications', href: '/habixo/notifications', icon: '🔔' },
  { name: 'Settings', href: '/habixo/settings', icon: '⚙️' },
];

export default function HabixoHostLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#6366f1' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Habixo Host',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="properties"
        options={{
          title: 'My Properties',
        }}
      />
      <Stack.Screen
        name="property/add"
        options={{
          title: 'Add Property',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="property/[id]"
        options={{
          title: 'Property Details',
        }}
      />
      <Stack.Screen
        name="property/[id]/edit"
        options={{
          title: 'Edit Property',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="bookings"
        options={{
          title: 'Bookings',
        }}
      />
      <Stack.Screen
        name="bookings/[id]"
        options={{
          title: 'Booking Details',
        }}
      />
      <Stack.Screen
        name="earnings"
        options={{
          title: 'Earnings',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Host Settings',
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          title: 'Booking Calendar',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
    </Stack>
  );
}
