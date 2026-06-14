import logger from './utils/logger';

/**
 * RABTUL Auth Integration for Dashboard
 * Connects to RABTUL Auth Service (Port 4002)
 */

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com'

export interface User {
  id: string
  phone: string
  email?: string
  name?: string
  role: 'admin' | 'manager' | 'staff' | 'owner'
  merchantId?: string
  storeIds?: string[]
  permissions: string[]
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
}

const AUTH_STORAGE_KEY = 'rez_merchant_auth'

export class AuthService {
  /**
   * Get current auth state from localStorage
   */
  static getAuthState(): AuthState {
    if (typeof window === 'undefined') {
      return { isAuthenticated: false, user: null, token: null, isLoading: false }
    }

    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!stored) {
        return { isAuthenticated: false, user: null, token: null, isLoading: false }
      }

      const { token, user, expiresAt } = JSON.parse(stored)

      // Check expiration
      if (new Date(expiresAt) < new Date()) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        return { isAuthenticated: false, user: null, token: null, isLoading: false }
      }

      return { isAuthenticated: true, user, token, isLoading: false }
    } catch {
      return { isAuthenticated: false, user: null, token: null, isLoading: false }
    }
  }

  /**
   * Get stored token
   */
  static getToken(): string | null {
    const state = this.getAuthState()
    return state.token
  }

  /**
   * Get auth headers for API calls
   */
  static getAuthHeaders(): HeadersInit {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  /**
   * Send OTP to phone
   */
  static async sendOTP(phone: string): Promise<{ success: boolean; error?: string; otp?: string }> {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/user/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
        signal: AbortSignal.timeout(10000)
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.message || 'Failed to send OTP' }
      }

      // In dev mode, OTP is returned
      if (process.env.NODE_ENV === 'development' && data.data?.otp) {
        logger.info(`[DEV] OTP: ${data.data.otp}`)
        return { success: true, otp: data.data.otp }
      }

      return { success: true }
    } catch (error) {
      console.error('Send OTP error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(
    phone: string,
    otp: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/user/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
        signal: AbortSignal.timeout(10000)
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.message || 'Invalid OTP' }
      }

      const user = this.mapUser(data.data.user || { phone, id: data.data.userId })
      const token = data.data.accessToken

      // Store auth state
      this.storeAuth(user, token, data.data.expiresAt)

      return { success: true, user }
    } catch (error) {
      console.error('Verify OTP error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Login with credentials (for admin/owner)
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/user/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000)
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.message || 'Login failed' }
      }

      const user = this.mapUser(data.data.user)
      const token = data.data.accessToken

      this.storeAuth(user, token, data.data.expiresAt)

      return { success: true, user }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  /**
   * Verify current session
   */
  static async verifySession(): Promise<{ success: boolean; user?: User }> {
    const token = this.getToken()
    if (!token) {
      return { success: false }
    }

    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/user/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        this.logout()
        return { success: false }
      }

      const data = await response.json()
      const user = this.mapUser(data.data)

      // Update stored user
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          ...parsed,
          user
        }))
      }

      return { success: true, user }
    } catch {
      // Network error - assume session is still valid
      return { success: true, user: this.getAuthState().user || undefined }
    }
  }

  /**
   * Logout
   */
  static logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY)

    // Call logout API if we have a token
    const token = this.getToken()
    if (token) {
      fetch(`${AUTH_SERVICE_URL}/user/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }
  }

  /**
   * Check permission
   */
  static hasPermission(permission: string): boolean {
    const state = this.getAuthState()
    if (!state.user) return false
    return state.user.permissions.includes(permission) || state.user.role === 'admin'
  }

  /**
   * Check role
   */
  static hasRole(roles: string[]): boolean {
    const state = this.getAuthState()
    if (!state.user) return false
    return roles.includes(state.user.role)
  }

  /**
   * Store auth data
   */
  private static storeAuth(user: User, token: string, expiresAt?: string): void {
    const expiry = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      user,
      token,
      expiresAt: expiry
    }))
  }

  /**
   * Map API user to our User type
   */
  private static mapUser(data: Record<string, unknown>): User {
    return {
      id: String(data.id || data.userId || data._id),
      phone: String(data.phone || ''),
      email: data.email ? String(data.email) : undefined,
      name: data.name ? String(data.name) : undefined,
      role: (data.role as User['role']) || 'staff',
      merchantId: data.merchantId ? String(data.merchantId) : undefined,
      storeIds: data.storeIds as string[] || [],
      permissions: (data.permissions as string[]) || this.getDefaultPermissions(data.role as string)
    }
  }

  /**
   * Default permissions by role
   */
  private static getDefaultPermissions(role: string): string[] {
    const base = ['view:dashboard', 'view:orders']

    switch (role) {
      case 'owner':
      case 'admin':
        return [...base, 'manage:all', 'view:reports', 'manage:staff', 'manage:menu', 'manage:settings']
      case 'manager':
        return [...base, 'view:reports', 'manage:menu', 'manage:orders']
      case 'staff':
        return [...base, 'manage:orders']
      default:
        return base
    }
  }
}

// React hook for auth
export function useAuth() {
  const [state, setState] = useState<AuthState>(AuthService.getAuthState())

  const refresh = useCallback(async () => {
    const verified = await AuthService.verifySession()
    if (verified.success) {
      setState({ ...AuthService.getAuthState(), isLoading: false })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true }))
    const result = await AuthService.login(email, password)
    if (result.success) {
      setState({ isAuthenticated: true, user: result.user!, token: AuthService.getToken(), isLoading: false })
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
    return result
  }, [])

  const logout = useCallback(() => {
    AuthService.logout()
    setState({ isAuthenticated: false, user: null, token: null, isLoading: false })
  }, [])

  return { ...state, refresh, login, logout, hasPermission: AuthService.hasPermission, hasRole: AuthService.hasRole }
}

// Need these imports
import { useState, useCallback } from 'react'

export default AuthService
