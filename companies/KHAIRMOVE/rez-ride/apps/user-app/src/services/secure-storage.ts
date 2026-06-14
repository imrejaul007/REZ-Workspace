import { logger } from '../../shared/logger';
/**
 * Secure Storage Service - Token Management
 * Replaces in-memory token storage with encrypted persistence
 */

import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'rez_auth_token';
const REFRESH_TOKEN_KEY = 'rez_refresh_token';
const USER_DATA_KEY = 'rez_user_data';

export interface UserData {
  id: string;
  phone: string;
  name?: string;
  email?: string;
}

class SecureStorageService {
  /**
   * Store auth token securely
   */
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        requireAuthentication: false,
      });
    } catch (error) {
      logger.error('Failed to store token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      logger.error('Failed to get token:', error);
      return null;
    }
  }

  /**
   * Store refresh token securely
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token, {
        requireAuthentication: false,
      });
    } catch (error) {
      logger.error('Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Store user data
   */
  async setUserData(user: UserData): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user), {
        requireAuthentication: false,
      });
    } catch (error) {
      logger.error('Failed to store user data:', error);
    }
  }

  /**
   * Get stored user data
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const data = await SecureStore.getItemAsync(USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Clear all auth data
   */
  async clearAll(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
    } catch (error) {
      logger.error('Failed to clear secure storage:', error);
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;
