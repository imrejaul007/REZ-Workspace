import { v4 as uuidv4 } from 'uuid';
import { Test, ITest, Variant, IVariant, Assignment, IAssignment, Result, IResult } from '../models';
import { createServiceLogger } from 'utils/logger.js';

const logger = createServiceLogger('ABTestService');

export class ABTestService {
  async createTest(data: Partial<ITest>): Promise<ITest> {
    const testId = `test_${uuidv4()}`;
    const test = new Test({ ...data, testId });
    await test.save();
    logger.info('Test created', { testId, name: data.name });
    return test;
  }

  async getTestById(testId: string): Promise<ITest | null> {
    return Test.findOne({ testId });
  }

  async getTests(companyId: string, status?: string): Promise<ITest[]> {
    const query: Record<string, unknown> = { companyId };
    if (status) query['status'] = status;
    return Test.find(query).sort({ createdAt: -1 });
  }

  async updateTest(testId: string, data: Partial<ITest>): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate({ testId }, data, { new: true });
    if (test) logger.info('Test updated', { testId });
    return test;
  }

  async startTest(testId: string): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate(
      { testId, status: 'draft' },
      { status: 'running', startDate: new Date() },
      { new: true }
    );
    if (test) logger.info('Test started', { testId });
    return test;
  }

  async pauseTest(testId: string): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate({ testId, status: 'running' }, { status: 'paused' }, { new: true });
    if (test) logger.info('Test paused', { testId });
    return test;
  }

  async completeTest(testId: string, winnerId?: string, reason?: string): Promise<ITest | null> {
    const test = await Test.findOneAndUpdate(
      { testId, status: { $in: ['running', 'paused'] } },
      { status: 'completed', endDate: new Date(), winnerId, winnerReason: reason },
      { new: true }
    );
    if (test) logger.info('Test completed', { testId, winnerId });
    return test;
  }

  async createVariant(testId: string, data: Partial<IVariant>): Promise<IVariant> {
    const variantId = `var_${uuidv4()}`;
    const variant = new Variant({ ...data, testId, variantId });
    await variant.save();
    logger.info('Variant created', { variantId, testId });
    return variant;
  }

  async getVariantsByTest(testId: string): Promise<IVariant[]> {
    return Variant.find({ testId });
  }

  async getVariantById(variantId: string): Promise<IVariant | null> {
    return Variant.findOne({ variantId });
  }

  async assignUser(testId: string, userId: string, companyId: string, sessionId?: string): Promise<IAssignment> {
    const existing = await Assignment.findOne({ testId, userId });
    if (existing) return existing;

    const test = await this.getTestById(testId);
    if (!test || test.status !== 'running') throw new Error('Test not available');

    const variants = await this.getVariantsByTest(testId);
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedVariant = variants[0];

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        selectedVariant = variant;
        break;
      }
    }

    const assignmentId = `asgn_${uuidv4()}`;
    const assignment = new Assignment({
      assignmentId,
      testId,
      variantId: selectedVariant.variantId,
      userId,
      companyId,
      sessionId
    });

    await assignment.save();
    await Variant.updateOne({ variantId: selectedVariant.variantId }, { $inc: { impressions: 1 } });

    logger.info('User assigned to variant', { assignmentId, testId, variantId: selectedVariant.variantId });
    return assignment;
  }

  async recordConversion(assignmentId: string, revenue?: number): Promise<IAssignment | null> {
    const assignment = await Assignment.findOne({ assignmentId });
    if (!assignment || assignment.converted) return null;

    assignment.converted = true;
    assignment.convertedAt = new Date();
    if (revenue !== undefined) assignment.revenue = revenue;
    await assignment.save();

    await Variant.updateOne({ variantId: assignment.variantId }, { $inc: { conversions: 1 } });
    if (revenue) {
      await Variant.updateOne({ variantId: assignment.variantId }, { $inc: { revenue } });
    }

    logger.info('Conversion recorded', { assignmentId });
    return assignment;
  }

  async computeResults(testId: string): Promise<IResult[]> {
    const variants = await this.getVariantsByTest(testId);
    const results: IResult[] = [];
    const control = variants.find(v => v.isControl);
    if (!control) throw new Error('No control variant found');

    for (const variant of variants) {
      const assignmentCount = await Assignment.countDocuments({ testId, variantId: variant.variantId });
      const conversions = await Assignment.countDocuments({ testId, variantId: variant.variantId, converted: true });
      const conversionRate = assignmentCount > 0 ? conversions / assignmentCount : 0;
      const uplift = control.conversionRate > 0 ? ((conversionRate - control.conversionRate) / control.conversionRate) * 100 : 0;

      const resultId = `res_${uuidv4()}`;
      const result = new Result({
        resultId,
        testId,
        variantId: variant.variantId,
        sampleSize: assignmentCount,
        impressions: variant.impressions,
        conversions,
        conversionRate,
        confidence: 0.95,
        uplift,
        isSignificant: assignmentCount >= 1000 && Math.abs(uplift) > 5,
        isWinner: variant.variantId !== control.variantId && uplift > 0
      });

      await result.save();
      results.push(result);
    }

    logger.info('Results computed', { testId, variantCount: results.length });
    return results;
  }

  async getResults(testId: string): Promise<{
    test: ITest | null;
    variants: IVariant[];
    results: IResult[];
  }> {
    const test = await this.getTestById(testId);
    const variants = await this.getVariantsByTest(testId);
    const results = await Result.find({ testId }).sort({ computedAt: -1 });
    return { test, variants, results };
  }

  async getAssignment(testId: string, userId: string): Promise<IAssignment | null> {
    return Assignment.findOne({ testId, userId });
  }
}

export const abTestService = new ABTestService();