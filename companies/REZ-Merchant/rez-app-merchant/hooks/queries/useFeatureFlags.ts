import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import featureFlagService, { MerchantFeatureFlag } from '@/services/api/featureFlags';
import { queryKeys } from './queryKeys';

export function useFeatureFlags(options?: UseQueryOptions<MerchantFeatureFlag[]>) {
  return useQuery({
    queryKey: queryKeys.featureFlags.list(),
    queryFn: async () => {
      const res = await featureFlagService.getAll();
      return res.data?.data ?? res.data;
    },
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useFeatureFlag(key: string, options?: UseQueryOptions<MerchantFeatureFlag>) {
  return useQuery({
    queryKey: queryKeys.featureFlags.detail(key),
    queryFn: async () => {
      const res = await featureFlagService.getByKey(key);
      return res.data?.data ?? res.data;
    },
    enabled: !!key,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}
