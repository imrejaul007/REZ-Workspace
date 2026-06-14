import { Conversion } from '../models/Conversion.js';
import { AttributionRecord } from '../models/AttributionRecord.js';
import { AttributionModel, AttributionReport, ConversionType } from '../types.js';
import { getCache, setCache } from '../config/redis.js';
import logger from '../config/logger.js';

export interface ReportQuery {
  startDate?: Date;
  endDate?: Date;
  model?: AttributionModel;
  sources?: string[];
  segments?: string[];
  conversionTypes?: ConversionType[];
  limit?: number;
  offset?: number;
}

export interface ReportSummary {
  totalConversions: number;
  totalAttributedValue: number;
  avgAttributionLag: string;
  avgTouchpointsPerConversion: number;
  topSource: string;
  topCategory: string;
}

export interface SourceReport {
  source: string;
  conversions: number;
  attributedValue: number;
  percentage: number;
  touchpoints: number;
  avgLagDays: number;
  byConversionType: Record<string, number>;
}

export interface SegmentReport {
  segmentId: string;
  segmentName: string;
  conversions: number;
  attributedValue: number;
  percentage: number;
  roi: number;
  topSources: Array<{ source: string; value: number }>;
}

export class ReportGeneratorService {
  /**
   * Generate a comprehensive attribution report
   */
  async generateReport(query: ReportQuery): Promise<AttributionReport> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
      endDate = new Date(),
      model = AttributionModel.TIME_DECAY,
      sources,
      segments,
      conversionTypes,
      limit = 100,
      offset = 0
    } = query;

    const cacheKey = `report:attribution:${model}:${startDate.toISOString()}:${endDate.toISOString()}:${JSON.stringify({ sources, segments, conversionTypes })}`;

    const cached = await getCache<AttributionReport>(cacheKey);
    if (cached) {
      logger.debug('Returning cached attribution report', { cacheKey });
      return cached;
    }

    logger.info('Generating attribution report', { query });

    // Build match stage
    const matchStage: Record<string, unknown> = {
      timestamp: { $gte: startDate, $lte: endDate }
    };

    if (model) {
      matchStage.model = model;
    }

    if (conversionTypes?.length) {
      matchStage.conversionType = { $in: conversionTypes };
    }

    if (segments?.length) {
      matchStage.category = { $in: segments };
    }

    // Get conversions
    const conversions = await Conversion.find(matchStage)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Filter by sources if provided
    let filteredConversions = conversions;
    if (sources?.length) {
      filteredConversions = conversions.filter(c =>
        c.attributedSignals.some(s => sources.includes(s.source))
      );
    }

    // Calculate summary
    const summary = this.calculateSummary(filteredConversions);

    // Calculate by source
    const bySource = this.calculateBySource(filteredConversions, summary.totalAttributedValue);

    // Calculate by segment
    const bySegment = this.calculateBySegment(filteredConversions, summary.totalAttributedValue);

    const report: AttributionReport = {
      period: { start: startDate, end: endDate },
      model,
      summary,
      bySource,
      bySegment
    };

    // Cache for 5 minutes
    await setCache(cacheKey, report, 300);

    logger.info('Attribution report generated', {
      totalConversions: summary.totalConversions,
      totalAttributedValue: summary.totalAttributedValue
    });

    return report;
  }

  /**
   * Generate source performance report
   */
  async generateSourceReport(
    startDate: Date,
    endDate: Date,
    limit = 20
  ): Promise<SourceReport[]> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    const sourceMap = new Map<string, {
      conversions: Set<string>;
      value: number;
      touchpoints: number;
      totalLag: number;
      byType: Record<string, number>;
    }>();

    for (const conversion of conversions) {
      for (const signal of conversion.attributedSignals) {
        const existing = sourceMap.get(signal.source) || {
          conversions: new Set(),
          value: 0,
          touchpoints: 0,
          totalLag: 0,
          byType: {}
        };
        existing.conversions.add(conversion.conversionId);
        existing.value += signal.attributionValue;
        existing.touchpoints++;
        existing.totalLag += signal.lagDays;
        existing.byType[conversion.conversionType] = (existing.byType[conversion.conversionType] || 0) + 1;
        sourceMap.set(signal.source, existing);
      }
    }

    const totalValue = Array.from(sourceMap.values()).reduce((sum, s) => sum + s.value, 0);

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 10000) / 100 : 0,
        touchpoints: data.touchpoints,
        avgLagDays: data.touchpoints > 0 ? Math.round((data.totalLag / data.touchpoints) * 10) / 10 : 0,
        byConversionType: data.byType
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue)
      .slice(0, limit);
  }

  /**
   * Generate segment performance report
   */
  async generateSegmentReport(
    startDate: Date,
    endDate: Date,
    limit = 20
  ): Promise<SegmentReport[]> {
    const conversions = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    const segmentMap = new Map<string, {
      conversions: Set<string>;
      value: number;
      sources: Map<string, number>;
    }>();

    for (const conversion of conversions) {
      const existing = segmentMap.get(conversion.category) || {
        conversions: new Set(),
        value: 0,
        sources: new Map()
      };
      existing.conversions.add(conversion.conversionId);
      existing.value += conversion.conversionValue;

      for (const signal of conversion.attributedSignals) {
        existing.sources.set(
          signal.source,
          (existing.sources.get(signal.source) || 0) + signal.attributionValue
        );
      }

      segmentMap.set(conversion.category, existing);
    }

    const totalValue = Array.from(segmentMap.values()).reduce((sum, s) => sum + s.value, 0);

    return Array.from(segmentMap.entries())
      .map(([segmentId, data]) => ({
        segmentId,
        segmentName: segmentId, // Could be enriched
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 10000) / 100 : 0,
        roi: 0, // Would need cost data
        topSources: Array.from(data.sources.entries())
          .map(([source, value]) => ({ source, value: Math.round(value * 100) / 100 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue)
      .slice(0, limit);
  }

  /**
   * Generate conversion timeline report
   */
  async generateTimelineReport(
    startDate: Date,
    endDate: Date,
    intervalDays = 7
  ): Promise<Array<{
    period: string;
    startDate: Date;
    endDate: Date;
    conversions: number;
    attributedValue: number;
    bySource: Record<string, number>;
  }>> {
    const conversions = await Conversion.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$timestamp' },
                { $mod: [{ $toLong: '$timestamp' }, intervalDays * 24 * 60 * 60 * 1000] }
              ]
            }
          },
          conversions: { $sum: 1 },
          value: { $sum: '$conversionValue' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get source breakdown per period
    const conversionsFull = await Conversion.find({
      timestamp: { $gte: startDate, $lte: endDate }
    }).lean();

    const periodMap = new Map<string, {
      conversions: number;
      value: number;
      bySource: Record<string, number>;
    }>();

    for (const conv of conversionsFull) {
      const periodStart = this.getPeriodStart(conv.timestamp, intervalDays);
      const existing = periodMap.get(periodStart.toISOString()) || {
        conversions: 0,
        value: 0,
        bySource: {}
      };

      existing.conversions++;
      existing.value += conv.conversionValue;

      for (const signal of conv.attributedSignals) {
        existing.bySource[signal.source] = (existing.bySource[signal.source] || 0) + signal.attributionValue;
      }

      periodMap.set(periodStart.toISOString(), existing);
    }

    return Array.from(periodMap.entries())
      .map(([periodStr, data]) => {
        const periodStart = new Date(periodStr);
        const periodEnd = new Date(periodStart.getTime() + intervalDays * 24 * 60 * 60 * 1000);

        return {
          period: periodStart.toISOString().split('T')[0],
          startDate: periodStart,
          endDate: periodEnd,
          conversions: data.conversions,
          attributedValue: Math.round(data.value * 100) / 100,
          bySource: Object.fromEntries(
            Object.entries(data.bySource).map(([k, v]) => [k, Math.round(v * 100) / 100])
          )
        };
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  /**
   * Get conversion funnel report
   */
  async generateFunnelReport(
    userId: string,
    limit = 10
  ): Promise<Array<{
    conversionId: string;
    conversionType: ConversionType;
    conversionValue: number;
    conversionDate: Date;
    touchpoints: Array<{
      signalId: string;
      source: string;
      eventType: string;
      timestamp: Date;
      attributionCredit: number;
      attributionValue: number;
    }>;
  }>> {
    const conversions = await Conversion.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return conversions.map(c => ({
      conversionId: c.conversionId,
      conversionType: c.conversionType,
      conversionValue: c.conversionValue,
      conversionDate: c.timestamp,
      touchpoints: c.attributedSignals.map(s => ({
        signalId: s.signalId,
        source: s.source,
        eventType: s.eventType,
        timestamp: c.timestamp, // Simplified
        attributionCredit: s.attributionCredit,
        attributionValue: s.attributionValue
      }))
    }));
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(conversions: Array<{
    conversionValue: number;
    attributedSignals: Array<{ lagDays: number }>;
  }>): ReportSummary['summary'] {
    let totalConversions = 0;
    let totalAttributedValue = 0;
    let totalLag = 0;
    let lagCount = 0;
    const sourceMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    for (const conversion of conversions) {
      totalConversions++;
      totalAttributedValue += conversion.conversionValue;

      for (const signal of conversion.attributedSignals) {
        totalLag += signal.lagDays;
        lagCount++;
        sourceMap.set(signal.source, (sourceMap.get(signal.source) || 0) + signal.attributionValue);
      }

      categoryMap.set(
        (conversion as { category?: string }).category || 'unknown',
        (categoryMap.get((conversion as { category?: string }).category || 'unknown') || 0) + conversion.conversionValue
      );
    }

    // Find top source and category
    let topSource = 'unknown';
    let topSourceValue = 0;
    for (const [source, value] of sourceMap) {
      if (value > topSourceValue) {
        topSource = source;
        topSourceValue = value;
      }
    }

    let topCategory = 'unknown';
    let topCategoryValue = 0;
    for (const [category, value] of categoryMap) {
      if (value > topCategoryValue) {
        topCategory = category;
        topCategoryValue = value;
      }
    }

    const avgTouchpointsPerConversion = totalConversions > 0
      ? (conversions.reduce((sum, c) => sum + c.attributedSignals.length, 0) / totalConversions)
      : 0;

    return {
      totalConversions,
      totalAttributedValue: Math.round(totalAttributedValue * 100) / 100,
      avgAttributionLag: lagCount > 0
        ? `${Math.round((totalLag / lagCount) * 10) / 10} days`
        : '0 days',
      avgTouchpointsPerConversion: Math.round(avgTouchpointsPerConversion * 100) / 100,
      topSource,
      topCategory
    };
  }

  /**
   * Calculate by source breakdown
   */
  private calculateBySource(
    conversions: Array<{
      conversionId: string;
      attributedSignals: Array<{
        source: string;
        attributionValue: number;
      }>;
    }>,
    totalValue: number
  ): AttributionReport['bySource'] {
    const sourceMap = new Map<string, { conversions: Set<string>; value: number }>();

    for (const conversion of conversions) {
      for (const signal of conversion.attributedSignals) {
        const existing = sourceMap.get(signal.source) || { conversions: new Set(), value: 0 };
        existing.conversions.add(conversion.conversionId);
        existing.value += signal.attributionValue;
        sourceMap.set(signal.source, existing);
      }
    }

    return Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((data.value / totalValue) * 10000) / 100 : 0
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue);
  }

  /**
   * Calculate by segment breakdown
   */
  private calculateBySegment(
    conversions: Array<{
      conversionId: string;
      category: string;
      conversionValue: number;
    }>,
    totalValue: number
  ): AttributionReport['bySegment'] {
    const segmentMap = new Map<string, { conversions: Set<string>; value: number }>();

    for (const conversion of conversions) {
      const existing = segmentMap.get(conversion.category) || { conversions: new Set(), value: 0 };
      existing.conversions.add(conversion.conversionId);
      existing.value += conversion.conversionValue;
      segmentMap.set(conversion.category, existing);
    }

    return Array.from(segmentMap.entries())
      .map(([segmentId, data]) => ({
        segmentId,
        conversions: data.conversions.size,
        attributedValue: Math.round(data.value * 100) / 100,
        roi: 0 // Would need cost data
      }))
      .sort((a, b) => b.attributedValue - a.attributedValue);
  }

  /**
   * Get period start date
   */
  private getPeriodStart(date: Date, intervalDays: number): Date {
    const ms = intervalDays * 24 * 60 * 60 * 1000;
    return new Date(Math.floor(date.getTime() / ms) * ms);
  }
}

export default new ReportGeneratorService();