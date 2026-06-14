/**
 * TreasuryOS Dashboard - React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import {
  cashApi,
  investmentApi,
  forecastApi,
  mlForecastApi,
  alertsApi,
  bankStatementApi,
  fxApi,
  webhookApi,
  type TreasuryAccount,
  type CashPosition,
  type Investment,
  type InvestmentSummary,
  type ForecastWeek,
  type ShortfallPrediction,
  type ShortfallAlert,
  type BankStatementResult,
  type Bank,
  type MLForecastOutput,
  type FXRate,
  type FXExposure,
  type HedgePosition,
  type HedgeRecommendation,
} from '../api/treasury';

// ============================================
// CASH MANAGEMENT HOOKS
// ============================================

export function useCashPosition(businessId: string) {
  const [position, setPosition] = useState<CashPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cashApi.getPosition(businessId);
      setPosition(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch position');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchPosition();
  }, [fetchPosition]);

  return { position, loading, error, refetch: fetchPosition };
}

export function useAccounts(businessId: string) {
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cashApi.getAccounts(businessId);
      setAccounts(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const deposit = async (accountId: string, amount: number, description?: string) => {
    await cashApi.deposit(accountId, amount, description);
    fetchAccounts();
  };

  const withdraw = async (accountId: string, amount: number, description?: string) => {
    await cashApi.withdraw(accountId, amount, description);
    fetchAccounts();
  };

  const transfer = async (fromId: string, toId: string, amount: number) => {
    await cashApi.transfer(fromId, toId, amount);
    fetchAccounts();
  };

  return { accounts, loading, error, refetch: fetchAccounts, deposit, withdraw, transfer };
}

// ============================================
// INVESTMENT HOOKS
// ============================================

export function useInvestments(businessId: string) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invResponse, summaryResponse] = await Promise.all([
        investmentApi.getAll(businessId),
        investmentApi.getSummary(businessId),
      ]);
      setInvestments(invResponse.data.data);
      setSummary(summaryResponse.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch investments');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  const createInvestment = async (data: Parameters<typeof investmentApi.create>[0]) => {
    await investmentApi.create(data);
    fetchInvestments();
  };

  const redeemInvestment = async (investmentId: string, targetAccountId: string, premature?: boolean) => {
    await investmentApi.redeem(investmentId, targetAccountId, premature);
    fetchInvestments();
  };

  return { investments, summary, loading, error, refetch: fetchInvestments, createInvestment, redeemInvestment };
}

// ============================================
// FORECAST HOOKS
// ============================================

export function useForecast(businessId: string) {
  const [forecast, setForecast] = useState<ForecastWeek[]>([]);
  const [shortfall, setShortfall] = useState<ShortfallPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await forecastApi.generate(businessId);
      setForecast(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const fetchShortfall = useCallback(async () => {
    try {
      const response = await forecastApi.getShortfall(businessId);
      setShortfall(response.data.data);
    } catch (err) {
      console.error('Failed to fetch shortfall:', err);
    }
  }, [businessId]);

  useEffect(() => {
    generateForecast();
    fetchShortfall();
  }, [generateForecast, fetchShortfall]);

  return { forecast, shortfall, loading, error, refetch: generateForecast };
}

export function useMLForecast(businessId: string) {
  const [mlForecast, setMLForecast] = useState<MLForecastOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateMLForecast = useCallback(async (options?: {
    historicalDays?: number;
    forecastWeeks?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mlForecastApi.generate(businessId, options);
      setMLForecast(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ML forecast');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    generateMLForecast();
  }, [generateMLForecast]);

  return { mlForecast, loading, error, refetch: generateMLForecast };
}

// ============================================
// ALERTS HOOKS
// ============================================

export function useAlerts(businessId: string) {
  const [alerts, setAlerts] = useState<ShortfallAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await alertsApi.getActive(businessId);
      setAlerts(response.data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const acknowledgeAlert = async (alertId: string) => {
    await alertsApi.acknowledge(alertId);
    fetchAlerts();
  };

  const resolveAlert = async (alertId: string, resolution: string) => {
    await alertsApi.resolve(alertId, resolution);
    fetchAlerts();
  };

  return { alerts, loading, error, refetch: fetchAlerts, acknowledgeAlert, resolveAlert };
}

// ============================================
// BANK STATEMENT HOOKS
// ============================================

export function useBankStatements() {
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    bankStatementApi.getSupportedBanks()
      .then(response => setBanks(response.data.data))
      .catch(console.error);
  }, []);

  const importStatement = async (
    accountId: string,
    fileContent: string,
    fileName: string,
    bankType: string
  ): Promise<BankStatementResult | null> => {
    try {
      const response = await bankStatementApi.import(accountId, fileContent, fileName, bankType);
      return response.data.data;
    } catch (err) {
      console.error('Failed to import bank statement:', err);
      return null;
    }
  };

  return { banks, importStatement };
}

// ============================================
// FX HEDGING HOOKS
// ============================================

export function useFXExposure(businessId: string) {
  const [exposure, setExposure] = useState<FXExposure[]>([]);
  const [positions, setPositions] = useState<HedgePosition[]>([]);
  const [recommendations, setRecommendations] = useState<HedgeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExposure = useCallback(async () => {
    setLoading(true);
    try {
      const [exposureRes, positionsRes, recsRes] = await Promise.all([
        fxApi.getExposure(businessId),
        fxApi.getPositions(businessId),
        fxApi.getRecommendations(businessId),
      ]);
      setExposure(exposureRes.data.data ? [exposureRes.data.data] : []);
      setPositions(positionsRes.data.data);
      setRecommendations(recsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch FX exposure:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchExposure();
  }, [fetchExposure]);

  const createForwardHedge = async (data: Parameters<typeof fxApi.createForwardHedge>[0]) => {
    await fxApi.createForwardHedge(data);
    fetchExposure();
  };

  const createOptionHedge = async (data: Parameters<typeof fxApi.createOptionHedge>[0]) => {
    await fxApi.createOptionHedge(data);
    fetchExposure();
  };

  const settlePosition = async (positionId: string, settlementRate: number) => {
    await fxApi.settlePosition(positionId, settlementRate);
    fetchExposure();
  };

  return {
    exposure,
    positions,
    recommendations,
    loading,
    refetch: fetchExposure,
    createForwardHedge,
    createOptionHedge,
    settlePosition,
  };
}

export function useFXRate(from: string, to: string) {
  const [rate, setRate] = useState<FXRate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to) return;
    setLoading(true);
    fxApi.getRate(from, to)
      .then(response => setRate(response.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [from, to]);

  return { rate, loading };
}

// ============================================
// WEBHOOK HOOKS
// ============================================

export function useWebhooks() {
  const [webhookId, setWebhookId] = useState<string | null>(null);

  const subscribe = async (
    url: string,
    events: string[],
    businessId?: string
  ) => {
    try {
      const response = await webhookApi.subscribe({
        url,
        secret: generateSecret(),
        events,
        businessId,
      });
      setWebhookId(response.data.data.id);
      return response.data.data;
    } catch (err) {
      console.error('Failed to subscribe:', err);
      return null;
    }
  };

  const unsubscribe = async () => {
    if (webhookId) {
      await webhookApi.unsubscribe(webhookId);
      setWebhookId(null);
    }
  };

  return { webhookId, subscribe, unsubscribe };
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}
