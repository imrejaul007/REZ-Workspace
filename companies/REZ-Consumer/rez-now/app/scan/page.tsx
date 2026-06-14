'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library';
import Button from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';
import {
  WebQRScanner,
  WebQRScannerFallback,
  ManualEntry,
  QRResult,
  InstallAppPrompt,
  QRCodeData,
  ManualEntryData,
  NavigationTarget,
  ScanResult,
  QRType,
} from '@/components/web-qr-scanner';
import {
  handleUniversalQR,
  handleManualEntry as processManualEntry,
  getNavigationTarget,
  trackScan,
  trackNavigation,
  detectPlatform,
  isMobileDevice,
  playScanSound,
  triggerVibration,
} from '@/components/web-qr-scanner';
import { scanImageQRCode, validateImageFile } from '@/components/web-qr-scanner/utils/imageQRScanner';

type ScanStatus = 'initializing' | 'ready' | 'scanning' | 'processing' | 'success' | 'error';
type ViewMode = 'scanner' | 'result' | 'manual' | 'install-prompt';

interface ScanState {
  status: ScanStatus;
  errorMessage: string | null;
  lastResult: ScanResult | null;
  qrData: QRCodeData | null;
}

/**
 * Extract store slug from URL or plain text
 */
function extractStoreSlug(url: string): string | null {
  // Handle full URLs: https://reznow.app/store-slug or https://reznow.app/store-slug/menu
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      return segments[0];
    }
    return null;
  } catch {
    // Not a URL — treat as plain store slug
  }

  // Plain text / store slug
  if (/^[a-z0-9-]+$/i.test(url)) {
    return url;
  }

  return null;
}

/**
 * Get QR type label for display
 */
function getQRTypeLabel(type: QRType): string {
  const labels: Record<QRType, string> = {
    'room-hub': 'Room Service',
    'menu-qr': 'Store Menu',
    'rez-now': 'REZ Now',
    'ads-qr': 'Campaign',
    'safe-qr': 'Safe QR',
    'legacy': 'Legacy',
    'unknown': 'Unknown',
  };
  return labels[type] || 'Unknown';
}

export default function ScanPage() {
  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>('scanner');
  const [scanState, setScanState] = useState<ScanState>({
    status: 'initializing',
    errorMessage: null,
    lastResult: null,
    qrData: null,
  });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [manualSlug, setManualSlug] = useState('');

  // Check if user has REZ App and device capabilities
  const isMobile = isMobileDevice();
  const platform = detectPlatform();

  // Detect if user has REZ App (would check custom URL scheme)
  const hasRezApp = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for iOS custom URL scheme
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // Try to open the app - if it doesn't redirect, no app installed
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'reznow://';
      document.body.appendChild(iframe);

      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);

      return false; // Would need actual detection via pagehide event
    }

    // Check for Android intent URL
    const now = Date.now();
    const originalHref = window.location.href;

    const start = performance.now();
    window.location.href = 'intent://reznow.app#Intent;scheme=reznow;package=com.reznow.app;end';

    // If we're still here after 100ms, no app responded
    if (performance.now() - start > 100) {
      // Restore original URL
      window.location.href = originalHref;
    }

    return false;
  }, []);

  // Handle successful scan
  const handleScanSuccess = useCallback((qrData: QRCodeData) => {
    logger.info('[ScanPage] QR scanned', { type: qrData.type, raw: qrData.raw });

    // Play feedback
    playScanSound();
    if (isMobileDevice() && 'vibrate' in navigator) {
      triggerVibration();
    }

    setScanState({
      status: 'processing',
      errorMessage: null,
      lastResult: {
        text: qrData.raw,
        format: 'QR_CODE',
        timestamp: Date.now(),
      },
      qrData,
    });

    // Track analytics
    trackScan({
      scannerType: 'camera',
      qrType: qrData.type,
      success: true,
    });

    // Get navigation target
    const target = getNavigationTarget(qrData);

    // Navigate after short delay for UX
    setTimeout(() => {
      navigateTo(target);
    }, 800);
  }, []);

  // Handle scan error
  const handleScanError = useCallback((error: string) => {
    logger.error('[ScanPage] Scan error', { error });
    setScanState(prev => ({
      ...prev,
      status: 'error',
      errorMessage: error,
    }));
  }, []);

  // Handle manual entry
  const handleManualEntry = useCallback((data: ManualEntryData) => {
    logger.info('[ScanPage] Manual entry', { ...data });

    const target = processManualEntry(data);

    // Track analytics
    trackScan({
      scannerType: 'manual',
      qrType: data.type === 'room-code' ? 'room-hub' :
              data.type === 'campaign-code' ? 'ads-qr' : 'menu-qr',
      success: true,
    });

    navigateTo(target);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    logger.info('[ScanPage] Processing uploaded image');

    const validation = validateImageFile(file);
    if (!validation.valid) {
      handleScanError(validation.error || 'Invalid image');
      return;
    }

    try {
      const result = await scanImageQRCode(file);
      if (result) {
        const qrData: QRCodeData = {
          raw: result.text,
          type: 'menu-qr', // Default type
          metadata: {},
        };

        // Track analytics
        trackScan({
          scannerType: 'upload',
          qrType: qrData.type,
          success: true,
        });

        handleScanSuccess(qrData);
      } else {
        handleScanError('No QR code found in the image. Please try a different image.');
      }
    } catch (err) {
      logger.error('[ScanPage] Image scan error', { error: err instanceof Error ? err.message : String(err) });
      handleScanError('Failed to scan the image. Please try again.');
    }
  }, [handleScanSuccess, handleScanError]);

  // Handle link continuation
  const handleContinueWithLink = useCallback((url: string) => {
    logger.info('[ScanPage] Continue with link', { url });

    // Try to parse as QR data
    const qrData: QRCodeData = {
      raw: url,
      type: 'menu-qr',
      metadata: {},
    };

    const target = handleUniversalQR(url);
    navigateTo(target);
  }, []);

  // Navigate to target
  const navigateTo = useCallback((target: NavigationTarget) => {
    if (target.external) {
      window.location.href = target.path;
      return;
    }

    // Build query string if params exist
    const queryString = target.params
      ? '?' + new URLSearchParams(target.params).toString()
      : '';

    trackNavigation(target.path, true);
    router.push(target.path + queryString);
  }, [router]);

  // Handle manual form submit
  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const slug = manualSlug.trim().toLowerCase().replace(/\s+/g, '-');
    if (slug) {
      handleManualEntry({
        type: 'store-slug',
        value: slug,
      });
    }
  }, [manualSlug, handleManualEntry]);

  // Retry scanning
  const handleRetry = useCallback(() => {
    setScanState({
      status: 'ready',
      errorMessage: null,
      lastResult: null,
      qrData: null,
    });
    setViewMode('scanner');
  }, []);

  // Continue to result
  const handleContinue = useCallback(() => {
    if (scanState.qrData) {
      const target = getNavigationTarget(scanState.qrData);
      navigateTo(target);
    }
  }, [scanState.qrData, navigateTo]);

  // Decide initial view
  useEffect(() => {
    // Check if mobile user without app - show install prompt first
    if (isMobile && !hasRezApp()) {
      // Show install prompt option after a delay
      const timer = setTimeout(() => {
        // Could show install prompt, but for now proceed with web scanner
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-white">Scan QR Code</h1>
        {scanState.status === 'scanning' && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Camera active
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'manual' ? 'scanner' : 'manual')}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {viewMode === 'manual' ? 'Use Camera' : 'Enter Code'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {viewMode === 'scanner' && (
          <>
            {/* Camera scanner */}
            <div className="flex-1 relative">
              <WebQRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                enableSound={true}
                enableVibration={true}
                showManualEntry={false}
              />

              {/* Error message */}
              {scanState.errorMessage && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="flex-1 text-sm text-gray-300">{scanState.errorMessage}</p>
                    <button
                      onClick={handleRetry}
                      className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual entry fallback button */}
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => setViewMode('manual')}
                className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Don&apos;t have a camera? Enter code manually
              </button>
            </div>
          </>
        )}

        {viewMode === 'manual' && (
          <div className="flex-1 p-6">
            {/* Tabs for different entry modes */}
            <div className="mb-6">
              <ManualEntry
                onSubmit={handleManualEntry}
                className="max-w-md mx-auto"
              />
            </div>

            {/* Alternative: Image upload */}
            <div className="max-w-md mx-auto mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-950 text-gray-500">or</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400 mb-4">
                  Upload an image of a QR code
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800 cursor-pointer transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'result' && scanState.lastResult && (
          <div className="flex-1 p-6">
            <QRResult
              result={scanState.lastResult}
              isProcessing={scanState.status === 'processing'}
              onContinue={handleContinue}
              onRetry={handleRetry}
              className="max-w-md mx-auto"
            />
          </div>
        )}
      </div>

      {/* Install app prompt (shown conditionally) */}
      {showInstallPrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm">
            <InstallAppPrompt
              onDismiss={() => setShowInstallPrompt(false)}
              onContinueWeb={() => setShowInstallPrompt(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
