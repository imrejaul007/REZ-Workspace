'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; companyName: string }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const response = await api.getProfile();
      if (response.success && response.data) {
        const { user: userData, employee: employeeData } = response.data;
        setUser({
          id: userData._id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          avatar: userData.avatar,
        });
        if (employeeData) {
          setEmployee({
            id: employeeData._id,
            employeeId: employeeData.employeeId,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            department: employeeData.department,
            designation: employeeData.designation,
            email: employeeData.email,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to fetch profile:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (api.getToken()) {
        try {
          await refreshProfile();
        } catch (error) {
          logger.error('Auth init failed:', error);
          api.clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.success) {
      await refreshProfile();
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; companyName: string }) => {
    const response = await api.register(data);
    if (response.success) {
      await refreshProfile();
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
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
