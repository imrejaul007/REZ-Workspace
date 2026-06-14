import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import fraudService, { FraudStatus, AnomalyAlert } from '@/services/api/fraud';
import { queryKeys } from './queryKeys';

export function useFraudAlerts(filters?, options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.fraud.alerts(filters),
    queryFn: async () => {
      const res = await fraudService.getAlerts(filters);
      return res.data?.data ?? res.data;
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useFraudAlertDetail(id: string, options?: UseQueryOptions<AnomalyAlert>) {
  return useQuery({
    queryKey: queryKeys.fraud.alertDetail(id),
    queryFn: async () => {
      const res = await fraudService.getAlertById(id);
      return res.data?.data ?? res.data;
    },
    enabled: !!id,
    ...options,
  });
}

export function useFraudStatus(options?: UseQueryOptions<FraudStatus>) {
  return useQuery({
    queryKey: queryKeys.fraud.status(),
    queryFn: async () => {
      const res = await fraudService.getStatus();
      return res.data?.data ?? res.data;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
