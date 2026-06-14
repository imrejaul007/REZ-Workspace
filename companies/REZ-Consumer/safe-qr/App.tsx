import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import MyQRsScreen from './src/screens/MyQRsScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import KarmaScreen from './src/screens/KarmaScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CreateQRScreen from './src/screens/CreateQRScreen';
import QRDetailScreen from './src/screens/QRDetailScreen';
import ScanResultScreen from './src/screens/ScanResultScreen';
import MessageScreen from './src/screens/MessageScreen';

// Context
import { AuthProvider } from './src/context/AuthContext';
import { SafeQRProvider } from './src/context/SafeQRContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="scan" color={color} />,
          tabBarLabel: 'Scan',
        }}
      />
      <Tab.Screen
        name="My QRs"
        component={MyQRsScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="qr" color={color} />,
          tabBarLabel: 'My QRs',
        }}
      />
      <Tab.Screen
        name="Karma"
        component={KarmaScreen}
        options={{
          tabBarIcon: ({ color }) => <TabIcon name="karma" color={color} />,
          tabBarLabel: 'Karma',
        }}
      />
    </Tab.Navigator>
  );
}

// Simple text-based icons (replace with actual icons)
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    scan: '📷',
    qr: '🏷️',
    karma: '⭐',
  };
  return <>{icons[name] || '●'}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <SafeQRProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerShown: true,
              headerStyle: { backgroundColor: '#6366f1' },
              headerTintColor: '#ffffff',
              headerTitleStyle: { fontWeight: '600' },
            }}
          >
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CreateQR"
              component={CreateQRScreen}
              options={{ title: 'Create Safe QR' }}
            />
            <Stack.Screen
              name="QRDetail"
              component={QRDetailScreen}
              options={{ title: 'QR Details' }}
            />
            <Stack.Screen
              name="ScanResult"
              component={ScanResultScreen}
              options={{ title: 'Scan Result' }}
            />
            <Stack.Screen
              name="Message"
              component={MessageScreen}
              options={{ title: 'Messages' }}
            />
            <Stack.Screen
              name="Sessions"
              component={SessionsScreen}
              options={{ title: 'Conversations' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeQRProvider>
    </AuthProvider>
  );
}
