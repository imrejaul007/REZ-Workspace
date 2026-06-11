/**
 * LEDGERAI - Budget Advisor AI Agent
 * Budget planning, forecasting, and optimization recommendations
 */

import { Budget, Transaction, Account } from '../models';
import logger from '../middleware/logger';

interface BudgetForecast {
  category: string;
  period: string;
  recommendedBudget: number;
  confidence: number;
  basedOn: {
    historicalAverage: number;
    trendAdjustment: number;
    seasonalAdjustment: number;
  };
  rationale: string;
}

interface BudgetRecommendation {
  category: string;
  currentBudget: number;
  recommendedBudget: number;
  change: number;
  changePercentage: number;
  priority: 'high' | 'medium' | 'low';
  reasons: string[];
 warnings: string[];
}

interface BudgetPlan {
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalBudgeted: number;
  categories: BudgetRecommendation[];
  summary: {
    totalIncrease: number;
    totalDecrease: number;
    netChange: number;
    highPriorityChanges: number;
  };
}

interface SeasonalPattern {
  month: number;
  averageExpense: number;
  deviation: number;
  seasonalFactor: number;
}

export class BudgetAdvisor {
  name = 'Budget Advisor';
  role = 'Budget planning, forecasting, and optimization';
  status: 'idle' | 'working' | 'error' = 'idle';
  lastActivity?: Date;

  /**
   * Generate budget recommendations based on historical data
   */
  async generateRecommendations(period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<BudgetPlan> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      // Determine date range based on period
      switch (period) {
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }

      // Get historical data (last 6 periods)
      const historicalMonths = period === 'monthly' ? 6 : period === 'quarterly' ? 4 : 2;
      const historicalStart = new Date(startDate);
      historicalStart.setMonth(historicalStart.getMonth() - historicalMonths);

      const transactions = await Transaction.find({
        date: { $gte: historicalStart, $lte: endDate },
        amount: { $lt: 0 }
      });

      // Group by category
      const categoryData: Record<string, {
        amounts: number[];
        total: number;
        count: number;
        trend: number;
      }> = {};

      transactions.forEach(tx => {
        const cat = tx.category || 'Uncategorized';
        if (!categoryData[cat]) {
          categoryData[cat] = { amounts: [], total: 0, count: 0, trend: 0 };
        }
        categoryData[cat].total += Math.abs(tx.amount);
        categoryData[cat].count += 1;
      });

      // Calculate period averages and trends
      const recommendations: BudgetRecommendation[] = [];

      for (const [category, data] of Object.entries(categoryData)) {
        if (data.count < 3) continue; // Need at least 3 transactions

        // Calculate monthly averages
        const monthlyAvg = data.total / historicalMonths;

        // Calculate trend
        const trend = this.calculateTrend(data.amounts);

        // Get seasonal factor
        const seasonalFactor = this.getSeasonalFactor(now.getMonth(), category);

        // Calculate recommended budget
        const trendAdjustment = 1 + (trend / 100);
        const recommendedBudget = monthlyAvg * trendAdjustment * seasonalFactor;

        // Get current budget if exists
        const currentBudget = await this.getCurrentBudget(category, period, startDate, endDate);

        const change = recommendedBudget - currentBudget;
        const changePercentage = currentBudget > 0 ? (change / currentBudget) * 100 : 0;

        // Determine priority
        let priority: 'high' | 'medium' | 'low' = 'medium';
        const reasons: string[] = [];
        const warnings: string[] = [];

        if (Math.abs(changePercentage) > 20) {
          priority = 'high';
          if (changePercentage > 0) {
            reasons.push(`Significant increase recommended (+${Math.round(changePercentage)}%) based on spending patterns`);
          } else {
            reasons.push(`Potential savings identified (-${Math.abs(Math.round(changePercentage))}%)`);
          }
        } else if (Math.abs(changePercentage) > 10) {
          priority = 'medium';
          reasons.push(`Moderate adjustment recommended (${Math.round(changePercentage)}%)`);
        } else {
          reasons.push('Budget remains stable');
        }

        if (trend > 15) {
          reasons.push('Spending has been increasing');
          warnings.push('Monitor closely - upward trend detected');
        } else if (trend < -15) {
          reasons.push('Spending has been decreasing');
        }

        if (seasonalFactor > 1.2) {
          reasons.push('Seasonal increase expected this period');
        } else if (seasonalFactor < 0.8) {
          reasons.push('Seasonal decrease expected this period');
        }

        recommendations.push({
          category,
          currentBudget: Math.round(currentBudget * 100) / 100,
          recommendedBudget: Math.round(recommendedBudget * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercentage: Math.round(changePercentage * 10) / 10,
          priority,
          reasons,
          warnings
        });
      }

      // Sort by priority
      recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Calculate summary
      const totalBudgeted = recommendations.reduce((sum, r) => sum + r.recommendedBudget, 0);
      const totalIncrease = recommendations
        .filter(r => r.change > 0)
        .reduce((sum, r) => sum + r.change, 0);
      const totalDecrease = recommendations
        .filter(r => r.change < 0)
        .reduce((sum, r) => sum + Math.abs(r.change), 0);

      logger.info('Budget recommendations generated', {
        period,
        categories: recommendations.length,
        totalBudgeted,
        highPriority: recommendations.filter(r => r.priority === 'high').length
      });

      this.status = 'idle';

      return {
        period,
        startDate,
        endDate,
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        categories: recommendations,
        summary: {
          totalIncrease: Math.round(totalIncrease * 100) / 100,
          totalDecrease: Math.round(totalDecrease * 100) / 100,
          netChange: Math.round((totalIncrease - totalDecrease) * 100) / 100,
          highPriorityChanges: recommendations.filter(r => r.priority === 'high').length
        }
      };
    } catch (error) {
      this.status = 'error';
      logger.error('Budget recommendation error', { error });
      throw error;
    }
  }

  /**
   * Forecast budget for future periods
   */
  async forecastBudget(months: number = 3): Promise<BudgetForecast[]> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const forecasts: BudgetForecast[] = [];
      const now = new Date();

      // Get historical data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const transactions = await Transaction.find({
        date: { $gte: sixMonthsAgo },
        amount: { $lt: 0 }
      });

      // Group by category
      const categoryTotals: Record<string, number[]> = {};
      transactions.forEach(tx => {
        const cat = tx.category || 'Uncategorized';
        if (!categoryTotals[cat]) categoryTotals[cat] = [];
        categoryTotals[cat].push(Math.abs(tx.amount));
      });

      // Generate forecasts for each category
      for (const [category, amounts] of Object.entries(categoryTotals)) {
        if (amounts.length < 3) continue;

        const historicalAverage = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const trend = this.calculateTrend(amounts);
        const seasonalFactor = this.getSeasonalFactor(now.getMonth(), category);

        for (let i = 1; i <= months; i++) {
          const forecastDate = new Date(now);
          forecastDate.setMonth(forecastDate.getMonth() + i);

          const targetSeasonalFactor = this.getSeasonalFactor(forecastDate.getMonth(), category);
          const trendAdjustment = Math.pow(1 + (trend / 100), i);
          const recommendedBudget = historicalAverage * trendAdjustment * targetSeasonalFactor;

          // Confidence decreases with distance
          const confidence = Math.max(0.5, 0.9 - (i * 0.1));

          let rationale = '';
          if (trend > 5) {
            rationale = `Based on ${Math.round(trend)}% upward trend and ${targetSeasonalFactor > 1 ? 'peak' : 'off-peak'} season`;
          } else if (trend < -5) {
            rationale = `Based on ${Math.abs(Math.round(trend))}% downward trend and ${targetSeasonalFactor > 1 ? 'peak' : 'off-peak'} season`;
          } else {
            rationale = `Based on historical average with seasonal adjustment`;
          }

          forecasts.push({
            category,
            period: `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`,
            recommendedBudget: Math.round(recommendedBudget * 100) / 100,
            confidence: Math.round(confidence * 100) / 100,
            basedOn: {
              historicalAverage: Math.round(historicalAverage * 100) / 100,
              trendAdjustment: Math.round(trendAdjustment * 100) / 100,
              seasonalAdjustment: Math.round(targetSeasonalFactor * 100) / 100
            },
            rationale
          });
        }
      }

      // Sort by recommended budget (highest first)
      forecasts.sort((a, b) => b.recommendedBudget - a.recommendedBudget);

      logger.info('Budget forecast generated', {
        months,
        categories: Object.keys(categoryTotals).length,
        forecasts: forecasts.length
      });

      this.status = 'idle';

      return forecasts;
    } catch (error) {
      this.status = 'error';
      logger.error('Budget forecast error', { error });
      throw error;
    }
  }

  /**
   * Analyze budget performance
   */
  async analyzePerformance(): Promise<{
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    categoryAnalysis: Array<{
      category: string;
      health: 'on_track' | 'over_budget' | 'under_budget';
      score: number;
      insights: string[];
    }>;
    recommendations: string[];
  }> {
    this.status = 'working';
    this.lastActivity = new Date();

    try {
      const budgets = await Budget.find({ isActive: true });
      const now = new Date();

      const categoryAnalysis: Array<{
        category: string;
        health: 'on_track' | 'over_budget' | 'under_budget';
        score: number;
        insights: string[];
      }> = [];

      let totalScore = 0;
      let overBudgetCount = 0;

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

        let health: 'on_track' | 'over_budget' | 'under_budget';
        let score: number;
        const insights: string[] = [];

        if (Math.abs(variancePercentage) <= 5) {
          health = 'on_track';
          score = 100;
          insights.push('Budget is on track');
        } else if (variancePercentage > 5) {
          health = 'over_budget';
          score = Math.max(0, 100 - variancePercentage * 2);
          overBudgetCount++;
          insights.push(`Over budget by ${Math.abs(Math.round(variance))} (${Math.round(variancePercentage)}%)`);

          if (variancePercentage > 20) {
            insights.push('URGENT: Significant overspend detected');
          }
        } else {
          health = 'under_budget';
          score = 100;
          insights.push(`Under budget by ${Math.abs(Math.round(variance))}`);
 }

        // Add trend insights
        if (transactions.length > 10) {
          const recent = transactions.slice(-5);
          const older = transactions.slice(0,5);
          const recentAvg = recent.reduce((sum, t) => sum + Math.abs(t.amount), 0) / recent.length;
          const olderAvg = older.reduce((sum, t) => sum + Math.abs(t.amount), 0) / older.length;

          if (recentAvg > olderAvg * 1.2) {
            insights.push('Spending is accelerating');
 }
        }

        categoryAnalysis.push({
          category: budget.category,
          health,
          score: Math.round(score),
          insights
        });

        totalScore += score;
      }

      const avgScore = budgets.length > 0 ? totalScore / budgets.length : 100;
      let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';

      if (avgScore >= 90) overallHealth = 'excellent';
      else if (avgScore >= 75) overallHealth = 'good';
      else if (avgScore >= 50) overallHealth = 'fair';
      else overallHealth = 'poor';

      const recommendations: string[] = [];

      if (overBudgetCount > 0) {
        recommendations.push(`${overBudgetCount} budget(s) are over budget and need attention`);
      }

      if (avgScore < 75) {
        recommendations.push('Consider reviewing spending patterns across all categories');
      }

      const underBudgetCategories = categoryAnalysis
        .filter(c => c.health === 'under_budget' && c.score === 100)
        .map(c => c.category);

      if (underBudgetCategories.length > 0) {
        recommendations.push(`${underBudgetCategories.length} categories are significantly under budget - consider reallocating funds`);
      }

      logger.info('Budget performance analyzed', {
        budgets: budgets.length,
        overallHealth,
        score: Math.round(avgScore),
        overBudgetCount
      });

      this.status = 'idle';

      return {
        overallHealth,
        score: Math.round(avgScore),
        categoryAnalysis,
        recommendations
      };
    } catch (error) {
      this.status = 'error';
      logger.error('Budget performance analysis error', { error });
      throw error;
    }
  }

  /**
   * Calculate trend from historical data
   */
  private calculateTrend(amounts: number[]): number {
    if (amounts.length < 2) return 0;

    // Simple linear regression
    const n = amounts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += amounts[i];
      sumXY += i * amounts[i];
      sumX2 += i * i;
    }

    const avgX = sumX / n;
    const avgY = sumY / n;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = avgY || 1;

    return (slope / avgValue) * 100;
  }

  /**
   * Get seasonal factor for a month and category
   */
  private getSeasonalFactor(month: number, category: string): number {
    // Default seasonal factors by month
    const defaultFactors: Record<number, number> = {
      0: 1.1,   // January - post-holiday
      1: 0.9,   // February
      2: 1.0,   // March
      3: 1.0,   // April
      4: 1.0,   // May
      5: 1.05,  // June - mid-year
      6: 1.1,   // July
      7: 0.95,  // August
      8: 1.0,   // September
      9: 1.1,   // October
10: 1.2,  // November - pre-holiday
      11: 1.3   // December - holiday season
    };

    // Category-specific adjustments
    const categoryAdjustments: Record<string, Record<number, number>> = {
      'Marketing': {
        2: 1.2,  // March - Q1 push
        8: 1.3,  // August - back to school
        10: 1.4, // October - holiday prep
        11: 1.5  // November - Black Friday
      },
      'Travel': {
        11: 0.7, // December - fewer trips
        1: 0.8,  // January - post-holiday
        5: 1.2,  // June - summer travel
        6: 1.3   // July - peak travel
      },
      'Utilities': {
        11: 1.3, // December - heating
        0: 1.3,  // January - heating
        4: 0.8,  // May - mild weather
        5: 0.7   // June - mild weather
      }
    };

    let factor = defaultFactors[month] || 1.0;

    // Apply category adjustment if exists
    const categoryAdj = categoryAdjustments[category];
    if (categoryAdj && categoryAdj[month]) {
      factor = categoryAdj[month];
    }

    return factor;
  }

  /**
   * Get current budget for a category
   */
  private async getCurrentBudget(
    category: string,
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const budget = await Budget.findOne({
      category: { $regex: new RegExp(`^${category}$`, 'i') },
      period,
      isActive: true,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    return budget?.budgeted || 0;
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
        'Budget recommendation generation',
        'Budget forecasting',
        'Performance analysis',
        'Seasonal adjustment',
        'Trend analysis',
        'Reallocation suggestions'
      ]
    };
  }
}

export default new BudgetAdvisor();
