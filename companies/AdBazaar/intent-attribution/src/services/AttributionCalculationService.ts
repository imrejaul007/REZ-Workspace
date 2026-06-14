import { Conversion } from '../models/Conversion.js';
import { AttributionRecord } from '../models/AttributionRecord.js';
import { AttributionModel, ConversionType } from '../types.js';
import { getCache, setCache } from '../config/redis.js';
import logger from '../config/logger.js';

export interface AttributionCalculationResult {
  model: AttributionModel;
  totalConversions: number;
  totalAttributedValue: number;
  bySource: Array<{
    source: string;
    conversions: number;
    attributedValue: number;
    percentage: number;
  }>;
  byCategory: Array<{
    category: string;
    conversions: number;
    attributedValue: number;
    percentage: number;
  }>;
  byConversionType: Array<{
    conversionType: ConversionType;
    conversions: number;
    attributedValue: number;
    percentage: number;
  }>;
  avgAttributionLag: number;
}

export interface SourceAttribution {
  source: string;
  conversions: number;
  attributedValue: number;
  touchpoints: number;
  avgLagDays: number;
  creditDistribution: Record<string, number>;
}

export class AttributionCalculationService {
  /**
   * Calculate attribution using specified model
   */
  async calculateAttribution(
    startDate: Date,
    endDate: Date,
    model: AttributionModel,
    filters?: {
      sources?: string[];
      categories?: string[];
      conversionTypes?: ConversionType[];
    }
  ): Promise<AttributionCalculationResult> {
    const cacheKey = `attribution:calc:${model}:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify(filters || {})}`;

    // Check cache
    const cached = await getCache<AttributionCalculationResult>(cacheKey);
    if (cached) {
      logger.debug('Returning cached attribution calculation', { cacheKey });
      return cached;
    }

    logger.info('Calculating attribution', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      model,
      filters
    });

    // Build match stage
    const matchStage: Record<string, unknown> = {
      timestamp: { $gte: startDate, $lte: endDate },
      model
    };

    if (filters?.conversionTypes?.length) {
      matchStage.conversionType = { $in: filters.conversionTypes };
    }

    // Get conversions
    const conversions = await Conversion.find(matchStage).lean();

    // Filter by sources and categories
    let filteredConversions = conversions;
    if (filters?.sources?.length) {
      filteredConversions = filteredConversions.filter(c =>
        c.attributedSignals.some(s => filters.sources!.includes(s.source))
      );
    }
    if (filters?.categories?.length) {
      filteredConversions = filteredConversions.filter(c =>
        filters.categories!.includes(c.category)
      );
    }

    // Calculate attribution by source
    const sourceMap = new Map<string, { conversions: Set<string>; value: number; lags: number[] }>();
    const categoryMap = new Map<string, { conversions: Set<string>; value: number }>();
    const typeMap = new Map<string, { conversions: Set<string>; value: number }>();
    let totalAttributedValue = 0;
    let totalLag = 0;
    let lagCount = 0;

    for (const conversion of filteredConversions) {
      totalAttributedValue += conversion.conversionValue;

      // Track by source
      for (const signal of conversion.attributedSignals) {
        const existing = sourceMap.get(signal.source) || { conversions: new Set(), value: 0, lags: [] };
        existing.conversions.add(conversion.conversionId);
        existing.value += signal.attributionValue;
        existing.lags.push(signal.lagDays);
        sourceMap.set(signal.source, existing);

        totalLag += signal.lagDays;
        lagCount++;
      }

      // Track by category
      const catEntry = categoryMap.get(conversion.category) || { conversions: new Set(), value: 0 };
      catEntry.conversions.add(conversion.conversionId);
      catEntry.value += conversion.conversionValue;
      categoryMap.set(conversion.category, catEntry);

      // Track by conversion type
      const typeEntry = typeMap.get(conversion.conversionType) || { conversions: new Set(), value: 0 };
      typeEntry.conversions.add(conversion.conversionId);
      typeEntry.value += conversion.conversionValue;
      typeMap.set(conversion.conversionType, typeEntry);
    }

    // Format bySource
    const bySource = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        percentage: totalAttributedValue > 0 ? Math.round((data.value / totalAttributedValue) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue);

    // Format byCategory
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        percentage: totalAttributedValue > 0 ? Math.round((data.value / totalAttributedValue) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue);

    // Format byConversionType
    const byConversionType = Array.from(typeMap.entries())
      .map(([conversionType, data]) => ({
        conversionType: conversionType as ConversionType,
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        percentage: totalAttributedValue > 0 ? Math.round((data.value / totalAttributedValue) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue);

    // Calculate average lag
    const avgAttributionLag = lagCount > 0 ? totalLag / lagCount : 0;

    const result: AttributionCalculationResult = {
      model,
      totalConversions: filteredConversions.length,
      totalAttributedValue: Math.round(totalAttributedValue * 100) / 100,
      bySource,
      byCategory,
      byConversionType,
      avgAttributionLag: Math.round(avgAttributionLag * 10) / 10
    };

    // Cache for 5 minutes
    await setCache(cacheKey, result, 300);

    logger.info('Attribution calculation complete', {
      totalConversions: result.totalConversions,
      totalAttributedValue: result.totalAttributedValue,
      sources: bySource.length
    });

    return result;
  }

  /**
   * Get source attribution details
   */
  async getSourceAttribution(
    source: string,
    startDate: Date,
    endDate: Date
  ): Promise<SourceAttribution> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate },
      'attributedSignals.source': source
    }).lean();

    let totalValue = 0;
    let totalLag = 0;
    let touchpointCount = 0;
    const creditDistribution: Record<string, number> = {};

    for (const conversion of conversions) {
      const signals = conversion.attributedSignals.filter(s => s.source === source);
      for (const signal of signals) {
        totalValue += signal.attributionValue;
        totalLag += signal.lagDays;
        touchpointCount++;
        creditDistribution[signal.eventType] = (creditDistribution[signal.eventType] || 0) + signal.attributionCredit;
      }
    }

    const uniqueConversions = new Set(conversions.map(c => c.conversionId));

    return {
      source,
      conversions: uniqueConversions.size,
      attributedValue: Math.round(totalValue * 100) / 100,
      touchpoints: touchpointCount,
      avgLagDays: touchpointCount > 0 ? Math.round((totalLag / touchpointCount) * 10) / 10 : 0,
      creditDistribution
    };
  }

  /**
   * Get attribution breakdown by touchpoint position
   */
  async getAttributionByPosition(
    startDate: Date,
    endDate: Date,
    model: AttributionModel
  ): Promise<Array<{
    position: number;
    conversions: number;
    totalValue: number;
    avgCredit: number;
  }>> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate },
      model
    }).lean();

    const positionMap = new Map<number, { count: number; value: number; credit: number }>();

    for (const conversion of conversions) {
      for (const signal of conversion.attributedSignals) {
        const existing = positionMap.get(signal.position) || { count: 0, value: 0, credit: 0 };
        existing.count++;
        existing.value += signal.attributionValue;
        existing.credit += signal.attributionCredit;
        positionMap.set(signal.position, existing);
      }
    }

    return Array.from(positionMap.entries())
      .map(([position, data]) => ({
        position,
        conversions: data.count,
        totalValue: Math.round(data.value * 100) / 100,
        avgCredit: data.count > 0 ? Math.round((data.credit / data.count) * 1000) / 1000 : 0
      }))
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Compare attribution across different models
   */
  async compareModels(
    startDate: Date,
    endDate: Date
  ): Promise<Record<AttributionModel, {
    totalAttributedValue: number;
    topSources: Array<{ source: string; percentage: number }>;
  }>> {
    const results: Record<string, {
      totalAttributedValue: number;
      topSources: Array<{ source: string; percentage: number }>;
    }> = {};

    for (const model of Object.values(AttributionModel)) {
      const calc = await this.calculateAttribution(startDate, endDate, model);
      results[model] = {
        totalAttributedValue: calc.totalAttributedValue,
        topSources: calc.bySource.slice(0, 5).map(s => ({
          source: s.source,
          percentage: s.percentage
        }))
      };
    }

    return results as Record<AttributionModel, {
      totalAttributedValue: number;
      topSources: Array<{ source: string; percentage: number }>;
    }>;
  }

  /**
   * Calculate attribution efficiency
   */
  async getAttributionEfficiency(
    startDate: Date,
    endDate: Date
  ): Promise<{
    avgTouchpointsPerConversion: number;
    avgDaysToConversion: number;
    conversionRate: number;
    touchpointToConversionRatio: number;
  }> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    const touchpointRecords = await AttributionRecord.find({
      timestamp: { $gte: startDate, $lte: endDate },
      attributed: true
    }).lean();

    if (conversions.length === 0) {
      return {
        avgTouchpointsPerConversion: 0,
        avgDaysToConversion: 0,
        conversionRate: 0,
        touchpointToConversionRatio: 0
      };
    }

    // Calculate average touchpoints
    const totalTouchpoints = conversions.reduce((sum, c) => sum + c.attributedSignals.length, 0);
    const avgTouchpointsPerConversion = totalTouchpoints / conversions.length;

    // Calculate average days to conversion
    let totalLagDays = 0;
    let lagCount = 0;
    for (const conversion of conversions) {
      for (const signal of conversion.attributedSignals) {
        totalLagDays += signal.lagDays;
        lagCount++;
      }
    }
    const avgDaysToConversion = lagCount > 0 ? totalLagDays / lagCount : 0;

    // Calculate conversion rate (conversions per touchpoint)
    const touchpointToConversionRatio = totalTouchpoints > 0 ? conversions.length / totalTouchpoints : 0;

    // Calculate conversion rate (assuming we have total intent signals)
    const uniqueUsers = new Set(conversions.map(c => c.userId)).size;
    const conversionRate = touchpointRecords.length > 0
      ? (conversions.length / touchpointRecords.length) * 100
      : 0;

    return {
      avgTouchpointsPerConversion: Math.round(avgTouchpointsPerConversion * 100) / 100,
      avgDaysToConversion: Math.round(avgDaysToConversion * 10) / 10,
      conversionRate: Math.round(conversionRate * 100) / 100,
      touchpointToConversionRatio: Math.round(touchpointToConversionRatio * 1000) / 1000
    };
  }
}

export default new AttributionCalculationService();