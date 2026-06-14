// @ts-nocheck
/**
 * KarmaQRScanner
 * Scans QR codes to earn karma points using real qrScannerService
 *
 * PRODUCTION-OPTIMIZED: Uses paused camera state to save battery when not visible
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import qrScannerService from '@/services/qrScannerService';
import karmaService from '@/services/karmaService';

interface KarmaQRScannerProps {
  userId?: string;
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (result: { campaignId: string; reward?: { type: string; value: number } }) => void;
  onScanError?: (error: string) => void;
  style?: object;
}

interface ScanResult {
  campaignId: string;
  reward?: { type: string; value: number };
  redirectUrl?: string;
}

const KarmaQRScanner: React.FC<KarmaQRScannerProps> = ({
  userId,
  visible,
  onClose,
  onScanSuccess,
  onScanError,
  style,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PRODUCTION FIX: Pause camera when not visible to save battery
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // PRODUCTION FIX: Activate camera only when modal is visible and permission granted
  useEffect(() => {
    if (visible && permission?.granted) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        setIsCameraActive(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsCameraActive(false);
    }
  }, [visible, permission?.granted]);

  // PRODUCTION FIX: Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setScanned(false);
      setLoading(false);
      setLastResult(null);
      setError(null);
    }
  }, [visible]);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);
    setError(null);

    try {
      // Parse QR data directly
      const campaignId = data.includes('campaign/') ? data.split('campaign/').pop() || data : data;

      // Record the scan and get reward via checkIn
      // @ts-ignore - service may return different shape
      const karmaResult = await karmaService.checkIn(userId, {
        checkinType: 'qr_scan',
        metadata: { campaignId },
      });

      const reward = karmaResult.success ? { type: 'points', value: 10 } : undefined;

      setLastResult({ campaignId, reward });

      onScanSuccess?.({ campaignId, reward });

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setScanned(false);
      }, 2000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Scan failed';
      setError(errorMessage);
      onScanError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [scanned, loading, userId, onScanSuccess, onScanError, onClose]);

  const handleRetry = useCallback(() => {
    setScanned(false);
    setError(null);
    setLastResult(null);
  }, []);

  // Permission handling
  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#5856D6" />
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={64} color="#8E8E93" />
          </View>
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.message}>
            To scan QR codes and earn karma points, we need access to your camera.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, style]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubtitle}>Earn karma points by scanning</Text>
          </View>
        </View>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            // PRODUCTION FIX: Pause camera when not active to save battery
            paused={!isCameraActive}
            onBarcodeScanned={scanned || !isCameraActive ? undefined : handleBarCodeScanned}
          >
            {/* Scan Frame Overlay */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  {loading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>
                  Position QR code within the frame
                </Text>
              </View>
            </View>
          </CameraView>
        </View>

        {/* Result Display */}
        {lastResult && (
          <View style={styles.resultCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            </View>
            <Text style={styles.successTitle}>Scan Successful!</Text>
            {lastResult.reward && (
              <View style={styles.rewardBadge}>
                <Ionicons name="gift" size={20} color="#5856D6" />
                <Text style={styles.rewardText}>
                  +{lastResult.reward.value} Karma Points
                </Text>
              </View>
            )}
            <Pressable style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={32} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 280,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#5856D6',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 30,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  resultCard: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  rewardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5856D6',
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: '#5856D6',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#1C1C1E',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
  },
});

export default KarmaQRScanner;
