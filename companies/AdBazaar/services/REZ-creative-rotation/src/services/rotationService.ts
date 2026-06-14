import { v4 as uuidv4 } from 'uuid';
import {
  Creative,
  RotationConfig,
  RotationDecision,
  RotationMode,
  CreativeStatus,
  CreateCreativeInput,
  UpdateCreativeInput,
  EpsilonGreedyResult,
  ThompsonSamplingResult,
  PerformanceBasedResult
} from '../types';
import logger from '../utils/logger';

class RotationService {
  private creatives: Map<string, Creative> = new Map();
  private configs: Map<string, RotationConfig> = new Map();
  private decisions: Map<string, RotationDecision> = new Map();
  private adSetCreatives: Map<string, Set<string>> = new Map();

  // Creative Management
  createCreative(input: CreateCreativeInput): Creative {
    const id = uuidv4();
    const now = new Date();

    const creative: Creative = {
      id,
      adSetId: input.adSetId,
      name: input.name,
      creativeUrl: input.creativeUrl,
      creativeHash: input.creativeHash,
      status: CreativeStatus.ACTIVE,
      weight: input.weight ?? 1,
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        cost: 0
      },
      performance: {
        ctr: 0,
        cvr: 0,
        roas: 0,
        confidence: 0
      },
      createdAt: now,
      updatedAt: now
    };

    this.creatives.set(id, creative);

    const adSetKey = input.adSetId;
    const creativeIds = this.adSetCreatives.get(adSetKey) || new Set();
    creativeIds.add(id);
    this.adSetCreatives.set(adSetKey, creativeIds);

    logger.info(`Creative created: ${id}, adSet: ${input.adSetId}`);
    return creative;
  }

  getCreative(id: string): Creative | undefined {
    return this.creatives.get(id);
  }

  getCreativesForAdSet(adSetId: string): Creative[] {
    const creativeIds = this.adSetCreatives.get(adSetId) || new Set();
    const result: Creative[] = [];

    creativeIds.forEach(id => {
      const creative = this.creatives.get(id);
      if (creative) result.push(creative);
    });

    return result.filter(c => c.status === CreativeStatus.ACTIVE);
  }

  updateCreative(id: string, input: UpdateCreativeInput): Creative | undefined {
    const creative = this.creatives.get(id);
    if (!creative) return undefined;

    const updated: Creative = {
      ...creative,
      name: input.name ?? creative.name,
      creativeUrl: input.creativeUrl ?? creative.creativeUrl,
      creativeHash: input.creativeHash ?? creative.creativeHash,
      status: input.status ?? creative.status,
      weight: input.weight ?? creative.weight,
      updatedAt: new Date()
    };

    this.creatives.set(id, updated);
    logger.info(`Creative updated: ${id}`);
    return updated;
  }

  deleteCreative(id: string): boolean {
    const creative = this.creatives.get(id);
    if (!creative) return false;

    const creativeIds = this.adSetCreatives.get(creative.adSetId);
    if (creativeIds) {
      creativeIds.delete(id);
    }

    return this.creatives.delete(id);
  }

  // Metrics Recording
  recordImpression(creativeId: string): void {
    const creative = this.creatives.get(creativeId);
    if (!creative) return;

    creative.metrics.impressions++;
    this.updatePerformanceMetrics(creative);
    this.creatives.set(creativeId, creative);
  }

  recordClick(creativeId: string): void {
    const creative = this.creatives.get(creativeId);
    if (!creative) return;

    creative.metrics.clicks++;
    this.updatePerformanceMetrics(creative);
    this.creatives.set(creativeId, creative);
  }

  recordConversion(creativeId: string, revenue: number = 0): void {
    const creative = this.creatives.get(creativeId);
    if (!creative) return;

    creative.metrics.conversions++;
    creative.metrics.revenue += revenue;
    this.updatePerformanceMetrics(creative);
    this.creatives.set(creativeId, creative);
  }

  private updatePerformanceMetrics(creative: Creative): void {
    const { impressions, clicks, conversions, revenue } = creative.metrics;

    // Calculate CTR
    creative.performance.ctr = impressions > 0 ? clicks / impressions : 0;

    // Calculate CVR
    creative.performance.cvr = clicks > 0 ? conversions / clicks : 0;

    // Calculate ROAS
    creative.performance.roas = creative.metrics.cost > 0
      ? revenue / creative.metrics.cost
      : revenue > 0 && impressions > 0
        ? revenue / (impressions * 0.001) // Estimated CPM of $1
        : 0;

    // Calculate confidence based on sample size
    const minSamples = 1000;
    creative.performance.confidence = Math.min(1, impressions / minSamples);
  }

  // Rotation Config Management
  createConfig(input: Omit<RotationConfig, 'id' | 'createdAt' | 'updatedAt'>): RotationConfig {
    const id = uuidv4();
    const now = new Date();

    const config: RotationConfig = {
      ...input,
      id,
      rotationStartDate: new Date(input.rotationStartDate),
      rotationEndDate: input.rotationEndDate ? new Date(input.rotationEndDate) : undefined,
      createdAt: now,
      updatedAt: now
    };

    this.configs.set(id, config);
    logger.info(`Rotation config created: ${id}, mode: ${input.mode}`);
    return config;
  }

  getConfig(id: string): RotationConfig | undefined {
    return this.configs.get(id);
  }

  getConfigForAdSet(adSetId: string): RotationConfig | undefined {
    let found: RotationConfig | undefined;
    this.configs.forEach(config => {
      if (config.adSetId === adSetId && config.isActive) {
        found = config;
      }
    });
    return found;
  }

  updateConfig(id: string, updates: Partial<RotationConfig>): RotationConfig | undefined {
    const config = this.configs.get(id);
    if (!config) return undefined;

    const updated: RotationConfig = {
      ...config,
      ...updates,
      id: config.id,
      rotationStartDate: updates.rotationStartDate
        ? new Date(updates.rotationStartDate)
        : config.rotationStartDate,
      rotationEndDate: updates.rotationEndDate
        ? new Date(updates.rotationEndDate)
        : config.rotationEndDate,
      updatedAt: new Date()
    };

    this.configs.set(id, updated);
    logger.info(`Rotation config updated: ${id}`);
    return updated;
  }

  deleteConfig(id: string): boolean {
    return this.configs.delete(id);
  }

  // Rotation Algorithms

  // Epsilon-Greedy Algorithm
  selectCreativeEpsilonGreedy(
    adSetId: string,
    epsilon: number = 0.1
  ): EpsilonGreedyResult {
    const creatives = this.getCreativesForAdSet(adSetId);
    if (creatives.length === 0) {
      throw new Error('No active creatives for this ad set');
    }

    const isExploration = Math.random() < epsilon;
    let selectedId: string;
    const creativeProbabilities: Record<string, number> = {};

    if (isExploration) {
      // Random selection for exploration
      const randomIndex = Math.floor(Math.random() * creatives.length);
      selectedId = creatives[randomIndex].id;

      // Equal probability during exploration
      creatives.forEach(c => {
        creativeProbabilities[c.id] = 1 / creatives.length;
      });
    } else {
      // Exploitation: select based on performance
      const totalWeight = creatives.reduce((sum, c) => sum + (c.performance.ctr || 0.001), 0);
      let rand = Math.random() * totalWeight;

      for (const creative of creatives) {
        const weight = creative.performance.ctr || 0.001;
        rand -= weight;
        if (rand <= 0) {
          selectedId = creative.id;
          break;
        }
      }
      selectedId = selectedId || creatives[0].id;

      // Calculate probabilities
      creatives.forEach(c => {
        const weight = c.performance.ctr || 0.001;
        creativeProbabilities[c.id] = weight / totalWeight;
      });
    }

    return {
      selectedCreativeId: selectedId!,
      isExploration,
      epsilon,
      creativeProbabilities
    };
  }

  // Thompson Sampling Algorithm
  selectCreativeThompsonSampling(adSetId: string): ThompsonSamplingResult {
    const creatives = this.getCreativesForAdSet(adSetId);
    if (creatives.length === 0) {
      throw new Error('No active creatives for this ad set');
    }

    const sampledValues: Record<string, number> = {};
    const alpha = 1; // Successes (clicks)
    const beta = 1;  // Failures (impressions - clicks)

    // Sample from Beta distribution for each creative
    creatives.forEach(creative => {
      const successes = creative.metrics.clicks + alpha;
      const failures = Math.max(1, creative.metrics.impressions - creative.metrics.clicks) + beta;
      sampledValues[creative.id] = this.sampleBeta(successes, failures);
    });

    // Select creative with highest sampled value
    let maxValue = -1;
    let selectedId = creatives[0].id;
    Object.entries(sampledValues).forEach(([id, value]) => {
      if (value > maxValue) {
        maxValue = value;
        selectedId = id;
      }
    });

    // Calculate probabilities based on sample counts
    const totalSamples = creatives.reduce((sum, c) => sum + c.metrics.impressions, 0);
    const creativeProbabilities: Record<string, number> = {};
    creatives.forEach(c => {
      creativeProbabilities[c.id] = c.metrics.impressions / totalSamples;
    });

    return {
      selectedCreativeId: selectedId,
      sampledValues,
      creativeProbabilities
    };
  }

  // Beta distribution sampling using approximation
  private sampleBeta(alpha: number, beta: number): number {
    // Using Gamma distribution approximation
    const gammaA = this.sampleGamma(alpha);
    const gammaB = this.sampleGamma(beta);
    return gammaA / (gammaA + gammaB);
  }

  private sampleGamma(shape: number): number {
    // Simple approximation for gamma distribution
    if (shape < 1) {
      return -Math.log(Math.random()) * shape;
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x: number, v: number;
      do {
        x = this.normalRandom();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  private normalRandom(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // Performance-Based Selection
  selectCreativePerformanceBased(adSetId: string, metric: 'ctr' | 'cvr' | 'roas' = 'ctr'): PerformanceBasedResult {
    const creatives = this.getCreativesForAdSet(adSetId);
    if (creatives.length === 0) {
      throw new Error('No active creatives for this ad set');
    }

    // Filter creatives with minimum impressions for statistical significance
    const qualifiedCreatives = creatives.filter(c => c.metrics.impressions >= 100);
    if (qualifiedCreatives.length === 0) {
      // Fall back to equal weights if no qualified creatives
      const weights: Record<string, number> = {};
      const equalWeight = 1 / creatives.length;
      creatives.forEach(c => weights[c.id] = equalWeight);
      return {
        selectedCreativeId: creatives[0].id,
        creativeWeights: weights,
        reason: 'No statistically significant creatives, using equal weights'
      };
    }

    // Calculate weights based on performance
    const creativeWeights: Record<string, number> = {};
    let totalWeight = 0;

    qualifiedCreatives.forEach(creative => {
      let metricValue: number;
      switch (metric) {
        case 'ctr':
          metricValue = creative.performance.ctr;
          break;
        case 'cvr':
          metricValue = creative.performance.cvr;
          break;
        case 'roas':
          metricValue = creative.performance.roas;
          break;
        default:
          metricValue = creative.performance.ctr;
      }

      // Apply confidence bonus
      const confidenceBonus = 0.1 + 0.9 * creative.performance.confidence;
      const weight = Math.max(0.001, metricValue) * confidenceBonus;
      creativeWeights[creative.id] = weight;
      totalWeight += weight;
    });

    // Normalize weights
    Object.keys(creativeWeights).forEach(id => {
      creativeWeights[id] = creativeWeights[id] / totalWeight;
    });

    // Weighted random selection
    let rand = Math.random();
    let selectedId = qualifiedCreatives[0].id;
    for (const creative of qualifiedCreatives) {
      rand -= creativeWeights[creative.id];
      if (rand <= 0) {
        selectedId = creative.id;
        break;
      }
    }

    return {
      selectedCreativeId: selectedId,
      creativeWeights,
      reason: `Selected based on ${metric} with confidence adjustment`
    };
  }

  // A/B Test Rotation
  selectCreativeABTest(adSetId: string, distribution?: Record<string, number>): { selectedCreativeId: string; probabilities: Record<string, number> } {
    const creatives = this.getCreativesForAdSet(adSetId);
    if (creatives.length === 0) {
      throw new Error('No active creatives for this ad set');
    }

    const probabilities: Record<string, number> = {};

    if (distribution) {
      // Use predefined distribution
      Object.assign(probabilities, distribution);
    } else {
      // Equal distribution
      const equalProb = 1 / creatives.length;
      creatives.forEach(c => {
        probabilities[c.id] = equalProb;
      });
    }

    // Weighted random selection
    let rand = Math.random();
    let selectedId = creatives[0].id;
    for (const creative of creatives) {
      rand -= probabilities[creative.id] || 0;
      if (rand <= 0) {
        selectedId = creative.id;
        break;
      }
    }

    return { selectedCreativeId: selectedId, probabilities };
  }

  // Main selection method based on config
  selectCreative(adSetId: string, userId?: string): RotationDecision {
    const config = this.getConfigForAdSet(adSetId);
    if (!config) {
      // Default to performance-based
      const result = this.selectCreativePerformanceBased(adSetId);
      return this.createDecision(adSetId, userId, result.selectedCreativeId, RotationMode.PERFORMANCE_BASED, 0.5);
    }

    let result: { selectedCreativeId: string; creativeProbabilities?: Record<string, number> };
    let confidence = 0.5;

    switch (config.mode) {
      case RotationMode.EPSILON_GREEDY:
        const egResult = this.selectCreativeEpsilonGreedy(adSetId, config.epsilon);
        result = { selectedCreativeId: egResult.selectedCreativeId, creativeProbabilities: egResult.creativeProbabilities };
        confidence = egResult.isExploration ? 0.3 : 0.7;
        break;

      case RotationMode.THOMPSON_SAMPLING:
        const tsResult = this.selectCreativeThompsonSampling(adSetId);
        result = { selectedCreativeId: tsResult.selectedCreativeId, creativeProbabilities: tsResult.creativeProbabilities };
        confidence = 0.8;
        break;

      case RotationMode.PERFORMANCE_BASED:
        const pbResult = this.selectCreativePerformanceBased(adSetId);
        result = { selectedCreativeId: pbResult.selectedCreativeId, creativeProbabilities: pbResult.creativeWeights };
        confidence = 0.7;
        break;

      case RotationMode.AB_TEST:
        const abResult = this.selectCreativeABTest(adSetId, config.abTestDistribution);
        result = { selectedCreativeId: abResult.selectedCreativeId, creativeProbabilities: abResult.probabilities };
        confidence = 0.9;
        break;

      default:
        result = { selectedCreativeId: this.getCreativesForAdSet(adSetId)[0]?.id || '' };
    }

    const decision = this.createDecision(
      adSetId,
      userId,
      result.selectedCreativeId,
      config.mode,
      confidence,
      Object.entries(result.creativeProbabilities || {}).map(([creativeId, probability]) => ({
        creativeId,
        probability
      }))
    );

    // Record the decision
    this.decisions.set(decision.id, decision);

    return decision;
  }

  private createDecision(
    adSetId: string,
    userId: string | undefined,
    selectedCreativeId: string,
    rotationMode: RotationMode,
    confidence: number,
    alternativeCreatives: Array<{ creativeId: string; probability: number }> = []
  ): RotationDecision {
    return {
      id: uuidv4(),
      adSetId,
      userId: userId || 'anonymous',
      selectedCreativeId,
      rotationMode,
      confidence,
      alternativeCreatives,
      timestamp: new Date()
    };
  }

  // Get rotation performance
  getRotationPerformance(adSetId: string): {
    creatives: Array<{
      id: string;
      name: string;
      impressions: number;
      clicks: number;
      ctr: number;
      conversions: number;
      cvr: number;
      roas: number;
      weight: number;
    }>;
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    winningCreativeId: string | null;
  } {
    const creatives = this.getCreativesForAdSet(adSetId);

    const creativeStats = creatives.map(c => ({
      id: c.id,
      name: c.name,
      impressions: c.metrics.impressions,
      clicks: c.metrics.clicks,
      ctr: c.performance.ctr,
      conversions: c.metrics.conversions,
      cvr: c.performance.cvr,
      roas: c.performance.roas,
      weight: c.weight
    }));

    const totalImpressions = creativeStats.reduce((sum, c) => sum + c.impressions, 0);
    const totalClicks = creativeStats.reduce((sum, c) => sum + c.clicks, 0);
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    // Find winner based on CTR with minimum impressions
    const qualified = creativeStats.filter(c => c.impressions >= 500);
    const winner = qualified.length > 0
      ? qualified.reduce((best, c) => c.ctr > best.ctr ? c : best)
      : null;

    return {
      creatives: creativeStats,
      totalImpressions,
      totalClicks,
      avgCtr,
      winningCreativeId: winner?.id || null
    };
  }
}

export default new RotationService();
