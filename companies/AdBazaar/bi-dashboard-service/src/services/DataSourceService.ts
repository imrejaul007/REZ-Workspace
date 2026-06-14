import { DataSource, IDataSource } from '../models/DataSource.js';
import logger from '../utils/logger.js';

export class DataSourceService {
  async createDataSource(data: Partial<IDataSource>): Promise<IDataSource> {
    try {
      const dataSource = new DataSource(data);
      await dataSource.save();
      logger.info(`Created data source: ${dataSource.name}`);
      return dataSource;
    } catch (error) {
      logger.error('Error creating data source:', error);
      throw error;
    }
  }

  async getDataSources(organizationId: string, type?: string): Promise<IDataSource[]> {
    try {
      const query: any = { organizationId, isActive: true };
      if (type) query.type = type;
      return await DataSource.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting data sources:', error);
      throw error;
    }
  }

  async getGlobalDataSources(type?: string): Promise<IDataSource[]> {
    try {
      const query: any = { isGlobal: true, isActive: true };
      if (type) query.type = type;
      return await DataSource.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting global data sources:', error);
      throw error;
    }
  }

  async getDataSourceById(dataSourceId: string, organizationId: string): Promise<IDataSource | null> {
    try {
      return await DataSource.findOne({ _id: dataSourceId, organizationId });
    } catch (error) {
      logger.error(`Error getting data source ${dataSourceId}:`, error);
      throw error;
    }
  }

  async updateDataSource(dataSourceId: string, data: Partial<IDataSource>, organizationId: string): Promise<IDataSource | null> {
    try {
      const dataSource = await DataSource.findOneAndUpdate(
        { _id: dataSourceId, organizationId },
        { $set: data },
        { new: true }
      );

      if (dataSource) {
        logger.info(`Updated data source: ${dataSource.name}`);
      }
      return dataSource;
    } catch (error) {
      logger.error(`Error updating data source ${dataSourceId}:`, error);
      throw error;
    }
  }

  async deleteDataSource(dataSourceId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await DataSource.deleteOne({ _id: dataSourceId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting data source ${dataSourceId}:`, error);
      throw error;
    }
  }

  async testConnection(dataSourceId: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const dataSource = await DataSource.findOne({ _id: dataSourceId, organizationId });
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      dataSource.lastTested = new Date();
      const success = Math.random() > 0.2;

      if (!success) {
        dataSource.lastError = 'Connection timeout';
        await dataSource.save();
        return { success: false, message: 'Connection timeout' };
      }

      dataSource.lastError = undefined;
      await dataSource.save();

      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      logger.error(`Error testing connection for ${dataSourceId}:`, error);
      return { success: false, message: error.message };
    }
  }

  async fetchData(dataSourceId: string, query?: string, organizationId?: string): Promise<any> {
    try {
      const dataSource = await DataSource.findById(dataSourceId);
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      return this.generateMockData(dataSource.type);
    } catch (error) {
      logger.error(`Error fetching data for ${dataSourceId}:`, error);
      throw error;
    }
  }

  private generateMockData(type: string): any {
    switch (type) {
      case 'google_analytics':
        return Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          sessions: Math.floor(Math.random() * 10000),
          users: Math.floor(Math.random() * 8000),
          pageviews: Math.floor(Math.random() * 50000)
        }));
      case 'facebook_ads':
        return Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          impressions: Math.floor(Math.random() * 1000000),
          clicks: Math.floor(Math.random() * 50000),
          spend: Math.random() * 5000
        }));
      default:
        return Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 10000)
        }));
    }
  }
}

export default new DataSourceService();