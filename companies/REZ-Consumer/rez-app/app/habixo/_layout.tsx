// Habixo App Layout - Smart Living OS powered by ReZ
import { Stack } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const HABIXO_TABS = [
  { name: 'Explore', href: '/habixo', icon: '🏠' },
  { name: 'Stays', href: '/habixo/stays', icon: '🏨' },
  { name: 'Hourly', href: '/habixo/hourly', icon: '⏰' },
  { name: 'Rent', href: '/habixo/rent', icon: '🏢' },
  { name: 'Match', href: '/habixo/match', icon: '👥' },
  { name: 'Bookings', href: '/habixo/bookings', icon: '📅' },
  { name: 'Messages', href: '/habixo/messages', icon: '💬' },
];

export default function HabixoLayout() {
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
          title: 'Habixo',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="stays"
        options={{
          title: 'Stay',
        }}
      />
      <Stack.Screen
        name="rent"
        options={{
          title: 'Rent',
        }}
      />
      <Stack.Screen
        name="match"
        options={{
          title: 'Match',
        }}
      />
      <Stack.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
        }}
      />
      <Stack.Screen
        name="property/[id]"
        options={{
          title: 'Property Details',
        }}
      />
      <Stack.Screen
        name="booking/[id]"
        options={{
          title: 'Booking Details',
        }}
      />
      <Stack.Screen
        name="search"
        options={{
          title: 'Search',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          title: 'Checkout',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="hourly"
        options={{
          title: 'Hourly Booking',
        }}
      />
      <Stack.Screen
        name="hourly/[id]"
        options={{
          title: 'Book Time Slot',
        }}
      />
      <Stack.Screen
        name="messages"
        options={{
          title: 'Messages',
        }}
      />
      <Stack.Screen
        name="messages/[id]"
        options={{
          title: 'Conversation',
        }}
      />
    </Stack>
  );
}
