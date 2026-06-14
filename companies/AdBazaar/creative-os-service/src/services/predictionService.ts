import { CreativePrediction, ICreativePrediction } from '../models/CreativePrediction';
import { Creative } from '../models/Creative';
import { logger } from 'utils/logger.js';

export interface PredictionRequest {
  creativeId: string;
  targetAudience?: {
    ageRange?: [number, number];
    gender?: string[];
    interests?: string[];
    locations?: string[];
  };
  placement?: string;
  bidAmount?: number;
}

export interface PredictionResult {
  creativeId: string;
  predictions: {
    predictedCTR: number;
    predictedCVR: number;
    predictedImpressions: number;
    predictedClicks: number;
    predictedConversions: number;
    predictedCPA: number;
    predictedROAS: number;
  };
  confidence: {
    ctrConfidence: number;
    cvrConfidence: number;
    overallConfidence: number;
  };
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  benchmarks: {
    industryCTR: number;
    industryCVR: number;
    similarAdCTR: number;
  };
  recommendations: string[];
  modelVersion: string;
}

interface IndustryBenchmarks {
  ctr: number;
  cvr: number;
  avgCpc: number;
}

const BENCHMARKS: Record<string, IndustryBenchmarks> = {
  retail: { ctr: 2.5, cvr: 3.2, avgCpc: 0.89 },
  finance: { ctr: 1.8, cvr: 5.4, avgCpc: 3.20 },
  tech: { ctr: 2.1, cvr: 4.1, avgCpc: 2.50 },
  healthcare: { ctr: 1.5, cvr: 3.8, avgCpc: 2.10 },
  education: { ctr: 2.8, cvr: 6.2, avgCpc: 1.50 },
  travel: { ctr: 3.2, cvr: 4.5, avgCpc: 1.20 },
  gaming: { ctr: 4.5, cvr: 2.1, avgCpc: 0.45 },
  default: { ctr: 2.0, cvr: 3.0, avgCpc: 1.00 }
};

export class PredictionService {
  private modelVersion = 'v1.0.0';

  async predict(request: PredictionRequest): Promise<PredictionResult> {
    try {
      logger.info('Generating performance prediction', { creativeId: request.creativeId });

      const creative = await Creative.findById(request.creativeId).exec();
      if (!creative) throw new Error('Creative not found');

      // Calculate prediction factors
      const factors = this.analyzeFactors(creative, request);

      // Calculate predicted metrics
      const predictions = this.calculatePredictions(creative, factors, request);

      // Calculate confidence scores
      const confidence = this.calculateConfidence(creative, factors);

      // Get industry benchmarks
      const benchmarks = this.getBenchmarks(creative, request);

      // Generate recommendations
      const recommendations = this.generateRecommendations(predictions, factors, benchmarks);

      // Save prediction to database
      const prediction = new CreativePrediction({
        creativeId: request.creativeId,
        modelVersion: this.modelVersion,
        predictions: predictions,
        confidence: confidence,
        factors: factors,
        benchmarks: benchmarks,
        recommendations: recommendations,
        modelType: 'ensemble',
        features: this.extractFeatures(creative, request),
        trainingDataRange: {
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      await prediction.save();

      logger.info(`Prediction saved: ${prediction._id}`);
      return {
        creativeId: request.creativeId,
        predictions,
        confidence,
        factors,
        benchmarks,
        recommendations,
        modelVersion: this.modelVersion
      };
    } catch (error) {
      logger.error('Failed to generate prediction:', error);
      throw error;
    }
  }

  private analyzeFactors(creative: any, request: PredictionRequest): Array<{ name: string; impact: number; description: string }> {
    const factors: Array<{ name: string; impact: number; description: string }> = [];

    // Content quality factor
    const hasImage = !!creative.content?.imageUrl;
    const hasVideo = !!creative.content?.videoUrl;
    const hasHeadline = !!creative.content?.headline;
    const hasCTA = !!creative.content?.cta;
    const contentScore = [hasImage, hasVideo, hasHeadline, hasCTA].filter(Boolean).length / 4;
    factors.push({
      name: 'content_quality',
      impact: contentScore * 0.3,
      description: `Content completeness: ${contentScore * 100}%`
    });

    // Historical performance factor
    const historicalCTR = creative.metrics?.ctr || 0;
    if (historicalCTR > 0) {
      factors.push({
        name: 'historical_performance',
        impact: Math.min(historicalCTR / 5, 1) * 0.25,
        description: `Historical CTR: ${historicalCTR.toFixed(2)}%`
      });
    }

    // Audience targeting factor
    if (creative.targetAudience || request.targetAudience) {
      factors.push({
        name: 'audience_targeting',
        impact: 0.15,
        description: 'Audience targeting signals present'
      });
    }

    // Creative type factor
    const typePerformance: Record<string, number> = {
      video: 0.8,
      carousel: 0.75,
      native: 0.7,
      banner: 0.6,
      text: 0.4
    };
    const typeImpact = typePerformance[creative.type] || 0.5;
    factors.push({
      name: 'creative_type',
      impact: typeImpact * 0.15,
      description: `${creative.type} type performance score`
    });

    // Size/dimensions factor
    if (creative.dimensions) {
      const area = creative.dimensions.width * creative.dimensions.height;
      const sizeFactor = Math.min(area / 300000, 1);
      factors.push({
        name: 'creative_size',
        impact: sizeFactor * 0.1,
        description: `Creative area: ${area} sq pixels`
      });
    }

    // Placement factor
    if (request.placement) {
      const placementScores: Record<string, number> = {
        'pre-roll': 0.7,
        'mid-roll': 0.5,
        'banner': 0.6,
        'native': 0.8,
        'in-feed': 0.75
      };
      const placementScore = placementScores[request.placement] || 0.5;
      factors.push({
        name: 'placement',
        impact: placementScore * 0.05,
        description: `${request.placement} placement score`
      });
    }

    return factors;
  }

  private calculatePredictions(
    creative: any,
    factors: Array<{ name: string; impact: number }>,
    request: PredictionRequest
  ): PredictionResult['predictions'] {
    // Calculate base CTR from industry benchmark
    const industryCTR = this.getBenchmarks(creative, request).industryCTR / 100;

    // Calculate multiplier from factors
    const factorMultiplier = factors.reduce((sum, f) => sum + f.impact, 0) + 0.5; // Base multiplier of 0.5

    // Predicted CTR
    const predictedCTR = Math.min(industryCTR * factorMultiplier, 0.15); // Cap at 15%

    // Calculate CVR (conversion rate)
    const industryCVR = this.getBenchmarks(creative, request).industryCVR / 100;
    const cvrMultiplier = creative.content?.cta ? 1.2 : 1.0;
    const predictedCVR = Math.min(industryCVR * cvrMultiplier * factorMultiplier, 0.20);

    // Calculate impressions and derived metrics
    const baseImpressions = 10000; // Base impressions for calculation
    const predictedImpressions = baseImpressions;
    const predictedClicks = Math.round(predictedImpressions * predictedCTR);
    const predictedConversions = Math.round(predictedClicks * predictedCVR);

    // Calculate spend and CPA
    const bidAmount = request.bidAmount || 1.0;
    const predictedSpend = predictedImpressions * bidAmount * 0.001; // CPM model
    const predictedCPA = predictedConversions > 0 ? predictedSpend / predictedConversions : 0;

    // Calculate ROAS (Return on Ad Spend)
    // Assuming average order value of $50 for calculation
    const avgOrderValue = 50;
    const revenue = predictedConversions * avgOrderValue;
    const predictedROAS = predictedSpend > 0 ? revenue / predictedSpend : 0;

    return {
      predictedCTR: predictedCTR * 100,
      predictedCVR: predictedCVR * 100,
      predictedImpressions,
      predictedClicks,
      predictedConversions,
      predictedCPA,
      predictedROAS
    };
  }

  private calculateConfidence(creative: any, factors: Array<{ name: string; impact: number }>): PredictionResult['confidence'] {
    // Confidence based on available data
    let ctrConfidence = 0.5;
    let cvrConfidence = 0.5;

    // More historical data = higher confidence
    if (creative.metrics?.impressions && creative.metrics.impressions > 10000) {
      ctrConfidence = 0.85;
    } else if (creative.metrics?.impressions && creative.metrics.impressions > 1000) {
      ctrConfidence = 0.70;
    } else if (creative.metrics?.impressions && creative.metrics.impressions > 100) {
      ctrConfidence = 0.60;
    }

    // CVR confidence based on clicks
    if (creative.metrics?.clicks && creative.metrics.clicks > 1000) {
      cvrConfidence = 0.80;
    } else if (creative.metrics?.clicks && creative.metrics.clicks > 100) {
      cvrConfidence = 0.65;
    }

    const overallConfidence = (ctrConfidence + cvrConfidence) / 2;

    return {
      ctrConfidence,
      cvrConfidence,
      overallConfidence
    };
  }

  private getBenchmarks(creative: any, request: PredictionRequest): PredictionResult['benchmarks'] {
    // Determine industry from creative tags or campaign
    const industry = this.detectIndustry(creative);
    const benchmark = BENCHMARKS[industry] || BENCHMARKS.default;

    return {
      industryCTR: benchmark.ctr,
      industryCVR: benchmark.cvr,
      similarAdCTR: benchmark.ctr * 0.9 // Similar ads typically perform 90% of industry average
    };
  }

  private detectIndustry(creative: any): string {
    const tags = creative.tags || [];
    const industries: Record<string, string[]> = {
      retail: ['shopping', 'e-commerce', 'fashion', 'retail'],
      finance: ['banking', 'finance', 'investment', 'insurance'],
      tech: ['software', 'saas', 'tech', 'app'],
      healthcare: ['health', 'medical', 'pharma', 'wellness'],
      education: ['education', 'learning', 'course', 'training'],
      travel: ['travel', 'hotel', 'flight', 'tourism'],
      gaming: ['gaming', 'game', 'entertainment']
    };

    for (const [industry, keywords] of Object.entries(industries)) {
      if (tags.some(tag => keywords.includes(tag.toLowerCase()))) {
        return industry;
      }
    }

    return 'default';
  }

  private generateRecommendations(
    predictions: PredictionResult['predictions'],
    factors: Array<{ name: string; impact: number; description: string }>,
    benchmarks: PredictionResult['benchmarks']
  ): string[] {
    const recommendations: string[] = [];

    // CTR recommendations
    if (predictions.predictedCTR < benchmarks.industryCTR) {
      recommendations.push('Consider improving visual elements to boost CTR');
      recommendations.push('Test stronger headlines with power words');
    }

    // CVR recommendations
    if (predictions.predictedCVR < benchmarks.industryCVR) {
      recommendations.push('Add clear call-to-action to improve conversion rate');
      recommendations.push('Include social proof elements in the creative');
    }

    // Performance factor recommendations
    const lowFactors = factors.filter(f => f.impact < 0.3);
    if (lowFactors.length > 0) {
      recommendations.push(`Improve: ${lowFactors.map(f => f.name).join(', ')}`);
    }

    // Budget recommendations
    if (predictions.predictedCPA > 50) {
      recommendations.push('Consider adjusting targeting to reduce CPA');
    }

    // General recommendations
    recommendations.push('Run A/B tests on variations to validate predictions');
    recommendations.push('Monitor early performance and adjust bid strategy');

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  private extractFeatures(creative: any, request: PredictionRequest): Record<string, number> {
    return {
      hasImage: creative.content?.imageUrl ? 1 : 0,
      hasVideo: creative.content?.videoUrl ? 1 : 0,
      hasHeadline: creative.content?.headline ? 1 : 0,
      hasCTA: creative.content?.cta ? 1 : 0,
      contentLength: (creative.content?.body?.length || 0) / 1000,
      tagCount: creative.tags?.length || 0,
      historicalCTR: creative.metrics?.ctr || 0,
      historicalCVR: creative.metrics?.cvr || 0,
      ...(creative.dimensions && {
        width: creative.dimensions.width,
        height: creative.dimensions.height,
        area: creative.dimensions.width * creative.dimensions.height
      })
    };
  }

  async getPredictionHistory(creativeId: string, limit: number = 10): Promise<ICreativePrediction[]> {
    return CreativePrediction.find({ creativeId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getModelPerformance(modelVersion: string): Promise<any> {
    // Calculate model performance metrics
    const predictions = await CreativePrediction.find({ modelVersion }).exec();

    if (predictions.length === 0) {
      return { error: 'No predictions found for this model version' };
    }

    // Calculate average confidence
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence.overallConfidence, 0) / predictions.length;

    // Calculate prediction accuracy (would need actual outcomes to compute)
    return {
      modelVersion,
      totalPredictions: predictions.length,
      avgConfidence,
      lastUpdated: predictions[0].createdAt,
      status: 'active'
    };
  }
}

export const predictionService = new PredictionService();