'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken } from '@/lib/karmaApi';

interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user?: UserProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseJWT(token: string): UserProfile | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      userId: payload.sub || payload.userId || payload.id || '',
      firstName: payload.firstName || payload.first_name || payload.given_name,
      lastName: payload.lastName || payload.last_name || payload.family_name,
      email: payload.email,
      avatar: payload.avatar || payload.picture,
      phoneNumber: payload.phoneNumber || payload.phone,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Read token from localStorage on mount (async)
    getToken().then((token) => {
      if (token) {
        const user = parseJWT(token);
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });
  }, []);

  const login = useCallback((token: string, user?: UserProfile) => {
    setToken(token);
    const parsedUser = user || parseJWT(token);
    setState({
      user: parsedUser,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((userData: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
