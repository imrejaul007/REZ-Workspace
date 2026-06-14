/**
 * Trigger Engine Hooks
 *
 * Custom hooks for managing trigger rules, events, and analytics.
 */

import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '@/services/api/client';
import { logger } from '@/utils/logger';
import {
  TriggerRule,
  TriggeredEvent,
  TriggerFilters,
  CreateRuleData,
  UpdateRuleData,
  TriggerStats,
  TriggerRulesResponse,
  TriggeredEventsResponse,
} from './types';

// Fetch all trigger rules
export function useTriggerRules(filters?: TriggerFilters) {
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchRules = useCallback(
    async (page = 1, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const params: Record<string, string | number> = { page, limit: 20 };
        if (filters?.type) params.type = filters.type;
        if (filters?.status) params.status = filters.status;
        if (filters?.search) params.search = filters.search;
        if (filters?.storeId) params.storeId = filters.storeId;

        const response = await apiClient.get<TriggerRulesResponse>('merchant/trigger-rules', {
          params,
        });

        if (response.success && response.data) {
          const newRules = response.data.rules;
          setRules(page === 1 ? newRules : (prev) => [...prev, ...newRules]);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch trigger rules');
        setError(error);
        logger.error('Error fetching trigger rules:', error.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useFocusEffect(
    useCallback(() => {
      fetchRules(1);
    }, [fetchRules])
  );

  const refresh = useCallback(() => {
    fetchRules(1, true);
  }, [fetchRules]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchRules(pagination.page + 1);
    }
  }, [pagination.page, pagination.pages, isLoading, fetchRules]);

  return {
    rules,
    isLoading,
    isRefreshing,
    error,
    pagination,
    refresh,
    loadMore,
  };
}

// Fetch single trigger rule
export function useTriggerRule(ruleId: string) {
  const [rule, setRule] = useState<TriggerRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!ruleId) return;

      const fetchRule = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const response = await apiClient.get<TriggerRule>(`merchant/trigger-rules/${ruleId}`);
          if (response.success && response.data) {
            setRule(response.data);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to fetch trigger rule');
          setError(error);
          logger.error('Error fetching trigger rule:', error.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchRule();
    }, [ruleId])
  );

  return { rule, isLoading, error };
}

// Create trigger rule
export function useCreateRule() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRule = useCallback(async (data: CreateRuleData): Promise<TriggerRule | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.post<TriggerRule>('merchant/trigger-rules', data);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create trigger rule');
      setError(error);
      logger.error('Error creating trigger rule:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createRule, isLoading, error };
}

// Update trigger rule
export function useUpdateRule() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateRule = useCallback(async (data: UpdateRuleData): Promise<TriggerRule | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { id, ...updateData } = data;
      const response = await apiClient.put<TriggerRule>(`merchant/trigger-rules/${id}`, updateData);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update trigger rule');
      setError(error);
      logger.error('Error updating trigger rule:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateRule, isLoading, error };
}

// Delete trigger rule
export function useDeleteRule() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.delete(`merchant/trigger-rules/${ruleId}`);
      return response.success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete trigger rule');
      setError(error);
      logger.error('Error deleting trigger rule:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteRule, isLoading, error };
}

// Toggle rule status
export function useToggleRuleStatus() {
  const [isLoading, setIsLoading] = useState(false);

  const toggleStatus = useCallback(async (rule: TriggerRule): Promise<TriggerRule | null> => {
    try {
      setIsLoading(true);
      const newStatus = rule.status === 'active' ? 'inactive' : 'active';

      const response = await apiClient.put<TriggerRule>(`merchant/trigger-rules/${rule.id}`, {
        status: newStatus,
      });
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle rule status');
      logger.error('Error toggling rule status:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { toggleStatus, isLoading };
}

// Fetch triggered events
export function useTriggeredEvents(ruleId?: string) {
  const [events, setEvents] = useState<TriggeredEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchEvents = useCallback(
    async (page = 1, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const endpoint = ruleId
          ? `merchant/trigger-rules/${ruleId}/events`
          : 'merchant/trigger-events';

        const params: Record<string, string | number> = { page, limit: 20 };

        const response = await apiClient.get<TriggeredEventsResponse>(endpoint, { params });
        if (response.success && response.data) {
          const newEvents = response.data.events;
          setEvents(page === 1 ? newEvents : (prev) => [...prev, ...newEvents]);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch triggered events');
        setError(error);
        logger.error('Error fetching triggered events:', error.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [ruleId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchEvents(1);
    }, [fetchEvents])
  );

  const refresh = useCallback(() => {
    fetchEvents(1, true);
  }, [fetchEvents]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoading) {
      fetchEvents(pagination.page + 1);
    }
  }, [pagination.page, pagination.pages, isLoading, fetchEvents]);

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    pagination,
    refresh,
    loadMore,
  };
}

// Fetch trigger stats
export function useTriggerStats() {
  const [stats, setStats] = useState<TriggerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchStats = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const response = await apiClient.get<TriggerStats>('merchant/trigger-rules/stats');
          if (response.success && response.data) {
            setStats(response.data);
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to fetch trigger stats');
          setError(error);
          logger.error('Error fetching trigger stats:', error.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStats();
    }, [])
  );

  return { stats, isLoading, error };
}

// Duplicate rule
export function useDuplicateRule() {
  const [isLoading, setIsLoading] = useState(false);

  const duplicateRule = useCallback(async (rule: TriggerRule): Promise<TriggerRule | null> => {
    try {
      setIsLoading(true);

      const duplicateData: CreateRuleData = {
        name: `${rule.name} (Copy)`,
        description: rule.description,
        type: rule.type,
        status: 'draft',
        conditions: rule.conditions,
        conditionLogic: rule.conditionLogic,
        actions: rule.actions,
        priority: rule.priority,
        startDate: rule.startDate,
        endDate: rule.endDate,
        tags: rule.tags,
        storeId: rule.storeId,
      };

      const response = await apiClient.post<TriggerRule>('merchant/trigger-rules', duplicateData);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to duplicate rule');
      logger.error('Error duplicating rule:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { duplicateRule, isLoading };
}
