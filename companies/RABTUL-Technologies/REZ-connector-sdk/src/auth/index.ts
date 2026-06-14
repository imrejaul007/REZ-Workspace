/**
 * Auth Connector - RABTUL Authentication Service Client
 *
 * Handles all authentication-related operations including:
 * - Token verification
 * - OTP sending and verification
 * - User management
 * - JWT validation
 *
 * @example
 * ```typescript
 * import { AuthConnector } from '@rez/connector-sdk/auth';
 *
 * const auth = new AuthConnector({
 *   baseUrl: 'http://localhost:4002',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Verify a token
 * const result = await auth.verifyToken(token);
 * if (result.valid) {
 *   console.log('User:', result.user);
 * }
 * ```
 */

import { BaseConnector } from '../core';
import {
  ApiResponse,
  ApiError,
  ConnectorConfig,
  VerifyTokenResponse,
  SendOTPResponse,
  VerifyOTPResponse,
  User,
  RefreshTokenResponse,
  UserPayload,
  SendOTPSchema,
  VerifyOTPSchema,
  RefreshTokenSchema,
  ValidateJWTSchema,
  GetUserSchema,
} from '../types';

// ============================================================================
// Connector Configuration
// ============================================================================

export interface AuthConnectorConfig extends ConnectorConfig {
  /** Auth service URL (defaults to AUTH_SERVICE_URL env var or http://localhost:4002) */
  baseUrl?: string;
  /** Internal service token for inter-service communication */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Connector Class
// ============================================================================

export class AuthConnector extends BaseConnector<AuthConnectorConfig> {
  private static readonly SERVICE_NAME = 'auth';
  private static readonly DEFAULT_PORT = 4002;
  private static readonly ENV_VAR = 'AUTH_SERVICE_URL';

  constructor(config: AuthConnectorConfig = {}) {
    // Build complete config with defaults
    const completeConfig: AuthConnectorConfig = {
      baseUrl: config.baseUrl || process.env[AuthConnector.ENV_VAR] || `http://localhost:${AuthConnector.DEFAULT_PORT}`,
      internalServiceToken: config.internalServiceToken || process.env.INTERNAL_SERVICE_TOKEN,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    super(completeConfig, AuthConnector.SERVICE_NAME);
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Verify a JWT token and return the decoded payload
   *
   * @param token - The JWT token to verify
   * @returns Object with validity status and decoded user payload if valid
   *
   * @example
   * ```typescript
   * const result = await auth.verifyToken('eyJhbGciOiJIUzI1NiIs...');
   * if (result.valid) {
   *   console.log('Token valid for user:', result.user?.userId);
   * }
   * ```
   */
  async verifyToken(token: string): Promise<VerifyTokenResponse> {
    const { error: validationError } = SendOTPSchema.safeParse({});
    // Token validation happens at the endpoint
    void validationError;

    const result = await this.safeCall<VerifyTokenResponse>(async () => {
      return this.http.post<VerifyTokenResponse>('/auth/verify', { token });
    });

    if (!result.success) {
      return { valid: false };
    }

    return result.data ?? { valid: false };
  }

  /**
   * Send OTP to a phone number for authentication
   *
   * @param phone - Phone number in E.164 format (e.g., +919876543210)
   * @returns Success status and optional message ID
   *
   * @example
   * ```typescript
   * const result = await auth.sendOTP('+919876543210');
   * if (result.success) {
   *   console.log('OTP sent successfully');
   * }
   * ```
   */
  async sendOTP(phone: string): Promise<SendOTPResponse> {
    // Validate input with Zod
    const parsed = SendOTPSchema.safeParse({ phone });
    if (!parsed.success) {
      return {
        success: false,
      };
    }

    const result = await this.safeCall<SendOTPResponse>(async () => {
      return this.http.post<SendOTPResponse>('/auth/otp/send', { phone });
    });

    if (!result.success) {
      return { success: false };
    }

    return result.data ?? { success: false };
  }

  /**
   * Verify OTP and get authentication tokens
   *
   * @param phone - Phone number in E.164 format
   * @param otp - 6-digit OTP code
   * @returns Access token, refresh token, and user object
   *
   * @example
   * ```typescript
   * const result = await auth.verifyOTP('+919876543210', '123456');
   * if (result.success) {
   *   console.log('Access token:', result.accessToken);
   *   console.log('User:', result.user);
   * }
   * ```
   */
  async verifyOTP(phone: string, otp: string): Promise<VerifyOTPResponse | { success: false }> {
    // Validate input with Zod
    const parsed = VerifyOTPSchema.safeParse({ phone, otp });
    if (!parsed.success) {
      return { success: false };
    }

    const result = await this.safeCall<VerifyOTPResponse>(async () => {
      return this.http.post<VerifyOTPResponse>('/auth/otp/verify', { phone, otp });
    });

    if (!result.success) {
      return { success: false };
    }

    return result.data as VerifyOTPResponse;
  }

  /**
   * Get user details by user ID
   *
   * @param userId - The user's unique identifier
   * @returns User object with profile information
   *
   * @example
   * ```typescript
   * const result = await auth.getUser('550e8400-e29b-41d4-a716-446655440000');
   * if (result) {
   *   console.log('User name:', result.name);
   *   console.log('User email:', result.email);
   * }
   * ```
   */
  async getUser(userId: string): Promise<User | null> {
    // Validate input with Zod
    const parsed = GetUserSchema.safeParse({ userId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<User>(async () => {
      return this.http.get<User>(`/users/${userId}`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Refresh an expired access token using a refresh token
   *
   * @param refreshToken - The refresh token from previous authentication
   * @returns New access token and refresh token pair
   *
   * @example
   * ```typescript
   * const result = await auth.refreshToken('refresh_token_here');
   * if (result.success) {
   *   console.log('New access token:', result.accessToken);
   * }
   * ```
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse | { success: false }> {
    // Validate input with Zod
    const parsed = RefreshTokenSchema.safeParse({ refreshToken });
    if (!parsed.success) {
      return { success: false };
    }

    const result = await this.safeCall<RefreshTokenResponse>(async () => {
      return this.http.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    });

    if (!result.success) {
      return { success: false };
    }

    return result.data as RefreshTokenResponse;
  }

  /**
   * Validate a JWT token and return the user payload
   *
   * @param token - The JWT token to validate
   * @returns Decoded user payload if token is valid
   *
   * @example
   * ```typescript
   * try {
   *   const payload = await auth.validateJWT('eyJhbGciOiJIUzI1NiIs...');
   *   console.log('User ID:', payload.userId);
   * } catch (error) {
   *   console.log('Invalid token');
   * }
   * ```
   */
  async validateJWT(token: string): Promise<UserPayload | null> {
    // Validate input with Zod
    const parsed = ValidateJWTSchema.safeParse({ token });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<UserPayload>(async () => {
      return this.http.post<UserPayload>('/auth/validate', { token });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Create a new user account
   *
   * @param params - User creation parameters
   * @returns Created user object
   */
  async createUser(params: {
    email: string;
    phone?: string;
    name: string;
    password?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; user?: User; error?: ApiError }> {
    return this.safeCall<User>(async () => {
      return this.http.post<User>('/users', params);
    });
  }

  /**
   * Update user profile information
   *
   * @param userId - The user's unique identifier
   * @param updates - Fields to update
   * @returns Updated user object
   */
  async updateUser(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'phone' | 'avatar' | 'metadata'>>
  ): Promise<{ success: boolean; user?: User; error?: ApiError }> {
    return this.safeCall<User>(async () => {
      return this.http.patch<User>(`/users/${userId}`, updates);
    });
  }

  /**
   * Delete a user account
   *
   * @param userId - The user's unique identifier
   * @returns Success status
   */
  async deleteUser(userId: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall<void>(async () => {
      return this.http.delete<void>(`/users/${userId}`);
    });
  }

  /**
   * Change user password
   *
   * @param userId - The user's unique identifier
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Success status
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall<void>(async () => {
      return this.http.post<void>(`/users/${userId}/change-password`, {
        currentPassword,
        newPassword,
      });
    });
  }

  /**
   * Reset password using OTP verification
   *
   * @param phone - Phone number for verification
   * @param otp - OTP code
   * @param newPassword - New password to set
   * @returns Success status
   */
  async resetPassword(
    phone: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall<void>(async () => {
      return this.http.post<void>('/auth/reset-password', {
        phone,
        otp,
        newPassword,
      });
    });
  }

  /**
   * Revoke a refresh token (logout)
   *
   * @param refreshToken - The refresh token to revoke
   * @returns Success status
   */
  async revokeToken(refreshToken: string): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall<void>(async () => {
      return this.http.post<void>('/auth/revoke', { refreshToken });
    });
  }

  /**
   * Check if the auth service is healthy
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.http.get<{ status: string }>('/health');
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let authInstance: AuthConnector | null = null;

/**
 * Get or create a singleton AuthConnector instance
 *
 * @param config - Optional configuration override
 * @returns AuthConnector instance
 */
export function createAuthConnector(config?: AuthConnectorConfig): AuthConnector {
  if (!authInstance) {
    authInstance = new AuthConnector(config);
  } else if (config) {
    // If new config provided, create new instance
    authInstance = new AuthConnector(config);
  }
  return authInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetAuthConnector(): void {
  authInstance = null;
}
