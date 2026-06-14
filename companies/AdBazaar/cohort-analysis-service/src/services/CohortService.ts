import { Cohort, ICohort } from '../models/Cohort.js';
import { Analysis } from '../models/Analysis.js';
import { Segment } from '../models/Segment.js';
import { Comparison } from '../models/Comparison.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCohortOptions {
  name: string;
  description?: string;
  cohortType: 'retention' | 'revenue' | 'engagement' | 'conversion' | 'behavioral';
  definition: {
    groupBy: {
      field: string;
      granularity: 'day' | 'week' | 'month' | 'quarter' | 'year';
    };
    dateRange: {
      start: Date;
      end: Date;
    };
    filters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    event?: {
      type: 'acquisition' | 'activation' | 'engagement' | 'revenue' | 'retention';
      name: string;
    };
  };
  segments?: Array<{
    id: string;
    name: string;
    criteria: any;
  }>;
  metrics?: string[];
  visualization?: {
    type: 'heatmap' | 'line' | 'bar' | 'table';
    colorScheme?: string[];
  };
  organizationId: string;
  createdBy: string;
}

export class CohortService {
  async createCohort(options: CreateCohortOptions): Promise<ICohort> {
    try {
      const cohort = new Cohort({
        ...options,
        status: 'draft'
      });

      await cohort.save();
      logger.info(`Created cohort: ${cohort.name}`);
      return cohort;
    } catch (error) {
      logger.error('Error creating cohort:', error);
      throw error;
    }
  }

  async getCohortById(cohortId: string, organizationId: string): Promise<ICohort | null> {
    try {
      return await Cohort.findOne({ _id: cohortId, organizationId });
    } catch (error) {
      logger.error(`Error getting cohort ${cohortId}:`, error);
      throw error;
    }
  }

  async updateCohort(cohortId: string, data: Partial<ICohort>, organizationId: string): Promise<ICohort | null> {
    try {
      const cohort = await Cohort.findOneAndUpdate(
        { _id: cohortId, organizationId },
        { $set: data },
        { new: true }
      );

      if (cohort) {
        logger.info(`Updated cohort: ${cohort.name}`);
      }
      return cohort;
    } catch (error) {
      logger.error(`Error updating cohort ${cohortId}:`, error);
      throw error;
    }
  }

  async deleteCohort(cohortId: string, organizationId: string): Promise<boolean> {
    try {
      const result = await Cohort.deleteOne({ _id: cohortId, organizationId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting cohort ${cohortId}:`, error);
      throw error;
    }
  }

  async listCohorts(organizationId: string, page = 1, limit = 20, cohortType?: string): Promise<{ cohorts: ICohort[]; total: number }> {
    try {
      const query: any = { organizationId };
      if (cohortType) query.cohortType = cohortType;

      const skip = (page - 1) * limit;
      const [cohorts, total] = await Promise.all([
        Cohort.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
        Cohort.countDocuments(query)
      ]);

      return { cohorts, total };
    } catch (error) {
      logger.error('Error listing cohorts:', error);
      throw error;
    }
  }

  async analyzeCohort(cohortId: string, organizationId: string): Promise<any> {
    try {
      const cohort = await Cohort.findOne({ _id: cohortId, organizationId });
      if (!cohort) {
        throw new Error('Cohort not found');
      }

      cohort.status = 'calculating';
      await cohort.save();

      const startTime = Date.now();
      const analysis = await this.performAnalysis(cohort);
      const duration = Date.now() - startTime;

      const analysisRecord = new Analysis({
        cohortId: cohort._id.toString(),
        name: `${cohort.name} Analysis`,
        type: this.getAnalysisType(cohort.cohortType),
        parameters: {
          periods: this.calculatePeriods(cohort.definition.dateRange, cohort.definition.groupBy.granularity),
          metric: cohort.metrics?.[0] || 'value',
          aggregation: 'avg',
          periodType: cohort.definition.groupBy.granularity
        },
        results: analysis,
        organizationId,
        computedBy: 'system',
        computedAt: new Date(),
        duration
      });

      await analysisRecord.save();

      cohort.status = 'ready';
      cohort.lastAnalyzed = new Date();
      cohort.results = analysis;
      await cohort.save();

      logger.info(`Analyzed cohort: ${cohort.name}`);
      return analysis;
    } catch (error) {
      logger.error(`Error analyzing cohort ${cohortId}:`, error);
      throw error;
    }
  }

  async compareCohorts(cohortIds: string[], organizationId: string): Promise<any> {
    try {
      const cohorts = await Cohort.find({ _id: { $in: cohortIds }, organizationId });
      if (cohorts.length !== cohortIds.length) {
        throw new Error('One or more cohorts not found');
      }

      const startTime = Date.now();
      const comparisonData = await this.performComparison(cohorts);
      const duration = Date.now() - startTime;

      const comparison = new Comparison({
        name: `Comparison of ${cohorts.length} Cohorts`,
        cohortIds,
        analysisType: this.getAnalysisType(cohorts[0].cohortType),
        metrics: cohorts[0].metrics || ['value'],
        parameters: {
          periods: this.calculatePeriods(cohorts[0].definition.dateRange, cohorts[0].definition.groupBy.granularity),
          aggregation: 'avg'
        },
        results: comparisonData,
        organizationId,
        createdBy: 'system',
        computedAt: new Date(),
        duration
      });

      await comparison.save();

      logger.info(`Compared ${cohorts.length} cohorts`);
      return comparison;
    } catch (error) {
      logger.error('Error comparing cohorts:', error);
      throw error;
    }
  }

  async exportCohort(cohortId: string, format: 'json' | 'csv', organizationId: string): Promise<any> {
    try {
      const cohort = await Cohort.findOne({ _id: cohortId, organizationId });
      if (!cohort) {
        throw new Error('Cohort not found');
      }

      if (cohort.status !== 'ready') {
        throw new Error('Cohort must be analyzed before export');
      }

      if (format === 'csv') {
        return this.convertToCSV(cohort.results);
      }

      return cohort.results;
    } catch (error) {
      logger.error(`Error exporting cohort ${cohortId}:`, error);
      throw error;
    }
  }

  private async performAnalysis(cohort: ICohort): Promise<any> {
    const periods = this.calculatePeriods(cohort.definition.dateRange, cohort.definition.groupBy.granularity);
    const cohortData = [];
    let totalSize = 0;

    for (let i = 0; i < periods; i++) {
      const size = Math.floor(Math.random() * 1000) + 500;
      totalSize += size;

      const values = [];
      for (const metric of (cohort.metrics || ['value'])) {
        const value = Math.random() * 1000;
        const retention =100 - (i * (Math.random() * 10 + 5));
        values.push({
          metric,
          value,
          percentage: Math.max(0, retention)
        });
      }

      cohortData.push({
        period: i,
        periodLabel: this.getPeriodLabel(i, cohort.definition.groupBy.granularity),
        size,
        values
      });
    }

    const avgRetention = cohortData.reduce((sum, d) => sum + (d.values[0]?.percentage || 0), 0) / cohortData.length;

    return {
      cohortData,
      summary: {
        averageRetention: avgRetention,
        averageValue: cohortData.reduce((sum, d) => sum + (d.values[0]?.value || 0), 0) / cohortData.length,
        medianLifetime: Math.floor(periods / 2)
      }
    };
  }

  private async performComparison(cohorts: ICohort[]): Promise<any> {
    const cohortResults = [];

    for (const cohort of cohorts) {
      const analysis = await this.performAnalysis(cohort);
      cohortResults.push({
        cohortId: cohort._id.toString(),
        cohortName: cohort.name,
        data: analysis.cohortData.map(d => ({
          period: d.period,
          value: d.values[0]?.value || 0,
          percentage: d.values[0]?.percentage || 0
        }))
      });
    }

    const avgValues = cohortResults.map(c => c.data.reduce((sum, d) => sum + d.value, 0) / c.data.length);
    const maxAvg = Math.max(...avgValues);
    const minAvg = Math.min(...avgValues);

    return {
      cohorts: cohortResults,
      comparison: {
        averageDifference: maxAvg - minAvg,
        statisticalSignificance: Math.random() * 0.5 + 0.5,
        winner: cohortResults[avgValues.indexOf(maxAvg)]?.cohortName
      }
    };
  }

  private calculatePeriods(dateRange: { start: Date; end: Date }, granularity: string): number {
    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    switch (granularity) {
      case 'day': return Math.min(days, 30);
      case 'week': return Math.min(Math.floor(days / 7), 12);
      case 'month': return Math.min(Math.floor(days / 30), 12);
      case 'quarter': return Math.min(Math.floor(days / 90), 4);
      case 'year': return Math.min(Math.floor(days / 365), 5);
      default: return 12;
    }
  }

  private getPeriodLabel(period: number, granularity: string): string {
    const prefix = period === 0 ? 'Acquisition' : '';
    switch (granularity) {
      case 'day': return `${prefix} Day ${period}`;
      case 'week': return `${prefix} Week ${period}`;
      case 'month': return `${prefix} Month ${period}`;
      case 'quarter': return `${prefix} Q${period + 1}`;
      case 'year': return `${prefix} Year ${period + 1}`;
      default: return `Period ${period}`;
    }
  }

  private getAnalysisType(cohortType: string): string {
    switch (cohortType) {
      case 'retention': return 'retention';
      case 'revenue': return 'revenue';
      case 'engagement': return 'engagement';
      case 'conversion': return 'survival';
      default: return 'retention';
    }
  }

  private convertToCSV(data: any): string {
    if (!data || !data.cohortData) return '';

    const headers = ['Period', 'Size', 'Value', 'Retention %'];
    const rows = data.cohortData.map((d: any) => [
      d.periodLabel,
      d.size,
      d.values[0]?.value || 0,
      d.values[0]?.percentage || 0
    ]);

    return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
  }
}

export default new CohortService();