import { Dashboard, IDashboard, IWidget } from '../models/Dashboard.js';
import { Widget } from '../models/Widget.js';
import { Chart } from '../models/Chart.js';
import { DataSource } from '../models/DataSource.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDashboardOptions {
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  category?: string;
  widgets?: IWidget[];
  layout?: {
    columns: number;
    rowHeight: number;
    gap: number;
  };
  filters?: Array<{
    id: string;
    field: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'range';
    defaultValue?: any;
  }>;
  refreshInterval?: number;
  isPublic?: boolean;
  tags?: string[];
}

export class DashboardService {
  async createDashboard(options: CreateDashboardOptions): Promise<IDashboard> {
    try {
      const dashboard = new Dashboard({
        ...options,
        status: 'draft'
      });

      await dashboard.save();
      logger.info(`Created dashboard: ${dashboard.name}`);
      return dashboard;
    } catch (error) {
      logger.error('Error creating dashboard:', error);
      throw error;
    }
  }

  async getDashboardById(dashboardId: string, organizationId: string): Promise<IDashboard | null> {
    try {
      return await Dashboard.findOne({ _id: dashboardId, organizationId });
    } catch (error) {
      logger.error(`Error getting dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  async updateDashboard(dashboardId: string, data: Partial<IDashboard>, organizationId: string): Promise<IDashboard | null> {
    try {
      const dashboard = await Dashboard.findOneAndUpdate(
        { _id: dashboardId, organizationId },
        { $set: data, $inc: { version: 1 } },
        { new: true }
      );

      if (dashboard) {
        logger.info(`Updated dashboard: ${dashboard.name}`);
      }
      return dashboard;
    } catch (error) {
      logger.error(`Error updating dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  async deleteDashboard(dashboardId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Dashboard.deleteOne({ _id: dashboardId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  async listDashboards(organizationId: string, page = 1, limit = 20, category?: string): Promise<{ dashboards: IDashboard[]; total: number }> {
    try {
      const query: any = { organizationId };
      if (category) query.category = category;

      const skip = (page - 1) * limit;
      const [dashboards, total] = await Promise.all([
        Dashboard.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
        Dashboard.countDocuments(query)
      ]);

      return { dashboards, total };
    } catch (error) {
      logger.error('Error listing dashboards:', error);
      throw error;
    }
  }

  async addWidget(dashboardId: string, widget: IWidget, organizationId: string): Promise<IDashboard | null> {
    try {
      const widgetWithId = {
        ...widget,
        id: widget.id || uuidv4()
      };

      const dashboard = await Dashboard.findOneAndUpdate(
        { _id: dashboardId, organizationId },
        {
          $push: { widgets: widgetWithId },
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (dashboard) {
        logger.info(`Added widget to dashboard: ${dashboard.name}`);
      }
      return dashboard;
    } catch (error) {
      logger.error(`Error adding widget to dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  async removeWidget(dashboardId: string, widgetId: string, organizationId: string): Promise<IDashboard | null> {
    try {
      const dashboard = await Dashboard.findOneAndUpdate(
        { _id: dashboardId, organizationId },
        {
          $pull: { widgets: { id: widgetId } },
          $inc: { version: 1 }
        },
        { new: true }
      );

      if (dashboard) {
        logger.info(`Removed widget ${widgetId} from dashboard: ${dashboard.name}`);
      }
      return dashboard;
    } catch (error) {
      logger.error(`Error removing widget ${widgetId} from dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  async refreshDashboard(dashboardId: string, organizationId: string): Promise<IDashboard | null> {
    try {
      const dashboard = await Dashboard.findOne({ _id: dashboardId, organizationId });
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      const widgetData: any = {};
      for (const widget of dashboard.widgets) {
        widgetData[widget.id] = await this.fetchWidgetData(widget);
      }

      dashboard.lastRefreshed = new Date();
      dashboard.status = 'published';
      await dashboard.save();

      logger.info(`Refreshed dashboard: ${dashboard.name}`);
      return dashboard;
    } catch (error) {
      logger.error(`Error refreshing dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  async getFavorites(organizationId: string): Promise<IDashboard[]> {
    try {
      return await Dashboard.find({ organizationId, isFavorite: true })
        .sort({ updatedAt: -1 })
        .limit(20);
    } catch (error) {
      logger.error('Error getting favorite dashboards:', error);
      throw error;
    }
  }

  async toggleFavorite(dashboardId: string, organizationId: string): Promise<IDashboard | null> {
    try {
      const dashboard = await Dashboard.findOne({ _id: dashboardId, organizationId });
      if (!dashboard) {
        throw new Error('Dashboard not found');
      }

      dashboard.isFavorite = !dashboard.isFavorite;
      await dashboard.save();

      return dashboard;
    } catch (error) {
      logger.error(`Error toggling favorite for dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  private async fetchWidgetData(widget: IWidget): Promise<any> {
    if (widget.type === 'metric' || widget.type === 'kpi') {
      return {
        value: Math.floor(Math.random() * 10000),
        change: (Math.random() - 0.5) * 20,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    }

    if (widget.type === 'chart') {
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue',
          data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 10000)),
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }]
      };
    }

    if (widget.type === 'table') {
      return {
        columns: ['Name', 'Value', 'Status'],
        rows: [
          ['Item 1', 1000, 'Active'],
          ['Item 2', 2000, 'Active'],
          ['Item 3', 1500, 'Inactive']
        ]
      };
    }

    return { message: 'Widget data' };
  }
}

export default new DashboardService();