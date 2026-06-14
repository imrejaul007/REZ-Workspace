'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types/auth';
import { authApi } from '@/lib/api/auth';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: string, twoFactorToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Environment-controlled mock authentication (development only with explicit flag)
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
        console.warn('⚠️ MOCK AUTH ACTIVE - Development mode only');
        const mockUser: User = {
          id: 'mock-user-dev-' + Date.now(),
          email: 'dev@restauranthub.local',
          role: UserRole.RESTAURANT,
          isVerified: true,
          isActive: true,
          profile: {
            id: 'profile-1',
            userId: 'mock-user-1',
            firstName: 'Dev',
            lastName: 'User',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUser(mockUser);
        setLoading(false);
        return;
      }

      // Production authentication flow
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      // Re-sync the middleware-readable cookie in case it was lost (e.g. browser restart)
      document.cookie = `accessToken=${token}; path=/; max-age=604800; SameSite=Lax`;
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      document.cookie = 'accessToken=; path=/; max-age=0';
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role?: string, twoFactorToken?: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password, role, twoFactorToken);

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Set cookie so Next.js middleware can read the token (middleware has no localStorage access)
      document.cookie = `accessToken=${response.accessToken}; path=/; max-age=604800; SameSite=Lax`;
      
      setUser(response.user);
      
      // Redirect based on user role
      const redirectPath = getDashboardPath(response.user.role);
      router.push(redirectPath);
      
      toast.success('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Clear the middleware-readable cookie on logout
      document.cookie = 'accessToken=; path=/; max-age=0';
      setUser(null);
      router.push('/auth/login');
      toast.success('Logged out successfully');
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await authApi.refreshToken(refresh);
      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const getDashboardPath = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.RESTAURANT:
        return '/restaurant/dashboard';
      case UserRole.EMPLOYEE:
        return '/employee/dashboard';
      case UserRole.VENDOR:
        return '/vendor/dashboard';
      default:
        return '/dashboard';
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoading,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!user,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Optional auth hook that doesn't throw error if no provider
export function useOptionalAuth() {
  const context = useContext(AuthContext);
  return context || {
    user: null,
    loading: false,
    isLoading: false,
    login: async () => {},
    logout: async () => {},
    refreshToken: async () => {},
    isAuthenticated: false,
    hasRole: () => false,
  };
}