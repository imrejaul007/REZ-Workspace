import { v4 as uuidv4 } from 'uuid';
import { Metric, IMetric, MetricType, MetricPeriod } from '../models/Metric';
import logger from 'utils/logger.js';

export interface MetricData {
  partnerId: string;
  type: MetricType;
  name: string;
  value: number;
  period: MetricPeriod;
  benchmarks?: {
    industry?: number;
    top25?: number;
    top10?: number;
  };
  breakdown?: Record<string, number>;
}

class MetricService {
  /**
   * Record a metric
   */
  async recordMetric(data: MetricData): Promise<IMetric> {
    const metricId = `metric-${uuidv4().slice(0, 12)}`;

    // Get previous value
    const previousMetric = await Metric.findOne({
      partnerId: data.partnerId,
      type: data.type,
      period: data.period,
    }).sort({ createdAt: -1 });

    const previousValue = previousMetric?.value || 0;
    const change = data.value - previousValue;
    const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

    const periodDates = this.getPeriodDates(data.period);

    const metric = new Metric({
      metricId,
      partnerId: data.partnerId,
      type: data.type,
      name: data.name,
      value: data.value,
      previousValue,
      change,
      changePercent,
      period: data.period,
      periodStart: periodDates.start,
      periodEnd: periodDates.end,
      benchmarks: data.benchmarks || {
        industry: 0,
        top25: 0,
        top10: 0,
      },
      breakdown: data.breakdown || {},
    });

    await metric.save();
    logger.info('Metric recorded', { metricId, type: data.type, value: data.value });

    return metric;
  }

  /**
   * Get period dates
   */
  private getPeriodDates(period: MetricPeriod): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (period) {
      case 'realtime':
        start.setMinutes(now.getMinutes() - 5);
        end = now;
        break;
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        end = now;
        break;
    }

    return { start, end };
  }

  /**
   * Get metric by ID
   */
  async getMetric(metricId: string): Promise<IMetric | null> {
    return Metric.findOne({ metricId });
  }

  /**
   * Get metrics by partner
   */
  async getMetricsByPartner(
    partnerId: string,
    options: { type?: MetricType; period?: MetricPeriod } = {}
  ): Promise<IMetric[]> {
    const query: Record<string, unknown> = { partnerId };
    if (options.type) query.type = options.type;
    if (options.period) query.period = options.period;

    return Metric.find(query).sort({ createdAt: -1 }).limit(100);
  }

  /**
   * Get latest metric for each type
   */
  async getLatestMetrics(partnerId: string): Promise<IMetric[]> {
    const types = ['revenue', 'conversion', 'engagement', 'roi', 'satisfaction'];
    const metrics: IMetric[] = [];

    for (const type of types) {
      const metric = await Metric.findOne({ partnerId, type })
        .sort({ createdAt: -1 });
      if (metric) metrics.push(metric);
    }

    return metrics;
  }

  /**
   * Get metric history
   */
  async getMetricHistory(
    partnerId: string,
    type: MetricType,
    period: MetricPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<IMetric[]> {
    return Metric.find({
      partnerId,
      type,
      period,
      periodStart: { $gte: startDate },
      periodEnd: { $lte: endDate },
    }).sort({ periodStart: 1 });
  }

  /**
   * Get benchmark comparison
   */
  async getBenchmarkComparison(
    partnerId: string,
    type: MetricType
  ): Promise<{
    current: number;
    previous: number;
    change: number;
    benchmarks: { industry: number; top25: number; top10: number };
    percentile: number;
  } | null> {
    const metric = await Metric.findOne({ partnerId, type })
      .sort({ createdAt: -1 });

    if (!metric) return null;

    // Calculate percentile based on benchmarks
    let percentile = 50;
    if (metric.benchmarks.top10 && metric.value >= metric.benchmarks.top10) {
      percentile = 90;
    } else if (metric.benchmarks.top25 && metric.value >= metric.benchmarks.top25) {
      percentile = 75;
    } else if (metric.benchmarks.industry && metric.value >= metric.benchmarks.industry) {
      percentile = 50;
    } else {
      percentile = 25;
    }

    return {
      current: metric.value,
      previous: metric.previousValue,
      change: metric.change,
      benchmarks: metric.benchmarks,
      percentile,
    };
  }

  /**
   * Get aggregate metrics
   */
  async getAggregateMetrics(partnerId: string): Promise<Record<string, number>> {
    const metrics = await this.getLatestMetrics(partnerId);

    const result: Record<string, number> = {};
    for (const metric of metrics) {
      result[metric.type] = metric.value;
    }

    return result;
  }
}

export const metricService = new MetricService();
export default metricService;