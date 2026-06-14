// ==========================================
// MyTalent - Auth Navigator
// Handles authentication screens
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth Screens
import LoginScreen from '../app/auth/login';
import RegisterScreen from '../app/auth/register';
import ForgotPasswordScreen from '../app/auth/forgot-password';
import OTPVerificationScreen from '../app/auth/otp-verify';

// ==========================================
// Types
// ==========================================

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string; phone?: string };
  OTPVerify: { phone?: string; email?: string; mode?: 'login' | 'register' | 'reset' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// ==========================================
// Colors
// ==========================================

const COLORS = {
  background: '#0F172A',
  primary: '#6366F1',
  card: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
};

// ==========================================
// Navigator Component
// ==========================================

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
        navigationBarColor: COLORS.background,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Create Account',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: 'Reset Password',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="OTPVerify"
        component={OTPVerificationScreen}
        options={{
          title: 'Verify',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
