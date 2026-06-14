import { Platform } from 'react-native';
import { apiClient } from './client';
import { storageService, COOKIE_AUTH_ENABLED } from '../storage';
import { logger } from '../../utils/logger';
import {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Merchant,
} from '../../types/api';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        token: string;
        refreshToken?: string;
        merchant: Merchant;
        user?: { name?: string };
      }>('merchant/auth/login', credentials);

      if (response.success && response.data) {
        // Guard against malformed login responses to avoid white-screen crashes
        if (!response?.data?.merchant?.id) {
          throw new Error('Invalid login response from server');
        }

        // Create user object from merchant data for compatibility
        const user: User = {
          id: response.data.merchant.id,
          email: response.data.merchant.email,
          // AC2-C2 fix: team member login response omits ownerName — fallback so name is never undefined in AsyncStorage
          name: response.data.merchant.ownerName || response.data.user?.name || 'Team Member',
          role: 'merchant',
          merchantId: response.data.merchant.id,
          isActive: response.data.merchant.isActive ?? true,
          createdAt: response.data.merchant.createdAt || new Date().toISOString(),
          updatedAt: response.data.merchant.updatedAt || new Date().toISOString(),
        };

        // Store authentication data — wrap in try/catch so a storage failure
        // (e.g. quota, disabled localStorage) surfaces a clear error instead
        // of crashing the app post-login.
        try {
          await storageService.setAuthToken(response.data.token);
          if (response.data.refreshToken) {
            await storageService.setRefreshToken(response.data.refreshToken);
          }
          await storageService.setUserData(user);
          await storageService.setMerchantData(response.data.merchant);
        } catch (storageError) {
          logger.error('Failed to persist auth token', storageError);
          throw new Error('Storage error — please restart the app');
        }

        return {
          token: response.data.token,
          user: user,
          merchant: response.data.merchant,
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      logger.error('Login error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  }

  // Register new user/merchant
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        token: string;
        refreshToken?: string;
        merchant: Merchant;
      }>('merchant/auth/register', userData);

      if (response.success && response.data) {
        // Create user object from merchant data for compatibility
        const user: User = {
          id: response.data.merchant.id,
          email: response.data.merchant.email,
          name: response.data.merchant.ownerName,
          role: 'merchant',
          merchantId: response.data.merchant.id,
          isActive: response.data.merchant.isActive ?? true,
          createdAt: response.data.merchant.createdAt || new Date().toISOString(),
          updatedAt: response.data.merchant.updatedAt || new Date().toISOString(),
        };

        // FIX (159): Wrap storage operations in try/catch — if storage fails (quota full,
        // disabled localStorage), surface a clear error instead of silently proceeding with a
        // valid token but no local copy, which would force re-login on next app open.
        try {
          await storageService.setAuthToken(response.data.token);
          if (response.data.refreshToken) {
            await storageService.setRefreshToken(response.data.refreshToken);
          }
          await storageService.setUserData(user);
          await storageService.setMerchantData(response.data.merchant);
        } catch (storageError) {
          logger.error('Failed to persist auth data after registration', storageError);
          throw new Error('Storage error — please restart the app');
        }

        return {
          token: response.data.token,
          user: user,
          merchant: response.data.merchant,
        };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      logger.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  }

  // Refresh authentication token
  async refreshToken(): Promise<AuthResponse> {
    try {
      // Send the dedicated refresh token in the body (not the expired access token).
      // Web clients rely on the httpOnly cookie — body field is for native only.
      const storedRefreshToken = await storageService.getRefreshToken();
      const response = await apiClient.post<AuthResponse>(
        'merchant/auth/refresh',
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {}
      );

      if (response.success && response.data) {
        // MA-AUT-009: Validate tokens are non-empty strings before storing
        if (
          !response.data.token ||
          typeof response.data.token !== 'string' ||
          response.data.token.length === 0
        ) {
          throw new Error('Invalid token in refresh response: token is empty or malformed');
        }
        await storageService.setAuthToken(response.data.token);

        // MA-AUT-022: Validate refresh token is present and non-empty
        if (response.data.refreshToken) {
          if (
            typeof response.data.refreshToken !== 'string' ||
            response.data.refreshToken.length === 0
          ) {
            throw new Error(
              'Invalid token in refresh response: refreshToken is empty or malformed'
            );
          }
          await storageService.setRefreshToken(response.data.refreshToken);
        }

        if (response.data.user) await storageService.setUserData(response.data.user);
        if (response.data.merchant) await storageService.setMerchantData(response.data.merchant);

        return response.data;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error) {
      logger.error('Token refresh error:', error);
      // If refresh fails, clear stored data
      await this.logout();
      throw new Error(error.response?.data?.message || error.message || 'Token refresh failed');
    }
  }

  // Get current user profile
  async getProfile(): Promise<{ user: User; merchant: Merchant }> {
    try {
      const response = await apiClient.get<{ merchant: Merchant }>('merchant/auth/me');

      if (response.success && response.data) {
        // Create user object from merchant data for compatibility
        const user: User = {
          id: response.data.merchant.id,
          email: response.data.merchant.email,
          name: response.data.merchant.ownerName,
          role: 'merchant',
          merchantId: response.data.merchant.id,
          isActive: response.data.merchant.isActive ?? true,
          createdAt: response.data.merchant.createdAt || new Date().toISOString(),
          updatedAt: response.data.merchant.updatedAt || new Date().toISOString(),
        };

        // Update stored user data
        await storageService.setUserData(user);
        await storageService.setMerchantData(response.data.merchant);

        return {
          user: user,
          merchant: response.data.merchant,
        };
      } else {
        throw new Error(response.message || 'Failed to get profile');
      }
    } catch (error) {
      logger.error('Get profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get profile');
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      // AC2-H1 fix: backend expects ownerName but User type uses name — map before sending
      const { name, ...rest } = updates as unknown;
      const payload = { ...rest, ...(name !== undefined ? { ownerName: name } : {}) };
      const response = await apiClient.put<User>('merchant/auth/profile', payload);

      if (response.success && response.data) {
        // Update stored user data
        await storageService.setUserData(response.data);

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      logger.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update profile');
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.put('merchant/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error) {
      logger.error('Change password error:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to change password'
      );
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if token exists
      const token = await storageService.getAuthToken();
      if (token) {
        try {
          await apiClient.post('merchant/auth/logout');
        } catch (error) {
          // Continue with logout even if API call fails
          logger.warn('Logout API call failed:', error);
        }
      }
    } finally {
      // Always clear local storage
      await storageService.logout();
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const isWebCookie = Platform.OS === 'web' && COOKIE_AUTH_ENABLED;

    if (!isWebCookie) {
      // Native: require a stored token before attempting the network call.
      const token = await storageService.getAuthToken();
      if (!token) return false;
    }
    // Web: token is in an httpOnly cookie — skip local storage check and
    // let the browser send the cookie automatically via withCredentials.

    try {
      await this.getProfile();
      return true;
    } catch (error) {
      if (!isWebCookie) {
        await storageService.logout();
      }
      return false;
    }
  }

  // Get stored user data
  async getStoredUserData(): Promise<User | null> {
    return await storageService.getUserData<User>();
  }

  // Get stored merchant data
  async getStoredMerchantData(): Promise<Merchant | null> {
    return await storageService.getMerchantData<Merchant>();
  }

  // Get stored auth token.
  // On web, tokens are in httpOnly cookies (not JS-readable) — return a sentinel
  // so callers don't short-circuit to LOGOUT before attempting session validation.
  async getStoredToken(): Promise<string | null> {
    if (Platform.OS === 'web' && COOKIE_AUTH_ENABLED) return 'cookie-session';
    return await storageService.getAuthToken();
  }

  // Clear all authentication data
  async clearAuthData(): Promise<void> {
    await storageService.logout();
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post('merchant/auth/forgot-password', { email });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to send reset email'
      );
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post('merchant/auth/reset-password', {
        token,
        newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      logger.error('Reset password error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to reset password');
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await apiClient.post('merchant/auth/verify-email', { token });

      if (!response.success) {
        throw new Error(response.message || 'Failed to verify email');
      }
    } catch (error) {
      logger.error('Verify email error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to verify email');
    }
  }

  // Resend verification email
  async resendVerificationEmail(): Promise<void> {
    try {
      const response = await apiClient.post('merchant/auth/resend-verification');

      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      logger.error('Resend verification error:', error);
      throw new Error(
        error.response?.data?.message || error.message || 'Failed to resend verification email'
      );
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
