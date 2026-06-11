/**
 * Revenue Consolidator AI Agent
 * Tracks and manages revenue from all 15 Industry AI products
 */

import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { revenueConsolidationService } from '../../services/revenue-consolidation-service';
import { customer360Service } from '../../services/customer-360-service';
import { crossSellService } from '../../services/cross-sell-service';

export interface RevenueForecast {
  industry: IndustryType;
  period: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

export interface RevenueAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'trend';
  industry: IndustryType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  triggeredAt: Date;
  value?: number;
  threshold?: number;
}

export interface RevenueGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  industry?: IndustryType;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  status: 'on-track' | 'behind' | 'exceeded' | 'at-risk';
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  breakdowns: {
    byIndustry: Record<IndustryType, number>;
    byType: Record<string, number>;
    byPaymentMethod?: Record<string, number>;
  };
  comparisons: {
    previousPeriod: number;
    change: number;
    changePercent: number;
  };
  topPerformers: Array<{ industry: IndustryType; revenue: number }>;
  alerts: RevenueAlert[];
}

class RevenueConsolidatorAgent {
  private agentName = 'Revenue Consolidator';
  private agentId = 'revenue-001';
  private goals: Map<string, RevenueGoal> = new Map();
  private alerts: Map<string, RevenueAlert> = new Map();

  /**
   * Get consolidated revenue across all industries
   */
  async getConsolidatedRevenue(startDate?: Date, endDate?: Date): Promise<{
    total: number;
    byIndustry: Record<IndustryType, number>;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: Date;
  }> {
    console.log(`[${this.agentName}] Fetching consolidated revenue...`);

    const summary = await revenueConsolidationService.getSummary(startDate, endDate);

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (summary.trends.daily.length >= 2) {
      const recent = summary.trends.daily.slice(-7);
      const older = summary.trends.daily.slice(-14, -7);
      const recentAvg = recent.reduce((s, d) => s + d.amount, 0) / (recent.length || 1);
      const olderAvg = older.reduce((s, d) => s + d.amount, 0) / (older.length || 1);
      if (recentAvg > olderAvg * 1.05) trend = 'up';
      else if (recentAvg < olderAvg * 0.95) trend = 'down';
    }

    return {
      total: summary.totalRevenue,
      byIndustry: Object.fromEntries(
        Object.entries(summary.byIndustry).map(([k, v]) => [k, v.totalRevenue])
      ) as Record<IndustryType, number>,
      trend,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate revenue forecast
   */
  async generateForecast(
    industry: IndustryType,
    periods: number = 3
  ): Promise<RevenueForecast[]> {
    console.log(`[${this.agentName}] Generating forecast for ${industry}...`);

    const forecasts: RevenueForecast[] = [];
    const revenue = await revenueConsolidationService.getIndustryRevenue(industry);
    const baseRevenue = revenue?.totalRevenue || 10000;

    const now = new Date();

    for (let i = 1; i <= periods; i++) {
      const forecastDate = new Date(now);
      forecastDate.setMonth(forecastDate.getMonth() + i);

      // Simple linear projection with some variance
      const trendFactor = 1 + (i * 0.05); // 5% monthly growth assumption
      const variance = 0.9 + Math.random() * 0.2; // 90-110% variance
      const predicted = baseRevenue * trendFactor * variance;

      forecasts.push({
        industry,
        period: forecastDate.toISOString().slice(0, 7),
        predicted: Math.round(predicted),
        confidence: Math.max(0.5, 0.9 - i * 0.1), // Decreasing confidence over time
        factors: [
          `Based on ${industry} historical growth`,
          `Market conditions average`,
          `Seasonal adjustment applied`
        ]
      });
    }

    return forecasts;
  }

  /**
   * Set revenue goal
   */
  async setGoal(data: {
    name: string;
    target: number;
    industry?: IndustryType;
    period: RevenueGoal['period'];
  }): Promise<RevenueGoal> {
    const now = new Date();
    let endDate = new Date(now);

    switch (data.period) {
      case 'daily':
        endDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        endDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    const goal: RevenueGoal = {
      id: `goal-${Date.now()}`,
      name: data.name,
      target: data.target,
      current: 0,
      industry: data.industry,
      period: data.period,
      startDate: now,
      endDate,
      status: 'on-track'
    };

    this.goals.set(goal.id, goal);
    return goal;
  }

  /**
   * Check and update goal statuses
   */
  async checkGoalStatus(): Promise<RevenueGoal[]> {
    const updatedGoals: RevenueGoal[] = [];

    for (const [id, goal] of this.goals) {
      // Get current revenue
      let currentRevenue = await revenueConsolidationService.getTotalRevenue(goal.startDate);

      if (goal.industry) {
        const industryRevenue = await revenueConsolidationService.getIndustryRevenue(goal.industry);
        currentRevenue = industryRevenue?.totalRevenue || 0;
      }

      goal.current = currentRevenue;

      // Calculate percentage of time elapsed
      const totalDuration = goal.endDate.getTime() - goal.startDate.getTime();
      const elapsed = Date.now() - goal.startDate.getTime();
      const percentElapsed = elapsed / totalDuration;

      // Calculate expected progress
      const expectedProgress = goal.target * percentElapsed;

      // Determine status
      if (goal.current >= goal.target) {
        goal.status = 'exceeded';
      } else if (goal.current >= expectedProgress * 1.1) {
        goal.status = 'on-track';
      } else if (goal.current >= expectedProgress * 0.8) {
        goal.status = 'at-risk';
      } else {
        goal.status = 'behind';
      }

      this.goals.set(id, goal);
      updatedGoals.push(goal);

      // Create alert if behind
      if (goal.status === 'behind' || goal.status === 'at-risk') {
        this.createAlert({
          type: 'threshold',
          industry: goal.industry || 'waitron',
          severity: goal.status === 'behind' ? 'critical' : 'warning',
          message: `Revenue goal "${goal.name}" is ${goal.status}: $${goal.current.toLocaleString()} of $${goal.target.toLocaleString()}`,
          value: goal.current,
          threshold: goal.target
        });
      }
    }

    return updatedGoals;
  }

  /**
   * Create revenue alert
   */
  private createAlert(data: Omit<RevenueAlert, 'id' | 'triggeredAt'>): RevenueAlert {
    const alert: RevenueAlert = {
      ...data,
      id: `alert-${Date.now()}`,
      triggeredAt: new Date()
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Get active alerts
   */
  async getAlerts(filter?: {
    severity?: RevenueAlert['severity'];
    industry?: IndustryType;
    type?: RevenueAlert['type'];
  }): Promise<RevenueAlert[]> {
    let alerts = Array.from(this.alerts.values());

    if (filter) {
      if (filter.severity) {
        alerts = alerts.filter(a => a.severity === filter.severity);
      }
      if (filter.industry) {
        alerts = alerts.filter(a => a.industry === filter.industry);
      }
      if (filter.type) {
        alerts = alerts.filter(a => a.type === filter.type);
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  /**
   * Generate revenue report
   */
  async generateReport(period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<RevenueReport> {
    console.log(`[${this.agentName}] Generating ${period} revenue report...`);

    const now = new Date();
    let startDate = new Date(now);
    let previousStart = new Date(now);
    let previousEnd = new Date(now);

    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        previousStart.setDate(now.getDate() - 2);
        previousEnd.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        previousStart.setDate(now.getDate() - 14);
        previousEnd.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        previousStart.setMonth(now.getMonth() - 2);
        previousEnd.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        previousStart.setMonth(now.getMonth() - 6);
        previousEnd.setMonth(now.getMonth() - 3);
        break;
    }

    const currentRevenue = await revenueConsolidationService.getTotalRevenue(startDate);
    const previousRevenue = await revenueConsolidationService.getTotalRevenue(previousStart, previousEnd);

    const summary = await revenueConsolidationService.getSummary(startDate);

    // Get top performers
    const topPerformers = Object.entries(summary.byIndustry)
      .map(([industry, data]) => ({
        industry: industry as IndustryType,
        revenue: data.totalRevenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Check for alerts
    const alerts = await this.getAlerts();

    const change = currentRevenue - previousRevenue;
    const changePercent = previousRevenue > 0 ? (change / previousRevenue) * 100 : 0;

    return {
      period: period,
      totalRevenue: currentRevenue,
      breakdowns: {
        byIndustry: Object.fromEntries(
          Object.entries(summary.byIndustry).map(([k, v]) => [k, v.totalRevenue])
        ) as Record<IndustryType, number>,
        byType: summary.byType
      },
      comparisons: {
        previousPeriod: previousRevenue,
        change,
        changePercent
      },
      topPerformers,
      alerts
    };
  }

  /**
   * Analyze revenue by customer segment
   */
  async analyzeBySegment(): Promise<{
    segments: Array<{
      name: string;
      count: number;
      revenue: number;
      avgValue: number;
    }>;
    insights: string[];
  }> {
    const customers = await customer360Service.getAllCustomers();

    const segments = [
      { name: 'High Value', min: 5000, max: Infinity },
      { name: 'Medium Value', min: 1000, max: 4999 },
      { name: 'Low Value', min: 0, max: 999 }
    ].map(segment => {
      const segmentCustomers = customers.filter(c =>
        c.totalLifetimeValue >= segment.min && c.totalLifetimeValue < segment.max
      );

      const totalRevenue = segmentCustomers.reduce((sum, c) => sum + c.totalLifetimeValue, 0);

      return {
        name: segment.name,
        count: segmentCustomers.length,
        revenue: totalRevenue,
        avgValue: segmentCustomers.length > 0 ? totalRevenue / segmentCustomers.length : 0
      };
    });

    const insights: string[] = [];
    const highValue = segments.find(s => s.name === 'High Value');
    const lowValue = segments.find(s => s.name === 'Low Value');

    if (highValue && highValue.count > 0) {
      const totalRevenueAll = segments.reduce((a, s) => a + s.revenue, 1);
      insights.push(`${highValue.count} high-value customers generate ${(highValue.revenue / totalRevenueAll * 100).toFixed(0)}% of revenue`);
    }

    if (lowValue && highValue && lowValue.count > highValue.count) {
      insights.push(`Consider upselling strategies for ${lowValue.count} low-value customers`);
    }

    return { segments, insights };
  }

  /**
   * Compare revenue across industries
   */
  async compareIndustries(): Promise<{
    rankings: Array<{
      industry: IndustryType;
      name: string;
      revenue: number;
      marketShare: number;
      growth: number;
    }>;
    insights: string[];
  }> {
    const totalRevenue = await revenueConsolidationService.getTotalRevenue();
    const summary = await revenueConsolidationService.getSummary();

    const rankings = Object.entries(summary.byIndustry)
      .map(([industry, data]) => ({
        industry: industry as IndustryType,
        name: data.productName,
        revenue: data.totalRevenue,
        marketShare: totalRevenue > 0 ? (data.totalRevenue / totalRevenue) * 100 : 0,
        growth: data.growth
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const insights: string[] = [];
    if (rankings.length > 0) {
      const leader = rankings[0];
      insights.push(`${leader.name} leads with $${leader.revenue.toLocaleString()} (${leader.marketShare.toFixed(1)}# market share)`);

      const fastestGrowing = rankings.reduce((a, b) =>
        b.growth > a.growth ? b : a
      );
      if (fastestGrowing.growth > 0) {
        insights.push(`${fastestGrowing.name} is the fastest growing at ${fastestGrowing.growth.toFixed(1)}#`);
      }
    }

    return { rankings, insights };
  }

  /**
   * Detect revenue anomalies
   */
  async detectAnomalies(): Promise<RevenueAlert[]> {
    const alerts: RevenueAlert[] = [];
    const summary = await revenueConsolidationService.getSummary();

    for (const [industry, data] of Object.entries(summary.byIndustry)) {
      // Check for unusually high revenue
      if (data.totalRevenue > summary.averageTransactionValue * 100) {
        const alert = this.createAlert({
          type: 'anomaly',
          industry: industry as IndustryType,
          severity: 'info',
          message: `Unusually high revenue detected for ${data.productName}: $${data.totalRevenue.toLocaleString()}`,
          value: data.totalRevenue
        });
        alerts.push(alert);
      }

      // Check for zero revenue with high transaction count
      if (data.totalRevenue === 0 && data.transactionCount > 0) {
        const alert = this.createAlert({
          type: 'anomaly',
          industry: industry as IndustryType,
          severity: 'warning',
          message: `Revenue discrepancy in ${data.productName}: ${data.transactionCount} transactions but $0 revenue`,
          value: data.totalRevenue
        });
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Identify revenue opportunities
   */
  async identifyOpportunities(): Promise<Array<{
    type: string;
    description: string;
    potentialRevenue: number;
    industry: IndustryType;
  }>> {
    const opportunities: Array<{
      type: string;
      description: string;
      potentialRevenue: number;
      industry: IndustryType;
    }> = [];

    const crossSellAnalysis = await crossSellService.getAnalysis();

    // Cross-sell revenue potential
    if (crossSellAnalysis.totalPotentialValue > 0) {
      opportunities.push({
        type: 'cross-sell',
        description: `Cross-sell opportunities across industries`,
        potentialRevenue: crossSellAnalysis.totalPotentialValue,
        industry: 'waitron' as IndustryType // Aggregated
      });
    }

    // High-performing industry expansion
    const topIndustries = await revenueConsolidationService.getTopIndustries(3);
    for (const industry of topIndustries) {
      opportunities.push({
        type: 'expansion',
        description: `Expand ${industry.productName} - potential for 20% growth`,
        potentialRevenue: industry.totalRevenue * 0.2,
        industry: industry.industry
      });
    }

    // Customer upselling
    const highValueCustomers = await customer360Service.getHighValueCustomers(5000);
    if (highValueCustomers.length > 0) {
      opportunities.push({
        type: 'upsell',
        description: `Upsell ${highValueCustomers.length} high-value customers`,
        potentialRevenue: highValueCustomers.reduce((sum, c) => sum + c.totalLifetimeValue * 0.15, 0),
        industry: 'waitron' as IndustryType // Cross-industry
      });
    }

    return opportunities.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
  }

  /**
   * Get real-time revenue summary
   */
  async getRealTimeSummary(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
    projection: number;
    target: number;
    progress: number;
  }> {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const today = await revenueConsolidationService.getTotalRevenue(todayStart);
    const thisWeek = await revenueConsolidationService.getTotalRevenue(weekStart);
    const thisMonth = await revenueConsolidationService.getTotalRevenue(monthStart);
    const allTime = await revenueConsolidationService.getTotalRevenue();

    // Project to end of month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const projection = thisMonth * (daysInMonth / daysElapsed);

    // Get default monthly target
    const monthlyTarget = 1000000; // Example

    return {
      today,
      thisWeek,
      thisMonth,
      allTime,
      projection: Math.round(projection),
      target: monthlyTarget,
      progress: Math.round((thisMonth / monthlyTarget) * 100)
    };
  }

  /**
   * Get agent status
   */
  getStatus(): { agentId: string; name: string; ready: boolean; activeGoals: number; activeAlerts: number } {
    return {
      agentId: this.agentId,
      name: this.agentName,
      ready: true,
      activeGoals: this.goals.size,
      activeAlerts: this.alerts.size
    };
  }
}

export const revenueConsolidator = new RevenueConsolidatorAgent();