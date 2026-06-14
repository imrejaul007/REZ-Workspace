import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';

// Import auth store for auth state
import { useAuthStore } from '../stores/auth';

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a2e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: '#16213e',
            },
            animation: 'slide_from_right',
          }}
        >
          {/* Auth Screens */}
          {!isAuthenticated && (
            <>
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="auth/login"
                options={{
                  title: 'Login',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="auth/signup"
                options={{
                  title: 'Sign Up',
                  headerShown: false,
                }}
              />
            </>
          )}

          {/* Main App Screens */}
          {isAuthenticated && (
            <>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />
            </>
          )}

          {/* Ride Screens */}
          <Stack.Screen
            name="ride/[id]"
            options={{
              title: 'Ride Details',
            }}
          />
          <Stack.Screen
            name="ride/history"
            options={{
              title: 'Ride History',
            }}
          />

          {/* Profile Screens */}
          <Stack.Screen
            name="profile/bikes"
            options={{
              title: 'My Bikes',
            }}
          />
          <Stack.Screen
            name="profile/add-bike"
            options={{
              title: 'Add Bike',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="profile/settings"
            options={{
              title: 'Settings',
            }}
          />

          {/* Community Screens */}
          <Stack.Screen
            name="community/groups"
            options={{
              title: 'Groups',
            }}
          />
          <Stack.Screen
            name="community/events"
            options={{
              title: 'Events',
            }}
          />

          {/* Modal Screens */}
          <Stack.Screen
            name="ride/memory"
            options={{
              title: 'Ride Memory',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="sos"
            options={{
              title: 'Emergency SOS',
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="genie"
            options={{
              title: 'Genie',
              presentation: 'modal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile/safeqr"
            options={{
              title: 'SafeQR',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="profile/memories"
            options={{
              title: 'My Memories',
            }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{
              title: 'Edit Profile',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="profile/emergency"
            options={{
              title: 'Emergency Contacts',
            }}
          />

          {/* Help & Legal */}
          <Stack.Screen
            name="help"
            options={{
              title: 'Help Center',
            }}
          />
          <Stack.Screen
            name="legal/terms"
            options={{
              title: 'Terms of Service',
            }}
          />
          <Stack.Screen
            name="legal/privacy"
            options={{
              title: 'Privacy Policy',
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
});