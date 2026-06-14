/**
 * Auth API Service Tests
 *
 * Tests the AuthService class methods including input validation (phone, OTP
 * format) and correct behaviour when the API client responds with success or
 * error payloads.  External network calls are fully mocked via jest.mock so
 * these tests run entirely in process.
 */

import authService from '@/services/authApi';

// Mock the API client so no network calls are made
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    setAuthToken: jest.fn(),
    getAuthToken: jest.fn(() => null),
    getBaseURL: jest.fn(() => 'https://api.test.com'),
  },
  API_TIMEOUTS: { AUTH: 10000 },
}));

// Suppress dev-only logging noise in test output
jest.mock('@/utils/apiUtils', () => ({
  withRetry: jest.fn((fn) => fn()),
  createErrorResponse: jest.fn((err, msg) => ({ success: false, error: msg, message: msg })),
  logApiRequest: jest.fn(),
  logApiResponse: jest.fn(),
}));

jest.mock('@/types/unified', () => ({
  validateUser: jest.fn(() => true),
  isUserVerified: jest.fn(() => true),
}));

const mockApiClient = require('@/services/apiClient').default;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validPhone = '+919876543210';
const validOtp = '123456';

const makeAuthResponse = () => ({
  success: true,
  data: {
    user: { id: 'u1', phoneNumber: validPhone, profile: {}, preferences: {}, role: 'user', isVerified: true, isOnboarded: false, createdAt: '', updatedAt: '' },
    tokens: { accessToken: 'access-abc', refreshToken: 'refresh-xyz', expiresIn: 3600 },
  },
});

// ---------------------------------------------------------------------------

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // sendOtp
  // =========================================================================

  describe('sendOtp', () => {
    it('returns error when phone number is missing', async () => {
      const result = await authService.sendOtp({ phoneNumber: '' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/phone number is required/i);
    });

    it('returns error for an invalid phone number format', async () => {
      const result = await authService.sendOtp({ phoneNumber: '12345' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid phone number/i);
    });

    it('returns error when email is provided but malformed', async () => {
      const result = await authService.sendOtp({
        phoneNumber: validPhone,
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid email/i);
    });

    it('calls the API and returns success for a valid phone number', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: { message: 'OTP sent', expiresIn: 300 },
      });

      const result = await authService.sendOtp({ phoneNumber: validPhone });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/user/auth/send-otp',
        expect.objectContaining({ phoneNumber: validPhone }),
        expect.any(Object)
      );
      expect(result.success).toBe(true);
    });

    it('returns error response when the API call throws', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network down'));

      const result = await authService.sendOtp({ phoneNumber: validPhone });

      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // verifyOtp
  // =========================================================================

  describe('verifyOtp', () => {
    it('returns error when phone number is missing', async () => {
      const result = await authService.verifyOtp({ phoneNumber: '', otp: validOtp });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/phone number is required/i);
    });

    it('returns error for invalid phone number', async () => {
      const result = await authService.verifyOtp({ phoneNumber: 'abc', otp: validOtp });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid phone number/i);
    });

    it('returns error when OTP is missing', async () => {
      const result = await authService.verifyOtp({ phoneNumber: validPhone, otp: '' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/otp is required/i);
    });

    it('returns error for a non-6-digit OTP', async () => {
      const result = await authService.verifyOtp({ phoneNumber: validPhone, otp: '12345' });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid otp/i);
    });

    it('returns auth response with tokens on success', async () => {
      const mockResp = makeAuthResponse();
      mockApiClient.post.mockResolvedValueOnce(mockResp);

      const result = await authService.verifyOtp({ phoneNumber: validPhone, otp: validOtp });

      expect(result.success).toBe(true);
      expect(result.data?.tokens.accessToken).toBe('access-abc');
      expect(result.data?.user.id).toBe('u1');
    });

    it('stores the access token after a successful verification', async () => {
      const mockResp = makeAuthResponse();
      mockApiClient.post.mockResolvedValueOnce(mockResp);

      await authService.verifyOtp({ phoneNumber: validPhone, otp: validOtp });

      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('access-abc');
    });

    it('returns error when auth response is missing tokens', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: {
          user: { id: 'u1' },
          // tokens intentionally omitted
        },
      });

      const result = await authService.verifyOtp({ phoneNumber: validPhone, otp: validOtp });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid authentication response/i);
    });
  });

  // =========================================================================
  // isAuthenticated
  // =========================================================================

  describe('isAuthenticated', () => {
    it('returns false when no token is stored', () => {
      mockApiClient.getAuthToken.mockReturnValueOnce(null);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns false for the cookie-session sentinel value', () => {
      mockApiClient.getAuthToken.mockReturnValueOnce('cookie-session');

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true when a real token is stored', () => {
      mockApiClient.getAuthToken.mockReturnValueOnce('eyJhbGciOiJIUzI1NiJ9.test');

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  // =========================================================================
  // logout
  // =========================================================================

  describe('logout', () => {
    it('clears the auth token even when the API call fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Server error'));

      await authService.logout();

      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    });

    it('calls the logout endpoint and clears the token on success', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        data: { message: 'Logged out' },
      });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(null);
    });
  });

  // =========================================================================
  // ensureValidToken (deprecated)
  // =========================================================================

  describe('ensureValidToken', () => {
    it('returns true and logs a DEV warning (deprecated stub, no callers)', async () => {
      // ensureValidToken() was softened from a throw to a safe return + DEV warning
      // (L-3 FIX). It has no live callers — only this test references it.
      const result = await authService.ensureValidToken();
      expect(result).toBe(true);
    });
  });
});
