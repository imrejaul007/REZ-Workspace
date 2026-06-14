import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export default function App() {
  const { state } = useAuth();

  useEffect(() => {
    logger.debug(
      `🧭 App navigation check - Loading: ${state.isLoading}, Authenticated: ${state.isAuthenticated}`
    );

    if (!state.isLoading) {
      if (state.isAuthenticated) {
        logger.debug('🏠 User authenticated - navigating to dashboard');
        router.replace('/(dashboard)');
      } else {
        logger.debug('🔐 User not authenticated - navigating to login');
        router.replace('/(auth)/login');
      }
    }
  }, [state.isLoading, state.isAuthenticated]);

  // Show loading screen while checking authentication
  if (state.isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>REZ Merchant</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  // Navigation handled by useEffect — this is a brief fallback
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginBottom: 16,
  },
  subtitle: {
    opacity: 0.7,
  },
});
