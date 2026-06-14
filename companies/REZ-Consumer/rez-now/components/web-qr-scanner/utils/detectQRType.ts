/**
 * QR Type Detection Utility
 * Detects the type of QR code based on its content
 *
 * Canonical source: shared/qr-types/src/index.ts
 * For full type definitions, use @rez/qr-types
 */

import type { QRType } from '../types';

/**
 * Patterns for different QR types
 */
const QR_PATTERNS = {
  // REZ Now domain URLs
  REZ_NOW: [
    /^https?:\/\/(www\.)?now\.rez\.money\//i,
    /^https?:\/\/(www\.)?reznow\.app\//i,
    /^https?:\/\/rez\.money\//i,
  ],

  // REZ Go Scan & Go codes
  REZ_GO: [
    /^REZG:/i,
    /^go-session:/i,
    /^go-product:/i,
  ],

  // REZ Go Recovery codes
  REZ_GO_RECOVERY: [
    /^RCV-/i,
    /^go-recovery:/i,
  ],

  // Safe QR codes (REZP, REZN, REZD, etc.)
  SAFE_QR: [
    /^REZP[A-Z0-9]{4}/i,
    /^REZN[A-Z0-9]{4}/i,
    /^REZD[A-Z0-9]{4}/i,
    /^REZM[A-Z0-9]{4}/i,
    /^REZH[A-Z0-9]{4}/i,
    /^REZC[A-Z0-9]{4}/i,
    /^REZV[A-Z0-9]{4}/i,
    /^REZB[A-Z0-9]{4}/i,
    /^REZK[A-Z0-9]{4}/i,
    /^REZL[A-Z0-9]{4}/i,
    /^REZA[A-Z0-9]{4}/i,
    /^REZO[A-Z0-9]{4}/i,
    /^REZE[A-Z0-9]{4}/i,
    /^REZS[A-Z0-9]{4}/i,
    /^https?:\/\/rez\.app\/s\//i,
    /^https?:\/\/rez\.app\/qr\//i,
  ],

  // Hotel room codes
  ROOM_HUB: [
    /^RZ-ROOM-/i,
    /^room-/i,
    /^room_/i,
    /^RZ-HUB-/i,
    /^HUB-/i,
  ],

  // Menu/Store QR codes
  MENU_QR: [
    /^https?:\/\/(www\.)?[a-z0-9-]+\.(com|io|app|xyz|net|org)\/menu/i,
    /^https?:\/\/(www\.)?[a-z0-9-]+\.(com|io|app|xyz|net|org)\/order/i,
    /^menu:/i,
    /^order:/i,
  ],

  // Ad/Campaign QR codes
  ADS_QR: [
    /^https?:\/\/ads\.rez\.money\//i,
    /^https?:\/\/ad\.rez\.money\//i,
    /^adsqr:/i,
    /^ad:/i,
    /^campaign:/i,
    /^promo:/i,
  ],

  // Legacy formats
  LEGACY: [
    /^RZ-/i,
    /^RZ[A-Z0-9]{6,}/i,
    /^[A-Z0-9]{8,}$/i, // Long alphanumeric codes
  ],
};

/**
 * Detects the type of QR code based on its content
 * @param code - The raw QR code content
 * @returns The detected QR type
 */
export function detectQRType(code: string): QRType {
  const trimmedCode = code.trim();

  // Check for Safe QR codes FIRST (before JSON parsing)
  for (const pattern of QR_PATTERNS.SAFE_QR) {
    if (pattern.test(trimmedCode)) {
      return 'safe-qr';
    }
  }

  // Check if it's a JSON payload with safe type
  if (trimmedCode.startsWith('{')) {
    try {
      const payload = JSON.parse(trimmedCode);
      if (payload.type === 'safe' && payload.shortcode) {
        return 'safe-qr';
      }
      // Check for REZ Go session
      if (payload.intent === 'go-session') {
        return 'rez-go';
      }
      // Check for REZ Go product
      if (payload.intent === 'go-product') {
        return 'rez-go';
      }
      // Check for REZ Go recovery
      if (payload.intent === 'go-recovery') {
        return 'rez-go-recovery';
      }
    } catch {
      // Not JSON, continue with other checks
    }
  }

  // Check for REZ Go patterns
  for (const pattern of QR_PATTERNS.REZ_GO) {
    if (pattern.test(trimmedCode)) {
      return 'rez-go';
    }
  }

  // Check for REZ Go Recovery patterns
  for (const pattern of QR_PATTERNS.REZ_GO_RECOVERY) {
    if (pattern.test(trimmedCode)) {
      return 'rez-go-recovery';
    }
  }

  // Check for REZ Now URLs
  for (const pattern of QR_PATTERNS.REZ_NOW) {
    if (pattern.test(trimmedCode)) {
      return 'rez-now';
    }
  }

  // Check for hotel room codes
  for (const pattern of QR_PATTERNS.ROOM_HUB) {
    if (pattern.test(trimmedCode)) {
      return 'room-hub';
    }
  }

  // Check for menu QR codes
  for (const pattern of QR_PATTERNS.MENU_QR) {
    if (pattern.test(trimmedCode)) {
      return 'menu-qr';
    }
  }

  // Check for ad/campaign QR codes
  for (const pattern of QR_PATTERNS.ADS_QR) {
    if (pattern.test(trimmedCode)) {
      return 'ad-campaign'; // UNIFIED: renamed from 'ads-qr'
    }
  }

  // Check for legacy formats
  for (const pattern of QR_PATTERNS.LEGACY) {
    if (pattern.test(trimmedCode)) {
      return 'legacy';
    }
  }

  // Check for plain store slugs (alphanumeric with dashes)
  if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(trimmedCode) && trimmedCode.length >= 3 && trimmedCode.length <= 50) {
    return 'menu-qr'; // Treat plain slugs as menu QR
  }

  // Check for valid URL or identifiable format
  if (isValidUrl(trimmedCode)) {
    // Could be any type, treat as menu-qr if it looks like a store
    return 'menu-qr';
  }

  return 'unknown';
}

/**
 * Checks if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts store slug from QR code content
 * Works with URLs and plain slugs
 */
export function extractStoreSlug(code: string): string | null {
  const trimmedCode = code.trim();

  // Handle full URLs
  try {
    const url = new URL(trimmedCode);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      return segments[0].toLowerCase();
    }
    return null;
  } catch {
    // Not a URL, try plain slug
  }

  // Plain text / store slug
  if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(trimmedCode)) {
    return trimmedCode.toLowerCase();
  }

  return null;
}

/**
 * Extracts room code from QR code content
 */
export function extractRoomCode(code: string): string | null {
  const trimmedCode = code.trim();

  // RZ-ROOM-XXXX format
  const roomMatch = trimmedCode.match(/RZ-ROOM-([A-Z0-9]+)/i);
  if (roomMatch) {
    return roomMatch[1];
  }

  // room-XXXX format
  const roomMatch2 = trimmedCode.match(/room[-_]([A-Z0-9]+)/i);
  if (roomMatch2) {
    return roomMatch2[1];
  }

  return null;
}

/**
 * Extracts campaign ID from QR code content
 */
export function extractCampaignId(code: string): string | null {
  const trimmedCode = code.trim();

  // campaign-id=XXXX format
  const campaignMatch = trimmedCode.match(/campaign[_-]?id[=:](\w+)/i);
  if (campaignMatch) {
    return campaignMatch[1];
  }

  // URL campaign parameter
  try {
    const url = new URL(trimmedCode);
    const campaignId = url.searchParams.get('campaign_id') || url.searchParams.get('campaignId');
    if (campaignId) {
      return campaignId;
    }
  } catch {
    // Not a URL
  }

  return null;
}

/**
 * Checks if a QR code needs legacy conversion
 */
export function isLegacyQR(code: string): boolean {
  return detectQRType(code) === 'legacy';
}

/**
 * Extracts metadata from QR code based on type
 */
export function extractMetadata(code: string): Record<string, string | undefined> {
  const trimmedCode = code.trim();
  const metadata: Record<string, string | undefined> = {};

  // Try JSON parsing first
  if (trimmedCode.startsWith('{')) {
    try {
      const payload = JSON.parse(trimmedCode);
      Object.assign(metadata, payload);
      return metadata;
    } catch {
      // Not JSON, continue
    }
  }

  // REZ Go session pattern: REZG:{base64}
  if (trimmedCode.startsWith('REZG:')) {
    try {
      const base64 = trimmedCode.slice(5);
      const decoded = Buffer.from(base64, 'base64url').toString('utf8');
      const [sessionId, expiresAt] = decoded.split(':');
      metadata.sessionId = sessionId;
      metadata.expiresAt = expiresAt;
      return metadata;
    } catch {
      // Continue with other parsing
    }
  }

  // REZ Go recovery pattern: RCV-{id}
  const recoveryMatch = trimmedCode.match(/^RCV-([A-Z0-9]+)/i);
  if (recoveryMatch) {
    metadata.transferId = recoveryMatch[1];
    return metadata;
  }

  return metadata;
}

/**
 * Converts legacy QR code to current format
 */
export function convertLegacyQR(code: string): string {
  const trimmedCode = code.trim();

  // RZ-XXXXXX format -> now.rez.money/xxxxxx
  if (/^RZ[A-Z0-9]{6,}$/i.test(trimmedCode)) {
    const slug = trimmedCode.slice(2).toLowerCase();
    return `https://now.rez.money/${slug}`;
  }

  // Just a long alphanumeric code
  if (/^[A-Z0-9]{8,}$/i.test(trimmedCode)) {
    return `https://now.rez.money/${trimmedCode.toLowerCase()}`;
  }

  return trimmedCode;
}

/**
 * Verifies a REZ Go QR code
 * Returns validation result with parsed data
 */
export function verifyRezGoQR(code: string): {
  valid: boolean;
  type?: 'session' | 'product' | 'recovery';
  data?: {
    storeId?: string;
    sessionId?: string;
    productId?: string;
    barcode?: string;
    transferId?: string;
    action?: string;
    expiresAt?: number;
  };
  error?: string;
} {
  const trimmedCode = code.trim();

  // Try JSON parsing
  if (trimmedCode.startsWith('{')) {
    try {
      const payload = JSON.parse(trimmedCode);

      if (payload.intent === 'go-session') {
        return {
          valid: true,
          type: 'session',
          data: {
            storeId: payload.storeId,
            action: payload.action,
          },
        };
      }

      if (payload.intent === 'go-product') {
        return {
          valid: true,
          type: 'product',
          data: {
            storeId: payload.storeId,
            sessionId: payload.sessionId,
            productId: payload.productId,
            barcode: payload.barcode,
          },
        };
      }

      if (payload.intent === 'go-recovery') {
        return {
          valid: true,
          type: 'recovery',
          data: {
            transferId: payload.transferId,
            sessionId: payload.sessionId,
            storeId: payload.storeId,
          },
        };
      }

      return { valid: false, error: 'Unknown REZ Go intent' };
    } catch {
      return { valid: false, error: 'Invalid JSON payload' };
    }
  }

  // REZG: prefix (HMAC-signed)
  if (trimmedCode.startsWith('REZG:')) {
    try {
      const base64 = trimmedCode.slice(5);
      const decoded = Buffer.from(base64, 'base64url').toString('utf8');
      const parts = decoded.split(':');

      if (parts.length >= 2) {
        return {
          valid: true,
          type: 'session',
          data: {
            sessionId: parts[0],
            expiresAt: parseInt(parts[1], 10),
          },
        };
      }

      return { valid: false, error: 'Invalid REZG format' };
    } catch {
      return { valid: false, error: 'Failed to decode REZG token' };
    }
  }

  // Recovery pattern
  if (trimmedCode.startsWith('RCV-')) {
    return {
      valid: true,
      type: 'recovery',
      data: {
        transferId: trimmedCode,
      },
    };
  }

  return { valid: false, error: 'Unrecognized REZ Go format' };
}
}

/**
 * Gets a human-readable label for a QR type
 */
export function getQRTypeLabel(type: QRType): string {
  const labels: Record<QRType, string> = {
    'room-hub': 'Room Service',
    'menu-qr': 'Store Menu',
    'rez-now': 'REZ Now',
    'ad-campaign': 'Campaign',
    'safe-qr': 'Safe QR',
    'go-session': 'REZ Go',
    'go-product': 'Scan Product',
    'go-recovery': 'Recovery',
    'product-verify': 'Verify Product',
    'creator-qr': 'Creator',
    'shelf-qr': 'Shelf QR',
    'salon-qr': 'Salon',
    'wallet-transfer': 'Wallet',
    'legacy': 'Legacy',
    'unknown': 'Unknown',
  };
  return labels[type] || 'Unknown';
}
