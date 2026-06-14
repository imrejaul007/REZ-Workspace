import { v4 as uuidv4 } from 'uuid';
import { Report, IReport, ReportType, ReportFormat } from '../models/Report';
import { performanceService } from './performanceService';
import logger from 'utils/logger.js';

export interface GenerateReportInput {
  partnerId: string;
  type: ReportType;
  name: string;
  format: ReportFormat;
  period: {
    start: Date;
    end: Date;
  };
  filters?: {
    campaignIds?: string[];
    categories?: string[];
    regions?: string[];
  };
  metrics?: string[];
  scheduled?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

class ReportService {
  /**
   * Generate a report
   */
  async generateReport(input: GenerateReportInput): Promise<IReport> {
    const reportId = `report-${uuidv4().slice(0, 12)}`;

    const report = new Report({
      reportId,
      partnerId: input.partnerId,
      type: input.type,
      name: input.name,
      format: input.format,
      status: 'generating',
      period: input.period,
      filters: input.filters || {},
      metrics: input.metrics || ['revenue', 'conversions', 'clicks', 'ctr', 'roi'],
      data: {},
      scheduled: input.scheduled,
    });

    await report.save();

    // Generate report data
    try {
      const reportData = await this.generateReportData(input);
      report.data = reportData;
      report.status = 'ready';
      report.generatedAt = new Date();
      await report.save();

      logger.info('Report generated', { reportId, type: input.type });
    } catch (error) {
      report.status = 'failed';
      await report.save();
      logger.error('Report generation failed', { reportId, error: (error as Error).message });
      throw error;
    }

    return report;
  }

  /**
   * Generate report data based on type
   */
  private async generateReportData(input: GenerateReportInput): Promise<Record<string, unknown>> {
    switch (input.type) {
      case 'performance':
        return this.generatePerformanceReport(input);
      case 'revenue':
        return this.generateRevenueReport(input);
      case 'campaign':
        return this.generateCampaignReport(input);
      case 'roi':
        return this.generateRoiReport(input);
      default:
        return {};
    }
  }

  /**
   * Generate performance report
   */
  private async generatePerformanceReport(input: GenerateReportInput): Promise<Record<string, unknown>> {
    const aggregate = await performanceService.getAggregatePerformance(
      input.partnerId,
      input.period.start,
      input.period.end
    );

    return {
      summary: aggregate,
      period: input.period,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate revenue report
   */
  private async generateRevenueReport(input: GenerateReportInput): Promise<Record<string, unknown>> {
    const aggregate = await performanceService.getAggregatePerformance(
      input.partnerId,
      input.period.start,
      input.period.end
    );

    return {
      totalRevenue: aggregate.totalRevenue,
      totalConversions: aggregate.totalConversions,
      avgOrderValue: aggregate.totalConversions > 0
        ? aggregate.totalRevenue / aggregate.totalConversions
        : 0,
      revenueByCategory: {},
      period: input.period,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate campaign report
   */
  private async generateCampaignReport(input: GenerateReportInput): Promise<Record<string, unknown>> {
    return {
      campaigns: [],
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      avgCtr: 0,
      period: input.period,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate ROI report
   */
  private async generateRoiReport(input: GenerateReportInput): Promise<Record<string, unknown>> {
    const aggregate = await performanceService.getAggregatePerformance(
      input.partnerId,
      input.period.start,
      input.period.end
    );

    return {
      totalRevenue: aggregate.totalRevenue,
      totalSpend: 0,
      netProfit: aggregate.totalRevenue,
      roi: aggregate.avgRoi,
      period: input.period,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<IReport | null> {
    return Report.findOne({ reportId });
  }

  /**
   * Get reports by partner
   */
  async getReportsByPartner(
    partnerId: string,
    options: { type?: ReportType; status?: string; page?: number; limit?: number } = {}
  ): Promise<{ reports: IReport[]; total: number }> {
    const { type, status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { partnerId };
    if (type) query.type = type;
    if (status) query.status = status;

    const [reports, total] = await Promise.all([
      Report.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Report.countDocuments(query),
    ]);

    return { reports, total };
  }

  /**
   * Mark report as delivered
   */
  async markAsDelivered(reportId: string): Promise<IReport | null> {
    return Report.findOneAndUpdate(
      { reportId, status: 'ready' },
      {
        $set: {
          status: 'delivered',
          deliveredAt: new Date(),
        },
      },
      { new: true }
    );
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    const result = await Report.deleteOne({ reportId });
    return result.deletedCount > 0;
  }

  /**
   * Get scheduled reports to generate
   */
  async getScheduledReports(): Promise<IReport[]> {
    return Report.find({
      'scheduled.enabled': true,
      status: { $in: ['ready', 'delivered'] },
    });
  }
}

export const reportService = new ReportService();
export default reportService;