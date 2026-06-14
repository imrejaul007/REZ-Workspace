import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/services/api/client';
import { queryKeys } from './queryKeys';

export function useWalletBalance(options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.wallet.balance(),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('merchant/wallet');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useWalletTransactions(filters?, options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(filters),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('merchant/wallet/transactions', { params: filters });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useWalletStats(options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.wallet.stats(),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('merchant/wallet/stats');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useWalletWithdrawals(
  filters?: { page?: number; status?: string },
  options?: UseQueryOptions<unknown>
) {
  return useQuery({
    queryKey: [...queryKeys.wallet.all, 'withdrawals', filters],
    queryFn: async () => {
      const params: unknown = { page: filters?.page || 1, limit: 20 };
      if (filters?.status) params.status = filters.status;
      const res = await apiClient.get<unknown>('merchant/wallet/transactions', {
        params: { ...params, type: 'withdrawal' },
      });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useWalletBankDetails(options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.wallet.bankDetails(),
    queryFn: async () => {
      const res = await apiClient.get<unknown>('merchant/wallet/bank-details');
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  });
}
