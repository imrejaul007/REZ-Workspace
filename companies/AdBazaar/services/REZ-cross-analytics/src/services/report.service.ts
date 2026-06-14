import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import { parse as json2csvParse } from 'json2csv';
import {
  Report,
  ReportConfig,
  ReportType,
  DateRange,
  Platform,
  UnifiedMetrics,
  AggregatedMetrics,
  CrossPlatformSummary,
  TrendData,
  ROIMetrics,
  ExportConfig,
} from '../types';
import { metricAggregatorService } from './metric-aggregator.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReportService');

export class ReportService {
  private reports: Map<string, Report> = new Map();

  /**
   * Generate a report based on configuration
   */
  async generateReport(config: ReportConfig, metrics: UnifiedMetrics[]): Promise<Report> {
    const reportId = config.id || uuidv4();
    const startTime = Date.now();

    logger.info(`Generating ${config.type} report`, { reportId, name: config.name });

    // Filter metrics by date range and platforms
    let filteredMetrics = metricAggregatorService.filterByDateRange(metrics, config.dateRange);
    if (config.platforms && config.platforms.length > 0) {
      filteredMetrics = metricAggregatorService.filterByPlatforms(filteredMetrics, config.platforms);
    }

    // Generate report based on type
    let report: Report;

    switch (config.type) {
      case 'summary':
        report = await this.generateSummaryReport(reportId, config, filteredMetrics);
        break;
      case 'detailed':
        report = await this.generateDetailedReport(reportId, config, filteredMetrics);
        break;
      case 'roi':
        report = await this.generateROIReport(reportId, config, filteredMetrics);
        break;
      case 'engagement':
        report = await this.generateEngagementReport(reportId, config, filteredMetrics);
        break;
      case 'trends':
        report = await this.generateTrendsReport(reportId, config, filteredMetrics);
        break;
      case 'custom':
        report = await this.generateCustomReport(reportId, config, filteredMetrics);
        break;
      default:
        report = await this.generateSummaryReport(reportId, config, filteredMetrics);
    }

    // Store the report
    this.reports.set(report.id, report);

    const duration = Date.now() - startTime;
    logger.logReportGeneration(config.type, duration);

    return report;
  }

  /**
   * Generate summary report
   */
  private async generateSummaryReport(
    reportId: string,
    config: ReportConfig,
    metrics: UnifiedMetrics[]
  ): Promise<Report> {
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const summary = this.generateCrossPlatformSummary(metrics, config.platforms || []);

    return {
      id: reportId,
      name: config.name,
      type: 'summary',
      generatedAt: new Date(),
      dateRange: config.dateRange,
      summary,
      metrics: aggregated,
    };
  }

  /**
   * Generate detailed report with all metrics
   */
  private async generateDetailedReport(
    reportId: string,
    config: ReportConfig,
    metrics: UnifiedMetrics[]
  ): Promise<Report> {
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const summary = this.generateCrossPlatformSummary(metrics, config.platforms || []);

    return {
      id: reportId,
      name: config.name,
      type: 'detailed',
      generatedAt: new Date(),
      dateRange: config.dateRange,
      summary,
      metrics: aggregated,
    };
  }

  /**
   * Generate ROI report
   */
  private async generateROIReport(
    reportId: string,
    config: ReportConfig,
    metrics: UnifiedMetrics[]
  ): Promise<Report> {
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const summary = this.generateCrossPlatformSummary(metrics, config.platforms || []);

    // Mock ROI data - in production, this would come from ad spend data
    const roi: ROIMetrics[] = aggregated.map((agg) => ({
      platform: agg.platform,
      spend: Math.random() * 10000 + 1000, // Mock spend
      revenue: Math.random() * 50000 + 5000, // Mock revenue
      impressions: agg.totalImpressions,
      conversions: Math.floor(agg.totalEngagements * 0.05), // 5% conversion rate
      cpa: Math.random() * 50 + 10,
      roas: Math.random() * 5 + 1,
      ctr: Math.random() * 3 + 0.5,
    }));

    return {
      id: reportId,
      name: config.name,
      type: 'roi',
      generatedAt: new Date(),
      dateRange: config.dateRange,
      summary,
      metrics: aggregated,
      roi,
    };
  }

  /**
   * Generate engagement report
   */
  private async generateEngagementReport(
    reportId: string,
    config: ReportConfig,
    metrics: UnifiedMetrics[]
  ): Promise<Report> {
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const summary = this.generateCrossPlatformSummary(metrics, config.platforms || []);

    return {
      id: reportId,
      name: config.name,
      type: 'engagement',
      generatedAt: new Date(),
      dateRange: config.dateRange,
      summary,
      metrics: aggregated,
    };
  }

  /**
   * Generate trends report
   */
  private async generateTrendsReport(
    reportId: string,
    config: ReportConfig,
    metrics: UnifiedMetrics[]
  ): Promise<Report> {
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const summary = this.generateCrossPlatformSummary(metrics, config.platforms || []);
    const trends = this.calculateTrends(metrics);

    return {
      id: reportId,
      name: config.name,
      type: 'trends',
      generatedAt: new Date(),
      dateRange: config.dateRange,
      summary,
      metrics: aggregated,
      trends,
    };
  }

  /**
   * Generate custom report
   */
  private async generateCustomReport(
    reportId: string,
    config: ReportConfig,
    metrics: UnifiedMetrics[]
  ): Promise<Report> {
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);
    const summary = this.generateCrossPlatformSummary(metrics, config.platforms || []);

    return {
      id: reportId,
      name: config.name,
      type: 'custom',
      generatedAt: new Date(),
      dateRange: config.dateRange,
      summary,
      metrics: aggregated,
    };
  }

  /**
   * Generate cross-platform summary
   */
  private generateCrossPlatformSummary(metrics: UnifiedMetrics[], platforms: Platform[]): CrossPlatformSummary {
    const crossPlatform = metricAggregatorService.aggregateCrossPlatform(metrics);
    const aggregated = metricAggregatorService.aggregateByPlatform(metrics);

    // Find top performing platform
    let topPlatform: Platform = 'twitter';
    let maxEngagements = 0;

    aggregated.forEach((agg) => {
      if (agg.totalEngagements > maxEngagements) {
        maxEngagements = agg.totalEngagements;
        topPlatform = agg.platform;
      }
    });

    const platformBreakdown = aggregated.map((agg) => ({
      platform: agg.platform,
      impressions: agg.totalImpressions,
      reach: agg.totalReach,
      engagements: agg.totalEngagements,
      engagementRate: agg.engagementRate,
    }));

    return {
      date: new Date().toISOString().split('T')[0],
      platforms: platforms.length > 0 ? platforms : Array.from(new Set(metrics.map((m) => m.platform))),
      totalImpressions: crossPlatform.totalImpressions,
      totalReach: crossPlatform.totalReach,
      totalEngagements: crossPlatform.totalEngagements,
      overallEngagementRate: crossPlatform.engagementRate,
      topPlatform,
      platformBreakdown,
    };
  }

  /**
   * Calculate trends from metrics
   */
  private calculateTrends(metrics: UnifiedMetrics[]): TrendData[] {
    const trends: TrendData[] = [];
    const grouped = metricAggregatorService.groupByTimePeriod(metrics, 'day');

    grouped.forEach((dayMetrics, date) => {
      const platformMetrics = metricAggregatorService.aggregateCrossPlatform(dayMetrics);

      trends.push({
        date,
        platform: 'twitter', // Aggregated
        value: platformMetrics.totalEngagements,
      });
    });

    // Sort by date
    trends.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate percentage changes
    for (let i = 1; i < trends.length; i++) {
      const prev = trends[i - 1].value;
      const curr = trends[i].value;
      trends[i].percentageChange = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    }

    return trends;
  }

  /**
   * Export report to specified format
   */
  async exportReport(reportId: string, exportConfig: ExportConfig): Promise<Buffer | string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    logger.logExport(exportConfig.format, report.metrics.length);

    switch (exportConfig.format) {
      case 'csv':
        return this.exportToCSV(report);
      case 'pdf':
        return await this.exportToPDF(report);
      case 'json':
        return this.exportToJSON(report);
      default:
        return this.exportToJSON(report);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(report: Report): string {
    const data = report.metrics.map((m) => ({
      platform: m.platform,
      totalImpressions: m.totalImpressions,
      totalReach: m.totalReach,
      totalEngagements: m.totalEngagements,
      totalLikes: m.totalLikes,
      totalComments: m.totalComments,
      totalShares: m.totalShares,
      totalClicks: m.totalClicks,
      engagementRate: m.engagementRate.toFixed(2) + '%',
      postCount: m.postCount,
    }));

    return json2csvParse(data) || '';
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(report: Report): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(20).text(report.name, { align: 'center' });
      doc.moveDown();

      // Report info
      doc.fontSize(12).text(`Type: ${report.type}`);
      doc.text(`Generated: ${report.generatedAt.toISOString()}`);
      doc.text(`Date Range: ${report.dateRange.start.toISOString().split('T')[0]} - ${report.dateRange.end.toISOString().split('T')[0]}`);
      doc.moveDown();

      // Summary
      doc.fontSize(16).text('Summary', { underline: true });
      doc.fontSize(12);
      doc.text(`Total Impressions: ${report.summary.totalImpressions.toLocaleString()}`);
      doc.text(`Total Reach: ${report.summary.totalReach.toLocaleString()}`);
      doc.text(`Total Engagements: ${report.summary.totalEngagements.toLocaleString()}`);
      doc.text(`Overall Engagement Rate: ${report.summary.overallEngagementRate.toFixed(2)}%`);
      doc.text(`Top Platform: ${report.summary.topPlatform}`);
      doc.moveDown();

      // Platform breakdown
      doc.fontSize(16).text('Platform Breakdown', { underline: true });
      doc.fontSize(12);

      report.summary.platformBreakdown.forEach((pb) => {
        doc.text(`${pb.platform}: ${pb.impressions.toLocaleString()} impressions, ${pb.engagementRate.toFixed(2)}% engagement`);
      });

      doc.end();
    });
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(report: Report): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get a stored report by ID
   */
  getReport(reportId: string): Report | undefined {
    return this.reports.get(reportId);
  }

  /**
   * List all stored reports
   */
  listReports(): Report[] {
    return Array.from(this.reports.values());
  }

  /**
   * Delete a report
   */
  deleteReport(reportId: string): boolean {
    return this.reports.delete(reportId);
  }
}

export const reportService = new ReportService();
export default reportService;
