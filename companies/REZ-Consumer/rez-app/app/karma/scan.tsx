// @ts-nocheck
/**
 * Karma QR Scanner Screen
 * Scans QR codes for karma event check-in/check-out, with GPS fallback.
 */

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KarmaHeader } from './_layout';
import karmaService, { GPSCoords } from '@/services/karmaService';
import { useAuthStore } from '@/stores/authStore';
import { showAlert } from '@/utils/alert';
import { showToast } from '@/components/common/ToastManager';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { parseQrPayload } from '@/utils/qr/qrPayload';

const KARMA_PURPLE = '#8B5CF6';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.65;

type ScanMode = 'checkin' | 'checkout';

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

function KarmaScanScreen() {
  const { eventId, mode } = useLocalSearchParams<{ eventId?: string; mode?: string }>();
  const router = useRouter();
  const userId = useAuthStore((s) => s.state.user?.id ?? '');
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const lastScanRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const [scanMode, setScanMode] = useState<ScanMode>((mode as ScanMode) ?? 'checkin');
  const [activeEventId, setActiveEventId] = useState<string | null>(eventId ?? null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; karmaEarned?: number } | null>(
    null,
  );
  const [gpsCoords, setGpsCoords] = useState<GPSCoords | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Request location on mount
  useEffect(() => {
    (async () => {
      setLocationLoading(true);
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is needed for GPS check-in');
      } else {
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch {
          setLocationError('Could not get current location');
        }
      }
      setLocationLoading(false);
    })();
  }, []);

  // G-KU-H4 FIX: Sync state with URL params when they change (e.g., back navigation).
  useEffect(() => {
    if (eventId) setActiveEventId(eventId);
    if (mode === 'checkin' || mode === 'checkout') setScanMode(mode);
  }, [eventId, mode]);

  // Handle barcode scan
  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      // G-KU-H3 FIX: Debounce — ignore duplicate scans within 2 seconds.
      const now = Date.now();
      const qrCode = result.data;
      if (!qrCode || !activeEventId) return;
      if (qrCode === lastScanRef.current && now - lastScanTimeRef.current < 2000) return;
      lastScanRef.current = qrCode;
      lastScanTimeRef.current = now;

      if (scanState !== 'idle') return;

      setScanState('processing');
      try {
        const res =
          scanMode === 'checkin'
            ? await karmaService.checkIn(userId, activeEventId, 'qr', qrCode, undefined)
            : await karmaService.checkOut(userId, activeEventId, 'qr', qrCode, undefined);

        if (res.success && res.data) {
          setLastResult({
            success: true,
            message: scanMode === 'checkin' ? 'Check-in successful!' : 'Check-out submitted for NGO approval.',
            karmaEarned: res.data.karmaEarned,
          });
          setScanState('success');
        } else {
          setLastResult({ success: false, message: res.error ?? 'Scan failed. Please try again.' });
          setScanState('error');
        }
      } catch (e) {
        setLastResult({ success: false, message: e.message ?? 'An error occurred' });
        setScanState('error');
      }
    },
    [scanState, activeEventId, scanMode],
  );

  // GPS check-in / check-out
  const handleGpsCheckIn = async () => {
    if (!activeEventId) {
      showToast({ type: 'warning', message: 'Please open this screen from an event page to use GPS check-in.' });
      return;
    }

    if (!gpsCoords) {
      showToast({ type: 'warning', message: 'Could not get your current location. Please try again.' });
      return;
    }

    setScanState('processing');
    try {
      const res =
        scanMode === 'checkin'
          ? await karmaService.checkIn(userId, activeEventId, 'gps', undefined, gpsCoords)
          : await karmaService.checkOut(userId, activeEventId, 'gps', undefined, gpsCoords);

      if (res.success && res.data) {
        setLastResult({
          success: true,
          message: scanMode === 'checkin' ? 'Check-in recorded via GPS!' : 'Check-out submitted for NGO approval.',
          karmaEarned: res.data.karmaEarned,
        });
        setScanState('success');
      } else {
        setLastResult({ success: false, message: res.error ?? 'GPS check-in failed' });
        setScanState('error');
      }
    } catch (e) {
      setLastResult({ success: false, message: e.message ?? 'An error occurred' });
      setScanState('error');
    }
  };

  // Retry
  const handleRetry = () => {
    setScanState('idle');
    setLastResult(null);
  };

  // Permission check
  if (!permission) {
    return (
      <View style={styles.container}>
        <KarmaHeader title={scanMode === 'checkin' ? 'Check In' : 'Check Out'} showBack />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={KARMA_PURPLE} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <KarmaHeader title={scanMode === 'checkin' ? 'Check In' : 'Check Out'} showBack />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDesc}>Camera access is required to scan the QR code at the event venue.</Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable
            style={[styles.permissionBtn, styles.gpsBtn]}
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') handleGpsCheckIn();
              else showToast({ type: 'warning', message: 'Location permission is needed for GPS check-in.' });
            }}
          >
            <Ionicons name="location-outline" size={18} color={KARMA_PURPLE} />
            <Text style={styles.gpsBtnText}>Use GPS Instead</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Result screen
  if (scanState === 'success' || scanState === 'error') {
    const isSuccess = scanState === 'success';
    return (
      <View style={styles.container}>
        <KarmaHeader title={isSuccess ? 'Done!' : 'Try Again'} showBack />
        <View style={styles.resultContainer}>
          <View style={[styles.resultIconWrap, isSuccess ? styles.resultIconSuccess : styles.resultIconError]}>
            <Ionicons
              name={isSuccess ? 'checkmark-circle' : 'close-circle'}
              size={80}
              color={isSuccess ? Colors.success : Colors.error}
            />
          </View>
          <Text style={styles.resultTitle}>{isSuccess ? 'Success!' : 'Scan Failed'}</Text>
          <Text style={styles.resultMessage}>{lastResult?.message}</Text>
          {lastResult?.karmaEarned != null && lastResult.karmaEarned > 0 && (
            <View style={styles.karmaEarnedBadge}>
              <Ionicons name="leaf" size={20} color={KARMA_PURPLE} />
              <Text style={styles.karmaEarnedText}>+{lastResult.karmaEarned} Karma</Text>
            </View>
          )}

          <View style={styles.resultActions}>
            <Pressable style={styles.retryBtn} onPress={handleRetry}>
              <Ionicons name="refresh" size={18} color={KARMA_PURPLE} />
              <Text style={styles.retryBtnText}>Scan Again</Text>
            </Pressable>
            <Pressable
              style={styles.doneBtn}
              onPress={() => router.push(activeEventId ? `/karma/event/${activeEventId}` : '/karma/home')}
            >
              <Text style={styles.doneBtnText}>{activeEventId ? 'Back to Event' : 'Go to Home'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Camera scanning view
  return (
    <View style={styles.container}>
      <KarmaHeader title={scanMode === 'checkin' ? 'Check In' : 'Check Out'} showBack />

      {/* No event context warning */}
      {!activeEventId && (
        <View style={styles.noEventBanner}>
          <Ionicons name="warning-outline" size={16} color="#F59E0B" />
          <Text style={styles.noEventText}>Open this screen from an event to auto-fill the event ID</Text>
        </View>
      )}

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeBtn, scanMode === 'checkin' && styles.modeBtnActive]}
          onPress={() => setScanMode('checkin')}
        >
          <Ionicons
            name="log-in"
            size={16}
            color={scanMode === 'checkin' ? colors.text.inverse : Colors.textSecondary}
          />
          <Text style={[styles.modeBtnText, scanMode === 'checkin' && styles.modeBtnTextActive]}>Check In</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, scanMode === 'checkout' && styles.modeBtnActive]}
          onPress={() => setScanMode('checkout')}
        >
          <Ionicons
            name="log-out"
            size={16}
            color={scanMode === 'checkout' ? colors.text.inverse : Colors.textSecondary}
          />
          <Text style={[styles.modeBtnText, scanMode === 'checkout' && styles.modeBtnTextActive]}>Check Out</Text>
        </Pressable>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
        >
          {/* Overlay */}
          <View style={styles.cameraOverlay}>
            {/* Dark corners */}
            <View style={styles.overlayTop} />
            <View style={styles.overlayBottom} />
            <View style={styles.overlayMiddle}>
              <View style={styles.overlaySide} />
              <View style={styles.scanArea}>
                {/* Scan frame corners */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <View style={styles.overlaySide} />
            </View>
          </View>
        </CameraView>

        {/* Processing overlay */}
        {scanState === 'processing' && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.text.inverse} />
            <Text style={styles.processingText}>Verifying...</Text>
          </View>
        )}
      </View>

      {/* Instruction */}
      <View style={styles.instructionSection}>
        <Text style={styles.instructionTitle}>
          {scanState === 'idle' ? `Scan the ${scanMode === 'checkin' ? 'check-in' : 'check-out'} QR code` : ''}
        </Text>
        <Text style={styles.instructionSub}>Point your camera at the QR code displayed at the venue</Text>

        {/* GPS Fallback */}
        <View style={styles.gpsSection}>
          <View style={styles.gpsInfo}>
            <View style={styles.gpsIconWrap}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={KARMA_PURPLE} />
              ) : gpsCoords ? (
                <Ionicons name="location" size={16} color={Colors.success} />
              ) : (
                <Ionicons name="location-outline" size={16} color={Colors.error} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>GPS Check-In</Text>
              <Text style={styles.gpsSub}>
                {gpsCoords
                  ? `Location captured (${gpsCoords.lat.toFixed(4)}, ${gpsCoords.lng.toFixed(4)})`
                  : (locationError ?? 'Getting location...')}
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.gpsBtnLarge, (!gpsCoords || !activeEventId) && styles.gpsBtnDisabled]}
            onPress={handleGpsCheckIn}
            disabled={!gpsCoords || !activeEventId || scanState === 'processing'}
          >
            <Ionicons name="location" size={18} color={colors.text.inverse} />
            <Text style={styles.gpsBtnLargeText}>Use GPS Instead</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.secondary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Permission
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  permissionTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  permissionDesc: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  permissionBtn: {
    backgroundColor: KARMA_PURPLE,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  permissionBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.text.inverse },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', gap: 6 },
  gpsBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: KARMA_PURPLE },

  // No event banner
  noEventBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  noEventText: { fontSize: Typography.caption.fontSize, color: '#92400E', flex: 1 },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.text.inverse,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.background.secondary,
    gap: 6,
  },
  modeBtnActive: { backgroundColor: KARMA_PURPLE },
  modeBtnText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.textSecondary },
  modeBtnTextActive: { color: colors.text.inverse },

  // Camera
  cameraContainer: { height: SCAN_AREA_SIZE + 20, position: 'relative' },
  camera: { ...StyleSheet.absoluteFillObject },
  cameraOverlay: { flex: 1 },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanArea: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: colors.text.inverse },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },

  // Processing
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: colors.text.inverse,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    marginTop: Spacing.md,
  },

  // Instruction
  instructionSection: { flex: 1, padding: Spacing.base },
  instructionTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    color: colors.deepNavy,
    textAlign: 'center',
    marginBottom: 4,
  },
  instructionSub: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // GPS
  gpsSection: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  gpsInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  gpsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsTitle: { fontSize: Typography.body.fontSize, fontWeight: '600', color: colors.deepNavy },
  gpsSub: { fontSize: Typography.caption.fontSize, color: Colors.textSecondary, marginTop: 2 },
  gpsBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KARMA_PURPLE,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  gpsBtnDisabled: { backgroundColor: Colors.textSecondary },
  gpsBtnLargeText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.text.inverse },

  // Result
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  resultIconWrap: { marginBottom: Spacing.lg },
  resultIconSuccess: {},
  resultIconError: {},
  resultTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: '800',
    color: colors.deepNavy,
    marginBottom: Spacing.sm,
  },
  resultMessage: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  karmaEarnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    gap: 8,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  karmaEarnedText: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: KARMA_PURPLE },
  resultActions: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
    borderWidth: 1,
    borderColor: KARMA_PURPLE,
  },
  retryBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: KARMA_PURPLE },
  doneBtn: {
    flex: 1,
    backgroundColor: KARMA_PURPLE,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: colors.text.inverse },
});

export default withErrorBoundary(KarmaScanScreen, 'KarmaScan');
