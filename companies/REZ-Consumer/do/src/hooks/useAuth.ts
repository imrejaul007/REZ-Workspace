// Auth Hook
import { useRouter, useSegments } from 'expo-router';
import { create } from 'zustand';
import { useUserStore } from '@/stores';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: { id: string; phone: string; name?: string } | null;
}

export function useAuth() {
  const router = useRouter();
  const segments = useSegments();
  const { token, user, setAuth, logout: storeLogout } = useUserStore();

  const login = async (newToken: string, newUser?: { id: string; phone: string; name?: string }) => {
    setAuth(newToken, newUser);
    // Navigate to main app
    router.replace('/(tabs)');
  };

  const logout = async () => {
    await storeLogout();
    router.replace('/auth');
  };

  // Check if authenticated
  const isAuthenticated = !!token;

  // Redirect based on auth state
  const inAuthGroup = segments[0] === 'auth';
  const inOnboarding = segments[0] === 'onboarding';

  if (isAuthenticated && (inAuthGroup || inOnboarding)) {
    router.replace('/(tabs)');
  } else if (!isAuthenticated && !inAuthGroup && !inOnboarding) {
    router.replace('/auth');
  }

  return {
    isAuthenticated,
    isLoading: false,
    token,
    user,
    login,
    logout,
  };
}
