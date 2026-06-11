/**
 * LEDGERAI - CFO AI Agent
 * Financial analysis, forecasting, and reporting
 */

import { Transaction, Account, Budget, Invoice } from '../models';
import logger from '../middleware/logger';

interface FinancialSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  period: { start: Date; end: Date };
}

interface CashFlowAnalysis {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  cashBalance: number;
}

interface ForecastResult {
  period: string;
  predictedRevenue: number;
  predictedExpenses: number;
  predictedNetIncome: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
}

interface BudgetAnalysis {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'on_track' | 'over_budget' | 'under_budget';
  recommendations: string[];
}

interface RatioAnalysis {
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  grossMargin: number;
  netMargin: number;
  roe: number;
  interpretation: string;
}

export class AICFOAgent {
  name = 'CFO Agent';
  role = 'Financial analysis, forecasting, and strategic insights';
  status: 'idle' | 'working' | 'error' = 'idle';
  lastActivity?: Date;

  /**
   * Generate comprehensive financial analysis
   */
  async analyze(startDate?: Date, endDate?: Date): Promise<{
    summary: FinancialSummary;
    cashFlow: CashFlowAnalysis;
    ratios: RatioAnalysis;
    trends: { category: string; growth: number }[];
  }> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const end = endDate || new Date();
      const start = startDate || new Date(end.getFullYear(), end.getMonth(), 1);

      // Get accounts by type
      const accounts = await Account.find({ isActive: true });
      const assets = accounts.filter(a => a.type === 'asset');
      const liabilities = accounts.filter(a => a.type === 'liability');
      const equity = accounts.filter(a => a.type === 'equity');
      const revenues = accounts.filter(a => a.type === 'revenue');
      const expenses = accounts.filter(a => a.type === 'expense');

      // Calculate totals
      const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
      const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);
      const totalRevenue = revenues.reduce((sum, a) => sum + a.balance, 0);
      const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);

      // Get transactions for the period
      const transactions = await Transaction.find({
        date: { $gte: start, $lte: end }
      });

      // Calculate cash flow
      const cashFlow = await this.calculateCashFlow(start, end);

      // Calculate ratios
      const ratios = this.calculateRatios(totalAssets, totalLiabilities, totalEquity, totalRevenue, totalExpenses);

      // Calculate trends
      const trends = await this.calculateTrends(start, end);

      logger.info('Financial analysis completed', {
        period: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses
      });

      this.status = 'idle';

      return {
        summary: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          totalRevenue,
          totalExpenses,
          netIncome: totalRevenue - totalExpenses,
          period: { start, end }
        },
        cashFlow,
        ratios,
        trends
      };
    } catch (error) {
      this.status = 'error';
      logger.error('CFO analysis error', { error });
      throw error;
    }
  }

  /**
   * Calculate cash flow for a period
   */
  private async calculateCashFlow(startDate: Date, endDate: Date): Promise<CashFlowAnalysis> {
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    });

    let operatingCashFlow = 0;
    let investingCashFlow = 0;
    let financingCashFlow = 0;

    const investingKeywords = ['purchase', 'sale', 'equipment', 'investment', 'asset'];
    const financingKeywords = ['loan', 'borrow', 'repay', 'dividend', 'equity', 'financing'];

    for (const tx of transactions) {
      const description = tx.description.toLowerCase();
      const isExpense = tx.amount > 0;

      if (investingKeywords.some(k => description.includes(k))) {
        investingCashFlow += isExpense ? -tx.amount : tx.amount;
      } else if (financingKeywords.some(k => description.includes(k))) {
        financingCashFlow += isExpense ? -tx.amount : tx.amount;
      } else {
        operatingCashFlow += isExpense ? -tx.amount : tx.amount;
      }
    }

    // Get cash accounts balance
    const cashAccounts = await Account.find({
      category: { $in: ['cash', 'bank'] },
      isActive: true
    });

    const cashBalance = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow: operatingCashFlow + investingCashFlow + financingCashFlow,
      cashBalance
    };
  }

  /**
   * Calculate financial ratios
   */
  private calculateRatios(
    totalAssets: number,
    totalLiabilities: number,
    totalEquity: number,
    totalRevenue: number,
    totalExpenses: number
  ): RatioAnalysis {
    // Current Ratio (current assets / current liabilities)
    const currentRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : 0;

    // Quick Ratio (exclude inventory)
    const quickRatio = totalLiabilities > 0 ? (totalAssets * 0.9) / totalLiabilities : 0;

    // Debt to Equity
    const debtToEquity = totalEquity > 0 ? totalLiabilities / totalEquity : 0;

    // Gross Margin
    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    // Net Margin
    const netMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

    // Return on Equity (assuming net income from equity change)
    const netIncome = totalRevenue - totalExpenses;
    const roe = totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0;

    // Generate interpretation
    let interpretation = '';
    if (currentRatio > 2 && quickRatio > 1) {
      interpretation = 'Strong liquidity position. Company can meet short-term obligations comfortably.';
    } else if (currentRatio > 1 && quickRatio > 0.5) {
      interpretation = 'Adequate liquidity. Monitor cash flow closely.';
    } else {
      interpretation = 'Liquidity concerns. Consider improving working capital management.';
    }

    if (debtToEquity > 2) {
      interpretation += ' High leverage may pose risk during economic downturns.';
    } else if (debtToEquity < 0.5) {
      interpretation += ' Conservative debt structure provides flexibility.';
    }

    return {
      currentRatio: Math.round(currentRatio * 100) / 100,
      quickRatio: Math.round(quickRatio * 100) / 100,
      debtToEquity: Math.round(debtToEquity * 100) / 100,
      grossMargin: Math.round(grossMargin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
      roe: Math.round(roe * 10) / 10,
      interpretation
    };
  }

  /**
   * Calculate category trends
   */
  private async calculateTrends(startDate: Date, endDate: Date): Promise<{ category: string; growth: number }[]> {
    const transactions = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Calculate average transaction size as growth indicator
    return transactions.map(t => ({
      category: t._id,
      growth: t.count > 0 ? Math.round((t.total / t.count) * 100) / 100 : 0
    }));
  }

  /**
   * Generate financial forecast
   */
  async forecast(months: number = 3): Promise<ForecastResult[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const forecasts: ForecastResult[] = [];
      const currentDate = new Date();

      // Get historical data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const historicalTransactions = await Transaction.find({
        date: { $gte: sixMonthsAgo, $lte: currentDate }
      });

      // Calculate monthly averages
      const monthlyData = await this.getMonthlyData(sixMonthsAgo, currentDate);

      const avgRevenue = monthlyData.avgRevenue;
      const avgExpenses = monthlyData.avgExpenses;

      // Calculate growth rate
      const growthRate = this.calculateGrowthRate(monthlyData.revenueByMonth);

      for (let i = 1; i <= months; i++) {
        const forecastDate = new Date(currentDate);
        forecastDate.setMonth(forecastDate.getMonth() + i);

        // Apply growth rate with some randomness for realism
        const growthFactor = Math.pow(1 + growthRate, i);
        const seasonalFactor = this.getSeasonalFactor(forecastDate.getMonth());

        const predictedRevenue = Math.round(avgRevenue * growthFactor * seasonalFactor);
        const predictedExpenses = Math.round(avgExpenses * growthFactor * 0.8); // Expenses grow slower
        const predictedNetIncome = predictedRevenue - predictedExpenses;

        // Calculate confidence (decreases with distance)
        const confidence = Math.max(0.5, 0.95 - (i * 0.1));

        // Determine trend
        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (growthRate > 0.02) trend = 'increasing';
        if (growthRate < -0.02) trend = 'decreasing';

        forecasts.push({
          period: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
          predictedRevenue,
          predictedExpenses,
          predictedNetIncome,
          confidence: Math.round(confidence * 100) / 100,
          trend,
          factors: this.generateForecastFactors(growthRate, seasonalFactor)
        });
      }

      logger.info('Financial forecast generated', {
        months,
        avgRevenue,
        avgExpenses,
        growthRate
      });

      this.status = 'idle';

      return forecasts;
    } catch (error) {
      this.status = 'error';
      logger.error('CFO forecast error', { error });
      throw error;
    }
  }

  /**
   * Get monthly breakdown of historical data
   */
  private async getMonthlyData(startDate: Date, endDate: Date): Promise<{
    avgRevenue: number;
    avgExpenses: number;
    revenueByMonth: number[];
  }> {
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate }
    });

    // Group by month
    const monthlyTotals: Record<string, { revenue: number; expenses: number }> = {};

    transactions.forEach(tx => {
      const monthKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { revenue: 0, expenses: 0 };
      }

      // Assume positive amount is revenue, negative is expense
      if (tx.amount > 0) {
        monthlyTotals[monthKey].revenue += tx.amount;
      } else {
        monthlyTotals[monthKey].expenses += Math.abs(tx.amount);
      }
    });

    const months = Object.keys(monthlyTotals).length || 1;
    const revenueByMonth = Object.values(monthlyTotals).map(m => m.revenue);
    const expensesByMonth = Object.values(monthlyTotals).map(m => m.expenses);

    const totalRevenue = revenueByMonth.reduce((a, b) => a + b, 0);
    const totalExpenses = expensesByMonth.reduce((a, b) => a + b, 0);

    return {
      avgRevenue: totalRevenue / months,
      avgExpenses: totalExpenses / months,
      revenueByMonth
    };
  }

  /**
   * Calculate growth rate from historical data
   */
  private calculateGrowthRate(data: number[]): number {
    if (data.length < 2) return 0;

    // Simple linear regression
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumX2 += i * i;
    }

    const avgX = sumX / n;
    const avgY = sumY / n;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = avgY || 1;

    return slope / avgValue;
  }

  /**
   * Get seasonal factor based on month
   */
  private getSeasonalFactor(month: number): number {
    // Simple seasonal factors (adjust based on business)
    const seasonalFactors = [0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 0.9, 0.95, 1.05, 1.1, 1.15, 1.2];
    return seasonalFactors[month] || 1.0;
  }

  /**
   * Generate factors affecting forecast
   */
  private generateForecastFactors(growthRate: number, seasonalFactor: number): string[] {
    const factors: string[] = [];

    if (growthRate > 0.05) {
      factors.push('Strong historical growth momentum');
    } else if (growthRate > 0) {
      factors.push('Moderate growth trajectory');
    } else {
      factors.push('Declining trend detected');
    }

    if (seasonalFactor > 1.1) {
      factors.push('Seasonal peak period approaching');
    } else if (seasonalFactor < 0.95) {
      factors.push('Off-season period expected');
    }

    factors.push('Based on last 6 months of transaction data');
    factors.push('Assumes stable economic conditions');

    return factors;
  }

  /**
   * Analyze budget performance
   */
  async analyzeBudgets(period?: string): Promise<BudgetAnalysis[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const query: any = { isActive: true };
      if (period) {
        query.period = period;
      }

      const budgets = await Budget.find(query);

      const analyses: BudgetAnalysis[] = [];

      for (const budget of budgets) {
        // Get actual spending for this budget period
        const actual = await this.getActualSpending(budget.category, budget.startDate, budget.endDate);

        const variance = actual - budget.budgeted;
        const variancePercentage = budget.budgeted > 0 ? (variance / budget.budgeted) * 100 : 0;

        let status: 'on_track' | 'over_budget' | 'under_budget';
        let recommendations: string[] = [];

        if (Math.abs(variancePercentage) <= 5) {
          status = 'on_track';
          recommendations.push('Spending is within acceptable range');
        } else if (variancePercentage > 5) {
          status = 'over_budget';
          recommendations.push(`Reduce ${budget.category} spending by ${Math.abs(Math.round(variance))}`);
          recommendations.push('Review recent large transactions in this category');
          recommendations.push('Consider reallocating budget from under-spending categories');
        } else {
          status = 'under_budget';
          recommendations.push(`${budget.category} spending is ${Math.abs(Math.round(variance))} under budget`);
          recommendations.push('Consider reallocating funds or adjusting future budgets');
        }

        analyses.push({
          category: budget.category,
          budgeted: budget.budgeted,
          actual,
          variance: Math.round(variance * 100) / 100,
          variancePercentage: Math.round(variancePercentage * 10) / 10,
          status,
          recommendations
        });
      }

      logger.info('Budget analysis completed', {
        budgetsAnalyzed: budgets.length,
        overBudget: analyses.filter(a => a.status === 'over_budget').length,
        onTrack: analyses.filter(a => a.status === 'on_track').length
      });

      this.status = 'idle';

      return analyses;
    } catch (error) {
      this.status = 'error';
      logger.error('Budget analysis error', { error });
      throw error;
    }
  }

  /**
   * Get actual spending for a category in a period
   */
  private async getActualSpending(category: string, startDate: Date, endDate: Date): Promise<number> {
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate },
      category: { $regex: new RegExp(category, 'i') }
    });

    return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
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
        'Financial analysis and reporting',
        'Cash flow analysis',
        'Financial ratio calculation',
        'Revenue and expense forecasting',
        'Budget variance analysis',
        'Trend identification'
      ]
    };
  }
}

export default new AICFOAgent();