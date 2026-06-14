import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { teamService } from '@/services/api/team';
import { queryKeys } from './queryKeys';

export function useTeamMembers(options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.team.list(),
    queryFn: () => teamService.getTeamMembers(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useTeamMember(id: string, options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.team.detail(id),
    queryFn: () => teamService.getTeamMember(id),
    enabled: !!id,
    ...options,
  });
}

export function useMyPermissions(options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.team.permissions(),
    queryFn: () => teamService.getCurrentUserPermissions(),
    staleTime: 10 * 60 * 1000,
    ...options,
  });
}

// Team roles are static config — no dedicated endpoint, disable by default
export function useTeamRoles(options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.team.roles(),
    queryFn: async () => [],
    staleTime: Infinity,
    enabled: false,
    ...options,
  });
}

// Payroll is a separate service — disabled until endpoint is confirmed
export function useTeamPayroll(filters?, options?: UseQueryOptions<unknown>) {
  return useQuery({
    queryKey: queryKeys.team.payroll(filters),
    queryFn: async () => ({ items: [], total: 0 }),
    staleTime: 5 * 60 * 1000,
    enabled: false,
    ...options,
  });
}
