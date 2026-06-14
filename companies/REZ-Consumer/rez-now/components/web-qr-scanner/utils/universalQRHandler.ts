/**
 * Universal QR Handler
 * Handles navigation based on QR code type
 */

import type { QRCodeData, NavigationTarget, ManualEntryData, QRType } from '../types';
import { detectQRType, extractStoreSlug, extractRoomCode, extractCampaignId, convertLegacyQR, extractMetadata } from './detectQRType';

/**
 * Handle a universal QR code and return navigation target
 */
export function handleUniversalQR(code: string): NavigationTarget {
  const qrData: QRCodeData = {
    raw: code,
    type: detectQRType(code),
    metadata: extractMetadata(code),
  };

  return getNavigationTarget(qrData);
}

/**
 * Handle QR code data and return navigation target
 */
export function getNavigationTarget(qrData: QRCodeData): NavigationTarget {
  const { raw, type, metadata } = qrData;

  switch (type) {
    case 'room-hub':
      return handleRoomHubQR(raw, metadata);

    case 'menu-qr':
      return handleMenuQR(raw, metadata);

    case 'rez-now':
      return handleRezNowQR(raw, metadata);

    case 'safe-qr':
      return handleSafeQR(raw, metadata);

    case 'ads-qr':
      return handleAdsQR(raw, metadata);

    case 'rez-go':
      return handleRezGoQR(raw, metadata);

    case 'rez-go-recovery':
      return handleRezGoRecoveryQR(raw, metadata);

    case 'legacy':
      return handleLegacyQR(raw);

    case 'unknown':
    default:
      // Try to extract a store slug anyway
      const slug = extractStoreSlug(raw);
      if (slug) {
        return {
          path: `/${slug}`,
          params: { source: 'qr' },
        };
      }
      // Unknown format - try to navigate directly if it's a URL
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return {
          path: raw,
          external: true,
        };
      }
      // Can't handle this format
      return {
        path: '/',
        params: { error: 'unrecognized-qr' },
      };
  }
}

/**
 * Handle room hub QR codes
 */
function handleRoomHubQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  const roomCode = extractRoomCode(raw) || metadata?.roomCode;

  if (roomCode) {
    return {
      path: `/room/${roomCode}`,
      params: { source: 'qr' },
      // Deep link to native app
      appLink: `reznow://room/${roomCode}`,
    };
  }

  // Try to extract from URL format
  try {
    const url = new URL(raw);
    if (url.pathname) {
      const roomSlug = url.pathname.replace(/^\//, '').split('/')[0];
      return {
        path: `/room/${roomSlug}`,
        params: { source: 'qr' },
        appLink: `reznow://room/${roomSlug}`,
      };
    }
  } catch {
    // Not a URL
  }

  return {
    path: '/',
    params: { error: 'invalid-room-qr' },
  };
}

/**
 * Handle Safe QR codes
 */
function handleSafeQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  // Extract shortcode from various formats
  let shortcode = '';

  // Direct shortcode format (REZP01, REZN01, etc.)
  if (/^REZ[A-Z][A-Z0-9]{4}$/i.test(raw)) {
    shortcode = raw.toUpperCase();
  }

  // JSON payload format
  if (raw.startsWith('{')) {
    try {
      const payload = JSON.parse(raw);
      if (payload.shortcode) {
        shortcode = payload.shortcode.toUpperCase();
      }
    } catch {
      // Not JSON
    }
  }

  // URL format (/s/REZP01 or /qr/REZP01)
  if (raw.includes('/s/') || raw.includes('/qr/')) {
    try {
      const url = new URL(raw.includes('http') ? raw : `https://rez.app${raw}`);
      const parts = url.pathname.split('/');
      shortcode = parts[parts.length - 1].toUpperCase();
    } catch {
      // Not a valid URL
    }
  }

  if (shortcode) {
    return {
      path: `/safe-qr?code=${shortcode}`,
      params: { source: 'qr' },
      // Deep link to native app
      appLink: `reznow://safe-qr/${shortcode}`,
    };
  }

  return {
    path: '/safe-qr',
    params: { source: 'qr' },
    appLink: 'reznow://safe-qr',
  };
}

/**
 * Handle menu/store QR codes
 */
function handleMenuQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  // Extract store slug from URL or plain text
  const storeSlug = metadata?.storeSlug || extractStoreSlug(raw);

  if (storeSlug) {
    return {
      path: `/${storeSlug}`,
      params: { source: 'qr' },
      // Check if URL includes /menu path
      appLink: raw.includes('/menu') ? `reznow://${storeSlug}/menu` : `reznow://${storeSlug}`,
    };
  }

  // Try to parse as URL
  try {
    const url = new URL(raw);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (pathSegments.length >= 1) {
      const slug = pathSegments[0];
      return {
        path: `/${slug}`,
        params: { source: 'qr' },
      };
    }
  } catch {
    // Not a URL
  }

  return {
    path: '/',
    params: { error: 'invalid-menu-qr' },
  };
}

/**
 * Handle REZ Now format QR codes
 */
function handleRezNowQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  // now.rez.money URLs
  try {
    const url = new URL(raw);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (pathSegments.length >= 1) {
      const slug = pathSegments[0];
      const hasMenuPath = pathSegments.includes('menu');

      return {
        path: hasMenuPath ? `/${slug}/menu` : `/${slug}`,
        params: { source: 'qr' },
        appLink: `reznow://${slug}${hasMenuPath ? '/menu' : ''}`,
      };
    }
  } catch {
    // Not a URL
  }

  return {
    path: '/',
    params: { error: 'invalid-reznow-qr' },
  };
}

/**
 * Handle ad/campaign QR codes
 */
function handleAdsQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  const campaignId = metadata?.campaignId || extractCampaignId(raw);

  if (campaignId) {
    return {
      path: `/campaign/${campaignId}`,
      params: { source: 'qr' },
      appLink: `reznow://campaign/${campaignId}`,
    };
  }

  // Try to parse as URL
  try {
    const url = new URL(raw);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Look for campaign ID in path
    const campaignIndex = pathSegments.findIndex(seg => seg === 'campaign' || seg === 'ads' || seg === 'promo');
    if (campaignIndex >= 0 && pathSegments[campaignIndex + 1]) {
      return {
        path: `/campaign/${pathSegments[campaignIndex + 1]}`,
        params: { source: 'qr' },
      };
    }
  } catch {
    // Not a URL
  }

  return {
    path: '/',
    params: { error: 'invalid-campaign-qr' },
  };
}

/**
 * Handle legacy QR codes
 */
function handleLegacyQR(raw: string): NavigationTarget {
  // Convert legacy format to current format
  const converted = convertLegacyQR(raw);

  // Process the converted URL
  try {
    const url = new URL(converted);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (pathSegments.length >= 1) {
      return {
        path: `/${pathSegments[0]}`,
        params: { source: 'qr', legacy: 'true' },
      };
    }
  } catch {
    // Still not a valid URL
  }

  return {
    path: '/',
    params: { error: 'invalid-legacy-qr' },
  };
}

/**
 * Handle REZ Go Scan & Go QR codes
 */
function handleRezGoQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  // Try to parse JSON payload
  if (raw.startsWith('{')) {
    try {
      const payload = JSON.parse(raw);

      if (payload.intent === 'go-session') {
        return {
          path: '/go',
          params: {
            storeId: payload.storeId || '',
            action: payload.action || 'start',
            sessionId: payload.sessionId || '',
          },
          appLink: `rezapp://go?storeId=${payload.storeId}&action=${payload.action}`,
        };
      }

      if (payload.intent === 'go-product') {
        return {
          path: '/go/scan',
          params: {
            storeId: payload.storeId || '',
            sessionId: payload.sessionId || '',
            barcode: payload.barcode || '',
          },
          appLink: `rezapp://go/scan?barcode=${payload.barcode}`,
        };
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  // REZG: prefix (HMAC-signed session token)
  if (raw.startsWith('REZG:')) {
    return {
      path: '/go',
      params: { type: 'session', code: raw },
      appLink: `rezapp://go?code=${encodeURIComponent(raw)}`,
    };
  }

  // go-session: or go-product: prefix
  if (raw.startsWith('go-session:') || raw.startsWith('go-product:')) {
    return {
      path: '/go',
      params: { type: 'session', code: raw },
      appLink: `rezapp://go?code=${encodeURIComponent(raw)}`,
    };
  }

  // Fallback to go screen
  return {
    path: '/go',
    params: { source: 'qr' },
    appLink: 'rezapp://go',
  };
}

/**
 * Handle REZ Go Checkout Recovery QR codes
 */
function handleRezGoRecoveryQR(raw: string, metadata?: QRCodeData['metadata']): NavigationTarget {
  // Try to parse JSON payload
  if (raw.startsWith('{')) {
    try {
      const payload = JSON.parse(raw);

      if (payload.intent === 'go-recovery') {
        return {
          path: '/merchant/rez-go/recovery',
          params: {
            transferId: payload.transferId || '',
            sessionId: payload.sessionId || '',
          },
        };
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  // RCV- prefix
  if (raw.startsWith('RCV-')) {
    return {
      path: '/merchant/rez-go/recovery',
      params: { transferId: raw },
    };
  }

  // go-recovery: prefix
  if (raw.startsWith('go-recovery:')) {
    return {
      path: '/merchant/rez-go/recovery',
      params: { code: raw },
    };
  }

  // Fallback to merchant dashboard
  return {
    path: '/merchant/rez-go',
    params: { error: 'invalid-recovery-qr' },
  };
}

/**
 * Handle manual entry data
 */
export function handleManualEntry(entry: ManualEntryData): NavigationTarget {
  switch (entry.type) {
    case 'store-slug':
      return {
        path: `/${entry.value}`,
        params: { source: 'manual' },
      };

    case 'room-code':
      return {
        path: `/room/${entry.value}`,
        params: { source: 'manual' },
        appLink: `reznow://room/${entry.value}`,
      };

    case 'campaign-code':
      return {
        path: `/campaign/${entry.value}`,
        params: { source: 'manual' },
        appLink: `reznow://campaign/${entry.value}`,
      };

    default:
      return {
        path: '/',
        params: { error: 'invalid-entry' },
      };
  }
}

/**
 * Extract metadata from QR code content
 */
function extractMetadata(code: string): QRCodeData['metadata'] {
  const metadata: QRCodeData['metadata'] = {};

  // Extract store slug from URL
  try {
    if (code.startsWith('http://') || code.startsWith('https://')) {
      const url = new URL(code);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length >= 1) {
        metadata.storeSlug = segments[0];
      }

      // Check for campaign parameter
      const campaignId = url.searchParams.get('campaign_id') || url.searchParams.get('campaignId');
      if (campaignId) {
        metadata.campaignId = campaignId;
      }
    }
  } catch {
    // Not a URL
  }

  // Extract room code
  const roomCode = extractRoomCode(code);
  if (roomCode) {
    metadata.roomCode = roomCode;
  }

  // Extract campaign ID
  const campaignId = extractCampaignId(code);
  if (campaignId) {
    metadata.campaignId = campaignId;
  }

  // Check if legacy format
  if (detectQRType(code) === 'legacy') {
    metadata.isLegacy = true;
  }

  return metadata;
}

/**
 * Check if navigation should open in app (deep link)
 */
export function shouldOpenInApp(target: NavigationTarget): boolean {
  // For mobile devices, prefer app link if available
  if (typeof window !== 'undefined') {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && target.appLink) {
      return true;
    }
  }
  return false;
}
