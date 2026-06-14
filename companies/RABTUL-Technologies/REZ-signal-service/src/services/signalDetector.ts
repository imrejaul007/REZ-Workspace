/**
 * REZ Signal Service - Signal Detection Service
 *
 * Core service for detecting and scoring B2B intent signals
 */

import { SignalModel, ISignal, SignalType, IntentStage } from '../models/Signal.js';
import { CompanySignalsModel } from '../models/CompanySignals.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// ============================================================================
// Signal Detection Patterns
// ============================================================================

interface SignalPattern {
  type: SignalType;
  keywords: string[];
  intentStage: IntentStage;
  baseScore: number;
  intentWeights: { awareness: number; consideration: number; decision: number; purchase: number };
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    type: 'jobPosting',
    keywords: ['hiring', 'job', 'careers', 'join our team', 'open position', 'we\'re growing'],
    intentStage: 'consideration',
    baseScore: 45,
    intentWeights: { awareness: 0.2, consideration: 0.5, decision: 0.2, purchase: 0.1 },
  },
  {
    type: 'funding',
    keywords: ['raised', 'funding', 'series', 'investment', 'invested', 'venture capital', 'VC'],
    intentStage: 'decision',
    baseScore: 65,
    intentWeights: { awareness: 0.1, consideration: 0.2, decision: 0.4, purchase: 0.3 },
  },
  {
    type: 'technologyChange',
    keywords: ['migrating', 'switching to', 'new tech', 'digital transformation', 'implementation'],
    intentStage: 'consideration',
    baseScore: 70,
    intentWeights: { awareness: 0.1, consideration: 0.4, decision: 0.35, purchase: 0.15 },
  },
  {
    type: 'expansion',
    keywords: ['expanding', 'new office', 'new location', 'growing', 'scale up', 'new market'],
    intentStage: 'consideration',
    baseScore: 55,
    intentWeights: { awareness: 0.15, consideration: 0.45, decision: 0.3, purchase: 0.1 },
  },
  {
    type: 'executiveChange',
    keywords: ['new CEO', 'new CTO', 'new VP', 'appointed', 'promoted', 'leadership change'],
    intentStage: 'awareness',
    baseScore: 40,
    intentWeights: { awareness: 0.5, consideration: 0.3, decision: 0.15, purchase: 0.05 },
  },
  {
    type: 'partnership',
    keywords: ['partnership', 'strategic alliance', 'collaboration', 'integrated with'],
    intentStage: 'consideration',
    baseScore: 50,
    intentWeights: { awareness: 0.2, consideration: 0.45, decision: 0.25, purchase: 0.1 },
  },
  {
    type: 'productLaunch',
    keywords: ['launching', 'released', 'announcing', 'new product', 'new feature', 'update'],
    intentStage: 'awareness',
    baseScore: 35,
    intentWeights: { awareness: 0.6, consideration: 0.25, decision: 0.1, purchase: 0.05 },
  },
  {
    type: 'news',
    keywords: ['in the news', 'featured', 'press release', 'article', 'blog post'],
    intentStage: 'awareness',
    baseScore: 25,
    intentWeights: { awareness: 0.7, consideration: 0.2, decision: 0.07, purchase: 0.03 },
  },
  {
    type: 'socialEngagement',
    keywords: ['engagement', 'followers', 'mentions', 'shares', 'likes'],
    intentStage: 'awareness',
    baseScore: 20,
    intentWeights: { awareness: 0.8, consideration: 0.15, decision: 0.04, purchase: 0.01 },
  },
  {
    type: 'regulatory',
    keywords: ['compliance', 'regulation', 'audit', 'certification', 'requirement'],
    intentStage: 'decision',
    baseScore: 60,
    intentWeights: { awareness: 0.1, consideration: 0.2, decision: 0.45, purchase: 0.25 },
  },
];

// ============================================================================
// Signal Detection Service
// ============================================================================

export class SignalDetector {
  /**
   * Detect signals from raw text input
   */
  static detectFromText(
    text: string,
    source: string
  ): { type: SignalType; score: number; confidence: number; intentStage: IntentStage }[] {
    const signals: { type: SignalType; score: number; confidence: number; intentStage: IntentStage }[] = [];
    const lowerText = text.toLowerCase();

    for (const pattern of SIGNAL_PATTERNS) {
      let matchCount = 0;
      for (const keyword of pattern.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        // Confidence increases with more keyword matches
        const confidence = Math.min(0.5 + (matchCount / pattern.keywords.length) * 0.5, 1);
        // Score increases with more matches
        const score = Math.min(pattern.baseScore + (matchCount * 5), 100);

        signals.push({
          type: pattern.type,
          score: Math.round(score),
          confidence: Math.round(confidence * 100) / 100,
          intentStage: pattern.intentStage,
        });
      }
    }

    return signals;
  }

  /**
   * Create a new signal
   */
  static async createSignal(data: {
    tenantId: string;
    companyId: string;
    companyName: string;
    type: SignalType;
    source: 'linkedin' | 'twitter' | 'news' | 'jobBoard' | 'website' | 'email' | 'ad' | 'manual' | 'api';
    title: string;
    description: string;
    url?: string;
    metadata?: Record<string, any>;
  }): Promise<ISignal> {
    // Detect intent from title/description
    const detections = this.detectFromText(
      `${data.title} ${data.description}`,
      data.source
    );

    // Find matching detection or use defaults
    const detection = detections.find(d => d.type === data.type) || {
      score: 50,
      confidence: 0.5,
      intentStage: 'awareness' as IntentStage,
    };

    // Calculate intent scores
    const pattern = SIGNAL_PATTERNS.find(p => p.type === data.type);
    const intentScore = {
      awareness: pattern?.intentWeights.awareness || 0.3,
      consideration: pattern?.intentWeights.consideration || 0.3,
      decision: pattern?.intentWeights.decision || 0.2,
      purchase: pattern?.intentWeights.purchase || 0.2,
    };

    // Determine if signal is notable (high score or high confidence)
    const isNotable = detection.score >= 60 || detection.confidence >= 0.7;

    const signal = await SignalModel.create({
      ...data,
      score: detection.score,
      confidence: detection.confidence,
      intentStage: detection.intentStage,
      intentScore: {
        awareness: Math.round(intentScore.awareness * 100),
        consideration: Math.round(intentScore.consideration * 100),
        decision: Math.round(intentScore.decision * 100),
        purchase: Math.round(intentScore.purchase * 100),
      },
      isActive: true,
      isNotable,
      timestamp: new Date(),
    });

    // Update company aggregates
    await this.updateCompanySignals(data.tenantId, data.companyId);

    logger.info('Signal created', {
      signalId: signal._id,
      type: signal.type,
      score: signal.score,
    });

    return signal;
  }

  /**
   * Update company signal aggregates
   */
  static async updateCompanySignals(tenantId: string, companyId: string): Promise<void> {
    // Get recent signals for this company
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const signals = await SignalModel.find({
      tenantId,
      companyId,
      timestamp: { $gte: thirtyDaysAgo },
      isActive: true,
    }).sort({ timestamp: -1 });

    if (signals.length === 0) {
      return;
    }

    // Calculate aggregates
    const totalSignals = signals.length;
    const avgScore = signals.reduce((sum, s) => sum + s.score, 0) / totalSignals;
    const avgEngagement = signals.reduce((sum, s) => sum + (s.engagementScore || 0), 0) / totalSignals;

    // Count by type
    const signalCounts = {
      jobPosting: 0,
      funding: 0,
      news: 0,
      technologyChange: 0,
      expansion: 0,
      executiveChange: 0,
      partnership: 0,
      productLaunch: 0,
      regulatory: 0,
      other: 0,
    };

    // Calculate intent stage distribution
    let awareness = 0, consideration = 0, decision = 0, purchase = 0;

    for (const signal of signals) {
      const countKey = signal.type in signalCounts ? signal.type : 'other';
      signalCounts[countKey as keyof typeof signalCounts]++;

      switch (signal.intentStage) {
        case 'awareness': awareness++; break;
        case 'consideration': consideration++; break;
        case 'decision': decision++; break;
        case 'purchase': purchase++; break;
      }
    }

    // Determine dominant intent stage
    const stages = { awareness, consideration, decision, purchase };
    const dominantStage = Object.entries(stages).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0] as IntentStage;

    // Calculate trends
    const dailySignals = new Map<string, { count: number; totalScore: number }>();

    for (const signal of signals) {
      const dateKey = signal.timestamp.toISOString().split('T')[0];
      const existing = dailySignals.get(dateKey) || { count: 0, totalScore: 0 };
      existing.count++;
      existing.totalScore += signal.score;
      dailySignals.set(dateKey, existing);
    }

    const signalTrends = Array.from(dailySignals.entries())
      .map(([date, data]) => ({
        date: new Date(date),
        count: data.count,
        score: data.totalScore / data.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate trend direction
    const recentAvg = signalTrends.slice(-7).reduce((sum, t) => sum + t.count, 0) / Math.min(7, signalTrends.length);
    const olderAvg = signalTrends.slice(-14, -7).reduce((sum, t) => sum + t.count, 0) / 7;
    const trendPercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    const trendDirection = trendPercentage > 10 ? 'increasing' : trendPercentage < -10 ? 'decreasing' : 'stable';

    // Notable signals
    const notableSignals = signals.filter(s => s.isNotable).slice(0, 10).map(s => s._id);

    // Update or create company signals record
    const companyName = signals[0].companyName;

    await CompanySignalsModel.findOneAndUpdate(
      { tenantId, companyId },
      {
        tenantId,
        companyId,
        companyName,
        overallScore: Math.round(avgScore),
        intentStage: dominantStage,
        intentScore: {
          awareness: Math.round((awareness / totalSignals) * 100),
          consideration: Math.round((consideration / totalSignals) * 100),
          decision: Math.round((decision / totalSignals) * 100),
          purchase: Math.round((purchase / totalSignals) * 100),
        },
        signalCounts,
        totalSignals,
        signalTrends,
        trendDirection,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        avgEngagement: Math.round(avgEngagement),
        totalEngagement: signals.reduce((sum, s) => sum + (s.engagementScore || 0), 0),
        notableSignals,
        lastSignalAt: signals[0].timestamp,
        isMonitored: true,
        priority: avgScore >= 70 ? 'high' : avgScore >= 50 ? 'medium' : 'low',
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Get signals for a company
   */
  static async getCompanySignals(
    tenantId: string,
    companyId: string,
    options: {
      types?: SignalType[];
      minScore?: number;
      intentStage?: IntentStage;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const query: any = { tenantId, companyId, isActive: true };

    if (options.types?.length) {
      query.type = { $in: options.types };
    }
    if (options.minScore) {
      query.score = { $gte: options.minScore };
    }
    if (options.intentStage) {
      query.intentStage = options.intentStage;
    }

    const signals = await SignalModel.find(query)
      .sort({ timestamp: -1, score: -1 })
      .skip(options.offset || 0)
      .limit(options.limit || 50);

    const total = await SignalModel.countDocuments(query);

    return { signals, total };
  }

  /**
   * Get top signals across all companies
   */
  static async getTopSignals(
    tenantId: string,
    options: {
      minScore?: number;
      intentStage?: IntentStage;
      limit?: number;
      timeframe?: number; // days
    } = {}
  ) {
    const query: any = { tenantId, isActive: true };

    if (options.minScore) {
      query.score = { $gte: options.minScore };
    }
    if (options.intentStage) {
      query.intentStage = options.intentStage;
    }
    if (options.timeframe) {
      query.timestamp = { $gte: new Date(Date.now() - options.timeframe * 24 * 60 * 60 * 1000) };
    }

    const signals = await SignalModel.find(query)
      .sort({ score: -1, timestamp: -1 })
      .limit(options.limit || 50);

    return signals;
  }
}

export default SignalDetector;
