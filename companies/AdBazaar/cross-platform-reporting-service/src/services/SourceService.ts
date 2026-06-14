import { Source, ISource } from '../models/Source.js';
import logger from '../utils/logger.js';

export class SourceService {
  async createSource(data: Partial<ISource>): Promise<ISource> {
    try {
      const source = new Source(data);
      await source.save();
      logger.info(`Created source: ${source.name}`);
      return source;
    } catch (error) {
      logger.error('Error creating source:', error);
      throw error;
    }
  }

  async getSources(organizationId: string, type?: string): Promise<ISource[]> {
    try {
      const query: any = { organizationId };
      if (type) query.type = type;
      return await Source.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting sources:', error);
      throw error;
    }
  }

  async getSourceById(sourceId: string, organizationId: string): Promise<ISource | null> {
    try {
      return await Source.findOne({ _id: sourceId, organizationId });
    } catch (error) {
      logger.error(`Error getting source ${sourceId}:`, error);
      throw error;
    }
  }

  async updateSource(sourceId: string, data: Partial<ISource>, organizationId: string): Promise<ISource | null> {
    try {
      const source = await Source.findOneAndUpdate(
        { _id: sourceId, organizationId },
        { $set: data },
        { new: true }
      );
      if (source) {
        logger.info(`Updated source: ${source.name}`);
      }
      return source;
    } catch (error) {
      logger.error(`Error updating source ${sourceId}:`, error);
      throw error;
    }
  }

  async deleteSource(sourceId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Source.deleteOne({ _id: sourceId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting source ${sourceId}:`, error);
      throw error;
    }
  }

  async syncSource(sourceId: string, organizationId: string): Promise<any> {
    try {
      const source = await Source.findOne({ _id: sourceId, organizationId });
      if (!source) {
        throw new Error('Source not found');
      }

      source.status = 'active';
      source.lastSync = new Date();
      await source.save();

      const data = await this.fetchDataFromSource(source);

      return {
        sourceId: source._id,
        sourceName: source.name,
        status: 'completed',
        recordsFetched: data.length,
        lastSync: source.lastSync
      };
    } catch (error) {
      logger.error(`Error syncing source ${sourceId}:`, error);
      throw error;
    }
  }

  private async fetchDataFromSource(source: ISource): Promise<any[]> {
    const data: any[] = [];

    switch (source.type) {
      case 'ads':
        data.push(...this.generateMockAdData());
        break;
      case 'dooh':
        data.push(...this.generateMockDOOHData());
        break;
      case 'creators':
        data.push(...this.generateMockCreatorData());
        break;
      case 'campaigns':
        data.push(...this.generateMockCampaignData());
        break;
      default:
        data.push(...this.generateMockData());
    }

    return data;
  }

  private generateMockData(): any[] {
    return Array.from({ length: 100 }, (_, i) => ({
      id: `record_${i}`,
      value: Math.random() * 1000,
      timestamp: new Date()
    }));
  }

  private generateMockAdData(): any[] {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `ad_${i}`,
      campaignId: `campaign_${Math.floor(Math.random() * 10)}`,
      impressions: Math.floor(Math.random() * 100000),
      clicks: Math.floor(Math.random() * 5000),
      conversions: Math.floor(Math.random() * 500),
      spend: Math.random() * 1000,
      timestamp: new Date()
    }));
  }

  private generateMockDOOHData(): any[] {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `dooh_${i}`,
      screenId: `screen_${Math.floor(Math.random() * 100)}`,
      impressions: Math.floor(Math.random() * 500000),
      dwellTime: Math.random() * 30,
      timestamp: new Date()
    }));
  }

  private generateMockCreatorData(): any[] {
    return Array.from({ length: 50 }, (_, i) => ({
      id: `creator_${i}`,
      creatorId: `creator_${Math.floor(Math.random() * 20)}`,
      posts: Math.floor(Math.random() * 50),
      engagement: Math.random() * 10,
      earnings: Math.random() * 5000,
      timestamp: new Date()
    }));
  }

  private generateMockCampaignData(): any[] {
    return Array.from({ length: 30 }, (_, i) => ({
      id: `campaign_${i}`,
      name: `Campaign ${i}`,
      status: ['active', 'paused', 'completed'][Math.floor(Math.random() * 3)],
      budget: Math.random() * 10000,
      spent: Math.random() * 5000,
      timestamp: new Date()
    }));
  }
}

export default new SourceService();