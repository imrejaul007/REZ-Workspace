/**
 * Fitness Health Scorer - Metrics for gym/fitness centers
 */

import axios from 'axios';

const FITNESS_SERVICE_URL = process.env.FITNESS_SERVICE_URL || 'http://localhost:4035';

export interface FitnessMetrics {
  members: {
    total: number;
    active: number;
    expired: number;
    paused: number;
  };
  classes: {
    total: number;
    capacity: number;
    attendance: number;
    popularClass: string;
  };
  trainers: {
    total: number;
    active: number;
    avgRating: number;
  };
  revenue: {
    thisMonth: number;
    renewals: number;
    newMembers: number;
  };
  engagement: {
    avgCheckIns: number;
    classAttendanceRate: number;
    churnRisk: number;
  };
}

export interface FitnessHealthScore {
  overall: number;
  breakdown: {
    memberHealth: number;
    classHealth: number;
    trainerHealth: number;
    revenueHealth: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export class FitnessHealthScorer {
  async getMetrics(merchantId: string): Promise<FitnessMetrics> {
    try {
      const res = await axios.get(`${FITNESS_SERVICE_URL}/api/fitness/${merchantId}/metrics`, { timeout: 5000 });
      return res.data.data;
    } catch {
      return this.getMockMetrics();
    }
  }

  async calculateHealthScore(merchantId: string): Promise<FitnessHealthScore> {
    const m = await this.getMetrics(merchantId);

    const memberHealth = this.calculateMemberHealth(m);
    const classHealth = this.calculateClassHealth(m);
    const trainerHealth = this.calculateTrainerHealth(m);
    const revenueHealth = this.calculateRevenueHealth(m);

    const overall = Math.round(
      memberHealth * 0.3 +
      classHealth * 0.25 +
      trainerHealth * 0.15 +
      revenueHealth * 0.3
    );

    const recommendations = this.getRecommendations(m);

    return {
      overall,
      breakdown: {
        memberHealth: Math.round(memberHealth),
        classHealth: Math.round(classHealth),
        trainerHealth: Math.round(trainerHealth),
        revenueHealth: Math.round(revenueHealth),
      },
      trend: overall > 70 ? 'improving' : overall > 50 ? 'stable' : 'declining',
      recommendations,
    };
  }

  private calculateMemberHealth(m: FitnessMetrics): number {
    const activeRate = m.members.total > 0
      ? (m.members.active / m.members.total) * 100
      : 0;
    const churnPenalty = m.engagement.churnRisk * 2;
    return Math.max(0, Math.min(100, activeRate - churnPenalty));
  }

  private calculateClassHealth(m: FitnessMetrics): number {
    const capacity = m.classes.capacity > 0
      ? (m.classes.attendance / m.classes.capacity) * 100
      : 0;
    return Math.min(100, capacity);
  }

  private calculateTrainerHealth(m: FitnessMetrics): number {
    const activeRate = m.trainers.total > 0
      ? (m.trainers.active / m.trainers.total) * 100
      : 0;
    const ratingBonus = m.trainers.avgRating * 10;
    return Math.min(100, activeRate + ratingBonus);
  }

  private calculateRevenueHealth(m: FitnessMetrics): number {
    const renewalRate = m.revenue.renewals > 0 && m.members.expired > 0
      ? (m.revenue.renewals / m.members.expired) * 100
      : 50;
    const growthBonus = m.revenue.newMembers * 2;
    return Math.min(100, renewalRate + growthBonus);
  }

  private getRecommendations(m: FitnessMetrics): string[] {
    const recs: string[] = [];

    if (m.engagement.churnRisk > 30) {
      recs.push('High churn risk - send retention offers to at-risk members');
    }

    if (m.classes.capacity > 0 && m.classes.attendance / m.classes.capacity < 0.5) {
      recs.push('Class attendance low - promote popular classes or adjust timing');
    }

    if (m.members.expired > m.revenue.newMembers) {
      recs.push('Member attrition exceeds acquisition - review pricing and retention');
    }

    return recs;
  }

  private getMockMetrics(): FitnessMetrics {
    return {
      members: { total: 150, active: 120, expired: 20, paused: 10 },
      classes: { total: 25, capacity: 80, attendance: 65, popularClass: 'Yoga Flow' },
      trainers: { total: 8, active: 7, avgRating: 4.5 },
      revenue: { thisMonth: 285000, renewals: 15, newMembers: 12 },
      engagement: { avgCheckIns: 3.2, classAttendanceRate: 0.81, churnRisk: 15 },
    };
  }
}

export const fitnessHealthScorer = new FitnessHealthScorer();
