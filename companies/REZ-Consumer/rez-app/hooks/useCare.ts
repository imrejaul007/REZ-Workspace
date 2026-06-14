// @ts-nocheck
/**
 * Care Service Hook
 * React hook for accessing REZ-care-service (AI Customer Support)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import {
  careService,
  Customer360,
  SelfServiceAction,
  ProactiveAlert,
  Ticket,
} from '@/services/careService';

interface UseCustomer360Return {
  customer: Customer360 | null;
  loading: boolean;
  error: string | null;
  needsAttention: boolean;
  healthScore: number;
  refresh: () => Promise<void>;
}

export function useCustomer360(): UseCustomer360Return {
  const user = useAuthUser();
  const [customer, setCustomer] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (!user?.id) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await careService.getCustomer360(user.id);
      if (response.success && response.data) {
        setCustomer(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    error,
    needsAttention: customer ? careService.needsAttention(customer) : false,
    healthScore: customer ? careService.getHealthScore(customer) : 0,
    refresh: fetchCustomer,
  };
}

interface UseSelfServiceReturn {
  actions: SelfServiceAction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  executeAction: (
    actionId: string,
    parameters?: Record<string, unknown>
  ) => Promise<{ success: boolean; message: string }>;
}

export function useSelfService(): UseSelfServiceReturn {
  const user = useAuthUser();
  const [actions, setActions] = useState<SelfServiceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    if (!user?.id) {
      setActions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await careService.getSelfServiceActions(user.id);
      if (response.success && response.data) {
        setActions(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load self-service actions');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const executeAction = useCallback(
    async (
      actionId: string,
      parameters?: Record<string, unknown>
    ): Promise<{ success: boolean; message: string }> => {
      if (!user?.id) {
        return { success: false, message: 'User not authenticated' };
      }

      try {
        const response = await careService.executeSelfService({
          actionId,
          customerId: user.id,
          parameters,
        });

        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            return { success: true, message: response.data.result?.message || 'Action completed' };
          } else if (response.data.status === 'failed') {
            return { success: false, message: response.data.error?.message || 'Action failed' };
          } else {
            return { success: true, message: 'Processing...' };
          }
        }

        return { success: false, message: 'Failed to execute action' };
      } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
      }
    },
    [user?.id]
  );

  return {
    actions,
    loading,
    error,
    refresh: fetchActions,
    executeAction,
  };
}

interface UseProactiveAlertsReturn {
  alerts: ProactiveAlert[];
  loading: boolean;
  hasCritical: boolean;
  hasWarning: boolean;
  refresh: () => Promise<void>;
  dismissAlert: (alertId: string) => void;
}

export function useProactiveAlerts(): UseProactiveAlertsReturn {
  const user = useAuthUser();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user?.id) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await careService.getProactiveAlerts(user.id);
      if (response.success && response.data) {
        setAlerts(response.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAlerts();
    // Poll every 5 minutes for new alerts
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  return {
    alerts,
    loading,
    hasCritical: alerts.some((a) => a.severity === 'critical'),
    hasWarning: alerts.some((a) => a.severity === 'warning'),
    refresh: fetchAlerts,
    dismissAlert,
  };
}

interface UseCSATReturn {
  submitRating: (
    rating: 1 | 2 | 3 | 4 | 5,
    feedback?: string,
    ticketId?: string
  ) => Promise<{ success: boolean }>;
  loading: boolean;
}

export function useCSAT(): UseCSATReturn {
  const user = useAuthUser();
  const [loading, setLoading] = useState(false);

  const submitRating = useCallback(
    async (
      rating: 1 | 2 | 3 | 4 | 5,
      feedback?: string,
      ticketId?: string
    ): Promise<{ success: boolean }> => {
      if (!user?.id) {
        return { success: false };
      }

      setLoading(true);
      try {
        const response = await careService.submitCSAT({
          customerId: user.id,
          ticketId: ticketId || '',
          rating,
          feedback,
          submittedAt: new Date().toISOString(),
        });
        return { success: response.success };
      } catch {
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  return { submitRating, loading };
}

/**
 * Hook for customer health monitoring
 */
export function useCustomerHealth() {
  const { customer, loading } = useCustomer360();
  const { alerts } = useProactiveAlerts();

  const healthScore = customer ? careService.getHealthScore(customer) : 0;
  const recommendedAction = customer ? careService.getRecommendedAction(customer) : null;

  return {
    healthScore,
    churnRisk: customer?.summary.churnRisk || 'low',
    npsScore: customer?.summary.npsScore || 0,
    openTickets: customer?.interactions.openTickets || 0,
    satisfactionScore: customer?.interactions.satisfactionScore || 0,
    recommendedAction,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical'),
    loading,
  };
}
