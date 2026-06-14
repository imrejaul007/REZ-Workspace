import { TrafficSplitResult } from '../types';

export class TrafficSplitService {
  /**
   * Deterministic hash-based variant selection
   * Ensures same user always sees same variant
   */
  selectVariant(
    sessionId: string,
    variants: Array<{ id: string; trafficPercentage: number }>
  ): string {
    // Create a deterministic hash from sessionId
    const hash = this.hashString(sessionId);

    // Normalize percentages to sum to 100
    const total = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    const normalized = variants.map(v => ({
      ...v,
      trafficPercentage: (v.trafficPercentage / total) * 100,
    }));

    // Find which bucket the hash falls into
    let cumulative = 0;
    for (const variant of normalized) {
      cumulative += variant.trafficPercentage;
      if (hash < cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return normalized[normalized.length - 1].id;
  }

  /**
   * Calculate optimal traffic split for multiple variants
   */
  calculateOptimalSplit(variantCount: number): number[] {
    if (variantCount === 2) {
      // Equal split for A/B tests
      return [50, 50];
    }

    // For multi-variant tests, split equally with small variations
    const base = Math.floor(100 / variantCount);
    const remainder = 100 - base * variantCount;

    const splits: number[] = [];
    for (let i = 0; i < variantCount; i++) {
      splits.push(base + (i < remainder ? 1 : 0));
    }

    return splits;
  }

  /**
   * Validate traffic split percentages
   */
  validateSplit(variants: Array<{ trafficPercentage: number }>): { valid: boolean; message?: string } {
    const total = variants.reduce((sum, v) => sum + v.trafficPercentage, 0);

    if (Math.abs(total - 100) > 0.01) {
      return {
        valid: false,
        message: `Traffic percentages must sum to 100%, got ${total}%`,
      };
    }

    for (const variant of variants) {
      if (variant.trafficPercentage < 5) {
        return {
          valid: false,
          message: `Traffic percentage must be at least 5%, got ${variant.trafficPercentage}%`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Rebalance traffic splits while maintaining deterministic assignment
   */
  rebalanceTraffic(
    currentVariants: Array<{ id: string; trafficPercentage: number }>,
    newPercentages: number[]
  ): Array<{ id: string; trafficPercentage: number }> {
    return currentVariants.map((v, i) => ({
      ...v,
      trafficPercentage: newPercentages[i] || v.trafficPercentage,
    }));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Normalize to 0-100
    return Math.abs(hash % 100);
  }
}

export const trafficSplitService = new TrafficSplitService();
