// @ts-nocheck
/**
 * Savings API Service
 *
 * Provides access to the savings module for tracking, analytics, and recommendations.
 */

import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface SavingsSummary {
  totalSavings: number;
  totalSavingsAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
  thisMonthVsLastMonth: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  averageSavingsPerTransaction: number;
  transactionCount: number;
}

export interface SavingsEntry {
  id: string;
  userId: string;
  type: 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo' | 'cashback_bonus';
  amount: number;
  source: string;
  description: string;
  originalAmount?: number;
  savingsPercentage?: number;
  category?: string;
  merchantId?: string;
  createdAt: string;
}

export interface SavingsStreak {
  currentStreak: number;
  longestStreak: number;
  totalStreakDays: number;
  lastSavingsDate: string | null;
  streakActive: boolean;
  daysUntilStreakLost: number;
}

export interface SavingsProjection {
  projectedAmount30Days: number;
  projectedAmount90Days: number;
  projectedAmount365Days: number;
  monthlyAverage: number;
  savingsRate: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  basedOnDays: number;
  calculatedAt: string;
}

export interface SavingsInsight {
  id: string;
  userId: string;
  insightType: 'best_category' | 'peak_savings_day' | 'average_savings' | 'savings_trend' | 'potential_savings';
  title: string;
  description: string;
  value: number;
  comparison?: number;
  comparisonPercent?: number;
  category?: string;
  actionable: boolean;
  actionText?: string;
  createdAt: string;
}

export interface SavingsGoal {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  icon: string;
  color: string;
  isCompleted: boolean;
  completedAt?: string;
  progressPercent: number;
}

export interface SavingsRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  potentialSavings: number;
  icon: string;
  actionText: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SavingsDashboard {
  totalSavings: number;
  totalSavingsAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
  thisMonthVsLastMonth: number;
  lastMonth: number; // Added missing property
  currentStreak: number;
  streakActive: boolean;
  projection30Days: number;
  projection90Days: number;
  projection365Days: number;
  goalProgress: Array<{
    goalId: string;
    name: string;
    current: number;
    target: number;
    percent: number;
    icon: string;
  }>;
  topCategories: Array<{
    category: string;
    amount: number;
  }>;
  recommendations: SavingsRecommendation[];
  insights: SavingsInsight[];
  transactionCount?: number; // Optional property
}

export interface SavingsHistoryResponse {
  entries: SavingsEntry[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get comprehensive savings dashboard
 * Shows total savings, projections, streak, goals, and recommendations
 */
export async function getSavingsDashboard(): Promise<ApiResponse<SavingsDashboard>> {
  return apiClient.get<SavingsDashboard>('/savings/dashboard');
}

/**
 * Get savings summary (totals, by type, by category)
 */
export async function getSavingsSummary(): Promise<ApiResponse<SavingsSummary>> {
  return apiClient.get<SavingsSummary>('/savings/summary');
}

/**
 * Get savings history with pagination and filters
 */
export async function getSavingsHistory(params?: {
  page?: number;
  limit?: number;
  type?: 'cashback' | 'reward' | 'referral' | 'loyalty' | 'promo' | 'cashback_bonus';
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<SavingsHistoryResponse>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.category) searchParams.set('category', params.category);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);

  const query = searchParams.toString();
  return apiClient.get<SavingsHistoryResponse>(`/savings/history${query ? `?${query}` : ''}`);
}

/**
 * Get savings streak information
 */
export async function getSavingsStreak(): Promise<ApiResponse<SavingsStreak>> {
  return apiClient.get<SavingsStreak>('/savings/streak');
}

/**
 * Get savings projections (30/90/365 days)
 */
export async function getSavingsProjection(): Promise<ApiResponse<SavingsProjection>> {
  return apiClient.get<SavingsProjection>('/savings/projection');
}

/**
 * Get personalized savings insights
 */
export async function getSavingsInsights(): Promise<ApiResponse<SavingsInsight[]>> {
  return apiClient.get<SavingsInsight[]>('/savings/insights');
}

/**
 * Get personalized savings recommendations
 */
export async function getSavingsRecommendations(): Promise<ApiResponse<SavingsRecommendation[]>> {
  return apiClient.get<SavingsRecommendation[]>('/savings/recommendations');
}

// ============================================================================
// SAVINGS GOALS
// ============================================================================

/**
 * Get all savings goals
 */
export async function getSavingsGoals(): Promise<ApiResponse<SavingsGoal[]>> {
  const response = await apiClient.get<Array<{
    goalId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
    category?: string;
    icon: string;
    color: string;
    isCompleted: boolean;
    completedAt?: string;
  }>>('/savings/goals');

  if (response.success && response.data) {
    const goalsWithProgress = response.data.map((goal) => ({
      ...goal,
      progressPercent: Math.round((goal.currentAmount / goal.targetAmount) * 100),
    }));
    return { ...response, data: goalsWithProgress as unknown as SavingsGoal[] };
  }

  return response as ApiResponse<SavingsGoal[]>;
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(params: {
  name: string;
  targetAmount: number;
  targetDate?: string;
  category?: string;
  icon?: string;
  color?: string;
}): Promise<ApiResponse<SavingsGoal>> {
  return apiClient.post<SavingsGoal>('/savings/goals', params);
}

/**
 * Update savings goal progress (add to goal)
 */
export async function updateSavingsGoal(
  goalId: string,
  amount: number,
): Promise<ApiResponse<SavingsGoal>> {
  return apiClient.patch<SavingsGoal>(`/savings/goals/${goalId}`, { amount });
}

/**
 * Delete a savings goal
 */
export async function deleteSavingsGoal(goalId: string): Promise<ApiResponse<void>> {
  return apiClient.delete(`/savings/goals/${goalId}`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format savings amount for display
 */
export function formatSavings(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${(amount / 100).toFixed(2)}`;
}

/**
 * Get savings type display info
 */
export function getSavingsTypeInfo(type: SavingsEntry['type']): { label: string; icon: string; color: string } {
  const typeMap: Record<SavingsEntry['type'], { label: string; icon: string; color: string }> = {
    cashback: { label: 'Cashback', icon: '💰', color: '#4CAF50' },
    reward: { label: 'Reward', icon: '🎁', color: '#FF9800' },
    referral: { label: 'Referral', icon: '👥', color: '#2196F3' },
    loyalty: { label: 'Loyalty', icon: '⭐', color: '#9C27B0' },
    promo: { label: 'Promo', icon: '🎉', color: '#E91E63' },
    cashback_bonus: { label: 'Bonus Cashback', icon: '🎊', color: '#00BCD4' },
  };
  return typeMap[type] || { label: 'Other', icon: '💵', color: '#607D8B' };
}

/**
 * Get goal category display info
 */
export function getGoalCategoryInfo(category?: string): { label: string; icon: string } {
  const categoryMap: Record<string, { label: string; icon: string }> = {
    travel: { label: 'Travel', icon: '✈️' },
    shopping: { label: 'Shopping', icon: '🛍️' },
    dining: { label: 'Dining', icon: '🍽️' },
    entertainment: { label: 'Entertainment', icon: '🎬' },
    groceries: { label: 'Groceries', icon: '🛒' },
    emergency: { label: 'Emergency Fund', icon: '🏥' },
    investment: { label: 'Investment', icon: '📈' },
    other: { label: 'Other', icon: '🎯' },
  };
  return categoryMap[category || 'other'] || { label: 'Other', icon: '🎯' };
}
