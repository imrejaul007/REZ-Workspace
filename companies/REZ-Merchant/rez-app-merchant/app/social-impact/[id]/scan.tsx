import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { socialImpactAdminService } from '@/services/api/socialImpact';
import { BRAND } from '@/constants/brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

type ScanResult = {
  type: 'success' | 'error';
  title: string;
  message: string;
  userName?: string;
};

export default function QRScannerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate the scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  const opacity = scanLineAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  const handleBarCodeScanned = (scanResult: BarcodeScanningResult) => {
    if (scanned) return;

    const data = scanResult.data;
    setScanned(true);
    setProcessing(true);

    (async () => {
      try {
        // Parse QR code data
        let qrPayload;
        try {
          qrPayload = JSON.parse(data);
        } catch {
          // If not JSON, treat the raw string as qrToken
          qrPayload = { qrToken: data };
        }

        // Validate QR payload
        if (qrPayload.type && qrPayload.type !== 'REZ_SOCIAL_IMPACT_CHECKIN') {
          setResult({
            type: 'error',
            title: 'Invalid QR Code',
            message: 'This QR code is not for social impact check-in.',
          });
          setProcessing(false);
          return;
        }

        const qrToken = qrPayload.qrToken || qrPayload.enrollmentId;
        const userId = qrPayload.userId;
        let participant: unknown = null;

        // Try QR token verification first (if token exists)
        if (qrToken) {
          try {
            participant = await socialImpactAdminService.verifyQRCheckIn(id!, qrToken);
          } catch {
            // QR token verification failed, will try direct check-in
          }
        }

        // Fallback: direct check-in using userId from QR payload
        if (!participant && userId) {
          participant = await socialImpactAdminService.checkInParticipant(id!, userId);
        }

        if (!participant) {
          throw new Error('Could not check in participant. QR code may be invalid.');
        }

        const userName = participant.user?.name || 'Participant';
        setScannedCount((prev) => prev + 1);
        setResult({
          type: 'success',
          title: 'Check-in Done!',
          message: `${userName} has been successfully checked in for this event.`,
          userName,
        });
      } catch (error) {
        setResult({
          type: 'error',
          title: 'Check-in Failed',
          message: error.message || 'Failed to verify QR code. Please try again.',
        });
      } finally {
        setProcessing(false);
      }
    })();
  };

  const handleScanAgain = () => {
    setResult(null);
    setScanned(false);
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <View style={styles.centered}>
            <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need camera access to scan participant QR codes for check-in.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Camera - ALWAYS mounted, pass undefined to disable scanning */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={flashOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* Overlay */}
        <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Scan QR Code</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {scannedCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{scannedCount}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.flashButton} onPress={() => setFlashOn(!flashOn)}>
                <Ionicons
                  name={flashOn ? 'flash' : 'flash-outline'}
                  size={22}
                  color={flashOn ? '#FBBF24' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scan frame (visual guide) */}
          {!scanned && !result && (
            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Animated scan line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{ translateY }],
                      opacity,
                    },
                  ]}
                />
              </View>
              <Text style={styles.scanHint}>Point camera at participant's QR code</Text>
            </View>
          )}

          {/* Processing indicator */}
          {processing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.processingText}>Verifying...</Text>
              </View>
            </View>
          )}

          {/* Result */}
          {result && !processing && (
            <View style={styles.resultOverlay}>
              <View
                style={[
                  styles.resultCard,
                  result.type === 'success' ? styles.resultSuccess : styles.resultError,
                ]}
              >
                <Ionicons
                  name={result.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={56}
                  color={result.type === 'success' ? '#10B981' : '#EF4444'}
                />
                <Text style={styles.resultTitle}>{result.title}</Text>
                <Text style={styles.resultMessage}>{result.message}</Text>

                <View style={styles.resultActions}>
                  <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
                    <Ionicons name="scan" size={18} color="#FFFFFF" />
                    <Text style={styles.scanAgainText}>Scan Next</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Bottom info */}
          {!scanned && !result && !processing && (
            <View style={styles.bottomInfo}>
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={18} color="#3B82F6" />
                <Text style={styles.infoText}>
                  Participants show their QR code from the {BRAND.APP_NAME} app after registering
                  for the event.
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scanFrameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  processingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  resultSuccess: {
    borderTopWidth: 4,
    borderTopColor: '#10B981',
  },
  resultError: {
    borderTopWidth: 4,
    borderTopColor: '#EF4444',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  resultMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanAgainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  bottomInfo: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
});
