/**
 * Admin Layout
 * SECURITY FIX: Added authentication and admin role check
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useAuth } from '@/services/authContext';

export default function AdminLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // SECURITY FIX: Check authentication and admin role before allowing access
    const checkAdminAccess = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        Alert.alert('Access Denied', 'Please login to access admin features.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
        setChecking(false);
        return;
      }

      // Check for admin role (in production, verify against user roles from auth service)
      const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('ngo');

      if (!isAdmin) {
        Alert.alert('Access Denied', 'Admin privileges required.', [
          { text: 'OK', onPress: () => router.replace('/karma/home') },
        ]);
        setChecking(false);
        return;
      }

      setChecking(false);
    };

    checkAdminAccess();
  }, [isAuthenticated, isLoading, user, router]);

  if (checking || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Verifying admin access...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.gray600,
  },
});
