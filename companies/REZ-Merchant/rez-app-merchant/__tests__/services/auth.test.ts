/**
 * Merchant Auth Service — Smoke Tests
 *
 * Validates: login flow, register flow, token storage, error handling.
 */

jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../services/storage', () => ({
  storageService: {
    setAuthToken: jest.fn().mockResolvedValue(undefined),
    setRefreshToken: jest.fn().mockResolvedValue(undefined),
    setUserData: jest.fn().mockResolvedValue(undefined),
    setMerchantData: jest.fn().mockResolvedValue(undefined),
    getAuthToken: jest.fn().mockResolvedValue('mock-token'),
    logout: jest.fn().mockResolvedValue(undefined),
  },
  COOKIE_AUTH_ENABLED: false,
}));

import { apiClient } from '../../services/api/client';
import { storageService } from '../../services/storage';

// Import auth service after mocks are set up
let authService: any;
beforeAll(async () => {
  const mod = require('../../services/api/auth');
  authService = mod.default;
});

const mockPost = apiClient.post as jest.Mock;

const MOCK_MERCHANT = {
  id: 'm1',
  email: 'test@store.com',
  ownerName: 'Test Owner',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('stores tokens and returns auth response on success', async () => {
      mockPost.mockResolvedValue({
        success: true,
        data: {
          token: 'access-token-123',
          refreshToken: 'refresh-token-456',
          merchant: MOCK_MERCHANT,
        },
      });

      const result = await authService.login({ email: 'test@store.com', password: 'pass123' });

      expect(mockPost).toHaveBeenCalledWith('merchant/auth/login', {
        email: 'test@store.com',
        password: 'pass123',
      });
      expect(storageService.setAuthToken).toHaveBeenCalledWith('access-token-123');
      expect(storageService.setRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      expect(storageService.setMerchantData).toHaveBeenCalledWith(MOCK_MERCHANT);
      expect(result.token).toBe('access-token-123');
      expect(result.user.role).toBe('merchant');
    });

    it('throws on invalid credentials', async () => {
      mockPost.mockResolvedValue({
        success: false,
        message: 'Invalid email or password',
      });

      await expect(
        authService.login({ email: 'bad@email.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('handles network errors', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(
        authService.login({ email: 'test@store.com', password: 'pass' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('stores tokens and returns auth response on success', async () => {
      mockPost.mockResolvedValue({
        success: true,
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh',
          merchant: { ...MOCK_MERCHANT, id: 'm2' },
        },
      });

      const result = await authService.register({
        email: 'new@store.com',
        password: 'pass123',
        ownerName: 'New Owner',
        businessName: 'New Store',
        phoneNumber: '+919876543210',
      });

      expect(mockPost).toHaveBeenCalledWith(
        'merchant/auth/register',
        expect.objectContaining({
          email: 'new@store.com',
        })
      );
      expect(storageService.setAuthToken).toHaveBeenCalledWith('new-token');
      expect(result.token).toBe('new-token');
    });

    it('throws on duplicate email', async () => {
      mockPost.mockResolvedValue({
        success: false,
        message: 'Email already registered',
      });

      await expect(
        authService.register({
          email: 'existing@store.com',
          password: 'pass123',
          ownerName: 'Owner',
          businessName: 'Store',
          phoneNumber: '+919876543210',
        })
      ).rejects.toThrow('Email already registered');
    });
  });
});
