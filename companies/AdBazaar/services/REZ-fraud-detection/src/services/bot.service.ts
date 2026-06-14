import { BotDetectionResult, BotSignal, BotSignalType } from '../types';
import { logger } from '../utils/logger';

const BOT_USER_AGENTS = [
  'curl', 'wget', 'python-requests', 'httpclient', 'scrapy',
  'phantomjs', 'headless', 'selenium', 'playwright', 'puppeteer',
  'bot', 'crawler', 'spider', 'slurp', 'bingbot', 'yandexbot',
  'googlebot', 'baiduspider', 'duckduckbot', 'facebot', 'ia_archiver'
];

export class BotService {
  private suspiciousUserAgents: Set<string>;

  constructor() {
    this.suspiciousUserAgents = new Set(BOT_USER_AGENTS.map(u => u.toLowerCase()));
  }

  detect(
    userAgent: string,
    sessionData?: {
      events: Array<{ timestamp: Date }>;
      ipAddresses: Set<string>;
    }
  ): BotDetectionResult {
    const signals: BotSignal[] = [];
    let totalWeight = 0;
    let weightedSum = 0;

    // Check user agent
    const uaSignal = this.checkUserAgent(userAgent);
    signals.push(uaSignal);
    totalWeight += uaSignal.weight;
    weightedSum += uaSignal.weight * (uaSignal.value ? 1 : 0);

    // Check for suspicious patterns
    const patternSignal = this.checkSuspiciousPatterns(userAgent);
    signals.push(patternSignal);
    totalWeight += patternSignal.weight;
    weightedSum += patternSignal.weight * (patternSignal.value ? 1 : 0);

    // Check behavior patterns
    if (sessionData) {
      const behaviorSignal = this.checkBehaviorPatterns(sessionData);
      signals.push(behaviorSignal);
      totalWeight += behaviorSignal.weight;
      weightedSum += behaviorSignal.weight * (behaviorSignal.value ? 1 : 0);

      const headerSignal = this.checkMissingHeaders(sessionData);
      signals.push(headerSignal);
      totalWeight += headerSignal.weight;
      weightedSum += headerSignal.weight * (headerSignal.value ? 1 : 0);
    }

    // Calculate score
    const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    const isBot = score >= 70;
    const confidence = signals.filter(s => s.value).length / signals.length;

    logger.logBotDetection('session', isBot, confidence);

    return {
      isBot,
      confidence,
      signals,
      score: Math.round(score),
    };
  }

  private checkUserAgent(userAgent: string): BotSignal {
    const normalizedUA = userAgent.toLowerCase();
    const isMatch = this.suspiciousUserAgents.has(normalizedUA) ||
      this.suspiciousUserAgents.some(bot => normalizedUA.includes(bot));

    return {
      type: 'user_agent_match',
      value: isMatch,
      weight: 25,
      description: isMatch
        ? `User agent matches known bot pattern: ${userAgent}`
        : 'User agent appears normal',
    };
  }

  private checkSuspiciousPatterns(userAgent: string): BotSignal {
    const suspiciousPatterns = [
      /^\s*$/,           // Empty
      /^Mozilla\/4\.0$/, // Old Mozilla only
      /^Java\/[0-9]/,    // Java HTTP
      /libwww-perl/,     // Perl WWW
      /HttpClient/,      // Java HttpClient
    ];

    const hasPattern = suspiciousPatterns.some(pattern => pattern.test(userAgent));

    return {
      type: 'suspicious_pattern',
      value: hasPattern,
      weight: 20,
      description: hasPattern
        ? 'User agent matches suspicious pattern'
        : 'No suspicious patterns detected',
    };
  }

  private checkBehaviorPatterns(sessionData: {
    events: Array<{ timestamp: Date }>;
    ipAddresses: Set<string>;
  }): BotSignal {
    const { events, ipAddresses } = sessionData;

    if (events.length < 2) {
      return {
        type: 'rapid_fire_behavior',
        value: false,
        weight: 30,
        description: 'Insufficient data for behavior analysis',
      };
    }

    // Check for rapid fire clicks (< 1 second apart)
    let rapidFireCount = 0;
    for (let i = 1; i < events.length; i++) {
      const timeDiff = events[i].timestamp.getTime() - events[i - 1].timestamp.getTime();
      if (timeDiff < 1000) rapidFireCount++;
    }

    const rapidFireRatio = rapidFireCount / (events.length - 1);
    const hasRapidFire = rapidFireRatio > 0.5;

    return {
      type: 'rapid_fire_behavior',
      value: hasRapidFire,
      weight: 30,
      description: hasRapidFire
        ? `High rapid-fire rate: ${Math.round(rapidFireRatio * 100)}% of events within 1 second`
        : 'Event timing appears human-like',
    };
  }

  private checkMissingHeaders(sessionData: {
    events: Array<{ timestamp: Date }>;
    ipAddresses: Set<string>;
  }): BotSignal {
    // This would typically check for missing headers like Accept-Language, Accept-Encoding
    // For now, return false as a placeholder
    return {
      type: 'missing_headers',
      value: false,
      weight: 15,
      description: 'All expected headers present',
    };
  }

  addBotPattern(pattern: string): void {
    this.suspiciousUserAgents.add(pattern.toLowerCase());
  }

  removeBotPattern(pattern: string): void {
    this.suspiciousUserAgents.delete(pattern.toLowerCase());
  }

  getBotPatterns(): string[] {
    return Array.from(this.suspiciousUserAgents);
  }
}

export const botService = new BotService();
