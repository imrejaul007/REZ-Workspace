import { Report, IReport } from '../models/Report.js';
import { Source } from '../models/Source.js';
import { Metric } from '../models/Metric.js';
import { Schedule } from '../models/Schedule.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface ReportFilters {
  sources?: string[];
  metrics?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  [key: string]: any;
}

export interface GenerateReportOptions {
  name: string;
  description?: string;
  reportType: 'overview' | 'detailed' | 'summary' | 'custom';
  sources: string[];
  metrics: string[];
  filters?: ReportFilters;
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv' | 'pdf' | 'excel';
  organizationId: string;
  createdBy: string;
}

export class ReportService {
  async getOverview(organizationId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const sources = await Source.find({ organizationId, status: 'active' });
      const metrics = await Metric.find({ organizationId, isActive: true });

      const overview = {
        totalSources: sources.length,
        totalMetrics: metrics.length,
        sourcesByType: this.groupBy(sources, 'type'),
        metricsByCategory: this.groupBy(metrics, 'category'),
        recentReports: await Report.find({ organizationId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('name reportType status createdAt'),
        scheduledReports: await Schedule.countDocuments({ organizationId, isActive: true })
      };

      return overview;
    } catch (error) {
      logger.error('Error getting overview:', error);
      throw error;
    }
  }

  async getReportBySource(source: string, organizationId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    try {
      const sourceData = await Source.findOne({ name: source, organizationId });
      if (!sourceData) {
        throw new Error(`Source not found: ${source}`);
      }

      const reports = await Report.find({
        organizationId,
        sources: source
      }).sort({ createdAt: -1 });

      const data = await this.fetchSourceData(sourceData, dateRange);

      return {
        source: sourceData,
        reports,
        data,
        summary: this.calculateSummary(data, sourceData.type)
      };
    } catch (error) {
      logger.error(`Error getting report for source ${source}:`, error);
      throw error;
    }
  }

  async generateReport(options: GenerateReportOptions): Promise<IReport> {
    try {
      const report = new Report({
        name: options.name,
        description: options.description,
        reportType: options.reportType,
        sources: options.sources,
        metrics: options.metrics,
        filters: options.filters,
        dateRange: options.dateRange,
        format: options.format,
        organizationId: options.organizationId,
        createdBy: options.createdBy,
        status: 'generating'
      });

      await report.save();

      try {
        const data = await this.fetchAndAggregateData(options);

        report.data = data;
        report.status = 'completed';
        report.lastGenerated = new Date();
      } catch (dataError) {
        logger.error('Error generating report data:', dataError);
        report.status = 'failed';
      }

      await report.save();
      return report;
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  async getReportById(reportId: string, organizationId: string): Promise<IReport | null> {
    try {
      return await Report.findOne({ _id: reportId, organizationId });
    } catch (error) {
      logger.error(`Error getting report ${reportId}:`, error);
      throw error;
    }
  }

  async exportReport(reportId: string, format: 'json' | 'csv' | 'pdf' | 'excel', organizationId: string): Promise<any> {
    try {
      const report = await Report.findOne({ _id: reportId, organizationId });
      if (!report) {
        throw new Error('Report not found');
      }

      if (report.status !== 'completed') {
        throw new Error('Report is not ready for export');
      }

      switch (format) {
        case 'csv':
          return this.convertToCSV(report.data);
        case 'json':
          return report.data;
        case 'pdf':
        case 'excel':
          return {
            reportId: report._id,
            name: report.name,
            data: report.data,
            format
          };
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error(`Error exporting report ${reportId}:`, error);
      throw error;
    }
  }

  async listReports(organizationId: string, page = 1, limit = 20): Promise<{ reports: IReport[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [reports, total] = await Promise.all([
        Report.find({ organizationId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Report.countDocuments({ organizationId })
      ]);

      return { reports, total };
    } catch (error) {
      logger.error('Error listing reports:', error);
      throw error;
    }
  }

  private async fetchSourceData(source: any, dateRange?: { start: Date; end: Date }): Promise<any> {
    const data: any = {
      records: [],
      metadata: {
        sourceType: source.type,
        lastSync: source.lastSync,
        recordCount: 0
      }
    };

    switch (source.type) {
      case 'ads':
        data.records = this.generateMockAdData(dateRange);
        break;
      case 'dooh':
        data.records = this.generateMockDOOHData(dateRange);
        break;
      case 'creators':
        data.records = this.generateMockCreatorData(dateRange);
        break;
      default:
        data.records = this.generateMockData(dateRange);
    }

    data.metadata.recordCount = data.records.length;
    return data;
  }

  private async fetchAndAggregateData(options: GenerateReportOptions): Promise<any> {
    const allData: any[] = [];

    for (const sourceName of options.sources) {
      const source = await Source.findOne({ name: sourceName, organizationId: options.organizationId });
      if (source) {
        const sourceData = await this.fetchSourceData(source, options.dateRange);
        allData.push(...sourceData.records);
      }
    }

    const aggregated = this.aggregateData(allData, options.metrics);

    return {
      metadata: {
        reportType: options.reportType,
        dateRange: options.dateRange,
        sources: options.sources,
        metrics: options.metrics,
        totalRecords: allData.length
      },
      data: aggregated
    };
  }

  private aggregateData(data: any[], metrics: string[]): any {
    if (!data.length) return { total: {}, byPeriod: [] };

    const byPeriod = this.groupBy(data, 'period');
    const total: any = {};

    for (const metric of metrics) {
      const values = data.map((d: any) => d[metric] || 0);
      total[metric] = {
        sum: values.reduce((a: number, b: number) => a + b, 0),
        avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    return { total, byPeriod };
  }

  private calculateSummary(data: any, sourceType: string): any {
    const records = data.records || [];
    const summary: any = {
      totalRecords: records.length,
      dateRange: data.metadata?.dateRange
    };

    if (sourceType === 'ads') {
      summary.impressions = records.reduce((sum: number, r: any) => sum + (r.impressions || 0), 0);
      summary.clicks = records.reduce((sum: number, r: any) => sum + (r.clicks || 0), 0);
      summary.conversions = records.reduce((sum: number, r: any) => sum + (r.conversions || 0), 0);
      summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0;
      summary.cvr = summary.clicks > 0 ? (summary.conversions / summary.clicks) * 100 : 0;
    }

    return summary;
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((acc: Record<string, number>, item: any) => {
      const value = item[key] || 'unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private convertToCSV(data: any): string {
    if (!data || !data.data) return '';

    const { total, byPeriod } = data.data;
    const headers = Object.keys(total);
    const rows = Object.entries(byPeriod).map(([period, records]: [string, any]) => {
      return [period, ...headers.map(h => records[h] || 0)].join(',');
    });

    return ['date', ...headers].join(',') + '\n' + rows.join('\n');
  }

  private generateMockData(dateRange?: { start: Date; end: Date }): any[] {
    const records = [];
    const days = dateRange ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 30;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      records.push({
        period: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 10000),
        metric1: Math.floor(Math.random() * 1000),
        metric2: Math.random() * 100
      });
    }

    return records;
  }

  private generateMockAdData(dateRange?: { start: Date; end: Date }): any[] {
    const records = [];
    const days = dateRange ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 30;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      records.push({
        period: date.toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 100000),
        clicks: Math.floor(Math.random() * 5000),
        conversions: Math.floor(Math.random() * 500),
        spend: Math.random() * 1000,
        revenue: Math.random() * 5000
      });
    }

    return records;
  }

  private generateMockDOOHData(dateRange?: { start: Date; end: Date }): any[] {
    const records = [];
    const days = dateRange ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 30;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      records.push({
        period: date.toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 500000),
        dwellTime: Math.random() * 30,
        reach: Math.floor(Math.random() * 100000),
        screens: Math.floor(Math.random() * 1000)
      });
    }

    return records;
  }

  private generateMockCreatorData(dateRange?: { start: Date; end: Date }): any[] {
    const records = [];
    const days = dateRange ? Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 30;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      records.push({
        period: date.toISOString().split('T')[0],
        posts: Math.floor(Math.random() * 50),
        followers: Math.floor(Math.random() * 10000),
        engagement: Math.random() * 10,
        earnings: Math.random() * 5000
      });
    }

    return records;
  }
}

export default new ReportService();