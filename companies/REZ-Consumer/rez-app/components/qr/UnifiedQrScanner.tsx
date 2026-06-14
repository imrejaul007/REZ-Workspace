// @ts-nocheck
/**
 * UnifiedQrScanner — single scanner that reads ANY ReZ QR code.
 *
 * Phase I: instead of 3 different scanner screens (karma, wallet,
 * store-payment) each with their own payload assumptions, this one
 * component reads a code, hands it to parseQrPayload() + routeFromPayload(),
 * and either navigates directly or resolves a short URL via
 * GET /api/qr/resolve.
 *
 * Usage (unknown screen that wants "scan a QR"):
 *
 *   <UnifiedQrScanner
 *     onError={(msg) => toast(msg)}
 *     onScanned={(payload) => analytics.track(payload)}
 *   />
 *
 * The component does its own navigation via expo-router. A caller
 * that wants to intercept routing can pass `onPayloadResolved` to
 * override.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import apiClient from '@/services/apiClient';
import { parseQrPayload } from '@/utils/qr/qrPayload';
import type { QrPayload } from '@/utils/qr/qrPayload';
import { routeFromPayload } from '@/utils/qr/qrIntentRouter';
import type { RouteTarget } from '@/utils/qr/qrIntentRouter';

// ─── Legacy QR format detection ────────────────────────────────────────────────
// Old store-payment QR codes had the shape:
//   {"type":"NUQTA_STORE_PAYMENT","code":"<storeId>","v":"1"}
// These are handled by the pay-in-store backend lookup flow, not by the
// Phase I intent router.

interface LegacyQrPayload {
  type: string;
  code: string;
  v?: string;
}

function tryParseLegacyQrCode(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw) as LegacyQrPayload;
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.type === 'NUQTA_STORE_PAYMENT' &&
      typeof parsed.code === 'string' &&
      parsed.code.trim().length > 0
    ) {
      return parsed.code.trim();
    }
    return null;
  } catch {
    return null;
  }
}

type ScanState = 'idle' | 'resolving' | 'error' | 'done';

export interface UnifiedQrScannerProps {
  /** Optional — called after a short-URL token has been resolved to a
   *  typed payload, OR after a JSON payload has been successfully
   *  parsed. Useful for analytics. */
  onScanned?: (payload: QrPayload, routeTarget: RouteTarget | null) => void;
  /** Optional — raw scan mode: caller handles all QR parsing and routing.
   *  Called with the raw string data from the QR code. */
  onRawScan?: (raw: string) => void;
  /** Optional — called when we could not make sense of the QR. The
   *  default behavior is to log + show "Not a ReZ code" in the UI. */
  onError?: (message: string) => void;
  /** Optional — caller handles navigation itself. If provided, the
   *  scanner does NOT call router.push(). */
  onPayloadResolved?: (payload: QrPayload) => void;
  /** Optional — called when the user dismisses the scanner. */
  onClose?: () => void;
  /** Optional — called when the user chooses manual entry. */
  onManualEntry?: () => void;
  /**
   * Optional — for screens that handle legacy QR codes (e.g. store-payment
   * codes with type:'NUQTA_STORE_PAYMENT') via their own backend lookup.
   * When the scanner encounters a legacy QR code it cannot parse as a
   * ReZ Phase I payload, it calls this instead of showing "Not a ReZ QR".
   * The string argument is the `code` field from the legacy JSON payload.
   */
  onLegacyQrCode?: (code: string) => void;
}

interface ShortUrlResolveResponse {
  success?: boolean;
  data?: { payload: unknown };
  message?: string;
}

export const UnifiedQrScanner: React.FC<UnifiedQrScannerProps> = ({
  onScanned,
  onError,
  onPayloadResolved,
  onClose,
  onManualEntry,
  onLegacyQrCode,
  onRawScan,
}) => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleError = useCallback(
    (msg: string) => {
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
    },
    [onError],
  );

  const dispatchPayload = useCallback(
    (payload: QrPayload) => {
      const target = routeFromPayload(payload);
      onScanned?.(payload, target);
      if (onPayloadResolved) {
        onPayloadResolved(payload);
        return;
      }
      if (target) {
        router.push({ pathname: target.pathname as unknown, params: target.params });
        setState('done');
      } else {
        handleError('This QR has no supported action on the app yet.');
      }
    },
    [handleError, onPayloadResolved, onScanned, router],
  );

  const resolveShortUrl = useCallback(
    async (token: string) => {
      setState('resolving');
      try {
        const response = (await apiClient.get<ShortUrlResolveResponse>(
          `/qr/resolve?token=${encodeURIComponent(token)}`,
        )) as unknown as ShortUrlResolveResponse;
        if (!response.success || !response.data?.payload) {
          handleError(response.message || 'This QR code is no longer valid.');
          return;
        }
        const re = parseQrPayload(JSON.stringify(response.data.payload));
        if (!re.ok) {
          handleError('Server returned an invalid payload.');
          return;
        }
        if (re.payload.intent === 'short-url') {
          handleError('Server resolved to another short URL — refusing loop.');
          return;
        }
        dispatchPayload(re.payload);
      } catch (err) {
        handleError(err instanceof Error ? err.message : 'Could not resolve this QR.');
      }
    },
    [dispatchPayload, handleError],
  );

  const handleBarCodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (state !== 'idle') return;
      const raw = result.data;

      // Raw-scan mode: caller owns all parsing and routing.
      if (typeof onRawScan === 'function') {
        onRawScan(raw);
        return;
      }

      const parsed = parseQrPayload(raw);
      if (!parsed.ok) {
        switch (parsed.reason) {
          case 'unsupported-version':
            handleError('This QR uses a newer format — please update the app.');
            return;
          case 'invalid-schema':
          case 'not-json': {
            // Try legacy format before declaring "Not a ReZ QR".
            const legacyCode = tryParseLegacyQrCode(raw);
            if (legacyCode && onLegacyQrCode) {
              onLegacyQrCode(legacyCode);
              return;
            }
            handleError('Not a ReZ QR code.');
            return;
          }
          case 'empty':
            handleError('Empty scan — please try again.');
            return;
        }
      } else if (parsed.payload.intent === 'short-url') {
        void resolveShortUrl(parsed.payload.token);
      } else {
        dispatchPayload(parsed.payload);
      }
    },
    [state, handleError, resolveShortUrl, dispatchPayload, onLegacyQrCode],
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={48} color="#6B7280" />
        <Text style={styles.permText}>Camera permission is needed to scan QR codes.</Text>
        <Pressable style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="unified-qr-scanner">
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={state === 'idle' ? handleBarCodeScanned : undefined}
      >
        <View style={styles.overlay}>
          {/* Top bar with close */}
          <View style={styles.topBar}>
            <Pressable
              style={styles.iconButton}
              onPress={() => onClose?.()}
              hitSlop={8}
              accessibilityLabel="Close scanner"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </Pressable>
          </View>

          {/* Scan frame */}
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          {/* Bottom bar with manual entry */}
          <View style={styles.bottomBar}>
            {onManualEntry && (
              <Pressable
                style={styles.manualButton}
                onPress={onManualEntry}
                accessibilityLabel="Enter code manually"
                accessibilityRole="button"
              >
                <Ionicons name="keypad-outline" size={20} color="#ffffff" />
                <Text style={styles.manualButtonText}>Enter Manually</Text>
              </Pressable>
            )}
          </View>
        </View>
      </CameraView>
      {state === 'resolving' && (
        <View style={styles.overlayAbove}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.overlayText}>Resolving…</Text>
        </View>
      )}
      {state === 'error' && errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={() => { setState('idle'); setErrorMessage(null); }}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permText: {
    color: '#111',
    textAlign: 'center',
    fontSize: 15,
  },
  permButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  permButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 260,
    height: 260,
    borderRadius: 18,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#ffffff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingTop: 40,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  manualButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  overlayAbove: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#fff',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default UnifiedQrScanner;
