/**
 * Nudge Engine - Real-time Personalization
 * Delivers AI-generated nudges to users
 */

import { useUserStore } from '@/stores';
import { agentOrchestrator, DormancyAlert, TrendAlert, AgentInsight } from './agentOrchestrator';
import { rezMind } from './rezMindService';
import notificationService from './notifications';

export interface Nudge {
  id: string;
  type: 'dormancy' | 'trend' | 'personalized' | 'social' | 'urgency';
  title: string;
  message: string;
  action?: {
    label: string;
    route: string;
    params?: Record<string, string>;
  };
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  data?: Record<string, unknown>;
}

export interface NudgeContext {
  userId: string;
  location?: { lat: number; lng: number };
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek?: number;
}

class NudgeEngine {
  private activeNudges: Map<string, Nudge> = new Map();
  private listeners: ((nudge: Nudge) => void)[] = [];
  private subscribed = false;

  constructor() {
    this.subscribeToInsights();
  }

  /**
   * Subscribe to agent insights for real-time nudges
   */
  private subscribeToInsights(): void {
    if (this.subscribed) return;
    this.subscribed = true;

    agentOrchestrator.subscribe((insight: AgentInsight) => {
      this.handleInsight(insight);
    });
  }

  /**
   * Handle agent insight and create nudge
   */
  private async handleInsight(insight: AgentInsight): Promise<void> {
    const userId = useUserStore.getState().profile?.id;
    if (!userId) return;

    let nudge: Nudge | null = null;

    switch (insight.type) {
      case 'dormancy_alert':
        nudge = this.createDormancyNudge(insight);
        break;
      case 'trend_alert':
        nudge = this.createTrendNudge(insight);
        break;
      case 'personalization':
        nudge = this.createPersonalizationNudge(insight);
        break;
      case 'churn_risk':
        nudge = this.createChurnNudge(insight);
        break;
    }

    if (nudge) {
      this.activeNudges.set(nudge.id, nudge);
      this.emitNudge(nudge);
    }
  }

  /**
   * Create dormancy nudge
   */
  private createDormancyNudge(insight: AgentInsight): Nudge {
    const payload = insight.payload as DormancyAlert;
    const days = payload.daysSinceActive || 7;

    let message = "We've missed you!";
    if (days > 14) {
      message = `It's been ${days} days. Here's a special offer to come back:`;
    }

    return {
      id: `dormancy-${Date.now()}`,
      type: 'dormancy',
      title: 'We miss you! 🎁',
      message,
      action: {
        label: 'Claim Offer',
        route: '/explore',
      },
      priority: days > 30 ? 'high' : 'medium',
      data: insight.payload,
    };
  }

  /**
   * Create trend nudge
   */
  private createTrendNudge(insight: AgentInsight): Nudge {
    const payload = insight.payload as TrendAlert;
    const emojis: Record<string, string> = {
      restaurant: '🍽️',
      spa: '💆',
      events: '🎉',
      cafe: '☕',
      fitness: '💪',
    };
    const emoji = emojis[payload.category] || '✨';

    return {
      id: `trend-${Date.now()}`,
      type: 'trend',
      title: `${payload.trend} ${emoji}`,
      message: `Trending in ${payload.category}: ${payload.score * 100}% more bookings!`,
      action: {
        label: 'Explore',
        route: '/explore',
      },
      priority: 'low',
      expiresAt: payload.expiresAt,
      data: insight.payload,
    };
  }

  /**
   * Create personalization nudge
   */
  private createPersonalizationNudge(insight: AgentInsight): Nudge {
    const payload = insight.payload as {
      recommendation?: string;
      reason?: string;
    };

    return {
      id: `personalized-${Date.now()}`,
      type: 'personalized',
      title: 'Just for you',
      message: payload.recommendation || 'We found something you might love!',
      action: {
        label: 'View',
        route: '/explore',
      },
      priority: 'medium',
      data: insight.payload,
    };
  }

  /**
   * Create churn nudge
   */
  private createChurnNudge(insight: AgentInsight): Nudge {
    const payload = insight.payload as {
      score: number;
      level: string;
      factors: string[];
    };

    return {
      id: `churn-${Date.now()}`,
      type: 'urgency',
      title: "Don't miss out! ⏰",
      message: 'Your favorite places are waiting. Come back before the offers expire!',
      action: {
        label: 'See Deals',
        route: '/wallet',
      },
      priority: payload.level === 'high' ? 'high' : 'medium',
      data: insight.payload,
    };
  }

  /**
   * Get context for nudge personalization
   */
  async getContext(): Promise<NudgeContext> {
    const profile = useUserStore.getState().profile;
    const hour = new Date().getHours();

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    return {
      userId: profile?.id || '',
      timeOfDay,
      dayOfWeek: new Date().getDay(),
    };
  }

  /**
   * Generate nudges for user
   */
  async generateNudges(context?: Partial<NudgeContext>): Promise<Nudge[]> {
    const ctx = context || (await this.getContext());
    const nudges: Nudge[] = [];

    // Check for dormancy
    const dormancyAlert = await agentOrchestrator.checkDormancyAlerts(ctx.userId);
    if (dormancyAlert) {
      nudges.push(this.createDormancyNudge({
        type: 'dormancy_alert',
        source: 'ChurnRiskAgent',
        confidence: 0.8,
        reasoning: 'User inactive',
        payload: dormancyAlert,
        timestamp: new Date().toISOString(),
      }));
    }

    // Get trend alerts
    const trends = await agentOrchestrator.getTrendAlerts(ctx.location);
    trends.forEach((trend) => {
      nudges.push(this.createTrendNudge({
        type: 'trend_alert',
        source: 'TrendDetectorAgent',
        confidence: trend.score,
        reasoning: `${trend.trend} trending`,
        payload: trend,
        timestamp: new Date().toISOString(),
      }));
    });

    return nudges;
  }

  /**
   * Show nudge as notification
   */
  async showNudge(nudge: Nudge): Promise<void> {
    // Send push notification
    const userId = useUserStore.getState().profile?.id;
    if (!userId) return;

    await notificationService.sendLocalNotification({
      title: nudge.title,
      body: nudge.message,
      data: {
        type: 'nudge',
        nudgeId: nudge.id,
        route: nudge.action?.route,
        ...nudge.data,
      },
    });
  }

  /**
   * Dismiss nudge
   */
  dismissNudge(nudgeId: string): void {
    this.activeNudges.delete(nudgeId);
  }

  /**
   * Get active nudges
   */
  getActiveNudges(): Nudge[] {
    const now = new Date();
    const valid: Nudge[] = [];

    this.activeNudges.forEach((nudge) => {
      if (nudge.expiresAt && new Date(nudge.expiresAt) < now) {
        this.activeNudges.delete(nudge.id);
      } else {
        valid.push(nudge);
      }
    });

    return valid;
  }

  /**
   * Subscribe to nudges
   */
  subscribe(callback: (nudge: Nudge) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Emit nudge to listeners
   */
  private emitNudge(nudge: Nudge): void {
    this.listeners.forEach((callback) => callback(nudge));
  }

  /**
   * Trigger automated revival
   */
  async triggerAutomatedRevival(userId: string): Promise<void> {
    const dormancyAlert: DormancyAlert = {
      userId,
      daysSinceActive: 14,
      riskLevel: 'high',
      recommendedChannel: 'push',
      offer: { coins: 50, discountPercent: 20 },
    };

    const nudge = this.createDormancyNudge({
      type: 'dormancy_alert',
      source: 'ChurnRiskAgent',
      confidence: 0.9,
      reasoning: 'Automated revival triggered',
      payload: dormancyAlert,
      timestamp: new Date().toISOString(),
    });

    this.emitNudge(nudge);
    await this.showNudge(nudge);
  }
}

// ============================================
// Export
// ============================================

export const nudgeEngine = new NudgeEngine();
export default nudgeEngine;
