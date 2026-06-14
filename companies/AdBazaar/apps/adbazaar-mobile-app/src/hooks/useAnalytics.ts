import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';

export function useAnalytics() {
  const { analytics, setAnalytics, analyticsPeriod, setAnalyticsPeriod } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAnalytics(analyticsPeriod);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsPeriod, setAnalytics]);

  const changePeriod = useCallback(
    (period: '7d' | '30d' | '90d') => {
      setAnalyticsPeriod(period);
    },
    [setAnalyticsPeriod]
  );

  useEffect(() => {
    fetchAnalytics();
  }, [analyticsPeriod]);

  return {
    analytics,
    isLoading,
    error,
    analyticsPeriod,
    changePeriod,
    fetchAnalytics,
  };
}
