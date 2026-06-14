import { toast } from 'react-hot-toast';

// Route through Next.js proxy in the browser to avoid CORS
const API_BASE_URL = typeof window !== 'undefined'
  ? '/api/proxy'
  : (() => {
      const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      return raw.includes('/api/v1') ? raw : `${raw.replace(/\/$/, '')}/api/v1`;
    })();

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  role: string;
  twoFactorToken?: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    isVerified: boolean;
    twoFactorEnabled: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

interface SignupRequest {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string;
  // Role-specific fields
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantCity?: string;
  restaurantState?: string;
  fssaiNumber?: string;
  gstNumber?: string;
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  panNumber?: string;
  skills?: string;
  experience?: string;
  fullName?: string;
  deliveryAddress?: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

class AuthApiClient {
  private static instance: AuthApiClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  private constructor() {
    // Initialize tokens from server-side rendered cookies if available
    if (typeof window !== 'undefined') {
      this.loadTokensFromStorage();
    }
  }

  public static getInstance(): AuthApiClient {
    if (!AuthApiClient.instance) {
      AuthApiClient.instance = new AuthApiClient();
    }
    return AuthApiClient.instance;
  }

  private loadTokensFromStorage() {
    // For security, we can't read httpOnly cookies from JavaScript
    // Instead, we'll use a separate endpoint to check auth status
    // For now, keep minimal session info in sessionStorage
    try {
      const sessionData = sessionStorage.getItem('authSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Only store non-sensitive session indicators
        if (session.authenticated && session.expiresAt > Date.now()) {
          // We don't store actual tokens here, just auth status
          // Tokens are in httpOnly cookies and handled by the server
        } else {
          sessionStorage.removeItem('authSession');
        }
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
      sessionStorage.removeItem('authSession');
    }
  }

  private setSessionData(expiresIn: number) {
    // Store minimal session info in sessionStorage (not tokens)
    const sessionData = {
      authenticated: true,
      expiresAt: Date.now() + (expiresIn * 1000),
      timestamp: Date.now()
    };
    sessionStorage.setItem('authSession', JSON.stringify(sessionData));
  }

  private clearSessionData() {
    sessionStorage.removeItem('authSession');
    localStorage.removeItem('user');
    this.accessToken = null;
    this.refreshToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = false
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include httpOnly cookies in requests
      });

      // Handle token refresh for 401 errors
      if (response.status === 401 && requiresAuth) {
        const refreshed = await this.handleTokenRefresh();
        if (refreshed) {
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          // Refresh failed, redirect to login
          this.clearSessionData();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return { error: 'Session expired' };
        }
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // If 401 and we couldn't refresh, clear session
        if (response.status === 401) {
          this.clearSessionData();
        }
        return {
          error: data?.message || data?.error || `HTTP ${response.status}`,
        };
      }

      return { data };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      // Read the refresh token from localStorage (set by auth-provider after login)
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;

      if (!refreshToken) {
        this.clearSessionData();
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        // Refresh failed, clear session
        this.clearSessionData();
        return false;
      }

      const data: RefreshTokenResponse = await response.json();
      this.setSessionData(data.expiresIn);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearSessionData();
      return false;
    }
  }

  // Note: Tokens are now handled by the server via httpOnly cookies
  // This method is kept for backward compatibility but doesn't store tokens
  private handleTokenResponse(expiresIn: number) {
    // Store session info (not actual tokens)
    this.setSessionData(expiresIn);
  }

  // Public API methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      // Handle session data (tokens are now in httpOnly cookies set by server)
      this.handleTokenResponse(response.data.expiresIn);

      // Store user info in localStorage for quick access
      const userInfo = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
        name: `${response.data.user.profile.firstName} ${response.data.user.profile.lastName}`,
        verified: response.data.user.isVerified,
        twoFactorEnabled: response.data.user.twoFactorEnabled,
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
    }

    return response;
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data) {
      // Handle session data (tokens are now in httpOnly cookies set by server)
      this.handleTokenResponse(response.data.expiresIn);

      const userInfo = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
        name: `${response.data.user.profile.firstName} ${response.data.user.profile.lastName}`,
        verified: response.data.user.isVerified,
        twoFactorEnabled: response.data.user.twoFactorEnabled,
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
    }

    return response;
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }, true);

    // Clear session data regardless of response
    this.clearSessionData();

    return response;
  }

  async logoutAll(): Promise<ApiResponse<{ message: string }>> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ logoutAll: true }),
    }, true);

    this.clearSessionData();

    return response;
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }, true);
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    }, true);
  }

  // 2FA Methods
  async generate2FASecret(): Promise<ApiResponse<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  }>> {
    return this.request<{
      secret: string;
      qrCodeUrl: string;
      manualEntryKey: string;
    }>('/auth/2fa/generate', {
      method: 'POST',
    }, true);
  }

  async enable2FA(token: string): Promise<ApiResponse<{
    enabled: boolean;
    backupCodes: string[];
  }>> {
    return this.request<{
      enabled: boolean;
      backupCodes: string[];
    }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true);
  }

  async disable2FA(token: string): Promise<ApiResponse<{ disabled: boolean }>> {
    return this.request<{ disabled: boolean }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true);
  }

  async verify2FAToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.request<{ valid: boolean }>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }, true);
  }

  // Session management
  async getSessions(): Promise<ApiResponse<Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    ipAddress: string;
    userAgent: string;
  }>>> {
    return this.request<Array<{
      id: string;
      createdAt: string;
      expiresAt: string;
      ipAddress: string;
      userAgent: string;
    }>>('/auth/sessions', {
      method: 'GET',
    }, true);
  }

  async revokeSession(sessionId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    }, true);
  }

  // Utility methods
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // Check sessionStorage (legacy AuthApiClient session indicator)
      const sessionData = sessionStorage.getItem('authSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.authenticated && session.expiresAt > Date.now()) {
          return true;
        }
      }

      // Also check localStorage — auth-provider stores the access token there
      return !!localStorage.getItem('accessToken');
    } catch {
      return false;
    }
  }

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      // Check sessionStorage first for legacy AuthApiClient sessions
      const sessionData = sessionStorage.getItem('authSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.authenticated && session.expiresAt > Date.now() && session.accessToken) {
          return session.accessToken;
        }
      }
      // Fall back to localStorage where auth-provider stores the token
      return localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  }

  // Add method to check auth status with backend
  async checkAuthStatus(): Promise<ApiResponse<{ authenticated: boolean; user?: unknown }>> {
    return this.request<{ authenticated: boolean; user?: unknown }>('/auth/me', {
      method: 'GET',
    }, true);
  }
}

export const authApi = AuthApiClient.getInstance();
export default authApi;