// @ts-nocheck
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
  getSavingsDashboard,
  getSavingsSummary,
  getSavingsHistory,
  getSavingsGoals,
  getSavingsStreak,
  getSavingsProjection,
  getSavingsRecommendations,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  SavingsDashboard,
  SavingsSummary,
  SavingsEntry,
  SavingsGoal,
  SavingsStreak,
  SavingsProjection,
  SavingsRecommendation,
} from '@/services/savingsApi';
import { useAuth } from './AuthContext';

interface SavingsContextType {
  // Dashboard
  dashboard: SavingsDashboard | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  refreshDashboard: () => Promise<void>;

  // Summary
  summary: SavingsSummary | null;
  refreshSummary: () => Promise<void>;

  // History
  history: SavingsEntry[];
  historyPage: number;
  historyHasMore: boolean;
  historyLoading: boolean;
  loadMoreHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;

  // Goals
  goals: SavingsGoal[];
  goalsLoading: boolean;
  createGoal: (params: { name: string; targetAmount: number; targetDate?: string; category?: string; icon?: string; color?: string }) => Promise<boolean>;
  updateGoal: (goalId: string, amount: number) => Promise<boolean>;
  removeGoal: (goalId: string) => Promise<boolean>;

  // Streak
  streak: SavingsStreak | null;
  refreshStreak: () => Promise<void>;

  // Projection
  projection: SavingsProjection | null;
  refreshProjection: () => Promise<void>;

  // Recommendations
  recommendations: SavingsRecommendation[];
  refreshRecommendations: () => Promise<void>;

  // Helpers
  formatSavings: (amount: number) => string;
}

export type { SavingsContextType };
const SavingsContext = createContext<SavingsContextType | null>(null);

export function SavingsProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const user = state.user;
  const isAuthenticated = state.isAuthenticated;

  // Dashboard state
  const [dashboard, setDashboard] = useState<SavingsDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState<SavingsSummary | null>(null);

  // History state
  const [history, setHistory] = useState<SavingsEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Streak state
  const [streak, setStreak] = useState<SavingsStreak | null>(null);

  // Projection state
  const [projection, setProjection] = useState<SavingsProjection | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<SavingsRecommendation[]>([]);

  // Refresh dashboard
  const refreshDashboard = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    setDashboardLoading(true);
    setDashboardError(null);

    try {
      const response = await getSavingsDashboard();
      if (response.success && response.data) {
        setDashboard(response.data);
      } else {
        setDashboardError(response.message || 'Failed to load dashboard');
      }
    } catch (error) {
      setDashboardError(error.message || 'Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Refresh summary
  const refreshSummary = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const response = await getSavingsSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      logger.error('Failed to load savings summary', { error });
    }
  }, [isAuthenticated, user?.id]);

  // Load more history
  const loadMoreHistory = useCallback(async () => {
    if (!isAuthenticated || !user?.id || historyLoading || !historyHasMore) return;

    setHistoryLoading(true);
    try {
      const nextPage = historyPage + 1;
      const response = await getSavingsHistory({ page: nextPage, limit: 20 });
      if (response.success && response.data) {
        setHistory((prev) => [...prev, ...response.data.entries]);
        setHistoryPage(nextPage);
        setHistoryHasMore(response.data.hasMore);
      }
    } catch (error) {
      logger.error('Failed to load more history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated, user?.id, historyLoading, historyHasMore, historyPage]);

  // Refresh history
  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    setHistoryLoading(true);
    setHistoryPage(1);
    try {
      const response = await getSavingsHistory({ page: 1, limit: 20 });
      if (response.success && response.data) {
        setHistory(response.data.entries);
        setHistoryHasMore(response.data.hasMore);
      }
    } catch (error) {
      logger.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Create goal
  const createGoal = useCallback(
    async (params: { name: string; targetAmount: number; targetDate?: string; category?: string; icon?: string; color?: string }) => {
      if (!isAuthenticated || !user?.id) return false;

      try {
        const response = await createSavingsGoal(params);
        if (response.success) {
          await refreshDashboard();
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Failed to create goal:', error);
        return false;
      }
    },
    [isAuthenticated, user?.id, refreshDashboard],
  );

  // Update goal
  const updateGoal = useCallback(
    async (goalId: string, amount: number) => {
      if (!isAuthenticated || !user?.id) return false;

      try {
        const response = await updateSavingsGoal(goalId, amount);
        if (response.success) {
          await refreshDashboard();
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Failed to update goal:', error);
        return false;
      }
    },
    [isAuthenticated, user?.id, refreshDashboard],
  );

  // Remove goal
  const removeGoal = useCallback(
    async (goalId: string) => {
      if (!isAuthenticated || !user?.id) return false;

      try {
        const response = await deleteSavingsGoal(goalId);
        if (response.success) {
          setGoals((prev) => prev.filter((g) => g.goalId !== goalId));
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Failed to delete goal:', error);
        return false;
      }
    },
    [isAuthenticated, user?.id],
  );

  // Refresh streak
  const refreshStreak = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const response = await getSavingsStreak();
      if (response.success && response.data) {
        setStreak(response.data);
      }
    } catch (error) {
      logger.error('Failed to load streak:', error);
    }
  }, [isAuthenticated, user?.id]);

  // Refresh projection
  const refreshProjection = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const response = await getSavingsProjection();
      if (response.success && response.data) {
        setProjection(response.data);
      }
    } catch (error) {
      logger.error('Failed to load projection:', error);
    }
  }, [isAuthenticated, user?.id]);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const response = await getSavingsRecommendations();
      if (response.success && response.data) {
        setRecommendations(response.data);
      }
    } catch (error) {
      logger.error('Failed to load recommendations:', error);
    }
  }, [isAuthenticated, user?.id]);

  // Format savings
  const formatSavings = useCallback((amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${(amount / 100).toFixed(2)}`;
  }, []);

  // Load all data when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshDashboard();
      refreshSummary();
      refreshHistory();
      refreshStreak();
      refreshProjection();
      refreshRecommendations();
    } else {
      // Clear data on logout
      setDashboard(null);
      setSummary(null);
      setHistory([]);
      setGoals([]);
      setStreak(null);
      setProjection(null);
      setRecommendations([]);
    }
  }, [isAuthenticated, user?.id, refreshDashboard, refreshSummary, refreshHistory, refreshStreak, refreshProjection, refreshRecommendations]);

  const value: SavingsContextType = {
    dashboard,
    dashboardLoading,
    dashboardError,
    refreshDashboard,
    summary,
    refreshSummary,
    history,
    historyPage,
    historyHasMore,
    historyLoading,
    loadMoreHistory,
    refreshHistory,
    goals,
    goalsLoading,
    createGoal,
    updateGoal,
    removeGoal,
    streak,
    refreshStreak,
    projection,
    refreshProjection,
    recommendations,
    refreshRecommendations,
    formatSavings,
  };

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>;
}

export function useSavings() {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
}

export default SavingsContext;
