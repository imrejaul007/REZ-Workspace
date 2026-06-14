import { Creative } from '../models/Creative';
import { CreativePrediction } from '../models/CreativePrediction';
import { generationService } from './generationService';
import { predictionService } from './predictionService';
import { logger } from 'utils/logger.js';

export interface OptimizationOptions {
  goal: 'ctr' | 'conversions' | 'cpa' | 'roas' | 'engagement';
  budget?: number;
  constraints?: {
    maxChanges?: number;
    preserveElements?: string[];
    minCTR?: number;
    maxCPA?: number;
  };
}

export interface OptimizationResult {
  original: {
    creativeId: string;
    name: string;
    content: any;
    metrics: any;
  };
  optimized: {
    content: any;
    changes: Array<{
      element: string;
      before: string;
      after: string;
      reason: string;
    }>;
    predictedImprovement: {
      ctr: number;
      cvr: number;
      conversions: number;
    };
  };
  recommendations: string[];
  confidence: number;
}

interface ElementAnalysis {
  element: string;
  currentValue: string;
  score: number;
  suggestions: string[];
}

export class OptimizationService {
  async optimizeCreative(creativeId: string, options: OptimizationOptions): Promise<OptimizationResult> {
    try {
      logger.info('Starting creative optimization', { creativeId, goal: options.goal });

      const creative = await Creative.findById(creativeId).exec();
      if (!creative) throw new Error('Creative not found');

      // Analyze current creative elements
      const analysis = this.analyzeElements(creative, options.goal);

      // Generate improvements
      const improvements = this.generateImprovements(creative, analysis, options);

      // Apply changes
      const optimizedContent = this.applyChanges(creative.content, improvements);

      // Get prediction for optimized version
      const prediction = await predictionService.predict({
        creativeId,
        ...options.constraints
      });

      // Calculate predicted improvement
      const originalCTR = creative.metrics?.ctr || 1.0;
      const optimizedCTR = prediction.predictions.predictedCTR;
      const ctrImprovement = ((optimizedCTR - originalCTR) / originalCTR) * 100;

      const originalCVR = creative.metrics?.cvr || 2.0;
      const optimizedCVR = prediction.predictions.predictedCVR;
      const cvrImprovement = ((optimizedCVR - originalCVR) / originalCVR) * 100;

      const result: OptimizationResult = {
        original: {
          creativeId: creative._id.toString(),
          name: creative.name,
          content: creative.content,
          metrics: creative.metrics
        },
        optimized: {
          content: optimizedContent,
          changes: improvements.map(i => ({
            element: i.element,
            before: i.before,
            after: i.after,
            reason: i.reason
          })),
          predictedImprovement: {
            ctr: Math.round(ctrImprovement * 100) / 100,
            cvr: Math.round(cvrImprovement * 100) / 100,
            conversions: Math.round(prediction.predictions.predictedConversions - (creative.metrics?.conversions || 0))
          }
        },
        recommendations: prediction.recommendations,
        confidence: prediction.confidence.overallConfidence
      };

      logger.info(`Optimization complete: ${improvements.length} changes recommended`);
      return result;
    } catch (error) {
      logger.error('Failed to optimize creative:', error);
      throw error;
    }
  }

  private analyzeElements(creative: any, goal: string): ElementAnalysis[] {
    const analysis: ElementAnalysis[] = [];

    // Analyze headline
    if (creative.content?.headline) {
      analysis.push({
        element: 'headline',
        currentValue: creative.content.headline,
        score: this.scoreHeadline(creative.content.headline, goal),
        suggestions: this.suggestHeadlineImprovements(creative.content.headline, goal)
      });
    }

    // Analyze body
    if (creative.content?.body) {
      analysis.push({
        element: 'body',
        currentValue: creative.content.body,
        score: this.scoreBody(creative.content.body, goal),
        suggestions: this.suggestBodyImprovements(creative.content.body, goal)
      });
    }

    // Analyze CTA
    if (creative.content?.cta) {
      analysis.push({
        element: 'cta',
        currentValue: creative.content.cta,
        score: this.scoreCTA(creative.content.cta, goal),
        suggestions: this.suggestCTAImprovements(creative.content.cta, goal)
      });
    }

    return analysis;
  }

  private scoreHeadline(headline: string, goal: string): number {
    let score = 50; // Base score

    // Length scoring
    if (headline.length >= 5 && headline.length <= 50) score += 20;
    else if (headline.length <= 70) score += 10;

    // Power words
    const powerWords = ['free', 'new', 'limited', 'exclusive', 'save', 'get', 'try', 'discover'];
    if (powerWords.some(w => headline.toLowerCase().includes(w))) score += 15;

    // Numbers
    if (/\d/.test(headline)) score += 10;

    // Question
    if (headline.includes('?')) score += 5;

    return Math.min(score, 100);
  }

  private scoreBody(body: string, goal: string): number {
    let score = 50;

    // Length scoring
    if (body.length >= 50 && body.length <= 200) score += 20;
    else if (body.length >= 20 && body.length <= 300) score += 10;

    // Benefits focus
    const benefitWords = ['you', 'your', 'get', 'save', 'easy', 'simple', 'fast'];
    if (benefitWords.some(w => body.toLowerCase().includes(w))) score += 15;

    // Call to action mention
    if (body.toLowerCase().includes('click') || body.toLowerCase().includes('shop')) score += 10;

    return Math.min(score, 100);
  }

  private scoreCTA(cta: string, goal: string): number {
    let score = 60;

    // Action verbs
    const actionVerbs = ['get', 'shop', 'buy', 'try', 'start', 'join', 'learn', 'discover'];
    if (actionVerbs.some(v => cta.toLowerCase().startsWith(v))) score += 20;

    // Urgency
    const urgencyWords = ['now', 'today', 'limited', 'fast'];
    if (urgencyWords.some(w => cta.toLowerCase().includes(w))) score += 10;

    // Length
    if (cta.length >= 2 && cta.length <= 20) score += 10;

    return Math.min(score, 100);
  }

  private suggestHeadlineImprovements(headline: string, goal: string): string[] {
    const suggestions: string[] = [];

    if (headline.length > 50) {
      suggestions.push('Consider shortening headline to under 50 characters');
    }

    if (!/[?!.,]/.test(headline)) {
      suggestions.push('Add punctuation for better readability');
    }

    if (!/\d/.test(headline)) {
      suggestions.push('Add numbers or statistics for credibility');
    }

    if (!/free|new|limited/i.test(headline)) {
      suggestions.push('Consider adding power words like "Free", "New", or "Limited"');
    }

    return suggestions;
  }

  private suggestBodyImprovements(body: string, goal: string): string[] {
    const suggestions: string[] = [];

    if (body.length < 50) {
      suggestions.push('Consider expanding body text with more value proposition');
    }

    if (body.length > 300) {
      suggestions.push('Body text is long - consider shortening for mobile');
    }

    if (!/you|your/i.test(body)) {
      suggestions.push('Use second-person pronouns to connect with audience');
    }

    if (!/click|shop|get/i.test(body)) {
      suggestions.push('Include a soft call-to-action in body text');
    }

    return suggestions;
  }

  private suggestCTAImprovements(cta: string, goal: string): string[] {
    const suggestions: string[] = [];

    if (!/get|shop|buy|try/i.test(cta.toLowerCase())) {
      suggestions.push('Start CTA with an action verb like "Get", "Shop", or "Try"');
    }

    if (cta.length > 20) {
      suggestions.push('Consider shortening CTA to under 20 characters');
    }

    if (!/now|today|limited/i.test(cta.toLowerCase())) {
      suggestions.push('Add urgency words like "Now" or "Today"');
    }

    return suggestions;
  }

  private generateImprovements(
    creative: any,
    analysis: ElementAnalysis[],
    options: OptimizationOptions
  ): Array<{
    element: string;
    before: string;
    after: string;
    reason: string;
  }> {
    const improvements: Array<{
      element: string;
      before: string;
      after: string;
      reason: string;
    }> = [];

    const maxChanges = options.constraints?.maxChanges || 3;

    for (const element of analysis) {
      if (improvements.length >= maxChanges) break;

      if (element.score < 70 && element.suggestions.length > 0) {
        // Generate improved version
        const improved = this.improveElement(element.element, element.currentValue, options.goal);

        improvements.push({
          element: element.element,
          before: element.currentValue,
          after: improved,
          reason: element.suggestions[0]
        });
      }
    }

    return improvements;
  }

  private improveElement(element: string, currentValue: string, goal: string): string {
    switch (element) {
      case 'headline':
        return this.improveHeadline(currentValue, goal);
      case 'body':
        return this.improveBody(currentValue, goal);
      case 'cta':
        return this.improveCTA(currentValue, goal);
      default:
        return currentValue;
    }
  }

  private improveHeadline(headline: string, goal: string): string {
    // Add power word prefix
    const prefixes = ['NEW: ', 'FREE ', 'LIMITED: ', 'EXCLUSIVE '];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    // If already has prefix, modify the headline
    if (/^(new:|free|limited:|exclusive)/i.test(headline)) {
      return headline.length > 60 ? headline.substring(0, 57) + '...' : headline;
    }

    return `${randomPrefix}${headline}`;
  }

  private improveBody(body: string, goal: string): string {
    // Add benefit statement at the end
    const benefitStatements = [
      ' Get started today!',
      ' Try it free for 30 days.',
      ' Limited time offer - act now!',
      ' Join thousands of satisfied customers.'
    ];

    if (body.length < 200) {
      const randomStatement = benefitStatements[Math.floor(Math.random() * benefitStatements.length)];
      return body + randomStatement;
    }

    return body;
  }

  private improveCTA(cta: string, goal: string): string {
    const actionVerbs = ['Get', 'Shop', 'Try', 'Start'];
    const urgencySuffixes = [' Now', ' Today', ' - Limited', ' Free'];

    // Check if starts with action verb
    const startsWithAction = actionVerbs.some(v => cta.toLowerCase().startsWith(v.toLowerCase()));

    if (!startsWithAction) {
      const newCTA = actionVerbs[Math.floor(Math.random() * actionVerbs.length)] + ' ' + cta;
      return newCTA.length <= 25 ? newCTA : cta;
    }

    // Add urgency
    const randomSuffix = urgencySuffixes[Math.floor(Math.random() * urgencySuffixes.length)];
    const newCTA = cta + randomSuffix;
    return newCTA.length <= 25 ? newCTA : cta;
  }

  private applyChanges(
    content: any,
    improvements: Array<{ element: string; after: string }>
  ): any {
    const newContent = { ...content };

    for (const improvement of improvements) {
      switch (improvement.element) {
        case 'headline':
          newContent.headline = improvement.after;
          break;
        case 'body':
          newContent.body = improvement.after;
          break;
        case 'cta':
          newContent.cta = improvement.after;
          break;
      }
    }

    return newContent;
  }

  async batchOptimize(
    creativeIds: string[],
    options: OptimizationOptions
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    for (const creativeId of creativeIds) {
      try {
        const result = await this.optimizeCreative(creativeId, options);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to optimize creative ${creativeId}:`, error);
        // Continue with other creatives
      }
    }

    return results;
  }

  async getOptimizationHistory(creativeId: string): Promise<any[]> {
    // Would retrieve historical optimization attempts
    // For now, return mock data
    return [];
  }
}

export const optimizationService = new OptimizationService();