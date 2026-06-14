import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useGo } from '@/components/go/GoContext';

export default function StoreEntryScreen() {
  const { storeId, action, sessionId } = useLocalSearchParams<{
    storeId: string;
    action?: string;
    sessionId?: string;
  }>();
  const router = useRouter();
  const { startSession, resumeSession, isLoading, error, clearError } = useGo();

  useEffect(() => {
    if (!storeId) return;

    const initSession = async () => {
      if (action === 'resume' && sessionId) {
        await resumeSession(sessionId, storeId);
      } else {
        await startSession(storeId);
      }
    };

    initSession();
  }, [storeId, action, sessionId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => {
          clearError();
          router.back();
        }},
      ]);
    }
  }, [error]);

  useEffect(() => {
    // Redirect to scan screen once session is active
    const { activeSession } = useGo();
    if (activeSession) {
      router.replace('/go/scan');
    }
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Starting Session...',
          headerBackVisible: false,
        }}
      />
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22C55E" />

        <Text style={styles.title}>
          {action === 'resume' ? 'Resuming Session' : 'Starting Shopping'}
        </Text>

        <Text style={styles.subtitle}>
          Setting up your REZ Go session...
        </Text>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 48,
    padding: 16,
  },
  cancelText: {
    fontSize: 16,
    color: '#EF4444',
  },
});
