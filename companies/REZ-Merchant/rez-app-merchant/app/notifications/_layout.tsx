import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function NotificationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#111827',
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Notifications',
          headerLargeTitle: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/notifications/preferences')}
                style={{ padding: 4 }}
              >
                <Ionicons name="options-outline" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/notifications/settings')}
                style={{ padding: 4, marginRight: 4 }}
              >
                <Ionicons name="settings-outline" size={22} color="#111827" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="[notificationId]"
        options={{
          title: 'Notification Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="preferences"
        options={{
          title: 'Notification Preferences',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Advanced Settings',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
