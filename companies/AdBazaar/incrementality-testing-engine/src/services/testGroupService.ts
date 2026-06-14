import { TestGroup, ITestGroupDocument } from '../models/TestGroup';
import { TestGroupType, Metrics } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

export class TestGroupService {
  /**
   * Create a new test group
   */
  async createTestGroup(
    experimentId: string,
    data: {
      name: string;
      type: TestGroupType;
      allocation: number;
      size?: number;
    }
  ): Promise<ITestGroupDocument> {
    logger.info('Creating test group', { experimentId, name: data.name, type: data.type });

    const testGroup = new TestGroup({
      experimentId,
      name: data.name,
      type: data.type,
      size: data.size || 0,
      allocation: data.allocation,
      isActive: true,
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
      }
    });

    await testGroup.save();

    metrics.testGroupsTotal.inc({ type: data.type });

    logger.info('Test group created', { testGroupId: testGroup._id });

    return testGroup;
  }

  /**
   * Get test group by ID
   */
  async getTestGroup(groupId: string): Promise<ITestGroupDocument | null> {
    return TestGroup.findById(groupId);
  }

  /**
   * Get all test groups for an experiment
   */
  async getTestGroupsByExperiment(experimentId: string): Promise<ITestGroupDocument[]> {
    return TestGroup.find({ experimentId })
      .sort({ allocation: -1 });
  }

  /**
   * Update test group
   */
  async updateTestGroup(
    groupId: string,
    data: {
      name?: string;
      allocation?: number;
      size?: number;
      isActive?: boolean;
    }
  ): Promise<ITestGroupDocument | null> {
    const testGroup = await TestGroup.findById(groupId);

    if (!testGroup) {
      return null;
    }

    if (data.name) {
      testGroup.name = data.name;
    }

    if (data.allocation !== undefined) {
      testGroup.allocation = data.allocation;
    }

    if (data.size !== undefined) {
      testGroup.size = data.size;
    }

    if (data.isActive !== undefined) {
      testGroup.isActive = data.isActive;
    }

    await testGroup.save();

    logger.info('Test group updated', { groupId });

    return testGroup;
  }

  /**
   * Delete test group
   */
  async deleteTestGroup(groupId: string): Promise<boolean> {
    const testGroup = await TestGroup.findById(groupId);

    if (!testGroup) {
      return false;
    }

    await TestGroup.deleteOne({ _id: groupId });

    logger.info('Test group deleted', { groupId });

    return true;
  }

  /**
   * Update test group metrics
   */
  async updateMetrics(
    groupId: string,
    data: {
      impressions?: number;
      clicks?: number;
      conversions?: number;
      revenue?: number;
      cost?: number;
      engagement?: number;
      brandAwareness?: number;
      consideration?: number;
      intent?: number;
    }
  ): Promise<ITestGroupDocument | null> {
    const testGroup = await TestGroup.findById(groupId);

    if (!testGroup) {
      return null;
    }

    if (data.impressions !== undefined) {
      testGroup.metrics.impressions = data.impressions;
    }
    if (data.clicks !== undefined) {
      testGroup.metrics.clicks = data.clicks;
    }
    if (data.conversions !== undefined) {
      testGroup.metrics.conversions = data.conversions;
    }
    if (data.revenue !== undefined) {
      testGroup.metrics.revenue = data.revenue;
    }
    if (data.cost !== undefined) {
      testGroup.metrics.cost = data.cost;
    }
    if (data.engagement !== undefined) {
      testGroup.metrics.engagement = data.engagement;
    }
    if (data.brandAwareness !== undefined) {
      testGroup.metrics.brandAwareness = data.brandAwareness;
    }
    if (data.consideration !== undefined) {
      testGroup.metrics.consideration = data.consideration;
    }
    if (data.intent !== undefined) {
      testGroup.metrics.intent = data.intent;
    }

    // Recalculate derived metrics
    this.recalculateMetrics(testGroup);

    await testGroup.save();

    logger.debug('Test group metrics updated', { groupId });

    return testGroup;
  }

  /**
   * Recalculate derived metrics (CTR, CVR, ROAS, CPA)
   */
  private recalculateMetrics(testGroup: ITestGroupDocument): void {
    const { metrics: m } = testGroup;

    // CTR = clicks / impressions
    if (m.impressions > 0) {
      m.ctr = (m.clicks / m.impressions) * 100;
    }

    // CVR = conversions / clicks
    if (m.clicks > 0) {
      m.cvr = (m.conversions / m.clicks) * 100;
      m.cpa = m.cost / m.conversions;
    }

    // ROAS = revenue / cost
    if (m.cost > 0) {
      m.roas = m.revenue / m.cost;
    }
  }

  /**
   * Get treatment and control groups for an experiment
   */
  async getTreatmentAndControl(experimentId: string): Promise<{
    treatment: ITestGroupDocument | null;
    control: ITestGroupDocument | null;
  }> {
    const [treatment, control] = await Promise.all([
      TestGroup.findOne({ experimentId, type: TestGroupType.TREATMENT }),
      TestGroup.findOne({ experimentId, type: TestGroupType.CONTROL })
    ]);

    return { treatment, control };
  }

  /**
   * Calculate lift between treatment and control
   */
  async calculateLift(experimentId: string): Promise<{
    ctrLift: number;
    cvrLift: number;
    roasLift: number;
    revenueLift: number;
  }> {
    const { treatment, control } = await this.getTreatmentAndControl(experimentId);

    if (!treatment || !control) {
      throw new Error('Both treatment and control groups required');
    }

    const calculatePercentLift = (treatmentValue: number, controlValue: number): number => {
      if (controlValue === 0) {
        return treatmentValue > 0 ? 100 : 0;
      }
      return ((treatmentValue - controlValue) / controlValue) * 100;
    };

    return {
      ctrLift: calculatePercentLift(treatment.metrics.ctr, control.metrics.ctr),
      cvrLift: calculatePercentLift(treatment.metrics.cvr, control.metrics.cvr),
      roasLift: calculatePercentLift(treatment.metrics.roas, control.metrics.roas),
      revenueLift: calculatePercentLift(treatment.metrics.revenue, control.metrics.revenue)
    };
  }

  /**
   * Get test group performance summary
   */
  async getPerformanceSummary(groupId: string): Promise<Record<string, unknown>> {
    const testGroup = await TestGroup.findById(groupId);

    if (!testGroup) {
      throw new Error('Test group not found');
    }

    const { metrics: m } = testGroup;

    return {
      id: testGroup._id,
      name: testGroup.name,
      type: testGroup.type,
      size: testGroup.size,
      allocation: testGroup.allocation,
      isActive: testGroup.isActive,
      metrics: {
        impressions: m.impressions,
        clicks: m.clicks,
        conversions: m.conversions,
        revenue: m.revenue,
        cost: m.cost,
        ctr: m.ctr,
        cvr: m.cvr,
        roas: m.roas,
        cpa: m.cpa,
        engagement: m.engagement,
        brandAwareness: m.brandAwareness,
        consideration: m.consideration,
        intent: m.intent
      },
      calculatedMetrics: {
        ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        cvr: m.clicks > 0 ? (m.conversions / m.clicks) * 100 : 0,
        roas: m.cost > 0 ? m.revenue / m.cost : 0,
        cpa: m.conversions > 0 ? m.cost / m.conversions : 0
      }
    };
  }

  /**
   * Allocate users to test groups
   */
  async allocateUsers(
    experimentId: string,
    userCount: number
  ): Promise<Record<string, number>> {
    const testGroups = await TestGroup.find({
      experimentId,
      isActive: true
    }).sort({ allocation: -1 });

    if (testGroups.length === 0) {
      throw new Error('No active test groups');
    }

    const allocations: Record<string, number> = {};
    let remaining = userCount;

    for (let i = 0; i < testGroups.length; i++) {
      const group = testGroups[i];
      const isLast = i === testGroups.length - 1;

      if (isLast) {
        allocations[group._id.toString()] = remaining;
        group.size += remaining;
      } else {
        const allocated = Math.floor((group.allocation / 100) * userCount);
        allocations[group._id.toString()] = allocated;
        group.size += allocated;
        remaining -= allocated;
      }

      await group.save();
    }

    logger.info('Users allocated to test groups', {
      experimentId,
      userCount,
      allocations
    });

    return allocations;
  }

  /**
   * Rebalance test group allocations
   */
  async rebalanceAllocations(
    experimentId: string,
    newAllocations: Record<string, number>
  ): Promise<void> {
    const testGroups = await TestGroup.find({ experimentId });

    for (const group of testGroups) {
      const groupId = group._id.toString();
      if (newAllocations[groupId] !== undefined) {
        group.allocation = newAllocations[groupId];
        await group.save();
      }
    }

    logger.info('Test group allocations rebalanced', { experimentId });
  }
}

export const testGroupService = new TestGroupService();