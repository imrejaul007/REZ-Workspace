import { Sync, ISync } from '../models/Sync.js';
import { DataSource } from '../models/DataSource.js';
import logger from '../utils/logger.js';

export class SyncService {
  async getSyncs(organizationId: string, sourceId?: string): Promise<ISync[]> {
    try {
      const query: any = { organizationId };
      if (sourceId) query.sourceId = sourceId;
      return await Sync.find(query).sort({ createdAt: -1 }).limit(100);
    } catch (error) {
      logger.error('Error getting syncs:', error);
      throw error;
    }
  }

  async getSyncById(syncId: string, organizationId: string): Promise<ISync | null> {
    try {
      return await Sync.findOne({ _id: syncId, organizationId });
    } catch (error) {
      logger.error(`Error getting sync ${syncId}:`, error);
      throw error;
    }
  }

  async getSyncStats(organizationId: string, sourceId?: string): Promise<any> {
    try {
      const query: any = { organizationId };
      if (sourceId) query.sourceId = sourceId;

      const [total, completed, failed, running] = await Promise.all([
        Sync.countDocuments(query),
        Sync.countDocuments({ ...query, status: 'completed' }),
        Sync.countDocuments({ ...query, status: 'failed' }),
        Sync.countDocuments({ ...query, status: 'running' })
      ]);

      const recentSyncs = await Sync.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('sourceId type status recordsProcessed createdAt');

      const totalRecords = await Sync.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$recordsProcessed' } } }
      ]);

      return {
        total,
        completed,
        failed,
        running,
        totalRecords: totalRecords[0]?.total || 0,
        recentSyncs
      };
    } catch (error) {
      logger.error('Error getting sync stats:', error);
      throw error;
    }
  }

  async cancelSync(syncId: string, organizationId: string): Promise<boolean> {
    try {
      const sync = await Sync.findOne({ _id: syncId, organizationId });
      if (!sync) {
        throw new Error('Sync not found');
      }

      if (sync.status === 'running') {
        sync.status = 'cancelled';
        sync.completedAt = new Date();
        await sync.save();
        logger.info(`Cancelled sync: ${syncId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error cancelling sync ${syncId}:`, error);
      throw error;
    }
  }

  async getSyncHistory(sourceId: string, days: number = 30): Promise<ISync[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      return await Sync.find({
        sourceId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Error getting sync history for source ${sourceId}:`, error);
      throw error;
    }
  }
}

export default new SyncService();