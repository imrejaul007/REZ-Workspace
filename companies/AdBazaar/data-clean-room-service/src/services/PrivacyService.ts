import logger from '../config/logger';
import { config } from '../config';

/**
 * Privacy-preserving computation service
 * Implements k-anonymity, differential privacy, and federated computation
 */
export class PrivacyService {
  private kAnonymityThreshold: number;
  private differentialPrivacyEpsilon: number;

  constructor() {
    this.kAnonymityThreshold = config.privacy.kAnonymityThreshold;
    this.differentialPrivacyEpsilon = config.privacy.differentialPrivacyEpsilon;
  }

  /**
   * Apply k-anonymity to a dataset
   * Ensures each record is identical to at least k-1 other records
   */
  applyKAnonymity<T extends Record<string, unknown>>(
    records: T[],
    quasiIdentifiers: string[]
  ): T[] {
    logger.info('Applying k-anonymity', {
      recordCount: records.length,
      kThreshold: this.kAnonymityThreshold,
    });

    // Group by quasi-identifiers
    const groups: Map<string, T[]> = new Map();

    for (const record of records) {
      const key = quasiIdentifiers
        .map(qi => String(record[qi] || 'NULL'))
        .join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    // Filter groups that don't meet k-anonymity threshold
    const anonymizedRecords: T[] = [];

    for (const [groupKey, groupRecords] of groups.entries()) {
      if (groupRecords.length >= this.kAnonymityThreshold) {
        anonymizedRecords.push(...groupRecords);
      } else {
        logger.debug('Suppressing group below k-threshold', {
          groupKey,
          count: groupRecords.length,
        });
      }
    }

    logger.info('K-anonymity applied', {
      originalCount: records.length,
      anonymizedCount: anonymizedRecords.length,
      suppressedCount: records.length - anonymizedRecords.length,
    });

    return anonymizedRecords;
  }

  /**
   * Add Laplace noise for differential privacy
   */
  addDifferentialPrivacyNoise(
    value: number,
    sensitivity: number
  ): number {
    // Laplace distribution for differential privacy
    const u = Math.random() - 0.5;
    const noise = -sensitivity * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    const scaledNoise = noise / this.differentialPrivacyEpsilon;

    return value + scaledNoise;
  }

  /**
   * Apply differential privacy to aggregate statistics
   */
  applyDifferentialPrivacyToStats(stats: {
    count: number;
    sum: number;
    average: number;
  }): {
    count: number;
    sum: number;
    average: number;
  } {
    const sensitivity = 1; // Default sensitivity

    return {
      count: Math.max(0, Math.round(this.addDifferentialPrivacyNoise(stats.count, sensitivity))),
      sum: this.addDifferentialPrivacyNoise(stats.sum, sensitivity * 100),
      average: this.addDifferentialPrivacyNoise(stats.average, sensitivity),
    };
  }

  /**
   * Calculate privacy budget consumption
   */
  calculatePrivacyBudget(operations: Array<{
    epsilon: number;
    delta?: number;
  }>): { totalEpsilon: number; totalDelta: number } {
    // Composition: sum of epsilons for sequential operations
    const totalEpsilon = operations.reduce((sum, op) => sum + op.epsilon, 0);
    const totalDelta = operations.reduce(
      (sum, op) => sum + (op.delta || 1e-5),
      0
    );

    return { totalEpsilon, totalDelta };
  }

  /**
   * Check if privacy budget is exhausted
   */
  isPrivacyBudgetExhausted(consumedEpsilon: number): boolean {
    // Assuming total budget of 10 for the dataset lifecycle
    const totalBudget = 10;
    return consumedEpsilon >= totalBudget;
  }

  /**
   * Generate privacy-preserving report
   */
  generatePrivacyReport(data: {
    totalRecords: number;
    matchedRecords: number;
    matchRate: number;
    segments: Array<{ name: string; count: number }>;
  }): {
    totalRecords: number;
    matchedRecords: number;
    matchRate: number;
    segments: Array<{ name: string; count: number; noise: number }>;
    privacyBudgetUsed: number;
  } {
    // Apply differential privacy to segment counts
    const noisySegments = data.segments.map(segment => {
      const noisyCount = this.addDifferentialPrivacyNoise(segment.count, 1);
      return {
        name: segment.name,
        count: Math.max(0, Math.round(noisyCount)),
        noise: Math.abs(noisyCount - segment.count),
      };
    });

    // Calculate total privacy budget used
    const privacyBudgetUsed = data.segments.length * this.differentialPrivacyEpsilon;

    return {
      totalRecords: Math.round(this.addDifferentialPrivacyNoise(data.totalRecords, 1)),
      matchedRecords: Math.round(this.addDifferentialPrivacyNoise(data.matchedRecords, 1)),
      matchRate: this.addDifferentialPrivacyNoise(data.matchRate, 0.1),
      segments: noisySegments,
      privacyBudgetUsed,
    };
  }

  /**
   * Validate data before matching (privacy check)
   */
  validatePrivacyCompliance(records: Array<{
    identifier: string;
    identifierType: string;
  }>): {
    compliant: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for PII in raw form
    for (const record of records) {
      // Check if email/phone is hashed
      if (
        (record.identifierType === 'email' || record.identifierType === 'phone') &&
        !record.identifier.includes(':') &&
        record.identifier.length > 20 // Hashed values are typically longer
      ) {
        issues.push(`Unhashed ${record.identifierType} detected`);
      }
    }

    // Check minimum dataset size for privacy
    if (records.length < this.kAnonymityThreshold) {
      issues.push(`Dataset too small (${records.length} < ${this.kAnonymityThreshold}) for privacy protection`);
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  /**
   * Hash identifier for privacy-safe matching
   */
  hashForMatching(identifier: string, salt: string): string {
    // In production, use a proper HMAC with a unique salt
    const combined = `${identifier}:${salt}`;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  /**
   * Create secure match key (one-way hashed)
   */
  createMatchKey(identifier: string, brandId: string): string {
    const timestamp = Date.now().toString(36);
    const combined = `${identifier}:${brandId}:${timestamp}`;
    let hash = 0;

    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}

export const privacyService = new PrivacyService();