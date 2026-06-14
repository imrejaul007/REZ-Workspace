/**
 * REZ Outbound Service - AI Follow-up Timing Engine
 *
 * Optimizes send times based on engagement patterns
 */

import logger from '../utils/logger.js';

// ============================================================================
// Types
// ============================================================================

export interface TimingPattern {
  dayOfWeek: number; // 0-6, Sunday-Saturday
  hour: number; // 0-23
  engagementScore: number; // 0-100
  openRate: number;
  replyRate: number;
  sampleSize: number;
}

export interface OptimalWindow {
  dayOfWeek: number;
  hour: number;
  score: number;
  confidence: number;
  reason: string;
}

export interface TimingRecommendation {
  sendAt: Date;
  window: OptimalWindow;
  reason: string;
}

// ============================================================================
// Mock Engagement Data (in production, this comes from analytics)
// ============================================================================

const DEFAULT_PATTERNS: TimingPattern[] = [
  // Monday
  { dayOfWeek: 1, hour: 9, engagementScore: 75, openRate: 0.45, replyRate: 0.12, sampleSize: 500 },
  { dayOfWeek: 1, hour: 10, engagementScore: 82, openRate: 0.52, replyRate: 0.15, sampleSize: 520 },
  { dayOfWeek: 1, hour: 11, engagementScore: 78, openRate: 0.48, replyRate: 0.13, sampleSize: 480 },
  { dayOfWeek: 1, hour: 14, engagementScore: 70, openRate: 0.42, replyRate: 0.10, sampleSize: 450 },
  { dayOfWeek: 1, hour: 15, engagementScore: 72, openRate: 0.44, replyRate: 0.11, sampleSize: 460 },

  // Tuesday
  { dayOfWeek: 2, hour: 9, engagementScore: 80, openRate: 0.50, replyRate: 0.14, sampleSize: 540 },
  { dayOfWeek: 2, hour: 10, engagementScore: 88, openRate: 0.58, replyRate: 0.18, sampleSize: 560 },
  { dayOfWeek: 2, hour: 11, engagementScore: 85, openRate: 0.55, replyRate: 0.16, sampleSize: 530 },
  { dayOfWeek: 2, hour: 14, engagementScore: 74, openRate: 0.46, replyRate: 0.12, sampleSize: 490 },
  { dayOfWeek: 2, hour: 15, engagementScore: 76, openRate: 0.47, replyRate: 0.12, sampleSize: 500 },

  // Wednesday (best day)
  { dayOfWeek: 3, hour: 9, engagementScore: 82, openRate: 0.52, replyRate: 0.15, sampleSize: 550 },
  { dayOfWeek: 3, hour: 10, engagementScore: 92, openRate: 0.62, replyRate: 0.20, sampleSize: 580 },
  { dayOfWeek: 3, hour: 11, engagementScore: 88, openRate: 0.58, replyRate: 0.17, sampleSize: 560 },
  { dayOfWeek: 3, hour: 14, engagementScore: 78, openRate: 0.50, replyRate: 0.13, sampleSize: 510 },
  { dayOfWeek: 3, hour: 15, engagementScore: 80, openRate: 0.52, replyRate: 0.14, sampleSize: 520 },

  // Thursday
  { dayOfWeek: 4, hour: 9, engagementScore: 78, openRate: 0.49, replyRate: 0.14, sampleSize: 510 },
  { dayOfWeek: 4, hour: 10, engagementScore: 85, openRate: 0.56, replyRate: 0.17, sampleSize: 540 },
  { dayOfWeek: 4, hour: 11, engagementScore: 82, openRate: 0.53, replyRate: 0.15, sampleSize: 520 },
  { dayOfWeek: 4, hour: 14, engagementScore: 72, openRate: 0.45, replyRate: 0.11, sampleSize: 470 },
  { dayOfWeek: 4, hour: 15, engagementScore: 74, openRate: 0.46, replyRate: 0.12, sampleSize: 480 },

  // Friday
  { dayOfWeek: 5, hour: 9, engagementScore: 70, openRate: 0.44, replyRate: 0.11, sampleSize: 450 },
  { dayOfWeek: 5, hour: 10, engagementScore: 75, openRate: 0.48, replyRate: 0.13, sampleSize: 480 },
  { dayOfWeek: 5, hour: 11, engagementScore: 72, openRate: 0.46, replyRate: 0.12, sampleSize: 460 },
  // Avoid Friday afternoon

  // Weekend (if applicable)
  { dayOfWeek: 6, hour: 10, engagementScore: 45, openRate: 0.28, replyRate: 0.06, sampleSize: 200 },
  { dayOfWeek: 6, hour: 11, engagementScore: 50, openRate: 0.32, replyRate: 0.07, sampleSize: 220 },
  { dayOfWeek: 0, hour: 10, engagementScore: 40, openRate: 0.25, replyRate: 0.05, sampleSize: 180 },
  { dayOfWeek: 0, hour: 11, engagementScore: 45, openRate: 0.28, replyRate: 0.06, sampleSize: 190 },
];

// ============================================================================
// Timing Engine
// ============================================================================

export class TimingEngine {
  private patterns: TimingPattern[];

  constructor(patterns?: TimingPattern[]) {
    this.patterns = patterns || DEFAULT_PATTERNS;
  }

  /**
   * Get optimal sending windows for a contact
   */
  getOptimalWindow(contactTimezone?: string): OptimalWindow[] {
    // Sort by engagement score
    const sorted = [...this.patterns].sort((a, b) => b.engagementScore - a.engagementScore);

    // Get top 3 windows
    const top = sorted.slice(0, 3);

    return top.map((pattern, index) => ({
      dayOfWeek: pattern.dayOfWeek,
      hour: pattern.hour,
      score: pattern.engagementScore,
      confidence: Math.min(0.9, 0.5 + (pattern.sampleSize / 1000)),
      reason: this.getReasonForPattern(pattern),
    }));
  }

  /**
   * Get the single best window
   */
  getBestWindow(): OptimalWindow {
    const best = this.patterns.reduce((max, p) =>
      p.engagementScore > max.engagementScore ? p : max
    );

    return {
      dayOfWeek: best.dayOfWeek,
      hour: best.hour,
      score: best.engagementScore,
      confidence: Math.min(0.9, 0.5 + (best.sampleSize / 1000)),
      reason: this.getReasonForPattern(best),
    };
  }

  /**
   * Calculate next optimal send time
   */
  getNextOptimalTime(fromTime?: Date, maxWaitHours?: number): TimingRecommendation {
    const now = fromTime || new Date();
    const maxWait = maxWaitHours || 48;

    const best = this.getBestWindow();

    // Find next occurrence of optimal time
    let sendAt = this.getNextOccurrence(now, best.dayOfWeek, best.hour);

    // If too far away, find next best option
    const waitHours = (sendAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (waitHours > maxWait) {
      const windows = this.getOptimalWindow();
      for (const window of windows) {
        const candidate = this.getNextOccurrence(now, window.dayOfWeek, window.hour);
        const candidateWait = (candidate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (candidateWait <= maxWait) {
          sendAt = candidate;
          best.dayOfWeek = window.dayOfWeek;
          best.hour = window.hour;
          best.score = window.score;
          best.reason = window.reason;
          break;
        }
      }
    }

    return {
      sendAt,
      window: best,
      reason: `Best time based on engagement data: ${best.reason}`,
    };
  }

  /**
   * Get optimal time for follow-up based on last action
   */
  getFollowUpTime(
    lastActionAt: Date,
    followUpNumber: number,
    contactTimezone?: string
  ): TimingRecommendation {
    // Escalating delays for follow-ups
    const delays = [
      24,   // Follow-up 1: 1 day
      48,   // Follow-up 2: 2 days
      72,   // Follow-up 3: 3 days
      96,   // Follow-up 4: 4 days
      168,  // Follow-up 5: 1 week
    ];

    const delayHours = delays[Math.min(followUpNumber - 1, delays.length - 1)];
    const earliestTime = new Date(lastActionAt.getTime() + delayHours * 60 * 60 * 1000);

    // Get optimal window
    const window = this.getBestWindow();
    let sendAt = this.getNextOccurrence(earliestTime, window.dayOfWeek, window.hour);

    // If that pushes too far, just use the delay
    const minWaitHours = delayHours * 0.8; // Allow 20% buffer
    const waitHours = (sendAt.getTime() - earliestTime.getTime()) / (1000 * 60 * 60);
    if (waitHours > delayHours * 2) {
      sendAt = new Date(earliestTime.getTime() + delayHours * 60 * 60 * 1000);
      window.reason = `Based on follow-up sequence position (attempt #${followUpNumber})`;
    }

    return {
      sendAt,
      window,
      reason: `Follow-up #${followUpNumber}: ${window.reason}`,
    };
  }

  /**
   * Get day-of-week name
   */
  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  /**
   * Get reason for pattern
   */
  private getReasonForPattern(pattern: TimingPattern): string {
    const day = this.getDayName(pattern.dayOfWeek);
    const time = `${pattern.hour}:00`;

    if (pattern.dayOfWeek >= 1 && pattern.dayOfWeek <= 5) {
      if (pattern.hour >= 9 && pattern.hour <= 11) {
        return `Mid-morning on ${day}s shows highest engagement (${pattern.openRate * 100}% open rate)`;
      }
      if (pattern.hour >= 14 && pattern.hour <= 16) {
        return `Afternoon on ${day}s shows good engagement (${pattern.openRate * 100}% open rate)`;
      }
    }

    return `${day} at ${time} has ${pattern.engagementScore}/100 engagement score`;
  }

  /**
   * Get next occurrence of a specific day/hour
   */
  private getNextOccurrence(from: Date, targetDay: number, targetHour: number): Date {
    const result = new Date(from);
    result.setHours(targetHour, 0, 0, 0);

    // Calculate days until target day
    const currentDay = result.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0 && result.getTime() <= from.getTime()) daysUntil += 7;

    result.setDate(result.getDate() + daysUntil);
    return result;
  }

  /**
   * Get weekly summary
   */
  getWeeklySummary(): Array<{ day: string; bestHour: number; avgScore: number }> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const summary = [];

    for (let day = 0; day < 7; day++) {
      const dayPatterns = this.patterns.filter(p => p.dayOfWeek === day);
      if (dayPatterns.length === 0) {
        summary.push({ day: days[day], bestHour: -1, avgScore: 0 });
        continue;
      }

      const best = dayPatterns.reduce((max, p) =>
        p.engagementScore > max.engagementScore ? p : max
      );

      summary.push({
        day: days[day],
        bestHour: best.hour,
        avgScore: Math.round(
          dayPatterns.reduce((sum, p) => sum + p.engagementScore, 0) / dayPatterns.length
        ),
      });
    }

    return summary;
  }

  /**
   * Update patterns with new data
   */
  updatePatterns(newPatterns: TimingPattern[]): void {
    // Merge with existing patterns
    for (const newPattern of newPatterns) {
      const existing = this.patterns.find(
        p => p.dayOfWeek === newPattern.dayOfWeek && p.hour === newPattern.hour
      );

      if (existing) {
        // Weighted average based on sample size
        const totalSamples = existing.sampleSize + newPattern.sampleSize;
        existing.engagementScore = Math.round(
          (existing.engagementScore * existing.sampleSize +
           newPattern.engagementScore * newPattern.sampleSize) / totalSamples
        );
        existing.openRate =
          (existing.openRate * existing.sampleSize +
           newPattern.openRate * newPattern.sampleSize) / totalSamples;
        existing.replyRate =
          (existing.replyRate * existing.sampleSize +
           newPattern.replyRate * newPattern.sampleSize) / totalSamples;
        existing.sampleSize = totalSamples;
      } else {
        this.patterns.push(newPattern);
      }
    }

    logger.info('Timing patterns updated', {
      patternCount: this.patterns.length
    });
  }
}

// Singleton instance
export const timingEngine = new TimingEngine();

export default TimingEngine;
