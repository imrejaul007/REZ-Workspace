import logger from './utils/logger';

// Debugging utilities for authentication issues
import { storageService } from '@/services/storage';
import { apiClient } from '@/services/api/index';
import { getApiUrl } from '@/config/api';

export const debugAuth = {
  // Decode JWT token (basic decoder, no verification)
  decodeJWT(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { error: 'Invalid JWT format' };
      }

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return {
        payload,
        isExpired: payload.exp ? Date.now() / 1000 > payload.exp : false,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      };
    } catch (error) {
      return { error: 'Failed to decode JWT', details: error };
    }
  },

  // Clear all authentication data
  async clearAllAuth() {
    if (__DEV__) logger.info('[DEBUG] Clearing all authentication data...');
    await storageService.forceClearAll();
    apiClient.resetTokenStatus();
    if (__DEV__) logger.info('[DEBUG] All auth data cleared');
  },

  // Check current auth status
  async checkAuthStatus() {
    if (__DEV__) logger.info('[DEBUG] Checking current auth status...');

    const token = await storageService.getAuthToken();
    const user = await storageService.getUserData();
    const merchant = await storageService.getMerchantData();

    // MA-SEC-008: Token content is never logged. Only disclose existence booleans.
    return { token: !!token, user: !!user, merchant: !!merchant };
  },

  // Test token validation with backend
  async testTokenValidation() {
    if (__DEV__) logger.info('[DEBUG] Testing token validation...');
    const token = await storageService.getAuthToken();

    if (!token) {
      if (__DEV__) logger.info('[DEBUG] No token to test');
      return;
    }

    try {
      // Make a simple authenticated request to test token (token content not logged)
      const response = await fetch(getApiUrl('merchant/dashboard/metrics'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (__DEV__) {
        console.log('[DEBUG] Token test response status:', response.status);
      }

      const responseData = await response.json();

      if (response.status === 401) {
        if (__DEV__) logger.info('[DEBUG] Token is invalid according to backend');
      } else {
        if (__DEV__) logger.info('[DEBUG] Token is valid according to backend');
      }

      return { status: response.status, data: responseData };
    } catch (error) {
      if (__DEV__) console.error('[DEBUG] Token test failed:', error);
      return { error };
    }
  },

  // Test full login flow
  async testLoginFlow(email: string, password: string) {
    if (__DEV__) logger.info('[DEBUG] Testing full login flow...');

    try {
      // Step 1: Clear all existing auth data
      await this.clearAllAuth();

      // Step 2: Make login request
      const loginResponse = await fetch(getApiUrl('merchant/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (__DEV__) console.log('[DEBUG] Login response status:', loginResponse.status);
      const loginData = await loginResponse.json();

      if (loginResponse.status === 200 && loginData.success) {
        const token = loginData.data.token;

        // Step 3: Test the token immediately
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay

        const testResult = await fetch(getApiUrl('merchant/dashboard/metrics'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        return {
          loginSuccess: true,
          tokenValid: testResult.status === 200,
          token,
          loginData,
        };
      } else {
        return {
          loginSuccess: false,
          loginData,
        };
      }
    } catch (error) {
      if (__DEV__) console.error('[DEBUG] Login flow test failed:', error);
      return { error };
    }
  },

  // Log current storage contents (for debugging)
  async logStorageContents() {
    if (!__DEV__) return; // Only available in development
    if (__DEV__) logger.info('[DEBUG] Current storage contents...');

    try {
      const token = await storageService.getAuthToken();
      const user = await storageService.getUserData();
      const merchant = await storageService.getMerchantData();

      // MA-SEC-008: Never log token content. Only disclose existence.
      if (__DEV__) {
        console.log('[DEBUG] Auth Token present:', !!token);
        console.log('[DEBUG] User Data present:', !!user);
        console.log('[DEBUG] Merchant Data present:', !!merchant);
      }
    } catch (error) {
      if (__DEV__) console.error('[DEBUG] Error reading storage:', error);
    }
  },
};

// CRITICAL-SEC: global.debugAuth removed.
// Previously attached debugAuth to global scope (line 187), exposing token operations
// to any JS code running in the same JS context — including malicious third-party SDKs,
// code injection via deep links, or compromised npm packages.
// This was a CRITICAL security issue (MA-SEC-005).
// Debug utilities remain exported as a module for authorized internal use only.
