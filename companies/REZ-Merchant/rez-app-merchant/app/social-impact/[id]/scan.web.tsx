import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import jsQR from 'jsqr';
import { socialImpactAdminService } from '@/services/api/socialImpact';
import { BRAND } from '@/constants/brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(SCREEN_WIDTH * 0.7, 320);

type ScanResult = {
  type: 'success' | 'error';
  title: string;
  message: string;
  userName?: string;
};

export default function QRScannerWebScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [hasWebcam, setHasWebcam] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasScannedRef = useRef(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkWebcamAndStart();

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

    return () => {
      stopScanning();
    };
  }, []);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_AREA_SIZE - 4],
  });

  const opacity = scanLineAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  const checkWebcamAndStart = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setHasWebcam(false);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((d) => d.kind === 'videoinput');
      setHasWebcam(hasCamera);
      if (hasCamera) {
        startScanning();
      }
    } catch {
      setHasWebcam(false);
    }
  };

  const startScanning = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      setError(null);
      hasScannedRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current
            .play()
            .then(() => {
              setCameraReady(true);
              startQRDetection();
            })
            .catch(() => {
              setError('Failed to start camera.');
              setIsScanning(false);
            });
        }
      }, 100);
    } catch {
      setError('Camera access denied.');
      setIsScanning(false);
    }
  };

  const startQRDetection = () => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && !hasScannedRef.current && videoRef.current.readyState === 4) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (canvas && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code) {
              handleQRCodeDetected(code.data);
            }
          }
        }
      }
    }, 150);
  };

  const handleQRCodeDetected = async (data: string) => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;
    setProcessing(true);

    try {
      let qrPayload;
      try {
        qrPayload = JSON.parse(data);
      } catch {
        qrPayload = { qrToken: data };
      }

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
    } catch (err) {
      setResult({
        type: 'error',
        title: 'Check-in Failed',
        message: err.message || 'Failed to verify QR code.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setResult(null);
    hasScannedRef.current = false;
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    canvasRef.current = null;
    setIsScanning(false);
    setCameraReady(false);
  };

  const handleClose = () => {
    stopScanning();
    router.back();
  };

  // No webcam available
  if (!hasWebcam && !isScanning) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.centered}>
            <Ionicons name="videocam-off-outline" size={64} color="#6B7280" />
            <Text style={styles.noWebcamTitle}>No Camera Detected</Text>
            <Text style={styles.noWebcamText}>
              Connect a webcam or use the merchant app on your phone to scan QR codes.
            </Text>
            <Text style={styles.noWebcamText}>
              You can also check in participants manually from the Participants page.
            </Text>
            <TouchableOpacity style={styles.goBackButton} onPress={handleClose}>
              <Text style={styles.goBackText}>Go Back</Text>
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
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {scannedCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{scannedCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Scanner Area */}
        {!result && !processing && (
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              {/* Video element for camera */}
              {isScanning && (
                <video
                  ref={videoRef as unknown as (instance: HTMLVideoElement | null) => void}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 16,
                  }}
                  playsInline
                  muted
                  autoPlay
                />
              )}

              {/* Corner markers */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Animated scan line */}
              {cameraReady && (
                <Animated.View
                  style={[styles.scanLine, { transform: [{ translateY }], opacity }]}
                />
              )}

              {/* Loading state */}
              {!cameraReady && (
                <View style={styles.frameContent}>
                  {isScanning ? (
                    <>
                      <ActivityIndicator size="large" color="#10B981" />
                      <Text style={styles.loadingText}>Starting camera...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="qr-code" size={48} color="rgba(255,255,255,0.3)" />
                      <Text style={styles.loadingText}>Initializing...</Text>
                    </>
                  )}
                </View>
              )}
            </View>

            {cameraReady && (
              <>
                <Text style={styles.scanHint}>Point camera at participant's QR code</Text>
                <View style={styles.statusBadge}>
                  <Ionicons name="scan" size={16} color="#FFFFFF" />
                  <Text style={styles.statusText}>Scanner Active</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Processing */}
        {processing && (
          <View style={styles.centered}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.processingText}>Verifying...</Text>
            </View>
          </View>
        )}

        {/* Result */}
        {result && !processing && (
          <View style={styles.centered}>
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
                <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Bottom info */}
        {!result && !processing && cameraReady && (
          <View style={styles.bottomInfo}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={18} color="#3B82F6" />
              <Text style={styles.infoText}>
                Participants show their QR code from the {BRAND.APP_NAME} app after registering for
                the event.
              </Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  headerBar: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
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
  scannerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    flex: 1,
    justifyContent: 'center',
  },
  scannerFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981',
    borderWidth: 4,
    zIndex: 10,
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
    zIndex: 10,
  },
  frameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
  },
  scanHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 20,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  bottomInfo: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  noWebcamTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
  },
  noWebcamText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  goBackButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  goBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
