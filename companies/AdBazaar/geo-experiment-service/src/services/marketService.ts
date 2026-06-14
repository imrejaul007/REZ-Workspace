import { Market, IMarket, GeoExperiment } from '../models';
import { MarketType, AddMarketInput } from '../types';
import logger from '../utils/logger';
import { trackDbOperation, marketsPerExperiment } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'MarketService' });

export const marketService = {
  /**
   * Add a market to an experiment
   */
  async addMarket(experimentId: string, input: AddMarketInput): Promise<IMarket> {
    const startTime = Date.now();

    try {
      // Verify experiment exists
      const experiment = await GeoExperiment.findById(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const market = new Market({
        experimentId,
        name: input.name,
        type: input.type,
        dmaCode: input.dmaCode,
        city: input.city,
        state: input.state,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude,
        radius: input.radius,
        population: input.population,
        expectedReach: input.expectedReach,
        status: 'active',
        metrics: {
          impressions: 0,
          reach: 0,
          conversions: 0,
          revenue: 0
        }
      });

      await market.save();

      // Update metrics
      await this.updateMarketMetrics();

      trackDbOperation('create', 'markets', (Date.now() - startTime) / 1000);
      moduleLogger.info('Added market to experiment', {
        experimentId,
        marketId: market._id,
        name: market.name,
        type: market.type
      });

      return market;
    } catch (error) {
      moduleLogger.error('Failed to add market', { experimentId, error });
      throw error;
    }
  },

  /**
   * Get market by ID
   */
  async getById(id: string): Promise<IMarket | null> {
    const startTime = Date.now();

    try {
      const market = await Market.findById(id).lean();
      trackDbOperation('findById', 'markets', (Date.now() - startTime) / 1000);
      return market as IMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to get market', { id, error });
      throw error;
    }
  },

  /**
   * List markets for an experiment
   */
  async listByExperiment(experimentId: string, type?: MarketType): Promise<IMarket[]> {
    const startTime = Date.now();

    try {
      const filter: any = { experimentId };
      if (type) {
        filter.type = type;
      }

      const markets = await Market.find(filter).sort({ createdAt: -1 }).lean();
      trackDbOperation('find', 'markets', (Date.now() - startTime) / 1000);
      return markets as IMarket[];
    } catch (error) {
      moduleLogger.error('Failed to list markets', { experimentId, error });
      throw error;
    }
  },

  /**
   * Update market metrics
   */
  async updateMetrics(
    id: string,
    metrics: { impressions?: number; reach?: number; conversions?: number; revenue?: number }
  ): Promise<IMarket | null> {
    const startTime = Date.now();

    try {
      const updateData: any = {};
      if (metrics.impressions !== undefined) updateData['metrics.impressions'] = metrics.impressions;
      if (metrics.reach !== undefined) updateData['metrics.reach'] = metrics.reach;
      if (metrics.conversions !== undefined) updateData['metrics.conversions'] = metrics.conversions;
      if (metrics.revenue !== undefined) updateData['metrics.revenue'] = metrics.revenue;

      const market = await Market.findByIdAndUpdate(
        id,
        { $inc: updateData },
        { new: true }
      ).lean();

      trackDbOperation('update', 'markets', (Date.now() - startTime) / 1000);
      return market as IMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to update market metrics', { id, error });
      throw error;
    }
  },

  /**
   * Update market status
   */
  async updateStatus(id: string, status: 'active' | 'paused' | 'completed'): Promise<IMarket | null> {
    const startTime = Date.now();

    try {
      const market = await Market.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      ).lean();

      trackDbOperation('update', 'markets', (Date.now() - startTime) / 1000);
      return market as IMarket | null;
    } catch (error) {
      moduleLogger.error('Failed to update market status', { id, error });
      throw error;
    }
  },

  /**
   * Delete market
   */
  async delete(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const result = await Market.findByIdAndDelete(id);

      if (result) {
        await this.updateMarketMetrics();
      }

      trackDbOperation('delete', 'markets', (Date.now() - startTime) / 1000);
      return !!result;
    } catch (error) {
      moduleLogger.error('Failed to delete market', { id, error });
      throw error;
    }
  },

  /**
   * Get market by DMA code
   */
  async getByDmaCode(dmaCode: string): Promise<IMarket[]> {
    const startTime = Date.now();

    try {
      const markets = await Market.find({ dmaCode }).lean();
      trackDbOperation('find', 'markets', (Date.now() - startTime) / 1000);
      return markets as IMarket[];
    } catch (error) {
      moduleLogger.error('Failed to get market by DMA', { dmaCode, error });
      throw error;
    }
  },

  /**
   * Find markets by location
   */
  async findByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<IMarket[]> {
    const startTime = Date.now();

    try {
      // Simple bounding box filter (not true geo filtering, but fast)
      const latDelta = radiusKm / 111; // ~111km per degree latitude
      const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      const markets = await Market.find({
        latitude: { $gte: latitude - latDelta, $lte: latitude + latDelta },
        longitude: { $gte: longitude - lonDelta, $lte: longitude + lonDelta }
      }).lean();

      trackDbOperation('find', 'markets', (Date.now() - startTime) / 1000);
      return markets as IMarket[];
    } catch (error) {
      moduleLogger.error('Failed to find markets by location', { latitude, longitude, error });
      throw error;
    }
  },

  /**
   * Update global market metrics (for Prometheus)
   */
  async updateMarketMetrics(): Promise<void> {
    try {
      const [treatmentCount, controlCount] = await Promise.all([
        Market.countDocuments({ type: MarketType.TREATMENT }),
        Market.countDocuments({ type: MarketType.CONTROL })
      ]);

      marketsPerExperiment.set({ type: 'treatment' }, treatmentCount);
      marketsPerExperiment.set({ type: 'control' }, controlCount);
    } catch (error) {
      moduleLogger.error('Failed to update market metrics', { error });
    }
  },

  /**
   * Get market statistics
   */
  async getStats(experimentId: string): Promise<{
    total: number;
    treatment: number;
    control: number;
    active: number;
    paused: number;
    completed: number;
  }> {
    const startTime = Date.now();

    try {
      const [total, treatment, control, active, paused, completed] = await Promise.all([
        Market.countDocuments({ experimentId }),
        Market.countDocuments({ experimentId, type: MarketType.TREATMENT }),
        Market.countDocuments({ experimentId, type: MarketType.CONTROL }),
        Market.countDocuments({ experimentId, status: 'active' }),
        Market.countDocuments({ experimentId, status: 'paused' }),
        Market.countDocuments({ experimentId, status: 'completed' })
      ]);

      trackDbOperation('count', 'markets', (Date.now() - startTime) / 1000);

      return { total, treatment, control, active, paused, completed };
    } catch (error) {
      moduleLogger.error('Failed to get market stats', { experimentId, error });
      throw error;
    }
  }
};

export default marketService;