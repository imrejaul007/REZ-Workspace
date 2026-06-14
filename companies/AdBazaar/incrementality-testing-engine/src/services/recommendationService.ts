import { Experiment, TestGroup, LiftAnalysis } from '../models';
import { Recommendation, ExperimentType } from '../types';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

interface RecommendationContext {
  experimentId: string;
  experimentName: string;
  experimentType: ExperimentType;
  lift: number;
  absoluteLift: number;
  pValue: number;
  isSignificant: boolean;
  sampleSize: number;
  budget: number;
  spent: number;
  treatmentMetrics: {
    ctr: number;
    cvr: number;
    roas: number;
    revenue: number;
  };
  controlMetrics: {
    ctr: number;
    cvr: number;
    roas: number;
    revenue: number;
  };
}

export class RecommendationService {
  /**
   * Generate recommendations for an experiment
   */
  async generateRecommendations(experimentId: string): Promise<Recommendation[]> {
    logger.info('Generating recommendations', { experimentId });

    const experiment = await Experiment.findById(experimentId);
    if (!experiment) {
      throw new Error('Experiment not found');
    }

    const testGroups = await TestGroup.find({ experimentId });
    const treatment = testGroups.find(g => g.type === 'treatment');
    const control = testGroups.find(g => g.type === 'control');
    const latestAnalysis = await LiftAnalysis.findOne({ experimentId })
      .sort({ analysisDate: -1 });

    const context: RecommendationContext = {
      experimentId,
      experimentName: experiment.name,
      experimentType: experiment.type,
      lift: latestAnalysis?.lift || 0,
      absoluteLift: latestAnalysis?.absoluteLift || 0,
      pValue: latestAnalysis?.pValue || 1,
      isSignificant: latestAnalysis?.isSignificant || false,
      sampleSize: latestAnalysis?.sampleSize || 0,
      budget: experiment.budget,
      spent: experiment.spent,
      treatmentMetrics: {
        ctr: treatment?.metrics.ctr || 0,
        cvr: treatment?.metrics.cvr || 0,
        roas: treatment?.metrics.roas || 0,
        revenue: treatment?.metrics.revenue || 0
      },
      controlMetrics: {
        ctr: control?.metrics.ctr || 0,
        cvr: control?.metrics.cvr || 0,
        roas: control?.metrics.roas || 0,
        revenue: control?.metrics.revenue || 0
      }
    };

    const recommendations: Recommendation[] = [];

    // Scaling recommendations
    const scalingRec = this.getScalingRecommendation(context);
    if (scalingRec) {
      recommendations.push(scalingRec);
    }

    // Budget reallocation recommendations
    const budgetRecs = this.getBudgetRecommendations(context);
    recommendations.push(...budgetRecs);

    // Creative recommendations
    const creativeRec = this.getCreativeRecommendation(context);
    if (creativeRec) {
      recommendations.push(creativeRec);
    }

    // Targeting recommendations
    const targetingRec = this.getTargetingRecommendation(context);
    if (targetingRec) {
      recommendations.push(targetingRec);
    }

    // Timing recommendations
    const timingRec = this.getTimingRecommendation(context);
    if (timingRec) {
      recommendations.push(timingRec);
    }

    // Update metrics
    for (const rec of recommendations) {
      metrics.recommendationsGenerated.inc({
        type: rec.type,
        priority: rec.priority
      });
    }

    // Save recommendations to experiment
    experiment.recommendations = recommendations;
    await experiment.save();

    logger.info('Recommendations generated', {
      experimentId,
      count: recommendations.length
    });

    return recommendations;
  }

  /**
   * Get scaling recommendations
   */
  private getScalingRecommendation(context: RecommendationContext): Recommendation | null {
    if (context.isSignificant && context.lift > 5) {
      return {
        type: 'scaling',
        priority: 'high',
        title: 'Scale Winning Campaign',
        description: `Campaign shows ${context.lift.toFixed(1)}% lift with statistical significance (p=${context.pValue.toFixed(4)}). Consider scaling to additional markets or increasing budget.`,
        expectedImpact: context.lift * 1.2,
        confidence: 0.85,
        actionItems: [
          'Identify top-performing audience segments',
          'Increase budget allocation by 20-50%',
          'Expand to similar geo markets',
          'Set up automated scaling rules'
        ]
      };
    } else if (context.isSignificant && context.lift < -5) {
      return {
        type: 'scaling',
        priority: 'high',
        title: 'Pause Underperforming Campaign',
        description: `Campaign shows negative ${Math.abs(context.lift).toFixed(1)}% lift. Recommend pausing or significantly reducing spend.`,
        expectedImpact: Math.abs(context.lift) * 0.8,
        confidence: 0.9,
        actionItems: [
          'Pause campaign immediately',
          'Analyze failure factors',
          'Review creative and targeting',
          'Consider redesign before relaunch'
        ]
      };
    }

    return null;
  }

  /**
   * Get budget reallocation recommendations
   */
  private getBudgetRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const spendPercentage = (context.spent / context.budget) * 100;

    if (spendPercentage < 50 && context.isSignificant) {
      recommendations.push({
        type: 'budget_reallocation',
        priority: 'medium',
        title: 'Increase Budget for High-Performing Campaign',
        description: 'Campaign is performing well but only 50% of budget utilized. Increase investment to maximize ROI.',
        expectedImpact: context.lift * 0.5,
        confidence: 0.75,
        actionItems: [
          'Review budget allocation across channels',
          'Increase daily spend limits',
          'Expand targeting to similar audiences'
        ]
      });
    }

    if (context.treatmentMetrics.roas > context.controlMetrics.roas * 1.5) {
      recommendations.push({
        type: 'budget_reallocation',
        priority: 'high',
        title: 'Optimize ROAS Through Budget Shift',
        description: `Treatment ROAS (${context.treatmentMetrics.roas.toFixed(2)}) significantly outperforms control (${context.controlMetrics.roas.toFixed(2)}). Shift budget toward treatment.`,
        expectedImpact: (context.treatmentMetrics.roas - context.controlMetrics.roas) * 10,
        confidence: 0.8,
        actionItems: [
          'Shift 30-50% budget from control to treatment',
          'Monitor ROAS closely for 7 days',
          'Gradually increase treatment allocation'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get creative recommendations
   */
  private getCreativeRecommendation(context: RecommendationContext): Recommendation | null {
    const ctrDiff = context.treatmentMetrics.ctr - context.controlMetrics.ctr;

    if (Math.abs(ctrDiff) > 20) {
      const isPositive = ctrDiff > 0;
      return {
        type: 'creative',
        priority: 'medium',
        title: isPositive ? 'Leverage High-CTR Creative' : 'Test New Creative Assets',
        description: isPositive
          ? `Treatment creative shows ${ctrDiff.toFixed(1)}% higher CTR. Consider applying winning creative patterns.`
          : `Treatment creative underperforms control by ${Math.abs(ctrDiff).toFixed(1)}%. Test new creative approaches.`,
        expectedImpact: Math.abs(ctrDiff) * 0.3,
        confidence: 0.7,
        actionItems: isPositive ? [
          'Analyze winning creative elements',
          'Apply patterns to other campaigns',
          'Test variations of winning creative'
        ] : [
          'A/B test new headlines',
          'Try different visual styles',
          'Test value proposition variations'
        ]
      };
    }

    return null;
  }

  /**
   * Get targeting recommendations
   */
  private getTargetingRecommendation(context: RecommendationContext): Recommendation | null {
    if (!context.isSignificant && context.sampleSize > 10000) {
      return {
        type: 'targeting',
        priority: 'medium',
        title: 'Refine Audience Targeting',
        description: 'Large sample but no significant lift detected. Current targeting may be too broad or misaligned with campaign message.',
        expectedImpact: 10,
        confidence: 0.65,
        actionItems: [
          'Segment audience by behavior patterns',
          'Test lookalike audiences',
          'Exclude past converters',
          'Try interest-based targeting'
        ]
      };
    }

    if (context.isSignificant && context.lift > 10) {
      return {
        type: 'targeting',
        priority: 'high',
        title: 'Expand to Lookalike Audiences',
        description: 'Strong lift detected with current targeting. Create lookalike audiences based on converters.',
        expectedImpact: context.lift * 0.8,
        confidence: 0.8,
        actionItems: [
          'Create 1% lookalike from converters',
          'Create 3% lookalike from high-value converters',
          'Test against existing targeting',
          'Monitor performance differences'
        ]
      };
    }

    return null;
  }

  /**
   * Get timing recommendations
   */
  private getTimingRecommendation(context: RecommendationContext): Recommendation | null {
    if (context.sampleSize < 1000) {
      return {
        type: 'timing',
        priority: 'high',
        title: 'Extend Test Duration',
        description: `Sample size (${context.sampleSize}) is too small for statistical significance. Extend test duration to collect more data.`,
        expectedImpact: 15,
        confidence: 0.9,
        actionItems: [
          'Extend test by 2-4 weeks',
          'Increase traffic to test',
          'Consider narrowing targeting for faster results',
          'Monitor sample size daily'
        ]
      };
    }

    if (context.experimentType === 'a_b_test' && context.lift > 3) {
      return {
        type: 'timing',
        priority: 'low',
        title: 'Optimize Test Duration',
        description: 'Test showing positive results. Consider ending test early if statistical power is sufficient.',
        expectedImpact: 5,
        confidence: 0.6,
        actionItems: [
          'Check if statistical power > 80%',
          'Consider early stopping if p < 0.01',
          'Document learnings for future tests'
        ]
      };
    }

    return null;
  }

  /**
   * Get recommendations for an experiment
   */
  async getRecommendations(experimentId: string): Promise<Recommendation[]> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    return experiment.recommendations;
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    experimentId: string,
    recommendationIndex: number,
    status: 'pending' | 'approved' | 'rejected' | 'implemented'
  ): Promise<void> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.recommendations[recommendationIndex]) {
      (experiment.recommendations[recommendationIndex] as Record<string, unknown>).status = status;
      await experiment.save();
    }
  }

  /**
   * Get prioritized recommendations
   */
  async getPrioritizedRecommendations(experiments: string[]): Promise<{
    high: Recommendation[];
    medium: Recommendation[];
    low: Recommendation[];
  }> {
    const allRecommendations: Recommendation[] = [];

    for (const experimentId of experiments) {
      const recommendations = await this.getRecommendations(experimentId);
      allRecommendations.push(...recommendations);
    }

    return {
      high: allRecommendations.filter(r => r.priority === 'high'),
      medium: allRecommendations.filter(r => r.priority === 'medium'),
      low: allRecommendations.filter(r => r.priority === 'low')
    };
  }

  /**
   * Generate A/B test recommendations
   */
  async generateABTestRecommendations(experimentId: string): Promise<Recommendation[]> {
    const experiment = await Experiment.findById(experimentId);

    if (!experiment || experiment.type !== ExperimentType.A_B_TEST) {
      throw new Error('A/B test experiment not found');
    }

    const testGroups = await TestGroup.find({ experimentId });
    const treatment = testGroups.find(g => g.type === 'treatment');
    const control = testGroups.find(g => g.type === 'control');

    if (!treatment || !control) {
      throw new Error('Test groups not found');
    }

    const recommendations: Recommendation[] = [];

    // Compare CTR
    if (treatment.metrics.ctr > control.metrics.ctr * 1.1) {
      recommendations.push({
        type: 'creative',
        priority: 'high',
        title: 'Treatment Creative Wins on CTR',
        description: `Treatment CTR (${treatment.metrics.ctr.toFixed(2)}%) outperforms control (${control.metrics.ctr.toFixed(2)}%)`,
        expectedImpact: ((treatment.metrics.ctr - control.metrics.ctr) / control.metrics.ctr) * 100,
        confidence: 0.85,
        actionItems: [
          'Apply treatment creative to control group',
          'Test incremental improvements',
          'Document winning elements'
        ]
      });
    }

    // Compare CVR
    if (treatment.metrics.cvr > control.metrics.cvr * 1.1) {
      recommendations.push({
        type: 'targeting',
        priority: 'high',
        title: 'Treatment Landing Experience Wins',
        description: `Treatment CVR (${treatment.metrics.cvr.toFixed(2)}%) outperforms control (${control.metrics.cvr.toFixed(2)}%)`,
        expectedImpact: ((treatment.metrics.cvr - control.metrics.cvr) / control.metrics.cvr) * 100,
        confidence: 0.8,
        actionItems: [
          'Analyze landing page differences',
          'Apply winning elements to control',
          'Test additional improvements'
        ]
      });
    }

    return recommendations;
  }
}

export const recommendationService = new RecommendationService();