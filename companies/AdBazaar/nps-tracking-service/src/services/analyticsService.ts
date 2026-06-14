/**
 * Analytics Service - NPS analytics and reporting
 */

import { ResponseModel } from '../models/response';
import { AnalyticsModel } from '../models/analytics';
import { SurveyModel } from '../models/survey';
import { logger } from 'utils/logger.js';

export class AnalyticsService {
  /**
   * Get overall NPS analytics
   */
  async getAnalytics(period: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'): Promise<{
    npsScore: number;
    totalResponses: number;
    responseRate: number;
    promoters: number;
    passives: number;
    detractors: number;
    avgTimeToComplete: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  }> {
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        break;
    }

    // Get responses in period
    const responses = await ResponseModel.find({
      submittedAt: { $gte: periodStart, $lte: now },
    }).lean();

    const totalResponses = responses.length;
    if (totalResponses === 0) {
      return {
        npsScore: 0,
        totalResponses: 0,
        responseRate: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        avgTimeToComplete: 0,
        trend: 'stable',
        change: 0,
      };
    }

    const promoters = responses.filter(r => r.scoreCategory === 'promoter').length;
    const passives = responses.filter(r => r.scoreCategory === 'passive').length;
    const detractors = responses.filter(r => r.scoreCategory === 'detractor').length;

    // Calculate NPS: ((Promoters - Detractors) / Total) * 100
    const npsScore = Math.round(((promoters - detractors) / totalResponses) * 100);

    // Calculate response rate
    const totalSurveys = await SurveyModel.countDocuments({
      sentAt: { $gte: periodStart, $lte: now },
    });
    const responseRate = totalSurveys > 0 ? Math.round((totalResponses / totalSurveys) * 100) : 0;

    // Calculate avg time to complete
    const timeSum = responses.reduce((sum, r) => sum + (r.timeToComplete || 0), 0);
    const avgTimeToComplete = Math.round(timeSum / totalResponses);

    // Calculate trend vs previous period
    const previousPeriodStart = new Date(periodStart.getTime() - (now.getTime() - periodStart.getTime()));
    const previousResponses = await ResponseModel.find({
      submittedAt: { $gte: previousPeriodStart, $lt: periodStart },
    }).lean();

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let change = 0;

    if (previousResponses.length > 0) {
      const prevPromoters = previousResponses.filter(r => r.scoreCategory === 'promoter').length;
      const prevDetractors = previousResponses.filter(r => r.scoreCategory === 'detractor').length;
      const prevNps = Math.round(((prevPromoters - prevDetractors) / previousResponses.length) * 100);

      change = npsScore - prevNps;
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
    }

    return {
      npsScore,
      totalResponses,
      responseRate,
      promoters,
      passives,
      detractors,
      avgTimeToComplete,
      trend,
      change,
    };
  }

  /**
   * Get analytics by customer
   */
  async getCustomerAnalytics(customerId: string): Promise<any> {
    const responses = await ResponseModel.find({ customerId })
      .sort({ submittedAt: -1 })
      .limit(30)
      .lean();

    if (responses.length === 0) {
      return { customerId, npsScore: 0, totalResponses: 0, responses: [] };
    }

    const promoters = responses.filter(r => r.scoreCategory === 'promoter').length;
    const detractors = responses.filter(r => r.scoreCategory === 'detractor').length;
    const npsScore = Math.round(((promoters - detractors) / responses.length) * 100);

    // Calculate improvement areas
    const improvementCounts: Record<string, number> = {};
    responses.forEach(r => {
      r.improvementAreas.forEach(area => {
        improvementCounts[area] = (improvementCounts[area] || 0) + 1;
      });
    });

    const topImprovementAreas = Object.entries(improvementCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area]) => area);

    return {
      customerId,
      npsScore,
      totalResponses: responses.length,
      promoters,
      passives: responses.length - promoters - detractors,
      detractors,
      topImprovementAreas,
      responses: responses.map(r => ({
        date: r.submittedAt,
        score: r.overallScore,
        category: r.scoreCategory,
        feedback: r.feedback,
      })),
    };
  }

  /**
   * Store analytics snapshot
   */
  async storeAnalyticsSnapshot(period: 'daily' | 'weekly' | 'monthly' | 'quarterly'): Promise<void> {
    const analytics = await this.getAnalytics(period);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
        break;
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodEnd = now;
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
        break;
    }

    await AnalyticsModel.create({
      customerId: 'global',
      period,
      periodStart,
      periodEnd,
      ...analytics,
    });

    logger.info(`Stored analytics snapshot for period: ${period}`);
  }
}

export const analyticsService = new AnalyticsService();