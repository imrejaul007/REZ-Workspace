/**
 * RABTUL Auth Service Client
 * Port: 4002
 *
 * Handles user authentication and authorization.
 */

import axios, { AxiosInstance } from 'axios';

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export class RabtulAuthClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
    private readonly apiKey: string = process.env.RABTUL_AUTH_API_KEY || '',
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[RabtulAuth] API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  /**
   * Login with email/phone and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  /**
   * Send OTP for phone verification
   */
  async sendOTP(phone: string): Promise<{ success: boolean }> {
    const response = await this.client.post('/auth/otp/send', { phone });
    return response.data;
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string): Promise<Tokens> {
    const response = await this.client.post<{ tokens: Tokens }>('/auth/otp/verify', {
      phone,
      otp,
    });
    return response.data.tokens;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<Tokens> {
    const response = await this.client.post<Tokens>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  /**
   * Validate an access token
   */
  async validateToken(token: string): Promise<User> {
    const response = await this.client.post<User>('/auth/validate', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${userId}`);
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await this.client.patch<User>(`/users/${userId}`, data);
    return response.data;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    const response = await this.client.post(`/users/${userId}/change-password`, {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    const response = await this.client.post('/auth/password/reset-request', { email });
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const response = await this.client.post('/auth/password/reset', {
      token,
      newPassword,
    });
    return response.data;
  }

  /**
   * Logout (invalidate tokens)
   */
  async logout(refreshToken: string): Promise<{ success: boolean }> {
    const response = await this.client.post('/auth/logout', { refreshToken });
    return response.data;
  }
}

// Singleton instance
let authClientInstance: RabtulAuthClient | null = null;

export function getRabtulAuthClient(): RabtulAuthClient {
  if (!authClientInstance) {
    authClientInstance = new RabtulAuthClient();
  }
  return authClientInstance;
}
