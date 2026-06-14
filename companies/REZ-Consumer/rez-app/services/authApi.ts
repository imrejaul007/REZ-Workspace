// @ts-nocheck
/**
 * RABTUL AUTH SERVICE INTEGRATION
 *
 * ✅ MIGRATED: Now using RABTUL Auth Service (rez-auth-service)
 * See: https://github.com/imrejaul007/RABTUL-Technologies/tree/main/rez-auth-service
 *
 * Migration completed:
 * 1. ✅ All /user/auth/* endpoints replaced with RABTUL auth service endpoints
 * 2. ✅ X-Internal-Token header added for service-to-service calls
 * 3. ✅ Centralized OTP, JWT, MFA logic in RABTUL auth service
 * 4. ✅ Local user collection access removed
 *
 * RABTUL Service: rez-auth-service (Port 4002)
 * Base URL: http://localhost:4002
 *
 * Endpoint mapping (OLD → NEW):
 * - /user/auth/send-otp        → http://localhost:4002/api/auth/send-otp
 * - /user/auth/verify-otp      → http://localhost:4002/api/auth/verify-otp
 * - /user/auth/refresh-token  → http://localhost:4002/api/auth/refresh-token
 * - /user/auth/logout         → http://localhost:4002/api/auth/logout
 * - /user/auth/me             → http://localhost:4002/api/auth/me
 * - /user/auth/profile        → http://localhost:4002/api/auth/profile
 * - /user/auth/complete-onboarding → http://localhost:4002/api/auth/onboarding
 * - /user/auth/account        → http://localhost:4002/api/auth/account
 * - /user/auth/statistics     → http://localhost:4002/api/auth/statistics
 */

// RABTUL Auth Service Configuration
// SECURITY: Enforce HTTPS in production
const _authUrl = process.env.EXPO_PUBLIC_RABTUL_AUTH_URL || 'https://rez-auth-service.onrender.com';
const RABTUL_AUTH_SERVICE_URL = (__DEV__ && _authUrl.startsWith('http://'))
  ? _authUrl // Allow HTTP in dev for local testing
  : _authUrl.replace('http://', 'https://'); // Enforce HTTPS in production

const RABTUL_INTERNAL_TOKEN = process.env.EXPO_PUBLIC_INTERNAL_SERVICE_TOKEN || '';

// Log URL configuration for debugging
if (__DEV__) {
  logger.debug(`[authApi] RABTUL Auth URL: ${RABTUL_AUTH_SERVICE_URL}`);
}

/**
 * Create headers for RABTUL service calls
 */
function getRabulAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Request-Origin': 'rez-consumer-app',
  };
  if (RABTUL_INTERNAL_TOKEN) {
    headers['X-Internal-Token'] = RABTUL_INTERNAL_TOKEN;
  }
  return headers;
}

// Authentication API Service
// Handles user authentication, registration, and profile management
// Enhanced with comprehensive error handling, validation, token management, and logging

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse, API_TIMEOUTS } from './apiClient';
import { withRetry, createErrorResponse, logApiRequest, logApiResponse } from '@/utils/apiUtils';
import {
  User as UnifiedUser,
  validateUser,
  isUserVerified
} from '@/types/unified';

// Keep the old User interface for backwards compatibility during migration
export interface User {
  id: string;
  /** R03: Backend consistently returns `id` (serialized from `_id`). `_id` may still
   * appear on some legacy response paths — kept optional to avoid breaking existing callers. */
  _id?: string;
  phoneNumber: string;
  email?: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    /** ISO 8601 string — backend returns Date objects serialized as strings */
    dateOfBirth?: string;
    // R01 FIX: Added 'prefer_not_to_say' to match Mongoose schema and Joi validator
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    location?: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      coordinates?: [number, number];
    };
  };
  preferences: {
    language?: string;
    currency?: string;
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    };
    categories?: string[];
    theme?: 'light' | 'dark';
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  };
  role: 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer';
  isVerified: boolean;
  isOnboarded: boolean;
  /** Set to true when the user has configured a login PIN. */
  hasPIN?: boolean;
  wallet?: {
    balance: number;
    totalEarned?: number;
    totalSpent?: number;
    pendingAmount?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Export unified User type for new code
export { UnifiedUser };

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface OtpRequest {
  phoneNumber: string;
  email?: string;
  referralCode?: string;
  /** Auth flow: 'login' | 'signup'. Backend uses this to decide user creation behavior. */
  flow?: 'login' | 'signup';
}

export interface OtpVerification {
  phoneNumber: string;
  otp: string;
}

export interface ProfileUpdate {
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    website?: string;
    /** ISO 8601 string — backend returns Date objects serialized as strings */
    dateOfBirth?: string;
    // R01 FIX: Added 'prefer_not_to_say' to match Mongoose schema and Joi validator
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    location?: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      coordinates?: [number, number];
    };
  };
  preferences?: {
    language?: string;
    theme?: 'light' | 'dark';
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    };
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  };
}

/**
 * Validates phone number format
 * Supports international format: +XXXXXXXXXXX (E.164)
 * Including UAE (+971), India (+91), etc.
 */
function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove spaces and dashes
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Canonical E.164 format — requires + prefix, 7–15 digits (matches backend validator)
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates OTP format (6 digits, including leading zeros)
 * Fixed CA-AUT-031: Accept leading zeros like "000000"
 */
function isValidOtp(otp: string): boolean {
  if (!otp || typeof otp !== 'string') {
    return false;
  }

  // Accept exactly 6 digit characters (including leading zeros)
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

// validateUser is imported from @/types/unified (line 10)

/** Minimal shape we expect the backend auth response to carry */
interface RawAuthResponsePayload {
  user?: { id?: string; _id?: string; [key: string]: unknown };
  tokens?: { accessToken?: string; refreshToken?: string; [key: string]: unknown };
  [key: string]: unknown;
}

/**
 * Validates auth response structure
 * Fixed CA-AUT-005: Validate expiresIn is present and valid
 */
function validateAuthResponse(response: RawAuthResponsePayload): boolean {
  if (!response || typeof response !== 'object') {
    logger.warn('[AUTH API] Invalid auth response: not an object');
    return false;
  }

  if (!response.user || (!response.user.id && !response.user._id)) {
    logger.warn('[AUTH API] Auth response missing valid user');
    return false;
  }

  if (!response.tokens || typeof response.tokens !== 'object') {
    logger.warn('[AUTH API] Auth response missing tokens');
    return false;
  }

  if (!response.tokens.accessToken || !response.tokens.refreshToken) {
    logger.warn('[AUTH API] Auth response missing required tokens');
    return false;
  }

  // CA-AUT-005: Validate expiresIn is present and valid
  if (typeof response.tokens.expiresIn !== 'number' || response.tokens.expiresIn <= 0) {
    logger.warn('[AUTH API] Invalid or missing token expiresIn', response.tokens.expiresIn);
    return false;
  }

  // Fixed CA-AUT-005: Validate token expiration time
  if (typeof response.tokens.expiresIn !== 'number' || response.tokens.expiresIn <= 0) {
    logger.warn('[AUTH API] Auth response missing or invalid expiresIn');
    // Provide sensible default if missing
    response.tokens.expiresIn = 3600; // 1 hour default
  }

  return true;
}

class AuthService {
  private csrfTokenCache: { token: string; timestamp: number } | null = null;

  /**
   * CA-AUT-009 FIX: Get CSRF token for auth endpoints
   * Generates a nonce for CSRF protection on web platforms
   */
  private async getCsrfToken(): Promise<string | null> {
    try {
      // Only generate CSRF tokens on web (not needed on native)
      if (typeof window === 'undefined') return null;

      // Cache token for 5 minutes to avoid regenerating on every request
      if (this.csrfTokenCache && Date.now() - this.csrfTokenCache.timestamp < 5 * 60 * 1000) {
        return this.csrfTokenCache.token;
      }

      // Generate a random nonce
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      this.csrfTokenCache = { token: nonce, timestamp: Date.now() };
      return nonce;
    } catch (error) {
      // Silently fail if CSRF token generation fails — auth will still work
      // (backend validates based on cookies/auth tokens)
      return null;
    }
  }

  /**
   * Send OTP for registration or login
   */
  async sendOtp(data: OtpRequest): Promise<ApiResponse<{ message: string }>> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!data.phoneNumber) {
        return {
          success: false,
          error: 'Phone number is required',
          message: 'Please enter your phone number',
        };
      }

      if (!isValidPhoneNumber(data.phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format',
          message: 'Please enter a valid 10-digit phone number',
        };
      }

      // Validate email if provided
      if (data.email && !isValidEmail(data.email)) {
        return {
          success: false,
          error: 'Invalid email format',
          message: 'Please enter a valid email address',
        };
      }

      // Log request (sanitize phone number)
      // OLD: /user/auth/send-otp → NEW: /api/auth/send-otp (RABTUL Auth Service)
      logApiRequest('POST', '/api/auth/send-otp', {
        phoneNumber: data.phoneNumber.slice(-4).padStart(10, '*'),
        email: data.email
      });

      // CA-AUT-009 FIX: Generate CSRF token for web auth protection
      const csrfToken = await this.getCsrfToken();
      const headers: Record<string, string> = { ...getRabulAuthHeaders() };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await withRetry(
        () => apiClient.post<{ message: string; expiresIn: number }>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/send-otp`,
          data,
          { timeout: API_TIMEOUTS.AUTH, headers }
        ),
        { maxRetries: 0 } // HIGH-5: Do NOT retry OTP send — retrying triggers duplicate SMS charges
      );

      logApiResponse('POST', '/api/auth/send-otp', { success: response.success }, Date.now() - startTime);

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error sending OTP:', error);
      return createErrorResponse(error, 'Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify OTP and authenticate/register user
   */
  async verifyOtp(data: OtpVerification): Promise<ApiResponse<AuthResponse>> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!data.phoneNumber) {
        return {
          success: false,
          error: 'Phone number is required',
          message: 'Please enter your phone number',
        };
      }

      if (!isValidPhoneNumber(data.phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format',
          message: 'Please enter a valid phone number',
        };
      }

      if (!data.otp) {
        return {
          success: false,
          error: 'OTP is required',
          message: 'Please enter the OTP sent to your phone',
        };
      }

      if (!isValidOtp(data.otp)) {
        return {
          success: false,
          error: 'Invalid OTP format',
          message: 'Please enter a valid 6-digit OTP',
        };
      }

      // Log request (sanitize sensitive data)
      // OLD: /user/auth/verify-otp → NEW: /api/auth/verify-otp (RABTUL Auth Service)
      logApiRequest('POST', '/api/auth/verify-otp', {
        phoneNumber: data.phoneNumber.slice(-4).padStart(10, '*'),
        otp: '******'
      });

      // CA-AUT-009 FIX: Generate CSRF token for web auth protection
      const csrfToken = await this.getCsrfToken();
      const headers: Record<string, string> = { ...getRabulAuthHeaders() };
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await withRetry(
        () => apiClient.post<AuthResponse>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/verify-otp`,
          data,
          { timeout: API_TIMEOUTS.AUTH, headers }
        ),
        { maxRetries: 0 } // HIGH-4: Do NOT retry OTP verification — a wrong OTP should fail immediately without consuming extra attempts
      );

      logApiResponse('POST', '/api/auth/verify-otp', { success: response.success }, Date.now() - startTime);

      // Dark-launch: validate response against schema (log drift, don't throw)
      // Schema validation disabled - functions not available
      // if (response.success && response.data && isFeatureEnabled('SCHEMA_VALIDATION_ENABLED')) {

      // Validate response
      if (response.success && response.data) {
        if (!validateAuthResponse(response.data as unknown as RawAuthResponsePayload)) {
          logger.error('[AUTH API] Invalid auth response structure');
          return {
            success: false,
            error: 'Invalid authentication response',
            message: 'Authentication failed. Please try again.',
          };
        }

        // Store tokens securely
        if (response.data.tokens?.accessToken) {
          this.setAuthToken(response.data.tokens.accessToken);
        }
      }

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error verifying OTP:', error);
      return createErrorResponse(error, 'Failed to verify OTP. Please check the code and try again.');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!refreshToken) {
        return {
          success: false,
          error: 'Refresh token is required',
          message: 'Authentication token missing',
        };
      }

      // OLD: /user/auth/refresh-token → NEW: /api/auth/refresh-token (RABTUL Auth Service)
      logApiRequest('POST', '/api/auth/refresh-token', { token: '***' });

      const response = await withRetry(
        () => apiClient.post<{ tokens: { accessToken: string; refreshToken: string; expiresIn: number } }>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/refresh-token`,
          { refreshToken },
          { headers: getRabulAuthHeaders() }
        ),
        { maxRetries: 1 } // Don't retry token refresh
      );

      logApiResponse('POST', '/api/auth/refresh-token', { success: response.success }, Date.now() - startTime);

      // Validate response
      if (response.success && response.data?.tokens) {
        const tokens = response.data.tokens;

        if (!tokens.accessToken || !tokens.refreshToken) {
          logger.error('[AUTH API] Invalid token refresh response');
          return {
            success: false,
            error: 'Invalid token response',
            message: 'Failed to refresh authentication',
          };
        }

        // Update stored token
        this.setAuthToken(tokens.accessToken);
      }

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error refreshing token:', error);
      return createErrorResponse(error, 'Session expired. Please log in again.');
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    const startTime = Date.now();

    try {
      // OLD: /user/auth/logout → NEW: /api/auth/logout (RABTUL Auth Service)
      logApiRequest('POST', '/api/auth/logout');

      // Fixed CA-AUT-014: Add Idempotency-Key for logout to handle retries safely
      // SECURITY FIX: Use crypto.getRandomValues() instead of Math.random() for secure random generation
      const randomBytes = new Uint8Array(9);
      crypto.getRandomValues(randomBytes);
      const idempotencyKey = `logout-${Date.now()}-${Array.from(randomBytes).map(b => b.toString(36).padStart(2, '0')).join('')}`;

      const response = await withRetry(
        () => apiClient.post<{ message: string }>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/logout`,
          {},
          { headers: { ...getRabulAuthHeaders(), 'Idempotency-Key': idempotencyKey } }
        ),
        { maxRetries: 0 } // MED-9: Do NOT retry logout — retrying a logout after a network error may succeed and double-invalidate, or worse confuse state
      );

      logApiResponse('POST', '/api/auth/logout', response, Date.now() - startTime);

      // Clear stored token regardless of API response
      this.setAuthToken(null);

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error during logout:', error);

      // Clear token even if logout API fails
      this.setAuthToken(null);

      return createErrorResponse(error, 'Logged out successfully');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const startTime = Date.now();

    try {
      // OLD: /user/auth/me → NEW: /api/auth/me (RABTUL Auth Service)
      logApiRequest('GET', '/api/auth/me');

      const response = await withRetry(
        () => apiClient.get<User>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/me`,
          undefined,
          { headers: getRabulAuthHeaders() }
        ),
        { maxRetries: 2 }
      );

      logApiResponse('GET', '/api/auth/me', response, Date.now() - startTime);

      // Dark-launch: validate response against schema (disabled - functions not available)
      // if (response.success && response.data && isFeatureEnabled('SCHEMA_VALIDATION_ENABLED')) {

      // Validate response
      if (response.success && response.data) {
        if (!response.data.id && !response.data._id) {
          logger.error('[AUTH API] Invalid user data in profile response');
          return {
            success: false,
            error: 'Invalid profile data',
            message: 'Failed to load profile',
          };
        }
      }

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error fetching profile:', error);

      // Handle 401 Unauthorized - token expired
      if ((error as { status?: number })?.status === 401) {
        this.setAuthToken(null);
        return createErrorResponse(error, 'Session expired. Please log in again.');
      }

      return createErrorResponse(error, 'Failed to load profile. Please try again.');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdate): Promise<ApiResponse<User>> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!data || (Object.keys(data).length === 0)) {
        return {
          success: false,
          error: 'No profile data provided',
          message: 'Please provide profile information to update',
        };
      }

      // Validate email if provided
      const profileEmail = (data.profile as { email?: string } | undefined)?.email;
      if (profileEmail && !isValidEmail(profileEmail)) {
        return {
          success: false,
          error: 'Invalid email format',
          message: 'Please enter a valid email address',
        };
      }

      // OLD: /user/auth/profile → NEW: /api/auth/profile (RABTUL Auth Service)
      logApiRequest('PATCH', '/api/auth/profile', { fields: Object.keys(data) });

      const response = await withRetry(
        () => apiClient.patch<User>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/profile`,
          data,
          { headers: getRabulAuthHeaders() }
        ),
        { maxRetries: 2 }
      );

      logApiResponse('PATCH', '/api/auth/profile', response, Date.now() - startTime);

      // Dark-launch: validate response against schema (disabled - functions not available)
      // if (response.success && response.data && isFeatureEnabled('SCHEMA_VALIDATION_ENABLED')) {

      // Validate response
      if (response.success && response.data) {
        if (!response.data.id && !response.data._id) {
          logger.error('[AUTH API] Invalid user data in update response');
          return {
            success: false,
            error: 'Invalid profile data',
            message: 'Failed to update profile',
          };
        }
      }

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error updating profile:', error);
      return createErrorResponse(error, 'Failed to update profile. Please try again.');
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(data: ProfileUpdate): Promise<ApiResponse<User>> {
    const startTime = Date.now();

    try {
      // Validate input
      if (!data || Object.keys(data).length === 0) {
        return {
          success: false,
          error: 'Profile data is required',
          message: 'Please complete your profile information',
        };
      }

      // OLD: /user/auth/complete-onboarding → NEW: /api/auth/onboarding (RABTUL Auth Service)
      logApiRequest('POST', '/api/auth/onboarding', { fields: Object.keys(data) });

      const response = await withRetry(
        () => apiClient.post<User>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/onboarding`,
          data,
          { headers: getRabulAuthHeaders() }
        ),
        { maxRetries: 2 }
      );

      logApiResponse('POST', '/api/auth/onboarding', response, Date.now() - startTime);

      // Validate response
      if (response.success && response.data) {
        if (!response.data.id && !response.data._id) {
          logger.error('[AUTH API] Invalid user data in onboarding response');
          return {
            success: false,
            error: 'Invalid profile data',
            message: 'Failed to complete onboarding',
          };
        }
      }

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error completing onboarding:', error);
      return createErrorResponse(error, 'Failed to complete onboarding. Please try again.');
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<{ message: string }>> {
    const startTime = Date.now();

    try {
      // OLD: /user/auth/account → NEW: /api/auth/account (RABTUL Auth Service)
      logApiRequest('DELETE', '/api/auth/account');

      const response = await withRetry(
        () => apiClient.delete<{ message: string }>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/account`,
          undefined,
          { headers: getRabulAuthHeaders() }
        ),
        { maxRetries: 1 }
      );

      logApiResponse('DELETE', '/api/auth/account', response, Date.now() - startTime);

      // Clear token after account deletion
      if (response.success) {
        this.setAuthToken(null);
      }

      return response;
    } catch (error: unknown) {
      logger.error('[AUTH API] Error deleting account:', error);
      return createErrorResponse(error, 'Failed to delete account. Please try again or contact support.');
    }
  }

  /**
   * Get user statistics (aggregated data from all modules)
   */
  async getUserStatistics(): Promise<ApiResponse<{
    user: {
      joinedDate: string;
      isVerified: boolean;
      totalReferrals: number;
      referralEarnings: number;
    };
    wallet: {
      balance: number;
      totalEarned: number;
      totalSpent: number;
      pendingAmount: number;
    };
    orders: {
      total: number;
      completed: number;
      cancelled: number;
      totalSpent: number;
    };
    videos: {
      totalCreated: number;
      totalViews: number;
      totalLikes: number;
      totalShares: number;
    };
    projects: {
      totalParticipated: number;
      approved: number;
      rejected: number;
      totalEarned: number;
    };
    offers: {
      totalRedeemed: number;
    };
    vouchers: {
      total: number;
      used: number;
      active: number;
    };
    summary: {
      totalActivity: number;
      totalEarnings: number;
      totalSpendings: number;
    };
  }>> {
    const startTime = Date.now();

    try {
      // OLD: /user/auth/statistics → NEW: /api/auth/statistics (RABTUL Auth Service)
      logApiRequest('GET', '/api/auth/statistics');

      const response = await withRetry(
        () => apiClient.get<{
    user: { joinedDate: string; isVerified: boolean; totalReferrals: number; referralEarnings: number };
    wallet: { balance: number; totalEarned: number; totalSpent: number; pendingAmount: number };
    orders: { total: number; completed: number; cancelled: number; totalSpent: number };
    videos: { totalCreated: number; totalViews: number; totalLikes: number; totalShares: number };
    projects: { totalParticipated: number; approved: number; rejected: number; totalEarned: number };
    offers: { totalRedeemed: number };
    vouchers: { total: number; used: number; active: number };
    summary: { totalActivity: number; totalEarnings: number; totalSpendings: number };
  }>(
          // MIGRATED: Using RABTUL Auth Service URL
          `${RABTUL_AUTH_SERVICE_URL}/api/auth/statistics`,
          undefined,
          { headers: getRabulAuthHeaders() }
        ),
        { maxRetries: 2 }
      );

      logApiResponse('GET', '/api/auth/statistics', response, Date.now() - startTime);

      return response;
    } catch (error) {
      logger.error('[AUTH API] Error fetching user statistics:', error);
      return createErrorResponse(error, 'Failed to load statistics. Please try again.');
    }
  }

  /**
   * Set authentication token in API client
   */
  setAuthToken(token: string | null): void {
    try {
      apiClient.setAuthToken(token);

    } catch (error) {
      logger.error('[AUTH API] Error setting auth token:', error);
    }
  }

  /**
   * Get current authentication token from API client
   */
  getAuthToken(): string | null {
    try {
      return apiClient.getAuthToken();
    } catch (error) {
      logger.error('[AUTH API] Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    // LOW-10: Exclude the 'cookie-session' sentinel — it is not a real Bearer token
    // and must not be treated as proof of authentication.
    return token !== null && token.length > 0 && token !== 'cookie-session';
  }

  /**
   * Validate and refresh token if needed
   * Call this before making authenticated requests
   *
   * DEPRECATED: Token refresh is handled automatically by AuthContext.tryRefreshToken()
   * via the apiClient 401 interceptor. This method no longer performs validation -
   * it simply returns true as token validity is managed by the interceptor.
   *
   * @deprecated Use AuthContext.tryRefreshToken() (via apiClient 401 callback) instead.
   */
  async ensureValidToken(): Promise<boolean> {
    if (__DEV__) {
      logger.warn(
        '[AuthService] ensureValidToken() is deprecated. Token refresh is automatic via apiClient. Remove this call.',
      );
      logger.error(
        '[AuthService] ensureValidToken() has no callers — this call should be removed. ' +
        'Token refresh is handled automatically by the apiClient 401 interceptor via AuthContext.tryRefreshToken().',
      );
    }
    return true; // return safe default — token validity is managed by the interceptor
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
