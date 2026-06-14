/**
 * Anonymization Utilities
 * Ensures GDPR compliance and data privacy
 */

/**
 * Anonymize a number by adding noise
 * Used for sensitive metrics like exact order counts
 */
export function anonymizeNumber(value: number, noisePercent: number = 0.1): number {
  const noise = (Math.random() - 0.5) * 2 * noisePercent * value;
  return Math.round(value + noise);
}

/**
 * Anonymize an average
 * Used for average order values, etc.
 */
export function anonymizeAverage(values: number[], minSampleSize: number = 5): number | null {
  if (values.length < minSampleSize) {
    return null; // Not enough data to anonymize
  }

  // Calculate mean with noise
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  // Add small noise
  const noise = (Math.random() - 0.5) * 0.05 * mean;
  return Math.round((mean + noise) * 100) / 100;
}

/**
 * Anonymize peak hours
 * Only returns hours that appear in at least minFrequency merchants
 */
export function anonymizePeakHours(
  merchantPeakHours: number[][],
  minFrequency: number = 2
): number[] {
  // Count hour occurrences
  const hourCounts: Record<number, number> = {};

  for (const hours of merchantPeakHours) {
    for (const hour of hours) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  }

  // Return hours that meet minimum frequency
  return Object.entries(hourCounts)
    .filter(([, count]) => count >= minFrequency)
    .map(([hour]) => parseInt(hour))
    .sort((a, b) => a - b);
}

/**
 * Anonymize category distribution
 * Only returns categories with at least minCount merchants
 */
export function anonymizeCategoryDistribution(
  categoryCounts: Record<string, number>,
  minCount: number = 2
): { category: string; percentage: number }[] {
  // Filter categories with minimum count
  const filtered = Object.entries(categoryCounts)
    .filter(([, count]) => count >= minCount);

  if (filtered.length === 0) {
    return [];
  }

  // Calculate total
  const total = filtered.reduce((sum, [, count]) => sum + count, 0);

  // Calculate percentages
  return filtered.map(([category, count]) => ({
    category,
    percentage: Math.round((count / total) * 1000) / 10
  })).sort((a, b) => b.percentage - a.percentage);
}

/**
 * Aggregate numbers safely with minimum sample check
 */
export function aggregateNumbers(
  values: number[],
  minSampleSize: number = 5
): { avg: number | null; sum: number; count: number } {
  const count = values.length;

  if (count < minSampleSize) {
    return { avg: null, sum: 0, count: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / count) * 100) / 100;

  return { avg, sum, count };
}

/**
 * Check if aggregation is safe (enough merchants)
 */
export function isAggregationSafe(
  merchantCount: number,
  minForAggregation: number = 3
): boolean {
  return merchantCount >= minForAggregation;
}

/**
 * Hash merchant ID for audit purposes
 * (Never store actual merchant ID in aggregated data)
 */
export function hashMerchantId(merchantId: string): string {
  // Simple hash for audit - not for security
  let hash = 0;
  for (let i = 0; i < merchantId.length; i++) {
    const char = merchantId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `M-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

/**
 * Location bucketing for privacy
 * Groups locations to prevent identification
 */
export function bucketLocation(
  pincode: string,
  bucketSize: number = 10
): string {
  // Last digit of pincode determines bucket
  const bucket = parseInt(pincode.slice(-1)) % bucketSize;
  return `${pincode.slice(0, -1)}${bucket}`;
}
