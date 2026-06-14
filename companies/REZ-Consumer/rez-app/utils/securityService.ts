/**
 * Security Service
 *
 * Comprehensive security utilities for:
 * - Input validation and sanitization
 * - XSS protection
 * - Authentication guards
 * - Secure storage
 * - Rate limiting
 * - API security
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '@/utils/logger';

/**
 * Input Sanitization
 */
export class InputSanitizer {
  /**
   * Sanitize HTML to prevent XSS
   */
  static sanitizeHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize SQL to prevent injection
   */
  static sanitizeSQL(input: string): string {
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmed = email.trim().toLowerCase();

    if (!emailRegex.test(trimmed)) {
      return null;
    }

    return trimmed;
  }

  /**
   * Validate and sanitize phone number
   */
  static sanitizePhone(phone: string): string | null {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null;
    }

    return cleaned;
  }

  /**
   * Sanitize URL to prevent javascript: and data: protocols
   */
  static sanitizeURL(url: string): string | null {
    const urlRegex = /^https?:\/\//i;

    if (!urlRegex.test(url)) {
      return null;
    }

    // Block dangerous protocols
    const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lower = url.toLowerCase();

    for (const protocol of dangerous) {
      if (lower.includes(protocol)) {
        return null;
      }
    }

    return url;
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.\.+/g, '.')
      .substring(0, 255);
  }

  /**
   * Remove dangerous characters from string
   */
  static sanitizeString(input: string, allowedChars: RegExp = /[^a-zA-Z0-9\s]/g): string {
    return input.replace(allowedChars, '');
  }
}

/**
 * Input Validation
 */
export class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   */
  static isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain a special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    return urlRegex.test(url);
  }

  /**
   * Validate credit card number (Luhn algorithm)
   */
  static isValidCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
}

/**
 * Secure Storage
 */
/**
 * SecureStorage — CD-CRIT-03 fix.
 *
 * Uses expo-secure-store for hardware-backed keystore encryption on iOS (Keychain)
 * and Android (Keystore). Falls back to AsyncStorage for the web platform where
 * SecureStore is not available (tokens on web are handled by httpOnly cookies
 * in the auth layer — see authStorage.ts for the full web token strategy).
 *
 * IMPORTANT: This class stores NON-AUTH tokens (e.g. API secrets, cached keys).
 * Auth tokens MUST go through authStorage.ts which uses SecureStore on native
 * and httpOnly cookies on web.
 */
export class SecureStorage {
  private static readonly STORE_KEY = (k: string) => `secure_${k}`;

  /**
   * Store sensitive data securely. On native, uses hardware-backed keystore.
   * On web, delegates to AsyncStorage — auth layer handles httpOnly cookies for tokens.
   */
  static async setSecure(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // SecureStore unavailable on web — fall back to AsyncStorage.
        // Non-auth data (no tokens here) is acceptable in AsyncStorage on web.
        await AsyncStorage.setItem(this.STORE_KEY(key), value);
        return;
      }
      await SecureStore.setItemAsync(this.STORE_KEY(key), value, {
        keychainService: 'rez.app.secure',
      });
    } catch (error) {
      logger.error('[SecureStorage] setSecure failed', error as Error, `key=${key}`);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve sensitive data.
   */
  static async getSecure(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(this.STORE_KEY(key));
      }
      return await SecureStore.getItemAsync(this.STORE_KEY(key), {
        keychainService: 'rez.app.secure',
      });
    } catch (error) {
      logger.error('[SecureStorage] getSecure failed', error as Error, `key=${key}`);
      return null;
    }
  }

  /**
   * Remove sensitive data from secure storage.
   */
  static async removeSecure(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(this.STORE_KEY(key));
        return;
      }
      await SecureStore.deleteItemAsync(this.STORE_KEY(key), {
        keychainService: 'rez.app.secure',
      });
    } catch (error) {
      logger.error('[SecureStorage] removeSecure failed', error as Error, `key=${key}`);
    }
  }

  /**
   * Clear all secure data
   */
  static async clearAllSecure(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => key.startsWith('secure_'));
      await AsyncStorage.multiRemove(secureKeys);
    } catch (_error) {
      // silently handle
    }
  }
}

/**
 * Authentication Guard
 */
export class AuthGuard {
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStorage.getSecure('auth_token');
      return token !== null && !this.isTokenExpired(token);
    } catch {
      return false;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      // Decode JWT token (simple implementation)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      if (!payload.exp) {
        // Conservative: tokens with no exp claim are invalid. Treating them as
        // "never expiring" would let forged tokens (or tokens issued by a
        // misconfigured signer) grant access indefinitely.
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return true;
    }
  }

  /**
   * Require authentication
   */
  static async requireAuth(): Promise<boolean> {
    const isAuth = await this.isAuthenticated();

    if (!isAuth) {
      // Redirect to login
      return false;
    }

    return true;
  }

  /**
   * Get user permissions.
   *
   * SECURITY NOTE: The `permissions` array is decoded from the JWT payload on
   * the client and MUST NOT be used as a real access gate. A forged or
   * self-issued token could claim unknown permissions it wants. This accessor is
   * advisory only — for UX hints such as hiding menu items we will never need
   * to enforce. Real authorisation decisions must come from the server's
   * response to `/me` (or an equivalent authoritative endpoint) after the
   * token is validated server-side.
   */
  static async getUserPermissions(): Promise<string[]> {
    try {
      const token = await SecureStorage.getSecure('auth_token');

      if (!token) {
        return [];
      }

      const parts = token.split('.');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      return payload.permissions || [];
    } catch {
      return [];
    }
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions();
    return permissions.includes(permission);
  }
}

/**
 * Rate Limiter (Client-side)
 */
export class ClientRateLimiter {
  private static requests: Map<string, number[]> = new Map();

  /**
   * Check if rate limit exceeded
   */
  static isLimitExceeded(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Filter requests within window
    const recentRequests = requests.filter(
      timestamp => now - timestamp < windowMs
    );

    // Update stored requests
    this.requests.set(key, recentRequests);

    return recentRequests.length >= maxRequests;
  }

  /**
   * Record a request
   */
  static recordRequest(key: string): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
  }

  /**
   * Clear rate limit for key
   */
  static clearLimit(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  static clearAll(): void {
    this.requests.clear();
  }
}

/**
 * API Security Headers
 */
export class APISecurityHeaders {
  /**
   * Get secure headers for API requests
   */
  static async getSecureHeaders(): Promise<Record<string, string>> {
    const token = await SecureStorage.getSecure('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.0',
      'X-Platform': 'mobile',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Generate request signature (HMAC)
   */
  static async generateSignature(
    method: string,
    url: string,
    body: unknown
  ): Promise<string> {
    const secret = await SecureStorage.getSecure('api_secret');

    if (!secret) {
      return '';
    }

    const message = `${method}${url}${JSON.stringify(body)}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const signature = Buffer.from(new Uint8Array(sigBytes)).toString('hex');

    return signature;
  }
}

/**
 * Content Security Policy
 */
export class ContentSecurityPolicy {
  /**
   * Validate content before rendering
   */
  static validateContent(content: string): boolean {
    // Check for script tags
    if (/<script[^>]*>.*?<\/script>/gi.test(content)) {
      return false;
    }

    // Check for event handlers
    if (/on\w+\s*=\s*["'][^"']*["']/gi.test(content)) {
      return false;
    }

    // Check for iframes
    if (/<iframe[^>]*>.*?<\/iframe>/gi.test(content)) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize content for safe rendering
   */
  static sanitizeContent(content: string): string {
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  }
}

/**
 * Security Logger
 */
export class SecurityLogger {
  private static logs: Array<{
    type: string;
    message: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

  /**
   * Log security event
   */
  static log(
    type: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): void {
    const event = {
      type,
      message,
      timestamp: new Date(),
      severity,
    };

    this.logs.push(event);

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Log to console in dev
    if (__DEV__) {
      logger.info(`[Security ${severity.toUpperCase()}] ${type}: ${message}`, undefined, 'Security');
    }

    // H-11 / H-12 FIX: Wire high/critical security events to Sentry for real-time
    // monitoring and alerting. Uses dynamic import so Sentry remains optional —
    // if the package is absent the event is silently skipped without crashing.
    if (severity === 'high' || severity === 'critical') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
        Sentry.withScope((scope) => {
          scope.setTag('security_event_type', type);
          scope.setTag('security_severity', severity);
          scope.setLevel(severity === 'critical' ? 'fatal' : 'error');
          Sentry.captureMessage(`[Security] ${type}: ${message}`, severity === 'critical' ? 'fatal' : 'error');
        });
      } catch {
        // Sentry not available — already logged to console above
      }
    }
  }

  /**
   * Get security logs
   */
  static getLogs(): typeof SecurityLogger.logs {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Export all security utilities
 */
export default {
  InputSanitizer,
  InputValidator,
  SecureStorage,
  AuthGuard,
  ClientRateLimiter,
  APISecurityHeaders,
  ContentSecurityPolicy,
  SecurityLogger,
};
