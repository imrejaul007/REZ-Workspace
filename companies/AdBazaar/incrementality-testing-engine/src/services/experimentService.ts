import { v4 as uuidv4 } from 'uuid';
import { Experiment, TestGroup, Result, LiftAnalysis } from '../models';
import { IExperimentDocument } from '../models/Experiment';
import { ITestGroupDocument } from '../models/TestGroup';
import { ExperimentType, ExperimentStatus, TestGroupType, CreateExperimentRequest, UpdateExperimentRequest } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

export class ExperimentService {
  /**
   * Create a new experiment with test groups
   */
  async createExperiment(data: CreateExperimentRequest, userId: string): Promise<IExperimentDocument> {
    logger.info('Creating new experiment', { name: data.name, type: data.type, userId });

    // Create the experiment
    const experiment = new Experiment({
      name: data.name,
      description: data.description,
      type: data.type,
      status: ExperimentStatus.DRAFT,
      targeting: data.targeting || {},
      budget: data.budget || 0,
      spent: 0,
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cost: 0,
        ctr: 0,
        cvr: 0,
        roas: 0,
        cpa: 0,
        engagement: 0,
        brandAwareness: 0,
        consideration: 0,
        intent: 0
      },
      testGroups: [],
      results: [],
      liftAnalyses: [],
      recommendations: [],
      createdBy: userId
    });

    await experiment.save();

    // Create default test groups if not provided
    if (data.testGroups && data.testGroups.length > 0) {
      for (const groupData of data.testGroups) {
        const testGroup = new TestGroup({
          experimentId: experiment._id,
          name: groupData.name,
          type: groupData.type,
          size: 0,
          allocation: groupData.allocation,
          isActive: true
        });
        await testGroup.save();
        experiment.testGroups.push(testGroup._id);
      }
    } else {
      // Create default treatment and control groups
      const treatmentGroup = new TestGroup({
        experimentId: experiment._id,
        name: 'Treatment',
        type: TestGroupType.TREATMENT,
        size: 0,
        allocation: 50,
        isActive: true
      });
      await treatmentGroup.save();

      const controlGroup = new TestGroup({
        experimentId: experiment._id,
        name: 'Control',
        type: TestGroupType.CONTROL,
        size: 0,
        allocation: 50,
        isActive: true
      });
      await controlGroup.save();

      experiment.testGroups = [treatmentGroup._id, controlGroup._id];
 await experiment.save();
    }

    // Update metrics
    metrics.experimentsTotal.inc({ status: 'draft', type: data.type });

    logger.info('Experiment created successfully', {
      experimentId: experiment._id,
      testGroups: experiment.testGroups.length
    });

    return experiment;
  }

  /**
   * Get experiment by ID
   */
  async getExperiment(experimentId: string): Promise<IExperimentDocument | null> {
    return Experiment.findById(experimentId)
      .populate('testGroups')
      .populate('results')
      .populate('liftAnalyses');
  }

  /**
   * List experiments with pagination and filters
   */
  async listExperiments(
    options: {
      page?: number;
      limit?: number;
      status?: ExperimentStatus;
      type?: ExperimentType;
      search?: string;
    } = {}
  ): Promise<{
    experiments: IExperimentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status, type, search } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const [experiments, total] = await Promise.all([
      Experiment.find(query)
        .populate('testGroups')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Experiment.countDocuments(query)
    ]);

    return {
      experiments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update experiment
   */
  async updateExperiment(
    experimentId: string,
    data: UpdateExperimentRequest
  ): Promise<IExperimentDocument | null> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return null;
    }

    if (data.name) {
      experiment.name = data.name;
    }

    if (data.description) {
      experiment.description = data.description;
    }

    if (data.targeting) {
      experiment.targeting = data.targeting;
    }

    if (data.budget !== undefined) {
      experiment.budget = data.budget;
    }

    await experiment.save();

    logger.info('Experiment updated', { experimentId });

    return experiment;
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string): Promise<IExperimentDocument | null> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return null;
    }

    if (experiment.status !== ExperimentStatus.DRAFT &&
        experiment.status !== ExperimentStatus.PAUSED) {
      throw new Error(`Cannot start experiment in ${experiment.status} status`);
    }

    experiment.status = ExperimentStatus.RUNNING;
    experiment.startDate = new Date();

    await experiment.save();

    // Update metrics
    metrics.experimentsTotal.dec({ status: experiment.status, type: experiment.type });
    metrics.experimentsTotal.inc({ status: 'running', type: experiment.type });
    metrics.experimentActive.inc();

    logger.info('Experiment started', { experimentId, startDate: experiment.startDate });

    return experiment;
  }

  /**
   * Pause experiment
   */
  async pauseExperiment(experimentId: string): Promise<IExperimentDocument | null> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return null;
    }

    if (experiment.status !== ExperimentStatus.RUNNING) {
      throw new Error(`Cannot pause experiment in ${experiment.status} status`);
    }

    experiment.status = ExperimentStatus.PAUSED;

    await experiment.save();

    // Update metrics
    metrics.experimentsTotal.dec({ status: 'running', type: experiment.type });
    metrics.experimentsTotal.inc({ status: 'paused', type: experiment.type });
    metrics.experimentActive.dec();

    logger.info('Experiment paused', { experimentId });

    return experiment;
  }

  /**
   * Complete experiment
   */
  async completeExperiment(experimentId: string): Promise<IExperimentDocument | null> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return null;
    }

    experiment.status = ExperimentStatus.COMPLETED;
    experiment.endDate = new Date();

    await experiment.save();

    // Update metrics
    metrics.experimentsTotal.dec({ status: 'running', type: experiment.type });
    metrics.experimentsTotal.inc({ status: 'completed', type: experiment.type });
    metrics.experimentActive.dec();

    logger.info('Experiment completed', { experimentId, endDate: experiment.endDate });

    return experiment;
  }

  /**
   * Archive experiment
   */
  async archiveExperiment(experimentId: string): Promise<IExperimentDocument | null> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return null;
    }

    experiment.status = ExperimentStatus.ARCHIVED;

    await experiment.save();

    logger.info('Experiment archived', { experimentId });

    return experiment;
  }

  /**
   * Delete experiment
   */
  async deleteExperiment(experimentId: string): Promise<boolean> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      return false;
    }

    // Delete associated test groups
    await TestGroup.deleteMany({ experimentId: experiment._id });

    // Delete associated results
    await Result.deleteMany({ experimentId: experiment._id });

    // Delete associated lift analyses
    await LiftAnalysis.deleteMany({ experimentId: experiment._id });

    // Delete the experiment
    await Experiment.deleteOne({ _id: experimentId });

    logger.info('Experiment deleted', { experimentId });

    return true;
  }

  /**
   * Get experiment results
   */
  async getResults(experimentId: string, options: {
    startDate?: Date;
    endDate?: Date;
    groupId?: string;
  } = {}): Promise<{
    aggregated: Record<string, unknown>;
    daily: Record<string, unknown>[];
    testGroups: ITestGroupDocument[];
  }> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Get test groups
    const testGroups = await TestGroup.find({ experimentId: experiment._id });

    // Get aggregated results
    const aggregated = await Result.getAggregatedResults(experiment._id);

    // Get daily results
    const daily = await Result.getDailyResults(
      experiment._id,
      options.startDate,
      options.endDate
    );

    return {
      aggregated,
      daily,
      testGroups
    };
  }

  /**
   * Record metrics for a test group
   */
  async recordMetrics(
    experimentId: string,
    groupId: string,
    data: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      revenue?: number;
      cost?: number;
    }
  ): Promise<void> {
    const testGroup = await TestGroup.findOne({
      _id: groupId,
      experimentId
    });

    if (!testGroup) {
      throw new Error('Test group not found');
    }

    // Update test group metrics
    if (data.impressions) {
      testGroup.metrics.impressions += data.impressions;
      metrics.impressionsTotal.inc(data.impressions);
    }
    if (data.clicks) {
      testGroup.metrics.clicks += data.clicks;
    }
    if (data.conversions) {
      testGroup.metrics.conversions += data.conversions;
      testGroup.metrics.cvr = testGroup.metrics.clicks > 0
        ? (testGroup.metrics.conversions / testGroup.metrics.clicks) * 100
        : 0;
      metrics.conversionsTotal.inc(data.conversions);
    }
    if (data.revenue) {
      testGroup.metrics.revenue += data.revenue;
    }
    if (data.cost) {
      testGroup.metrics.cost += data.cost;
    }

    // Recalculate CTR
    if (testGroup.metrics.impressions > 0) {
      testGroup.metrics.ctr = (testGroup.metrics.clicks / testGroup.metrics.impressions) * 100;
    }

    // Recalculate ROAS
    if (testGroup.metrics.cost > 0) {
      testGroup.metrics.roas = testGroup.metrics.revenue / testGroup.metrics.cost;
    }

    // Recalculate CPA
    if (testGroup.metrics.conversions > 0) {
      testGroup.metrics.cpa = testGroup.metrics.cost / testGroup.metrics.conversions;
    }

    await testGroup.save();

    // Create daily result
    const result = new Result({
      experimentId,
      groupId,
      date: new Date(),
      impressions: data.impressions || 0,
      clicks: data.clicks || 0,
      conversions: data.conversions || 0,
      revenue: data.revenue || 0,
      cost: data.cost || 0
    });
    await result.save();

    metrics.resultsProcessed.inc();

    logger.debug('Metrics recorded', { experimentId, groupId, data });
  }

  /**
   * Get experiments by status
   */
  async getExperimentsByStatus(status: ExperimentStatus): Promise<IExperimentDocument[]> {
    return Experiment.find({ status })
      .populate('testGroups')
      .sort({ createdAt: -1 });
  }

  /**
   * Get experiment summary
   */
  async getExperimentSummary(experimentId: string): Promise<Record<string, unknown>> {
    const experiment = await Experiment.findById(experimentId)
      .populate('testGroups');

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const testGroups = await TestGroup.find({ experimentId: experiment._id });
    const aggregatedResults = await Result.getAggregatedResults(experiment._id);

    return {
      experiment: {
        id: experiment._id,
        name: experiment.name,
        type: experiment.type,
        status: experiment.status,
        startDate: experiment.startDate,
        endDate: experiment.endDate,
        budget: experiment.budget,
        spent: experiment.spent,
        duration: experiment.duration
      },
      testGroups: testGroups.map(g => ({
        id: g._id,
        name: g.name,
        type: g.type,
        size: g.size,
        allocation: g.allocation,
        metrics: g.metrics
      })),
      aggregatedResults,
      recommendations: experiment.recommendations
    };
  }
}

export const experimentService = new ExperimentService();