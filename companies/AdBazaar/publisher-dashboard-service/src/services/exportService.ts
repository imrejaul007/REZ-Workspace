import { RevenueAnalytics, PerformanceMetric, TrendData } from '../models';
import { dashboardQueriesTotal, dashboardQueryDuration } from '../utils/metrics';
import logger from '../utils/logger';

const serviceLogger = logger.child({ service: 'exportService' });

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';
export type ExportType = 'revenue' | 'performance' | 'trends' | 'full';

export interface ExportOptions {
  publisherId: string;
  startDate: Date;
  endDate: Date;
  format: ExportFormat;
  type: ExportType;
  metrics?: string[];
  includeForecast?: boolean;
}

export class ExportService {
  /**
   * Export data for a publisher
   */
  async exportData(options: ExportOptions): Promise<{
    data: any;
    format: ExportFormat;
    filename: string;
    contentType: string;
  }> {
    const startTime = Date.now();
    const { publisherId, startDate, endDate, format, type, metrics, includeForecast } = options;

    try {
      let data: any;
      let filename: string;

      switch (type) {
        case 'revenue':
          data = await this.exportRevenueData(publisherId, startDate, endDate);
          filename = `revenue_${this.formatDate(startDate)}_${this.formatDate(endDate)}`;
          break;
        case 'performance':
          data = await this.exportPerformanceData(publisherId, startDate, endDate);
          filename = `performance_${this.formatDate(startDate)}_${this.formatDate(endDate)}`;
          break;
        case 'trends':
          data = await this.exportTrendsData(publisherId, startDate, endDate, metrics || ['revenue', 'impressions'], includeForecast || false);
          filename = `trends_${this.formatDate(startDate)}_${this.formatDate(endDate)}`;
          break;
        case 'full':
          data = await this.exportFullData(publisherId, startDate, endDate, metrics || ['revenue', 'impressions', 'ctr', 'ecpm', 'fillRate']);
          filename = `full_report_${this.formatDate(startDate)}_${this.formatDate(endDate)}`;
          break;
        default:
          throw new Error(`Unknown export type: ${type}`);
      }

      // Convert to requested format
      const formattedData = await this.formatExport(data, format);

      dashboardQueriesTotal.inc({ type: 'export', publisher_id: publisherId });
      dashboardQueryDuration.observe({ type: 'export' }, (Date.now() - startTime) / 1000);

      return {
        data: formattedData,
        format,
        filename: `${filename}.${this.getExtension(format)}`,
        contentType: this.getContentType(format)
      };
    } catch (error) {
      serviceLogger.error('Error exporting data', {
        publisherId,
        type,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Export revenue data
   */
  private async exportRevenueData(publisherId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const data = await RevenueAnalytics.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $sort: { date: 1 }
      },
      {
        $project: {
          _id: 0,
          publisherId: 1,
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          hour: '$hourOfDay',
          dayOfWeek: '$dayOfWeek',
          country: '$metadata.country',
          deviceType: '$metadata.deviceType',
          currency: 1,
          revenue: '$revenue.total',
          revenueDisplay: '$revenue.display',
          revenueVideo: '$revenue.video',
          revenueNative: '$revenue.native',
          revenueRichMedia: '$revenue.richMedia',
          ecpm: '$ecpm.overall',
          ecpmDisplay: '$ecpm.display',
          ecpmVideo: '$ecpm.video',
          ecpmNative: '$ecpm.native',
          ecpmRichMedia: '$ecpm.richMedia',
          impressions: '$impressions.total',
          viewableImpressions: '$impressions.viewable',
          billableImpressions: '$impressions.billable',
          clicks: 1,
          conversions: 1,
          fillRate: 1,
          bidRate: 1,
          winningBidRate: 1
        }
      }
    ]);

    return data;
  }

  /**
   * Export performance data
   */
  private async exportPerformanceData(publisherId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const data = await PerformanceMetric.aggregate([
      {
        $match: {
          publisherId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $sort: { date: 1, adUnitId: 1 }
      },
      {
        $project: {
          _id: 0,
          publisherId: 1,
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          adUnitId: 1,
          adFormat: 1,
          deviceType: 1,
          country: 1,
          impressions: '$impressions.total',
          viewableImpressions: '$impressions.viewable',
          billableImpressions: '$impressions.billable',
          videoFirstQuartile: '$impressions.firstQuartile',
          videoMidpoint: '$impressions.midpoint',
          videoThirdQuartile: '$impressions.thirdQuartile',
          videoComplete: '$impressions.complete',
          clicks: 1,
          ctr: 1,
          fillRate: 1,
          bidRate: 1,
          winningBidRate: 1,
          ecpm: 1,
          revenue: 1,
          cpc: 1,
          cpa: 1,
          timeOnAd: '$engagement.timeOnAd',
          interactionRate: '$engagement.interactionRate',
          expansionRate: '$engagement.expansionRate',
          viewabilityRate: '$viewability.viewabilityRate',
          inViewRate: '$viewability.inViewRate',
          totalBids: '$bidMetrics.totalBids',
          winningBids: '$bidMetrics.winningBids',
          avgBidPrice: '$bidMetrics.avgBidPrice'
        }
      }
    ]);

    return data;
  }

  /**
   * Export trends data
   */
  private async exportTrendsData(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    metrics: string[],
    includeForecast: boolean
  ): Promise<any> {
    const trends: Record<string, any[]> = {};

    for (const metric of metrics) {
      const trendData = await TrendData.findOne({
        publisherId,
        metric,
        'period.start': { $lte: startDate },
        'period.end': { $gte: endDate }
      }).sort({ 'period.end': -1 });

      if (trendData) {
        const historical = trendData.values
          .filter(v => v.date >= startDate && v.date <= endDate)
          .map(v => ({
            date: v.date,
            value: v.value,
            type: 'actual'
          }));

        let forecast: any[] = [];
        if (includeForecast) {
          forecast = trendData.forecast
            .filter(f => f.date >= new Date())
            .map(f => ({
              date: f.date,
              value: f.predicted,
              lower: f.lower,
              upper: f.upper,
              confidence: f.confidence,
              type: 'forecast'
            }));
        }

        trends[metric] = [...historical, ...forecast];
      }
    }

    return {
      metadata: {
        publisherId,
        startDate,
        endDate,
        metrics,
        exportedAt: new Date()
      },
      trends
    };
  }

  /**
   * Export full report
   */
  private async exportFullData(
    publisherId: string,
    startDate: Date,
    endDate: Date,
    metrics: string[]
  ): Promise<any> {
    const [
      revenue,
      performance,
      trends
    ] = await Promise.all([
      this.exportRevenueData(publisherId, startDate, endDate),
      this.exportPerformanceData(publisherId, startDate, endDate),
      this.exportTrendsData(publisherId, startDate, endDate, metrics, true)
    ]);

    // Calculate summary statistics
    const summary = {
      totalRevenue: revenue.reduce((sum, r) => sum + (r.revenue || 0), 0),
      totalImpressions: revenue.reduce((sum, r) => sum + (r.impressions || 0), 0),
      totalClicks: revenue.reduce((sum, r) => sum + (r.clicks || 0), 0),
      avgCtr: revenue.length > 0
        ? revenue.reduce((sum, r) => sum + (r.clicks || 0), 0) / revenue.reduce((sum, r) => sum + (r.impressions || 1), 0) * 100
        : 0,
      avgEcpm: revenue.length > 0
        ? revenue.reduce((sum, r) => sum + (r.revenue || 0), 0) / revenue.reduce((sum, r) => sum + (r.impressions || 1), 0) * 1000
        : 0,
      avgFillRate: revenue.length > 0
        ? revenue.reduce((sum, r) => sum + (r.fillRate || 0), 0) / revenue.length
        : 0
    };

    return {
      metadata: {
        publisherId,
        startDate,
        endDate,
        metrics,
        exportedAt: new Date(),
        periodDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      summary,
      revenue,
      performance,
      trends
    };
  }

  /**
   * Format data for export
   */
  private async formatExport(data: any, format: ExportFormat): Promise<string | Buffer> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.convertToCSV(data);

      case 'xlsx':
        // For xlsx, we would use a library like 'xlsx'
        // For now, return as CSV with .xlsx extension warning
        return this.convertToCSV(data);

      case 'pdf':
        // For PDF, we would use a library like 'pdfkit'
        // For now, return as JSON with .pdf extension warning
        return JSON.stringify(data, null, 2);

      default:
        return JSON.stringify(data);
    }
  }

  /**
   * Convert array of objects to CSV
   */
  private convertToCSV(data: any): string {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];

        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        }

        if (typeof value === 'object') {
          // Handle nested objects - flatten with dot notation
          return JSON.stringify(value);
        }

        // Escape commas and quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Format date for filename
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get file extension for format
   */
  private getExtension(format: ExportFormat): string {
    const extensions: Record<ExportFormat, string> = {
      csv: 'csv',
      json: 'json',
      xlsx: 'xlsx',
      pdf: 'pdf'
    };
    return extensions[format];
  }

  /**
   * Get content type for format
   */
  private getContentType(format: ExportFormat): string {
    const contentTypes: Record<ExportFormat, string> = {
      csv: 'text/csv',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf'
    };
    return contentTypes[format];
  }
}

export const exportService = new ExportService();
export default exportService;