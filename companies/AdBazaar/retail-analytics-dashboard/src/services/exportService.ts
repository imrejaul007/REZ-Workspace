import { SalesLiftMetric, PerformanceMetric, TrendAnalysis, AttributionData } from '../models';
import { logger } from '../utils/logger';
import { exportRequestsCounter } from '../utils/metrics';
import { config } from '../config';

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

export interface ExportOptions {
  type: 'sales_lift' | 'performance' | 'trends' | 'attribution' | 'full';
  format: ExportFormat;
  retailerId?: string;
  campaignId?: string;
  dateRange?: { start: Date; end: Date };
  includeRaw?: boolean;
  includeSummary?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: unknown;
  fileName?: string;
  contentType?: string;
  recordCount: number;
  error?: string;
}

export class ExportService {
  private logger = logger.child({ service: 'ExportService' });

  async export(options: ExportOptions): Promise<ExportResult> {
    exportRequestsCounter.inc({ format: options.format });

    try {
      this.logger.info('Starting export', {
        type: options.type,
        format: options.format,
        retailerId: options.retailerId,
      });

      let data: unknown[];
      let recordCount = 0;

      switch (options.type) {
        case 'sales_lift':
          data = await this.exportSalesLift(options);
          break;
        case 'performance':
          data = await this.exportPerformance(options);
          break;
        case 'trends':
          data = await this.exportTrends(options);
          break;
        case 'attribution':
          data = await this.exportAttribution(options);
          break;
        case 'full':
          data = await this.exportFull(options);
          break;
        default:
          throw new Error(`Unknown export type: ${options.type}`);
      }

      recordCount = data.length;

      if (recordCount > config.dashboard.maxExportRows) {
        this.logger.warn('Export limit exceeded', {
          requested: recordCount,
          max: config.dashboard.maxExportRows,
        });
        return {
          success: false,
          recordCount,
          error: `Export limit exceeded. Maximum ${config.dashboard.maxExportRows} records allowed.`,
        };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `retail-analytics-${options.type}-${timestamp}`;

      let exportData: unknown;
      let contentType: string;

      switch (options.format) {
        case 'csv':
          exportData = this.convertToCSV(data);
          contentType = 'text/csv';
          break;
        case 'json':
          exportData = JSON.stringify(data, null, 2);
          contentType = 'application/json';
          break;
        case 'xlsx':
          exportData = this.convertToXLSX(data);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'pdf':
          exportData = this.convertToPDF(data, options.type);
          contentType = 'application/pdf';
          break;
        default:
          exportData = JSON.stringify(data);
          contentType = 'application/json';
      }

      this.logger.info('Export completed', {
        type: options.type,
        format: options.format,
        recordCount,
      });

      return {
        success: true,
        data: exportData,
        fileName: `${fileName}.${options.format}`,
        contentType,
        recordCount,
      };
    } catch (error) {
      this.logger.error('Export failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
      });

      return {
        success: false,
        recordCount: 0,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  private async exportSalesLift(options: ExportOptions): Promise<SalesLiftMetric[]> {
    const query: Record<string, unknown> = {};
    if (options.retailerId) query.retailerId = options.retailerId;
    if (options.campaignId) query.campaignId = options.campaignId;
    if (options.dateRange) {
      query.date = { $gte: options.dateRange.start, $lte: options.dateRange.end };
    }

    return SalesLiftMetric.find(query).sort({ date: -1 }).limit(config.dashboard.maxExportRows);
  }

  private async exportPerformance(options: ExportOptions): Promise<PerformanceMetric[]> {
    const query: Record<string, unknown> = {};
    if (options.retailerId) query.retailerId = options.retailerId;
    if (options.campaignId) query.campaignId = options.campaignId;
    if (options.dateRange) {
      query.date = { $gte: options.dateRange.start, $lte: options.dateRange.end };
    }

    return PerformanceMetric.find(query).sort({ date: -1 }).limit(config.dashboard.maxExportRows);
  }

  private async exportTrends(options: ExportOptions): Promise<TrendAnalysis[]> {
    const query: Record<string, unknown> = {};
    if (options.retailerId) query.retailerId = options.retailerId;
    if (options.dateRange) {
      query.updatedAt = { $gte: options.dateRange.start, $lte: options.dateRange.end };
    }

    return TrendAnalysis.find(query).limit(config.dashboard.maxExportRows);
  }

  private async exportAttribution(options: ExportOptions): Promise<AttributionData[]> {
    const query: Record<string, unknown> = {};
    if (options.retailerId) query.retailerId = options.retailerId;
    if (options.campaignId) query.campaignId = options.campaignId;
    if (options.dateRange) {
      query.date = { $gte: options.dateRange.start, $lte: options.dateRange.end };
    }

    return AttributionData.find(query).sort({ date: -1 }).limit(config.dashboard.maxExportRows);
  }

  private async exportFull(options: ExportOptions): Promise<unknown[]> {
    const [salesLift, performance] = await Promise.all([
      this.exportSalesLift(options),
      this.exportPerformance(options),
    ]);

    return [
      { section: 'sales_lift', data: salesLift },
      { section: 'performance', data: performance },
    ];
  }

  private convertToCSV(data: unknown[]): string {
    if (data.length === 0) return '';

    const firstItem = Array.isArray(data) ? data[0] : data;
    if (typeof firstItem !== 'object' || firstItem === null) {
      return '';
    }

    const headers = Object.keys(firstItem as Record<string, unknown>);
    const rows = data.map((item) => {
      if (typeof item !== 'object' || item === null) return '';
      return headers
        .map((header) => {
          const value = (item as Record<string, unknown>)[header];
          const stringValue = value === null || value === undefined ? '' : String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private convertToXLSX(data: unknown[]): Buffer {
    const csv = this.convertToCSV(data);
    return Buffer.from(csv, 'utf-8');
  }

  private convertToPDF(data: unknown[], type: string): Buffer {
    const content = `Retail Analytics Export - ${type.toUpperCase()}\nGenerated: ${new Date().toISOString()}\nTotal Records: ${data.length}\n\n${JSON.stringify(data, null, 2)}`;
    return Buffer.from(content, 'utf-8');
  }
}

export const exportService = new ExportService();