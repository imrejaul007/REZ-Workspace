import { v4 as uuidv4 } from 'uuid';
import { PerformanceReport, ReportMetrics, DateRange } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReportService');

// In-memory storage (replace with database in production)
const reports: Map<string, PerformanceReport> = new Map();

export class ReportService {
  async create(tenantId: string, title: string, dateRange: DateRange, metrics: ReportMetrics, createdBy: string): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      id: uuidv4(),
      tenantId,
      title,
      dateRange,
      metrics,
      createdAt: new Date(),
      createdBy,
    };

    reports.set(report.id, report);
    logger.info('Report created', { reportId: report.id, tenantId });

    return report;
  }

  async findById(tenantId: string, id: string): Promise<PerformanceReport | null> {
    const report = reports.get(id);
    if (!report || report.tenantId !== tenantId) {
      return null;
    }
    return report;
  }

  async findAll(tenantId: string, options?: { limit?: number; offset?: number }): Promise<PerformanceReport[]> {
    let result = Array.from(reports.values())
      .filter(r => r.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  async findByDateRange(tenantId: string, dateRange: DateRange): Promise<PerformanceReport[]> {
    return Array.from(reports.values())
      .filter(r => {
        if (r.tenantId !== tenantId) return false;
        return r.dateRange.start >= dateRange.start && r.dateRange.end <= dateRange.end;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const report = reports.get(id);
    if (!report || report.tenantId !== tenantId) {
      return false;
    }

    const deleted = reports.delete(id);
    if (deleted) {
      logger.info('Report deleted', { reportId: id, tenantId });
    }
    return deleted;
  }

  // Generate aggregate report from multiple reports
  async generateAggregateReport(tenantId: string, dateRange: DateRange): Promise<ReportMetrics> {
    const reportsInRange = await this.findByDateRange(tenantId, dateRange);

    const aggregate: ReportMetrics = {
      totalPosts: 0,
      totalReach: 0,
      totalEngagement: 0,
      conversionRate: 0,
      topPerforming: [],
      platformBreakdown: {},
    };

    for (const report of reportsInRange) {
      if (report.metrics.totalPosts) aggregate.totalPosts! += report.metrics.totalPosts;
      if (report.metrics.totalReach) aggregate.totalReach! += report.metrics.totalReach;
      if (report.metrics.totalEngagement) aggregate.totalEngagement! += report.metrics.totalEngagement;
      if (report.metrics.conversionRate) aggregate.conversionRate! += report.metrics.conversionRate;

      if (report.metrics.platformBreakdown) {
        for (const [platform, metrics] of Object.entries(report.metrics.platformBreakdown)) {
          if (!aggregate.platformBreakdown![platform]) {
            aggregate.platformBreakdown![platform] = { reach: 0, engagement: 0, clicks: 0, conversions: 0 };
          }
          aggregate.platformBreakdown![platform].reach += metrics.reach;
          aggregate.platformBreakdown![platform].engagement += metrics.engagement;
          aggregate.platformBreakdown![platform].clicks += metrics.clicks;
          aggregate.platformBreakdown![platform].conversions += metrics.conversions;
        }
      }
    }

    // Average conversion rate
    if (reportsInRange.length > 0) {
      aggregate.conversionRate = aggregate.conversionRate! / reportsInRange.length;
    }

    return aggregate;
  }
}

export const reportService = new ReportService();
