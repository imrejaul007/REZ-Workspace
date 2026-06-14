// @ts-nocheck
/**
 * Certificate Pinning Utility
 * Implements SSL/TLS certificate pinning to prevent MITM attacks
 *
 * @packageDocumentation
 */

import { Platform } from 'react-native';

// Environment detection
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Certificate pinning configuration for each API domain
 */
interface CertificatePinningConfig {
  /** Domain to pin (without protocol) */
  domain: string;
  /** SHA-256 hashes of the server's public keys */
  publicKeyHashes: string[];
  /** Whether to include subdomains */
  includeSubdomains?: boolean;
  /** Backup pins for key rotation */
  backupPins?: string[];
  /** Expiration date for the pin set */
  expirationDate?: string;
}

/**
 * Pin status for a domain
 */
type PinStatus = 'valid' | 'expired' | 'not_found' | 'mismatch';

/**
 * Pin validation result
 */
interface PinValidationResult {
  domain: string;
  status: PinStatus;
  message: string;
  timestamp: number;
}

/**
 * Certificate pinning configuration for all API endpoints
 * IMPORTANT: Replace placeholder hashes with actual certificate hashes
 *
 * To get certificate hashes:
 * 1. openssl s_client -servername domain.com -connect domain.com:443 </dev/null 2>/dev/null | openssl x509 -pubkey | openssl dgst -sha256 -binary | base64
 */
const PINNED_CERTIFICATES: Record<string, CertificatePinningConfig> = {
  // Primary API Gateway
  'api.rez.app': {
    domain: 'api.rez.app',
    publicKeyHashes: [
      // Primary certificate hash - MUST BE REPLACED
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    ],
    backupPins: [
      // Backup certificate hash for key rotation
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
    includeSubdomains: true,
    expirationDate: '2027-01-01',
  },

  // Authentication service
  'auth.rez.app': {
    domain: 'auth.rez.app',
    publicKeyHashes: [
      'sha256/CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
    ],
    backupPins: [
      'sha256/DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
    ],
    includeSubdomains: false,
  },

  // Payment service (highest security)
  'pay.rez.app': {
    domain: 'pay.rez.app',
    publicKeyHashes: [
      'sha256/EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE=',
    ],
    backupPins: [
      'sha256/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF=',
    ],
    includeSubdomains: true,
    expirationDate: '2027-06-01',
  },
};

/**
 * Check if certificate pinning should be enforced
 */
export const isPinningEnabled = (): boolean => {
  // Skip pinning in development for easier debugging
  if (IS_DEV) {
    return false;
  }
  return IS_PRODUCTION;
};

/**
 * Get the pin configuration for a domain
 */
function getPinConfig(domain: string): CertificatePinningConfig | null {
  // Direct match
  if (PINNED_CERTIFICATES[domain]) {
    return PINNED_CERTIFICATES[domain];
  }

  // Check for subdomain matches
  for (const config of Object.values(PINNED_CERTIFICATES)) {
    if (config.includeSubdomains && domain.endsWith(`.${config.domain}`)) {
      return config;
    }
  }

  return null;
}

/**
 * Validate certificate pin for a domain
 * In production, this is enforced at the native network layer
 * This function provides runtime validation and logging
 */
export async function validateCertificatePin(
  domain: string
): Promise<PinValidationResult> {
  const timestamp = Date.now();

  // Skip validation in development
  if (!isPinningEnabled()) {
    return {
      domain,
      status: 'valid',
      message: 'Pinning disabled in development',
      timestamp,
    };
  }

  const config = getPinConfig(domain);

  if (!config) {
    logger.warn(`[CertificatePinning] No pin configuration for: ${domain}`);
    return {
      domain,
      status: 'not_found',
      message: `Certificate pinning not configured for ${domain}`,
      timestamp,
    };
  }

  // Check pin expiration
  if (config.expirationDate) {
    const expirationTime = new Date(config.expirationDate).getTime();
    if (timestamp > expirationTime) {
      logger.error(`[CertificatePinning] Pin expired for: ${domain}`);
      return {
        domain,
        status: 'expired',
        message: `Certificate pin expired on ${config.expirationDate}`,
        timestamp,
      };
    }
  }

  // In production, actual pin validation happens in the native layer
  // This is a configuration check to ensure the app is properly configured
  return {
    domain,
    status: 'valid',
    message: 'Certificate pin configured',
    timestamp,
  };
}

/**
 * Validate all configured certificate pins
 */
export async function validateAllPins(): Promise<PinValidationResult[]> {
  const results = await Promise.all(
    Object.keys(PINNED_CERTIFICATES).map(domain => validateCertificatePin(domain))
  );
  return results;
}

/**
 * Check if a URL's domain has pinning configured
 */
export function hasPinningConfigured(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return getPinConfig(urlObj.hostname) !== null;
  } catch {
    return false;
  }
}

/**
 * Get security headers for a request
 * These should be set at the network layer
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Security-Version': '1.0',
    'X-Pinning-Enabled': isPinningEnabled().toString(),
    ...(Platform.OS === 'ios' && { 'X-iOS-Version': Platform.Version.toString() }),
  };
}

/**
 * Network security configuration for Android
 * This should be placed in android/app/src/main/res/xml/network_security_config.xml
 */
export const ANDROID_NETWORK_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>

  ${Object.entries(PINNED_CERTIFICATES)
    .map(([domain, config]) => `
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="${config.includeSubdomains ? 'true' : 'false'}">${domain}</domain>
    <pin-set expiration="${config.expirationDate || '2027-01-01'}">
      ${config.publicKeyHashes.map(hash => `<pin digest="SHA-256">${hash}</pin>`).join('\n      ')}
      ${config.backupPins?.map(hash => `<pin digest="SHA-256">${hash}</pin>`).join('\n      ') || ''}
    </pin-set>
  </domain-config>`)
    .join('\n')}
</network-security-config>`;

/**
 * iOS ATS (App Transport Security) configuration
 * Add to Info.plist
 */
export const IOS_ATS_CONFIG = {
  NSAllowsArbitraryLoads: false,
  NSAllowsArbitraryLoadsForMedia: false,
  NSAllowsArbitraryLoadsInWebContent: false,
  NSExceptionDomains: {
    'localhost': {
      NSExceptionAllowsInsecureHTTPLoads: true,
      NSIncludesSubdomains: false,
    },
  },
};

/**
 * Pin status for reporting/monitoring
 */
export interface PinHealthReport {
  timestamp: number;
  environment: string;
  pinningEnabled: boolean;
  totalDomains: number;
  validDomains: number;
  invalidDomains: number;
  expiredDomains: number;
}

/**
 * Get a health report of all pin configurations
 */
export function getPinHealthReport(): PinHealthReport {
  const results = validateAllPinsSync();

  return {
    timestamp: Date.now(),
    environment: IS_DEV ? 'development' : 'production',
    pinningEnabled: isPinningEnabled(),
    totalDomains: Object.keys(PINNED_CERTIFICATES).length,
    validDomains: results.filter(r => r.status === 'valid').length,
    invalidDomains: results.filter(r => r.status === 'not_found').length,
    expiredDomains: results.filter(r => r.status === 'expired').length,
  };
}

/**
 * Synchronous pin validation for health checks
 */
function validateAllPinsSync(): PinValidationResult[] {
  const timestamp = Date.now();

  return Object.entries(PINNED_CERTIFICATES).map(([domain, config]) => {
    if (config.expirationDate) {
      const expirationTime = new Date(config.expirationDate).getTime();
      if (timestamp > expirationTime) {
        return {
          domain,
          status: 'expired' as PinStatus,
          message: `Expired: ${config.expirationDate}`,
          timestamp,
        };
      }
    }

    return {
      domain,
      status: 'valid' as PinStatus,
      message: 'Configured',
      timestamp,
    };
  });
}

/**
 * Certificate pinning middleware for fetch/XHR requests
 * Use this to wrap network requests in production
 */
export async function withCertificatePinning<T>(
  url: string,
  requestFn: () => Promise<T>
): Promise<T> {
  if (!isPinningEnabled()) {
    return requestFn();
  }

  const validation = await validateCertificatePin(new URL(url).hostname);

  if (validation.status === 'expired') {
    throw new Error(`Certificate pinning expired for ${validation.domain}`);
  }

  if (validation.status === 'not_found') {
    logger.warn(`[CertificatePinning] Request to unpinned domain: ${url}`);
  }

  return requestFn();
}

export default {
  isPinningEnabled,
  validateCertificatePin,
  validateAllPins,
  hasPinningConfigured,
  getSecurityHeaders,
  getPinHealthReport,
  withCertificatePinning,
  ANDROID_NETWORK_CONFIG,
  IOS_ATS_CONFIG,
};
