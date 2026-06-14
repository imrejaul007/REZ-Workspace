import { CreativeVariation, ICreativeVariation } from '../models/CreativeVariation';
import { Creative } from '../models/Creative';
import { v4 as uuidv4 } from 'uuid';
import { logger } from 'utils/logger.js';

export interface CreateVariationTestDto {
  creativeId: string;
  testName: string;
  testType: 'ab' | 'multivariate' | 'bandit';
  hypothesis?: string;
  variations: Array<{
    name: string;
    content: {
      headline?: string;
      body?: string;
      cta?: string;
      imageUrl?: string;
    };
    weight?: number;
  }>;
  startDate: Date;
  endDate?: Date;
  createdBy: string;
}

export interface UpdateVariationMetricsDto {
  variantId: string;
  impressions: number;
  clicks: number;
  conversions?: number;
}

export class VariationService {
  async createTest(dto: CreateVariationTestDto): Promise<ICreativeVariation> {
    try {
      // Validate creative exists
      const creative = await Creative.findById(dto.creativeId).exec();
      if (!creative) throw new Error('Creative not found');

      // Generate variant IDs and set weights
      const variations = dto.variations.map((v, index) => ({
        variantId: uuidv4(),
        name: v.name,
        content: v.content,
        weight: v.weight || Math.round(100 / dto.variations.length),
        status: 'active' as const
      }));

      // Normalize weights to sum to 100
      const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight !== 100 && dto.testType === 'bandit') {
        variations.forEach(v => {
          v.weight = Math.round((v.weight / totalWeight) * 100);
        });
      }

      const test = new CreativeVariation({
        creativeId: dto.creativeId,
        testName: dto.testName,
        testType: dto.testType,
        hypothesis: dto.hypothesis,
        variations,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: 'draft',
        trafficSplit: this.calculateTrafficSplit(variations),
        createdBy: dto.createdBy
      });

      await test.save();
      logger.info(`Variation test created: ${test._id}`);
      return test;
    } catch (error) {
      logger.error('Failed to create variation test:', error);
      throw error;
    }
  }

  private calculateTrafficSplit(variations: any[]): Record<string, number> {
    const split: Record<string, number> = {};
    variations.forEach(v => {
      split[v.variantId] = v.weight;
    });
    return split;
  }

  async startTest(testId: string): Promise<ICreativeVariation | null> {
    const test = await CreativeVariation.findById(testId).exec();
    if (!test) return null;

    test.status = 'running';
    await test.save();
    logger.info(`Variation test started: ${testId}`);
    return test;
  }

  async pauseTest(testId: string): Promise<ICreativeVariation | null> {
    const test = await CreativeVariation.findById(testId).exec();
    if (!test) return null;

    test.status = 'paused';
    await test.save();
    logger.info(`Variation test paused: ${testId}`);
    return test;
  }

  async endTest(testId: string): Promise<ICreativeVariation | null> {
    const test = await CreativeVariation.findById(testId).exec();
    if (!test) return null;

    // Calculate results
    test.status = 'completed';
    test.results = this.calculateResults(test);
    await test.save();
    logger.info(`Variation test ended: ${testId}`);
    return test;
  }

  private calculateResults(test: ICreativeVariation): any {
    // Mock results calculation - in production, would use actual metrics
    const control = test.variations[0];
    const treatment = test.variations[1];

    if (!control || !treatment) return null;

    // Simulated CTR values
    const controlCTR = 2.5 + Math.random() * 0.5;
    const treatmentCTR = 2.8 + Math.random() * 0.8;

    const uplift = ((treatmentCTR - controlCTR) / controlCTR) * 100;
    const statisticalSignificance = 0.85 + Math.random() * 0.1;
    const winner = treatmentCTR > controlCTR ? treatment.variantId : control.variantId;

    return {
      controlCTR: Math.round(controlCTR * 100) / 100,
      treatmentCTR: Math.round(treatmentCTR * 100) / 100,
      statisticalSignificance: Math.round(statisticalSignificance * 100) / 100,
      confidenceLevel: statisticalSignificance >= 0.95 ? 'high' : statisticalSignificance >= 0.8 ? 'medium' : 'low',
      winner,
      uplift: Math.round(uplift * 100) / 100
    };
  }

  async updateVariantMetrics(testId: string, dto: UpdateVariationMetricsDto): Promise<ICreativeVariation | null> {
    const test = await CreativeVariation.findById(testId).exec();
    if (!test) return null;

    const variant = test.variations.find(v => v.variantId === dto.variantId);
    if (!variant) throw new Error('Variant not found');

    // Update metrics would be stored separately
    logger.info(`Variant metrics updated: ${testId}/${dto.variantId}`);
    return test;
  }

  async getTestById(testId: string): Promise<ICreativeVariation | null> {
    return CreativeVariation.findById(testId).exec();
  }

  async listTests(filters: {
    creativeId?: string;
    status?: string;
    testType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tests: ICreativeVariation[]; total: number }> {
    const { creativeId, status, testType, page = 1, limit = 20 } = filters;

    const query: Record<string, any> = {};
    if (creativeId) query.creativeId = creativeId;
    if (status) query.status = status;
    if (testType) query.testType = testType;

    const [tests, total] = await Promise.all([
      CreativeVariation.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      CreativeVariation.countDocuments(query)
    ]);

    return { tests, total };
  }

  async getWinningVariant(testId: string): Promise<{ variant: any; test: ICreativeVariation } | null> {
    const test = await CreativeVariation.findById(testId).exec();
    if (!test || test.status !== 'completed') return null;

    if (!test.results?.winner) return null;

    const winner = test.variations.find(v => v.variantId === test.results?.winner);
    if (!winner) return null;

    return { variant: winner, test };
  }

  async applyWinner(testId: string, creativeId: string): Promise<boolean> {
    const winnerData = await this.getWinningVariant(testId);
    if (!winnerData) return false;

    try {
      const creative = await Creative.findById(creativeId).exec();
      if (!creative) return false;

      // Update creative with winning variant content
      creative.content = {
        ...creative.content,
        ...winnerData.variant.content
      };
      await creative.save();

      // Mark winner
      const test = await CreativeVariation.findById(testId).exec();
      if (test) {
        const variant = test.variations.find(v => v.variantId === winnerData.variant.variantId);
        if (variant) {
          variant.status = 'winner';
        }
        await test.save();
      }

      logger.info(`Winner applied to creative: ${creativeId}`);
      return true;
    } catch (error) {
      logger.error('Failed to apply winner:', error);
      return false;
    }
  }

  async getTestPerformance(testId: string): Promise<{
    test: ICreativeVariation;
    variantPerformance: Array<{
      variantId: string;
      name: string;
      impressions: number;
      clicks: number;
      ctr: number;
      conversions: number;
      cvr: number;
      status: string;
    }>;
  } | null> {
    const test = await CreativeVariation.findById(testId).exec();
    if (!test) return null;

    // Mock performance data
    const variantPerformance = test.variations.map(v => ({
      variantId: v.variantId,
      name: v.name,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      clicks: Math.floor(Math.random() * 500) + 50,
      ctr: 0,
      conversions: Math.floor(Math.random() * 50) + 5,
      cvr: 0,
      status: v.status
    }));

    // Calculate CTR and CVR
    variantPerformance.forEach(v => {
      v.ctr = v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0;
      v.cvr = v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0;
    });

    return { test, variantPerformance };
  }

  async getActiveTestsForCreative(creativeId: string): Promise<ICreativeVariation[]> {
    return CreativeVariation.find({
      creativeId,
      status: 'running'
    }).exec();
  }

  async deleteTest(testId: string): Promise<boolean> {
    const result = await CreativeVariation.findByIdAndDelete(testId).exec();
    return !!result;
  }
}

export const variationService = new VariationService();