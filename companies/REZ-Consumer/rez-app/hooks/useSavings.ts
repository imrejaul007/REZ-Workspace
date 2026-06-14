/**
 * useSavings - Hook for accessing savings data throughout the app
 *
 * Usage:
 * import { useSavings } from '@/hooks/useSavings';
 *
 * const { totalSavings, streak, projection } = useSavings();
 */

import { useContext } from 'react';
import SavingsContext, { SavingsContextType } from '@/contexts/SavingsContext';

// Default values to return when not within a SavingsProvider
const defaultSavingsContext: SavingsContextType = {
  dashboard: null,
  dashboardLoading: false,
  dashboardError: null,
  refreshDashboard: async () => {},
  summary: null,
  refreshSummary: async () => {},
  history: [],
  historyPage: 1,
  historyHasMore: false,
  historyLoading: false,
  loadMoreHistory: async () => {},
  refreshHistory: async () => {},
  goals: [],
  goalsLoading: false,
  createGoal: async () => false,
  updateGoal: async () => false,
  removeGoal: async () => false,
  streak: null,
  refreshStreak: async () => {},
  projection: null,
  refreshProjection: async () => {},
  recommendations: [],
  refreshRecommendations: async () => {},
  formatSavings: (amount: number) => `₹${(amount / 100).toFixed(2)}`,
};

export function useSavings(): SavingsContextType {
  const context = useContext(SavingsContext);

  if (!context) {
    // Return default values if not in provider
    return defaultSavingsContext;
  }

  return context;
}

// Convenience hooks for specific data
export function useSavingsSummary() {
  const { summary, refreshSummary, dashboardLoading } = useSavings();
  return { summary, refreshSummary, loading: dashboardLoading };
}

export function useSavingsStreak() {
  const { streak, refreshStreak } = useSavings();
  return { streak, refreshStreak };
}

export function useSavingsProjection() {
  const { projection, refreshProjection } = useSavings();
  return { projection, refreshProjection };
}

export function useSavingsGoals() {
  const { goals, goalsLoading, createGoal, updateGoal, removeGoal } = useSavings();
  return { goals, loading: goalsLoading, createGoal, updateGoal, removeGoal };
}

export function useSavingsRecommendations() {
  const { recommendations, refreshRecommendations } = useSavings();
  return { recommendations, refreshRecommendations };
}

// Format helpers
export function formatCoinAmount(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${(amount / 100).toFixed(2)}`;
}

export function formatPaise(amountPaise: number): string {
  return formatCoinAmount(amountPaise);
}
