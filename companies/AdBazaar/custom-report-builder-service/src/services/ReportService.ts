import { Report, IReport, IWidget } from '../models/Report.js';
import { Widget } from '../models/Widget.js';
import { Layout } from '../models/Layout.js';
import { DataSource } from '../models/DataSource.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReportOptions {
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  widgets?: IWidget[];
  layout?: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
  dataSources?: Array<{
    id: string;
    name: string;
    type: string;
    connection: Record<string, any>;
  }>;
  filters?: Array<{
    id: string;
    field: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'range';
    defaultValue?: any;
  }>;
  refreshInterval?: number;
  isPublic?: boolean;
}

export class ReportService {
  async createReport(options: CreateReportOptions): Promise<IReport> {
    try {
      const report = new Report({
        ...options,
        status: 'draft'
      });

      await report.save();
      logger.info(`Created report: ${report.name}`);
      return report;
    } catch (error) {
      logger.error('Error creating report:', error);
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

  async updateReport(reportId: string, data: Partial<IReport>, organizationId: string): Promise<IReport | null> {
    try {
      const report = await Report.findOneAndUpdate(
        { _id: reportId, organizationId },
        { $set: data, $inc: { version: 1 } },
        { new: true }
      );

      if (report) {
        logger.info(`Updated report: ${report.name}`);
      }
      return report;
    } catch (error) {
      logger.error(`Error updating report ${reportId}:`, error);
      throw error;
    }
  }

  async deleteReport(reportId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Report.deleteOne({ _id: reportId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting report ${reportId}:`, error);
      throw error;
    }
  }

  async listReports(organizationId: string, page = 1, limit = 20, status?: string): Promise<{ reports: IReport[]; total: number }> {
    try {
      const query: any = { organizationId };
      if (status) query.status = status;

      const skip = (page - 1) * limit;
      const [reports, total] = await Promise.all([
        Report.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
        Report.countDocuments(query)
      ]);

      return { reports, total };
    } catch (error) {
      logger.error('Error listing reports:', error);
      throw error;
    }
  }

  async addWidget(reportId: string, widget: IWidget, organizationId: string): Promise<IReport | null> {
    try {
      const widgetWithId = {
        ...widget,
        id: widget.id || uuidv4()
      };

      const report = await Report.findOneAndUpdate(
        { _id: reportId, organizationId },
        {
          $push: { widgets: widgetWithId },
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (report) {
        logger.info(`Added widget to report: ${report.name}`);
      }
      return report;
    } catch (error) {
      logger.error(`Error adding widget to report ${reportId}:`, error);
      throw error;
    }
  }

  async updateWidget(reportId: string, widgetId: string, widget: Partial<IWidget>, organizationId: string): Promise<IReport | null> {
    try {
      const report = await Report.findOneAndUpdate(
        { _id: reportId, organizationId, 'widgets.id': widgetId },
        {
          $set: { 'widgets.$': { ...widget, id: widgetId } },
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (report) {
        logger.info(`Updated widget ${widgetId} in report: ${report.name}`);
      }
      return report;
    } catch (error) {
      logger.error(`Error updating widget ${widgetId} in report ${reportId}:`, error);
      throw error;
    }
  }

  async removeWidget(reportId: string, widgetId: string, organizationId: string): Promise<IReport | null> {
    try {
      const report = await Report.findOneAndUpdate(
        { _id: reportId, organizationId },
        {
          $pull: { widgets: { id: widgetId } },
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (report) {
        logger.info(`Removed widget ${widgetId} from report: ${report.name}`);
      }
      return report;
    } catch (error) {
      logger.error(`Error removing widget ${widgetId} from report ${reportId}:`, error);
      throw error;
    }
  }

  async previewReport(reportId: string, organizationId: string): Promise<any> {
    try {
      const report = await Report.findOne({ _id: reportId, organizationId });
      if (!report) {
        throw new Error('Report not found');
      }

      const widgetData = await Promise.all(
        report.widgets.map(async (widget) => {
          const data = await this.fetchWidgetData(widget, report.dataSources);
          return {
            widgetId: widget.id,
            title: widget.title,
            type: widget.type,
            data
          };
        })
      );

      return {
        reportId: report._id,
        name: report.name,
        widgets: widgetData,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error previewing report ${reportId}:`, error);
      throw error;
    }
  }

  async runReport(reportId: string, organizationId: string): Promise<IReport | null> {
    try {
      const report = await Report.findOne({ _id: reportId, organizationId });
      if (!report) {
        throw new Error('Report not found');
      }

      const data: Record<string, any> = {};

      for (const ds of report.dataSources) {
        data[ds.id] = await this.fetchDataSourceData(ds);
      }

      report.lastRun = new Date();
      report.lastData = data;
      report.status = 'published';
      await report.save();

      logger.info(`Ran report: ${report.name}`);
      return report;
    } catch (error) {
      logger.error(`Error running report ${reportId}:`, error);
      throw error;
    }
  }

  private async fetchWidgetData(widget: IWidget, dataSources: any[]): Promise<any> {
    const dataSource = dataSources.find(ds => ds.id === widget.dataSourceId);

    if (!dataSource) {
      return this.generateMockData(widget.type);
    }

    return this.fetchDataSourceData(dataSource);
  }

  private async fetchDataSourceData(dataSource: any): Promise<any> {
    switch (dataSource.type) {
      case 'mongodb':
        return this.generateMockData('table');
      case 'postgresql':
        return this.generateMockData('table');
      case 'api':
        return this.generateMockData('chart');
      default:
        return this.generateMockData('metric');
    }
  }

  private generateMockData(type: string): any {
    switch (type) {
      case 'chart':
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Revenue',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: 'rgba(54, 162, 235, 0.5)'
          }]
        };
      case 'table':
        return {
          columns: ['Name', 'Value', 'Change'],
          rows: [
            ['Item 1', 1000, '+5%'],
            ['Item 2', 2000, '-3%'],
            ['Item 3', 1500, '+12%']
          ]
        };
      case 'metric':
        return {
          value: 12345,
          previousValue: 11000,
          change: 12.2,
          unit: '$'
        };
      default:
        return { message: 'No data available' };
    }
  }
}

export default new ReportService();