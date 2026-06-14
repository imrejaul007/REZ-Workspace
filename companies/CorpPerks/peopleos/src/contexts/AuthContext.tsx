'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const REZ_AUTH_URL = process.env.NEXT_PUBLIC_REZ_AUTH_URL || 'https://rez-auth-service.onrender.com';

interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  department: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<void>;
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
    const token = localStorage.getItem('peopleos_token');
    const storedUser = localStorage.getItem('peopleos_user');

    if (token && storedUser) {
      try {
        const res = await fetch(`${REZ_AUTH_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('peopleos_token');
          localStorage.removeItem('peopleos_user');
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

      localStorage.setItem('peopleos_token', data.token);
      localStorage.setItem('peopleos_user', JSON.stringify(data.user));

      setUser(data.user);
      router.push('/dashboard');

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('peopleos_token');
    localStorage.removeItem('peopleos_user');
    setUser(null);
    router.push('/auth/login');
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('peopleos_token');
    if (!token) return;

    try {
      const res = await fetch(`${REZ_AUTH_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('peopleos_token', data.token);
      } else {
        logout();
      }
    } catch (err) {
      logger.warn('[Auth] Token refresh failed:', err instanceof Error ? err.message : err);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
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

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
