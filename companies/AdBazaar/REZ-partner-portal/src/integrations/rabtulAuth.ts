import logger from 'utils/logger.js';

/**
 * RABTUL Authentication Integration
 *
 * Uses RABTUL Auth Service for all authentication operations.
 * This replaces local bcrypt/JWT implementation.
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

if (!INTERNAL_TOKEN) {
  logger.warn('WARNING: INTERNAL_SERVICE_TOKEN not set. Auth verification will fail.');
}

// ============================================================================
// Types
// ============================================================================

export interface RABTULUser {
  userId: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AuthVerifyResult {
  valid: boolean;
  user?: RABTULUser;
  error?: string;
}

export interface TokenExchangeResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

// ============================================================================
// RABTUL Auth Client
// ============================================================================

class RABTULAuthClient {
  private client: AxiosInstance;
  private internalToken: string;

  constructor() {
    this.internalToken = INTERNAL_TOKEN || 'not-configured';

    this.client = axios.create({
      baseURL: AUTH_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': this.internalToken,
      },
    });
  }

  /**
   * Verify a JWT token with RABTUL
   */
  async verifyToken(token: string): Promise<AuthVerifyResult> {
    try {
      const response = await this.client.post<{
        valid: boolean;
        user?: RABTULUser;
        error?: string;
      }>('/api/auth/verify', { token });

      return response.data;
    } catch (error) {
      if (error.response) {
        return {
          valid: false,
          error: error.response.data?.message || 'Verification failed',
        };
      }
      return {
        valid: false,
        error: 'Auth service unavailable',
      };
    }
  }

  /**
   * Verify internal service token
   */
  async verifyInternalToken(token: string, serviceName: string): Promise<boolean> {
    try {
      const response = await this.client.post<{ valid: boolean }>('/api/auth/internal/verify', {
        token,
        serviceName,
      });

      return response.data.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user profile from RABTUL
   */
  async getUserProfile(userId: string): Promise<RABTULUser | null> {
    try {
      const response = await this.client.get<RABTULUser>(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a service token for partner portal users
   * This allows partner portal to issue its own tokens that are verifiable
   */
  async createServiceToken(userId: string, partnerId: string, role: string): Promise<TokenExchangeResult> {
    try {
      const response = await this.client.post<{
        success: boolean;
        token?: string;
        refreshToken?: string;
        expiresIn?: number;
        error?: string;
      }>('/api/auth/service-token', {
        userId,
        metadata: {
          partnerId,
          role,
          service: 'partner-portal',
        },
      });

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token creation failed',
      };
    }
  }

  /**
   * Refresh a token
   */
  async refreshToken(refreshToken: string): Promise<TokenExchangeResult> {
    try {
      const response = await this.client.post<{
        success: boolean;
        token?: string;
        refreshToken?: string;
        expiresIn?: number;
        error?: string;
      }>('/api/auth/refresh', { refreshToken });

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token refresh failed',
      };
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const rabtulAuth = new RABTULAuthClient();
export default rabtulAuth;
