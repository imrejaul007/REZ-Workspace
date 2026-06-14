// KHAIRMOVE Driver App - Entry Point
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppErrorBoundary } from './src/components/ErrorBoundary';
import DriverDashboard from './src/screens/DriverDashboard';
import RideRequestScreen from './src/screens/RideRequestScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppErrorBoundary>
      <>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Dashboard" component={DriverDashboard} />
            <Stack.Screen name="RideRequest" component={RideRequestScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </>
    </AppErrorBoundary>
  );
}
