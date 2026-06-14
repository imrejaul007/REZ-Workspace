/**
 * Analytics Service - Business logic for analytics operations
 */

import { v4 as uuidv4 } from 'uuid';
import { Analytics, IAnalytics, MetricType } from '../models/Analytics';
import { Metric, IMetric } from '../models/Metric';
import { Trend, ITrend } from '../models/Trend';
import { Dashboard, IDashboard } from '../models/Dashboard';
import logger from '../utils/logger';

export interface OverviewStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
  customerSatisfaction: number;
  firstContactResolution: number;
}

export interface TeamStats {
  teamId: string;
  teamName: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaCompliance: number;
  agentCount: number;
  topAgent?: {
    agentId: string;
    agentName: string;
    resolvedTickets: number;
  };
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  customerSatisfaction: number;
  slaCompliance: number;
  firstResponseCount: number;
}

export class AnalyticsService {
  /**
   * Get analytics overview
   */
  async getOverview(startDate: Date, endDate: Date): Promise<OverviewStats> {
    // Simulated analytics - in production, these would aggregate from ticket data
    const stats: OverviewStats = {
      totalTickets: Math.floor(Math.random() * 10000) + 5000,
      openTickets: Math.floor(Math.random() * 500) + 100,
      resolvedTickets: Math.floor(Math.random() * 9000) + 4000,
      avgResponseTime: Math.floor(Math.random() * 120) + 30, // minutes
      avgResolutionTime: Math.floor(Math.random() * 480) + 120, // minutes
      slaCompliance: Math.random() * 20 + 80, // 80-100%
      customerSatisfaction: Math.random() * 10 + 85, // 85-95%
      firstContactResolution: Math.random() * 30 + 50, // 50-80%
    };

    // Record analytics
    await this.recordMetric('total_tickets', MetricType.TICKET_VOLUME, stats.totalTickets, 'count', 'team', 'all');
    await this.recordMetric('avg_response_time', MetricType.RESPONSE_TIME, stats.avgResponseTime, 'minutes', 'team', 'all');
    await this.recordMetric('avg_resolution_time', MetricType.RESOLUTION_TIME, stats.avgResolutionTime, 'minutes', 'team', 'all');
    await this.recordMetric('sla_compliance', MetricType.SLA_COMPLIANCE, stats.slaCompliance, 'percent', 'team', 'all');

    return stats;
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(teamId: string, startDate: Date, endDate: Date): Promise<TeamStats> {
    // Simulated data - in production, aggregate from actual ticket data
    const stats: TeamStats = {
      teamId,
      teamName: `Team ${teamId}`,
      totalTickets: Math.floor(Math.random() * 2000) + 500,
      resolvedTickets: Math.floor(Math.random() * 1800) + 400,
      avgResponseTime: Math.floor(Math.random() * 60) + 15,
      avgResolutionTime: Math.floor(Math.random() * 240) + 60,
      slaCompliance: Math.random() * 15 + 85,
      agentCount: Math.floor(Math.random() * 10) + 3,
      topAgent: {
        agentId: `agent-${Math.floor(Math.random() * 100)}`,
        agentName: 'Top Agent',
        resolvedTickets: Math.floor(Math.random() * 200) + 100,
      },
    };

    // Record metrics
    await this.recordMetric('team_tickets', MetricType.TICKET_VOLUME, stats.totalTickets, 'count', 'team', teamId);
    await this.recordMetric('team_sla', MetricType.SLA_COMPLIANCE, stats.slaCompliance, 'percent', 'team', teamId);

    return stats;
  }

  /**
   * Get agent analytics
   */
  async getAgentAnalytics(agentId: string, startDate: Date, endDate: Date): Promise<AgentStats> {
    // Simulated data
    const stats: AgentStats = {
      agentId,
      agentName: `Agent ${agentId}`,
      totalTickets: Math.floor(Math.random() * 500) + 100,
      resolvedTickets: Math.floor(Math.random() * 450) + 80,
      avgResponseTime: Math.floor(Math.random() * 30) + 10,
      avgResolutionTime: Math.floor(Math.random() * 180) + 45,
      customerSatisfaction: Math.random() * 15 + 80,
      slaCompliance: Math.random() * 20 + 80,
      firstResponseCount: Math.floor(Math.random() * 100) + 20,
    };

    // Record metrics
    await this.recordMetric('agent_tickets', MetricType.TICKET_VOLUME, stats.totalTickets, 'count', 'agent', agentId);
    await this.recordMetric('agent_csat', MetricType.CUSTOMER_SATISFACTION, stats.customerSatisfaction, 'percent', 'agent', agentId);

    return stats;
  }

  /**
   * Get trend data
   */
  async getTrends(
    metricName: string,
    startDate: Date,
    endDate: Date,
    granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<Array<{ date: Date; value: number }>> {
    const trends = await Trend.find({
      metricName,
      periodStart: { $gte: startDate },
      periodEnd: { $lte: endDate },
    }).sort({ periodStart: 1 }).exec();

    if (trends.length > 0) {
      return trends[0].dataPoints;
    }

    // Generate sample data if no trends exist
    const dataPoints: Array<{ date: Date; value: number }> = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dataPoints.push({
        date: new Date(currentDate),
        value: Math.random() * 100 + 50,
      });
      if (granularity === 'daily') currentDate.setDate(currentDate.getDate() + 1);
      else if (granularity === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
      else currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return dataPoints;
  }

  /**
   * Get dashboard
   */
  async getDashboard(dashboardId: string): Promise<IDashboard | null> {
    return Dashboard.findOne({ dashboardId }).exec();
  }

  /**
   * Get dashboards for owner
   */
  async getDashboards(ownerId: string, ownerType: 'team' | 'agent' | 'admin'): Promise<IDashboard[]> {
    return Dashboard.find({ ownerId, ownerType }).exec();
  }

  /**
   * Create dashboard
   */
  async createDashboard(data: Partial<IDashboard>): Promise<IDashboard> {
    const dashboard = new Dashboard({
      dashboardId: `DSH-${uuidv4().slice(0, 8).toUpperCase()}`,
      ...data,
    });
    await dashboard.save();
    logger.info('Dashboard created', { dashboardId: dashboard.dashboardId });
    return dashboard;
  }

  /**
   * Update dashboard
   */
  async updateDashboard(dashboardId: string, updates: Partial<IDashboard>): Promise<IDashboard | null> {
    return Dashboard.findOneAndUpdate(
      { dashboardId },
      { $set: updates },
      { new: true }
    ).exec();
  }

  /**
   * Record a metric
   */
  async recordMetric(
    name: string,
    type: MetricType,
    value: number,
    unit: string,
    dimension: string,
    dimensionValue: string
  ): Promise<void> {
    const metric = new Metric({
      metricId: `MET-${uuidv4().slice(0, 8).toUpperCase()}`,
      name,
      type,
      value,
      period: 'daily',
      periodStart: this.getStartOfDay(new Date()),
      periodEnd: this.getEndOfDay(new Date()),
      metadata: {},
    });
    await metric.save();

    // Also record in Analytics
    const analytics = new Analytics({
      analyticsId: `ANL-${uuidv4().slice(0, 8).toUpperCase()}`,
      type,
      value,
      unit,
      period: 'daily',
      periodStart: this.getStartOfDay(new Date()),
      periodEnd: this.getEndOfDay(new Date()),
      dimension,
      dimensionValue,
    });
    await analytics.save();
  }

  /**
   * Calculate trend
   */
  async calculateTrend(
    metricName: string,
    currentValue: number,
    period: 'daily' | 'weekly' | 'monthly',
    teamId?: string,
    agentId?: string
  ): Promise<ITrend> {
    const now = new Date();
    const periodStart = this.getStartOfPeriod(now, period);
    const periodEnd = this.getEndOfPeriod(now, period);

    // Get previous period value
    const previousStart = new Date(periodStart);
    if (period === 'daily') previousStart.setDate(previousStart.getDate() - 1);
    else if (period === 'weekly') previousStart.setDate(previousStart.getDate() - 7);
    else previousStart.setMonth(previousStart.getMonth() - 1);

    const previousMetric = await Metric.findOne({
      name: metricName,
      periodStart: previousStart,
      ...(teamId && { teamId }),
      ...(agentId && { agentId }),
    }).exec();

    const previousValue = previousMetric?.value || currentValue * 0.9;
    const changePercent = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (changePercent > 5) direction = 'up';
    else if (changePercent < -5) direction = 'down';

    const trend = new Trend({
      trendId: `TRD-${uuidv4().slice(0, 8).toUpperCase()}`,
      metricName,
      direction,
      changePercent,
      previousValue,
      currentValue,
      period,
      periodStart,
      periodEnd,
      teamId,
      agentId,
    });
    await trend.save();

    return trend;
  }

  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getEndOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private getStartOfPeriod(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const d = new Date(date);
    if (period === 'daily') {
      d.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
    } else {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    }
    return d;
  }

  private getEndOfPeriod(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const d = new Date(date);
    if (period === 'daily') {
      d.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      d.setDate(d.getDate() + (6 - d.getDay()));
      d.setHours(23, 59, 59, 999);
    } else {
      d.setMonth(d.getMonth() + 1);
      d.setDate(0);
      d.setHours(23, 59, 59, 999);
    }
    return d;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;