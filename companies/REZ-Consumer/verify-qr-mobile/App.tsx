/**
 * REZ Verify QR - Mobile App
 * Product verification and warranty management
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';

// API Configuration
const API_URL = 'http://localhost:4003';

// Types
interface Warranty {
  id: string;
  serial_number: string;
  brand: string;
  model: string;
  warranty_status: string;
  warranty_end_date: string;
}

interface VerificationResult {
  status: 'AUTHENTIC' | 'INVALID' | 'FLAGGED';
  serial_number: string;
  brand: string;
  model: string;
  warranty_status: string;
}

interface Claim {
  id: string;
  status: string;
  issue_type: string;
  created_at: string;
}

// Stack Navigator
const Stack = createNativeStackNavigator();

// Home Screen
function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verify QR</Text>
        <Text style={styles.subtitle}>Product Trust & Warranty</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.primaryButtonText}>Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Verify')}
        >
          <Text style={styles.secondaryButtonText}>Enter Serial Number</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('MyWarranties')}
        >
          <Text style={styles.quickActionText}>My Warranties</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('MyClaims')}
        >
          <Text style={styles.quickActionText}>My Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Passport')}
        >
          <Text style={styles.quickActionText}>Ownership Passport</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Scan Screen
function ScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial_number: data }),
      });
      const result = await response.json();
      navigation.navigate('VerificationResult', { result, serial: data });
    } catch (error) {
      Alert.alert('Error', 'Failed to verify product');
    }
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Requesting camera permission</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Camera access is required to scan QR codes</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Verify')}
        >
          <Text style={styles.secondaryButtonText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeTypes={['qr']}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </Camera>
      {scanned && (
        <TouchableOpacity
          style={styles.rescanButton}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.rescanText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Manual Verify Screen
function VerifyScreen({ navigation }) {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!serial.trim()) {
      Alert.alert('Error', 'Please enter a serial number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serial_number: serial.toUpperCase() }),
      });
      const result = await response.json();
      navigation.navigate('VerificationResult', { result, serial });
    } catch (error) {
      Alert.alert('Error', 'Failed to verify product');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Enter Serial Number</Text>
        <TextInput
          style={styles.input}
          value={serial}
          onChangeText={setSerial}
          placeholder="e.g., REZ123456789"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Verification Result Screen
function VerificationResultScreen({ route, navigation }) {
  const { result, serial } = route.params as { result: VerificationResult; serial: string };

  const isAuthentic = result.status === 'AUTHENTIC';

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.resultCard, isAuthentic ? styles.successCard : styles.errorCard]}>
        <Text style={styles.resultIcon}>{isAuthentic ? '✅' : '⚠️'}</Text>
        <Text style={styles.resultTitle}>
          {isAuthentic ? 'Product Verified' : 'Verification Failed'}
        </Text>
        <Text style={styles.resultSerial}>{serial}</Text>
      </View>

      {isAuthentic && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brand</Text>
            <Text style={styles.detailValue}>{result.brand}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model</Text>
            <Text style={styles.detailValue}>{result.model}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warranty</Text>
            <Text style={[styles.detailValue, result.warranty_status === 'active' && styles.activeWarranty]}>
              {result.warranty_status === 'active' ? 'Active ✅' : 'Not Activated'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {isAuthentic && result.warranty_status !== 'active' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('ActivateWarranty', { serial })}
          >
            <Text style={styles.primaryButtonText}>Activate Warranty</Text>
          </TouchableOpacity>
        )}

        {isAuthentic && result.warranty_status === 'active' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Passport')}
          >
            <Text style={styles.primaryButtonText}>View Ownership Passport</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// My Warranties Screen
function MyWarrantiesScreen({ navigation }) {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarranties();
  }, []);

  const loadWarranties = async () => {
    try {
      // Mock data for demo
      setWarranties([
        {
          id: '1',
          serial_number: 'REZ123456789',
          brand: 'Samsung',
          model: 'Galaxy S24 Ultra',
          warranty_status: 'active',
          warranty_end_date: '2027-01-15',
        },
        {
          id: '2',
          serial_number: 'REZ987654321',
          brand: 'Apple',
          model: 'iPhone 15 Pro',
          warranty_status: 'active',
          warranty_end_date: '2026-09-20',
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load warranties');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.list}>
        {warranties.map((warranty) => (
          <TouchableOpacity key={warranty.id} style={styles.warrantyCard}>
            <View style={styles.warrantyHeader}>
              <Text style={styles.warrantyBrand}>{warranty.brand}</Text>
              <View style={[styles.statusBadge, warranty.warranty_status === 'active' && styles.activeBadge]}>
                <Text style={styles.statusText}>{warranty.warranty_status}</Text>
              </View>
            </View>
            <Text style={styles.warrantyModel}>{warranty.model}</Text>
            <Text style={styles.warrantySerial}>{warranty.serial_number}</Text>
            <Text style={styles.warrantyDate}>
              Expires: {new Date(warranty.warranty_end_date).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Passport Screen
function PassportScreen({ route }) {
  const { serial } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.passportCard}>
        <View style={styles.passportHeader}>
          <Text style={styles.passportTitle}>Ownership Passport</Text>
          <Text style={styles.passportSubtitle}>REZ Verify QR</Text>
        </View>

        {serial ? (
          <>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR Code</Text>
              <Text style={styles.qrSerial}>{serial}</Text>
            </View>
            <View style={styles.passportDetails}>
              <Text style={styles.passportLabel}>Ownership Status</Text>
              <Text style={styles.passportValue}>Active</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Scan a product to create passport</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// My Claims Screen
function MyClaimsScreen() {
  const [claims, setClaims] = useState<Claim[]>([]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.list}>
        {claims.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No claims filed yet</Text>
          </View>
        ) : (
          claims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <Text style={styles.claimId}>Claim #{claim.id}</Text>
              <Text style={styles.claimType}>{claim.issue_type}</Text>
              <View style={styles.claimStatus}>
                <Text style={styles.claimStatusText}>{claim.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#10B981',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1FAE5',
    marginTop: 4,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: '#10B981',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  rescanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  resultCard: {
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#D1FAE5',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resultSerial: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  details: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  detailValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  activeWarranty: {
    color: '#10B981',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  warrantyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  warrantyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  warrantyBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FEE2E2',
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  warrantyModel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  warrantySerial: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  warrantyDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  passportCard: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  passportHeader: {
    backgroundColor: '#10B981',
    padding: 20,
    alignItems: 'center',
  },
  passportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  passportSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 4,
  },
  qrPlaceholder: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  qrText: {
    fontSize: 14,
    color: '#6B7280',
  },
  qrSerial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  passportDetails: {
    padding: 20,
  },
  passportLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  passportValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  claimId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  claimType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  claimStatus: {
    marginTop: 12,
  },
  claimStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

// Navigation
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#10B981' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan QR Code' }} />
        <Stack.Screen name="Verify" component={VerifyScreen} options={{ title: 'Enter Serial' }} />
        <Stack.Screen name="VerificationResult" component={VerificationResultScreen} options={{ title: 'Result' }} />
        <Stack.Screen name="MyWarranties" component={MyWarrantiesScreen} options={{ title: 'My Warranties' }} />
        <Stack.Screen name="MyClaims" component={MyClaimsScreen} options={{ title: 'My Claims' }} />
        <Stack.Screen name="Passport" component={PassportScreen} options={{ title: 'Ownership Passport' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
