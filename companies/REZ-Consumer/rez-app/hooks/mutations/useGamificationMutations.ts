// @ts-nocheck
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import gamificationApi from '@/services/gamificationApi';

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (gamificationApi as unknown).performCheckIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.checkIn() });
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.streak() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
    },
  });
}

export function useSpin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (gamificationApi as unknown).executeSpin(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.spinWheel() });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
    },
  });
}
