/**
 * REZ Verify QR - Warranty Screen
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
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { verifyQrApi } from '../services/verifyQrApi';
import { Warranty, WarrantyPlan } from '../types';

export default function WarrantyScreen() {
  const params = useLocalSearchParams();
  const [serialNumber, setSerialNumber] = useState(params.serial as string || '');
  const [loading, setLoading] = useState(false);
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [plans, setPlans] = useState<WarrantyPlan[]>([]);

  const handleCheckWarranty = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Please enter a serial number');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyQrApi.getWarranty(serialNumber.trim());
      if (response.success && response.data) {
        setWarranty(response.data);
      } else {
        // Try to get plans for extended warranty
        const plansResponse = await verifyQrApi.getWarrantyPlans();
        if (plansResponse.success && plansResponse.data) {
          setPlans(plansResponse.data);
        }
        Alert.alert('No Warranty', 'This product does not have an active warranty. Browse extended warranty plans below.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check warranty');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10B981';
      case 'EXPIRED':
        return '#EF4444';
      case 'CLAIMED':
        return '#F59E0B';
      case 'TRANSFERRED':
        return '#6366F1';
      default:
        return '#64748B';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Check Warranty */}
        <View style={styles.searchSection}>
          <Text style={styles.label}>Check Warranty</Text>
          <TextInput
            style={styles.input}
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="Enter Serial Number"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.checkButton, loading && styles.checkButtonDisabled]}
            onPress={handleCheckWarranty}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkButtonText}>Check Warranty</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Warranty */}
        {warranty && (
          <View style={styles.warrantyCard}>
            <View style={styles.warrantyHeader}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(warranty.warranty_status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(warranty.warranty_status) }]}>
                  {warranty.warranty_status}
                </Text>
              </View>
            </View>

            <View style={styles.warrantyInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Serial Number</Text>
                <Text style={styles.serialNumber}>{warranty.serial_number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Brand</Text>
                <Text style={styles.infoValue}>{warranty.brand}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Model</Text>
                <Text style={styles.infoValue}>{warranty.model}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Start Date</Text>
                <Text style={styles.infoValue}>{formatDate(warranty.warranty_start_date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>End Date</Text>
                <Text style={styles.infoValue}>{formatDate(warranty.warranty_end_date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Claims Made</Text>
                <Text style={styles.infoValue}>{warranty.claim_count}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>File a Claim</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Extended Warranty Plans */}
        {plans.length > 0 && (
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Extended Warranty Plans</Text>
            {plans.map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>₹{plan.price}</Text>
                </View>
                <Text style={styles.planDuration}>{plan.duration_months} months coverage</Text>
                <View style={styles.planFeatures}>
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Text style={styles.featureCheck}>✓</Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={() => {
                    Alert.alert('Subscribe', `Subscribe to ${plan.name} for ₹${plan.price}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Subscribe', onPress: async () => {
                        if (serialNumber) {
                          const result = await verifyQrApi.subscribeWarranty(serialNumber, plan.id);
                          if (result.success) {
                            Alert.alert('Success', 'Warranty subscribed successfully!');
                            handleCheckWarranty();
                          } else {
                            Alert.alert('Error', result.error || 'Failed to subscribe');
                          }
                        }
                      }},
                    ]);
                  }}
                >
                  <Text style={styles.subscribeButtonText}>Subscribe</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
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
  checkButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    opacity: 0.7,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warrantyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  warrantyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  warrantyInfo: {
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
  serialNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  claimButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  plansSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  planDuration: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  planFeatures: {
    gap: 6,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    color: '#10B981',
    fontWeight: '600',
  },
  featureText: {
    fontSize: 12,
    color: '#64748B',
  },
  subscribeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
