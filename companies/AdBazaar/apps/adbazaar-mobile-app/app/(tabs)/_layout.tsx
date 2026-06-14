import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useOnlineStatus } from '../../src/hooks/useOnlineStatus';
import { OfflineBanner } from '../../src/components';

interface TabIconProps {
  focused: boolean;
  icon: string;
  label: string;
}

function TabIcon({ focused, icon, label }: TabIconProps) {
  return (
    <View className="items-center justify-center">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          focused ? 'bg-indigo-100' : 'bg-transparent'
        }`}
      >
        <Text className={`text-xl ${focused ? 'text-indigo-600' : 'text-gray-400'}`}>
          {icon}
        </Text>
      </View>
      <Text
        className={`text-xs mt-1 ${focused ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { isOnline, pendingActions, syncNow } = useOnlineStatus();

  return (
    <>
      <OfflineBanner
        isOnline={isOnline}
        pendingActions={pendingActions}
        onSync={syncNow}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 80,
            paddingTop: 10,
            paddingBottom: 20,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="🏠" label="Home" />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="✏️" label="Create" />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="📅" label="Calendar" />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="📊" label="Analytics" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} icon="👤" label="Profile" />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
