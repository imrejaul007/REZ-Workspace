import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  User,
} from '@/types/auth';

export const authApi = {
  async login(email: string, password: string, role?: string, twoFactorToken?: string): Promise<LoginResponse> {
    const payload: unknown = {
      email,
      password,
    };

    if (role) {
      payload.role = role;
    }

    if (twoFactorToken) {
      payload.twoFactorToken = twoFactorToken;
    }

    const response = await apiClient.post<LoginResponse>('/auth/signin', payload);
    // Handle both wrapped and unwrapped responses
    return (response as unknown).data || response;
  },

  async signUp(data: SignUpRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/signup', data);
    return (response as unknown).data || response;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<unknown>('/auth/me');
    // Backend returns { authenticated: true, user: {...} }
    return (response as unknown).user || (response as unknown).data?.user || (response as unknown).data || response;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', data);
    return response.data;
  },

  async getUserStats(): Promise<unknown> {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },
};