/**
 * Privacy Utilities
 * GDPR-compliant data anonymization functions
 */
import { logger } from '@/utils/logger';

/**
 * Anonymize email address
 * Converts: rejaulkarim@gmail.com → re***@gmail.com
 *
 * Shows the first 2 characters of the local part followed by *** and the
 * full domain.  Two characters give enough context to recognise the account
 * while keeping PII exposure to the minimum required by GDPR.
 *
 * @param email - Full email address
 * @returns Anonymized email address
 */
export const anonymizeEmail = (email: string | null | undefined): string => {
  if (!email || typeof email !== 'string') {
    return 'N/A';
  }

  try {
    const atIndex = email.indexOf('@');

    if (atIndex === -1) {
      return 'Invalid email';
    }

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex); // includes the '@' sign

    // Show first 2 characters + *** for local part (GDPR-safe)
    const visibleChars = Math.min(2, local.length);
    const anonymizedLocal = `${local.slice(0, visibleChars)}***`;

    return `${anonymizedLocal}${domain}`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Anonymize phone number
 * Converts: +91 9876543210 → +91 ******3210
 *
 * @param phone - Full phone number
 * @returns Anonymized phone number
 */
export const anonymizePhone = (phone: string | null | undefined): string => {
  if (!phone || typeof phone !== 'string') {
    return 'N/A';
  }

  try {
    // Remove spaces and special characters for processing
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Keep country code and last 4 digits
    if (cleanPhone.length <= 4) {
      return '****';
    }

    const lastFour = cleanPhone.slice(-4);
    const prefix = cleanPhone.startsWith('+') ? cleanPhone.substring(0, 3) : '';

    if (prefix) {
      return `${prefix} ******${lastFour}`;
    }

    return `******${lastFour}`;
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Anonymize name
 * Converts: Mukul Kumar → M*** K***
 *
 * @param name - Full name
 * @returns Anonymized name
 */
export const anonymizeName = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') {
    return 'Anonymous User';
  }

  try {
    const nameParts = name.trim().split(' ');

    const anonymizedParts = nameParts.map(part => {
      if (part.length === 0) return '';
      return `${part[0]}***`;
    });

    return anonymizedParts.filter(Boolean).join(' ');
  } catch (error) {
    return 'Anonymous User';
  }
};

/**
 * Check if user data should be anonymized based on privacy settings
 *
 * @param userId - User ID to check
 * @param currentUserId - Current logged in user ID
 * @returns Whether to anonymize the data
 */
export const shouldAnonymize = (
  userId: string | undefined,
  currentUserId: string | undefined
): boolean => {
  // Don't anonymize if it's the current user's own data
  if (userId && currentUserId && userId === currentUserId) {
    return false;
  }

  // Anonymize all other users' data (GDPR compliance)
  return true;
};

/**
 * Get privacy-compliant display text
 *
 * @param value - Original value
 * @param type - Type of data (email, phone, name)
 * @returns Privacy-safe display text
 */
export const getPrivacySafeText = (
  value: string | null | undefined,
  type: 'email' | 'phone' | 'name'
): string => {
  switch (type) {
    case 'email':
      return anonymizeEmail(value);
    case 'phone':
      return anonymizePhone(value);
    case 'name':
      return anonymizeName(value);
    default:
      return 'N/A';
  }
};

/**
 * GDPR: Get user consent status for data display
 * This should be integrated with your consent management system
 *
 * @param userId - User ID
 * @returns Consent status
 */
export const hasDataSharingConsent = async (userId: string): Promise<boolean> => {
  // M-10 FIX: Read consent from SecureStore / consent management system
  // Default remains false (deny-by-default) when consent record is absent.
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default as {
      getItem: (key: string) => Promise<string | null>;
    };
    const raw = await AsyncStorage.getItem(`@rez_consent_${userId}`);
    if (!raw) return false;
    const consent = JSON.parse(raw) as { dataSharingConsent?: boolean };
    return consent.dataSharingConsent === true;
  } catch {
    return false; // fail-safe: deny consent on error
  }
};

/**
 * Log privacy compliance event
 * Track when PII is accessed for audit purposes
 *
 * @param action - Action performed
 * @param dataType - Type of data accessed
 * @param userId - User whose data was accessed
 */
export const logPrivacyEvent = (
  action: 'view' | 'copy' | 'share',
  dataType: 'email' | 'phone' | 'name' | 'referral_code',
  userId?: string
): void => {
  // M-11 FIX: Send privacy audit event to analytics/audit system in production
  if (__DEV__) {
    logger.info('[Privacy Audit]', {
      action,
      dataType,
      userId: userId || 'unknown',
      timestamp: new Date().toISOString(),
    });
  } else {
    try {
      const analytics = require('@/services/analytics/AnalyticsService').default as {
        trackEvent: (name: string, props: object) => void;
      };
      analytics.trackEvent('privacy_audit', {
        action,
        dataType,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    } catch { /* analytics unavailable */ }
  }
};
