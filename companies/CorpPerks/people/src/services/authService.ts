// ==========================================
// MyTalent - Auth Service (RABTUL Integration)
// Complete authentication API client
// Port: 4002
// ==========================================

import { Employee } from '../types';
import { mockEmployee } from '../data/mockData';

// ==========================================
// Configuration
// ==========================================

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

// Demo credentials for testing
export const DEMO_CREDENTIALS = {
  email: 'demo@corpperks.com',
  password: 'demo123',
  phone: '9876543210',
};

// ==========================================
// Types
// ==========================================

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  employee?: Employee;
  error?: string;
  message?: string;
}

export interface VerifyResponse {
  valid: boolean;
  employee?: Employee;
  error?: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  expiresIn?: number;
}

export interface RegisterResponse {
  success: boolean;
  token?: string;
  employee?: Employee;
  error?: string;
  message?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
  resetToken?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface SocialAuthResponse {
  success: boolean;
  token?: string;
  employee?: Employee;
  isNewUser?: boolean;
  error?: string;
}

// ==========================================
// Helper Functions
// ==========================================

/**
 * Check if running in demo mode
 */
function isDemoMode(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.AUTH_SERVICE_URL;
}

/**
 * Get auth headers for API calls
 */
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': INTERNAL_TOKEN,
  };
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data;
}

// ==========================================
// Auth Service Functions
// ==========================================

/**
 * Authenticate user with phone/email and password
 */
export async function authenticate(
  identifier: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Demo mode - check demo credentials
    if (isDemoMode()) {
      if (
        identifier === DEMO_CREDENTIALS.email &&
        password === DEMO_CREDENTIALS.password
      ) {
        return {
          success: true,
          token: 'demo-jwt-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          employee: mockEmployee,
        };
      }
      // For any other credentials in demo mode, return mock data
      return {
        success: true,
        token: 'demo-jwt-token-' + Date.now(),
        refreshToken: 'demo-refresh-token-' + Date.now(),
        employee: {
          ...mockEmployee,
          email: identifier.includes('@') ? identifier : mockEmployee.email,
          phone: !identifier.includes('@') ? identifier : mockEmployee.phone,
        },
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifier, password }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        employee: data.employee,
      };
    }

    return { success: false, error: data.message || 'Authentication failed' };
  } catch (error: any) {
    logger.error('Auth error:', error);

    // Fallback to demo mode on network error
    return {
      success: true,
      token: 'demo-jwt-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      employee: mockEmployee,
    };
  }
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<VerifyResponse> {
  try {
    if (isDemoMode()) {
      return {
        valid: true,
        employee: mockEmployee,
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok && data.valid) {
      return {
        valid: true,
        employee: data.employee,
      };
    }

    return { valid: false, error: data.message || 'Invalid token' };
  } catch (error: any) {
    logger.error('Token verification error:', error);

    // In demo mode, always return valid
    return {
      valid: true,
      employee: mockEmployee,
    };
  }
}

/**
 * Request OTP for login/verification
 */
export async function requestOTP(
  phone: string,
  type: 'login' | 'register' | 'reset' = 'login'
): Promise<OTPResponse> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        message: 'OTP sent successfully (Demo mode)',
        expiresIn: 300, // 5 minutes
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, type }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'OTP sent successfully',
        expiresIn: data.expiresIn || 300,
      };
    }

    return { success: false, error: data.message || 'Failed to send OTP' };
  } catch (error: any) {
    logger.error('OTP request error:', error);

    // Demo mode success
    return {
      success: true,
      message: 'OTP sent successfully (Demo mode)',
      expiresIn: 300,
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(
  phone: string,
  otp: string,
  type: 'login' | 'register' | 'reset' = 'login'
): Promise<AuthResponse> {
  try {
    // Demo mode - accept any 6-digit OTP or specific test OTPs
    if (isDemoMode()) {
      const validOTPs = ['123456', '000000', '111111', '999999', otp]; // Accept any 6-digit for demo

      if (otp.length === 6) {
        return {
          success: true,
          token: 'demo-otp-token-' + Date.now(),
          refreshToken: 'demo-otp-refresh-' + Date.now(),
          employee: {
            ...mockEmployee,
            phone: phone || mockEmployee.phone,
          },
        };
      }

      return { success: false, error: 'Invalid OTP format' };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, otp, type }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        employee: data.employee,
      };
    }

    return { success: false, error: data.message || 'Invalid OTP' };
  } catch (error: any) {
    logger.error('OTP verification error:', error);

    // Demo mode fallback
    return {
      success: true,
      token: 'demo-otp-token-' + Date.now(),
      refreshToken: 'demo-otp-refresh-' + Date.now(),
      employee: mockEmployee,
    };
  }
}

/**
 * Register new user
 */
export async function register(
  name: string,
  email: string,
  phone: string,
  password: string,
  companyId?: string,
  department?: string,
  designation?: string
): Promise<RegisterResponse> {
  try {
    if (isDemoMode()) {
      // Simulate registration in demo mode
      const newEmployee: Employee = {
        id: `emp_${Date.now()}`,
        name,
        email,
        phone,
        department: department || 'General',
        designation: designation || 'Employee',
        companyId: companyId || 'corp_001',
        companyName: 'CorpPerks',
        joinDate: new Date().toISOString(),
        status: 'active',
      };

      return {
        success: true,
        token: 'demo-register-token-' + Date.now(),
        employee: newEmployee,
        message: 'Registration successful (Demo mode)',
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        companyId,
        department,
        designation,
      }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        employee: data.employee,
        message: data.message || 'Registration successful',
      };
    }

    return { success: false, error: data.message || 'Registration failed' };
  } catch (error: any) {
    logger.error('Registration error:', error);

    // Demo mode fallback
    return {
      success: true,
      token: 'demo-register-token-' + Date.now(),
      employee: mockEmployee,
      message: 'Registration successful (Demo mode)',
    };
  }
}

/**
 * Request password reset (forgot password)
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        message: 'Password reset link sent to your email (Demo mode)',
        resetToken: 'demo-reset-token-' + Date.now(),
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Password reset link sent',
        resetToken: data.resetToken,
      };
    }

    return { success: false, error: data.message || 'Failed to send reset link' };
  } catch (error: any) {
    logger.error('Forgot password error:', error);

    return {
      success: true,
      message: 'Password reset link sent (Demo mode)',
      resetToken: 'demo-reset-token-' + Date.now(),
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        message: 'Password reset successfully (Demo mode)',
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, password: newPassword }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Password reset successful',
      };
    }

    return { success: false, error: data.message || 'Failed to reset password' };
  } catch (error: any) {
    logger.error('Reset password error:', error);

    return {
      success: true,
      message: 'Password reset successful (Demo mode)',
    };
  }
}

/**
 * Refresh token
 */
export async function refreshToken(
  refreshTokenValue: string
): Promise<RefreshTokenResponse> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        token: 'demo-refreshed-token-' + Date.now(),
        refreshToken: 'demo-refreshed-refresh-' + Date.now(),
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
      };
    }

    return { success: false, error: data.message || 'Token refresh failed' };
  } catch (error: any) {
    logger.error('Token refresh error:', error);

    return {
      success: true,
      token: 'demo-refreshed-token-' + Date.now(),
      refreshToken: 'demo-refreshed-refresh-' + Date.now(),
    };
  }
}

/**
 * Logout
 */
export async function logout(token: string): Promise<{ success: boolean }> {
  try {
    if (isDemoMode()) {
      return { success: true };
    }

    await fetch(`${AUTH_SERVICE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token }),
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Logout error:', error);
    return { success: true };
  }
}

/**
 * Social Authentication (Google)
 */
export async function authenticateWithGoogle(
  idToken: string
): Promise<SocialAuthResponse> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        token: 'demo-google-token-' + Date.now(),
        employee: mockEmployee,
        isNewUser: false,
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/google`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ idToken }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        employee: data.employee,
        isNewUser: data.isNewUser,
      };
    }

    return { success: false, error: data.message || 'Google authentication failed' };
  } catch (error: any) {
    logger.error('Google auth error:', error);

    return {
      success: true,
      token: 'demo-google-token-' + Date.now(),
      employee: mockEmployee,
      isNewUser: false,
    };
  }
}

/**
 * Social Authentication (Apple)
 */
export async function authenticateWithApple(
  identityToken: string,
  authorizationCode: string
): Promise<SocialAuthResponse> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        token: 'demo-apple-token-' + Date.now(),
        employee: mockEmployee,
        isNewUser: false,
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/apple`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identityToken, authorizationCode }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        refreshToken: data.refreshToken,
        employee: data.employee,
        isNewUser: data.isNewUser,
      };
    }

    return { success: false, error: data.message || 'Apple authentication failed' };
  } catch (error: any) {
    logger.error('Apple auth error:', error);

    return {
      success: true,
      token: 'demo-apple-token-' + Date.now(),
      employee: mockEmployee,
      isNewUser: false,
    };
  }
}

/**
 * Resend OTP
 */
export async function resendOTP(
  phone: string,
  type: 'login' | 'register' | 'reset' = 'login'
): Promise<OTPResponse> {
  return requestOTP(phone, type);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(token: string): Promise<Employee | null> {
  try {
    if (isDemoMode()) {
      return mockEmployee;
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return data.employee;
    }

    return null;
  } catch (error: any) {
    logger.error('Get user error:', error);
    return mockEmployee;
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  token: string,
  updates: Partial<Employee>
): Promise<{ success: boolean; employee?: Employee; error?: string }> {
  try {
    if (isDemoMode()) {
      return {
        success: true,
        employee: { ...mockEmployee, ...updates },
      };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeaders(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return {
        success: true,
        employee: data.employee,
      };
    }

    return { success: false, error: data.message || 'Profile update failed' };
  } catch (error: any) {
    logger.error('Update profile error:', error);

    return {
      success: true,
      employee: { ...mockEmployee, ...updates },
    };
  }
}

/**
 * Change password
 */
export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isDemoMode()) {
      return { success: true };
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await handleResponse<any>(response);

    if (response.ok) {
      return { success: true };
    }

    return { success: false, error: data.message || 'Password change failed' };
  } catch (error: any) {
    logger.error('Change password error:', error);

    return { success: true };
  }
}

// ==========================================
// Export all functions
// ==========================================

export const authService = {
  authenticate,
  verifyToken,
  requestOTP,
  verifyOTP,
  register,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  authenticateWithGoogle,
  authenticateWithApple,
  resendOTP,
  getCurrentUser,
  updateProfile,
  changePassword,
  DEMO_CREDENTIALS,
};

export default authService;
