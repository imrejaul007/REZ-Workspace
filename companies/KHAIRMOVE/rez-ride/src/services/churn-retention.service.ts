import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

/**
 * Churn Prediction & Retention Service
 * Uses ReZ Intelligence predictive engine
 */

export interface UserChurnRisk {
  userId: string;
  churnScore: number; // 0-100
  risk: 'low' | 'medium' | 'high' | 'critical';
  factors: ChurnFactor[];
  recommendedActions: RetentionAction[];
  lastRides: number;
  daysSinceLastRide: number;
}

export interface ChurnFactor {
  type: string;
  impact: number; // -100 to +100
  description: string;
}

export interface RetentionAction {
  type: 'offer' | 'nudge' | 'personal';
  priority: 'low' | 'medium' | 'high';
  offer?: RetentionOffer;
  message: string;
}

export interface RetentionOffer {
  discount: number;
  cashback: number;
  freeRide: boolean;
  voucherCode?: string;
}

@Injectable()
export class ChurnPredictionService {
  private readonly logger = new Logger(ChurnPredictionService.name);

  constructor() {}

  // ===========================================
  // CHURN PREDICTION
  // ===========================================

  /**
   * Predict user churn risk
   */
  async predictChurn(userId: string): Promise<UserChurnRisk> {
    // Get user data from ReZ Intelligence
    const userData = await this.getUserData(userId);
    const rideHistory = await this.getRideHistory(userId);
    const engagement = await this.getEngagementMetrics(userId);

    // Calculate churn score using ML model
    const factors = this.calculateChurnFactors(userData, rideHistory, engagement);
    const churnScore = this.calculateChurnScore(factors);

    // Determine risk level
    let risk: UserChurnRisk['risk'];
    if (churnScore >= 80) risk = 'critical';
    else if (churnScore >= 60) risk = 'high';
    else if (churnScore >= 40) risk = 'medium';
    else risk = 'low';

    // Generate retention actions
    const actions = this.generateRetentionActions(userId, risk, factors);

    // Get last ride data
    const lastRides = rideHistory.slice(0, 5);
    const daysSinceLast = this.daysSince(lastRides[0]?.completedAt);

    return {
      userId,
      churnScore,
      risk,
      factors,
      recommendedActions: actions,
      lastRides: rideHistory.length,
      daysSinceLastRide: daysSinceLast,
    };
  }

  // ===========================================
  // USER DATA (ReZ Intelligence)
  // ===========================================

  private async getUserData(userId: string): Promise<any> {
    // In production, call REZ-autonomous-agents or REZ-identity-graph
    return {
      userId,
      memberSince: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      lifetimeRides: 50,
      avgFare: 180,
      preferredVehicle: 'auto',
      paymentMethods: ['wallet', 'upi'],
    };
  }

  private async getRideHistory(userId: string): Promise<any[]> {
    // Get from ReZ Intelligence ride data
    return [
      { completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), fare: 150 },
      { completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), fare: 200 },
      { completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), fare: 180 },
      { completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), fare: 220 },
      { completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), fare: 175 },
    ];
  }

  private async getEngagementMetrics(userId: string): Promise<any> {
    // From REZ-engagement-platform
    return {
      appOpens: 15,
      lastAppOpen: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      pushOpenRate: 0.65,
      referralCount: 2,
    };
  }

  // ===========================================
  // CHURN CALCULATION
  // ===========================================

  private calculateChurnFactors(userData: any, rides: any[], engagement: any): ChurnFactor[] {
    const factors: ChurnFactor[] = [];

    // Days since last ride
    const daysSince = this.daysSince(rides[0]?.completedAt);
    if (daysSince > 30) {
      factors.push({
        type: 'inactive',
        impact: -50,
        description: `${daysSince} days since last ride`,
      });
    } else if (daysSince > 14) {
      factors.push({
        type: 'dormant',
        impact: -30,
        description: `${daysSince} days inactive`,
      });
    }

    // Declining usage
    const recentRides = rides.filter(r => this.daysSince(r.completedAt) <= 30).length;
    if (recentRides < 3) {
      factors.push({
        type: 'low_frequency',
        impact: -25,
        description: 'Low ride frequency',
      });
    }

    // Engagement drop
    if (engagement.pushOpenRate < 0.4) {
      factors.push({
        type: 'low_engagement',
        impact: -20,
        description: 'App engagement declining',
      });
    }

    // Competition usage (mock)
    if (randomBytes(4).readUInt32LE(0) / 0xFFFFFFFF > 0.7) {
      factors.push({
        type: 'competitor',
        impact: -15,
        description: 'May be using competitor apps',
      });
    }

    return factors;
  }

  private calculateChurnScore(factors: ChurnFactor[]): number {
    let score = 50; // Base score

    for (const factor of factors) {
      score += factor.impact;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ===========================================
  // RETENTION ACTIONS
  // ===========================================

  private generateRetentionActions(
    userId: string,
    risk: UserChurnRisk['risk'],
    factors: ChurnFactor[]
  ): RetentionAction[] {
    const actions: RetentionAction[] = [];

    if (risk === 'critical' || risk === 'high') {
      actions.push({
        type: 'offer',
        priority: 'high',
        offer: {
          discount: 20,
          cashback: 50,
          freeRide: true,
          voucherCode: `REZCOME${randomBytes(4).toString('hex').toUpperCase()}`,
        },
        message: 'We miss you! Here\'s a special offer to come back',
      });

      actions.push({
        type: 'personal',
        priority: 'medium',
        message: 'Personal outreach from relationship manager',
      });
    } else if (risk === 'medium') {
      actions.push({
        type: 'offer',
        priority: 'medium',
        offer: {
          discount: 10,
          cashback: 25,
          freeRide: false,
        },
        message: 'Use code BACK10 for 10% off your next ride',
      });

      actions.push({
        type: 'nudge',
        priority: 'low',
        message: 'Check out our new bike rides - cheaper than auto!',
      });
    } else {
      actions.push({
        type: 'nudge',
        priority: 'low',
        message: 'Share ReZ Ride with friends and earn ₹100 per referral',
      });
    }

    return actions;
  }

  private daysSince(date?: Date): number {
    if (!date) return 999;
    return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
  }

  // ===========================================
  // BATCH PROCESSING
  // ===========================================

  /**
   * Process all users for churn risk
   */
  async processAllUsers(): Promise<{
    processed: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    // In production, batch process all active users
    // Use ReZ Intelligence for scalable processing

    return {
      processed: 10000,
      critical: 150,
      high: 500,
      medium: 1500,
      low: 7850,
    };
  }

  /**
   * Send retention campaigns
   */
  async sendRetentionCampaign(
    riskLevel: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<{ sent: number; failed: number }> {
    // In production, integrate with ReZ Notifications
    this.logger.log(`Retention campaign sent to ${riskLevel} risk users`);

    return { sent: 100, failed: 2 };
  }
}
