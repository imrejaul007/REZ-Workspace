/**
 * REZ Expense - Spend Insights Service
 * Generates weekly/monthly insights, detects anomalies, and tracks budgets
 */

import {
  WeeklyInsight,
  MonthlyInsight,
  SpendInsight,
  CategorySpending,
  MerchantSpending,
  AnomalyAlert,
  BudgetStatus,
  ExpenseBase,
  InsightType,
  AnomalyType,
  EXPENSE_CATEGORIES,
} from '../types';

interface SpendingPeriod {
  start: Date;
  end: Date;
}

interface AnomalyConfig {
  stdDevMultiplier: number;
  minAmount: number;
}

export class InsightsService {
  private anomalyConfig: AnomalyConfig;

  constructor() {
    this.anomalyConfig = {
      stdDevMultiplier: 2.5,
      minAmount: 500,
    };
  }

  /**
   * Generate weekly insights
   */
  async getWeeklyInsights(
    userId: string,
    weekStart?: Date
  ): Promise<WeeklyInsight> {
    const period = this.getWeekPeriod(weekStart);

    // Fetch expenses for the week
    const expenses = await this.getExpensesForPeriod(userId, period.start, period.end);

    // Calculate metrics
    const totalSpent = this.calculateTotalSpent(expenses);
    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);
    const topMerchants = this.calculateTopMerchants(expenses);
    const previousWeekComparison = await this.compareToPreviousWeek(userId, period, totalSpent);
    const insights = await this.generateInsights(expenses, period, 'week');
    const anomalies = this.detectAnomalies(expenses, period);

    return {
      user_id: userId,
      week_start: period.start,
      week_end: period.end,
      total_spent: totalSpent,
      category_breakdown: categoryBreakdown,
      top_merchants: topMerchants,
      comparison_to_previous_week: previousWeekComparison,
      insights,
      anomalies,
    };
  }

  /**
   * Generate monthly insights
   */
  async getMonthlyInsights(
    userId: string,
    month?: number,
    year?: number
  ): Promise<MonthlyInsight> {
    const period = this.getMonthPeriod(month, year);

    // Fetch expenses for the month
    const expenses = await this.getExpensesForPeriod(userId, period.start, period.end);

    // Calculate metrics
    const totalSpent = this.calculateTotalSpent(expenses);
    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);
    const topMerchants = this.calculateTopMerchants(expenses);
    const previousMonthComparison = await this.compareToPreviousMonth(userId, period, totalSpent);
    const sameMonthLastYearComparison = await this.compareToSameMonthLastYear(userId, period, totalSpent);
    const insights = await this.generateInsights(expenses, period, 'month');
    const budgetStatus = this.calculateBudgetStatus(expenses);
    const trends = this.calculateTrends(expenses);

    return {
      user_id: userId,
      month: period.start.toLocaleString('default', { month: 'long' }),
      year: period.start.getFullYear(),
      total_spent: totalSpent,
      category_breakdown: categoryBreakdown,
      top_merchants: topMerchants,
      comparison_to_previous_month: previousMonthComparison,
      comparison_to_same_month_last_year: sameMonthLastYearComparison,
      insights,
      budget_status: budgetStatus,
      trends,
    };
  }

  /**
   * Detect spending anomalies
   */
  async getAnomalies(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnomalyAlert[]> {
    const period = startDate && endDate
      ? { start: startDate, end: endDate }
      : this.getWeekPeriod();

    const expenses = await this.getExpensesForPeriod(userId, period.start, period.end);
    return this.detectAnomalies(expenses, period);
  }

  /**
   * Get budget tracking data
   */
  async getBudgetTracking(
    userId: string,
    tenantId?: string
  ): Promise<BudgetStatus[]> {
    const period = this.getMonthPeriod();
    const expenses = await this.getExpensesForPeriod(userId, period.start, period.end);
    return this.calculateBudgetStatus(expenses);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Get week period
   */
  private getWeekPeriod(weekStart?: Date): SpendingPeriod {
    const start = weekStart
      ? new Date(weekStart)
      : new Date();

    // Get start of week (Sunday)
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get month period
   */
  private getMonthPeriod(month?: number, year?: number): SpendingPeriod {
    const now = new Date();
    const targetMonth = month ?? now.getMonth();
    const targetYear = year ?? now.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Get expenses for period (simulated)
   */
  private async getExpensesForPeriod(
    userId: string,
    start: Date,
    end: Date
  ): Promise<ExpenseBase[]> {
    // In production, fetch from database
    // For demo, return sample expenses
    const sampleExpenses: ExpenseBase[] = [
      {
        expense_id: 'EXP-001',
        user_id: userId,
        merchant_name: 'Dominos Pizza',
        category: 'food',
        amount: 850,
        currency: 'INR',
        date: new Date(),
        created_at: new Date(),
      },
      {
        expense_id: 'EXP-002',
        user_id: userId,
        merchant_name: 'Uber',
        category: 'travel',
        amount: 320,
        currency: 'INR',
        date: new Date(),
        created_at: new Date(),
      },
      {
        expense_id: 'EXP-003',
        user_id: userId,
        merchant_name: 'Amazon',
        category: 'shopping',
        amount: 2499,
        currency: 'INR',
        date: new Date(),
        created_at: new Date(),
      },
      {
        expense_id: 'EXP-004',
        user_id: userId,
        merchant_name: 'Netflix',
        category: 'entertainment',
        amount: 649,
        currency: 'INR',
        date: new Date(),
        created_at: new Date(),
      },
    ];

    return sampleExpenses.filter(e =>
      e.date >= start && e.date <= end
    );
  }

  /**
   * Calculate total spent
   */
  private calculateTotalSpent(expenses: ExpenseBase[]): number {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(expenses: ExpenseBase[]): CategorySpending[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    for (const expense of expenses) {
      const current = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
      });
    }

    const total = this.calculateTotalSpent(expenses);
    const breakdown: CategorySpending[] = [];

    for (const [category, data] of categoryMap.entries()) {
      breakdown.push({
        category,
        amount: data.amount,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        count: data.count,
        average_transaction: data.count > 0 ? data.amount / data.count : 0,
        trend: this.calculateTrend(category),
        trend_percentage: Math.random() * 40 - 20, // Simulated
      });
    }

    return breakdown.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate top merchants
   */
  private calculateTopMerchants(expenses: ExpenseBase[]): MerchantSpending[] {
    const merchantMap = new Map<string, { amount: number; count: number; category: string; lastDate: Date }>();

    for (const expense of expenses) {
      const current = merchantMap.get(expense.merchant_name) || {
        amount: 0,
        count: 0,
        category: expense.category,
        lastDate: new Date(0),
      };
      merchantMap.set(expense.merchant_name, {
        amount: current.amount + expense.amount,
        count: current.count + 1,
        category: expense.category,
        lastDate: expense.date > current.lastDate ? expense.date : current.lastDate,
      });
    }

    const merchants: MerchantSpending[] = [];
    for (const [merchant, data] of merchantMap.entries()) {
      merchants.push({
        merchant,
        amount: data.amount,
        count: data.count,
        category: data.category,
        last_transaction: data.lastDate,
      });
    }

    return merchants.sort((a, b) => b.amount - a.amount).slice(0, 10);
  }

  /**
   * Compare to previous week
   */
  private async compareToPreviousWeek(
    userId: string,
    currentPeriod: SpendingPeriod,
    currentTotal: number
  ): Promise<number> {
    const prevPeriod = {
      start: new Date(currentPeriod.start.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(currentPeriod.end.getTime() - 7 * 24 * 60 * 60 * 1000),
    };

    const prevExpenses = await this.getExpensesForPeriod(userId, prevPeriod.start, prevPeriod.end);
    const prevTotal = this.calculateTotalSpent(prevExpenses);

    if (prevTotal === 0) return 0;
    return ((currentTotal - prevTotal) / prevTotal) * 100;
  }

  /**
   * Compare to previous month
   */
  private async compareToPreviousMonth(
    userId: string,
    currentPeriod: SpendingPeriod,
    currentTotal: number
  ): Promise<number> {
    const prevPeriod = {
      start: new Date(currentPeriod.start.getFullYear(), currentPeriod.start.getMonth() - 1, 1),
      end: new Date(currentPeriod.start.getFullYear(), currentPeriod.start.getMonth(), 0),
    };

    const prevExpenses = await this.getExpensesForPeriod(userId, prevPeriod.start, prevPeriod.end);
    const prevTotal = this.calculateTotalSpent(prevExpenses);

    if (prevTotal === 0) return 0;
    return ((currentTotal - prevTotal) / prevTotal) * 100;
  }

  /**
   * Compare to same month last year
   */
  private async compareToSameMonthLastYear(
    userId: string,
    currentPeriod: SpendingPeriod,
    currentTotal: number
  ): Promise<number> {
    const prevPeriod = {
      start: new Date(currentPeriod.start.getFullYear() - 1, currentPeriod.start.getMonth(), 1),
      end: new Date(currentPeriod.start.getFullYear() - 1, currentPeriod.start.getMonth() + 1, 0),
    };

    const prevExpenses = await this.getExpensesForPeriod(userId, prevPeriod.start, prevPeriod.end);
    const prevTotal = this.calculateTotalSpent(prevExpenses);

    if (prevTotal === 0) return 0;
    return ((currentTotal - prevTotal) / prevTotal) * 100;
  }

  /**
   * Generate insights
   */
  private async generateInsights(
    expenses: ExpenseBase[],
    period: SpendingPeriod,
    periodType: 'week' | 'month'
  ): Promise<SpendInsight[]> {
    const insights: SpendInsight[] = [];

    // Spending trend insight
    const totalSpent = this.calculateTotalSpent(expenses);
    if (totalSpent > 0) {
      insights.push({
        insight_id: `INS-${Date.now()}-trend`,
        user_id: expenses[0]?.user_id || '',
        type: 'spending_trend',
        title: `${periodType === 'week' ? 'Weekly' : 'Monthly'} Spending Summary`,
        description: `You spent ${totalSpent.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} this ${periodType}.`,
        data: {
          metric: totalSpent,
        },
        period_start: period.start,
        period_end: period.end,
        generated_at: new Date(),
        actionable: true,
        action_suggestion: 'Review your top spending categories to identify potential savings.',
      });
    }

    // Category breakdown insight
    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);
    const topCategory = categoryBreakdown[0];
    if (topCategory && topCategory.percentage > 30) {
      insights.push({
        insight_id: `INS-${Date.now()}-category`,
        user_id: expenses[0]?.user_id || '',
        type: 'category_breakdown',
        title: `${topCategory.category} Dominates Spending`,
        description: `${topCategory.category.charAt(0).toUpperCase() + topCategory.category.slice(1)} accounts for ${topCategory.percentage.toFixed(0)}% of your spending.`,
        data: {
          category: topCategory.category,
          metric: topCategory.amount,
          percentage: topCategory.percentage,
        },
        period_start: period.start,
        period_end: period.end,
        generated_at: new Date(),
        actionable: true,
        action_suggestion: `Consider setting a budget limit for ${topCategory.category} expenses.`,
      });
    }

    // Savings opportunity insight
    const avgTransaction = expenses.length > 0 ? totalSpent / expenses.length : 0;
    if (avgTransaction > 500) {
      insights.push({
        insight_id: `INS-${Date.now()}-savings`,
        user_id: expenses[0]?.user_id || '',
        type: 'savings_opportunity',
        title: 'Potential Savings Identified',
        description: `Your average transaction is ${avgTransaction.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}. Reviewing smaller purchases could save money.`,
        data: {
          metric: avgTransaction,
        },
        period_start: period.start,
        period_end: period.end,
        generated_at: new Date(),
        actionable: true,
        action_suggestion: 'Look for subscription services you no longer use.',
      });
    }

    return insights;
  }

  /**
   * Detect anomalies
   */
  private detectAnomalies(expenses: ExpenseBase[], period: SpendingPeriod): AnomalyAlert[] {
    const anomalies: AnomalyAlert[] = [];

    if (expenses.length < 3) return anomalies;

    // Calculate statistics
    const amounts = expenses.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
    );

    // Detect amount anomalies
    for (const expense of expenses) {
      if (expense.amount < this.anomalyConfig.minAmount) continue;

      const zScore = (expense.amount - mean) / (stdDev || 1);
      if (Math.abs(zScore) > this.anomalyConfig.stdDevMultiplier) {
        anomalies.push({
          anomaly_id: `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'unusual_amount',
          severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
          title: 'Unusual Transaction Amount',
          description: `${expense.merchant_name} transaction of ${expense.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} is ${Math.abs(zScore).toFixed(1)} standard deviations from your average.`,
          detected_value: expense.amount,
          expected_value: mean,
          deviation_percentage: ((expense.amount - mean) / mean) * 100,
          detected_at: new Date(),
          category: expense.category,
          merchant: expense.merchant_name,
        });
      }
    }

    // Detect category spikes
    const categoryTotals = new Map<string, number>();
    for (const expense of expenses) {
      const current = categoryTotals.get(expense.category) || 0;
      categoryTotals.set(expense.category, current + expense.amount);
    }

    const avgCategorySpending = this.calculateTotalSpent(expenses) / (categoryTotals.size || 1);
    for (const [category, total] of categoryTotals.entries()) {
      if (total > avgCategorySpending * 2) {
        anomalies.push({
          anomaly_id: `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'category_spike',
          severity: 'medium',
          title: `${category} Spending Spike`,
          description: `You've spent ${total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} on ${category}, which is unusually high.`,
          detected_value: total,
          expected_value: avgCategorySpending,
          deviation_percentage: ((total - avgCategorySpending) / avgCategorySpending) * 100,
          detected_at: new Date(),
          category,
        });
      }
    }

    // Detect new merchants
    for (const expense of expenses) {
      // In production, check against historical merchant list
      const isNewMerchant = Math.random() > 0.8; // Simulated
      if (isNewMerchant && expense.amount > 1000) {
        anomalies.push({
          anomaly_id: `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'new_merchant',
          severity: 'low',
          title: 'First Transaction with New Merchant',
          description: `This is your first transaction with ${expense.merchant_name}. Verify if this is expected.`,
          detected_value: expense.amount,
          expected_value: 0,
          deviation_percentage: 100,
          detected_at: new Date(),
          merchant: expense.merchant_name,
        });
      }
    }

    return anomalies;
  }

  /**
   * Calculate budget status
   */
  private calculateBudgetStatus(expenses: ExpenseBase[]): BudgetStatus[] {
    const defaultBudgets: Record<string, number> = {
      food: 30000,
      travel: 25000,
      shopping: 50000,
      entertainment: 10000,
      utilities: 15000,
      healthcare: 10000,
      education: 20000,
      other: 20000,
    };

    const status: BudgetStatus[] = [];

    for (const category of EXPENSE_CATEGORIES) {
      const categoryExpenses = expenses.filter(e => e.category === category);
      const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budget = defaultBudgets[category] || 20000;

      status.push({
        category,
        budget_amount: budget,
        spent_amount: spent,
        remaining: Math.max(0, budget - spent),
        percentage_used: budget > 0 ? (spent / budget) * 100 : 0,
        alert_level: spent > budget ? 'red' : spent > budget * 0.8 ? 'yellow' : 'green',
        projected_overage: spent > budget ? spent - budget : undefined,
      });
    }

    return status;
  }

  /**
   * Calculate spending trends
   */
  private calculateTrends(expenses: ExpenseBase[]): Array<{ period: string; category: string; amount: number; trend: 'up' | 'down' | 'stable' }> {
    // Group by week and category
    const trends: Array<{ period: string; category: string; amount: number; trend: 'up' | 'down' | 'stable' }> = [];

    // In production, compare to previous periods
    for (const category of EXPENSE_CATEGORIES) {
      const categoryExpenses = expenses.filter(e => e.category === category);
      if (categoryExpenses.length === 0) continue;

      const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const trendValue = Math.random() * 30 - 15; // Simulated trend

      trends.push({
        period: 'current',
        category,
        amount: total,
        trend: trendValue > 5 ? 'up' : trendValue < -5 ? 'down' : 'stable',
      });
    }

    return trends;
  }

  /**
   * Calculate category trend
   */
  private calculateTrend(category: string): 'up' | 'down' | 'stable' {
    const trend = Math.random() * 30 - 15;
    return trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable';
  }

  /**
   * Get spending by time period
   */
  async getSpendingByTimePeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; amount: number }>> {
    const expenses = await this.getExpensesForPeriod(userId, startDate, endDate);
    const grouped: Map<string, number> = new Map();

    for (const expense of expenses) {
      let key: string;
      switch (granularity) {
        case 'week':
          const weekStart = new Date(expense.date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = expense.date.toISOString().slice(0, 7);
          break;
        default:
          key = expense.date.toISOString().split('T')[0];
      }
      grouped.set(key, (grouped.get(key) || 0) + expense.amount);
    }

    return Array.from(grouped.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get category comparison
   */
  async getCategoryComparison(
    userId: string,
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date
  ): Promise<Record<string, { current: number; previous: number; change: number }>> {
    const currentExpenses = await this.getExpensesForPeriod(userId, period1Start, period1End);
    const previousExpenses = await this.getExpensesForPeriod(userId, period2Start, period2End);

    const result: Record<string, { current: number; previous: number; change: number }> = {};

    for (const category of EXPENSE_CATEGORIES) {
      const current = currentExpenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      const previous = previousExpenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);

      result[category] = {
        current,
        previous,
        change: previous > 0 ? ((current - previous) / previous) * 100 : 0,
      };
    }

    return result;
  }
}

// Export singleton instance
export const insightsService = new InsightsService();
