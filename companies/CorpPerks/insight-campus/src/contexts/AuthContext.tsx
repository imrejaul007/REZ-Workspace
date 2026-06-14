'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const REZ_AUTH_URL = process.env.NEXT_PUBLIC_REZ_AUTH_URL || 'https://rez-auth-service.onrender.com';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  course?: string;
  year?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; phone: string; password: string; college?: string }) => Promise<{ success: boolean; error?: string }>;
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
    const token = localStorage.getItem('insight_token');
    const storedUser = localStorage.getItem('insight_user');

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
          localStorage.removeItem('insight_token');
          localStorage.removeItem('insight_user');
        }
      } catch {
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

      localStorage.setItem('insight_token', data.token);
      localStorage.setItem('insight_user', JSON.stringify(data.user));

      setUser(data.user);
      router.push('/dashboard');

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
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
    } catch {
      return { success: false, error: 'Network error' };
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

      localStorage.setItem('insight_token', data.token);
      localStorage.setItem('insight_user', JSON.stringify(data.user));

      setUser(data.user);
      router.push('/dashboard');

      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; college?: string }) => {
    try {
      const res = await fetch(`${REZ_AUTH_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role: 'student' }),
      });

      const response = await res.json();

      if (!res.ok) {
        return { success: false, error: response.error || 'Registration failed' };
      }

      localStorage.setItem('insight_token', response.token);
      localStorage.setItem('insight_user', JSON.stringify(response.user));

      setUser(response.user);
      router.push('/dashboard');

      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('insight_token');
    localStorage.removeItem('insight_user');
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
