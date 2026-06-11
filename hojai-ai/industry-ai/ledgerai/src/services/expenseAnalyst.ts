/**
 * LEDGERAI - Expense Analyst AI Agent
 * Expense tracking, analysis, and optimization recommendations
 */

import { Transaction, Account, Budget } from '../models';
import logger from '../middleware/logger';

interface ExpenseCategory {
  category: string;
  total: number;
  count: number;
  average: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  percentage: number;
}

interface ExpenseAnalysis {
  totalExpenses: number;
  categoryBreakdown: ExpenseCategory[];
  topExpenses: Array<{
    date: Date;
    description: string;
    amount: number;
    category: string;
  }>;
  anomalies: Array<{
    description: string;
    amount: number;
    category: string;
    reason: string;
  }>;
  savingsOpportunities: Array<{
    category: string;
    potentialSavings: number;
    recommendations: string[];
  }>;
 periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
}

interface BudgetComparison {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'on_track' | 'over_budget' | 'under_budget';
  projectedEndOfPeriod: number;
  recommendations: string[];
}

export class ExpenseAnalyst {
  name = 'Expense Analyst';
  role = 'Expense tracking, analysis, and optimization';
  status: 'idle' | 'working' | 'error' = 'idle';
  lastActivity?: Date;

  // Anomaly detection thresholds
  private anomalyThresholds = {
    highTransactionPercentile: 90, // Top 10% of transactions
    suddenIncreasePercent: 50,     // 50% increase from average
    recurringExpenseDays: 30 // Recurring within 30 days
  };

  /**
   * Analyze expenses for a given period
   */
  async analyzeExpenses(startDate?: Date, endDate?: Date): Promise<ExpenseAnalysis> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const end = endDate || new Date();
      const start = startDate || new Date(end.getFullYear(), end.getMonth(), 1);

      // Get expense transactions
      const transactions = await Transaction.find({
        date: { $gte: start, $lte: end },
        amount: { $lt: 0 } // Expenses are negative
      }).populate('accounts.accountId', 'code name type category');

      const totalExpenses = Math.abs(transactions.reduce((sum, t) => sum + t.amount, 0));

      // Category breakdown
      const categoryTotals: Record<string, { total: number; count: number }> = {};
      transactions.forEach(tx => {
        const cat = tx.category || 'Uncategorized';
        if (!categoryTotals[cat]) {
          categoryTotals[cat] = { total: 0, count: 0 };
        }
        categoryTotals[cat].total += Math.abs(tx.amount);
        categoryTotals[cat].count += 1;
      });

      const categoryBreakdown: ExpenseCategory[] = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category,
          total: Math.round(data.total * 100) / 100,
          count: data.count,
          average: Math.round((data.total / data.count) * 100) / 100,
          trend: 'stable' as const,
          percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 1000) / 10 : 0
        }))
        .sort((a, b) => b.total - a.total);

      // Calculate trends for each category
      await this.calculateCategoryTrends(categoryBreakdown, start, end);

      // Top expenses
      const topExpenses = transactions
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
        .slice(0, 10)
        .map(tx => ({
          date: tx.date,
          description: tx.description,
          amount: Math.abs(tx.amount),
          category: tx.category
        }));

      // Detect anomalies
      const anomalies = await this.detectAnomalies(transactions);

      // Savings opportunities
      const savingsOpportunities = this.identifySavingsOpportunities(categoryBreakdown);

      // Period comparison
      const periodLength = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodLength);
      const previousEnd = new Date(start.getTime() - 1);

      const previousTransactions = await Transaction.find({
        date: { $gte: previousStart, $lte: previousEnd },
        amount: { $lt: 0 }
      });

      const previousTotal = Math.abs(previousTransactions.reduce((sum, t) => sum + t.amount, 0));
      const change = totalExpenses - previousTotal;
      const changePercentage = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

      logger.info('Expense analysis completed', {
        period: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
        totalExpenses,
        categories: categoryBreakdown.length,
        anomalies: anomalies.length
      });

      this.status = 'idle';

      return {
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        categoryBreakdown,
        topExpenses,
        anomalies,
        savingsOpportunities,
        periodComparison: {
          currentPeriod: Math.round(totalExpenses * 100) / 100,
          previousPeriod: Math.round(previousTotal * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercentage: Math.round(changePercentage * 10) / 10
        }
      };
    } catch (error) {
      this.status = 'error';
      logger.error('Expense analysis error', { error });
      throw error;
    }
  }

  /**
   * Calculate trends for each expense category
   */
  private async calculateCategoryTrends(
    categories: ExpenseCategory[],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const periodLength = endDate.getTime() - startDate.getTime();
    const halfPeriod = periodLength / 2;

    const firstHalfStart = startDate;
    const firstHalfEnd = new Date(startDate.getTime() + halfPeriod);
    const secondHalfStart = new Date(startDate.getTime() + halfPeriod);
    const secondHalfEnd = endDate;

    for (const category of categories) {
      const [firstHalf, secondHalf] = await Promise.all([
        Transaction.find({
          date: { $gte: firstHalfStart, $lte: firstHalfEnd },
          category: category.category,
          amount: { $lt: 0 }
        }),
        Transaction.find({
          date: { $gte: secondHalfStart, $lte: secondHalfEnd },
          category: category.category,
          amount: { $lt: 0 }
        })
      ]);

      const firstTotal = Math.abs(firstHalf.reduce((sum, t) => sum + t.amount, 0));
      const secondTotal = Math.abs(secondHalf.reduce((sum, t) => sum + t.amount, 0));

      if (firstTotal > 0) {
        const changePercent = ((secondTotal - firstTotal) / firstTotal) * 100;
        if (changePercent > 10) {
          category.trend = 'increasing';
        } else if (changePercent < -10) {
          category.trend = 'decreasing';
        }
      }
    }
  }

  /**
   * Detect anomalies in expense transactions
   */
  private async detectAnomalies(transactions: any[]): Promise<ExpenseAnalysis['anomalies']> {
    const anomalies: ExpenseAnalysis['anomalies'] = [];

    if (transactions.length < 5) return anomalies;

    // Calculate amounts for percentile analysis
    const amounts = transactions.map(t => Math.abs(t.amount)).sort((a, b) => a - b);
    const p90Index = Math.floor(amounts.length * 0.9);
    const p90 = amounts[p90Index] || 0;
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check for high-value transactions
    for (const tx of transactions) {
      const amount = Math.abs(tx.amount);

      // Check if in top 10%
      if (amount >= p90 && amount > average * 2) {
        anomalies.push({
          description: tx.description,
          amount: Math.round(amount * 100) / 100,
          category: tx.category,
          reason: `High-value transaction (top 10%, ${Math.round((amount / average) * 10) / 10}x average)`
        });
      }

      // Check for sudden increases (similar descriptions)
      const similar = transactions.filter(
        t => t.category === tx.category &&
             t._id.toString() !== tx._id.toString() &&
             this.similarity(t.description, tx.description) > 0.7
      );

      if (similar.length > 0) {
        const similarAvg = similar.reduce((sum, t) => sum + Math.abs(t.amount), 0) / similar.length;
        if (amount > similarAvg * 1.5) {
          anomalies.push({
            description: tx.description,
            amount: Math.round(amount * 100) / 100,
            category: tx.category,
            reason: `Unusual amount for category (${Math.round((amount / similarAvg) * 10) / 10}x typical)`
          });
        }
      }
    }

    return anomalies.slice(0, 10); // Limit to top 10 anomalies
  }

  /**
   * Simple string similarity check
   */
  private similarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Simple word overlap check
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));

    return intersection.size / Math.max(words1.size, words2.size);
  }

  /**
   * Identify savings opportunities
   */
  private identifySavingsOpportunities(categories: ExpenseCategory[]): ExpenseAnalysis['savingsOpportunities'] {
    const opportunities: ExpenseAnalysis['savingsOpportunities'] = [];

    for (const category of categories) {
      const recommendations: string[] = [];
      let potentialSavings = 0;

      // High expense categories
      if (category.percentage > 20) {
        recommendations.push('Review necessity and explore alternatives');
        potentialSavings += category.total * 0.1; // Assume 10% savings potential
      }

      // Increasing trends
      if (category.trend === 'increasing') {
        recommendations.push('Investigate cause of increase');
        recommendations.push('Set spending limits or alerts');
      }

      // High frequency, low average (many small purchases)
      if (category.count > 20 && category.average < 100) {
        recommendations.push('Consider bulk purchasing or contracts');
        potentialSavings += category.total * 0.05;
      }

      if (recommendations.length > 0) {
        opportunities.push({
          category: category.category,
          potentialSavings: Math.round(potentialSavings * 100) / 100,
          recommendations
        });
      }
    }

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Compare actual expenses against budgets
   */
  async compareToBudget(period?: string): Promise<BudgetComparison[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const query: any = { isActive: true };
      if (period) {
        query.period = period;
      }

      const budgets = await Budget.find(query);
      const comparisons: BudgetComparison[] = [];

      for (const budget of budgets) {
        // Get actual spending
        const transactions = await Transaction.find({
          date: { $gte: budget.startDate, $lte: budget.endDate },
          category: { $regex: new RegExp(budget.category, 'i') },
          amount: { $lt: 0 }
        });

        const actual = Math.abs(transactions.reduce((sum, t) => sum + t.amount, 0));
        const variance = actual - budget.budgeted;
        const variancePercentage = budget.budgeted > 0 ? (variance / budget.budgeted) * 100 : 0;

        let status: BudgetComparison['status'];
        let recommendations: string[] = [];

        if (Math.abs(variancePercentage) <= 5) {
          status = 'on_track';
        } else if (variancePercentage > 5) {
          status = 'over_budget';
          recommendations.push(`Reduce ${budget.category} spending by ${Math.abs(Math.round(variance))}`);
          recommendations.push('Review recent large transactions');
          recommendations.push('Consider reallocating from under-spending categories');
        } else {
          status = 'under_budget';
          recommendations.push(`${budget.category} is ${Math.abs(Math.round(variance))} under budget`);
          recommendations.push('Consider reallocating funds or adjusting future budgets');
        }

        // Project end-of-period spending
        const now = new Date();
        const periodProgress = Math.min(1, (now.getTime() - budget.startDate.getTime()) /
          (budget.endDate.getTime() - budget.startDate.getTime()));
        const projectedEndOfPeriod = periodProgress > 0
          ? actual / periodProgress
          : actual;

        comparisons.push({
          category: budget.category,
          budgeted: budget.budgeted,
          actual: Math.round(actual * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          variancePercentage: Math.round(variancePercentage * 10) / 10,
          status,
          projectedEndOfPeriod: Math.round(projectedEndOfPeriod * 100) / 100,
          recommendations
        });
      }

      logger.info('Budget comparison completed', {
        budgetsAnalyzed: comparisons.length,
        overBudget: comparisons.filter(c => c.status === 'over_budget').length
      });

      this.status = 'idle';

      return comparisons;
    } catch (error) {
      this.status = 'error';
      logger.error('Budget comparison error', { error });
      throw error;
    }
  }

  /**
   * Get recurring expenses
   */
  async getRecurringExpenses(): Promise<Array<{
    category: string;
    description: string;
    averageAmount: number;
    frequency: string;
    nextExpected: Date;
    stability: 'high' | 'medium' | 'low';
  }>> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      // Get last 90 days of expenses
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const transactions = await Transaction.find({
        date: { $gte: ninetyDaysAgo },
        amount: { $lt: 0 }
      }).sort({ date: 1 });

      // Group by similar descriptions
      const groups: Record<string, any[]> = {};
      transactions.forEach(tx => {
        const key = tx.category || 'Other';
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
      });

      const recurring: Array<{
        category: string;
        description: string;
        averageAmount: number;
        frequency: string;
        nextExpected: Date;
        stability: 'high' | 'medium' | 'low';
      }> = [];

      for (const [category, txs] of Object.entries(groups)) {
        if (txs.length < 2) continue;

        // Calculate average interval
        const intervals: number[] = [];
        for (let i = 1; i < txs.length; i++) {
          intervals.push(txs[i].date.getTime() - txs[i - 1].date.getTime());
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const avgAmount = Math.abs(txs.reduce((sum, t) => sum + t.amount, 0) / txs.length);

        // Determine frequency
        let frequency: string;
        const days = avgInterval / (1000 * 60 * 60 * 24);
        if (days >= 25 && days <= 35) frequency = 'Monthly';
        else if (days >= 6 && days <= 8) frequency = 'Weekly';
        else if (days >= 85 && days <= 95) frequency = 'Quarterly';
        else if (days >= 360) frequency = 'Yearly';
        else frequency = `Every ${Math.round(days)} days`;

        // Calculate stability (variance in amounts)
        const amounts = txs.map(t => Math.abs(t.amount));
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        const cv = avg > 0 ? stdDev / avg : 0;

        let stability: 'high' | 'medium' | 'low';
        if (cv < 0.1) stability = 'high';
        else if (cv < 0.25) stability = 'medium';
        else stability = 'low';

        // Calculate next expected
        const lastTx = txs[txs.length - 1];
        const nextExpected = new Date(lastTx.date.getTime() + avgInterval);

        recurring.push({
          category,
          description: txs[0].description,
          averageAmount: Math.round(avgAmount * 100) / 100,
          frequency,
          nextExpected,
          stability
        });
      }

      this.status = 'idle';

      return recurring.sort((a, b) => b.averageAmount - a.averageAmount);
    } catch (error) {
      this.status = 'error';
      logger.error('Recurring expenses error', { error });
      throw error;
    }
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: this.status,
      lastActivity: this.lastActivity,
      capabilities: [
        'Expense analysis and categorization',
        'Anomaly detection',
        'Savings opportunity identification',
        'Budget comparison',
        'Recurring expense tracking',
        'Period-over-period comparison'
      ]
    };
  }
}

export default new ExpenseAnalyst();
