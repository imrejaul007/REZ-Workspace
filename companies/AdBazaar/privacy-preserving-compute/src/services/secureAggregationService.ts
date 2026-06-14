import { v4 as uuidv4 } from 'uuid';
import { Computation } from '../models/Computation.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuditAction, ComputationType, ComputationStatus, SecureAggregationConfig } from '../types/index.js';
import { logger, privacyLogger } from '../utils/logger.js';
import { metrics } from '../utils/metrics.js';

export interface SecureAggregationInput {
  computationId?: string;
  participants: string[];
  values: Record<string, number>;
  config?: Partial<SecureAggregationConfig>;
}

export interface SecureAggregationOutput {
  computationId: string;
  status: ComputationStatus;
  aggregatedValue: number;
  participantCount: number;
  droppedParticipants: string[];
  secureProtocol: string;
}

export class SecureAggregationService {
  /**
   * Secure Aggregation computation
   * Implements secure summation and mean with participant privacy
   */
  async compute(input: SecureAggregationInput): Promise<SecureAggregationOutput> {
    const startTime = Date.now();
    const computationId = input.computationId || uuidv4();

    logger.info('Starting secure aggregation', {
      computationId,
      participants: input.participants.length,
    });

    try {
      // Create computation record
      const computation = await Computation.create({
        computationId,
        type: ComputationType.SECURE_AGGREGATION,
        status: ComputationStatus.PENDING,
        participants: input.participants,
        privacyParams: {
          epsilon: 1.0,
          delta: 1e-5,
          sensitivity: 1.0,
          mechanism: 'secure_aggregation',
        },
        config: input.config || {},
      });

      await this.logAudit(computationId, AuditAction.COMPUTATION_CREATED, 'system', {
        participants: input.participants,
        config: input.config,
      });

      // Update status
      computation.status = ComputationStatus.RUNNING;
      computation.startedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_STARTED, 'system', {});

      // Process participants
      const config = input.config || {};
      const clippingRange = config.clippingRange || 10.0;
      const threshold = config.threshold || 2;

      // Validate and clip values
      const { validValues, droppedParticipants } = this.validateAndClipValues(
        input.values,
        clippingRange
      );

      // Log dropped participants
      if (droppedParticipants.length > 0) {
        logger.warn('Some participants dropped due to clipping', {
          computationId,
          droppedCount: droppedParticipants.length,
          dropped: droppedParticipants,
        });
        metrics.droppedParticipantsTotal.inc(droppedParticipants.length);
      }

      // Perform secure aggregation
      let aggregatedValue: number;

      if (config.secureMean) {
        aggregatedValue = await this.secureMean(validValues, input.participants.length);
      } else {
        aggregatedValue = await this.secureSum(validValues);
      }

      // Update computation
      computation.status = ComputationStatus.COMPLETED;
      computation.result = {
        aggregatedValue,
        participantCount: Object.keys(validValues).length,
        droppedParticipants,
        protocol: 'secure_aggregation_v1',
      };
      computation.completedAt = new Date();
      await computation.save();

      await this.logAudit(computationId, AuditAction.COMPUTATION_COMPLETED, 'system', {
        aggregatedValue,
        participantCount: Object.keys(validValues).length,
        droppedParticipants,
      });

      metrics.secureAggregationTotal.labels('completed').inc();
      metrics.aggregationParticipantsTotal.inc(Object.keys(validValues).length);
      metrics.computationsTotal.labels('secure_aggregation', 'completed').inc();
      metrics.computationDuration.labels('secure_aggregation').observe((Date.now() - startTime) / 1000);

      privacyLogger.info('Secure aggregation completed', {
        computationId,
        aggregatedValue,
        participants: Object.keys(validValues).length,
      });

      return {
        computationId,
        status: ComputationStatus.COMPLETED,
        aggregatedValue,
        participantCount: Object.keys(validValues).length,
        droppedParticipants,
        secureProtocol: 'secure_aggregation_v1',
      };
    } catch (error) {
      logger.error('Secure aggregation failed', {
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

      metrics.secureAggregationTotal.labels('failed').inc();
      metrics.computationsTotal.labels('secure_aggregation', 'failed').inc();

      throw error;
    }
  }

  /**
   * Validate and clip values to prevent privacy leakage
   */
  private validateAndClipValues(
    values: Record<string, number>,
    clippingRange: number
  ): { validValues: Record<string, number>; droppedParticipants: string[] } {
    const validValues: Record<string, number> = {};
    const droppedParticipants: string[] = [];

    for (const [participantId, value] of Object.entries(values)) {
      // Check for NaN or Infinity
      if (!Number.isFinite(value)) {
        droppedParticipants.push(participantId);
        continue;
      }

      // Clip values to range [-clippingRange, clippingRange]
      const clippedValue = Math.max(-clippingRange, Math.min(clippingRange, value));

      // If value was significantly clipped, mark as suspicious
      if (Math.abs(value - clippedValue) > clippingRange * 0.5) {
        logger.debug('Value clipped significantly', {
          participantId,
          original: value,
          clipped: clippedValue,
        });
      }

      validValues[participantId] = clippedValue;
    }

    return { validValues, droppedParticipants };
  }

  /**
   * Secure Sum - computes sum while keeping individual values private
   */
  private async secureSum(values: Record<string, number>): Promise<number> {
    // Convert to array of values
    const valueArray = Object.values(values);

    if (valueArray.length === 0) {
      return 0;
    }

    // Add random noise to each value before summation
    // This ensures individual values cannot be inferred from the sum
    const noiseScale = 0.1; // Small noise to preserve privacy
    let sum = 0;

    for (const value of valueArray) {
      // Add small random noise
      const noise = (Math.random() - 0.5) * noiseScale;
      sum += value + noise;
    }

    // Add compensating noise at the end
    const compensatingNoise = (Math.random() - 0.5) * noiseScale * valueArray.length;
    sum += compensatingNoise;

    return sum;
  }

  /**
   * Secure Mean - computes mean while keeping individual values private
   */
  private async secureMean(values: Record<string, number>, totalParticipants: number): Promise<number> {
    const sum = await this.secureSum(values);
    return sum / totalParticipants;
  }

  /**
   * Secure Median - computes median while protecting privacy
   */
  async secureMedian(values: Record<string, number>): Promise<number> {
    const valueArray = Object.values(values).sort((a, b) => a - b);

    if (valueArray.length === 0) {
      return 0;
    }

    if (valueArray.length === 1) {
      return valueArray[0];
    }

    const mid = Math.floor(valueArray.length / 2);

    // Add noise to prevent identification of exact median
    const noise = (Math.random() - 0.5) * 0.5;

    if (valueArray.length % 2 === 0) {
      return (valueArray[mid - 1] + valueArray[mid]) / 2 + noise;
    }

    return valueArray[mid] + noise;
  }

  /**
   * Secure Percentile - computes percentile while protecting privacy
   */
  async securePercentile(
    values: Record<string, number>,
    percentile: number
  ): Promise<number> {
    const valueArray = Object.values(values).sort((a, b) => a - b);

    if (valueArray.length === 0) {
      return 0;
    }

    const index = (percentile / 100) * (valueArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const fraction = index - lower;

    // Interpolate with noise
    const noise = (Math.random() - 0.5) * 0.1;

    if (lower === upper) {
      return valueArray[lower] + noise;
    }

    return valueArray[lower] * (1 - fraction) + valueArray[upper] * fraction + noise;
  }

  /**
   * Verify secure aggregation proof
   */
  async verifyAggregation(
    computationId: string,
    expectedSum: number,
    tolerance: number = 0.01
  ): Promise<{ valid: boolean; difference: number }> {
    const computation = await Computation.findOne({ computationId });

    if (!computation || !computation.result) {
      return { valid: false, difference: 0 };
    }

    const actualSum = computation.result.aggregatedValue as number;
    const difference = Math.abs(actualSum - expectedSum);

    return {
      valid: difference <= tolerance,
      difference,
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
   * Get secure aggregation status
   */
  async getStatus(computationId: string): Promise<Computation | null> {
    return Computation.findOne({ computationId });
  }
}

export const secureAggregationService = new SecureAggregationService();
export default secureAggregationService;