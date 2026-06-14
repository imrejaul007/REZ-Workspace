import { v4 as uuidv4 } from 'uuid';
import { Computation } from '../models/Computation.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuditAction, ComputationType, ComputationStatus, PrivacyParams, DifferentialPrivacyConfig } from '../types/index.js';
import { logger, privacyLogger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export interface DifferentialPrivacyInput {
  computationId?: string;
  query: {
    type: 'count' | 'sum' | 'mean' | 'variance' | 'histogram';
    column?: string;
    filters?: Record<string, unknown>;
  };
  privacyParams: PrivacyParams;
  datasetSize: number;
  rawData?: number[];
}

export interface DifferentialPrivacyOutput {
  computationId: string;
  status: ComputationStatus;
  noisyResult: number | Record<string, number>;
  trueResult: number | Record<string, number> | null;
  privacyParams: PrivacyParams;
  privacyBudgetUsed: number;
  compositionCount: number;
}

export class DifferentialPrivacyService {
  /**
   * Differential Privacy computation
   * Implements Laplace, Gaussian, and Exponential mechanisms
   */
  async compute(input: DifferentialPrivacyInput): Promise<DifferentialPrivacyOutput> {
    const startTime = Date.now();
    const computationId = input.computationId || uuidv4();

    logger.info('Starting differential privacy computation', {
      computationId,
      queryType: input.query.type,
      epsilon: input.privacyParams.epsilon,
    });

    try {
      // Create computation record
      const computation = await Computation.create({
        computationId,
        type: ComputationType.DIFFERENTIAL_PRIVACY,
        status: ComputationStatus.PENDING,
        participants: [],
        privacyParams: input.privacyParams,
        config: {
          queryType: input.query.type,
          datasetSize: input.datasetSize,
        },
      });

      await this.logAudit(computationId, AuditAction.COMPUTATION_CREATED, 'system', {
        queryType: input.query.type,
        privacyParams: input.privacyParams,
      });

      // Update status
      computation.status = ComputationStatus.RUNNING;
      computation.startedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_STARTED, 'system', {});

      // Calculate true result
      const trueResult = await this.calculateTrueResult(input);

      // Add noise based on mechanism
      const noisyResult = await this.addNoise(
        trueResult,
        input.privacyParams,
        input.query.type
      );

      // Update privacy budget tracking
      const privacyBudgetUsed = this.calculatePrivacyBudgetUsed(
        input.privacyParams,
        input.query.type
      );

      // Update computation
      computation.status = ComputationStatus.COMPLETED;
      computation.result = {
        noisyResult,
        trueResult,
        privacyBudgetUsed,
        compositionCount: 1,
      };
      computation.completedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_COMPLETED, 'system', {
        noisyResult,
        privacyBudgetUsed,
      });

      await this.logAudit(computationId, AuditAction.PRIVACY_BUDGET_UPDATED, 'system', {
        epsilon: input.privacyParams.epsilon,
        budgetUsed: privacyBudgetUsed,
      });

      metrics.differentialPrivacyQueriesTotal.labels(input.query.type, input.privacyParams.mechanism).inc();
      metrics.computationsTotal.labels('differential_privacy', 'completed').inc();
      metrics.computationDuration.labels('differential_privacy').observe((Date.now() - startTime) / 1000);
      metrics.privacyBudgetUsed.labels(computationId).set(privacyBudgetUsed);

      privacyLogger.info('Differential privacy computation completed', {
        computationId,
        queryType: input.query.type,
        privacyBudgetUsed,
      });

      return {
        computationId,
        status: ComputationStatus.COMPLETED,
        noisyResult,
        trueResult,
        privacyParams: input.privacyParams,
        privacyBudgetUsed,
        compositionCount: 1,
      };
    } catch (error) {
      logger.error('Differential privacy computation failed', {
        computationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await Computation.findOneAndUpdate(
        { computationId },
        {
          status: ComputationStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      await this.logAudit(computationId, AuditAction.COMPUTATION_FAILED, 'system', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      metrics.computationsTotal.labels('differential_privacy', 'failed').inc();

      throw error;
    }
  }

  /**
   * Calculate true result based on query type
   */
  private async calculateTrueResult(input: DifferentialPrivacyInput): Promise<number | Record<string, number>> {
    const data = input.rawData || this.generateSimulatedData(input.datasetSize);

    switch (input.query.type) {
      case 'count':
        return data.length;

      case 'sum':
        return data.reduce((sum, val) => sum + val, 0);

      case 'mean':
        return data.reduce((sum, val) => sum + val, 0) / data.length;

      case 'variance':
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;

      case 'histogram':
        return this.calculateHistogram(data);

      default:
        return data.length;
    }
  }

  /**
   * Generate simulated data for testing
   */
  private generateSimulatedData(size: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < size; i++) {
      // Generate data with normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      data.push(Math.round(z * 10 + 50)); // Mean 50, std 10
    }
    return data;
  }

  /**
   * Calculate histogram
   */
  private calculateHistogram(data: number[]): Record<string, number> {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binCount = Math.min(10, Math.ceil(Math.sqrt(data.length)));
    const binWidth = (max - min) / binCount || 1;

    const histogram: Record<string, number> = {};

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const binKey = `${Math.round(binStart)}-${Math.round(binEnd)}`;
      histogram[binKey] = 0;
    }

    for (const value of data) {
      const binIndex = Math.min(
        Math.floor((value - min) / binWidth),
        binCount - 1
      );
      const binStart = min + binIndex * binWidth;
      const binEnd = binStart + binWidth;
      const binKey = `${Math.round(binStart)}-${Math.round(binEnd)}`;
      histogram[binKey]++;
    }

    return histogram;
  }

  /**
   * Add noise based on privacy mechanism
   */
  private async addNoise(
    trueResult: number | Record<string, number>,
    privacyParams: PrivacyParams,
    queryType: string
  ): Promise<number | Record<string, number>> {
    const { epsilon, delta, sensitivity, mechanism } = privacyParams;

    if (typeof trueResult === 'object') {
      // Add noise to histogram bins
      const noisyHistogram: Record<string, number> = {};
      for (const [key, count] of Object.entries(trueResult)) {
        noisyHistogram[key] = this.addNoiseToValue(count, epsilon, sensitivity, mechanism);
      }
      return noisyHistogram;
    }

    return this.addNoiseToValue(trueResult, epsilon, sensitivity, mechanism);
  }

  /**
   * Add noise to a single value
   */
  private addNoiseToValue(
    value: number,
    epsilon: number,
    sensitivity: number,
    mechanism: 'laplace' | 'gaussian' | 'exponential'
  ): number {
    let noise: number;

    switch (mechanism) {
      case 'laplace':
        noise = this.generateLaplaceNoise(sensitivity / epsilon);
        metrics.noiseGenerated.labels('laplace').inc();
        break;

      case 'gaussian':
        noise = this.generateGaussianNoise(sensitivity, epsilon, delta || 1e-5);
        metrics.noiseGenerated.labels('gaussian').inc();
        break;

      case 'exponential':
        noise = this.generateExponentialNoise(sensitivity / epsilon);
        metrics.noiseGenerated.labels('exponential').inc();
        break;

      default:
        noise = this.generateLaplaceNoise(sensitivity / epsilon);
        metrics.noiseGenerated.labels('laplace').inc();
    }

    return value + noise;
  }

  /**
   * Generate Laplace noise
   */
  private generateLaplaceNoise(scale: number): number {
    const u = Math.random() - 0.5;
    return scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Generate Gaussian noise for (epsilon, delta)-differential privacy
   */
  private generateGaussianNoise(sensitivity: number, epsilon: number, delta: number): number {
    // Standard deviation for Gaussian mechanism
    // sigma >= sqrt(2 * ln(1.25/delta)) * sensitivity / epsilon
    const sigma = (sensitivity / epsilon) * Math.sqrt(2 * Math.log(1.25 / delta));

    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    return sigma * z;
  }

  /**
   * Generate Exponential noise for privacy-preserving histogram release
   */
  private generateExponentialNoise(scale: number): number {
    const u = Math.random();
    return -scale * Math.log(u);
  }

  /**
   * Calculate privacy budget used
   */
  private calculatePrivacyBudgetUsed(
    privacyParams: PrivacyParams,
    queryType: string
  ): number {
    // Simple composition - each query uses full epsilon
    return privacyParams.epsilon;
  }

  /**
   * Compose multiple queries (basic composition)
   */
  async composeQueries(
    queries: DifferentialPrivacyInput[],
    compositionStrategy: 'basic' | 'advanced' = 'basic'
  ): Promise<number> {
    if (compositionStrategy === 'basic') {
      // Basic composition: sum of epsilons
      return queries.reduce((sum, q) => sum + q.privacyParams.epsilon, 0);
    }

    // Advanced composition would use advanced composition theorems
    // For now, use basic composition
    return queries.reduce((sum, q) => sum + q.privacyParams.epsilon, 0);
  }

  /**
   * Check if privacy budget is exhausted
   */
  async checkPrivacyBudget(
    totalBudget: number,
    usedBudget: number,
    newQueryCost: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const remaining = totalBudget - usedBudget;
    return {
      allowed: remaining >= newQueryCost,
      remaining,
    };
  }

  /**
   * Log audit entry
   */
  private async logAudit(
    computationId: string,
    action: AuditAction,
    actor: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await AuditLog.create({
      computationId,
      action,
      actor,
      details,
      timestamp: new Date(),
    });

    metrics.auditLogsTotal.labels(action).inc();
  }

  /**
   * Get differential privacy computation status
   */
  async getStatus(computationId: string): Promise<Computation | null> {
    return Computation.findOne({ computationId });
  }
}

export const differentialPrivacyService = new DifferentialPrivacyService();
export default differentialPrivacyService;