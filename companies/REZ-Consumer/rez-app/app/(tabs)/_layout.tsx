import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  // NOTE: onboarding_completed is set by AuthContext when the user explicitly
  // completes onboarding. Do NOT set it here — doing so would skip onboarding
  // for new users who land on the tab navigator before finishing it.

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Hide default tab bar - using custom BottomNavigation component
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="play" options={{ title: 'Play' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="earn" options={{ title: 'Earn' }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance' }} />
      <Tabs.Screen name="safe-qr" options={{ title: 'Safe QR' }} />
    </Tabs>
  );
}
