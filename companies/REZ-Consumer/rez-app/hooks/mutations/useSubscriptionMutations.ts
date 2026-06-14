// @ts-nocheck
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import subscriptionApi from '@/services/subscriptionApi';

export function useInitiateUpgrade() {
  return useMutation({
    mutationFn: (tier: string) => subscriptionApi.initiateUpgrade(tier as unknown),
    retry: 0,
  });
}

export function useConfirmUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { upgradeId: string; paymentData: unknown }) =>
      subscriptionApi.confirmUpgrade(data.upgradeId, data.paymentData?.paymentId as unknown, data.paymentData?.paymentIntentId),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { reason?: string; feedback?: string }) =>
      subscriptionApi.cancelSubscription(data as unknown || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });
    },
  });
}
