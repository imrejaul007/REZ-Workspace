import { Metric, IMetric } from '../models/Metric.js';
import logger from '../utils/logger.js';

export class MetricService {
  async createMetric(data: Partial<IMetric>): Promise<IMetric> {
    try {
      const metric = new Metric(data);
      await metric.save();
      logger.info(`Created metric: ${metric.name}`);
      return metric;
    } catch (error) {
      logger.error('Error creating metric:', error);
      throw error;
    }
  }

  async getMetrics(organizationId: string, category?: string): Promise<IMetric[]> {
    try {
      const query: any = { organizationId, isActive: true };
      if (category) query.category = category;
      return await Metric.find(query).sort({ name: 1 });
    } catch (error) {
      logger.error('Error getting metrics:', error);
      throw error;
    }
  }

  async getMetricById(metricId: string, organizationId: string): Promise<IMetric | null> {
    try {
      return await Metric.findOne({ _id: metricId, organizationId });
    } catch (error) {
      logger.error(`Error getting metric ${metricId}:`, error);
      throw error;
    }
  }

  async updateMetric(metricId: string, data: Partial<IMetric>, organizationId: string): Promise<IMetric | null> {
    try {
      const metric = await Metric.findOneAndUpdate(
        { _id: metricId, organizationId },
        { $set: data },
        { new: true }
      );
      if (metric) {
        logger.info(`Updated metric: ${metric.name}`);
      }
      return metric;
    } catch (error) {
      logger.error(`Error updating metric ${metricId}:`, error);
      throw error;
    }
  }

  async deleteMetric(metricId: string, organizationId: string): Promise<boolean> {
    try {
      const metric = await Metric.findOneAndUpdate(
        { _id: metricId, organizationId },
        { $set: { isActive: false } }
      );
      return !!metric;
    } catch (error) {
      logger.error(`Error deleting metric ${metricId}:`, error);
      throw error;
    }
  }

  async calculateMetric(
    metricKey: string,
    sources: string[],
    dateRange: { start: Date; end: Date },
    organizationId: string
  ): Promise<any> {
    try {
      const metric = await Metric.findOne({ key: metricKey, organizationId });
      if (!metric) {
        throw new Error(`Metric not found: ${metricKey}`);
      }

      const data = this.fetchMetricData(metric.category, sources, dateRange);

      let result: number;
      switch (metric.calculation.type) {
        case 'sum':
          result = data.reduce((sum, d) => sum + (d.value || 0), 0);
          break;
        case 'avg':
          result = data.reduce((sum, d) => sum + (d.value || 0), 0) / data.length;
          break;
        case 'count':
          result = data.length;
          break;
        case 'percentage':
          const trueCount = data.filter(d => d.value).length;
          result = (trueCount / data.length) * 100;
          break;
        default:
          result = 0;
      }

      return {
        metric: metric.name,
        key: metric.key,
        value: result,
        unit: metric.unit,
        format: metric.format,
        calculatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error calculating metric ${metricKey}:`, error);
      throw error;
    }
  }

  private fetchMetricData(category: string, sources: string[], dateRange: { start: Date; end: Date }): any[] {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return Array.from({ length: days }, (_, i) => ({
      value: Math.random() * 1000,
      date: new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000)
    }));
  }

  async getMetricCategories(organizationId: string): Promise<string[]> {
    try {
      const metrics = await Metric.distinct('category', { organizationId, isActive: true });
      return metrics;
    } catch (error) {
      logger.error('Error getting metric categories:', error);
      throw error;
    }
  }
}

export default new MetricService();