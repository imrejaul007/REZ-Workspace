import { Experiment, IExperiment } from '../models/experiment.model';
import { Assignment } from '../models/assignment.model';
import { Metric } from '../models/metric.model';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import { experimentsCreated, activeExperiments, enrollments, metricsTracked } from '../utils/metrics';

export interface CreateExperimentInput {
  name: string;
  description?: string;
  type?: 'ab' | 'multivariate' | 'feature_flag' | 'canary' | 'champion_challenger';
  owner: string;
  team?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  trafficPercentage?: number;
  targeting?: {
    userIds?: string[];
    segments?: string[];
    countries?: string[];
    platforms?: string[];
    userTypes?: string[];
  };
  variants: Array<{
    name: string;
    weight: number;
    description?: string;
  }>;
  metrics: Array<{
    name: string;
    type: 'conversion' | 'revenue' | 'engagement' | 'retention' | 'custom';
    unit: string;
    higherIsBetter?: boolean;
  }>;
  guardrails?: Array<{
    metricName: string;
    minValue: number;
    maxValue: number;
  }>;
  hypothesis?: string;
}

export class ExperimentService {
  async create(input: CreateExperimentInput): Promise<IExperiment> {
    const experimentId = `exp-${uuidv4().slice(0, 8)}`;

    // Normalize variant weights to sum to 100
    const totalWeight = input.variants.reduce((sum, v) => sum + v.weight, 0);
    const normalizedVariants = input.variants.map(v => ({
      variantId: `var-${uuidv4().slice(0, 8)}`,
      name: v.name,
      weight: totalWeight > 0 ? Math.round((v.weight / totalWeight) * 10000) / 100 : 0,
      description: v.description
    }));

    // Create metric configs
    const metrics = input.metrics.map(m => ({
      metricId: `met-${uuidv4().slice(0, 8)}`,
      name: m.name,
      type: m.type,
      unit: m.unit,
      higherIsBetter: m.higherIsBetter !== false
    }));

    const experiment = new Experiment({
      experimentId,
      name: input.name,
      description: input.description,
      type: input.type || 'ab',
      owner: input.owner,
      team: input.team,
      tags: input.tags || [],
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      trafficPercentage: input.trafficPercentage || 100,
      targeting: input.targeting,
      variants: normalizedVariants,
      metrics,
      guardrails: input.guardrails?.map(g => ({
        metricId: `gr-${uuidv4().slice(0, 8)}`,
        name: g.metricName,
        minValue: g.minValue,
        maxValue: g.maxValue
      })),
      hypothesis: input.hypothesis
    });

    await experiment.save();
    experimentsCreated.inc();
    logger.info(`Experiment created: ${experimentId}`);

    return experiment;
  }

  async findById(experimentId: string): Promise<IExperiment | null> {
    return Experiment.findOne({ experimentId });
  }

  async list(filters?: {
    status?: string;
    type?: string;
    owner?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ experiments: IExperiment[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    if (filters?.owner) query.owner = filters.owner;
    if (filters?.tags) query.tags = { $in: filters.tags };

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [experiments, total] = await Promise.all([
      Experiment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Experiment.countDocuments(query)
    ]);

    return { experiments, total };
  }

  async activate(experimentId: string): Promise<IExperiment | null> {
    const experiment = await Experiment.findOneAndUpdate(
      { experimentId, status: { $in: ['draft', 'paused'] } },
      {
        $set: {
          status: 'active',
          startDate: new Date()
        }
      },
      { new: true }
    );

    if (experiment) {
      activeExperiments.inc();
      logger.info(`Experiment activated: ${experimentId}`);
    }
    return experiment;
  }

  async pause(experimentId: string): Promise<IExperiment | null> {
    const experiment = await Experiment.findOneAndUpdate(
      { experimentId, status: 'active' },
      { $set: { status: 'paused' } },
      { new: true }
    );

    if (experiment) {
      activeExperiments.dec();
      logger.info(`Experiment paused: ${experimentId}`);
    }
    return experiment;
  }

  async complete(experimentId: string): Promise<IExperiment | null> {
    const experiment = await Experiment.findOneAndUpdate(
      { experimentId, status: 'active' },
      {
        $set: {
          status: 'completed',
          endDate: new Date()
        }
      },
      { new: true }
    );

    if (experiment) {
      activeExperiments.dec();
      logger.info(`Experiment completed: ${experimentId}`);
    }
    return experiment;
  }

  async enrollUser(experimentId: string, userId: string, metadata?: Record<string, string>): Promise<{ assignmentId: string; variantId: string } | null> {
    const experiment = await Experiment.findOne({ experimentId, status: 'active' });
    if (!experiment) return null;

    // Check if user already enrolled
    const existing = await Assignment.findOne({ experimentId, userId });
    if (existing) {
      return { assignmentId: existing.assignmentId, variantId: existing.variantId };
    }

    // Select variant based on weights (deterministic hash for consistent assignment)
    const variantId = this.selectVariant(experiment.variants, userId);

    const assignment = new Assignment({
      assignmentId: `asg-${uuidv4().slice(0, 8)}`,
      experimentId,
      userId,
      variantId,
      metadata
    });

    await assignment.save();
    enrollments.inc({ experiment_id: experimentId });

    logger.info(`User enrolled: ${userId} in experiment ${experimentId} variant ${variantId}`);
    return { assignmentId: assignment.assignmentId, variantId };
  }

  private selectVariant(variants: Array<{ variantId: string; weight: number }>, userId: string): string {
    // Deterministic selection based on user hash
    const hash = this.hashString(userId);
    let cumulative = 0;
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

    for (const variant of variants) {
      cumulative += variant.weight / totalWeight;
      if (hash / 0xffffffff <= cumulative) {
        return variant.variantId;
      }
    }

    return variants[0]?.variantId || '';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async recordConversion(assignmentId: string): Promise<boolean> {
    const assignment = await Assignment.findOneAndUpdate(
      { assignmentId, converted: false },
      {
        $set: {
          converted: true,
          convertedAt: new Date()
        }
      }
    );

    return !!assignment;
  }

  async recordMetric(experimentId: string, variantId: string, metricName: string, value: number, sampleSize = 1): Promise<void> {
    const metric = new Metric({
      metricId: `met-${uuidv4().slice(0, 8)}`,
      experimentId,
      variantId,
      metricName,
      value,
      sampleSize
    });

    await metric.save();
    metricsTracked.inc({ experiment_id: experimentId, metric_name: metricName });
  }

  async getAnalytics(experimentId: string): Promise<{
    summary: {
      totalAssignments: number;
      totalConversions: number;
      conversionRate: number;
    };
    variants: Array<{
      variantId: string;
      name: string;
      weight: number;
      assignments: number;
      conversions: number;
      conversionRate: number;
      metrics: Record<string, { value: number; change: number }>;
    }>;
    guardrails: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      currentValue: number;
    }>;
  }> {
    const experiment = await Experiment.findOne({ experimentId });
    if (!experiment) throw new Error('Experiment not found');

    // Get assignment stats per variant
    const assignmentStats = await Assignment.aggregate([
      { $match: { experimentId } },
      {
        $group: {
          _id: '$variantId',
          assignments: { $sum: 1 },
          conversions: { $sum: { $cond: ['$converted', 1, 0] } }
        }
      }
    ]);

    const statsMap = new Map(assignmentStats.map(s => [s._id, s]));

    // Get metric data
    const metricData = await Metric.aggregate([
      { $match: { experimentId } },
      {
        $group: {
          _id: { variantId: '$variantId', metricName: '$metricName' },
          avgValue: { $avg: '$value' },
          totalValue: { $sum: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    const metricMap = new Map();
    for (const m of metricData) {
      const key = `${m._id.variantId}:${m._id.metricName}`;
      metricMap.set(key, { value: m.avgValue, count: m.count });
    }

    let totalAssignments = 0;
    let totalConversions = 0;

    const variantAnalytics = experiment.variants.map(v => {
      const stats = statsMap.get(v.variantId) || { assignments: 0, conversions: 0 };
      totalAssignments += stats.assignments;
      totalConversions += stats.conversions;

      const conversionRate = stats.assignments > 0 ? (stats.conversions / stats.assignments) * 100 : 0;

      // Calculate metrics for this variant
      const variantMetrics: Record<string, { value: number; change: number }> = {};
      for (const metric of experiment.metrics) {
        const key = `${v.variantId}:${metric.name}`;
        const data = metricMap.get(key);
        variantMetrics[metric.name] = {
          value: data?.value || 0,
          change: 0 // Would need baseline comparison
        };
      }

      return {
        variantId: v.variantId,
        name: v.name,
        weight: v.weight,
        assignments: stats.assignments,
        conversions: stats.conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        metrics: variantMetrics
      };
    });

    // Check guardrails
    const guardrailResults = (experiment.guardrails || []).map(g => {
      const metricData = await Metric.findOne({
        experimentId,
        metricName: g.name
      }).sort({ timestamp: -1 });

      const status = !metricData ? 'warning' :
        metricData.value < g.minValue || metricData.value > g.maxValue ? 'fail' : 'pass';

      return {
        name: g.name,
        status,
        currentValue: metricData?.value || 0
      };
    });

    return {
      summary: {
        totalAssignments,
        totalConversions,
        conversionRate: totalAssignments > 0 ? Math.round((totalConversions / totalAssignments) * 10000) / 100 : 0
      },
      variants: variantAnalytics,
      guardrails: guardrailResults
    };
  }

  async delete(experimentId: string): Promise<boolean> {
    const result = await Experiment.findOneAndUpdate(
      { experimentId },
      { $set: { status: 'archived' } }
    );

    if (result) {
      logger.info(`Experiment archived: ${experimentId}`);
      return true;
    }
    return false;
  }
}

export const experimentService = new ExperimentService();