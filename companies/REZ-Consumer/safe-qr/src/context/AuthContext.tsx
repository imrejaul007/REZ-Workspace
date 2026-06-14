import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface User {
 id: string;
 name?: string;
 phone?: string;
 email?: string;
 avatar?: string;
 karmaPoints?: number;
 karmaLevel?: string;
}

interface AuthContextType {
 user: User | null;
 isLoading: boolean;
 isAuthenticated: boolean;
 login: (phone: string, otp: string) => Promise<void>;
 requestOTP: (phone: string) => Promise<void>;
 logout: () => Promise<void>;
 updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [isLoading, setIsLoading] = useState(true);

 useEffect(() => {
   checkAuth();
 }, []);

 async function checkAuth() {
   try {
     const token = await AsyncStorage.getItem('authToken');
     if (token) {
       const response = await api.verifyToken();
       if (response.valid) {
         setUser(response.user);
       } else {
         await AsyncStorage.removeItem('authToken');
       }
     }
   } catch (error) {
     logger.error('Auth check failed:', error);
     await AsyncStorage.removeItem('authToken');
   } finally {
     setIsLoading(false);
   }
 }

 async function login(phone: string, otp: string) {
   const response = await api.login(phone, otp);
   if (response.token) {
     await AsyncStorage.setItem('authToken', response.token);
     setUser(response.user);
   }
 }

 async function requestOTP(phone: string) {
   await api.requestOTP(phone);
 }

 async function logout() {
   await AsyncStorage.removeItem('authToken');
   setUser(null);
 }

 function updateUser(updates: Partial<User>) {
   if (user) {
     setUser({ ...user, ...updates });
   }
 }

 return (
   <AuthContext.Provider
     value={{
       user,
       isLoading,
       isAuthenticated: !!user,
       login,
       requestOTP,
       logout,
       updateUser,
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
