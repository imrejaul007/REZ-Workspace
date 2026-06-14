/**
 * REZ Business AI - Goal Engine
 *
 * AI-driven goal management and optimization
 */

import { BusinessIntelligence } from '../types';

export interface MerchantGoal {
  id: string;
  type: GoalType;
  category: GoalCategory;
  name: string;
  target: number;
  current: number;
  unit: 'revenue' | 'customers' | 'percentage' | 'count';
  timeline: 'daily' | 'weekly' | 'monthly';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'paused' | 'achieved' | 'failed';
  createdAt: Date;
  deadline?: Date;
}

export type GoalType =
  | 'revenue'
  | 'customers'
  | 'retention'
  | 'avg_order'
  | 'occupancy'
  | 'appointments'
  | 'reviews'
  | 'referrals';

export type GoalCategory =
  | 'revenue'
  | 'customer'
  | 'operational'
  | 'marketing'
  | 'reputation';

interface GoalProgress {
  goalId: string;
  progress: number;
  gap: number;
  daysRemaining: number;
  requiredDailyRate: number;
  status: 'on_track' | 'at_risk' | 'behind';
  recommendations: string[];
}

export class GoalEngine {
  /**
   * Create default goals for a merchant
   */
  createDefaultGoals(merchantId: string, businessType: string): MerchantGoal[] {
    const baseGoals: MerchantGoal[] = [
      {
        id: `goal-${merchantId}-revenue-daily`,
        type: 'revenue',
        category: 'revenue',
        name: 'Daily Revenue Target',
        target: 10000,
        current: 0,
        unit: 'revenue',
        timeline: 'daily',
        priority: 'high',
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: `goal-${merchantId}-customers-daily`,
        type: 'customers',
        category: 'customer',
        name: 'Daily Customer Target',
        target: 50,
        current: 0,
        unit: 'count',
        timeline: 'daily',
        priority: 'medium',
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: `goal-${merchantId}-retention-monthly`,
        type: 'retention',
        category: 'customer',
        name: 'Monthly Retention Rate',
        target: 80,
        current: 0,
        unit: 'percentage',
        timeline: 'monthly',
        priority: 'high',
        status: 'active',
        createdAt: new Date(),
      },
    ];

    // Add business-specific goals
    if (businessType === 'restaurant') {
      baseGoals.push(
        {
          id: `goal-${merchantId}-aov-daily`,
          type: 'avg_order',
          category: 'revenue',
          name: 'Average Order Value',
          target: 350,
          current: 0,
          unit: 'revenue',
          timeline: 'daily',
          priority: 'medium',
          status: 'active',
          createdAt: new Date(),
        }
      );
    }

    if (businessType === 'salon') {
      baseGoals.push(
        {
          id: `goal-${merchantId}-appointments-daily`,
          type: 'appointments',
          category: 'operational',
          name: 'Daily Appointments',
          target: 20,
          current: 0,
          unit: 'count',
          timeline: 'daily',
          priority: 'high',
          status: 'active',
          createdAt: new Date(),
        }
      );
    }

    if (businessType === 'gym') {
      baseGoals.push(
        {
          id: `goal-${merchantId}-attendance-daily`,
          type: 'customers',
          category: 'operational',
          name: 'Daily Check-ins',
          target: 30,
          current: 0,
          unit: 'count',
          timeline: 'daily',
          priority: 'medium',
          status: 'active',
          createdAt: new Date(),
        }
      );
    }

    return baseGoals;
  }

  /**
   * Calculate goal progress
   */
  calculateProgress(goal: MerchantGoal, intelligence: BusinessIntelligence): GoalProgress {
    const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
    const gap = goal.target - goal.current;
    const daysRemaining = goal.deadline
      ? Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 30;

    const totalDays = this.getDaysInPeriod(goal.timeline);
    const daysElapsed = totalDays - daysRemaining;
    const requiredDailyRate = gap / Math.max(daysRemaining, 1);

    const expectedProgress = (daysElapsed / totalDays) * 100;
    const status = this.getGoalStatus(progress, expectedProgress);

    const recommendations = this.generateRecommendations(goal, progress, status, intelligence);

    return {
      goalId: goal.id,
      progress: Math.min(progress, 100),
      gap,
      daysRemaining,
      requiredDailyRate,
      status,
      recommendations,
    };
  }

  /**
   * Get goal status
   */
  private getGoalStatus(progress: number, expectedProgress: number): 'on_track' | 'at_risk' | 'behind' {
    const variance = progress - expectedProgress;
    if (variance >= 5) return 'on_track';
    if (variance >= -10) return 'at_risk';
    return 'behind';
  }

  /**
   * Generate recommendations based on goal status
   */
  private generateRecommendations(
    goal: MerchantGoal,
    progress: number,
    status: 'on_track' | 'at_risk' | 'behind',
    intelligence: BusinessIntelligence
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'behind') {
      recommendations.push(`Goal is ${Math.round(100 - progress)}% behind target. Consider aggressive promotions.`);

      // Check for opportunities
      if (intelligence.eventImpact.length > 0) {
        const upcomingEvent = intelligence.eventImpact[0];
        recommendations.push(
          `Upcoming ${upcomingEvent.event} can boost ${goal.type}. Create event-based campaign.`
        );
      }

      if (intelligence.weatherImpact?.expectedDemandChange > 0.1) {
        recommendations.push(`Positive weather trend detected. Launch weather-based promotion.`);
      }

      // Add retention push for behind goals
      if (goal.category === 'customer' || goal.type === 'customers') {
        recommendations.push(`High-value inactive customers identified. Launch win-back campaign.`);
      }
    }

    if (status === 'at_risk') {
      recommendations.push(`Goal needs attention. Maintain current pace to achieve target.`);

      if (goal.type === 'revenue') {
        recommendations.push(`Focus on increasing average order value.`);
      }
    }

    if (status === 'on_track' && progress > 100) {
      recommendations.push(`Goal exceeded! Consider increasing next period's target.`);
    }

    return recommendations;
  }

  /**
   * Get days in period
   */
  private getDaysInPeriod(timeline: 'daily' | 'weekly' | 'monthly'): number {
    switch (timeline) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      default: return 30;
    }
  }

  /**
   * Optimize actions based on goals
   */
  optimizeForGoals(goals: MerchantGoal[], intelligence: BusinessIntelligence): {
    priority: string;
    suggestions: string[];
    resourceAllocation: Record<string, number>;
  } {
    // Sort goals by priority
    const sortedGoals = [...goals]
      .filter(g => g.status === 'active')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const topGoal = sortedGoals[0];
    const suggestions: string[] = [];
    const resourceAllocation: Record<string, number> = {};

    // Generate suggestions based on top goals
    for (const goal of sortedGoals.slice(0, 3)) {
      const progress = this.calculateProgress(goal, intelligence);

      if (progress.status === 'behind') {
        resourceAllocation[goal.type] = 0.6; // 60% resources to behind goals
      } else if (progress.status === 'at_risk') {
        resourceAllocation[goal.type] = 0.3; // 30% resources to at-risk goals
      } else {
        resourceAllocation[goal.type] = 0.1; // 10% resources to on-track goals
      }

      suggestions.push(...progress.recommendations);
    }

    return {
      priority: topGoal?.name || 'No active goals',
      suggestions: [...new Set(suggestions)], // Remove duplicates
      resourceAllocation,
    };
  }
}

export const goalEngine = new GoalEngine();
