import { v4 as uuidv4 } from 'uuid';
import {
  GeoExperiment,
  IGeoExperiment,
  Market,
  IMarket,
  GeoResult,
  IGeoResult
} from '../models';
import { ExperimentStatus, MarketType } from '../types';
import { CreateExperimentInput, UpdateExperimentInput, ListExperimentsQuery } from '../types';
import logger from '../utils/logger';
import { activeExperiments, marketsPerExperiment, trackDbOperation } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'ExperimentService' });

export const experimentService = {
  /**
   * Create a new geo experiment
   */
  async create(input: CreateExperimentInput): Promise<IGeoExperiment> {
    const startTime = Date.now();

    try {
      const experiment = new GeoExperiment({
        name: input.name,
        description: input.description,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        confidenceLevel: input.confidenceLevel ?? 0.95,
        minMarketDurationDays: input.minMarketDurationDays ?? 7,
        minControlSizePercent: input.minControlSizePercent ?? 5,
        campaignId: input.campaignId,
        targeting: input.targeting,
        metrics: input.metrics ?? ['impressions', 'conversions'],
        hypothesis: input.hypothesis,
        metadata: input.metadata,
        status: ExperimentStatus.DRAFT
      });

      await experiment.save();

      trackDbOperation('create', 'geo_experiments', (Date.now() - startTime) / 1000);
      moduleLogger.info('Created geo experiment', { experimentId: experiment._id, name: experiment.name });

      return experiment;
    } catch (error) {
      moduleLogger.error('Failed to create experiment', { error });
      throw error;
    }
  },

  /**
   * Get experiment by ID
   */
  async getById(id: string): Promise<IGeoExperiment | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findById(id).lean();
      trackDbOperation('findById', 'geo_experiments', (Date.now() - startTime) / 1000);
      return experiment as IGeoExperiment | null;
    } catch (error) {
      moduleLogger.error('Failed to get experiment', { id, error });
      throw error;
    }
  },

  /**
   * List experiments with pagination and filtering
   */
  async list(query: ListExperimentsQuery): Promise<{
    experiments: IGeoExperiment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const startTime = Date.now();

    try {
      const filter: any = {};
      if (query.status) {
        filter.status = query.status;
      }

      const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
      const sortField = query.sortBy === 'name' ? 'name' :
 query.sortBy === 'startDate' ? 'startDate' :
                       query.sortBy === 'status' ? 'status' : 'createdAt';

      const [experiments, total] = await Promise.all([
        GeoExperiment.find(filter)
          .sort({ [sortField]: sortDirection })
          .skip((query.page - 1) * query.limit)
          .limit(query.limit)
          .lean(),
        GeoExperiment.countDocuments(filter)
      ]);

      trackDbOperation('find', 'geo_experiments', (Date.now() - startTime) / 1000);

      return {
        experiments: experiments as IGeoExperiment[],
        total,
        page: query.page,
        limit: query.limit
      };
    } catch (error) {
      moduleLogger.error('Failed to list experiments', { error });
      throw error;
    }
  },

  /**
   * Update experiment
   */
  async update(id: string, input: UpdateExperimentInput): Promise<IGeoExperiment | null> {
    const startTime = Date.now();

    try {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
      if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
      if (input.status !== undefined) updateData.status = input.status;
      if (input.hypothesis !== undefined) updateData.hypothesis = input.hypothesis;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;

      const experiment = await GeoExperiment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      trackDbOperation('update', 'geo_experiments', (Date.now() - startTime) / 1000);

      if (experiment) {
        moduleLogger.info('Updated experiment', { experimentId: id });
 }

      return experiment as IGeoExperiment | null;
    } catch (error) {
      moduleLogger.error('Failed to update experiment', { id, error });
      throw error;
    }
  },

  /**
   * Start experiment
   */
  async start(id: string): Promise<IGeoExperiment | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findByIdAndUpdate(
        id,
        {
          $set: {
            status: ExperimentStatus.RUNNING,
            startDate: new Date()
          }
        },
        { new: true }
      ).lean();

      if (experiment) {
        // Update active experiments metric
        const activeCount = await GeoExperiment.countDocuments({ status: ExperimentStatus.RUNNING });
        activeExperiments.set(activeCount);
        moduleLogger.info('Started experiment', { experimentId: id });
      }

      trackDbOperation('start', 'geo_experiments', (Date.now() - startTime) / 1000);
      return experiment as IGeoExperiment | null;
    } catch (error) {
      moduleLogger.error('Failed to start experiment', { id, error });
      throw error;
    }
  },

  /**
   * Pause experiment
   */
  async pause(id: string): Promise<IGeoExperiment | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findByIdAndUpdate(
        id,
        { $set: { status: ExperimentStatus.PAUSED } },
        { new: true }
      ).lean();

      if (experiment) {
        const activeCount = await GeoExperiment.countDocuments({ status: ExperimentStatus.RUNNING });
        activeExperiments.set(activeCount);
        moduleLogger.info('Paused experiment', { experimentId: id });
      }

      trackDbOperation('pause', 'geo_experiments', (Date.now() - startTime) / 1000);
      return experiment as IGeoExperiment | null;
    } catch (error) {
      moduleLogger.error('Failed to pause experiment', { id, error });
      throw error;
    }
  },

  /**
   * Complete experiment
   */
  async complete(id: string): Promise<IGeoExperiment | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findByIdAndUpdate(
        id,
        {
          $set: {
            status: ExperimentStatus.COMPLETED,
            endDate: new Date()
          }
        },
        { new: true }
      ).lean();

      if (experiment) {
        const activeCount = await GeoExperiment.countDocuments({ status: ExperimentStatus.RUNNING });
        activeExperiments.set(activeCount);
        moduleLogger.info('Completed experiment', { experimentId: id });
      }

      trackDbOperation('complete', 'geo_experiments', (Date.now() - startTime) / 1000);
      return experiment as IGeoExperiment | null;
    } catch (error) {
      moduleLogger.error('Failed to complete experiment', { id, error });
      throw error;
    }
  },

  /**
   * Cancel experiment
   */
  async cancel(id: string): Promise<IGeoExperiment | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findByIdAndUpdate(
        id,
        { $set: { status: ExperimentStatus.CANCELLED } },
        { new: true }
      ).lean();

      if (experiment) {
        const activeCount = await GeoExperiment.countDocuments({ status: ExperimentStatus.RUNNING });
        activeExperiments.set(activeCount);
        moduleLogger.info('Cancelled experiment', { experimentId: id });
      }

      trackDbOperation('cancel', 'geo_experiments', (Date.now() - startTime) / 1000);
      return experiment as IGeoExperiment | null;
    } catch (error) {
      moduleLogger.error('Failed to cancel experiment', { id, error });
      throw error;
    }
  },

  /**
   * Delete experiment
   */
  async delete(id: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Delete related markets, results
      await Promise.all([
        Market.deleteMany({ experimentId: id }),
        GeoResult.deleteMany({ experimentId: id })
      ]);

      const result = await GeoExperiment.findByIdAndDelete(id);

      if (result) {
        const activeCount = await GeoExperiment.countDocuments({ status: ExperimentStatus.RUNNING });
        activeExperiments.set(activeCount);
        moduleLogger.info('Deleted experiment', { experimentId: id });
      }

      trackDbOperation('delete', 'geo_experiments', (Date.now() - startTime) / 1000);
      return !!result;
    } catch (error) {
      moduleLogger.error('Failed to delete experiment', { id, error });
      throw error;
    }
  },

  /**
   * Get experiment summary
   */
  async getSummary(id: string): Promise<{
    experiment: IGeoExperiment;
    treatmentMarkets: number;
    controlMarkets: number;
    totalMarkets: number;
 } | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findById(id).lean();
      if (!experiment) return null;

      const [treatmentCount, controlCount] = await Promise.all([
        Market.countDocuments({ experimentId: id, type: MarketType.TREATMENT }),
        Market.countDocuments({ experimentId: id, type: MarketType.CONTROL })
      ]);

      trackDbOperation('aggregate', 'geo_experiments', (Date.now() - startTime) / 1000);

      return {
        experiment: experiment as IGeoExperiment,
        treatmentMarkets: treatmentCount,
        controlMarkets: controlCount,
        totalMarkets: treatmentCount + controlCount
      };
    } catch (error) {
      moduleLogger.error('Failed to get experiment summary', { id, error });
      throw error;
    }
  }
};

export default experimentService;