/**
 * Web QR Scanner Types
 * Types for the web-based QR scanner for non-REZ App users
 */

export type QRType =
  | 'room-hub'          // Hotel room QR codes
  | 'menu-qr'           // Restaurant/store menu QR codes
  | 'rez-now'           // now.rez.money format
  | 'ad-campaign'       // Campaign/ad QR codes (UNIFIED: was 'ads-qr')
  | 'safe-qr'           // Safe QR codes (REZP, REZN, etc.)
  | 'go-session'        // REZ Go Scan & Go session
  | 'go-product'        // REZ Go product scan
  | 'go-recovery'       // REZ Go checkout recovery codes
  | 'product-verify'    // Product authenticity verification
  | 'creator-qr'        // Creator profile QR
  | 'shelf-qr'          // Retail shelf QR
  | 'salon-qr'          // Salon check-in QR
  | 'wallet-transfer'   // Wallet transfer QR
  | 'legacy'            // Old format, needs conversion
  | 'unknown';          // Unrecognized format

export type ScannerType = 'camera' | 'upload' | 'manual';

export type Platform = 'desktop' | 'mobile' | 'tablet';

export type ScanSource = 'web';

export interface QRCodeData {
  raw: string;
  type: QRType;
  metadata?: {
    storeSlug?: string;
    roomCode?: string;
    campaignId?: string;
    isLegacy?: boolean;
    // REZ Go metadata
    storeId?: string;
    sessionId?: string;
    productId?: string;
    barcode?: string;
    transferId?: string;
    action?: 'start' | 'resume' | 'add';
  };
}

export interface ScanAnalytics {
  source: ScanSource;
  platform: Platform;
  scannerType: ScannerType;
  qrType: QRType;
  success: boolean;
  errorMessage?: string;
  timestamp: number;
}

export interface ScanResult {
  text: string;
  format: string;
  timestamp: number;
}

export interface ManualEntryData {
  type: 'store-slug' | 'room-code' | 'campaign-code';
  value: string;
}

export interface RecentScan {
  id: string;
  code: string;
  type: QRType;
  timestamp: number;
  storeSlug?: string;
}

// Navigation destinations based on QR type
export interface NavigationTarget {
  path: string;
  params?: Record<string, string>;
  external?: boolean;
  appLink?: string; // Deep link to native app
}

// Unified QR Intent mapping (for consistency across codebase)
export const QR_TYPE_LABELS: Record<QRType, string> = {
  'room-hub': 'Room Service',
  'menu-qr': 'Store Menu',
  'rez-now': 'REZ Now',
  'ad-campaign': 'Campaign',
  'safe-qr': 'Safe QR',
  'go-session': 'REZ Go',
  'go-product': 'Scan Product',
  'go-recovery': 'Checkout Recovery',
  'product-verify': 'Verify Product',
  'creator-qr': 'Creator',
  'shelf-qr': 'Shelf QR',
  'salon-qr': 'Salon Check-in',
  'wallet-transfer': 'Wallet Transfer',
  'legacy': 'Legacy',
  'unknown': 'Unknown',
};

// Camera availability states
export type CameraStatus =
  | 'checking'       // Checking camera availability
  | 'available'      // Camera available and ready
  | 'unavailable'    // No camera or not accessible
  | 'permission-denied' // Camera permission denied
  | 'not-found';     // No camera device found

// Component props interfaces
export interface WebQRScannerProps {
  onScanSuccess?: (data: QRCodeData) => void;
  onScanError?: (error: string) => void;
  onNavigate?: (target: NavigationTarget) => void;
  enableSound?: boolean;
  enableVibration?: boolean;
  showManualEntry?: boolean;
  className?: string;
}

export interface WebQRScannerFallbackProps {
  onManualEntry?: (data: ManualEntryData) => void;
  onImageUpload?: (file: File) => void;
  onContinueWithLink?: (url: string) => void;
  className?: string;
}

export interface QRResultProps {
  result: ScanResult;
  isProcessing?: boolean;
  onContinue?: () => void;
  onRetry?: () => void;
  className?: string;
}

export interface ManualEntryProps {
  onSubmit?: (data: ManualEntryData) => void;
  onRecentScanSelect?: (scan: RecentScan) => void;
  recentScans?: RecentScan[];
  className?: string;
}

// Storage keys
export const STORAGE_KEYS = {
  RECENT_SCANS: 'web-qr-recent-scans',
  PREFERRED_SCANNER: 'web-qr-preferred-scanner',
  INSTALL_PROMPTED: 'web-qr-install-prompted',
} as const;

// Maximum recent scans to store
export const MAX_RECENT_SCANS = 10;

// Local storage type helpers
export interface StoredPreferences {
  lastScannerType?: ScannerType;
  installPromptDismissed?: boolean;
  installPromptDismissedAt?: number;
}
