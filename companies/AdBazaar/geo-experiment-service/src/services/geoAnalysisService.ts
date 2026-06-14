import {
  GeoResult,
  IGeoResult,
  Market,
  IMarket,
  TreatmentMarket,
  ControlMarket,
  GeoExperiment,
  IGeoExperiment
} from '../models';
import { MarketType, GeoResult as GeoResultType, LiftAnalysis } from '../types';
import logger from '../utils/logger';
import { trackDbOperation, experimentLift } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'GeoAnalysisService' });

// Statistical functions
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

function calculatePValue(zScore: number): number {
  return 2 * (1 - normalCDF(Math.abs(zScore)));
}

function calculateZScore(
  treatmentValue: number,
  controlValue: number,
  treatmentSE: number,
  controlSE: number
): number {
  if (treatmentSE === 0 || controlSE === 0) return 0;
  const pooledSE = Math.sqrt(treatmentSE * treatmentSE + controlSE * controlSE);
  if (pooledSE === 0) return 0;
  return (treatmentValue - controlValue) / pooledSE;
}

export const geoAnalysisService = {
  /**
   * Calculate geo results for a market
   */
  async calculateResults(experimentId: string, marketId: string): Promise<IGeoResult | null> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findById(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const market = await Market.findOne({ _id: marketId, experimentId });
      if (!market) {
        throw new Error('Market not found');
      }

      // Get treatment and control data
      const treatment = await TreatmentMarket.findOne({ experimentId, marketId });
      const control = await ControlMarket.findOne({ experimentId, marketId });

      // Calculate metrics
      const treatmentMetrics = {
        impressions: treatment?.impressions || 0,
        reach: treatment?.reach || 0,
        conversions: market.metrics.conversions,
        revenue: market.metrics.revenue,
        ctr: treatment?.impressions
          ? (market.metrics.conversions / treatment.impressions) * 100
          : 0,
        vtr: treatment?.reach
          ? (market.metrics.conversions / treatment.reach) * 100
          : 0
      };

      const controlMetrics = control?.baseline || {
        impressions: 0,
        reach: 0,
        conversions: 0,
        revenue: 0
      };

      // Calculate lift
      const lift = controlMetrics.conversions > 0
        ? ((treatmentMetrics.conversions - controlMetrics.conversions) / controlMetrics.conversions) * 100
        : 0;

      // Calculate statistical significance
      const treatmentSE = Math.sqrt(treatmentMetrics.conversions);
      const controlSE = Math.sqrt(controlMetrics.conversions);
      const zScore = calculateZScore(
        treatmentMetrics.conversions,
        controlMetrics.conversions,
        treatmentSE,
        controlSE
      );
      const pValue = calculatePValue(zScore);
      const confidence = 1 - pValue;
      const isSignificant = pValue < (1 - experiment.confidenceLevel);

      // Sample size
      const sampleSize = treatmentMetrics.impressions + controlMetrics.impressions;

      // Upsert result
      const result = await GeoResult.findOneAndUpdate(
        { experimentId, marketId },
        {
          $set: {
            lift,
            confidence,
            pValue,
            isSignificant,
            sampleSize,
            treatmentMetrics,
            controlMetrics,
            calculatedAt: new Date()
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      trackDbOperation('calculate', 'geo_results', (Date.now() - startTime) / 1000);
      moduleLogger.info('Calculated geo results', {
        experimentId,
        marketId,
        lift,
        confidence,
        isSignificant
      });

      return result;
    } catch (error) {
      moduleLogger.error('Failed to calculate results', { experimentId, marketId, error });
      throw error;
    }
  },

  /**
   * Get results for an experiment
   */
  async getResults(experimentId: string): Promise<GeoResultType[]> {
    const startTime = Date.now();

    try {
      const results = await GeoResult.find({ experimentId })
        .populate('marketId', 'name type dmaCode city state')
        .sort({ lift: -1 })
        .lean();

      trackDbOperation('find', 'geo_results', (Date.now() - startTime) / 1000);

      return results.map(r => ({
        experimentId: r.experimentId.toString(),
        marketId: r.marketId.toString(),
        marketName: (r.marketId as any)?.name || '',
        marketType: (r.marketId as any)?.type || MarketType.TREATMENT,
        lift: r.lift,
        confidence: r.confidence,
        pValue: r.pValue,
        isSignificant: r.isSignificant,
        sampleSize: r.sampleSize,
        treatmentMetrics: r.treatmentMetrics,
        controlMetrics: r.controlMetrics,
        calculatedAt: r.calculatedAt
      }));
    } catch (error) {
      moduleLogger.error('Failed to get results', { experimentId, error });
      throw error;
    }
  },

  /**
   * Get lift analysis for an experiment
   */
  async getLiftAnalysis(experimentId: string): Promise<LiftAnalysis> {
    const startTime = Date.now();

    try {
      const experiment = await GeoExperiment.findById(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const results = await this.getResults(experimentId);

      // Calculate overall lift
      const significantResults = results.filter(r => r.isSignificant);
      const overallLift = significantResults.length > 0
        ? significantResults.reduce((sum, r) => sum + r.lift, 0) / significantResults.length
        : results.reduce((sum, r) => sum + r.lift, 0) / (results.length || 1);

      const overallConfidence = results.length > 0
        ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        : 0;

      const isSignificant = results.length > 0 &&
        results.filter(r => r.isSignificant).length / results.length > 0.5;

      // Generate recommendations
      const recommendations: string[] = [];

      if (overallLift > 20) {
        recommendations.push('Strong positive lift detected. Consider rolling out to all markets.');
      } else if (overallLift > 0) {
        recommendations.push('Moderate positive lift. Continue experiment for more data.');
      } else if (overallLift < -10) {
        recommendations.push('Negative lift detected. Pause campaign and review creative.');
      } else {
        recommendations.push('No significant lift detected. Consider alternative targeting.');
      }

      if (isSignificant) {
        recommendations.push('Results are statistically significant. Safe to make decisions.');
      } else {
        recommendations.push('Results not yet significant. Extend experiment duration.');
      }

      trackDbOperation('analyze', 'geo_results', (Date.now() - startTime) / 1000);

      // Update experiment lift metric
      experimentLift.observe({ status: experiment.status }, overallLift);

      return {
        experimentId,
        experimentName: experiment.name,
        overallLift,
        overallConfidence,
        isSignificant,
        marketResults: results,
        recommendations,
        analyzedAt: new Date()
      };
    } catch (error) {
      moduleLogger.error('Failed to get lift analysis', { experimentId, error });
      throw error;
    }
  },

  /**
   * Get lift by market
   */
  async getLiftByMarket(experimentId: string): Promise<{
    markets: Array<{
      marketId: string;
      marketName: string;
      type: MarketType;
      lift: number;
      confidence: number;
      isSignificant: boolean;
    }>;
    summary: {
      totalMarkets: number;
      significantMarkets: number;
      avgLift: number;
      winningMarkets: number;
    };
  }> {
    const startTime = Date.now();

    try {
      const results = await GeoResult.find({ experimentId })
        .populate('marketId', 'name type')
        .lean();

      const markets = results.map(r => ({
        marketId: r.marketId.toString(),
        marketName: (r.marketId as any)?.name || '',
        type: (r.marketId as any)?.type || MarketType.TREATMENT,
        lift: r.lift,
        confidence: r.confidence,
        isSignificant: r.isSignificant
      }));

      const significantMarkets = markets.filter(m => m.isSignificant).length;
      const winningMarkets = markets.filter(m => m.lift > 0).length;
      const avgLift = markets.length > 0
        ? markets.reduce((sum, m) => sum + m.lift, 0) / markets.length
        : 0;

      trackDbOperation('analyze', 'geo_results', (Date.now() - startTime) / 1000);

      return {
        markets,
        summary: {
          totalMarkets: markets.length,
          significantMarkets,
          avgLift,
          winningMarkets
        }
      };
    } catch (error) {
      moduleLogger.error('Failed to get lift by market', { experimentId, error });
      throw error;
    }
  },

  /**
   * Recalculate all results for an experiment
   */
  async recalculateAll(experimentId: string): Promise<number> {
    const startTime = Date.now();

    try {
      const markets = await Market.find({ experimentId });
      let count = 0;

      for (const market of markets) {
        await this.calculateResults(experimentId, market._id.toString());
        count++;
      }

      trackDbOperation('recalculate', 'geo_results', (Date.now() - startTime) / 1000);
      moduleLogger.info('Recalculated all results', { experimentId, count });

      return count;
    } catch (error) {
      moduleLogger.error('Failed to recalculate all results', { experimentId, error });
      throw error;
    }
  },

  /**
   * Delete results for an experiment
   */
  async deleteByExperiment(experimentId: string): Promise<number> {
    const startTime = Date.now();

    try {
      const result = await GeoResult.deleteMany({ experimentId });
      trackDbOperation('deleteMany', 'geo_results', (Date.now() - startTime) / 1000);
      return result.deletedCount || 0;
    } catch (error) {
      moduleLogger.error('Failed to delete results', { experimentId, error });
      throw error;
    }
  }
};

export default geoAnalysisService;