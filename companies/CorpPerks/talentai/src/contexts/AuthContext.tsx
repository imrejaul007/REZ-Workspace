'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const REZ_AUTH_URL = process.env.NEXT_PUBLIC_REZ_AUTH_URL || 'https://rez-auth-service.onrender.com';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'candidate' | 'employer';
  company?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; phone: string; password: string; role: 'candidate' | 'employer'; company?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('talentai_token');
    const storedUser = localStorage.getItem('talentai_user');

    if (token && storedUser) {
      try {
        const res = await fetch(`${REZ_AUTH_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('talentai_token');
          localStorage.removeItem('talentai_user');
        }
      } catch (err) {
        // On network error during verify, still allow cached user but log warning
        logger.warn('[Auth] Token verify failed, using cached user:', err instanceof Error ? err.message : err);
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${REZ_AUTH_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('talentai_token', data.token);
      localStorage.setItem('talentai_user', JSON.stringify(data.user));

      setUser(data.user);
      router.push(data.user.role === 'employer' ? '/employer' : '/dashboard');

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error. Please try again.';
      logger.error('[Auth] Login failed:', message);
      return { success: false, error: message };
    }
  };

  const loginWithPhone = async (phone: string) => {
    try {
      const res = await fetch(`${REZ_AUTH_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        return { success: false, error: 'Failed to send OTP' };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      logger.error('[Auth] LoginWithPhone failed:', message);
      return { success: false, error: message };
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      const res = await fetch(`${REZ_AUTH_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid OTP' };
      }

      localStorage.setItem('talentai_token', data.token);
      localStorage.setItem('talentai_user', JSON.stringify(data.user));

      setUser(data.user);
      router.push(data.user.role === 'employer' ? '/employer' : '/dashboard');

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      logger.error('[Auth] VerifyOTP failed:', message);
      return { success: false, error: message };
    }
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; role: 'candidate' | 'employer'; company?: string }) => {
    try {
      const res = await fetch(`${REZ_AUTH_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const response = await res.json();

      if (!res.ok) {
        return { success: false, error: response.error || 'Registration failed' };
      }

      localStorage.setItem('talentai_token', response.token);
      localStorage.setItem('talentai_user', JSON.stringify(response.user));

      setUser(response.user);
      router.push(data.role === 'employer' ? '/employer' : '/dashboard');

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      logger.error('[Auth] Register failed:', message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('talentai_token');
    localStorage.removeItem('talentai_user');
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithPhone, verifyOTP, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
