/**
 * REZ Verify QR - Verify Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { verifyQrApi } from '../services/verifyQrApi';
import { VerificationResult } from '../types';

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const [serialNumber, setSerialNumber] = useState(params.serial as string || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Please enter a serial number');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await verifyQrApi.verifyBySerial(serialNumber.trim());

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        Alert.alert('Not Found', response.error || 'Product not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify product');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AUTHENTIC':
        return '#10B981';
      case 'INVALID':
        return '#EF4444';
      case 'FLAGGED':
      case 'SUSPICIOUS':
        return '#F59E0B';
      default:
        return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AUTHENTIC':
        return '✅';
      case 'INVALID':
        return '❌';
      case 'FLAGGED':
      case 'SUSPICIOUS':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Search Input */}
        <View style={styles.searchSection}>
          <Text style={styles.label}>Enter Serial Number</Text>
          <TextInput
            style={styles.input}
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="e.g., REZ123456789"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Product</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Result */}
        {result && (
          <View style={styles.resultSection}>
            <View
              style={[
                styles.resultCard,
                { borderLeftColor: getStatusColor(result.status) },
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.statusIcon}>{getStatusIcon(result.status)}</Text>
                <View>
                  <Text style={styles.statusText}>{result.status}</Text>
                  <Text style={styles.serialText}>{result.serial_number}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.productInfo}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Brand</Text>
                  <Text style={styles.infoValue}>{result.brand}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Model</Text>
                  <Text style={styles.infoValue}>{result.model}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Verified Count</Text>
                  <Text style={styles.infoValue}>{result.verification_count} times</Text>
                </View>
                {result.warranty_status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Warranty</Text>
                    <Text style={styles.infoValue}>{result.warranty_status}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.message}>{result.message}</Text>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push({ pathname: '/warranty', params: { serial: result.serial_number } })}
                >
                  <Text style={styles.actionIcon}>🛡️</Text>
                  <Text style={styles.actionText}>Warranty</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/service-center')}
                >
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={styles.actionText}>Service</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push('/claims')}
                >
                  <Text style={styles.actionIcon}>📋</Text>
                  <Text style={styles.actionText}>Claims</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    flex: 1,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    fontSize: 40,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  serialText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  productInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    color: '#64748B',
  },
});
