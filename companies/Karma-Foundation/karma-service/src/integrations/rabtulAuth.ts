/**
 * RABTUL Auth Integration for REZ-Media Services
 *
 * Uses RABTUL Auth as the identity provider for all REZ-Media services.
 * This ensures single identity across the ecosystem.
 */

import axios from 'axios';

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
interface User {
  userId: string;
  phone?: string;
  email?: string;
  name?: string;
  createdAt: string;
}

interface TokenVerification {
  valid: boolean;
  user?: User;
  error?: string;
}

class RABTULAuthIntegration {
  /**
   * Verify a JWT token
   */
  async verifyToken(token: string): Promise<TokenVerification> {
    try {
      const response = await axios.post(
        `${AUTH_URL}/api/auth/verify`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
        }
      );

      return {
        valid: true,
        user: response.data.user,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.message || 'Token verification failed',
      };
    }
  }

  /**
   * Send OTP for phone verification
   */
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(
        `${AUTH_URL}/api/auth/send-otp`,
        { phone },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        message: response.data.message || 'OTP sent',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; token?: string; user?: User }> {
    try {
      const response = await axios.post(
        `${AUTH_URL}/api/auth/verify-otp`,
        { phone, otp },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }

  /**
   * Get user profile from RABTUL
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const response = await axios.get(`${AUTH_URL}/api/auth/user/${userId}`, {
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      });

      return response.data.user;
    } catch {
      return null;
    }
  }

  /**
   * Create anonymous session
   */
  async createAnonymousSession(deviceId: string): Promise<{ sessionId: string; token: string }> {
    try {
      const response = await axios.post(
        `${AUTH_URL}/api/auth/anonymous`,
        { deviceId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        sessionId: response.data.sessionId,
        token: response.data.token,
      };
    } catch (error) {
      throw new Error('Failed to create anonymous session');
    }
  }

  /**
   * Link anonymous session to user
   */
  async linkAnonymousSession(
    anonymousToken: string,
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      await axios.post(
        `${AUTH_URL}/api/auth/link-session`,
        { anonymousToken, userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_TOKEN,
          },
        }
      );

      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

// Singleton instance
export const rabtulAuth = new RABTULAuthIntegration();

// Default export
export default rabtulAuth;
