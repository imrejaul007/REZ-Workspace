import { Layout, ILayout } from '../models/Layout.js';
import logger from '../utils/logger.js';

export class LayoutService {
  async createLayout(data: Partial<ILayout>): Promise<ILayout> {
    try {
      if (data.isDefault) {
        await Layout.updateMany(
          { organizationId: data.organizationId },
          { $set: { isDefault: false } }
        );
      }

      const layout = new Layout(data);
      await layout.save();
      logger.info(`Created layout: ${layout.name}`);
      return layout;
    } catch (error) {
      logger.error('Error creating layout:', error);
      throw error;
    }
  }

  async getLayouts(organizationId: string): Promise<ILayout[]> {
    try {
      return await Layout.find({ organizationId }).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting layouts:', error);
      throw error;
    }
  }

  async getDefaultLayout(organizationId: string): Promise<ILayout | null> {
    try {
      return await Layout.findOne({ organizationId, isDefault: true });
    } catch (error) {
      logger.error('Error getting default layout:', error);
      throw error;
    }
  }

  async getLayoutById(layoutId: string, organizationId: string): Promise<ILayout | null> {
    try {
      return await Layout.findOne({ _id: layoutId, organizationId });
    } catch (error) {
      logger.error(`Error getting layout ${layoutId}:`, error);
      throw error;
    }
  }

  async updateLayout(layoutId: string, data: Partial<ILayout>, organizationId: string): Promise<ILayout | null> {
    try {
      if (data.isDefault) {
        await Layout.updateMany(
          { organizationId, _id: { $ne: layoutId } },
          { $set: { isDefault: false } }
        );
      }

      const layout = await Layout.findOneAndUpdate(
        { _id: layoutId, organizationId },
        { $set: data },
        { new: true }
      );

      if (layout) {
        logger.info(`Updated layout: ${layout.name}`);
      }
      return layout;
    } catch (error) {
      logger.error(`Error updating layout ${layoutId}:`, error);
      throw error;
    }
  }

  async deleteLayout(layoutId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Layout.deleteOne({ _id: layoutId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting layout ${layoutId}:`, error);
      throw error;
    }
  }
}

export default new LayoutService();