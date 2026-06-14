import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { platformAlert } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { trialsService, ScanQRResponse } from '@/services/api/trials';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';

type ResultState = 'success' | 'error' | null;

interface ErrorDetails {
  message: string;
  reason: string;
}

export default function TrialScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resultState, setResultState] = useState<ResultState>(null);
  const [successData, setSuccessData] = useState<ScanQRResponse | null>(null);
  const [errorData, setErrorData] = useState<ErrorDetails | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // Web-only: manual QR token entry (camera not available on web)
  const [webQRInput, setWebQRInput] = useState('');

  // Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      // Camera permission is not needed on web
      if (Platform.OS === 'web') return;
      const { status } = await requestPermission();
      if (status !== 'granted') {
        platformAlert(
          'Camera Permission Required',
          'This app needs camera access to scan QR codes',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    };

    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(loc);
        }
      } catch (err) {
        logger.error('Location error:', err);
      }
    };

    requestPermissions();
    getLocation();
  }, [requestPermission]);

  const handleBarcodeScanned = async (data: string) => {
    if (!scanning || loading) return;

    setScanning(false);
    setLoading(true);

    try {
      if (!location) {
        setErrorData({
          message: 'Location Unavailable',
          reason: 'Could not get your location. Please enable location services.',
        });
        setResultState('error');
        return;
      }

      const response = await trialsService.scanQR({
        qrToken: data,
        scanGeo: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });

      if (response.success && response.data) {
        setSuccessData(response.data);
        setResultState('success');
      } else {
        setErrorData({
          message: 'Scan Failed',
          reason: response.message || 'Invalid QR code or trial not found',
        });
        setResultState('error');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      // Parse common error patterns
      let reason = 'Please try again';
      if (errorMsg.includes('geo')) {
        reason = 'Location mismatch - you may be too far from the service location';
      } else if (errorMsg.includes('instant')) {
        reason = 'QR code was already scanned too quickly. Please try again later.';
      } else if (errorMsg.includes('already')) {
        reason = 'This QR code has already been scanned for this customer';
      }

      setErrorData({
        message: 'Scan Failed',
        reason,
      });
      setResultState('error');

      logger.error('QR scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanAgain = () => {
    setResultState(null);
    setSuccessData(null);
    setErrorData(null);
    setScanning(true);
  };

  // On native, show a loading indicator while the permission object is being fetched
  if (Platform.OS !== 'web' && !permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  // On native, prompt user to grant camera permission if not yet granted
  if (Platform.OS !== 'web' && !permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Camera View — native only; web shows a manual QR input instead */}
      {Platform.OS !== 'web' ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={(event) => {
            if (event.data) {
              handleBarcodeScanned(event.data);
            }
          }}
        >
          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Scan Trial QR</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <Text style={styles.scannerHint}>Position QR code within the frame</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              {loading && (
                <View style={styles.loadingIndicator}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              )}
            </View>
          </View>
        </CameraView>
      ) : (
        /* Web: manual QR token entry */
        <View
          style={[
            styles.camera,
            { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                position: 'absolute',
                top: (Platform.OS as string) === 'ios' ? 54 : 40,
                left: 0,
                right: 0,
              },
            ]}
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Trial QR</Text>
            <View style={{ width: 40 }} />
          </View>

          <Ionicons name="qr-code-outline" size={64} color="#FFFFFF" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Camera not available on web
          </Text>
          <Text
            style={{
              color: '#CCCCCC',
              fontSize: 13,
              marginBottom: 20,
              textAlign: 'center',
              paddingHorizontal: 32,
            }}
          >
            Enter the QR token manually to process the trial:
          </Text>
          <TextInput
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              width: 280,
              fontSize: 15,
              color: '#111',
              marginBottom: 12,
            }}
            placeholder="QR token value"
            placeholderTextColor="#999"
            value={webQRInput}
            onChangeText={setWebQRInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (webQRInput.trim()) handleBarcodeScanned(webQRInput.trim());
            }}
          />
          {loading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14 }}>Processing...</Text>
            </View>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: '#10B981',
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => {
              if (webQRInput.trim()) handleBarcodeScanned(webQRInput.trim());
            }}
            disabled={loading}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
              Submit QR Token
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      <Modal visible={resultState === 'success'} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <View style={styles.resultContent}>
            {/* Checkmark Animation */}
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={48} color="#10B981" />
            </View>

            <Text style={styles.resultTitle}>Trial Completed!</Text>
            <Text style={styles.resultSubtitle}>{successData?.customerName || 'Customer'}</Text>

            {/* Reward Summary */}
            <View style={styles.rewardSummary}>
              <View style={styles.rewardRow}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" />
                <Text style={styles.rewardText}>{successData?.rewardCoins || 0} ReZ Coins</Text>
              </View>
              {successData?.brandedCoins ? (
                <View style={styles.rewardRow}>
                  <Ionicons name="gift" size={16} color="#EC4899" />
                  <Text style={styles.rewardText}>{successData.brandedCoins} Branded Coins</Text>
                </View>
              ) : null}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleScanAgain}>
              <Text style={styles.actionButtonText}>Scan Another</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Back to Trials</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={resultState === 'error'} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <View style={styles.resultContent}>
            {/* Error Icon */}
            <View style={styles.errorCircle}>
              <Ionicons name="close" size={48} color="#EF4444" />
            </View>

            <Text style={[styles.resultTitle, { color: Colors.light.error }]}>
              {errorData?.message || 'Error'}
            </Text>
            <Text style={styles.errorReason}>{errorData?.reason || 'Something went wrong'}</Text>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={handleScanAgain}
            >
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Back to Trials</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight || 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
    borderWidth: 3,
  },
  topLeft: {
    top: 60,
    left: 60,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 60,
    right: 60,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 60,
    left: 60,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 60,
    right: 60,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannerHint: {
    position: 'absolute',
    bottom: 30,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  resultContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginBottom: 20,
  },
  errorReason: {
    fontSize: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  rewardSummary: {
    backgroundColor: Colors.light.backgroundTertiary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    width: '100%',
    gap: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textHeading,
  },
  actionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 13,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.light.textHeading,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
