'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RESTAURANT' | 'EMPLOYEE' | 'VENDOR' | 'USER';
  avatar?: string;
  verified?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'restauranthub_token';
const REFRESH_TOKEN_KEY = 'restauranthub_refresh_token';

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          setAuthState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Validate token and get user info
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          setAuthState({
            user,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          // Token is invalid, remove it
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    initAuth();
  }, []);

  // Set up token refresh
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();

      // Store tokens
      localStorage.setItem(TOKEN_KEY, data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      }

      // Update auth state
      setAuthState({
        user: data.user,
        loading: false,
        isAuthenticated: true,
      });

      // Redirect based on user role
      const redirectPath = getRoleBasedRedirect(data.user.role);
      router.push(redirectPath);
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        // Call logout endpoint
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);

      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      // Clear all cached queries
      queryClient.clear();

      // Redirect to login
      router.push('/auth/login');
    }
  };

  const refreshAuth = async (): Promise<void> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);

    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }

    // Update user data if provided
    if (data.user) {
      setAuthState(prev => ({
        ...prev,
        user: data.user,
      }));
    }
  };

  const updateUser = (userUpdate: Partial<User>): void => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userUpdate } : null,
    }));
  };

  const getRoleBasedRedirect = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'RESTAURANT':
        return '/restaurant/dashboard';
      case 'EMPLOYEE':
        return '/restaurant/dashboard';
      case 'VENDOR':
        return '/marketplace';
      default:
        return '/dashboard';
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/auth/login');
          return;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [loading, isAuthenticated, user, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}