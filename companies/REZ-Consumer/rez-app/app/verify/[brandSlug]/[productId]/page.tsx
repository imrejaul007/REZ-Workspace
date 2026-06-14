// @ts-nocheck
/**
 * ReZ Verify - Product Verification Page
 *
 * Route: /verify/[brandSlug]/[productId]
 * Accessed when user scans a product QR code
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/apiClient';

interface VerificationResult {
  success: boolean;
  valid: boolean;
  isGenuine: boolean;
  serial?: string;
  product?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  scanCount?: number;
  firstScanAt?: string;
  status?: string;
  fraud?: {
    score: number;
    decision: string;
    reasons: string[];
  };
  reward?: {
    amount: number;
    coinType: string;
  };
  karma?: {
    earned: number;
    total: number;
    level: string;
    multiplier: number;
    tier: string;
  };
  error?: string;
}

export default function ProductVerifyPage() {
  const { brandSlug, productId, serialNumber, brandId } = useLocalSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const user = auth.state.user;
  const isAuthenticated = auth.state.isAuthenticated;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serialNumber) {
      verifyProduct();
    }
  }, [serialNumber]);

  const verifyProduct = async () => {
    if (!serialNumber) {
      setError('No serial number provided');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/api/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serialNumber,
            signature: '', // Optional
            userId: user?.id,
            deviceId: await getDeviceId(),
            location: await getLocation(),
          }),
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceId = async (): Promise<string> => {
    // IMPLEMENTED: Get device ID from expo-application
    try {
      const Constants = require('expo-constants');
      const deviceId = Constants?.deviceId || Constants?.sessionId || 'unknown';
      return deviceId;
    } catch {
      return 'device-unknown';
    }
  };

  const getLocation = async (): Promise<{ lat: number; lng: number } | undefined> => {
    // IMPLEMENTED: Get user location from expo-location
    try {
      // Dynamic import to avoid bundling issues
      const Location = require('expo-location');

      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return undefined;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch {
      return undefined;
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Verifying Product' }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Verifying authenticity...</Text>
        </View>
      </View>
    );
  }

  if (error || (result && !result.success)) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Verification Failed' }} />
        <View style={styles.centered}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Verification Failed</Text>
          <Text style={styles.errorMessage}>{error || result?.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: result.isGenuine ? 'Product Verified' : 'Verification Alert' }} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Verification Status */}
          <View
            style={[
              styles.statusCard,
              result.isGenuine ? styles.statusVerified : styles.statusAlert,
            ]}
          >
            <View style={styles.statusIcon}>
              <Text style={styles.statusIconText}>
                {result.isGenuine ? '✓' : '!'}
              </Text>
            </View>
            <Text style={styles.statusTitle}>
              {result.isGenuine ? 'Genuine Product' : 'Verification Alert'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {result.isGenuine
                ? 'This product has been verified as authentic'
                : 'This product could not be verified'}
            </Text>
          </View>

          {/* Product Info */}
          {result.product && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Product Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{result.product.name}</Text>
              </View>
              {result.brand && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Brand</Text>
                  <Text style={styles.infoValue}>{result.brand.name}</Text>
                </View>
              )}
              {result.serial && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Serial</Text>
                  <Text style={styles.infoValue}>{result.serial}</Text>
                </View>
              )}
              {result.scanCount !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Times Scanned</Text>
                  <Text style={styles.infoValue}>{result.scanCount}</Text>
                </View>
              )}
            </View>
          )}

          {/* Rewards */}
          {(result.reward || result.karma) && result.isGenuine && (
            <View style={styles.rewardCard}>
              <Text style={styles.rewardTitle}>Rewards Earned</Text>
              {result.reward && (
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardIcon}>🪙</Text>
                  <Text style={styles.rewardAmount}>
                    +{result.reward.amount} {result.reward.coinType} Coins
                  </Text>
                </View>
              )}
              {result.karma && (
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardIcon}>⭐</Text>
                  <Text style={styles.rewardAmount}>
                    +{result.karma.earned} Karma ({result.karma.tier} tier)
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Fraud Warning */}
          {result.fraud && result.fraud.score > 0 && (
            <View style={styles.fraudCard}>
              <Text style={styles.fraudTitle}>Security Check</Text>
              <Text style={styles.fraudScore}>
                Risk Score: {result.fraud.score.toFixed(2)}
              </Text>
              {result.fraud.reasons.length > 0 && (
                <Text style={styles.fraudReasons}>
                  {result.fraud.reasons.join(', ')}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
              <Text style={styles.primaryButtonText}>Scan Another Product</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusVerified: {
    backgroundColor: '#ecfdf5',
  },
  statusAlert: {
    backgroundColor: '#fef2f2',
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusVerified: {
    backgroundColor: '#10b981',
  },
  statusAlert: {
    backgroundColor: '#ef4444',
  },
  statusIconText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  rewardCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  rewardAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  fraudCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fraudTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  fraudScore: {
    fontSize: 14,
    color: '#92400e',
  },
  fraudReasons: {
    fontSize: 12,
    color: '#a16207',
    marginTop: 4,
  },
  actions: {
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
