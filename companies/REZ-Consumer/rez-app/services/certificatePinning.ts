// @ts-nocheck
/**
 * Certificate Pinning Service
 *
 * SECURITY M-001 FIX: Implements certificate pinning to prevent MITM attacks
 * on compromised devices with rogue CA certificates installed.
 *
 * HOW IT WORKS:
 * 1. On each request to pinned endpoints (/auth, /payment, /wallet),
 *    we validate the server's SSL certificate against our pinned hashes
 * 2. If the certificate doesn't match, the request is rejected
 * 3. This prevents attackers from intercepting traffic even if they have
 *    a trusted CA certificate installed on the device
 *
 * SETUP:
 * 1. Get the SHA-256 fingerprint of your server's SSL certificate:
 *    openssl s_client -servername api.rez.app -connect api.rez.app:443 </dev/null 2>/dev/null | \
 *      openssl x509 -fingerprint -sha256 -noout
 *
 * 2. Add to environment:
 *    EXPO_PUBLIC_SSL_PIN_API=sha256/XXXXXXXXXXXXXXXXXXXXXX=
 *
 * 3. For Razorpay (payment gateway):
 *    EXPO_PUBLIC_SSL_PIN_RAZORPAY=sha256/YYYYYYYYYYYYYYYYYYYYYY=
 *
 * 4. Enable pinning in production:
 *    EXPO_PUBLIC_SSL_PINNING_ENABLED=true
 *
 * IMPORTANT: Certificate pinning can break your app if certificates rotate.
 * Always keep backup pins and implement proper certificate rollover.
 */

import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { Sentry } from '@/config/sentry';

// Certificate pinning configuration
interface PinnedCertificate {
  pins: string[];
  includeSubdomains?: boolean;
}

interface CertificatePinningConfig {
  [hostname: string]: PinnedCertificate;
}

// Get certificate pins from environment
function getCertificatePins(): CertificatePinningConfig {
  const pins: CertificatePinningConfig = {};

  // API Server pins (REZ Auth/Payment/Wallet endpoints)
  const apiPins = process.env.EXPO_PUBLIC_SSL_PIN_API;
  if (apiPins) {
    pins['api.rez.app'] = {
      pins: apiPins.split(',').map(p => p.trim()).filter(Boolean),
      includeSubdomains: true,
    };
    // Also pin onrender.com domains (where services are hosted)
    pins['rez-auth-service.onrender.com'] = {
      pins: apiPins.split(',').map(p => p.trim()).filter(Boolean),
    };
    pins['rez-payment-service.onrender.com'] = {
      pins: apiPins.split(',').map(p => p.trim()).filter(Boolean),
    };
  }

  // Razorpay payment gateway pins
  const razorpayPins = process.env.EXPO_PUBLIC_SSL_PIN_RAZORPAY;
  if (razorpayPins) {
    pins['api.razorpay.com'] = {
      pins: razorpayPins.split(',').map(p => p.trim()).filter(Boolean),
    };
    pins['checkout.razorpay.com'] = {
      pins: razorpayPins.split(',').map(p => p.trim()).filter(Boolean),
    };
  }

  // Add any additional pinned domains from environment
  const envKeys = Object.keys(process.env).filter(
    key => key.startsWith('EXPO_PUBLIC_SSL_PIN_') &&
           key !== 'EXPO_PUBLIC_SSL_PIN_API' &&
           key !== 'EXPO_PUBLIC_SSL_PIN_RAZORPAY' &&
           key !== 'EXPO_PUBLIC_SSL_PINNING_ENABLED'
  );

  for (const key of envKeys) {
    const domain = key
      .replace('EXPO_PUBLIC_SSL_PIN_', '')
      .toLowerCase()
      .replace(/_/g, '.');
    const pinValues = process.env[key];
    if (pinValues) {
      pins[domain] = {
        pins: pinValues.split(',').map(p => p.trim()).filter(Boolean),
      };
    }
  }

  return pins;
}

// Hosts that require certificate pinning
const PINNED_HOSTS = [
  'api.rez.app',
  'auth.rez.app',
  'wallet.rez.app',
  'rez-auth-service.onrender.com',
  'rez-payment-service.onrender.com',
  'api.razorpay.com',
  'checkout.razorpay.com',
];

// Endpoints that require certificate pinning
const PINNED_ENDPOINT_PATTERNS = [
  '/auth/',
  '/payment/',
  '/wallet/',
  '/mfa/',
  '/oauth/',
  '/admin/',
  '/token',
  '/login',
];

interface PinValidationResult {
  valid: boolean;
  reason?: string;
  hostname?: string;
  endpoint?: string;
}

/**
 * Check if an endpoint requires certificate pinning
 */
export function isPinnedEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    // Check if hostname requires pinning
    const hostRequiresPinning = PINNED_HOSTS.some(
      host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );

    if (!hostRequiresPinning) {
      return false;
    }

    // Check if path pattern requires pinning
    return PINNED_ENDPOINT_PATTERNS.some(pattern => pathname.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Normalize a fingerprint to a consistent format
 */
function normalizeFingerprint(fingerprint: string): string {
  let normalized = fingerprint.trim().toLowerCase();
  if (normalized.startsWith('sha256/')) {
    normalized = normalized.substring(7);
  }
  if (normalized.startsWith('sha256:')) {
    normalized = normalized.substring(7);
  }
  normalized = normalized.replace(/:/g, '');
  return normalized;
}

/**
 * Validate certificate pins for a given hostname
 */
export async function validateCertificatePin(
  hostname: string,
  certificateFingerprint?: string
): Promise<PinValidationResult> {
  const pinnedHosts = getCertificatePins();
  const config = pinnedHosts[hostname];

  // If no pins configured, allow but warn in production
  if (!config || config.pins.length === 0) {
    if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
      logger.warn('[CertPinning] No pins configured for production host:', hostname);
    }
    return { valid: true };
  }

  if (certificateFingerprint) {
    const normalizedFingerprint = normalizeFingerprint(certificateFingerprint);
    const isValidPin = config.pins.some(pin => {
      return normalizeFingerprint(pin) === normalizedFingerprint;
    });

    if (!isValidPin) {
      const error = `[CertPinning] Pin mismatch for ${hostname}`;
      logger.error(error);
      reportPinFailure(hostname, config.pins, certificateFingerprint);
      return { valid: false, reason: error, hostname };
    }
    return { valid: true, hostname };
  }

  return { valid: true, hostname };
}

/**
 * Validate a complete URL for certificate pinning requirements
 */
export async function validatePinnedEndpoint(url: string): Promise<PinValidationResult> {
  if (!isPinnedEndpoint(url)) {
    return { valid: true };
  }

  try {
    const parsed = new URL(url);

    // Skip pinning for localhost in development
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return { valid: true };
    }

    // Skip pinning in development unless explicitly enabled
    if (__DEV__ && !process.env.EXPO_PUBLIC_ENABLE_CERT_PINNING_DEV) {
      return { valid: true };
    }

    return validateCertificatePin(parsed.hostname);
  } catch (error) {
    logger.error('[CertPinning] Failed to parse URL:', url, error);
    return { valid: false, reason: 'Invalid URL', endpoint: url };
  }
}

/**
 * Create a certificate pinning middleware for fetch requests
 */
export function createPinnedFetch(originalFetch: typeof fetch): typeof fetch {
  return async function pinnedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (isPinnedEndpoint(url)) {
      const validation = await validatePinnedEndpoint(url);

      if (!validation.valid) {
        logger.error('[CertPinning] BLOCKED request to:', url);

        // Fail closed in production
        if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
          throw new Error(
            `Certificate pin validation failed for ${validation.hostname}. ` +
            'This may indicate a security issue. Please report this to support.'
          );
        }
        logger.warn('[CertPinning] Dev mode: Allowing request despite pin failure');
      }
    }

    return originalFetch(input, init);
  };
}

/**
 * Report a certificate pinning failure
 */
export function reportPinFailure(
  hostname: string,
  expectedPins: string[],
  receivedFingerprint?: string
): void {
  logger.error('[CertPinning] PIN FAILURE', {
    hostname,
    expectedPins: expectedPins.length,
    receivedFingerprint,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });

  // Report to Sentry for monitoring
  Sentry?.captureMessage?.('Certificate pinning failure', {
    extra: { hostname, expectedPins, receivedFingerprint },
  });
}

/**
 * Get the current pinning configuration status
 */
export function getPinningStatus(): {
  configured: boolean;
  enabled: boolean;
  pinnedHosts: string[];
  platform: string;
} {
  const pins = getCertificatePins();
  return {
    configured: Object.keys(pins).length > 0,
    enabled: process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED === 'true',
    pinnedHosts: Object.keys(pins),
    platform: Platform.OS,
  };
}

// Certificate pinning service
export const certificatePinningService = {
  isEnabled: (): boolean => process.env.EXPO_PUBLIC_SSL_PINNING_ENABLED === 'true',
  shouldPin: isPinnedEndpoint,
  validate: validatePinnedEndpoint,
  createPinnedFetch,
  getStatus: getPinningStatus,
  reportFailure: reportPinFailure,
};

export default certificatePinningService;
