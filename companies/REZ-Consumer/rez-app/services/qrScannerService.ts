// @ts-nocheck
/**
 * QR Scanner Service
 *
 * Provides QR code scanning functionality with manual entry fallback
 * when camera permission is denied or unavailable.
 */

import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { platformAlert, platformAlertSimple } from '@/utils/platformAlert';
import { parseQrPayload, type ParseResult, type QrPayload, type ShortUrlIntent } from '@/utils/qr/qrPayload';
import { routeFromPayload, type RouteTarget } from '@/utils/qr/qrIntentRouter';
import { router } from 'expo-router';
import { logger } from '@/utils/logger';

// QR Code format patterns for manual entry validation
const QR_FORMAT_PATTERNS = {
  // ReZ QR codes: JSON with intent field
  REZ_JSON: /^\s*\{[\s\S]*\}\s*$/,
  // Short URLs: rez.money/q/xxx or rez.link/q/xxx
  SHORT_URL: /^https?:\/\/(www\.)?(rez\.money|rez\.link)\/q\/[a-zA-Z0-9_-]+(\/)?$/i,
  // Generic alphanumeric codes
  ALPHANUMERIC: /^[a-zA-Z0-9_-]{6,64}$/,
};

export interface QrScanResult {
  success: boolean;
  payload?: QrPayload | ShortUrlIntent;
  parseResult?: ParseResult;
  error?: string;
  rawValue?: string;
}

export interface ManualEntryDialogResult {
  success: boolean;
  qrValue?: string;
  cancelled?: boolean;
}

export interface QrScannerState {
  hasPermission: boolean | null;
  permissionDenied: boolean;
  isScanning: boolean;
  lastScanTime: number | null;
}

/**
 * QR Scanner Service class
 * Handles camera-based QR scanning and manual entry fallback
 */
class QrScannerService {
  private state: QrScannerState = {
    hasPermission: null,
    permissionDenied: false,
    isScanning: false,
    lastScanTime: null,
  };

  private readonly DEBOUNCE_MS = 2000; // Prevent duplicate scans

  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      this.state.hasPermission = status === 'granted';
      this.state.permissionDenied = status === 'denied';
      return this.state.hasPermission;
    } catch (error) {
      logger.error('[QRScanner] Permission check failed:', error);
      this.state.hasPermission = false;
      this.state.permissionDenied = true;
      return false;
    }
  }

  /**
   * Get current scanner state
   */
  getState(): QrScannerState {
    return { ...this.state };
  }

  /**
   * Handle camera permission denied - show manual entry option
   */
  handlePermissionDenied(): void {
    this.state.permissionDenied = true;
    this.state.hasPermission = false;
    logger.warn('[QRScanner] Camera permission denied');
  }

  /**
   * Validate QR code format before processing
   */
  validateQRFormat(qrValue: string): boolean {
    if (!qrValue || typeof qrValue !== 'string') {
      return false;
    }

    const trimmed = qrValue.trim();
    if (trimmed.length === 0) {
      return false;
    }

    // Check against known patterns
    if (QR_FORMAT_PATTERNS.REZ_JSON.test(trimmed)) {
      return true;
    }

    if (QR_FORMAT_PATTERNS.SHORT_URL.test(trimmed)) {
      return true;
    }

    if (QR_FORMAT_PATTERNS.ALPHANUMERIC.test(trimmed)) {
      return true;
    }

    // Allow URL-encoded values
    try {
      const decoded = decodeURIComponent(trimmed);
      if (QR_FORMAT_PATTERNS.REZ_JSON.test(decoded) ||
          QR_FORMAT_PATTERNS.SHORT_URL.test(decoded) ||
          QR_FORMAT_PATTERNS.ALPHANUMERIC.test(decoded)) {
        return true;
      }
    } catch {
      // Ignore decode errors
    }

    return false;
  }

  /**
   * Parse and validate QR code payload
   */
  parseQR(qrValue: string): QrScanResult {
    try {
      const result = parseQrPayload(qrValue);

      if (!result.ok) {
        return {
          success: false,
          error: this.getParseErrorMessage(result.reason),
          rawValue: qrValue,
        };
      }

      return {
        success: true,
        payload: result.payload,
        parseResult: result,
        rawValue: qrValue,
      };
    } catch (error) {
      logger.error('[QRScanner] Parse error:', error);
      return {
        success: false,
        error: 'Failed to parse QR code',
        rawValue: qrValue,
      };
    }
  }

  /**
   * Get user-friendly error message for parse failures
   */
  private getParseErrorMessage(reason: ParseResult['ok'] extends false ? reason : never): string {
    const messages: Record<string, string> = {
      empty: 'QR code is empty',
      'not-json': 'Invalid QR code format. Please scan a valid ReZ QR code.',
      'invalid-schema': 'This QR code is not a supported ReZ code.',
      'unsupported-version': 'This QR code is from an older format. Please update the app.',
    };
    return messages[reason as string] || 'Unable to process this QR code';
  }

  /**
   * Navigate to the appropriate screen based on QR payload
   */
  navigateFromPayload(payload: QrPayload | ShortUrlIntent): boolean {
    try {
      const route = routeFromPayload(payload);

      if (!route) {
        logger.warn('[QRScanner] No route for payload:', payload);
        return false;
      }

      router.push({
        pathname: route.pathname,
        params: route.params,
      });

      return true;
    } catch (error) {
      logger.error('[QRScanner] Navigation error:', error);
      return false;
    }
  }

  /**
   * Process a scanned or entered QR code value
   */
  processQR(qrValue: string): QrScanResult {
    // Debounce duplicate scans
    const now = Date.now();
    if (this.state.lastScanTime && (now - this.state.lastScanTime) < this.DEBOUNCE_MS) {
      return {
        success: false,
        error: 'Please wait before scanning another code',
      };
    }

    this.state.lastScanTime = now;

    // Validate format
    if (!this.validateQRFormat(qrValue)) {
      return {
        success: false,
        error: 'Invalid QR code format',
        rawValue: qrValue,
      };
    }

    // Parse QR payload
    const parseResult = this.parseQR(qrValue);
    if (!parseResult.success) {
      return parseResult;
    }

    // Navigate to appropriate screen
    if (parseResult.payload) {
      const navigated = this.navigateFromPayload(parseResult.payload);
      if (!navigated) {
        return {
          success: false,
          error: 'Unable to navigate to the requested screen',
        };
      }
    }

    return parseResult;
  }

  /**
   * Show manual QR entry dialog
   * Called when camera permission is denied
   */
  showManualEntryDialog(): Promise<ManualEntryDialogResult> {
    return new Promise((resolve) => {
      let inputValue = '';

      platformAlert(
        'Enter QR Code Manually',
        'Camera access is required to scan QR codes. Please enter the QR code value manually:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve({ success: false, cancelled: true }),
          },
          {
            text: 'Submit',
            onPress: () => {
              if (inputValue.trim()) {
                resolve({ success: true, qrValue: inputValue.trim() });
              } else {
                platformAlertSimple('Error', 'Please enter a valid QR code value');
                resolve({ success: false, cancelled: true });
              }
            },
          },
        ],
        'plain-text-input',
        (text) => {
          inputValue = text || '';
        }
      );
    });
  }

  /**
   * Scan QR code from image (gallery)
   */
  async scanFromImage(): Promise<QrScanResult> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'No image selected' };
      }

      // Note: BarCodeScanner.scanFromURLAsync requires the actual file URI
      // This is a simplified version - full implementation would use ML Kit or similar
      logger.warn('[QRScanner] Image scanning requires additional library setup');

      return {
        success: false,
        error: 'Image scanning requires camera permission. Please use the camera or enter manually.',
      };
    } catch (error) {
      logger.error('[QRScanner] Image scan error:', error);
      return {
        success: false,
        error: 'Failed to scan image',
      };
    }
  }

  /**
   * Start scanning with camera - returns handler for BarCodeScanner
   */
  async startScanning(): Promise<{
    onBarCodeScanned: (data: { data: string }) => void;
    hasPermission: boolean;
    permissionDenied: boolean;
  }> {
    const hasPermission = await this.checkPermissions();

    if (!hasPermission) {
      this.handlePermissionDenied();
      return {
        onBarCodeScanned: () => {},
        hasPermission: false,
        permissionDenied: true,
      };
    }

    this.state.isScanning = true;

    return {
      hasPermission: true,
      permissionDenied: false,
      onBarCodeScanned: ({ data }) => {
        if (this.state.isScanning) {
          const result = this.processQR(data);
          if (result.success) {
            this.state.isScanning = false;
          }
        }
      },
    };
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    this.state.isScanning = false;
  }

  /**
   * Scan with fallback: tries camera first, falls back to manual entry
   */
  async scanWithFallback(): Promise<QrScanResult> {
    const hasPermission = await this.checkPermissions();

    if (!hasPermission) {
      // Camera not available, prompt for manual entry
      return this.handlePermissionDeniedWithManualEntry();
    }

    // Camera is available, user can scan
    // The actual scanning is handled by the component using startScanning()
    return { success: false, error: 'Camera ready - use startScanning()' };
  }

  /**
   * Handle permission denied with manual entry flow
   */
  private async handlePermissionDeniedWithManualEntry(): Promise<QrScanResult> {
    this.handlePermissionDenied();

    const dialogResult = await this.showManualEntryDialog();

    if (!dialogResult.success || dialogResult.cancelled) {
      return { success: false, error: 'Manual entry cancelled' };
    }

    if (!dialogResult.qrValue) {
      return { success: false, error: 'No QR code value entered' };
    }

    return this.processQR(dialogResult.qrValue);
  }
}

// Export singleton instance
export const qrScannerService = new QrScannerService();

export default qrScannerService;
