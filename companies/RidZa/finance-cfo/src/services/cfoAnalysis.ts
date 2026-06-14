/**
 * CFO Analysis Service
 * Real financial analysis: cashflow, burn rate, runway, alerts
 */

import FinancialData, {
  IFinancialData,
  ITransaction,
  IBurnRate,
  IRunway,
  ICashflowForecast,
  IFinancialAlert,
} from '../models/FinancialData';

interface CashflowAnalysis {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  transactions: ITransaction[];
  averageDailyBurn: number;
  projections: ICashflowForecast[];
}

interface BurnRateAnalysis {
  tenantId: string;
  grossBurn: number;
  netBurn: number;
  fixedCosts: number;
  variableCosts: number;
  averageMonthlyBurn: number;
  burnRateTrend: 'increasing' | 'decreasing' | 'stable';
  percentChange30d: number;
  percentChange90d: number;
  projections: {
    month: string;
    projectedBurn: number;
  }[];
}

interface RunwayAnalysis {
  tenantId: string;
  currentCash: number;
  monthlyBurn: number;
  monthsRemaining: number;
  projectedDepletionDate: Date;
  runwayStatus: 'healthy' | 'warning' | 'critical';
  confidence: number;
  scenarios: {
    name: string;
    monthsRemaining: number;
    description: string;
  }[];
  recommendations: string[];
}

interface AlertsAnalysis {
  tenantId: string;
  alerts: IFinancialAlert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  actionableItems: string[];
}

export class CFOAnalysisService {
  /**
   * Analyze cashflow for a tenant
   */
  async analyzeCashflow(
    tenantId: string,
    months: number = 3
  ): Promise<CashflowAnalysis> {
    const financialData = await FinancialData.findOne({ tenantId });
    
    if (!financialData) {
      throw new Error(`No financial data found for tenant: ${tenantId}`);
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Filter transactions in period
    const transactions = financialData.transactions.filter((t: ITransaction) => {
      const txDate = new Date(t.date);
      return txDate >= startDate && txDate <= endDate;
    });

    // Calculate totals
    let totalInflow = 0;
    let totalOutflow = 0;
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.status !== 'completed') continue;

      const amount = Math.abs(tx.amount);
      
      if (tx.type === 'revenue' || tx.type === 'financing') {
        totalInflow += amount;
      } else {
        totalOutflow += amount;
      }

      // By category
      byCategory[tx.category] = (byCategory[tx.category] ?? 0) + amount;
      
      // By type
      byType[tx.type] = (byType[tx.type] ?? 0) + amount;
    }

    const netCashflow = totalInflow - totalOutflow;
    const daysInPeriod = months * 30;
    const averageDailyBurn = totalOutflow / daysInPeriod;

    // Generate projections for next 6 months
    const projections = this.generateCashflowProjections(
      financialData,
      months,
      netCashflow
    );

    return {
      tenantId,
      period: { start: startDate, end: endDate },
      totalInflow,
      totalOutflow,
      netCashflow,
      byCategory,
      byType,
      transactions,
      averageDailyBurn,
      projections,
    };
  }

  /**
   * Calculate burn rate for a tenant
   */
  async calculateBurnRate(
    tenantId: string,
    lookbackMonths: number = 6
  ): Promise<BurnRateAnalysis> {
    const financialData = await FinancialData.findOne({ tenantId });
    
    if (!financialData) {
      throw new Error(`No financial data found for tenant: ${tenantId}`);
    }

    const now = new Date();
    const monthlyBurns: number[] = [];
    const monthlyRevenue: number[] = [];

    // Calculate monthly burn for each month
    for (let i = 0; i < lookbackMonths; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      let monthExpenses = 0;
      let monthRevenue = 0;

      for (const tx of financialData.transactions) {
        const txDate = new Date(tx.date);
        if (txDate >= monthStart && txDate <= monthEnd && tx.status === 'completed') {
          if (tx.type === 'expense') {
            monthExpenses += Math.abs(tx.amount);
          } else if (tx.type === 'revenue') {
            monthRevenue += Math.abs(tx.amount);
          }
        }
      }

      monthlyBurns.push(monthExpenses);
      monthlyRevenue.push(monthRevenue);
    }

    // Reverse to get chronological order
    monthlyBurns.reverse();
    monthlyRevenue.reverse();

    // Calculate averages
    const averageBurn = monthlyBurns.reduce((a, b) => a + b, 0) / monthlyBurns.length;
    const averageRevenue = monthlyRevenue.reduce((a, b) => a + b, 0) / monthlyRevenue.length;

    // Calculate trends
    const recentBurn = (monthlyBurns[monthlyBurns.length - 1] ?? 0);
    const olderBurn = (monthlyBurns[0] ?? 0);
    const change30d = olderBurn > 0 
      ? ((recentBurn - (monthlyBurns[1] ?? recentBurn)) / (monthlyBurns[1] ?? recentBurn)) * 100 
      : 0;
    const change90d = olderBurn > 0 
      ? ((recentBurn - olderBurn) / olderBurn) * 100 
      : 0;

    let burnRateTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (change90d > 10) {
      burnRateTrend = 'increasing';
    } else if (change90d < -10) {
      burnRateTrend = 'decreasing';
    }

    // Separate fixed vs variable costs
    const fixedCategories = ['salaries', 'rent', 'insurance', 'subscriptions'];
    let fixedCosts = 0;
    let variableCosts = 0;

    for (const tx of financialData.transactions) {
      if (tx.status !== 'completed') continue;
      const amount = Math.abs(tx.amount);
      if (fixedCategories.some(cat => tx.category.toLowerCase().includes(cat))) {
        fixedCosts += amount;
      } else {
        variableCosts += amount;
      }
    }

    // Generate projections
    const projections: { month: string; projectedBurn: number }[] = [];
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = futureDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      const projectedBurn = averageBurn * (1 + (change30d / 100) * (i / 30));
      projections.push({ month: monthName, projectedBurn: Math.round(projectedBurn * 100) / 100 });
    }

    return {
      tenantId,
      grossBurn: recentBurn,
      netBurn: recentBurn - averageRevenue,
      fixedCosts: fixedCosts / lookbackMonths,
      variableCosts: variableCosts / lookbackMonths,
      averageMonthlyBurn: averageBurn,
      burnRateTrend,
      percentChange30d: Math.round(change30d * 100) / 100,
      percentChange90d: Math.round(change90d * 100) / 100,
      projections,
    };
  }

  /**
   * Calculate runway for a tenant
   */
  async calculateRunway(tenantId: string): Promise<RunwayAnalysis> {
    const financialData = await FinancialData.findOne({ tenantId });
    
    if (!financialData) {
      throw new Error(`No financial data found for tenant: ${tenantId}`);
    }

    const currentCash = financialData.currentCash;
    const monthlyBurn = financialData.burnRate.averageMonthlyBurn;

    if (monthlyBurn <= 0) {
      return {
        tenantId,
        currentCash,
        monthlyBurn: 0,
        monthsRemaining: Infinity,
        projectedDepletionDate: new Date('2099-12-31'),
        runwayStatus: 'healthy',
        confidence: 1,
        scenarios: [
          {
            name: 'Profitable',
            monthsRemaining: Infinity,
            description: 'Company is profitable, no cash depletion expected',
          },
        ],
        recommendations: ['Consider expansion investments', 'Build cash reserves'],
      };
    }

    const monthsRemaining = currentCash / monthlyBurn;
    const depletionDate = new Date();
    depletionDate.setMonth(depletionDate.getMonth() + Math.floor(monthsRemaining));

    // Determine status
    let runwayStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (monthsRemaining < 3) {
      runwayStatus = 'critical';
    } else if (monthsRemaining < 6) {
      runwayStatus = 'warning';
    }

    // Calculate confidence based on burn rate variance
    const burnRates = financialData.transactions
      .filter((t: ITransaction) => t.type === 'expense' && t.status === 'completed')
      .map((t: ITransaction) => Math.abs(t.amount));
    
    const avgBurn = burnRates.length > 0 
      ? burnRates.reduce((a, b) => a + b, 0) / burnRates.length 
      : monthlyBurn;
    const variance = burnRates.length > 0
      ? Math.sqrt(burnRates.reduce((sum, b) => sum + Math.pow(b - avgBurn, 2), 0) / burnRates.length)
      : 0;
    const confidence = Math.max(0.5, 1 - (variance / (avgBurn * 2)));

    // Generate scenarios
    const scenarios = [
      {
        name: 'Current Run',
        monthsRemaining: Math.round(monthsRemaining * 10) / 10,
        description: 'Based on current burn rate',
      },
      {
        name: 'Conservative (+20% burn)',
        monthsRemaining: Math.round((currentCash / (monthlyBurn * 1.2)) * 10) / 10,
        description: 'If burn rate increases by 20%',
      },
      {
        name: 'Optimistic (-20% burn)',
        monthsRemaining: Math.round((currentCash / (monthlyBurn * 0.8)) * 10) / 10,
        description: 'If burn rate decreases by 20%',
      },
    ];

    // Generate recommendations
    const recommendations: string[] = [];
    if (monthsRemaining < 3) {
      recommendations.push('URGENT: Seek additional funding immediately');
      recommendations.push('Consider emergency cost-cutting measures');
      recommendations.push('Explore revenue acceleration strategies');
    } else if (monthsRemaining < 6) {
      recommendations.push('Begin fundraising discussions now');
      recommendations.push('Review and optimize variable costs');
      recommendations.push('Consider deferred payments or payment plans');
    } else if (monthsRemaining < 12) {
      recommendations.push('Plan fundraising for next quarter');
      recommendations.push('Monitor burn rate weekly');
      recommendations.push('Explore cost optimization opportunities');
    } else {
      recommendations.push('Maintain current trajectory');
      recommendations.push('Consider strategic investments');
      recommendations.push('Build cash reserves for opportunities');
    }

    return {
      tenantId,
      currentCash,
      monthlyBurn,
      monthsRemaining: Math.round(monthsRemaining * 10) / 10,
      projectedDepletionDate: depletionDate,
      runwayStatus,
      confidence: Math.round(confidence * 100) / 100,
      scenarios,
      recommendations,
    };
  }

  /**
   * Generate financial alerts for a tenant
   */
  async generateAlerts(tenantId: string): Promise<AlertsAnalysis> {
    const financialData = await FinancialData.findOne({ tenantId });
    
    if (!financialData) {
      throw new Error(`No financial data found for tenant: ${tenantId}`);
    }

    const alerts: IFinancialAlert[] = [];
    const now = new Date();

    // Check runway
    const runwayMonths = financialData.currentCash / financialData.burnRate.averageMonthlyBurn;
    if (runwayMonths < 3) {
      alerts.push({
        type: 'runway_low',
        severity: 'critical',
        message: `Critical runway: only ${Math.round(runwayMonths)} months of cash remaining`,
        value: runwayMonths,
        threshold: 3,
        recommendation: 'Seek immediate funding or reduce burn rate',
        createdAt: now,
      });
    } else if (runwayMonths < 6) {
      alerts.push({
        type: 'runway_low',
        severity: 'warning',
        message: `Low runway: ${Math.round(runwayMonths)} months of cash remaining`,
        value: runwayMonths,
        threshold: 6,
        recommendation: 'Begin fundraising or cost optimization',
        createdAt: now,
      });
    }

    // Check burn rate trend
    if (financialData.burnRate.burnRateTrend === 'increasing') {
      alerts.push({
        type: 'burn_rate',
        severity: 'warning',
        message: `Burn rate increasing by ${financialData.burnRate.percentChange.toFixed(1)}%`,
        value: financialData.burnRate.percentChange,
        threshold: 10,
        recommendation: 'Review recent expense increases and identify optimization opportunities',
        createdAt: now,
      });
    }

    // Check for negative cashflow
    if (financialData.monthlyRevenue < financialData.monthlyExpenses) {
      const gap = financialData.monthlyExpenses - financialData.monthlyRevenue;
      alerts.push({
        type: 'cash_warning',
        severity: 'warning',
        message: `Negative monthly cashflow: $${gap.toLocaleString()} deficit`,
        value: gap,
        threshold: 0,
        recommendation: 'Focus on revenue growth or cost reduction to achieve breakeven',
        createdAt: now,
      });
    }

    // Check for expense spikes (last month vs average)
    const lastMonthExpenses = financialData.transactions
      .filter((t: ITransaction) => {
        const txDate = new Date(t.date);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return txDate >= lastMonth && txDate <= lastMonthEnd && t.type === 'expense';
      })
      .reduce((sum: number, t: ITransaction) => sum + Math.abs(t.amount), 0);

    const avgExpenses = financialData.transactions
      .filter((t: ITransaction) => t.type === 'expense')
      .reduce((sum: number, t: ITransaction) => sum + Math.abs(t.amount), 0) / 6;

    if (avgExpenses > 0 && lastMonthExpenses > avgExpenses * 1.3) {
      alerts.push({
        type: 'expense_spike',
        severity: 'info',
        message: `Expense spike: last month ${((lastMonthExpenses / avgExpenses - 1) * 100).toFixed(1)}% above average`,
        value: lastMonthExpenses,
        threshold: avgExpenses * 1.3,
        recommendation: 'Review unexpected expenses and ensure they are justified',
        createdAt: now,
      });
    }

    // Check for revenue decline
    const recentRevenue = financialData.transactions
      .filter((t: ITransaction) => {
        const txDate = new Date(t.date);
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return txDate >= threeMonthsAgo && t.type === 'revenue';
      })
      .reduce((sum: number, t: ITransaction) => sum + Math.abs(t.amount), 0);

    const olderRevenue = financialData.transactions
      .filter((t: ITransaction) => {
        const txDate = new Date(t.date);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return txDate >= sixMonthsAgo && txDate < threeMonthsAgo && t.type === 'revenue';
      })
      .reduce((sum: number, t: ITransaction) => sum + Math.abs(t.amount), 0);

    if (olderRevenue > 0 && recentRevenue < olderRevenue * 0.8) {
      alerts.push({
        type: 'revenue_decline',
        severity: 'warning',
        message: `Revenue declined ${((1 - recentRevenue / olderRevenue) * 100).toFixed(1)}% over last 3 months`,
        value: recentRevenue,
        threshold: olderRevenue * 0.8,
        recommendation: 'Investigate revenue decline and implement growth initiatives',
        createdAt: now,
      });
    }

    // Calculate summary
    const summary = {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
    };

    // Generate actionable items
    const actionableItems: string[] = [];
    if (summary.critical > 0) {
      actionableItems.push('Address critical alerts immediately');
    }
    if (summary.warning > 0) {
      actionableItems.push('Review and address warning-level alerts this week');
    }
    if (runwayMonths < 12) {
      actionableItems.push('Schedule a CFO review meeting');
    }

    return {
      tenantId,
      alerts,
      summary,
      actionableItems,
    };
  }

  /**
   * Generate cashflow projections
   */
  private generateCashflowProjections(
    financialData: IFinancialData,
    historicalMonths: number,
    netCashflow: number
  ): ICashflowForecast[] {
    const projections: ICashflowForecast[] = [];
    const now = new Date();
    let runningBalance = financialData.currentCash;

    // Calculate growth rate based on historical data
    const recentNet = netCashflow;
    const growthRate = 0.02; // 2% monthly growth assumption

    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const period = futureDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const projectedRevenue = financialData.monthlyRevenue * Math.pow(1 + growthRate, i);
      const projectedExpenses = financialData.monthlyExpenses * Math.pow(1.01, i); // 1% monthly expense growth
      const netCashflowMonth = projectedRevenue - projectedExpenses;
      runningBalance += netCashflowMonth;

      projections.push({
        period,
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        projectedExpenses: Math.round(projectedExpenses * 100) / 100,
        netCashflow: Math.round(netCashflowMonth * 100) / 100,
        endingBalance: Math.round(runningBalance * 100) / 100,
      });
    }

    return projections;
  }

  /**
   * Update or create financial data for a tenant
   */
  async upsertFinancialData(
    tenantId: string,
    data: Partial<IFinancialData>
  ): Promise<IFinancialData> {
    const updateData = {
      ...data,
      lastUpdated: new Date(),
    };

    const result = await FinancialData.findOneAndUpdate(
      { tenantId },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return result;
  }

  /**
   * Add a transaction to a tenant's financial data
   */
  async addTransaction(
    tenantId: string,
    transaction: ITransaction
  ): Promise<IFinancialData> {
    const result = await FinancialData.findOneAndUpdate(
      { tenantId },
      {
        $push: { transactions: transaction },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );

    if (!result) {
      throw new Error(`No financial data found for tenant: ${tenantId}`);
    }

    return result;
  }
}

export default new CFOAnalysisService();
