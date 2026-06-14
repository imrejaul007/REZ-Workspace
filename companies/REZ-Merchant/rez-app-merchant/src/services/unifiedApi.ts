// Unified API Client - Connects to all services
// Merchant App uses this to get user/merchant state from Auth, Profile, Wallet
// Enhanced with toast notifications and loading states

import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-native-toast-message';

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const PROFILE_URL = process.env.EXPO_PUBLIC_PROFILE_SERVICE_URL || 'https://rezprofile.onrender.com';
const WALLET_URL = process.env.EXPO_PUBLIC_WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';

// ─── Toast Notification Helpers ────────────────────────────────────────────────

function showSuccessToast(title: string, message?: string) {
  toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
  });
}

function showErrorToast(title: string, message?: string) {
  toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 5000,
    autoHide: true,
  });
}

function showNetworkErrorToast() {
  showErrorToast('Connection Error', 'Please check your internet connection');
}

// ─── Loading State Types ──────────────────────────────────────────────────────

export interface LoadingState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function createLoadingState<T>(initialData: T | null = null): LoadingState<T> {
  return {
    data: initialData,
    loading: false,
    error: null,
    refetch: async () => {},
  };
}

// ─── Error Types ──────────────────────────────────────────────────────────────

export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
};

// ─── Error Handler ─────────────────────────────────────────────────────────────

function isAuthError(error: unknown): error is AuthError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (isAuthError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  merchantId?: string;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences: {
    language: string;
    theme: string;
    notifications: { push: boolean; sms: boolean; email: boolean; whatsapp: boolean };
  };
  addresses: unknown[];
  role: string;
}

export interface MerchantWallet {
  balance: number;
  pendingPayout: number;
  transactions: unknown[];
}

// Wallet types for real wallet service
export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  reference?: string;
}

export interface WalletError {
  code: 'INSUFFICIENT_BALANCE' | 'INVALID_AMOUNT' | 'SERVICE_UNAVAILABLE' | 'NETWORK_ERROR';
  message: string;
}

export interface MerchantWalletState {
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  loading: boolean;
  error: WalletError | null;
  lastUpdated: Date | null;
}

// OTP Types
export interface OTPSendResponse {
  success: boolean;
  message: string;
  phone: string;
  maskedPhone: string;
  expiresIn: number;
  attemptsRemaining?: number;
}

export interface OTPVerifyResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  isNewUser?: boolean;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  merchant?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  message?: string;
}

// ─── Auth Client ───────────────────────────────────────────────────────────────

class AuthClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: AUTH_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, retryCount);
    return Math.min(delay, RETRY_CONFIG.maxDelayMs);
  }

  /**
   * Execute request with retry logic
   */
  private async withRetry<T>(
    requestFn: () => Promise<T>,
    retryCount: number = 0
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retryCount >= RETRY_CONFIG.maxRetries) {
        throw error;
      }

      // Only retry on network errors or 5xx server errors
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const isRetryable =
          !error.response || // Network error
          (status && status >= 500 && status < 600); // Server error

        if (isRetryable) {
          const delay = this.calculateRetryDelay(retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.withRetry(requestFn, retryCount + 1);
        }
      }

      throw error;
    }
  }

  /**
   * Normalize phone number for API
   * Accepts formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters except leading +
    let normalized = phone.replace(/[^\d+]/g, '');

    // Ensure + prefix for international format
    if (!normalized.startsWith('+') && normalized.length === 10) {
      normalized = '+91' + normalized;
    } else if (!normalized.startsWith('+') && normalized.length > 10 && normalized.startsWith('91')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }

  /**
   * Mask phone number for display
   * e.g., +91XXXXXXXX98
   */
  private maskPhone(phone: string): string {
    const normalized = this.normalizePhone(phone);
    if (normalized.length <= 4) return normalized;
    const lastTwo = normalized.slice(-2);
    const masked = '*'.repeat(normalized.length - 4);
    return normalized.slice(0, 3) + masked + lastTwo;
  }

  /**
   * Send OTP to phone number
   * POST /auth/otp/send
   *
   * @param phone - Phone number (accepts various formats)
   * @returns OTPSendResponse with masked phone and expiration
   * @throws AuthError on failure
   */
  async sendOTP(phone: string): Promise<OTPSendResponse> {
    const normalizedPhone = this.normalizePhone(phone);

    if (!normalizedPhone || normalizedPhone.length < 10) {
      throw {
        code: 'INVALID_PHONE',
        message: 'Please enter a valid phone number',
      };
    }

    return this.withRetry(async () => {
      try {
        const response = await this.client.post<{
          success: boolean;
          message: string;
          phone?: string;
          expiresIn?: number;
          attemptsRemaining?: number;
        }>('/auth/otp/send', {
          phone: normalizedPhone,
          channel: 'sms',
        });

        if (response.data.success) {
          return {
            success: true,
            message: response.data.message || 'OTP sent successfully',
            phone: normalizedPhone,
            maskedPhone: this.maskPhone(normalizedPhone),
            expiresIn: response.data.expiresIn || 300, // 5 minutes default
            attemptsRemaining: response.data.attemptsRemaining,
          };
        } else {
          throw {
            code: 'OTP_SEND_FAILED',
            message: response.data.message || 'Failed to send OTP',
          };
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const data = error.response?.data as { message?: string; code?: string } | undefined;

          if (status === 429) {
            throw {
              code: 'RATE_LIMITED',
              message: 'Too many OTP requests. Please wait a moment and try again.',
            };
          }

          if (status === 400) {
            throw {
              code: data?.code || 'INVALID_REQUEST',
              message: data?.message || 'Invalid phone number format',
            };
          }

          if (status === 404) {
            throw {
              code: 'USER_NOT_FOUND',
              message: 'No account found with this phone number. Please sign up first.',
            };
          }
        }

        throw {
          code: 'NETWORK_ERROR',
          message: getErrorMessage(error),
        };
      }
    });
  }

  /**
   * Verify OTP
   * POST /auth/otp/verify
   *
   * @param phone - Phone number used for OTP
   * @param otp - The OTP code (6 digits)
   * @returns OTPVerifyResponse with token and user data
   * @throws AuthError on failure
   */
  async verifyOTP(phone: string, otp: string): Promise<OTPVerifyResponse> {
    const normalizedPhone = this.normalizePhone(phone);

    if (!normalizedPhone) {
      throw {
        code: 'INVALID_PHONE',
        message: 'Phone number is required',
      };
    }

    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      throw {
        code: 'INVALID_OTP',
        message: 'Please enter a valid 6-digit OTP',
      };
    }

    return this.withRetry(async () => {
      try {
        const response = await this.client.post<{
          success: boolean;
          token?: string;
          user?: AuthUser;
          isNewUser?: boolean;
          message?: string;
        }>('/auth/otp/verify', {
          phone: normalizedPhone,
          otp,
        });

        if (response.data.success) {
          return {
            success: true,
            token: response.data.token,
            user: response.data.user,
            isNewUser: response.data.isNewUser || false,
            message: response.data.message,
          };
        } else {
          throw {
            code: 'OTP_VERIFY_FAILED',
            message: response.data.message || 'OTP verification failed',
          };
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const data = error.response?.data as { message?: string; code?: string; attemptsRemaining?: number } | undefined;

          if (status === 401) {
            throw {
              code: 'INVALID_OTP',
              message: data?.message || 'Invalid OTP. Please try again.',
              details: data?.attemptsRemaining?.toString(),
            };
          }

          if (status === 410) {
            // OTP expired
            throw {
              code: 'OTP_EXPIRED',
              message: 'OTP has expired. Please request a new one.',
            };
          }

          if (status === 429) {
            throw {
              code: 'RATE_LIMITED',
              message: 'Too many verification attempts. Please wait and try again.',
            };
          }

          if (status === 404) {
            throw {
              code: 'USER_NOT_FOUND',
              message: 'No pending OTP verification found. Please request a new OTP.',
            };
          }
        }

        throw {
          code: 'NETWORK_ERROR',
          message: getErrorMessage(error),
        };
      }
    });
  }

  /**
   * Login with phone + OTP
   * Combines sendOTP + verifyOTP in one flow
   *
   * @param phone - Phone number
   * @param otp - OTP code
   * @returns LoginResponse with JWT token and user data
   */
  async loginWithOTP(phone: string, otp: string): Promise<LoginResponse> {
    const verifyResult = await this.verifyOTP(phone, otp);

    if (!verifyResult.success || !verifyResult.token || !verifyResult.user) {
      throw {
        code: 'LOGIN_FAILED',
        message: verifyResult.message || 'Login failed',
      };
    }

    return {
      success: true,
      token: verifyResult.token,
      user: verifyResult.user,
      isNewUser: verifyResult.isNewUser,
      message: verifyResult.message,
    };
  }

  /**
   * Resend OTP (rate-limited wrapper around sendOTP)
   * Provides user-friendly delay between requests
   */
  async resendOTP(phone: string): Promise<OTPSendResponse> {
    // Add minimum delay between resend requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return this.sendOTP(phone);
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  async getMe(token?: string): Promise<AuthUser> {
    if (token) {
      this.setToken(token);
    }

    return this.withRetry(async () => {
      try {
        const response = await this.client.get<{ user: AuthUser }>('/auth/me');
        return response.data.user;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          throw {
            code: 'UNAUTHORIZED',
            message: 'Session expired. Please login again.',
          };
        }
        throw {
          code: 'NETWORK_ERROR',
          message: getErrorMessage(error),
        };
      }
    });
  }

  /**
   * Refresh authentication token
   * POST /auth/refresh
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    return this.withRetry(async () => {
      try {
        const response = await this.client.post<{ token: string; refreshToken: string }>(
          '/auth/refresh',
          { refreshToken }
        );
        return {
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        };
      } catch (error) {
        throw {
          code: 'REFRESH_FAILED',
          message: getErrorMessage(error),
        };
      }
    });
  }

  /**
   * Logout
   * POST /auth/logout
   */
  async logout(token?: string): Promise<void> {
    if (token) {
      this.setToken(token);
    }

    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Logout should not throw - user is logging out anyway
      console.warn('Logout API call failed:', error);
    }
  }
}

// ─── Profile Client ────────────────────────────────────────────────────────────

class ProfileClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: PROFILE_URL, timeout: 10000 });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const res = await this.client.get(`/profile/${userId}`);
      return res.data;
    } catch {
      return null;
    }
  }

  async getProfileWithState(
    userId: string,
    setState?: (state: LoadingState<UserProfile>) => void
  ): Promise<UserProfile | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refetch: () => this.getProfileWithState(userId, setState),
      });
    }

    try {
      const res = await this.client.get(`/profile/${userId}`);
      const data = res.data as UserProfile;
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refetch: () => this.getProfileWithState(userId, setState),
        });
      }
      return data;
    } catch (error) {
      const message = getErrorMessage(error);
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: message,
          refetch: () => this.getProfileWithState(userId, setState),
        });
      }
      showNetworkErrorToast();
      return null;
    }
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    const res = await this.client.patch(`/profile/${userId}`, data);
    return res.data;
  }

  async updateProfileWithState(
    userId: string,
    data: Partial<UserProfile>,
    setState?: (state: LoadingState<UserProfile>) => void
  ): Promise<UserProfile | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refetch: () => this.updateProfileWithState(userId, data, setState),
      });
    }

    try {
      const res = await this.client.patch(`/profile/${userId}`, data);
      const updatedProfile = res.data as UserProfile;
      if (setState) {
        setState({
          data: updatedProfile,
          loading: false,
          error: null,
          refetch: () => this.updateProfileWithState(userId, data, setState),
        });
      }
      showSuccessToast('Profile Updated', 'Your profile has been saved');
      return updatedProfile;
    } catch (error) {
      const message = getErrorMessage(error);
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: message,
          refetch: () => this.updateProfileWithState(userId, data, setState),
        });
      }
      showErrorToast('Update Failed', message);
      return null;
    }
  }

  async getPreferences(userId: string) {
    try {
      const res = await this.client.get(`/profile/${userId}/preferences`);
      return res.data;
    } catch {
      return null;
    }
  }

  async updatePreferences(userId: string, data) {
    const res = await this.client.patch(`/profile/${userId}/preferences`, data);
    return res.data;
  }
}

// ─── Wallet Client ─────────────────────────────────────────────────────────────

// PayoutRequest and PayoutResponse are internal interfaces
interface PayoutRequest {
  amount: number;
  method: 'bank' | 'upi' | 'wallet';
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  upiId?: string;
}

interface PayoutResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  estimatedArrival?: string;
}

class WalletClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: WALLET_URL, timeout: 10000 });
  }

  setToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Get merchant wallet balance
   * GET /merchant/:id/balance
   */
  async getMerchantBalance(merchantId: string): Promise<WalletBalance | null> {
    try {
      const res = await this.client.get(`/merchant/${merchantId}/balance`);
      return res.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get merchant wallet balance with loading state
   */
  async getMerchantBalanceWithState(
    merchantId: string,
    setState?: (state: LoadingState<WalletBalance>) => void
  ): Promise<WalletBalance | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refetch: () => this.getMerchantBalanceWithState(merchantId, setState),
      });
    }

    try {
      const res = await this.client.get(`/merchant/${merchantId}/balance`);
      const data = res.data as WalletBalance;
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refetch: () => this.getMerchantBalanceWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        if (setState) {
          setState({ data: null, loading: false, error: null, refetch: () => this.getMerchantBalanceWithState(merchantId, setState) });
        }
        return null;
      }
      const message = this.handleError(error).message;
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: message,
          refetch: () => this.getMerchantBalanceWithState(merchantId, setState),
        });
      }
      showNetworkErrorToast();
      return null;
    }
  }

  /**
   * Get merchant transaction history
   * GET /merchant/:id/transactions
   */
  async getMerchantTransactions(
    merchantId: string,
    options?: { limit?: number; offset?: number; type?: 'credit' | 'debit' | 'all' }
  ): Promise<WalletTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.type && options.type !== 'all') params.append('type', options.type);

      const queryString = params.toString();
      const url = `/merchant/${merchantId}/transactions${queryString ? `?${queryString}` : ''}`;

      const res = await this.client.get(url);
      return res.data.transactions || res.data || [];
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get merchant transactions with loading state
   */
  async getMerchantTransactionsWithState(
    merchantId: string,
    options: { limit?: number; offset?: number; type?: 'credit' | 'debit' | 'all' } = {},
    setState?: (state: LoadingState<WalletTransaction[]>) => void
  ): Promise<WalletTransaction[]> {
    if (setState) {
      setState({
        data: [],
        loading: true,
        error: null,
        refetch: () => this.getMerchantTransactionsWithState(merchantId, options, setState),
      });
    }

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.type && options.type !== 'all') params.append('type', options.type);

      const queryString = params.toString();
      const url = `/merchant/${merchantId}/transactions${queryString ? `?${queryString}` : ''}`;

      const res = await this.client.get(url);
      const data = res.data.transactions || res.data || [];
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refetch: () => this.getMerchantTransactionsWithState(merchantId, options, setState),
        });
      }
      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        if (setState) {
          setState({ data: [], loading: false, error: null, refetch: () => this.getMerchantTransactionsWithState(merchantId, options, setState) });
        }
        return [];
      }
      const message = this.handleError(error).message;
      if (setState) {
        setState({
          data: [],
          loading: false,
          error: message,
          refetch: () => this.getMerchantTransactionsWithState(merchantId, options, setState),
        });
      }
      showNetworkErrorToast();
      return [];
    }
  }

  /**
   * Request a payout from merchant wallet
   * POST /merchant/:id/payout
   */
  async requestPayout(merchantId: string, request: PayoutRequest): Promise<PayoutResponse> {
    // Validate amount
    if (!request.amount || request.amount <= 0) {
      throw {
        code: 'INVALID_AMOUNT' as const,
        message: 'Payout amount must be greater than 0',
      };
    }

    try {
      const res = await this.client.post(`/merchant/${merchantId}/payout`, request);
      return {
        success: true,
        transactionId: res.data.transactionId,
        message: res.data.message || 'Payout initiated successfully',
        estimatedArrival: res.data.estimatedArrival,
      };
    } catch (error) {
      // Handle insufficient balance specifically
      if (error.response?.status === 400 && error.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        throw {
          code: 'INSUFFICIENT_BALANCE' as const,
          message: 'Insufficient balance. Please ensure you have enough funds for this payout.',
        };
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get full merchant wallet state (balance + recent transactions)
   */
  async getMerchantWallet(merchantId: string): Promise<MerchantWalletState> {
    const state: MerchantWalletState = {
      balance: null,
      transactions: [],
      loading: true,
      error: null,
      lastUpdated: null,
    };

    try {
      const [balance, transactions] = await Promise.all([
        this.getMerchantBalance(merchantId),
        this.getMerchantTransactions(merchantId, { limit: 20 }),
      ]);

      state.balance = balance ? {
        available: balance.available || 0,
        pending: balance.pending || 0,
        total: balance.total || 0,
        currency: balance.currency || 'INR',
      } : null;
      state.transactions = transactions;
      state.lastUpdated = new Date();
    } catch (error) {
      state.error = error;
    } finally {
      state.loading = false;
    }

    return state;
  }

  /**
   * Get merchant wallet with loading state and pull-to-refresh support
   */
  async getMerchantWalletWithState(
    merchantId: string,
    setState?: (state: MerchantWalletState & { refreshing: boolean }) => void
  ): Promise<MerchantWalletState> {
    if (setState) {
      setState({
        balance: null,
        transactions: [],
        loading: true,
        error: null,
        lastUpdated: null,
        refreshing: false,
      });
    }

    const state: MerchantWalletState = {
      balance: null,
      transactions: [],
      loading: true,
      error: null,
      lastUpdated: null,
    };

    try {
      const [balance, transactions] = await Promise.all([
        this.getMerchantBalance(merchantId),
        this.getMerchantTransactions(merchantId, { limit: 20 }),
      ]);

      state.balance = balance ? {
        available: balance.available || 0,
        pending: balance.pending || 0,
        total: balance.total || 0,
        currency: balance.currency || 'INR',
      } : null;
      state.transactions = transactions;
      state.lastUpdated = new Date();
    } catch (error) {
      state.error = this.handleError(error);
      showNetworkErrorToast();
    } finally {
      state.loading = false;
      if (setState) {
        setState({ ...state, refreshing: false });
      }
    }

    return state;
  }

  /**
   * Pull to refresh wallet data
   */
  async refreshWallet(
    merchantId: string,
    setState?: (state: MerchantWalletState & { refreshing: boolean }) => void
  ): Promise<MerchantWalletState> {
    if (setState) {
      setState((prev) => ({ ...prev, refreshing: true }));
    }

    const state: MerchantWalletState = {
      balance: null,
      transactions: [],
      loading: false,
      error: null,
      lastUpdated: null,
    };

    try {
      const [balance, transactions] = await Promise.all([
        this.getMerchantBalance(merchantId),
        this.getMerchantTransactions(merchantId, { limit: 20 }),
      ]);

      state.balance = balance ? {
        available: balance.available || 0,
        pending: balance.pending || 0,
        total: balance.total || 0,
        currency: balance.currency || 'INR',
      } : null;
      state.transactions = transactions;
      state.lastUpdated = new Date();
      showSuccessToast('Wallet Refreshed');
    } catch (error) {
      state.error = this.handleError(error);
      showErrorToast('Refresh Failed', 'Could not refresh wallet data');
    } finally {
      if (setState) {
        setState({ ...state, refreshing: false });
      }
    }

    return state;
  }

  /**
   * Check if merchant has sufficient balance for a payout
   */
  async hasSufficientBalance(merchantId: string, amount: number): Promise<boolean> {
    try {
      const balance = await this.getMerchantBalance(merchantId);
      if (!balance) return false;
      return balance.available >= amount;
    } catch {
      return false;
    }
  }

  /**
   * Get payout methods available for merchant
   */
  async getPayoutMethods(merchantId: string): Promise<{ method: string; enabled: boolean }[]> {
    try {
      const res = await this.client.get(`/merchant/${merchantId}/payout-methods`);
      return res.data.methods || [];
    } catch {
      // Return default methods if endpoint not available
      return [
        { method: 'bank', enabled: true },
        { method: 'upi', enabled: true },
      ];
    }
  }

  /**
   * Get pending payouts for merchant
   */
  async getPendingPayouts(merchantId: string): Promise<unknown[]> {
    try {
      const res = await this.client.get(`/merchant/${merchantId}/payouts/pending`);
      return res.data.payouts || [];
    } catch {
      return [];
    }
  }

  /**
   * Get payout history for merchant
   */
  async getPayoutHistory(
    merchantId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<unknown[]> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const queryString = params.toString();
      const url = `/merchant/${merchantId}/payouts${queryString ? `?${queryString}` : ''}`;

      const res = await this.client.get(url);
      return res.data.payouts || [];
    } catch {
      return [];
    }
  }

  /**
   * Error handler for wallet operations
   */
  private handleError(error): WalletError {
    if (error.code) {
      return error; // Already a WalletError
    }

    if (!error.response) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to wallet service. Please check your internet connection.',
      };
    }

    switch (error.response.status) {
      case 400:
        return {
          code: error.response.data?.code || 'INVALID_AMOUNT',
          message: error.response.data?.message || 'Invalid request to wallet service.',
        };
      case 401:
        return {
          code: 'NETWORK_ERROR',
          message: 'Authentication expired. Please log in again.',
        };
      case 403:
        return {
          code: 'NETWORK_ERROR',
          message: 'Access denied to wallet service.',
        };
      case 500:
      case 503:
      default:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Wallet service is temporarily unavailable. Please try again later.',
        };
    }
  }
}

// ─── Unified API Client ────────────────────────────────────────────────────────

class UnifiedApiClient {
  auth = new AuthClient();
  profile = new ProfileClient();
  wallet = new WalletClient();

  setToken(token: string) {
    this.auth.setToken(token);
    this.profile.setToken(token);
    this.wallet.setToken(token);
  }

  async getUserState(userId: string) {
    const [profile] = await Promise.all([
      this.profile.getProfile(userId),
    ]);

    return {
      auth: { id: userId, phone: '', role: '' },
      profile,
    };
  }
}

export const unifiedApi = new UnifiedApiClient();
export default unifiedApi;
