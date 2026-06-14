/**
 * StayOwn Staff App - App Layout
 * Root layout with providers and navigation
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#2563EB' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: 'StayOwn Staff', headerShown: false }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="room/[id]"
            options={{ title: 'Room Details' }}
          />
          <Stack.Screen
            name="guest/[id]"
            options={{ title: 'Guest Details' }}
          />
          <Stack.Screen
            name="scan"
            options={{ title: 'Scan QR', presentation: 'modal' }}
          />
        </Stack>
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
