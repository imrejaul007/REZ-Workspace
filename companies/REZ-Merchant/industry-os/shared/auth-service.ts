/**
 * REZ Merchant Authentication Service
 * Provides auth hooks and utilities for admin portals
 */

import { apiService } from './api-service';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Mock user for demo (replace with actual API call)
const MOCK_USER: User = {
  id: 'usr_001',
  email: 'admin@rez.money',
  name: 'Admin User',
  role: 'admin',
  permissions: ['read', 'write', 'delete'],
};

class AuthService {
  private user: User | null = null;
  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor() {
    // Check localStorage on init
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rez_auth_token');
      if (stored) {
        this.user = MOCK_USER;
      }
    }
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state: AuthState = {
      user: this.user,
      isAuthenticated: !!this.user,
      isLoading: false,
    };
    this.listeners.forEach(listener => listener(state));
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Replace with actual API call
      const response = await apiService.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      });

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        this.user = response.data.user;
        apiService.setToken(response.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('rez_auth_token', response.data.token);
        }
        this.notify();
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials' };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }

  logout() {
    this.user = null;
    apiService.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rez_auth_token');
    }
    this.notify();
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }

  hasPermission(permission: string): boolean {
    return this.user?.permissions.includes(permission) ?? false;
  }

  // Demo login for development
  demoLogin() {
    this.user = MOCK_USER;
    if (typeof window !== 'undefined') {
      localStorage.setItem('rez_auth_token', 'demo_token');
    }
    this.notify();
    return { success: true };
  }
}

// Export singleton
export const authService = new AuthService();

// React hook for auth state
export function useAuth() {
  const [state, setState] = React.useState<AuthState>({
    user: authService.getUser(),
    isAuthenticated: authService.isAuthenticated(),
    isLoading: false,
  });

  React.useEffect(() => {
    return authService.subscribe(setState);
  }, []);

  return {
    ...state,
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    hasPermission: authService.hasPermission.bind(authService),
  };
}

// Import React for the hook
import React from 'react';

// Protected route wrapper
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  return <>{children}</>;
}

// Role-based access control
export function withRole(role: string) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return function RoleWrapper(props: P) {
      const { user } = useAuth();
      if (user?.role !== role) {
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          </div>
        );
      }
      return <Component {...props} />;
    };
  };
}