'use client';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, Shield, CreditCard, Wallet, Settings } from 'lucide-react-native';

interface TabIconProps {
  name: string;
  focused: boolean;
}

function TabIcon({ name, focused }: TabIconProps) {
  const icons: Record<string, React.ReactNode> = {
    index: <Home size={22} color={focused ? '#6366f1' : '#666'} />,
    score: <Shield size={22} color={focused ? '#6366f1' : '#666'} />,
    passport: <CreditCard size={22} color={focused ? '#6366f1' : '#666'} />,
    wallet: <Wallet size={22} color={focused ? '#6366f1' : '#666'} />,
    settings: <Settings size={22} color={focused ? '#6366f1' : '#666'} />,
  };

  return (
    <View style={styles.tabIcon}>
      {icons[name] || icons.index}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="score"
        options={{
          title: 'CI Score',
          tabBarIcon: ({ focused }) => <TabIcon name="score" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: 'Passport',
          tabBarIcon: ({ focused }) => <TabIcon name="passport" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused }) => <TabIcon name="wallet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  iconFocused: {
    transform: [{ scale: 1.1 }],
  },
});
