/**
 * REZ KDS Mobile App
 * Kitchen Display System for REZ ecosystem
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Updates from 'expo-updates';
import * as Device from 'expo-device';

// Screens
import { KitchenScreen } from './src/screens';
import OrderDetailScreen from './src/screens/OrderDetail';

// Types
type RootStackParamList = {
  Kitchen: undefined;
  OrderDetail: { orderId: string };
  Settings: undefined;
  Recent: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Ignore specific warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

/**
 * Error Boundary Component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('KDS App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <Text
            style={styles.reloadButton}
            onPress={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            Tap to reload
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Loading Screen Component
 */
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
    <Text style={styles.loadingLogo}>REZ</Text>
    <Text style={styles.loadingSubtitle}>KDS</Text>
    <Text style={styles.loadingText}>Initializing...</Text>
  </View>
);

/**
 * Update Available Modal
 */
const UpdateModal: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => (
  <View style={styles.updateModal}>
    <View style={styles.updateContent}>
      <Text style={styles.updateTitle}>Update Available</Text>
      <Text style={styles.updateMessage}>
        A new version of KDS is available. Please update to continue.
      </Text>
      <Text style={styles.updateButton} onPress={onUpdate}>
        UPDATE NOW
      </Text>
    </View>
  </View>
);

/**
 * Main App Component
 */
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initialize app
    const initialize = async () => {
      try {
        // Check for updates in production
        if (!__DEV__ && Updates.updateId) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setUpdateAvailable(true);
          }
        }

        // Log device info
        console.log('KDS App Starting...');
        console.log('Device:', Device.modelName);
        console.log('Platform:', Device.platformApiLevel);

        // Initialize services
        // await kdsNotifications.initialize();
        // await kdsApi.validateToken();

        // Small delay for splash screen
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Handle update
  const handleUpdate = async () => {
    try {
      await Updates.fetchUpdateAsync();
      Updates.reloadAsync();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show update modal
  if (updateAvailable) {
    return <UpdateModal onUpdate={handleUpdate} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
          <NavigationContainer
            theme={{
              dark: true,
              colors: {
                primary: '#2196F3',
                background: '#121220',
                card: '#1a1a2e',
                text: '#FFFFFF',
                border: '#2a2a3e',
                notification: '#F44336',
              },
            }}
          >
            <Stack.Navigator
              initialRouteName="Kitchen"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#121220' },
              }}
            >
              <Stack.Screen name="Kitchen" component={KitchenScreen} />
              <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121220',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  loadingSubtitle: {
    fontSize: 18,
    color: '#888888',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  reloadButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  updateModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateContent: {
    backgroundColor: '#1a1a2e',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
  },
  updateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  updateMessage: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  updateButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default App;
