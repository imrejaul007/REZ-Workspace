import { ClickFraudResult, ClickFraudPattern, FraudEvent } from '../types';
import { logger } from '../utils/logger';

export class ClickFraudService {
  private clickWindow: number; // ms
  private minClickInterval: number; // ms
  private maxClicksPerIP: number;

  constructor(
    clickWindow: number = 300000, // 5 minutes
    minClickInterval: number = 1000, // 1 second
    maxClicksPerIP: number = 10
  ) {
    this.clickWindow = clickWindow;
    this.minClickInterval = minClickInterval;
    this.maxClicksPerIP = maxClicksPerIP;
  }

  analyze(
    events: FraudEvent[],
    sessionId: string
  ): ClickFraudResult {
    const patterns: ClickFraudPattern[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    // Filter to click events only
    const clickEvents = events.filter(e => e.eventType === 'click');

    // Pattern 1: Rapid clicks
    const rapidClicks = this.detectRapidClicks(clickEvents);
    patterns.push(rapidClicks);
    totalWeight += 25;
    weightedSum += 25 * (rapidClicks.detected ? 1 : 0);

    // Pattern 2: Coordinated clicks (same IP, multiple campaigns)
    const coordinatedClicks = this.detectCoordinatedClicks(clickEvents);
    patterns.push(coordinatedClicks);
    totalWeight += 30;
    weightedSum += 30 * (coordinatedClicks.detected ? 1 : 0);

    // Pattern 3: Click to impression ratio
    const ctrPattern = this.analyzeCTR(clickEvents, events);
    patterns.push(ctrPattern);
    totalWeight += 25;
    weightedSum += 25 * (ctrPattern.detected ? 1 : 0);

    // Pattern 4: Duplicate clicks on same ad
    const duplicateClicks = this.detectDuplicates(clickEvents);
    patterns.push(duplicateClicks);
    totalWeight += 20;
    weightedSum += 20 * (duplicateClicks.detected ? 1 : 0);

    const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    const isClickFraud = patterns.filter(p => p.detected).length >= 2;
    const confidence = patterns.filter(p => p.detected).length / patterns.length;

    logger.logClickFraud(sessionId, isClickFraud, patterns.filter(p => p.detected).length);

    return {
      isClickFraud,
      confidence,
      patterns,
      score: Math.round(score),
    };
  }

  private detectRapidClicks(clicks: FraudEvent[]): ClickFraudPattern {
    if (clicks.length < 2) {
      return {
        type: 'rapid_clicks',
        detected: false,
        value: 0,
        threshold: this.minClickInterval,
        description: 'Insufficient clicks for rapid-fire analysis',
      };
    }

    let rapidCount = 0;
    for (let i = 1; i < clicks.length; i++) {
      const timeDiff = clicks[i].timestamp.getTime() - clicks[i - 1].timestamp.getTime();
      if (timeDiff < this.minClickInterval) {
        rapidCount++;
      }
    }

    const ratio = rapidCount / (clicks.length - 1);
    const detected = ratio > 0.3; // More than 30% rapid clicks

    return {
      type: 'rapid_clicks',
      detected,
      value: Math.round(ratio * 100),
      threshold: 30,
      description: detected
        ? `${Math.round(ratio * 100)}% of clicks occur within ${this.minClickInterval}ms`
        : 'Click timing appears normal',
    };
  }

  private detectCoordinatedClicks(clicks: FraudEvent[]): ClickFraudPattern {
    // Group clicks by IP
    const ipGroups = new Map<string, number>();
    const campaignGroups = new Map<string, Set<string>>();

    for (const click of clicks) {
      const ip = click.ipAddress;
      ipGroups.set(ip, (ipGroups.get(ip) || 0) + 1);

      if (click.campaignId) {
        const campaigns = campaignGroups.get(ip) || new Set();
        campaigns.add(click.campaignId);
        campaignGroups.set(ip, campaigns);
      }
    }

    // Check for single IP hitting multiple campaigns
    let coordinatedIPs = 0;
    for (const [ip, campaigns] of campaignGroups) {
      if (campaigns.size > 3) {
        coordinatedIPs++;
      }
    }

    const detected = coordinatedIPs > 0 && clicks.length > 5;

    return {
      type: 'coordinated_clicks',
      detected,
      value: coordinatedIPs,
      threshold: 1,
      description: detected
        ? `${coordinatedIPs} IPs detected hitting multiple campaigns`
        : 'No coordinated click patterns detected',
    };
  }

  private analyzeCTR(clicks: FraudEvent[], allEvents: FraudEvent[]): ClickFraudPattern {
    const impressions = allEvents.filter(e => e.eventType === 'impression').length;

    if (impressions === 0) {
      return {
        type: 'click_to_impression_ratio',
        detected: false,
        value: 0,
        threshold: 20, // 20% CTR is suspicious
        description: 'No impressions to calculate CTR',
      };
    }

    const ctr = (clicks.length / impressions) * 100;
    const detected = ctr > 20; // Suspiciously high CTR

    return {
      type: 'click_to_impression_ratio',
      detected,
      value: Math.round(ctr * 10) / 10,
      threshold: 20,
      description: detected
        ? `CTR of ${ctr.toFixed(1)}% exceeds threshold of 20%`
        : `CTR of ${ctr.toFixed(1)}% is within normal range`,
    };
  }

  private detectDuplicates(clicks: FraudEvent[]): ClickFraudPattern {
    const adClickCounts = new Map<string, number>();

    for (const click of clicks) {
      if (click.adId) {
        adClickCounts.set(click.adId, (adClickCounts.get(click.adId) || 0) + 1);
      }
    }

    let duplicateAds = 0;
    for (const count of adClickCounts.values()) {
      if (count > 5) duplicateAds++;
    }

    const detected = duplicateAds > 0;

    return {
      type: 'duplicate_clicks',
      detected,
      value: duplicateAds,
      threshold: 1,
      description: detected
        ? `${duplicateAds} ads have excessive duplicate clicks`
        : 'No excessive duplicate clicks detected',
    };
  }

  updateThresholds(clickWindow?: number, minInterval?: number, maxClicks?: number): void {
    if (clickWindow !== undefined) this.clickWindow = clickWindow;
    if (minInterval !== undefined) this.minClickInterval = minInterval;
    if (maxClicks !== undefined) this.maxClicksPerIP = maxClicks;
  }
}

export const clickFraudService = new ClickFraudService();
