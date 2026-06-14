// @ts-nocheck
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import ordersApi from '@/services/ordersApi';

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => ordersApi.createOrder(data),
    retry: 0, // Never auto-retry order creation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      ordersApi.cancelOrder(orderId, reason),
    onSuccess: (_data, variables) => {
      // Invalidate the specific order detail and the list view
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
      // Broad invalidation covers counts, tracking, and any other order sub-queries
      // (fixes: useOrderHistory not refreshing after cancel)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance() });
    },
  });
}

export function useRetryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => (ordersApi as unknown).retryPayment(orderId),
    retry: 0,
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    },
  });
}
