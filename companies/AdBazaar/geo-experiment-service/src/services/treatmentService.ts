import { TreatmentMarket, ITreatmentMarket, Market, GeoExperiment } from '../models';
import { SetTreatmentInput } from '../types';
import logger from '../utils/logger';
import { trackDbOperation } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'TreatmentService' });

export const treatmentService = {
  /**
   * Set treatment for a market
   */
  async setTreatment(experimentId: string, input: SetTreatmentInput): Promise<ITreatmentMarket> {
    const startTime = Date.now();

    try {
      // Verify experiment exists and is running
      const experiment = await GeoExperiment.findById(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Verify market exists and belongs to experiment
      const market = await Market.findOne({
        _id: input.marketId,
        experimentId,
        type: 'treatment'
      });
      if (!market) {
        throw new Error('Treatment market not found');
      }

      // Upsert treatment data
      const treatment = await TreatmentMarket.findOneAndUpdate(
        {
          experimentId,
          marketId: input.marketId
        },
        {
          $set: {
            spend: input.spend,
            impressions: input.impressions,
            reach: input.reach,
            frequency: input.frequency,
            startDate: new Date(input.startDate),
            endDate: new Date(input.endDate)
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      trackDbOperation('upsert', 'treatment_markets', (Date.now() - startTime) / 1000);
      moduleLogger.info('Set treatment for market', {
        experimentId,
        marketId: input.marketId,
        spend: input.spend
      });

      return treatment;
    } catch (error) {
      moduleLogger.error('Failed to set treatment', { experimentId, error });
      throw error;
    }
  },

  /**
   * Get treatment by market ID
   */
  async getByMarketId(marketId: string): Promise<ITreatmentMarket | null> {
    const startTime = Date.now();

    try {
      const treatment = await TreatmentMarket.findOne({ marketId }).lean();
      trackDbOperation('findOne', 'treatment_markets', (Date.now() - startTime) / 1000);
      return treatment as ITreatmentMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to get treatment', { marketId, error });
      throw error;
    }
  },

  /**
   * List treatments for an experiment
   */
  async listByExperiment(experimentId: string): Promise<ITreatmentMarket[]> {
    const startTime = Date.now();

    try {
      const treatments = await TreatmentMarket.find({ experimentId })
        .populate('marketId', 'name dmaCode city state')
        .sort({ createdAt: -1 })
        .lean();

      trackDbOperation('find', 'treatment_markets', (Date.now() - startTime) / 1000);
      return treatments as ITreatmentMarket[];
    } catch (error) {
      moduleLogger.error('Failed to list treatments', { experimentId, error });
      throw error;
    }
  },

  /**
   * Update treatment metrics
   */
  async updateMetrics(
    id: string,
    metrics: { impressions?: number; reach?: number; spend?: number }
  ): Promise<ITreatmentMarket | null> {
    const startTime = Date.now();

    try {
      const updateData: any = {};
      if (metrics.impressions !== undefined) updateData.impressions = metrics.impressions;
      if (metrics.reach !== undefined) updateData.reach = metrics.reach;
      if (metrics.spend !== undefined) updateData.spend = metrics.spend;

      const treatment = await TreatmentMarket.findByIdAndUpdate(
        id,
        { $inc: updateData },
        { new: true }
      ).lean();

      trackDbOperation('update', 'treatment_markets', (Date.now() - startTime) / 1000);
      return treatment as ITreatmentMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to update treatment metrics', { id, error });
      throw error;
    }
  },

  /**
   * Get treatment summary for experiment
   */
  async getSummary(experimentId: string): Promise<{
    totalSpend: number;
    totalImpressions: number;
    totalReach: number;
    avgFrequency: number;
    marketCount: number;
  }> {
    const startTime = Date.now();

    try {
      const treatments = await TreatmentMarket.find({ experimentId }).lean();

      const totalSpend = treatments.reduce((sum, t) => sum + (t.spend || 0), 0);
      const totalImpressions = treatments.reduce((sum, t) => sum + (t.impressions || 0), 0);
      const totalReach = treatments.reduce((sum, t) => sum + (t.reach || 0), 0);
      const freqValues = treatments.filter(t => t.frequency).map(t => t.frequency!);
      const avgFrequency = freqValues.length > 0
        ? freqValues.reduce((a, b) => a + b, 0) / freqValues.length
        : 0;

      trackDbOperation('aggregate', 'treatment_markets', (Date.now() - startTime) / 1000);

      return {
        totalSpend,
        totalImpressions,
        totalReach,
        avgFrequency,
        marketCount: treatments.length
      };
    } catch (error) {
      moduleLogger.error('Failed to get treatment summary', { experimentId, error });
      throw error;
    }
  },

  /**
   * Delete treatment
   */
  async delete(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await TreatmentMarket.findByIdAndDelete(id);
      trackDbOperation('delete', 'treatment_markets', (Date.now() - startTime) / 1000);
      return !!result;
    } catch (error) {
      moduleLogger.error('Failed to delete treatment', { id, error });
      throw error;
    }
  },

  /**
   * Delete all treatments for an experiment
   */
  async deleteByExperiment(experimentId: string): Promise<number> {
    const startTime = Date.now();

    try {
      const result = await TreatmentMarket.deleteMany({ experimentId });
      trackDbOperation('deleteMany', 'treatment_markets', (Date.now() - startTime) / 1000);
      return result.deletedCount || 0;
    } catch (error) {
      moduleLogger.error('Failed to delete treatments', { experimentId, error });
      throw error;
    }
  }
};

export default treatmentService;