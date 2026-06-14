import { PortalAnalytics } from '../models';
import { analyticsService, DashboardData } from './analyticsService';
import { logger } from 'utils/logger.js';

export interface ReportConfig {
  name: string;
  type: 'performance' | 'client' | 'campaign' | 'financial' | 'custom';
  metrics: string[];
  dimensions: string[];
  filters?: {
    startDate?: Date;
    endDate?: Date;
    clientIds?: string[];
    campaignIds?: string[];
    countries?: string[];
 devices?: ('desktop' | 'mobile' | 'tablet')[];
  };
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  format: 'json' | 'csv' | 'pdf' | 'excel';
}

export interface Report {
  id: string;
  portalId: string;
  name: string;
  type: string;
  config: ReportConfig;
  createdAt: Date;
  updatedAt: Date;
  lastGeneratedAt?: Date;
  generatedBy: string;
}

export interface GeneratedReport {
  id: string;
  reportId: string;
  portalId: string;
  data: unknown;
  generatedAt: Date;
  format: string;
  url?: string;
}

export class ReportService {
  private reports: Map<string, Report> = new Map();
  private generatedReports: Map<string, GeneratedReport> = new Map();

  /**
   * Create a custom report configuration
   */
  async createReport(
    portalId: string,
    config: ReportConfig,
    createdBy: string
  ): Promise<Report> {
    logger.info('Creating report', { portalId, name: config.name });

    const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const report: Report = {
      id,
      portalId,
      name: config.name,
      type: config.type,
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedBy,
    };

    this.reports.set(id, report);
    logger.info('Report created', { reportId: id });

    return report;
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<Report | null> {
    return this.reports.get(reportId) || null;
  }

  /**
   * Get reports for a portal
   */
  async getReportsByPortalId(portalId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter((r) => r.portalId === portalId);
  }

  /**
   * Update report configuration
   */
  async updateReport(reportId: string, config: Partial<ReportConfig>): Promise<Report | null> {
    const report = this.reports.get(reportId);
    if (!report) {
      return null;
    }

    report.config = { ...report.config, ...config };
    report.updatedAt = new Date();

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    return this.reports.delete(reportId);
  }

  /**
   * Generate report data
   */
  async generateReport(reportId: string): Promise<GeneratedReport> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    logger.info('Generating report', { reportId, type: report.type });

    const { config } = report;
    const startDate = config.filters?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = config.filters?.endDate || new Date();

    let data: unknown;

    switch (config.type) {
      case 'performance':
        data = await this.generatePerformanceReport(report.portalId, config, startDate, endDate);
        break;
      case 'client':
        data = await this.generateClientReport(report.portalId, config, startDate, endDate);
        break;
      case 'campaign':
        data = await this.generateCampaignReport(report.portalId, config, startDate, endDate);
        break;
      case 'financial':
        data = await this.generateFinancialReport(report.portalId, config, startDate, endDate);
        break;
      case 'custom':
        data = await this.generateCustomReport(report.portalId, config, startDate, endDate);
        break;
      default:
        data = await this.generatePerformanceReport(report.portalId, config, startDate, endDate);
    }

    const generatedId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const generated: GeneratedReport = {
      id: generatedId,
      reportId,
      portalId: report.portalId,
      data,
      generatedAt: new Date(),
      format: config.format,
    };

    this.generatedReports.set(generatedId, generated);

    // Update last generated timestamp
    report.lastGeneratedAt = new Date();
    this.reports.set(reportId, report);

    logger.info('Report generated', { reportId, generatedId });

    return generated;
  }

  /**
   * Get generated report
   */
  async getGeneratedReport(generatedId: string): Promise<GeneratedReport | null> {
    return this.generatedReports.get(generatedId) || null;
  }

  /**
   * Get generated reports for a report configuration
   */
  async getGeneratedReports(reportId: string): Promise<GeneratedReport[]> {
    return Array.from(this.generatedReports.values())
      .filter((r) => r.reportId === reportId)
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  /**
   * Export report in specified format
   */
  async exportReport(
    generatedId: string,
    format: 'json' | 'csv' | 'pdf' | 'excel'
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const generated = this.generatedReports.get(generatedId);
    if (!generated) {
      throw new Error('Generated report not found');
    }

    const report = this.reports.get(generated.reportId);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${report?.name || 'report'}_${timestamp}`;

    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(generated.data, null, 2),
          contentType: 'application/json',
          filename: `${filename}.json`,
        };
      case 'csv':
        return {
          data: this.convertToCSV(generated.data),
          contentType: 'text/csv',
          filename: `${filename}.csv`,
        };
      case 'pdf':
        // In production, would use a PDF generation library
        return {
          data: JSON.stringify(generated.data),
          contentType: 'application/pdf',
          filename: `${filename}.pdf`,
        };
      case 'excel':
        // In production, would use a spreadsheet library
        return {
          data: JSON.stringify(generated.data),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: `${filename}.xlsx`,
        };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate performance report
   */
  private async generatePerformanceReport(
    portalId: string,
    config: ReportConfig,
    startDate: Date,
    endDate: Date
  ): Promise<DashboardData> {
    return analyticsService.getDashboardData(portalId, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  }

  /**
   * Generate client report
   */
  private async generateClientReport(
    portalId: string,
    config: ReportConfig,
    startDate: Date,
    endDate: Date
  ): Promise<unknown> {
    const analytics = await PortalAnalytics.find({
      portalId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Aggregate by client
    const clientData = new Map<string, {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
    }>();

    analytics.forEach((a) => {
      a.clientMetrics.forEach((c) => {
        if (config.filters?.clientIds && !config.filters.clientIds.includes(c.clientId)) {
          return;
        }

        const existing = clientData.get(c.clientId);
        if (existing) {
          existing.impressions += c.impressions;
          existing.clicks += c.clicks;
          existing.conversions += c.conversions;
          existing.spend += c.spend;
          existing.revenue += c.revenue;
        } else {
          clientData.set(c.clientId, { ...c });
        }
      });
    });

    return {
      period: { start: startDate, end: endDate },
      clients: Array.from(clientData.entries()).map(([clientId, data]) => ({
        clientId,
        ...data,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
      })),
    };
  }

  /**
   * Generate campaign report
   */
  private async generateCampaignReport(
    portalId: string,
    config: ReportConfig,
    startDate: Date,
    endDate: Date
  ): Promise<unknown> {
    const analytics = await PortalAnalytics.find({
      portalId,
      date: { $gte: startDate, $lte: endDate },
    });

    // Aggregate by campaign
    const campaignData = new Map<string, {
      name: string;
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
    }>();

    analytics.forEach((a) => {
      a.campaigns.forEach((c) => {
        if (config.filters?.campaignIds && !config.filters.campaignIds.includes(c.campaignId)) {
          return;
        }

        const existing = campaignData.get(c.campaignId);
        if (existing) {
          existing.impressions += c.impressions;
          existing.clicks += c.clicks;
          existing.conversions += c.conversions;
          existing.spend += c.spend;
        } else {
          campaignData.set(c.campaignId, { name: c.name, ...c });
        }
      });
    });

    return {
      period: { start: startDate, end: endDate },
      campaigns: Array.from(campaignData.entries()).map(([campaignId, data]) => ({
        campaignId,
        ...data,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
        cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
        cpm: data.impressions > 0 ? (data.spend / data.impressions) * 1000 : 0,
      })),
    };
  }

  /**
   * Generate financial report
   */
  private async generateFinancialReport(
    portalId: string,
    config: ReportConfig,
    startDate: Date,
    endDate: Date
  ): Promise<unknown> {
    const analytics = await PortalAnalytics.find({
      portalId,
      date: { $gte: startDate, $lte: endDate },
    });

    let totalSpend = 0;
    let totalRevenue = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    analytics.forEach((a) => {
      totalSpend += a.metrics.spend;
      totalRevenue += a.metrics.revenue;
      totalImpressions += a.metrics.impressions;
      totalClicks += a.metrics.clicks;
      totalConversions += a.metrics.conversions;
    });

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalSpend,
        totalRevenue,
        netRevenue: totalRevenue - totalSpend,
        roi: totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0,
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      },
      dailyBreakdown: analytics.map((a) => ({
        date: a.date,
        spend: a.metrics.spend,
        revenue: a.metrics.revenue,
        impressions: a.metrics.impressions,
        clicks: a.metrics.clicks,
        conversions: a.metrics.conversions,
      })),
    };
  }

  /**
   * Generate custom report based on selected metrics/dimensions
   */
  private async generateCustomReport(
    portalId: string,
    config: ReportConfig,
    startDate: Date,
    endDate: Date
  ): Promise<unknown> {
    const analytics = await PortalAnalytics.find({
      portalId,
      date: { $gte: startDate, $lte: endDate },
    });

    const result: Record<string, unknown> = {
      period: { start: startDate, end: endDate },
      config: {
        metrics: config.metrics,
        dimensions: config.dimensions,
      },
    };

    // Build custom data based on metrics and dimensions
    if (config.dimensions.includes('date')) {
      result.trends = analytics.map((a) => {
        const dataPoint: Record<string, unknown> = { date: a.date };
        config.metrics.forEach((metric) => {
          dataPoint[metric] = (a.metrics as Record<string, unknown>)[metric] || 0;
        });
        return dataPoint;
      });
    }

    if (config.dimensions.includes('location') && config.metrics.some((m) => ['impressions', 'clicks'].includes(m))) {
      result.locations = this.aggregateByDimension(analytics, 'topLocations', config.metrics);
    }

    if (config.dimensions.includes('device') && config.metrics.some((m) => ['impressions', 'clicks'].includes(m))) {
      result.devices = this.aggregateByDimension(analytics, 'topDevices', config.metrics);
    }

    return result;
  }

  /**
   * Aggregate analytics by a specific dimension
   */
  private aggregateByDimension(
    analytics: InstanceType<typeof PortalAnalytics>[],
    dimension: 'topLocations' | 'topDevices',
    metrics: string[]
  ): unknown[] {
    const aggregated = new Map<string, Record<string, number>>();

    analytics.forEach((a) => {
      (a[dimension] as { type?: string; country?: string; impressions: number; clicks: number }[]).forEach((item) => {
        const key = dimension === 'topDevices' ? item.type : item.country;
        if (!key) return;

        const existing = aggregated.get(key) || { impressions: 0, clicks: 0 };
        existing.impressions += item.impressions || 0;
        existing.clicks += item.clicks || 0;
        aggregated.set(key, existing);
      });
    });

    return Array.from(aggregated.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: unknown): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0] as Record<string, unknown>);
      const rows = data.map((row) =>
        headers.map((h) => {
          const value = (row as Record<string, unknown>)[h];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return String(value ?? '');
        }).join(',')
      );

      return [headers.join(','), ...rows].join('\n');
    }

    return JSON.stringify(data);
  }

  /**
   * Get scheduled reports that need to be generated
   */
  async getScheduledReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (r) => r.config.schedule?.enabled
    );
  }
}

export const reportService = new ReportService();
