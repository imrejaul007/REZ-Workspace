/**
 * Trigger Engine Layout
 *
 * Layout for the trigger rules management section.
 */

import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function TriggersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.light.background,
        },
        headerTintColor: Colors.light.text,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        animation: 'slide_from_right',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Trigger Engine',
          headerLargeTitle: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => router.push('/triggers/events')}
                style={{ padding: 4 }}
              >
                <Ionicons name="pulse-outline" size={22} color={Colors.light.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/triggers/create')}
                style={{ padding: 4, marginRight: 4 }}
              >
                <Ionicons name="add-circle-outline" size={22} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Create Rule',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Rule Details',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="events"
        options={{
          title: 'Triggered Events',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
