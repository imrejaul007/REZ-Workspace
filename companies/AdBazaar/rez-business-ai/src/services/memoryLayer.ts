/**
 * REZ Business AI - Memory Layer
 *
 * AI-powered learning and memory system
 */

import { randomUUID } from 'crypto';

export interface AIMemory {
  merchantId: string;
  learnings: Learning[];
  preferences: MerchantPreferences;
  history: ActionHistory[];
  insights: LearnedInsight[];
  lastUpdated: Date;
}

export interface Learning {
  id: string;
  type: 'success' | 'failure' | 'pattern' | 'preference';
  category: string;
  data: Record<string, unknown>;
  confidence: number;
  timesApplied: number;
  successRate: number;
  createdAt: Date;
}

export interface MerchantPreferences {
  discountStyle: 'aggressive' | 'moderate' | 'minimal';
  communicationTone: 'formal' | 'friendly' | 'luxury';
  campaignFrequency: 'frequent' | 'moderate' | 'minimal';
  riskTolerance: 'high' | 'medium' | 'low';
  preferredChannels: ('whatsapp' | 'sms' | 'push' | 'email')[];
  avoidOffers: string[];
  successOfferStyles: string[];
  peakHours: number[];
  targetAudience: string;
}

export interface ActionHistory {
  id: string;
  type: string;
  action: string;
  params: Record<string, unknown>;
  result: 'success' | 'failure' | 'partial';
  revenue?: number;
  customers?: number;
  roi?: number;
  createdAt: Date;
}

export interface LearnedInsight {
  id: string;
  category: 'pricing' | 'marketing' | 'retention' | 'operations';
  insight: string;
  evidence: string[];
  reliability: number;
  actionable: boolean;
}

export class MemoryLayer {
  private memories: Map<string, AIMemory> = new Map();

  /**
   * Initialize memory for a merchant
   */
  initializeMemory(merchantId: string): AIMemory {
    const memory: AIMemory = {
      merchantId,
      learnings: [],
      preferences: this.getDefaultPreferences(),
      history: [],
      insights: [],
      lastUpdated: new Date(),
    };
    this.memories.set(merchantId, memory);
    return memory;
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): MerchantPreferences {
    return {
      discountStyle: 'moderate',
      communicationTone: 'friendly',
      campaignFrequency: 'moderate',
      riskTolerance: 'medium',
      preferredChannels: ['whatsapp', 'push'],
      avoidOffers: [],
      successOfferStyles: [],
      peakHours: [12, 19, 20],
      targetAudience: 'all',
    };
  }

  /**
   * Record an action result
   */
  recordAction(
    merchantId: string,
    action: ActionHistory
  ): void {
    let memory = this.memories.get(merchantId);
    if (!memory) {
      memory = this.initializeMemory(merchantId);
    }

    // Add to history
    memory.history.unshift(action);

    // Keep only last 100 actions
    if (memory.history.length > 100) {
      memory.history = memory.history.slice(0, 100);
    }

    // Learn from action
    this.learnFromAction(memory, action);

    // Update preferences
    this.updatePreferences(memory, action);

    memory.lastUpdated = new Date();
    this.memories.set(merchantId, memory);
  }

  /**
   * Learn from action result
   */
  private learnFromAction(memory: AIMemory, action: ActionHistory): void {
    const learning: Learning = {
      id: `learning-${Date.now()}-${randomUUID().replace(/-/g, '').substring(0, 9)}`,
      type: action.result === 'success' ? 'success' : action.result === 'partial' ? 'pattern' : 'failure',
      category: this.categorizeAction(action.action),
      data: action,
      confidence: this.calculateConfidence(action),
      timesApplied: 1,
      successRate: action.result === 'success' ? 1 : action.result === 'partial' ? 0.5 : 0,
      createdAt: new Date(),
    };

    // Check if similar learning exists
    const existingIndex = memory.learnings.findIndex(
      l => l.category === learning.category &&
           l.data.action === learning.data.action
    );

    if (existingIndex >= 0) {
      // Update existing learning
      const existing = memory.learnings[existingIndex];
      existing.timesApplied++;
      existing.successRate =
        (existing.successRate * (existing.timesApplied - 1) + learning.successRate) /
        existing.timesApplied;
      existing.confidence = this.calculateConfidenceFromHistory(existing);
      existing.data = action;
    } else {
      // Add new learning
      memory.learnings.unshift(learning);
    }

    // Keep only last 50 learnings
    if (memory.learnings.length > 50) {
      memory.learnings = memory.learnings.slice(0, 50);
    }

    // Generate insights
    this.generateInsights(memory);
  }

  /**
   * Categorize action
   */
  private categorizeAction(action: string): string {
    if (action.includes('pricing') || action.includes('discount')) return 'pricing';
    if (action.includes('campaign') || action.includes('marketing')) return 'marketing';
    if (action.includes('retention') || action.includes('loyalty')) return 'retention';
    return 'operations';
  }

  /**
   * Calculate confidence from action
   */
  private calculateConfidence(action: ActionHistory): number {
    let confidence = 0.5;

    // More data = higher confidence
    if (action.revenue) confidence += 0.1;
    if (action.roi) confidence += 0.15;

    // Success = higher confidence
    if (action.result === 'success') confidence += 0.15;
    if (action.result === 'failure') confidence -= 0.1;

    return Math.min(Math.max(confidence, 0.1), 0.95);
  }

  /**
   * Calculate confidence from history
   */
  private calculateConfidenceFromHistory(learning: Learning): number {
    const base = learning.successRate;
    const experience = Math.min(learning.timesApplied / 20, 1); // Max at 20 uses
    return Math.min(base + experience * 0.2, 0.95);
  }

  /**
   * Update preferences based on action
   */
  private updatePreferences(memory: AIMemory, action: ActionHistory): void {
    const prefs = memory.preferences;

    // Track discount style
    if (action.params?.discount) {
      if (action.params.discount > 30 && action.result === 'success') {
        prefs.discountStyle = 'aggressive';
      } else if (action.params.discount < 15 && action.result === 'success') {
        prefs.discountStyle = 'minimal';
      }
    }

    // Track successful offer styles
    if (action.result === 'success' && action.params?.type) {
      if (!prefs.successOfferStyles.includes(action.params.type)) {
        prefs.successOfferStyles.push(action.params.type);
      }
    }

    // Track communication tone
    if (action.result === 'success' && action.params?.message) {
      const message = action.params.message.toLowerCase();
      if (message.includes('hey') || message.includes('!')) {
        prefs.communicationTone = 'friendly';
      }
    }

    // Track channels
    if (action.params?.channels) {
      for (const channel of action.params.channels) {
        if (!prefs.preferredChannels.includes(channel)) {
          prefs.preferredChannels.push(channel);
        }
      }
    }
  }

  /**
   * Generate insights from learnings
   */
  private generateInsights(memory: AIMemory): void {
    const insights: LearnedInsight[] = [];

    // Pricing insights
    const pricingLearnings = memory.learnings.filter(l => l.category === 'pricing');
    const avgPricingSuccess = this.getAverageSuccess(pricingLearnings);
    if (pricingLearnings.length >= 3) {
      insights.push({
        id: `insight-pricing-${Date.now()}`,
        category: 'pricing',
        insight: `${pricingLearnings.length} pricing campaigns with ${(avgPricingSuccess * 100).toFixed(0)}% success rate`,
        evidence: pricingLearnings.slice(0, 3).map(l => l.data.action),
        reliability: pricingLearnings.length / 10,
        actionable: true,
      });
    }

    // Marketing insights
    const marketingLearnings = memory.learnings.filter(l => l.category === 'marketing');
    const avgMarketingSuccess = this.getAverageSuccess(marketingLearnings);
    if (marketingLearnings.length >= 3) {
      insights.push({
        id: `insight-marketing-${Date.now()}`,
        category: 'marketing',
        insight: `${prefs.communicationTone} tone works best for your campaigns`,
        evidence: marketingLearnings.slice(0, 3).map(l => l.data.action),
        reliability: avgMarketingSuccess,
        actionable: true,
      });
    }

    // Retention insights
    const retentionLearnings = memory.learnings.filter(l => l.category === 'retention');
    if (retentionLearnings.length >= 3) {
      insights.push({
        id: `insight-retention-${Date.now()}`,
        category: 'retention',
        insight: 'Customer retention campaigns perform well with personalized offers',
        evidence: retentionLearnings.slice(0, 3).map(l => l.data.action),
        reliability: this.getAverageSuccess(retentionLearnings),
        actionable: true,
      });
    }

    memory.insights = insights;
  }

  /**
   * Get average success rate
   */
  private getAverageSuccess(learnings: Learning[]): number {
    if (learnings.length === 0) return 0;
    return learnings.reduce((sum, l) => sum + l.successRate, 0) / learnings.length;
  }

  /**
   * Get memory for merchant
   */
  getMemory(merchantId: string): AIMemory | null {
    return this.memories.get(merchantId) || null;
  }

  /**
   * Get recommended actions based on memory
   */
  getRecommendations(merchantId: string): {
    action: string;
    confidence: number;
    reasoning: string;
  }[] {
    const memory = this.memories.get(merchantId);
    if (!memory) return [];

    const recommendations: {
      action: string;
      confidence: number;
      reasoning: string;
    }[] = [];

    // Recommend successful actions
    const successfulLearnings = memory.learnings
      .filter(l => l.successRate > 0.7 && l.type === 'success')
      .sort((a, b) => b.confidence - a.confidence);

    for (const learning of successfulLearnings.slice(0, 5)) {
      recommendations.push({
        action: learning.data.action,
        confidence: learning.confidence,
        reasoning: `This action succeeded ${(learning.successRate * 100).toFixed(0)}% of the time (${learning.timesApplied} uses)`,
      });
    }

    // Avoid failed actions
    const failedLearnings = memory.learnings
      .filter(l => l.successRate < 0.3 && l.timesApplied >= 2);

    for (const learning of failedLearnings.slice(0, 3)) {
      recommendations.push({
        action: `AVOID: ${learning.data.action}`,
        confidence: learning.confidence,
        reasoning: `This action failed ${((1 - learning.successRate) * 100).toFixed(0)}% of the time`,
      });
    }

    return recommendations;
  }

  /**
   * Adapt action based on memory
   */
  adaptAction(
    merchantId: string,
    action: Record<string, unknown>
  ): Record<string, unknown> {
    const memory = this.memories.get(merchantId);
    if (!memory) return action;

    const adapted = { ...action };

    // Apply discount style preference
    if (adapted.params?.discount) {
      const discount = adapted.params.discount;
      switch (memory.preferences.discountStyle) {
        case 'aggressive':
          // Keep higher discounts
          break;
        case 'minimal':
          // Reduce discount by 30%
          adapted.params.discount = Math.round(discount * 0.7);
          break;
        case 'moderate':
        default:
          // Reduce by 15%
          adapted.params.discount = Math.round(discount * 0.85);
      }
    }

    // Apply channel preferences
    if (adapted.params?.channels) {
      adapted.params.channels = memory.preferences.preferredChannels;
    }

    // Apply communication tone
    if (adapted.params?.message) {
      switch (memory.preferences.communicationTone) {
        case 'friendly':
          if (!adapted.params.message.includes('Hey') && !adapted.params.message.includes('!')) {
            adapted.params.message = `Hey! ${adapted.params.message}`;
          }
          break;
        case 'formal':
          adapted.params.message = adapted.params.message.replace(/Hey!/g, 'Dear Customer');
          break;
      }
    }

    // Apply peak hours
    adapted.params.optimalTime = memory.preferences.peakHours;

    return adapted;
  }
}

export const memoryLayer = new MemoryLayer();
