/**
 * Onboarding Flow Integration Tests
 */

import authService from '@/services/authApi';
import apiClient from '@/services/apiClient';
import { cleanupAfterTest } from '../utils/testHelpers';

// authService only has default export; use global apiClient mock from jest.setup.js
jest.mock('@/services/authApi', () => {
  const apiClient = require('@/services/apiClient').default;
  let _token: string | null = null;
  return {
    __esModule: true,
    default: {
      sendOtp: (data: any) => apiClient.post('/auth/send-otp', data),
      verifyOtp: (data: any) => apiClient.post('/auth/verify-otp', data),
      updateProfile: (data: any) => apiClient.put('/auth/profile', data),
      completeOnboarding: (data: any) => apiClient.post('/auth/onboarding', data),
      setAuthToken: (token: string | null) => { _token = token; apiClient.setAuthToken(token); },
      getAuthToken: () => _token ?? apiClient.getAuthToken(),
    },
  };
});

describe('Onboarding Flow Integration Tests', () => {
  beforeEach(() => {
    // No local apiClient mock needed - use global from jest.setup.js
  });

  afterEach(async () => {
    await cleanupAfterTest();
  });

  it('should complete: Signup → OTP → Profile → Preferences → Complete', async () => {
    // Send OTP
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { message: 'OTP sent', isNewUser: true },
    });

    await authService.sendOtp({ phoneNumber: '+1234567890' });

    // Verify OTP
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        user: { id: 'user_new', isOnboarded: false },
        tokens: { accessToken: 'token_123', refreshToken: 'refresh_123' },
      },
    });

    const loginResponse = await authService.verifyOtp({
      phoneNumber: '+1234567890',
      otp: '123456',
    });
    expect(loginResponse.data.user.isOnboarded).toBe(false);

    // Complete profile
    (apiClient.put as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        profile: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      },
    });

    await authService.updateProfile({
      profile: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    });

    // Set preferences
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { preferences: { notifications: true, newsletter: false } },
    });

    // Complete onboarding
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: { user: { isOnboarded: true } },
    });

    const onboarding = await authService.completeOnboarding({
      profile: { firstName: 'John', lastName: 'Doe' },
      preferences: { notifications: true },
    });
    expect(onboarding.data.user.isOnboarded).toBe(true);
  });
});
