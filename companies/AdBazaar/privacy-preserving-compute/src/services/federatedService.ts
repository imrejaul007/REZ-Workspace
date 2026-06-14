import { v4 as uuidv4 } from 'uuid';
import { Computation, IComputation } from '../models/Computation.js';
import { FederatedResult, IFederatedResult } from '../models/FederatedResult.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuditAction, ComputationType, ComputationStatus, FederatedConfig } from '../types/index.js';
import { logger, privacyLogger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export interface FederatedInput {
  computationId?: string;
  modelId: string;
  participants: string[];
  config?: Partial<FederatedConfig>;
  initialModel?: number[];
}

export interface FederatedOutput {
  computationId: string;
  status: ComputationStatus;
  rounds: number;
  completedRounds: number;
  finalModel: number[] | null;
  aggregationMethod: string;
  privacyMechanism: string;
}

export class FederatedService {
  /**
   * Federated Learning computation
   * Implements FedAvg, FedMed, and FedOpt aggregation strategies
   */
  async compute(input: FederatedInput): Promise<FederatedOutput> {
    const startTime = Date.now();
    const computationId = input.computationId || uuidv4();

    logger.info('Starting federated learning computation', {
      computationId,
      modelId: input.modelId,
      participants: input.participants.length,
    });

    try {
      // Create computation record
      const computation = await Computation.create({
        computationId,
        type: ComputationType.FEDERATED,
        status: ComputationStatus.PENDING,
        participants: input.participants,
        privacyParams: {
          epsilon: input.config?.privacyBudget ?? 1.0,
          delta: 1e-5,
          sensitivity: input.config?.clipNorm ?? 1.0,
          mechanism: 'laplace',
        },
        config: input.config || {},
      });

      // Log audit
      await this.logAudit(computationId, AuditAction.COMPUTATION_CREATED, 'system', {
        participants: input.participants,
        config: input.config,
      });

      // Update status to running
      computation.status = ComputationStatus.RUNNING;
      computation.startedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_STARTED, 'system', {});

      // Create federated result record
      const federatedResult = await FederatedResult.create({
        computationId,
        rounds: [],
        aggregationMethod: input.config?.aggregationStrategy || 'fedavg',
        privacyMechanism: 'differential_privacy',
        totalRounds: input.config?.rounds || 10,
      });

      // Execute federated rounds
      const rounds = input.config?.rounds || 10;
      const minParticipants = input.config?.minParticipants || 2;
      const aggregationStrategy = input.config?.aggregationStrategy || 'fedavg';

      for (let round = 1; round <= rounds; round++) {
        logger.info(`Federated round ${round}/${rounds}`, { computationId });

        // Simulate gradient collection from participants
        const gradients = await this.collectGradients(
          computationId,
          input.participants,
          round,
          input.config?.clipNorm || 1.0
        );

        // Check if we have enough participants
        if (gradients.length < minParticipants) {
          logger.warn('Insufficient participants for round', {
            computationId,
            round,
            required: minParticipants,
            available: gradients.length,
          });
          break;
        }

        // Aggregate gradients based on strategy
        const aggregatedGradient = await this.aggregateGradients(
          gradients,
          aggregationStrategy
        );

        // Add noise for differential privacy
        const noisyGradient = await this.addDifferentialPrivacyNoise(
          aggregatedGradient,
          input.config?.privacyBudget || 1.0,
          input.config?.clipNorm || 1.0
        );

        // Record round
        federatedResult.rounds.push({
          roundNumber: round,
          participants: input.participants,
          gradients: gradients.reduce((acc, g, i) => {
            acc[`participant_${i}`] = g;
            return acc;
          }, {} as Record<string, number[]>),
          aggregatedGradient: noisyGradient,
          timestamp: new Date(),
        });

        federatedResult.completedRounds = round;
        await federatedResult.save();

        await this.logAudit(computationId, AuditAction.ROUND_COMPLETED, 'system', {
          round,
          participants: gradients.length,
        });

        metrics.federatedRoundsTotal.labels('completed').inc();
      }

      // Final model
      const lastRound = federatedResult.rounds[federatedResult.rounds.length - 1];
      federatedResult.finalModel = lastRound?.aggregatedGradient || null;
      federatedResult.completedAt = new Date();
      await federatedResult.save();

      // Update computation status
      computation.status = ComputationStatus.COMPLETED;
      computation.result = {
        roundsCompleted: federatedResult.completedRounds,
        finalModel: federatedResult.finalModel,
        aggregationMethod: federatedResult.aggregationMethod,
      };
      computation.completedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_COMPLETED, 'system', {
        rounds: federatedResult.completedRounds,
      });

      metrics.computationsTotal.labels('federated', 'completed').inc();
      metrics.computationDuration.labels('federated').observe((Date.now() - startTime) / 1000);

      privacyLogger.info('Federated learning completed', {
        computationId,
        rounds: federatedResult.completedRounds,
        participants: input.participants.length,
      });

      return {
        computationId,
        status: ComputationStatus.COMPLETED,
        rounds: federatedResult.totalRounds,
        completedRounds: federatedResult.completedRounds,
        finalModel: federatedResult.finalModel,
        aggregationMethod: federatedResult.aggregationMethod,
        privacyMechanism: federatedResult.privacyMechanism,
      };
    } catch (error) {
      logger.error('Federated learning computation failed', {
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

      metrics.computationsTotal.labels('federated', 'failed').inc();

      throw error;
    }
  }

  /**
   * Collect gradients from participants
   */
  private async collectGradients(
    computationId: string,
    participants: string[],
    round: number,
    clipNorm: number
  ): Promise<number[][]> {
    // Simulate gradient collection
    // In production, this would fetch from actual participant nodes
    const gradients: number[][] = [];

    for (const participant of participants) {
      // Simulate having gradient data (in production, fetch from participant)
      const gradient = this.generateSimulatedGradient(10, round);

      // Clip gradient
      const clippedGradient = this.clipGradient(gradient, clipNorm);

      gradients.push(clippedGradient);
      metrics.federatedGradientsReceived.inc();
    }

    return gradients;
  }

  /**
   * Generate simulated gradient (in production, fetch from actual participants)
   */
  private generateSimulatedGradient(size: number, round: number): number[] {
    const gradient: number[] = [];
    for (let i = 0; i < size; i++) {
      // Generate gradient values with decreasing magnitude over rounds
      const baseValue = Math.sin(round + i) * 0.5;
      const noise = (Math.random() - 0.5) * 0.1;
      gradient.push(baseValue + noise);
    }
    return gradient;
  }

  /**
   * Clip gradient to prevent gradient leakage
   */
  private clipGradient(gradient: number[], clipNorm: number): number[] {
    const norm = Math.sqrt(gradient.reduce((sum, g) => sum + g * g, 0));

    if (norm > clipNorm) {
      const scale = clipNorm / norm;
      return gradient.map(g => g * scale);
    }

    return gradient;
  }

  /**
   * Aggregate gradients using specified strategy
   */
  private async aggregateGradients(
    gradients: number[][],
    strategy: 'fedavg' | 'fedmed' | 'fedopt'
  ): Promise<number[]> {
    const dimension = gradients[0].length;

    switch (strategy) {
      case 'fedavg':
        // Federated Averaging - simple mean
        return this.federatedAverage(gradients);

      case 'fedmed':
        // Federated Median - more robust to outliers
        return this.federatedMedian(gradients);

      case 'fedopt':
        // Federated Optimizer - adaptive learning rate
        return this.federatedOpt(gradients);

      default:
        return this.federatedAverage(gradients);
    }
  }

  /**
   * Federated Averaging (FedAvg)
   */
  private federatedAverage(gradients: number[][]): number[] {
    const dimension = gradients[0].length;
    const result = new Array(dimension).fill(0);

    for (const gradient of gradients) {
      for (let i = 0; i < dimension; i++) {
        result[i] += gradient[i] / gradients.length;
      }
    }

    return result;
  }

  /**
   * Federated Median (FedMed) - more robust
   */
  private federatedMedian(gradients: number[][]): number[] {
    const dimension = gradients[0].length;
    const result: number[] = [];

    for (let i = 0; i < dimension; i++) {
      const values = gradients.map(g => g[i]).sort((a, b) => a - b);
      const median = values[Math.floor(values.length / 2)];
      result.push(median);
    }

    return result;
  }

  /**
   * Federated Optimizer (FedOpt) - adaptive
   */
  private federatedOpt(gradients: number[][]): number[] {
    // Combine FedAvg with momentum
    const dimension = gradients[0].length;
    const result = new Array(dimension).fill(0);

    // Weighted average with adaptive weights
    const weights = gradients.map(() => 1 / gradients.length);

    for (let i = 0; i < dimension; i++) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (let j = 0; j < gradients.length; j++) {
        const norm = Math.sqrt(gradients[j].reduce((sum, g) => sum + g * g, 0));
        const adaptiveWeight = weights[j] / (norm + 1e-8);
        weightedSum += gradients[j][i] * adaptiveWeight;
        totalWeight += adaptiveWeight;
      }

      result[i] = weightedSum / totalWeight;
    }

    return result;
  }

  /**
   * Add differential privacy noise to gradients
   */
  private async addDifferentialPrivacyNoise(
    gradient: number[],
    epsilon: number,
    sensitivity: number
  ): Promise<number[]> {
    // Add Laplace noise for differential privacy
    const scale = sensitivity / epsilon;

    return gradient.map(g => {
      const noise = this.generateLaplaceNoise(scale);
      return g + noise;
    });
  }

  /**
   * Generate Laplace noise
   */
  private generateLaplaceNoise(scale: number): number {
    const u = Math.random() - 0.5;
    return scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
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
   * Get federated computation status
   */
  async getStatus(computationId: string): Promise<FederatedResult | null> {
    return FederatedResult.findOne({ computationId });
  }
}

export const federatedService = new FederatedService();
export default federatedService;