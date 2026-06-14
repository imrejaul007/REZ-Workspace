/**
 * Web QR Scanner Analytics
 * Tracks scan events for analytics
 */

import type { ScanAnalytics, ScannerType, QRType, Platform, ScanSource } from '../types';
import { logger } from '@/lib/utils/logger';

// Analytics endpoint (would be configured in environment)
const ANALYTICS_ENDPOINT = '/api/analytics/web-qr-scan';

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'desktop';
  }

  const ua = navigator.userAgent.toLowerCase();

  // Check for mobile devices
  if (/android/i.test(ua)) {
    return 'mobile';
  }
  if (/iphone|ipad|ipod/i.test(ua)) {
    return 'mobile';
  }

  // Check for tablets
  if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  }

  // Check by screen size as fallback
  const width = window.innerWidth;
  if (width < 768) {
    return 'mobile';
  }
  if (width < 1024) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Detect if user is on mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Track a web QR scan event
 */
export async function trackScan(params: {
  scannerType: ScannerType;
  qrType: QRType;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const analytics: ScanAnalytics = {
    source: 'web',
    platform: detectPlatform(),
    scannerType: params.scannerType,
    qrType: params.qrType,
    success: params.success,
    errorMessage: params.errorMessage,
    timestamp: Date.now(),
  };

  // Log locally
  logger.info('[WebQRScanner] Scan event', { analytics });

  // Send to analytics endpoint (non-blocking)
  sendAnalytics(analytics, params.metadata);
}

/**
 * Send analytics to backend
 */
async function sendAnalytics(
  analytics: ScanAnalytics,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Use sendBeacon for reliability (won't be blocked by page unload)
    const data = JSON.stringify({
      ...analytics,
      metadata,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, data);
    } else {
      // Fallback to fetch
      await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
        keepalive: true,
      });
    }
  } catch (err) {
    // Silently fail analytics - not critical
    logger.debug('[WebQRScanner] Failed to send analytics:', { error: err });
  }
}

/**
 * Track camera permission status
 */
export function trackCameraPermission(status: 'granted' | 'denied' | 'prompt'): void {
  logger.info('[WebQRScanner] Camera permission', { status });

  // Could send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'camera_permission', {
      event_category: 'web_qr_scanner',
      event_label: status,
    });
  }
}

/**
 * Track fallback usage (when user switches to manual entry)
 */
export function trackFallbackUsed(fallbackType: 'manual' | 'upload' | 'link'): void {
  logger.info('[WebQRScanner] Fallback used', { fallbackType });

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'fallback_used', {
      event_category: 'web_qr_scanner',
      event_label: fallbackType,
    });
  }
}

/**
 * Track install app prompt shown
 */
export function trackInstallPromptShown(): void {
  logger.info('[WebQRScanner] Install prompt shown');
}

/**
 * Track install app prompt action
 */
export function trackInstallPromptAction(action: 'dismiss' | 'install' | 'continue_web'): void {
  logger.info('[WebQRScanner] Install prompt action', { action });

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'install_prompt_action', {
      event_category: 'web_qr_scanner',
      event_label: action,
    });
  }
}

/**
 * Track navigation attempt
 */
export function trackNavigation(targetPath: string, success: boolean): void {
  logger.info('[WebQRScanner] Navigation', { targetPath, success });

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'qr_navigation', {
      event_category: 'web_qr_scanner',
      event_label: targetPath,
      success,
    });
  }
}

// Type declaration for global gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
