import { Test, ITest } from '../models/test.model';
import { Variant } from '../models/variant.model';
import { Result } from '../models/result.model';
import { v4 as uuidv4 } from 'uuid';
import logger from 'utils/logger.js';
import { testsCreated, testsStarted, activeTests, testDuration } from '../utils/metrics';

export interface CreateTestInput {
  name: string;
  description?: string;
  hypothesis?: string;
  type?: 'ab' | 'multivariate' | 'bandit';
  startDate?: string;
  endDate?: string;
  trafficAllocation?: number;
  targetAudience?: {
    segments?: string[];
    countries?: string[];
    platforms?: string[];
  };
  primaryMetric?: 'ctr' | 'conversion' | 'revenue' | 'engagement' | 'custom';
  secondaryMetrics?: string[];
  minimumSampleSize?: number;
  confidenceLevel?: number;
  variants?: Array<{
    name: string;
    description?: string;
    isControl?: boolean;
    trafficWeight?: number;
    configuration?: Record<string, unknown>;
  }>;
}

export interface UpdateTestInput {
  name?: string;
  description?: string;
  hypothesis?: string;
  startDate?: string;
  endDate?: string;
  trafficAllocation?: number;
  targetAudience?: {
    segments?: string[];
    countries?: string[];
    platforms?: string[];
  };
  primaryMetric?: 'ctr' | 'conversion' | 'revenue' | 'engagement' | 'custom';
  secondaryMetrics?: string[];
  minimumSampleSize?: number;
  confidenceLevel?: number;
}

export class TestService {
  async create(input: CreateTestInput, createdBy: string): Promise<ITest> {
    const testId = `test-${uuidv4().slice(0, 8)}`;

    const test = new Test({
      testId,
      name: input.name,
      description: input.description,
      hypothesis: input.hypothesis,
      type: input.type || 'ab',
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      trafficAllocation: input.trafficAllocation || 100,
      targetAudience: input.targetAudience,
      primaryMetric: input.primaryMetric || 'conversion',
      secondaryMetrics: input.secondaryMetrics,
      minimumSampleSize: input.minimumSampleSize || 1000,
      confidenceLevel: input.confidenceLevel || 0.95,
      createdBy
    });

    await test.save();
    testsCreated.inc();

    // Create variants if provided
    if (input.variants && input.variants.length > 0) {
      const totalWeight = input.variants.reduce((sum, v) => sum + (v.trafficWeight || 50), 0);
      for (const variantInput of input.variants) {
        const weight = totalWeight > 0 ? ((variantInput.trafficWeight || 50) / totalWeight) * 100 : 50;
        const variant = new Variant({
          variantId: `var-${uuidv4().slice(0, 8)}`,
          testId,
          name: variantInput.name,
          description: variantInput.description,
          isControl: variantInput.isControl || false,
          trafficWeight: Math.round(weight * 100) / 100,
          configuration: variantInput.configuration || {}
        });
        await variant.save();
      }
    } else {
      // Create default control and treatment variants
      const control = new Variant({
        variantId: `var-${uuidv4().slice(0, 8)}`,
        testId,
        name: 'Control',
        isControl: true,
        trafficWeight: 50,
        configuration: {}
      });
      const treatment = new Variant({
        variantId: `var-${uuidv4().slice(0, 8)}`,
        testId,
        name: 'Treatment',
        isControl: false,
        trafficWeight: 50,
        configuration: {}
      });
      await control.save();
      await treatment.save();
    }

    logger.info(`Test created: ${testId}`);
    return test;
  }

  async findById(testId: string): Promise<ITest | null> {
    return Test.findOne({ testId });
  }

  async update(testId: string, input: UpdateTestInput): Promise<ITest | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.hypothesis !== undefined) updateData.hypothesis = input.hypothesis;
    if (input.startDate) updateData.startDate = new Date(input.startDate);
    if (input.endDate) updateData.endDate = new Date(input.endDate);
    if (input.trafficAllocation !== undefined) updateData.trafficAllocation = input.trafficAllocation;
    if (input.targetAudience) updateData.targetAudience = input.targetAudience;
    if (input.primaryMetric) updateData.primaryMetric = input.primaryMetric;
    if (input.secondaryMetrics) updateData.secondaryMetrics = input.secondaryMetrics;
    if (input.minimumSampleSize !== undefined) updateData.minimumSampleSize = input.minimumSampleSize;
    if (input.confidenceLevel !== undefined) updateData.confidenceLevel = input.confidenceLevel;

    const test = await Test.findOneAndUpdate(
      { testId },
      { $set: updateData },
      { new: true }
    );

    if (test) {
      logger.info(`Test updated: ${testId}`);
    }
    return test;
  }

  async start(testId: string): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate(
      { testId, status: { $in: ['draft', 'paused'] } },
      {
        $set: {
          status: 'running',
          startDate: new Date()
        }
      },
      { new: true }
    );

    if (test) {
      testsStarted.inc();
      activeTests.inc();
      testDuration.observe({ test_id: testId }, 0);
      logger.info(`Test started: ${testId}`);
    }
    return test;
  }

  async pause(testId: string): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate(
      { testId, status: 'running' },
      { $set: { status: 'paused' } },
      { new: true }
    );

    if (test) {
      activeTests.dec();
      logger.info(`Test paused: ${testId}`);
    }
    return test;
  }

  async complete(testId: string): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate(
      { testId, status: 'running' },
      {
        $set: {
          status: 'completed',
          endDate: new Date()
        }
      },
      { new: true }
    );

    if (test) {
      activeTests.dec();
      if (test.startDate) {
        const duration = (Date.now() - test.startDate.getTime()) / 1000;
        testDuration.observe({ test_id: testId }, duration);
      }
      logger.info(`Test completed: ${testId}`);
    }
    return test;
  }

  async list(filters?: {
    status?: string;
    type?: string;
    createdBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tests: ITest[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters?.status) query.status = filters.status;
    if (filters?.type) query.type = filters.type;
    if (filters?.createdBy) query.createdBy = filters.createdBy;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      Test.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Test.countDocuments(query)
    ]);

    return { tests, total };
  }

  async getResults(testId: string, granularity?: 'hourly' | 'daily' | 'weekly'): Promise<{
    summary: {
      totalImpressions: number;
      totalConversions: number;
      overallConversionRate: number;
      totalRevenue: number;
    };
    variants: Array<{
      variantId: string;
      name: string;
      impressions: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
      lift?: number;
      statisticalSignificance?: number;
    }>;
    timeSeries: Array<{
      timestamp: Date;
      impressions: number;
      conversions: number;
      revenue: number;
    }>;
  }> {
    const test = await Test.findOne({ testId });
    if (!test) throw new Error('Test not found');

    const variants = await Variant.find({ testId });

    // Get aggregate metrics
    const results = await Result.aggregate([
      { $match: { testId } },
      {
        $group: {
          _id: '$variantId',
          totalImpressions: { $sum: '$impressions' },
          totalConversions: { $sum: '$conversions' },
          totalRevenue: { $sum: '$revenue' },
          avgSignificance: { $avg: '$statisticalSignificance' }
        }
      }
    ]);

    const resultMap = new Map(results.map(r => [r._id, r]));

    let totalImpressions = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    const variantResults = variants.map(v => {
      const r = resultMap.get(v.variantId) || { totalImpressions: 0, totalConversions: 0, totalRevenue: 0 };
      totalImpressions += r.totalImpressions;
      totalConversions += r.totalConversions;
      totalRevenue += r.totalRevenue;

      const conversionRate = r.totalImpressions > 0 ? r.totalConversions / r.totalImpressions : 0;
      return {
        variantId: v.variantId,
        name: v.name,
        impressions: r.totalImpressions,
        conversions: r.totalConversions,
        conversionRate: Math.round(conversionRate * 10000) / 100,
        revenue: r.totalRevenue,
        statisticalSignificance: r.avgSignificance
      };
    });

    // Calculate lift for non-control variants
    const control = variantResults.find(v => variants.find(vv => vv.variantId === v.variantId)?.isControl);
    const controlRate = control?.conversionRate || 0;

    if (controlRate > 0) {
      for (const variant of variantResults) {
        if (!variants.find(v => v.variantId === variant.variantId)?.isControl) {
          variant.lift = Math.round(((variant.conversionRate - controlRate) / controlRate) * 10000) / 100;
        }
      }
    }

    // Get time series data
    const matchStage: Record<string, unknown> = { testId };
    let groupInterval: Record<string, unknown> = { day: { $dayOfMonth: '$timestamp' } };

    if (granularity === 'hourly') {
      groupInterval = { hour: { $hour: '$timestamp' } };
    } else if (granularity === 'weekly') {
      groupInterval = { week: { $week: '$timestamp' } };
    }

    const timeSeries = await Result.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              ...groupInterval
            }
          },
          timestamp: { $first: '$timestamp' },
          impressions: { $sum: '$impressions' },
          conversions: { $sum: '$conversions' },
          revenue: { $sum: '$revenue' }
        }
      },
      { $sort: { '_id.date.year': 1, '_id.date.month': 1 } },
      { $limit: 100 }
    ]);

    return {
      summary: {
        totalImpressions,
        totalConversions,
        overallConversionRate: totalImpressions > 0 ? Math.round((totalConversions / totalImpressions) * 10000) / 100 : 0,
        totalRevenue
      },
      variants: variantResults,
      timeSeries: timeSeries.map(t => ({
        timestamp: t.timestamp,
        impressions: t.impressions,
        conversions: t.conversions,
        revenue: t.revenue
      }))
    };
  }

  async delete(testId: string): Promise<boolean> {
    const result = await Test.findOneAndUpdate(
      { testId },
      { $set: { status: 'archived' } }
    );

    if (result) {
      await Variant.updateMany({ testId }, { $set: { status: 'archived' } });
      logger.info(`Test archived: ${testId}`);
      return true;
    }
    return false;
  }
}

export const testService = new TestService();