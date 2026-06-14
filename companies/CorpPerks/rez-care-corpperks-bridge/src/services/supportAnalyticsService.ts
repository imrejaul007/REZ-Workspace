import axios from 'axios';
import { Ticket, WhatsAppSession } from '../models/index.js';
import { employeeSupportService } from './employeeSupportService.js';

const REZ_CARE_SERVICE_URL = process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4058';

export interface EmployeeSupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  firstContactResolution: number;
  channelBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}

export interface CompanySupportAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  slaCompliance: number;
  ticketsByCategory: Record<string, number>;
  ticketsByPriority: Record<string, number>;
  ticketsByStatus: Record<string, number>;
  channelDistribution: Record<string, number>;
  topIssues: Array<{ category: string; count: number }>;
  trend: Array<{ date: string; tickets: number; resolved: number }>;
}

export class SupportAnalyticsService {
  /**
   * Get employee support statistics
   */
  async getEmployeeStats(
    employeeId: string,
    companyId: string
  ): Promise<EmployeeSupportStats> {
    const metrics = await employeeSupportService.getTicketMetrics(companyId, { employeeId });

    const tickets = await Ticket.find({ employeeId, companyId }).lean();
    const closedTickets = tickets.filter((t) => t.resolvedAt || t.closedAt);

    // First contact resolution (resolved in first response)
    let firstContactResolution = 0;
    const singleCommentTickets = tickets.filter(
      (t) => t.comments.length === 1 && (t.resolvedAt || t.closedAt)
    );
    if (tickets.length > 0) {
      firstContactResolution = Math.round(
        (singleCommentTickets.length / closedTickets.length) * 100
      );
    }

    // Channel breakdown
    const channelBreakdown: Record<string, number> = {};
    for (const ticket of tickets) {
      channelBreakdown[ticket.source] = (channelBreakdown[ticket.source] || 0) + 1;
    }

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    for (const ticket of tickets) {
      categoryBreakdown[ticket.category] = (categoryBreakdown[ticket.category] || 0) + 1;
    }

    return {
      totalTickets: metrics.total,
      openTickets: metrics.open + metrics.inProgress,
      resolvedTickets: metrics.resolved + metrics.closed,
      avgResolutionTime: metrics.avgResolutionTime,
      satisfactionScore: metrics.satisfactionScore || 0,
      firstContactResolution,
      channelBreakdown,
      categoryBreakdown,
    };
  }

  /**
   * Get company-wide support analytics
   */
  async getCompanyAnalytics(
    companyId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<CompanySupportAnalytics> {
    const metrics = await employeeSupportService.getTicketMetrics(companyId, options);

    const filter: Record<string, unknown> = { companyId };
    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) (filter.createdAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (filter.createdAt as Record<string, Date>).$lte = options.endDate;
    }

    const tickets = await Ticket.find(filter).lean();

    // Category breakdown
    const ticketsByCategory: Record<string, number> = {};
    for (const ticket of tickets) {
      ticketsByCategory[ticket.category] = (ticketsByCategory[ticket.category] || 0) + 1;
    }

    // Priority breakdown
    const ticketsByPriority: Record<string, number> = {};
    for (const ticket of tickets) {
      ticketsByPriority[ticket.priority] = (ticketsByPriority[ticket.priority] || 0) + 1;
    }

    // Status breakdown
    const ticketsByStatus: Record<string, number> = {};
    for (const ticket of tickets) {
      ticketsByStatus[ticket.status] = (ticketsByStatus[ticket.status] || 0) + 1;
    }

    // Channel distribution
    const channelDistribution: Record<string, number> = {};
    for (const ticket of tickets) {
      channelDistribution[ticket.source] = (channelDistribution[ticket.source] || 0) + 1;
    }

    // Top issues
    const topIssues = Object.entries(ticketsByCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Trend (last 7 days)
    const trend: Array<{ date: string; tickets: number; resolved: number }> = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTickets = tickets.filter((t) => {
        const created = new Date(t.createdAt).toISOString().split('T')[0];
        return created === dateStr;
      });

      const dayResolved = tickets.filter((t) => {
        if (!t.resolvedAt) return false;
        const resolved = new Date(t.resolvedAt).toISOString().split('T')[0];
        return resolved === dateStr;
      });

      trend.push({ date: dateStr, tickets: dayTickets.length, resolved: dayResolved.length });
    }

    // SLA compliance
    const deadlineTickets = tickets.filter((t) => t.slaDeadline);
    const metSLA = deadlineTickets.filter((t) => {
      const deadline = new Date(t.slaDeadline!);
      const resolved = t.resolvedAt ? new Date(t.resolvedAt) : new Date();
      return resolved <= deadline;
    });
    const slaCompliance = deadlineTickets.length > 0
      ? Math.round((metSLA.length / deadlineTickets.length) * 100)
      : 100;

    return {
      totalTickets: metrics.total,
      openTickets: metrics.open + metrics.inProgress,
      resolvedTickets: metrics.resolved + metrics.closed,
      avgFirstResponseTime: metrics.firstResponseTime,
      avgResolutionTime: metrics.avgResolutionTime,
      satisfactionScore: metrics.satisfactionScore || 0,
      slaCompliance,
      ticketsByCategory,
      ticketsByPriority,
      ticketsByStatus,
      channelDistribution,
      topIssues,
      trend,
    };
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(
    companyId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<Array<{
    agentId: string;
    agentName: string;
    ticketsAssigned: number;
    ticketsResolved: number;
    avgResolutionTime: number;
    avgResponseTime: number;
    satisfactionScore: number;
    currentLoad: number;
  }>> {
    const filter: Record<string, unknown> = { companyId, assignedTo: { $exists: true } };
    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) (filter.createdAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (filter.createdAt as Record<string, Date>).$lte = options.endDate;
    }

    const tickets = await Ticket.find(filter).lean();

    // Group by agent
    const agentTickets: Record<string, typeof tickets> = {};
    for (const ticket of tickets) {
      if (ticket.assignedTo) {
        if (!agentTickets[ticket.assignedTo]) {
          agentTickets[ticket.assignedTo] = [];
        }
        agentTickets[ticket.assignedTo].push(ticket);
      }
    }

    // Calculate metrics per agent
    const agentMetrics = Object.entries(agentTickets).map(([agentId, agentTicketsList]) => {
      const resolved = agentTicketsList.filter((t) => t.resolvedAt || t.closedAt);
      const active = agentTicketsList.filter((t) => t.status !== 'resolved' && t.status !== 'closed');

      // Avg resolution time
      let avgResolutionTime = 0;
      if (resolved.length > 0) {
        const totalTime = resolved.reduce((sum, t) => {
          return sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime());
        }, 0);
        avgResolutionTime = Math.round(totalTime / resolved.length / 1000 / 60 / 60); // hours
      }

      // Avg response time
      let avgResponseTime = 0;
      const withResponse = agentTicketsList.filter((t) => t.firstResponseAt);
      if (withResponse.length > 0) {
        const totalTime = withResponse.reduce((sum, t) => {
          return sum + (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime());
        }, 0);
        avgResponseTime = Math.round(totalTime / withResponse.length / 1000 / 60); // minutes
      }

      // Satisfaction
      const rated = agentTicketsList.filter((t) => t.satisfactionRating);
      const satisfactionScore = rated.length > 0
        ? rated.reduce((sum, t) => sum + (t.satisfactionRating || 0), 0) / rated.length
        : 0;

      // Get agent name from first ticket
      const agentName = agentTicketsList[0]?.assignedToName || 'Unknown';

      return {
        agentId,
        agentName,
        ticketsAssigned: agentTicketsList.length,
        ticketsResolved: resolved.length,
        avgResolutionTime,
        avgResponseTime,
        satisfactionScore: Math.round(satisfactionScore * 100) / 100,
        currentLoad: active.length,
      };
    });

    return agentMetrics.sort((a, b) => b.ticketsResolved - a.ticketsResolved);
  }

  /**
   * Get support trends
   */
  async getSupportTrends(
    companyId: string,
    days: number = 30
  ): Promise<Array<{
    date: string;
    created: number;
    resolved: number;
    open: number;
    avgResponseTime: number;
    avgResolutionTime: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tickets = await Ticket.find({
      companyId,
      createdAt: { $gte: startDate },
    }).lean();

    const trends: Array<{
      date: string;
      created: number;
      resolved: number;
      open: number;
      avgResponseTime: number;
      avgResolutionTime: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCreated = tickets.filter((t) => {
        return new Date(t.createdAt).toISOString().split('T')[0] === dateStr;
      });

      const dayResolved = tickets.filter((t) => {
        if (!t.resolvedAt) return false;
        return new Date(t.resolvedAt).toISOString().split('T')[0] === dateStr;
      });

      // Cumulative open tickets
      const createdBefore = tickets.filter((t) => {
        return new Date(t.createdAt) < new Date(dateStr);
      });
      const resolvedBefore = tickets.filter((t) => {
        return t.resolvedAt && new Date(t.resolvedAt) < new Date(dateStr);
      });
      const open = createdBefore.length - resolvedBefore.length;

      trends.push({
        date: dateStr,
        created: dayCreated.length,
        resolved: dayResolved.length,
        open,
        avgResponseTime: 0,
        avgResolutionTime: 0,
      });
    }

    return trends;
  }

  /**
   * Sync analytics with REZ Care Service
   */
  async syncAnalytics(companyId: string): Promise<void> {
    const analytics = await this.getCompanyAnalytics(companyId);

    try {
      await axios.post(
        `${REZ_CARE_SERVICE_URL}/api/analytics/sync`,
        {
          companyId,
          analytics,
          source: 'rez-care-corpperks-bridge',
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          },
        }
      );
    } catch (error) {
      logger.error('Failed to sync analytics with REZ Care Service:', error);
    }
  }
}

export const supportAnalyticsService = new SupportAnalyticsService();
