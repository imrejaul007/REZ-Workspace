'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth-api';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'restaurant' | 'employee' | 'vendor';
  name: string;
  verified: boolean;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: User['role'], twoFactorToken?: string) => Promise<void>;
  logout: (logoutAll?: boolean) => Promise<void>;
  signup: (userData) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionTimeout: number | null;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout configuration
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check with backend if we have a valid session
        const authStatus = await authApi.checkAuthStatus();
        
        if (authStatus.data?.authenticated && authStatus.data.user) {
          const userData = {
            id: authStatus.data.user.id,
            email: authStatus.data.user.email,
            role: authStatus.data.user.role,
            name: `${authStatus.data.user.profile.firstName} ${authStatus.data.user.profile.lastName}`,
            verified: authStatus.data.user.isVerified,
          };
          setUser(userData);
          setLastActivity(Date.now());
          
          // Update localStorage with fresh user data
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // No valid session, clear any stale data
          const userData = authApi.getCurrentUser();
          if (userData) {
            await authApi.logout();
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // If we can't check auth status, try to use local session data
        if (authApi.isAuthenticated()) {
          const userData = authApi.getCurrentUser();
          if (userData) {
            setUser(userData);
            setLastActivity(Date.now());
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Session timeout management
  useEffect(() => {
    if (!user) return;

    const timeoutId = setTimeout(() => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        toast.error('Session expired. Please log in again.');
        logout();
      }
    }, SESSION_CHECK_INTERVAL);

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, lastActivity]);

  // Session timeout warning
  useEffect(() => {
    if (!user) return;

    const warningTime = SESSION_TIMEOUT - 2 * 60 * 1000; // 2 minutes before timeout
    const timeUntilWarning = warningTime - (Date.now() - lastActivity);

    if (timeUntilWarning > 0) {
      const warningTimeoutId = setTimeout(() => {
        toast.error('Your session will expire in 2 minutes. Please refresh the page to extend your session.', {
          duration: 30000,
        });
      }, timeUntilWarning);

      return () => clearTimeout(warningTimeoutId);
    }
  }, [user, lastActivity]);

  const login = async (email: string, password: string, role: User['role'], twoFactorToken?: string) => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login({
        email,
        password,
        role,
        twoFactorToken,
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role as User['role'],
          name: `${response.data.user.profile.firstName} ${response.data.user.profile.lastName}`,
          verified: response.data.user.isVerified,
        };
        
        setUser(userData);
        setLastActivity(Date.now());
        
        // Success message
        toast.success('Logged in successfully!');
        
        // Redirect to role-specific dashboard
        const dashboardMap = {
          admin: '/admin/dashboard',
          restaurant: '/restaurant/dashboard',
          employee: '/employee/dashboard',
          vendor: '/vendor/dashboard'
        };
        
        router.push(dashboardMap[role]);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await authApi.signup(userData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        const userInfo: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role as User['role'],
          name: `${response.data.user.profile.firstName} ${response.data.user.profile.lastName}`,
          verified: response.data.user.isVerified,
        };
        
        setUser(userInfo);
        setLastActivity(Date.now());
        
        toast.success('Account created successfully!');
        
        // Redirect to role-specific dashboard
        const dashboardMap = {
          admin: '/admin/dashboard',
          restaurant: '/restaurant/dashboard',
          employee: '/employee/dashboard',
          vendor: '/vendor/dashboard'
        };
        
        router.push(dashboardMap[userData.role]);
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error instanceof Error ? error.message : 'Signup failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (logoutAll: boolean = false) => {
    try {
      // Call backend logout API
      if (logoutAll) {
        await authApi.logoutAll();
        toast.success('Logged out from all devices');
      } else {
        await authApi.logout();
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API fails
    }
    
    // Clear local state
    setUser(null);
    setLastActivity(0);
    
    // Redirect to login
    router.push('/auth/login');
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      // Try to refresh with the backend
      const authStatus = await authApi.checkAuthStatus();
      
      if (authStatus.data?.authenticated) {
        setLastActivity(Date.now());
        toast.success('Session refreshed');
        return true;
      } else {
        // Session is no longer valid
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      await logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    signup,
    isLoading,
    isAuthenticated: !!user,
    sessionTimeout: SESSION_TIMEOUT - (Date.now() - lastActivity),
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
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

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: User['role'][]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push('/auth/login');
          return;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard
          const dashboardMap = {
            admin: '/admin/dashboard',
            restaurant: '/restaurant/dashboard',
            employee: '/employee/dashboard',
            vendor: '/vendor/dashboard'
          };
          
          router.push(dashboardMap[user.role]);
          return;
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Role-based access control hook
export function useRoleAccess(requiredRoles: User['role'][]) {
  const { user } = useAuth();
  
  const hasAccess = user && requiredRoles.includes(user.role);
  const userRole = user?.role;
  
  return { hasAccess, userRole };
}