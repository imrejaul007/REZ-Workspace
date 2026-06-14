/**
 * Hotel QR Scanner Screen
 *
 * Staff scans guest QR codes to:
 * - Validate guest identity
 * - Check-in guests
 * - Verify room access
 * - View booking details
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import apiClient from '@/services/apiClient';
import jsQR from 'jsqr';

interface BookingDetails {
  bookingId: string;
  hotelId: string;
  roomId: string;
  roomNumber: string;
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  dates: {
    checkIn: string;
    checkOut: string;
    expiresAt: string;
  };
  status: {
    isActive: boolean;
    useCount: number;
  };
}

type ScanMode = 'camera' | 'manual';
type CameraError = 'permission_denied' | 'not_available' | 'scan_failed' | null;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

interface ParsedQRData {
  token: string;
  version: string;
  timestamp: string;
  signature?: string;
}

export default function HotelQRScannerScreen() {
  const [mode, setMode] = useState<ScanMode>('manual');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const scanCooldownRef = useRef<boolean>(false);

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();

  // Parse QR code data (room-hub intent format)
  const parseQRData = useCallback((rawData: string): ParsedQRData | null => {
    try {
      // Try JSON format first (new format)
      if (rawData.startsWith('{')) {
        const parsed = JSON.parse(rawData);
        if (parsed.token) {
          return {
            token: parsed.token,
            version: parsed.version || '1.0',
            timestamp: parsed.timestamp || new Date().toISOString(),
            signature: parsed.signature,
          };
        }
      }

      // Try URL format (room-hub://intent?token=xxx)
      if (rawData.startsWith('room-hub://')) {
        const url = new URL(rawData);
        const token = url.searchParams.get('token');
        if (token) {
          return {
            token,
            version: url.searchParams.get('version') || '1.0',
            timestamp: url.searchParams.get('timestamp') || new Date().toISOString(),
            signature: url.searchParams.get('signature') || undefined,
          };
        }
      }

      // Try simple token format (base64 or plain string)
      if (rawData.length >= 8 && rawData.length <= 256) {
        return {
          token: rawData.trim(),
          version: '1.0',
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (e) {
      // Not valid JSON or URL, might be plain token
      if (rawData.length >= 8 && rawData.length <= 256) {
        return {
          token: rawData.trim(),
          version: '1.0',
          timestamp: new Date().toISOString(),
        };
      }
      return null;
    }
  }, []);

  // Request camera permission on Android
  const requestAndroidCameraPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'This app needs camera access to scan guest QR codes for check-in and verification.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Camera permission error:', err);
      return false;
    }
  }, []);

  // Handle successful QR scan
  const handleSuccessfulScan = useCallback(async (scannedToken: string) => {
    // Prevent duplicate scans within cooldown period
    if (scanCooldownRef.current) return;
    scanCooldownRef.current = true;

    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setToken(scannedToken);
    setLastScannedCode(scannedToken);
    setMode('manual'); // Switch to manual to show results
    setIsScanning(false);

    // Reset cooldown after 2 seconds
    setTimeout(() => {
      scanCooldownRef.current = false;
    }, 2000);

    // Process the scan
    await handleScan(scannedToken);
  }, []);

  // Handle barcode scan from CameraView
  const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (scanCooldownRef.current || !result.data) return;

    const parsed = parseQRData(result.data);
    if (parsed?.token) {
      await handleSuccessfulScan(parsed.token);
    } else {
      setCameraError('scan_failed');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [parseQRData, handleSuccessfulScan]);

  // Switch to camera mode
  const handleSwitchToCamera = useCallback(async () => {
    setCameraError(null);

    if (!permission?.granted) {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidCameraPermission();
        if (!granted) {
          setCameraError('permission_denied');
          return;
        }
      } else {
        const result = await requestPermission();
        if (!result.granted) {
          setCameraError('permission_denied');
          return;
        }
      }
    }

    setMode('camera');
    setIsScanning(true);
    setError(null);
    setCameraError(null);
  }, [permission, requestPermission, requestAndroidCameraPermission]);

  // Open settings for permission denied
  const openAppSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // Handle camera scan completion (for manual camera testing)
  const handleCameraScan = useCallback(async (scannedToken: string) => {
    setToken(scannedToken);
    await handleScan(scannedToken);
  }, []);

  // Handle token input/scan
  const handleScan = async (scanToken: string) => {
    if (!scanToken.trim()) {
      setError('Please enter a QR token');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBooking(null);

    try {
      const authToken = await getAuthToken();

      const response = await apiClient.post(
        '/merchant/verify-access',
        { token: scanToken, roomId: '' },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.success && response.data?.allowed) {
        // Get full booking details
        const detailsRes = await apiClient.get(
          `/merchant/booking/${encodeURIComponent(scanToken)}`,
          undefined,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (detailsRes.success && detailsRes.data) {
          setBooking(detailsRes.data);
        }
      } else {
        setError(response.data?.reason || 'Access denied');
      }
    } catch (err) {
      // Handle specific error types
      if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('Invalid QR code. Token not found.');
      } else if (err.response?.status === 403) {
        setError('Access denied. This booking may have expired or been cancelled.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to scan QR. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick check-in
  const handleCheckin = async () => {
    if (!token) return;

    setActionLoading(true);
    try {
      const response = await apiClient.post(
        '/merchant/checkin',
        { token },
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Guest checked in successfully!', [{ text: 'OK' }]);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Error', response.message || 'Check-in failed');
      }
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Verify room access
  const handleVerifyAccess = async (roomId: string) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(
        '/merchant/verify-access',
        { token, roomId },
        {
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.success) {
        if (response.data?.allowed) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Access Granted', 'Guest can access this room.');
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('Access Denied', response.data?.reason || 'Cannot access this room.');
        }
      }
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await Clipboard.getClipboardStringAsync();
      if (text) {
        setToken(text);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert('Clipboard Empty', 'No text found in clipboard to paste.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to read clipboard.');
    }
  };

  // Reset scanner
  const handleReset = useCallback(() => {
    setToken('');
    setBooking(null);
    setError(null);
    setCameraError(null);
    setLastScannedCode(null);
    scanCooldownRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scanCooldownRef.current = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a3a52', '#2d5a7b']} style={styles.header}>
        <TouchableOpacity onPress={() => {}} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hotel QR Scanner</Text>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'camera' && styles.modeBtnActive]}
            onPress={() => setMode('camera')}
          >
            <Ionicons
              name="camera"
              size={20}
              color={mode === 'camera' ? '#fff' : '#6B7280'}
            />
            <Text style={[styles.modeBtnText, mode === 'camera' && styles.modeBtnTextActive]}>
              Camera
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]}
            onPress={() => setMode('manual')}
          >
            <Ionicons
              name="keypad"
              size={20}
              color={mode === 'manual' ? '#fff' : '#6B7280'}
            />
            <Text style={[styles.modeBtnText, mode === 'manual' && styles.modeBtnTextActive]}>
              Manual
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'camera' ? (
          // Camera Scanner Placeholder
          <View style={styles.cameraContainer}>
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="qr-code-outline" size={80} color="#D1D5DB" />
              <Text style={styles.cameraText}>Camera Scanner</Text>
              <Text style={styles.cameraSubtext}>
                Point camera at guest's QR code
              </Text>
              <TouchableOpacity style={styles.manualLink} onPress={() => setMode('manual')}>
                <Text style={styles.manualLinkText}>Enter manually instead</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Manual Input
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Enter QR Token</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={token}
                onChangeText={setToken}
                placeholder="Paste token here..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
                <Ionicons name="clipboard-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.scanBtn, (!token.trim() || isLoading) && styles.scanBtnDisabled]}
              onPress={() => handleScan(token)}
              disabled={!token.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="qr-code-outline" size={20} color="#fff" />
                  <Text style={styles.scanBtnText}>Scan QR</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Booking Details */}
        {booking && (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View style={styles.roomBadge}>
                <Ionicons name="bed-outline" size={20} color="#fff" />
                <Text style={styles.roomNumber}>Room {booking.roomNumber}</Text>
              </View>
              <View style={[styles.statusBadge, booking.status.isActive ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>
                  {booking.status.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.guestInfo}>
              <Text style={styles.guestName}>{booking.guest.name}</Text>
              <Text style={styles.guestContact}>{booking.guest.email}</Text>
              <Text style={styles.guestContact}>{booking.guest.phone}</Text>
            </View>

            <View style={styles.datesSection}>
              <View style={styles.dateRow}>
                <View>
                  <Text style={styles.dateLabel}>Check-in</Text>
                  <Text style={styles.dateValue}>
                    {new Date(booking.dates.checkIn).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                <View>
                  <Text style={styles.dateLabel}>Check-out</Text>
                  <Text style={styles.dateValue}>
                    {new Date(booking.dates.checkOut).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.checkinBtn]}
                onPress={handleCheckin}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Check-in Guest</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.verifyBtn]}
                onPress={() => handleVerifyAccess(booking.roomId)}
                disabled={actionLoading}
              >
                <Ionicons name="key-outline" size={20} color="#1a3a52" />
                <Text style={styles.verifyBtnText}>Verify Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Scans (placeholder) */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <Text style={styles.emptyText}>No recent scans</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Placeholder - get auth token from secure storage
async function getAuthToken(): Promise<string> {
  // In production, get from secure storage
  return '';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: '#1a3a52' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modeBtnTextActive: { color: '#fff' },
  cameraContainer: { marginBottom: 20 },
  cameraPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  cameraText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  cameraSubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  manualLink: { marginTop: 20 },
  manualLinkText: { fontSize: 14, color: '#1a3a52', fontWeight: '600' },
  inputSection: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pasteBtn: {
    backgroundColor: '#1a3a52',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a3a52',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
  },
  scanBtnDisabled: { backgroundColor: '#9CA3AF' },
  scanBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorText: { flex: 1, fontSize: 14, color: '#DC2626' },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a3a52',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  roomNumber: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  statusActive: { backgroundColor: '#D1FAE5' },
  statusInactive: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  guestInfo: { marginBottom: 16 },
  guestName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  guestContact: { fontSize: 14, color: '#6B7280' },
  datesSection: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, marginBottom: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  checkinBtn: { backgroundColor: '#10B981' },
  verifyBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  verifyBtnText: { fontSize: 14, fontWeight: '700', color: '#1a3a52' },
  recentSection: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
});
