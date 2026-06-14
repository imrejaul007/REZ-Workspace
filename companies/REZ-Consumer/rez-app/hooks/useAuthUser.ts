/**
 * useAuthUser Hook
 * Get current user info from auth state
 */

import { useAuthStore } from '@/stores/authStore';

export function useAuthUser() {
  const state = useAuthStore((s) => s.state);

  return {
    userId: state.user?.id || null,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    phone: state.user?.phone || null,
    email: state.user?.email || null,
    name: state.user?.name || null,
  };
}

export default useAuthUser;
