import { SalesLift, ISalesLift, LiftMethod } from '../models';
import { RetailCampaign } from '../models';
import { logger } from '../utils/logger';
import { salesLiftTotal } from '../utils/metrics';

export interface CreateSalesLiftInput {
  campaignId: string;
  retailerId: string;
  storeIds: string[];
  method: LiftMethod;
  period: {
    startDate: Date;
    endDate: Date;
  };
  baseline: {
    sales: number;
    transactions: number;
    avgOrderValue: number;
    units: number;
  };
  treatment: {
    sales: number;
    transactions: number;
    avgOrderValue: number;
    units: number;
  };
  controlGroup?: {
    storeIds: string[];
    sales: number;
    transactions: number;
  };
}

export interface SalesLiftResult {
  salesLift: ISalesLift;
  analysis: {
    incrementalSales: number;
    liftPercentage: number;
    roi: number;
    statisticalSignificance: boolean;
    confidenceInterval: [number, number];
    recommendations: string[];
  };
}

class SalesLiftService {
  async create(input: CreateSalesLiftInput): Promise<ISalesLift> {
    try {
      const salesLift = new SalesLift({
        campaignId: input.campaignId,
        retailerId: input.retailerId,
        storeIds: input.storeIds,
        method: input.method,
        period: input.period,
        baseline: input.baseline,
        treatment: input.treatment,
        controlGroup: input.controlGroup || {
          storeIds: [],
          sales: 0,
          transactions: 0
        },
        status: 'calculating'
      });

      await salesLift.save();
      logger.info(`Sales lift created: ${salesLift._id} for campaign ${input.campaignId}`);

      return salesLift;
    } catch (error) {
      logger.error('Error creating sales lift:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<ISalesLift | null> {
    try {
      const salesLift = await SalesLift.findById(id);
      return salesLift;
    } catch (error) {
      logger.error(`Error fetching sales lift ${id}:`, error);
      throw error;
    }
  }

  async getByCampaign(campaignId: string): Promise<ISalesLift[]> {
    try {
      const salesLifts = await SalesLift.find({ campaignId }).sort({ createdAt: -1 });
      return salesLifts;
    } catch (error) {
      logger.error(`Error fetching sales lifts for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  async calculateAndFinalize(id: string): Promise<ISalesLift | null> {
    try {
      const salesLift = await SalesLift.findById(id);

      if (!salesLift) {
        return null;
      }

      // Calculate lift metrics
      const salesLiftPercent =
        salesLift.baseline.sales > 0
          ? ((salesLift.treatment.sales - salesLift.baseline.sales) / salesLift.baseline.sales) * 100
          : 0;

      const transactionsLiftPercent =
        salesLift.baseline.transactions > 0
          ? ((salesLift.treatment.transactions - salesLift.baseline.transactions) / salesLift.baseline.transactions) * 100
          : 0;

      const aovChange = salesLift.treatment.avgOrderValue - salesLift.baseline.avgOrderValue;

      const unitsLiftPercent =
        salesLift.baseline.units > 0
          ? ((salesLift.treatment.units - salesLift.baseline.units) / salesLift.baseline.units) * 100
          : 0;

      // Calculate confidence intervals (simplified statistical calculation)
      const sampleSize = salesLift.treatment.transactions + salesLift.baseline.transactions;
      const standardError = this.calculateStandardError(salesLift);
      const confidenceLevel = this.calculateConfidenceLevel(standardError, sampleSize);
      const intervalLow = salesLiftPercent - 1.96 * standardError;
      const intervalHigh = salesLiftPercent + 1.96 * standardError;

      // Update sales lift with calculated values
      salesLift.lift = {
        salesPercent: salesLiftPercent,
        transactionsPercent: transactionsLiftPercent,
        aovChange,
        unitsPercent: unitsLiftPercent
      };

      salesLift.confidence = {
        level: confidenceLevel,
        intervalLow: Math.max(0, intervalLow),
        intervalHigh,
        pValue: this.calculatePValue(standardError, sampleSize),
        sampleSize
      };

      salesLift.status = 'completed';

      await salesLift.save();
      logger.info(`Sales lift calculated and finalized: ${id}`);

      // Update metrics
      salesLiftTotal.set({ retailer_id: salesLift.retailerId.toString() }, salesLiftPercent);

      return salesLift;
    } catch (error) {
      logger.error(`Error calculating sales lift ${id}:`, error);
      throw error;
    }
  }

  async getAnalysis(id: string): Promise<SalesLiftResult['analysis'] | null> {
    try {
      const salesLift = await SalesLift.findById(id);

      if (!salesLift || salesLift.status !== 'completed') {
        return null;
      }

      const incrementalSales = salesLift.treatment.sales - salesLift.baseline.sales;
      const liftPercentage = salesLift.lift.salesPercent;

      // Get campaign to calculate ROI
      const campaign = await RetailCampaign.findById(salesLift.campaignId);
      const spend = campaign?.budget.spent || 0;
      const roi = spend > 0 ? incrementalSales / spend : 0;

      const statisticalSignificance = salesLift.confidence.pValue < 0.05;
      const confidenceInterval: [number, number] = [
        salesLift.confidence.intervalLow,
        salesLift.confidence.intervalHigh
      ];

      // Generate recommendations
      const recommendations = this.generateRecommendations(salesLift, roi, statisticalSignificance);

      return {
        incrementalSales,
        liftPercentage,
        roi,
        statisticalSignificance,
        confidenceInterval,
        recommendations
      };
    } catch (error) {
      logger.error(`Error getting sales lift analysis ${id}:`, error);
      throw error;
    }
  }

  async listByRetailer(
    retailerId: string,
    filters?: {
      status?: string;
      method?: LiftMethod;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ salesLifts: ISalesLift[]; total: number }> {
    try {
      const query: Record<string, unknown> = { retailerId };

      if (filters?.status) {
        query.status = filters.status;
      }
      if (filters?.method) {
        query.method = filters.method;
      }

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const [salesLifts, total] = await Promise.all([
        SalesLift.find(query).skip(offset).limit(limit).sort({ createdAt: -1 }),
        SalesLift.countDocuments(query)
      ]);

      return { salesLifts, total };
    } catch (error) {
      logger.error(`Error listing sales lifts for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  async getAverageLiftByRetailer(retailerId: string): Promise<{
    avgSalesLift: number;
    avgTransactionsLift: number;
    avgRoi: number;
    totalTests: number;
    significantTests: number;
  }> {
    try {
      const salesLifts = await SalesLift.find({
        retailerId,
        status: 'completed'
      });

      if (salesLifts.length === 0) {
        return {
          avgSalesLift: 0,
          avgTransactionsLift: 0,
          avgRoi: 0,
          totalTests: 0,
          significantTests: 0
        };
      }

      const campaigns = await RetailCampaign.find({
        retailerId: retailerId
      });

      const totalSpend = campaigns.reduce((acc, c) => acc + c.budget.spent, 0);
      const totalIncrementalSales = salesLifts.reduce(
        (acc, sl) => acc + (sl.treatment.sales - sl.baseline.sales),
        0
      );

      const avgSalesLift =
        salesLifts.reduce((acc, sl) => acc + sl.lift.salesPercent, 0) / salesLifts.length;

      const avgTransactionsLift =
        salesLifts.reduce((acc, sl) => acc + sl.lift.transactionsPercent, 0) / salesLifts.length;

      const avgRoi = totalSpend > 0 ? totalIncrementalSales / totalSpend : 0;

      const significantTests = salesLifts.filter((sl) => sl.confidence.pValue < 0.05).length;

      return {
        avgSalesLift,
        avgTransactionsLift,
        avgRoi,
        totalTests: salesLifts.length,
        significantTests
      };
    } catch (error) {
      logger.error(`Error getting average lift for retailer ${retailerId}:`, error);
      throw error;
    }
  }

  private calculateStandardError(salesLift: ISalesLift): number {
    // Simplified standard error calculation
    const treatmentVariance = salesLift.treatment.sales / Math.sqrt(salesLift.treatment.transactions);
    const baselineVariance = salesLift.baseline.sales / Math.sqrt(salesLift.baseline.transactions);
    return Math.sqrt(treatmentVariance * treatmentVariance + baselineVariance * baselineVariance);
  }

  private calculateConfidenceLevel(standardError: number, sampleSize: number): number {
    // Simplified confidence level calculation
    if (sampleSize < 30) return 0.8;
    if (sampleSize < 100) return 0.9;
    if (sampleSize < 500) return 0.95;
    return 0.99;
  }

  private calculatePValue(standardError: number, sampleSize: number): number {
    // Simplified p-value calculation
    if (sampleSize < 30) return 0.2;
    if (sampleSize < 100) return 0.1;
    if (sampleSize < 500) return 0.05;
    return 0.01;
  }

  private generateRecommendations(
    salesLift: ISalesLift,
    roi: number,
    isSignificant: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (!isSignificant) {
      recommendations.push('Consider increasing campaign budget to achieve statistical significance');
      recommendations.push('Test with larger store sample size for more reliable results');
    }

    if (roi > 3) {
      recommendations.push('Excellent ROI - consider scaling the campaign');
    } else if (roi > 1) {
      recommendations.push('Positive ROI - campaign is performing well');
    } else if (roi > 0) {
      recommendations.push('Low but positive ROI - optimize targeting to improve efficiency');
    } else {
      recommendations.push('Negative ROI - review targeting and creative strategy');
    }

    if (salesLift.lift.salesPercent > 20) {
      recommendations.push('Strong sales lift - consider expanding to more locations');
    }

    if (salesLift.lift.transactionsPercent > salesLift.lift.salesPercent) {
      recommendations.push('Transaction lift exceeds sales lift - focus on increasing basket size');
    }

    return recommendations;
  }
}

export const salesLiftService = new SalesLiftService();
export default salesLiftService;