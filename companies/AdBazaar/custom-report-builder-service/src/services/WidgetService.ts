import { Widget, IWidget } from '../models/Widget.js';
import logger from '../utils/logger.js';

export class WidgetService {
  async createWidget(data: Partial<IWidget>): Promise<IWidget> {
    try {
      const widget = new Widget(data);
      await widget.save();
      logger.info(`Created widget: ${widget.name}`);
      return widget;
    } catch (error) {
      logger.error('Error creating widget:', error);
      throw error;
    }
  }

  async getWidgets(organizationId: string, type?: string): Promise<IWidget[]> {
    try {
      const query: any = { organizationId };
      if (type) query.type = type;
      return await Widget.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting widgets:', error);
      throw error;
    }
  }

  async getGlobalWidgets(type?: string): Promise<IWidget[]> {
    try {
      const query: any = { isGlobal: true };
      if (type) query.type = type;
      return await Widget.find(query).sort({ usageCount: -1 });
    } catch (error) {
      logger.error('Error getting global widgets:', error);
      throw error;
    }
  }

  async getWidgetById(widgetId: string, organizationId: string): Promise<IWidget | null> {
    try {
      return await Widget.findOne({ _id: widgetId, organizationId });
    } catch (error) {
      logger.error(`Error getting widget ${widgetId}:`, error);
      throw error;
    }
  }

  async updateWidget(widgetId: string, data: Partial<IWidget>, organizationId: string): Promise<IWidget | null> {
    try {
      const widget = await Widget.findOneAndUpdate(
        { _id: widgetId, organizationId },
        { $set: data },
        { new: true }
      );

      if (widget) {
        logger.info(`Updated widget: ${widget.name}`);
      }
      return widget;
    } catch (error) {
      logger.error(`Error updating widget ${widgetId}:`, error);
      throw error;
    }
  }

  async deleteWidget(widgetId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Widget.deleteOne({ _id: widgetId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting widget ${widgetId}:`, error);
      throw error;
    }
  }

  async incrementUsage(widgetId: string): Promise<void> {
    try {
      await Widget.findByIdAndUpdate(widgetId, { $inc: { usageCount: 1 } });
    } catch (error) {
      logger.error(`Error incrementing widget usage ${widgetId}:`, error);
    }
  }

  async getPopularWidgets(organizationId: string, limit = 10): Promise<IWidget[]> {
    try {
      return await Widget.find({ organizationId })
        .sort({ usageCount: -1 })
        .limit(limit);
    } catch (error) {
      logger.error('Error getting popular widgets:', error);
      throw error;
    }
  }
}

export default new WidgetService();