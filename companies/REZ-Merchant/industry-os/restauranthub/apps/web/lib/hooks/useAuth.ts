'use client';

import { useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'RESTAURANT_OWNER' | 'EMPLOYEE' | 'VENDOR' | 'USER';
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock auth check - in development mode, auto-login as admin
    const mockUser: User = {
      id: 'admin-1',
      email: 'admin@restopapa.com',
      name: 'Admin User',
      role: 'ADMIN',
      avatar: '/avatars/admin.jpg'
    };
    
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 100);
  }, []);

  const logout = () => {
    setUser(null);
    // In a real app, you would clear tokens and redirect
  };

  const login = async (email: string, password: string) => {
    // Mock login - always succeed in development
    const mockUser: User = {
      id: 'user-1',
      email,
      name: email.split('@')[0],
      role: 'ADMIN',
    };
    
    setUser(mockUser);
    return mockUser;
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isRestaurantOwner: user?.role === 'RESTAURANT_OWNER',
    isEmployee: user?.role === 'EMPLOYEE',
    isVendor: user?.role === 'VENDOR'
  };
}