import { StatisticalSignificance } from '../types';

export class StatisticsService {
  private zScore: number; // For 95% confidence

  constructor(zScore: number = 1.96) {
    this.zScore = zScore;
  }

  /**
   * Calculate statistical significance using Z-test for proportions
   */
  calculateSignificance(
    controlConversions: number,
    controlTotal: number,
    treatmentConversions: number,
    treatmentTotal: number,
    confidenceLevel: number = 0.95
  ): StatisticalSignificance {
    // Update z-score based on confidence level
    this.zScore = this.getZScore(confidenceLevel);

    const controlRate = controlTotal > 0 ? controlConversions / controlTotal : 0;
    const treatmentRate = treatmentTotal > 0 ? treatmentConversions / treatmentTotal : 0;

    // Pooled proportion
    const pooled = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal);

    // Standard error
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlTotal + 1 / treatmentTotal));

    // Z-score
    let zScore = 0;
    if (se > 0) {
      zScore = (treatmentRate - controlRate) / se;
    }

    // P-value (two-tailed)
    const pValue = this.calculatePValue(zScore);

    // Effect size (relative lift)
    const effectSize = controlRate > 0 ? (treatmentRate - controlRate) / controlRate : 0;

    // Confidence interval for the difference
    const diff = treatmentRate - controlRate;
    const marginOfError = this.zScore * se;
    const confidenceInterval = {
      lower: diff - marginOfError,
      upper: diff + marginOfError,
    };

    // Required sample size calculation (for 80% power)
    const requiredSampleSize = this.calculateRequiredSampleSize(
      controlRate,
      effectSize,
      confidenceLevel
    );

    const isSignificant = pValue < (1 - confidenceLevel);

    return {
      isSignificant,
      confidenceLevel,
      pValue,
      zScore,
      effectSize,
      confidenceInterval,
      sampleSize: {
        control: controlTotal,
        treatment: treatmentTotal,
        required: requiredSampleSize,
      },
    };
  }

  /**
   * Calculate statistical significance for continuous metrics (e.g., revenue)
   */
  calculateContinuousSignificance(
    controlValues: number[],
    treatmentValues: number[],
    confidenceLevel: number = 0.95
  ): StatisticalSignificance {
    const controlMean = this.mean(controlValues);
    const treatmentMean = this.mean(treatmentValues);
    const controlStd = this.stdDeviation(controlValues);
    const treatmentStd = this.stdDeviation(treatmentValues);

    const n1 = controlValues.length;
    const n2 = treatmentValues.length;

    // Standard error of the difference
    const se = Math.sqrt((controlStd * controlStd / n1) + (treatmentStd * treatmentStd / n2));

    // Z-score
    let zScore = 0;
    if (se > 0) {
      zScore = (treatmentMean - controlMean) / se;
    }

    // P-value
    const pValue = this.calculatePValue(zScore);

    // Effect size (Cohen's d)
    const pooledStd = Math.sqrt(((n1 - 1) * controlStd * controlStd + (n2 - 1) * treatmentStd * treatmentStd) / (n1 + n2 - 2));
    const effectSize = pooledStd > 0 ? (treatmentMean - controlMean) / pooledStd : 0;

    // Confidence interval
    this.zScore = this.getZScore(confidenceLevel);
    const diff = treatmentMean - controlMean;
    const marginOfError = this.zScore * se;
    const confidenceInterval = {
      lower: diff - marginOfError,
      upper: diff + marginOfError,
    };

    const isSignificant = pValue < (1 - confidenceLevel);

    return {
      isSignificant,
      confidenceLevel,
      pValue,
      zScore,
      effectSize,
      confidenceInterval,
      sampleSize: {
        control: n1,
        treatment: n2,
        required: 0,
      },
    };
  }

  /**
   * Calculate required sample size for given effect size and confidence
   */
  calculateRequiredSampleSize(
    baselineRate: number,
    minimumDetectableEffect: number,
    confidenceLevel: number = 0.95,
    power: number = 0.8
  ): number {
    const zAlpha = this.getZScore(confidenceLevel);
    const zBeta = this.getZScore(power);

    const p1 = baselineRate;
    const p2 = baselineRate * (1 + minimumDetectableEffect);
    const pBar = (p1 + p2) / 2;

    const numerator = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
                             zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p2 - p1, 2);

    return Math.ceil(numerator / denominator);
  }

  /**
   * Calculate chi-square test for independence
   */
  chiSquareTest(
    observed: number[][],
    expected: number[][]
  ): { chiSquare: number; pValue: number; degreesOfFreedom: number } {
    let chiSquare = 0;

    for (let i = 0; i < observed.length; i++) {
      for (let j = 0; j < observed[i].length; j++) {
        if (expected[i][j] > 0) {
          chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j];
        }
      }
    }

    const rows = observed.length;
    const cols = observed[0].length;
    const degreesOfFreedom = (rows - 1) * (cols - 1);

    // Approximate p-value using chi-square distribution
    const pValue = this.chiSquarePValue(chiSquare, degreesOfFreedom);

    return { chiSquare, pValue, degreesOfFreedom };
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private stdDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = this.mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
  }

  private calculatePValue(z: number): number {
    // Standard normal distribution CDF approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    const cdf = 0.5 * (1.0 + sign * y);

    // Two-tailed p-value
    return 2 * (1 - cdf);
  }

  private chiSquarePValue(x: number, df: number): number {
    // Simplified approximation using normal distribution for large df
    if (df > 100) {
      const z = Math.pow(x / df, 1/3) - (1 - 2 / (9 * df));
      const se = Math.sqrt(2 / (9 * df));
      return this.calculatePValue(z / se);
    }

    // For smaller df, use a basic approximation
    return Math.exp(-0.5 * x);
  }

  private getZScore(confidence: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    return zScores[confidence] || 1.96;
  }

  setConfidenceLevel(zScore: number): void {
    this.zScore = zScore;
  }
}

export const statisticsService = new StatisticsService();
