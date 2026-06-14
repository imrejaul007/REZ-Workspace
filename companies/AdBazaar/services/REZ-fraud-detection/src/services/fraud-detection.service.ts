import { v4 as uuidv4 } from 'uuid';
import {
  FraudCheckResult,
  FraudAssessment,
  FraudEvent,
  SessionData,
  BulkFraudCheckResult,
  EventType
} from '../types';
import { botService } from './bot.service';
import { clickFraudService } from './click-fraud.service';
import { viewabilityService } from './viewability.service';
import { ipFraudService } from './ip-fraud.service';
import { logger } from '../utils/logger';

export class FraudDetectionService {
  private sessions: Map<string, SessionData>;
  private cache: Map<string, FraudCheckResult>;
  private cacheTTL: number;

  constructor(cacheTTL: number = 30 * 60 * 1000) { // 30 minutes
    this.sessions = new Map();
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  async check(event: {
    eventType: EventType;
    sessionId: string;
    userId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
    adId?: string;
    campaignId?: string;
    creativeId?: string;
  }): Promise<FraudCheckResult> {
    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

    // Record the event
    const fraudEvent: FraudEvent = {
      id: uuidv4(),
      sessionId: event.sessionId,
      eventType: event.eventType,
      timestamp,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      userId: event.userId,
      adId: event.adId,
      campaignId: event.campaignId,
      creativeId: event.creativeId,
      metadata: event.metadata,
    };

    // Update session data
    this.recordEvent(fraudEvent);

    // Get session data for analysis
    const sessionData = this.sessions.get(event.sessionId);

    // Run all fraud checks in parallel
    const [botDetection, clickFraud, viewability, ipFraud] = await Promise.all([
      Promise.resolve(botService.detect(
        event.userAgent,
        sessionData ? {
          events: sessionData.events,
          ipAddresses: sessionData.ipAddresses,
        } : undefined
      )),
      Promise.resolve(clickFraudService.analyze(
        sessionData?.events || [fraudEvent],
        event.sessionId
      )),
      Promise.resolve(viewabilityService.assess(
        event.metadata as {
          timeInView?: number;
          viewportPercentage?: number;
          adPosition?: 'above' | 'below' | 'unknown';
          isBackground?: boolean;
        } | undefined
      )),
      Promise.resolve(ipFraudService.analyze(
        event.ipAddress,
        sessionData ? {
          events: sessionData.events,
        } : undefined
      )),
    ]);

    // Calculate overall assessment
    const overall = this.calculateAssessment(
      botDetection,
      clickFraud,
      viewability,
      ipFraud
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      botDetection,
      clickFraud,
      viewability,
      ipFraud
    );

    const result: FraudCheckResult = {
      sessionId: event.sessionId,
      timestamp,
      overall,
      botDetection,
      clickFraud,
      viewability,
      ipFraud,
      recommendations,
    };

    // Cache the result
    this.cacheResult(event.sessionId, result);

    logger.logFraudCheck(event.sessionId, overall.isFraudulent, overall.riskScore);

    return result;
  }

  async checkBulk(events: Array<{
    eventType: EventType;
    sessionId: string;
    userId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
    adId?: string;
    campaignId?: string;
    creativeId?: string;
  }>): Promise<BulkFraudCheckResult> {
    const results: FraudCheckResult[] = [];
    let fraudulent = 0;
    let suspicious = 0;
    let clean = 0;

    for (const event of events) {
      const result = await this.check(event);
      results.push(result);

      if (result.overall.isFraudulent) fraudulent++;
      else if (result.overall.riskLevel === 'medium') suspicious++;
      else clean++;
    }

    return {
      total: events.length,
      fraudulent,
      suspicious,
      clean,
      results,
    };
  }

  private recordEvent(event: FraudEvent): void {
    let session = this.sessions.get(event.sessionId);

    if (!session) {
      session = {
        sessionId: event.sessionId,
        startTime: event.timestamp,
        lastActivity: event.timestamp,
        ipAddresses: new Set(),
        events: [],
        clickCount: 0,
        impressionCount: 0,
        userAgent: event.userAgent,
        userId: event.userId,
      };
      this.sessions.set(event.sessionId, session);
    }

    session.lastActivity = event.timestamp;
    session.ipAddresses.add(event.ipAddress);
    session.events.push(event);

    if (event.eventType === 'click') session.clickCount++;
    if (event.eventType === 'impression') session.impressionCount++;
  }

  private calculateAssessment(
    botDetection: ReturnType<typeof botService.detect>,
    clickFraud: ReturnType<typeof clickFraudService.analyze>,
    viewability: ReturnType<typeof viewabilityService.assess>,
    ipFraud: ReturnType<typeof ipFraudService.analyze>
  ): FraudAssessment {
    // Weighted risk calculation
    const weights = {
      bot: 0.35,
      clickFraud: 0.30,
      viewability: 0.15,
      ipFraud: 0.20,
    };

    const riskScore =
      (botDetection.score * weights.bot) +
      (clickFraud.score * weights.clickFraud) +
      ((100 - viewability.score) * weights.viewability) +
      (ipFraud.score * weights.ipFraud);

    // Determine risk level
    let riskLevel: FraudAssessment['riskLevel'];
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Confidence based on number of signals
    const signalCount =
      (botDetection.confidence > 0.5 ? 1 : 0) +
      (clickFraud.confidence > 0.5 ? 1 : 0) +
      (ipFraud.confidence > 0.5 ? 1 : 0);

    const confidence = Math.min(0.9, 0.5 + signalCount * 0.15);

    return {
      isFraudulent: riskScore >= 60,
      riskScore: Math.round(riskScore),
      riskLevel,
      confidence,
    };
  }

  private generateRecommendations(
    botDetection: ReturnType<typeof botService.detect>,
    clickFraud: ReturnType<typeof clickFraudService.analyze>,
    viewability: ReturnType<typeof viewabilityService.assess>,
    ipFraud: ReturnType<typeof ipFraudService.analyze>
  ): string[] {
    const recommendations: string[] = [];

    if (botDetection.isBot) {
      recommendations.push('Block this session - bot behavior detected');
      recommendations.push('Consider adding CAPTCHA for similar sessions');
    }

    if (clickFraud.isClickFraud) {
      recommendations.push('Flag campaign for manual review');
      recommendations.push('Consider implementing click verification');
    }

    if (!viewability.meetsThreshold) {
      recommendations.push('Optimize ad placement for better viewability');
      recommendations.push('Consider removing low-viewability inventory');
    }

    if (ipFraud.isSuspiciousIP) {
      recommendations.push('Review traffic from this IP range');
      recommendations.push('Consider adding IP-based rate limiting');
    }

    if (recommendations.length === 0) {
      recommendations.push('No fraud indicators detected - traffic appears legitimate');
    }

    return recommendations;
  }

  private cacheResult(sessionId: string, result: FraudCheckResult): void {
    this.cache.set(sessionId, result);

    // Clean old cache entries
    if (this.cache.size > 10000) {
      const entries = Array.from(this.cache.entries());
      const oldEntries = entries.slice(0, 1000);
      oldEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  getCachedResult(sessionId: string): FraudCheckResult | undefined {
    return this.cache.get(sessionId);
  }

  getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.cache.delete(sessionId);
  }

  getStats(): { sessions: number; cachedResults: number } {
    return {
      sessions: this.sessions.size,
      cachedResults: this.cache.size,
    };
  }
}

export const fraudDetectionService = new FraudDetectionService();
