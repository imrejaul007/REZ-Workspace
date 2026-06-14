import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/apiClient';

export function useUserBoot() {
  const { state } = useAuth();
  return useQuery({
    queryKey: ['user', 'boot'],
    queryFn: async () => {
      const response = await apiClient.get('/user/boot');
      if (!response.success || !response.data) throw new Error('Boot failed');
      return response.data;
    },
    enabled: state.isAuthenticated,
    staleTime: 30_000,
  });
}
