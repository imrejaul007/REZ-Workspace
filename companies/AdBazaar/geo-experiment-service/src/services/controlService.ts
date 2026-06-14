import { ControlMarket, IControlMarket, Market, GeoExperiment } from '../models';
import { SetControlInput } from '../types';
import logger from '../utils/logger';
import { trackDbOperation } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'ControlService' });

export const controlService = {
  /**
   * Set control baseline for a market
   */
  async setControl(experimentId: string, input: SetControlInput): Promise<IControlMarket> {
    const startTime = Date.now();

    try {
      // Verify experiment exists
      const experiment = await GeoExperiment.findById(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Verify market exists and belongs to experiment
      const market = await Market.findOne({
        _id: input.marketId,
        experimentId,
        type: 'control'
      });
      if (!market) {
        throw new Error('Control market not found');
      }

      // Upsert control data
      const control = await ControlMarket.findOneAndUpdate(
        {
          experimentId,
          marketId: input.marketId
        },
        {
          $set: {
            baseline: input.baseline,
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

      trackDbOperation('upsert', 'control_markets', (Date.now() - startTime) / 1000);
      moduleLogger.info('Set control for market', {
        experimentId,
        marketId: input.marketId,
        baseline: input.baseline
      });

      return control;
    } catch (error) {
      moduleLogger.error('Failed to set control', { experimentId, error });
      throw error;
    }
  },

  /**
   * Get control by market ID
   */
  async getByMarketId(marketId: string): Promise<IControlMarket | null> {
    const startTime = Date.now();

    try {
      const control = await ControlMarket.findOne({ marketId }).lean();
      trackDbOperation('findOne', 'control_markets', (Date.now() - startTime) / 1000);
      return control as IControlMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to get control', { marketId, error });
      throw error;
    }
  },

  /**
   * List controls for an experiment
   */
  async listByExperiment(experimentId: string): Promise<IControlMarket[]> {
    const startTime = Date.now();

    try {
      const controls = await ControlMarket.find({ experimentId })
        .populate('marketId', 'name dmaCode city state')
        .sort({ createdAt: -1 })
        .lean();

      trackDbOperation('find', 'control_markets', (Date.now() - startTime) / 1000);
      return controls as IControlMarket[];
    } catch (error) {
      moduleLogger.error('Failed to list controls', { experimentId, error });
      throw error;
    }
  },

  /**
   * Update control baseline
   */
  async updateBaseline(
    id: string,
    baseline: { impressions?: number; reach?: number; conversions?: number; revenue?: number }
  ): Promise<IControlMarket | null> {
    const startTime = Date.now();

    try {
      const updateData: any = {};
      if (baseline.impressions !== undefined) updateData['baseline.impressions'] = baseline.impressions;
      if (baseline.reach !== undefined) updateData['baseline.reach'] = baseline.reach;
      if (baseline.conversions !== undefined) updateData['baseline.conversions'] = baseline.conversions;
      if (baseline.revenue !== undefined) updateData['baseline.revenue'] = baseline.revenue;

      const control = await ControlMarket.findByIdAndUpdate(
        id,
        { $inc: updateData },
        { new: true }
      ).lean();

      trackDbOperation('update', 'control_markets', (Date.now() - startTime) / 1000);
      return control as IControlMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to update control baseline', { id, error });
      throw error;
    }
  },

  /**
   * Get control summary for experiment
   */
  async getSummary(experimentId: string): Promise<{
    totalImpressions: number;
    totalReach: number;
    totalConversions: number;
    totalRevenue: number;
    marketCount: number;
  }> {
    const startTime = Date.now();

    try {
      const controls = await ControlMarket.find({ experimentId }).lean();

      const totalImpressions = controls.reduce((sum, c) => sum + c.baseline.impressions, 0);
      const totalReach = controls.reduce((sum, c) => sum + c.baseline.reach, 0);
      const totalConversions = controls.reduce((sum, c) => sum + c.baseline.conversions, 0);
      const totalRevenue = controls.reduce((sum, c) => sum + c.baseline.revenue, 0);

      trackDbOperation('aggregate', 'control_markets', (Date.now() - startTime) / 1000);

      return {
        totalImpressions,
        totalReach,
        totalConversions,
        totalRevenue,
        marketCount: controls.length
      };
    } catch (error) {
      moduleLogger.error('Failed to get control summary', { experimentId, error });
      throw error;
    }
  },

  /**
   * Delete control
   */
  async delete(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await ControlMarket.findByIdAndDelete(id);
      trackDbOperation('delete', 'control_markets', (Date.now() - startTime) / 1000);
      return !!result;
    } catch (error) {
      moduleLogger.error('Failed to delete control', { id, error });
      throw error;
    }
  },

  /**
   * Delete all controls for an experiment
   */
  async deleteByExperiment(experimentId: string): Promise<number> {
    const startTime = Date.now();

    try {
      const result = await ControlMarket.deleteMany({ experimentId });
      trackDbOperation('deleteMany', 'control_markets', (Date.now() - startTime) / 1000);
      return result.deletedCount || 0;
    } catch (error) {
      moduleLogger.error('Failed to delete controls', { experimentId, error });
      throw error;
    }
  }
};

export default controlService;