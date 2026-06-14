import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// INSIGHTS API SERVICE
// Phase 2.1 — Smart Spending Dashboard
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySavingsTrend {
  month: string;       // e.g. "2026-01"
  totalSpent: number;
  totalSaved: number;
  savingsRate: number; // 0-100
}

export interface TopMerchant {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  visitCount: number;
  totalSpent: number;
  totalSaved: number;
}

export interface SpendingInsightsDashboard {
  currentMonth: string;             // e.g. "2026-03"
  totalSpent: number;
  totalSaved: number;
  savingsRate: number;              // 0-100
  savingsScore: number;             // 0-100 gauge
  categoryBreakdown: CategoryBreakdown[];
  monthlyTrend: MonthlySavingsTrend[];  // last 6 months
  topMerchants: TopMerchant[];
  missedSavings: number;            // Rs. could have saved
  peerPercentile: number;           // e.g. 72 (saves more than 72% of users)
  lastUpdated: string;
}

export interface MonthlyReport {
  month: string;
  totalSpent: number;
  totalSaved: number;
  savingsRate: number;
  topCategory: string;
  topMerchant: string;
  visitCount: number;
  streakDays: number;
  coinEarned: number;
  highlights: string[];
}

export interface MissedSavingsItem {
  date: string;
  category: string;
  estimatedSavings: number;
  alternativeMerchants: Array<{
    merchantId: string;
    merchantName: string;
    distance?: string;
    potentialSavings: number;
  }>;
}

export interface MissedSavingsSummary {
  totalMissedThisMonth: number;
  totalMissedThisWeek: number;
  items: MissedSavingsItem[];
  topMissedCategory: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch the full smart spending dashboard for the current user.
 * GET /api/insights/dashboard
 */
export async function getSpendingInsights(): Promise<SpendingInsightsDashboard> {
  const response = await apiClient.get<SpendingInsightsDashboard>('/insights/dashboard');
  return (response.data ?? response) as unknown as SpendingInsightsDashboard;
}

/**
 * Fetch the monthly spending report for a given month.
 * GET /api/insights/monthly/:month
 * @param month - Format "YYYY-MM", e.g. "2026-03"
 */
export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const response = await apiClient.get<MonthlyReport>(`/insights/monthly/${month}`);
  return (response.data ?? response) as unknown as MonthlyReport;
}

/**
 * Fetch missed savings — purchases made outside REZ where user could have saved.
 * GET /api/insights/missed-savings
 */
export async function getMissedSavings(): Promise<MissedSavingsSummary> {
  const response = await apiClient.get<MissedSavingsSummary>('/insights/missed-savings');
  return (response.data ?? response) as unknown as MissedSavingsSummary;
}
