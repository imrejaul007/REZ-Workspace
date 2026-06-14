/**
 * Web QR Scanner Components
 *
 * A complete web-based QR scanner solution for non-REZ App users.
 * Provides camera scanning, image upload, and manual entry fallback.
 *
 * @example
 * ```tsx
 * import { WebQRScanner } from '@/components/web-qr-scanner';
 *
 * function MyPage() {
 *   const handleScan = (data) => {
 *     console.log('Scanned:', data);
 *   };
 *
 *   return (
 *     <WebQRScanner
 *       onScanSuccess={handleScan}
 *       enableSound={true}
 *       enableVibration={true}
 *     />
 *   );
 * }
 * ```
 */

// Main components
export { default as WebQRScanner } from './WebQRScanner';
export { default as WebQRScannerFallback } from './WebQRScannerFallback';
export { default as QRResult } from './QRResult';
export { default as ManualEntry } from './ManualEntry';
export { default as InstallAppPrompt } from './InstallAppPrompt';

// Types
export type {
  WebQRScannerProps,
  WebQRScannerFallbackProps,
  QRResultProps,
  ManualEntryProps,
  QRCodeData,
  QRType,
  ScannerType,
  Platform,
  ScanSource,
  ScanAnalytics,
  ScanResult,
  ManualEntryData,
  RecentScan,
  NavigationTarget,
  CameraStatus,
} from './types';

// Utilities
export {
  detectQRType,
  extractStoreSlug,
  extractRoomCode,
  extractCampaignId,
  isLegacyQR,
  convertLegacyQR,
  getQRTypeLabel,
} from './utils/detectQRType';

export {
  handleUniversalQR,
  getNavigationTarget,
  handleManualEntry,
  shouldOpenInApp,
} from './utils/universalQRHandler';

export {
  playScanSound,
  triggerVibration,
  playErrorSound,
  isHapticSupported,
  isAudioSupported,
} from './utils/scannerFeedback';

export {
  trackScan,
  trackCameraPermission,
  trackFallbackUsed,
  trackInstallPromptShown,
  trackInstallPromptAction,
  trackNavigation,
  detectPlatform,
  isMobileDevice,
} from './utils/analytics';

export { scanImageQRCode } from './utils/imageQRScanner';
