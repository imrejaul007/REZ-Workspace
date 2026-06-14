import { v4 as uuidv4 } from 'uuid';
import {
  SleepRecord,
  SleepInsight,
  SleepInsightType,
  sleepStorage,
  SleepDisorder,
  SleepDisorderType
} from '../models/sleep';
import { sleepTrackingService } from './sleepTrackingService';

interface SleepPattern {
  averageBedtime: string;
  averageWakeTime: string;
  averageDuration: number;
  averageQuality: number;
  consistencyScore: number;
  mostCommonBedtime: string;
  mostCommonWakeTime: string;
  weekendVsWeekdayDiff: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface DisorderIndicator {
  type: SleepDisorderType;
  score: number;
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendations: string[];
}

export class SleepAnalysisService {
  /**
   * Analyze sleep patterns for a user
   */
  analyzePatterns(userId: string, days: number = 30): SleepPattern | null {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = sleepTrackingService.getSleepHistory(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      days
    );

    if (records.length < 3) {
      return null;
    }

    // Calculate average bedtime and wake time
    const bedtimeMinutes = records.map(r => {
      const [h, m] = r.bedtime.split(':').map(Number);
      return h * 60 + m;
    });

    const wakeTimeMinutes = records.map(r => {
      const [h, m] = r.wakeTime.split(':').map(Number);
      return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
    });

    const avgBedtimeMin = bedtimeMinutes.reduce((a, b) => a + b, 0) / bedtimeMinutes.length;
    const avgWakeTimeMin = wakeTimeMinutes.reduce((a, b) => a + b, 0) / wakeTimeMinutes.length;

    const formatTime = (minutes: number): string => {
      const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60);
      const h = Math.floor(normalized / 60);
      const m = Math.round(normalized % 60);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const averageBedtime = formatTime(avgBedtimeMin);
    const averageWakeTime = formatTime(avgWakeTimeMin);

    // Calculate consistency score (standard deviation of bedtime)
    const bedtimeStdDev = this.calculateStdDev(bedtimeMinutes);
    const consistencyScore = Math.max(0, 100 - (bedtimeStdDev / 2));

    // Find most common bedtime (mode)
    const bedtimeMode = this.findMode(records.map(r => r.bedtime));
    const wakeTimeMode = this.findMode(records.map(r => r.wakeTime));

    // Weekend vs weekday comparison
    const weekdayRecords = records.filter(r => {
      const day = new Date(r.date).getDay();
      return day >= 1 && day <= 5;
    });
    const weekendRecords = records.filter(r => {
      const day = new Date(r.date).getDay();
      return day === 0 || day === 6;
    });

    const avgWeekdayDuration = weekdayRecords.length > 0
      ? weekdayRecords.reduce((sum, r) => sum + r.duration, 0) / weekdayRecords.length
      : 0;
    const avgWeekendDuration = weekendRecords.length > 0
      ? weekendRecords.reduce((sum, r) => sum + r.duration, 0) / weekendRecords.length
      : 0;

    const weekendVsWeekdayDiff = Number((avgWeekendDuration - avgWeekdayDuration).toFixed(2));

    // Calculate trend
    const midpoint = Math.floor(records.length / 2);
    const firstHalf = records.slice(0, midpoint);
    const secondHalf = records.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.quality, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.quality, 0) / secondHalf.length;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalfAvg - firstHalfAvg > 0.5) trend = 'improving';
    else if (firstHalfAvg - secondHalfAvg > 0.5) trend = 'declining';

    return {
      averageBedtime,
      averageWakeTime,
      averageDuration: Number((records.reduce((sum, r) => sum + r.duration, 0) / records.length).toFixed(2)),
      averageQuality: Number((records.reduce((sum, r) => sum + r.quality, 0) / records.length).toFixed(1)),
      consistencyScore: Number(consistencyScore.toFixed(1)),
      mostCommonBedtime: bedtimeMode || averageBedtime,
      mostCommonWakeTime: wakeTimeMode || averageWakeTime,
      weekendVsWeekdayDiff,
      trend
    };
  }

  /**
   * Detect potential sleep disorders based on patterns
   */
  detectDisorders(userId: string): DisorderIndicator[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const records = sleepTrackingService.getSleepHistory(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      14
    );

    const indicators: DisorderIndicator[] = [];

    // Insomnia detection
    const avgQuality = records.length > 0
      ? records.reduce((sum, r) => sum + r.quality, 0) / records.length
      : 0;
    const lowQualityNights = records.filter(r => r.quality <= 4).length;

    if (avgQuality <= 5 || lowQualityNights >= 5) {
      indicators.push({
        type: 'insomnia',
        score: avgQuality <= 4 ? 85 : avgQuality <= 5 ? 60 : 30,
        severity: avgQuality <= 4 ? 'high' : avgQuality <= 5 ? 'moderate' : 'low',
        description: 'Difficulty falling asleep or staying asleep',
        recommendations: [
          'Establish a consistent sleep schedule',
          'Limit screen exposure 1 hour before bed',
          'Avoid caffeine after 2 PM',
          'Consider relaxation techniques or meditation',
          'Consult a healthcare provider if symptoms persist'
        ]
      });
    }

    // Sleep apnea indicators
    const avgAwakenings = records.length > 0
      ? records.reduce((sum, r) => sum + (r.awakenings || 0), 0) / records.length
      : 0;
    const avgDuration = records.length > 0
      ? records.reduce((sum, r) => sum + r.duration, 0) / records.length
      : 0;

    if (avgAwakenings >= 5 || (avgDuration >= 9 && avgAwakenings >= 3)) {
      indicators.push({
        type: 'sleep_apnea',
        score: avgAwakenings >= 7 ? 80 : avgAwakenings >= 5 ? 55 : 30,
        severity: avgAwakenings >= 7 ? 'high' : avgAwakenings >= 5 ? 'moderate' : 'low',
        description: 'Repeated pauses in breathing during sleep',
        recommendations: [
          'Maintain a healthy weight',
          'Sleep on your side rather than back',
          'Avoid alcohol before bed',
          'Consider a sleep study',
          'Consult a healthcare provider for diagnosis'
        ]
      });
    }

    // Restless leg syndrome
    const lightSleepPct = records.length > 0
      ? records.filter(r => r.lightSleep && r.lightSleep > 0).length / records.length
      : 0;

    if (lightSleepPct < 0.5 && records.length >= 5) {
      indicators.push({
        type: 'restless_leg',
        score: lightSleepPct < 0.3 ? 70 : 40,
        severity: lightSleepPct < 0.3 ? 'moderate' : 'low',
        description: 'Uncomfortable sensations in legs with urge to move',
        recommendations: [
          'Iron-rich foods may help',
          'Regular exercise but not close to bedtime',
          'Stretch before bed',
          'Warm baths or massage',
          'Consult a healthcare provider'
        ]
      });
    }

    // Narcolepsy indicators
    const shortSleepNights = records.filter(r => r.duration < 5).length;
    if (shortSleepNights >= 5) {
      indicators.push({
        type: 'narcolepsy',
        score: shortSleepNights >= 7 ? 65 : 40,
        severity: shortSleepNights >= 7 ? 'moderate' : 'low',
        description: 'Excessive daytime sleepiness despite adequate night sleep',
        recommendations: [
          'Maintain consistent sleep schedule',
          'Schedule short naps',
          'Avoid heavy meals and alcohol',
          'Consult a healthcare provider',
          'Consider a sleep study'
        ]
      });
    }

    return indicators;
  }

  /**
   * Generate personalized insights based on sleep data
   */
  generateInsights(userId: string): SleepInsight[] {
    const insights: SleepInsight[] = [];
    const now = new Date().toISOString().split('T')[0];

    const patterns = this.analyzePatterns(userId, 14);
    const disorders = this.detectDisorders(userId);
    const summary = sleepTrackingService.getWeeklySummary(userId);

    // Pattern-based insights
    if (patterns) {
      // Consistency insight
      if (patterns.consistencyScore < 70) {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'improvement',
          title: 'Improve Sleep Consistency',
          description: `Your sleep schedule varies by ${(100 - patterns.consistencyScore).toFixed(0)}%. Consistent bedtimes improve sleep quality.`,
          recommendations: [
            'Set a fixed bedtime and wake time',
            'Use bed as a signal for sleep only',
            'Avoid large variations on weekends',
            'Use gentle alarms to wake at similar times'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      }

      // Late bedtime insight
      const bedtimeHour = parseInt(patterns.averageBedtime.split(':')[0]);
      if (bedtimeHour >= 23 || bedtimeHour < 5) {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'pattern',
          title: 'Late Night Schedule Detected',
          description: `Your average bedtime is ${patterns.averageBedtime}. Late nights can impact sleep quality and circadian rhythm.`,
          recommendations: [
            'Gradually shift bedtime 15 minutes earlier',
            'Reduce evening screen time',
            'Create a relaxing pre-sleep routine',
            'Avoid caffeine after 2 PM'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      }

      // Weekend vs weekday insight
      if (Math.abs(patterns.weekendVsWeekdayDiff) >= 1.5) {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'pattern',
          title: 'Weekend Sleep Pattern Differs',
          description: `You sleep ${Math.abs(patterns.weekendVsWeekdayDiff).toFixed(1)} hours ${
            patterns.weekendVsWeekdayDiff > 0 ? 'more' : 'less'
          } on weekends. This "social jetlag" can affect circadian rhythm.`,
          recommendations: [
            'Keep weekend wake times within 1 hour of weekdays',
            'Avoid late-night activities on weekends',
            'Maintain consistent sleep schedule',
            'Plan earlier activities on weekends'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      }

      // Trend insight
      if (patterns.trend === 'improving') {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'pattern',
          title: 'Sleep Quality Improving',
          description: 'Your sleep quality has been trending upward over the past two weeks. Keep up the good work!',
          recommendations: [
            'Continue your current sleep habits',
            'Identify what is working well',
            'Make gradual adjustments to improve further'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      } else if (patterns.trend === 'declining') {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'concern',
          title: 'Sleep Quality Declining',
          description: 'Your sleep quality has been trending downward. Review recent changes in your routine.',
          recommendations: [
            'Review recent lifestyle changes',
            'Check for stress factors',
            'Ensure consistent sleep environment',
            'Consider consulting a healthcare provider'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Weekly summary insights
    if (summary.totalNights > 0) {
      if (summary.nightsWith7Hours < summary.totalNights / 2) {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'improvement',
          title: 'Increase Sleep Duration',
          description: `Only ${summary.nightsWith7Hours} of ${summary.totalNights} nights met the 7-hour minimum. Adults need 7-9 hours.`,
          recommendations: [
            'Move bedtime 30 minutes earlier',
            'Limit evening screen time',
            'Create a relaxing bedtime routine',
            'Avoid caffeine in the afternoon'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      }

      if (summary.avgQuality >= 8) {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'pattern',
          title: 'Excellent Sleep Quality',
          description: `Your average sleep quality is ${summary.avgQuality}/10. Your current sleep habits are working well.`,
          recommendations: [
            'Maintain your current sleep schedule',
            'Continue good sleep hygiene practices',
            'Track what contributes to your success'
          ],
          date: now,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Disorder-based insights
    for (const disorder of disorders) {
      if (disorder.severity === 'high') {
        insights.push({
          insightId: uuidv4(),
          userId,
          type: 'concern',
          title: `${this.formatDisorderName(disorder.type)} Detected`,
          description: disorder.description,
          recommendations: disorder.recommendations,
          date: now,
          createdAt: new Date().toISOString()
        });
      }
    }

    return insights;
  }

  /**
   * Compare actual sleep to user's goal
   */
  compareToGoal(userId: string): {
    goalId: string | null;
    achievedDays: number;
    totalDays: number;
    achievementRate: number;
    avgDurationVsTarget: number;
    avgBedtimeVsTarget: number;
    avgWakeTimeVsTarget: number;
    gaps: string[];
    achievements: string[];
  } {
    const goal = Array.from(sleepStorage.goals.values()).find(g => g.userId === userId);

    if (!goal) {
      return {
        goalId: null,
        achievedDays: 0,
        totalDays: 0,
        achievementRate: 0,
        avgDurationVsTarget: 0,
        avgBedtimeVsTarget: 0,
        avgWakeTimeVsTarget: 0,
        gaps: ['No sleep goal set'],
        achievements: []
      };
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const records = sleepTrackingService.getSleepHistory(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      30
    );

    // Filter to goal days
    const goalDaysRecords = records.filter(r => {
      const dayOfWeek = new Date(r.date).getDay();
      return goal.days.includes(dayOfWeek);
    });

    const achievedDays = goalDaysRecords.filter(r => {
      const durationOk = r.duration >= goal.targetDuration - 0.5;
      const [targetH, targetM] = goal.targetBedtime.split(':').map(Number);
      const [actualH, actualM] = r.bedtime.split(':').map(Number);
      const targetMin = targetH * 60 + targetM;
      const actualMin = actualH < 12 ? actualH * 60 + actualM + 24 * 60 : actualH * 60 + actualM;
      const bedtimeOk = actualMin <= targetMin + 30 && actualMin >= targetMin - 60;
      return durationOk && bedtimeOk;
    }).length;

    const achievementRate = goalDaysRecords.length > 0
      ? (achievedDays / goalDaysRecords.length) * 100
      : 0;

    const avgDuration = goalDaysRecords.length > 0
      ? goalDaysRecords.reduce((sum, r) => sum + r.duration, 0) / goalDaysRecords.length
      : 0;

    const gaps: string[] = [];
    const achievements: string[] = [];

    if (avgDuration < goal.targetDuration - 0.5) {
      gaps.push(`Average sleep duration is ${(goal.targetDuration - avgDuration).toFixed(1)}h below target`);
    } else {
      achievements.push(`Sleep duration meets target of ${goal.targetDuration}h`);
    }

    if (achievementRate < 50) {
      gaps.push(`Goal achievement rate is low at ${achievementRate.toFixed(0)}%`);
    } else if (achievementRate >= 80) {
      achievements.push(`Excellent goal adherence at ${achievementRate.toFixed(0)}%`);
    }

    return {
      goalId: goal.goalId,
      achievedDays,
      totalDays: goalDaysRecords.length,
      achievementRate: Number(achievementRate.toFixed(1)),
      avgDurationVsTarget: Number((avgDuration - goal.targetDuration).toFixed(2)),
      avgBedtimeVsTarget: 0,
      avgWakeTimeVsTarget: 0,
      gaps,
      achievements
    };
  }

  /**
   * Analyze sleep stages distribution
   */
  analyzeSleepStages(userId: string): {
    avgDeepSleep: number;
    avgLightSleep: number;
    avgRemSleep: number;
    deepSleepTarget: boolean;
    remSleepTarget: boolean;
    recommendations: string[];
  } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const records = sleepTrackingService.getSleepHistory(
      userId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      14
    );

    const recordsWithStages = records.filter(r => r.deepSleep || r.lightSleep || r.remSleep);

    if (recordsWithStages.length === 0) {
      return {
        avgDeepSleep: 0,
        avgLightSleep: 0,
        avgRemSleep: 0,
        deepSleepTarget: false,
        remSleepTarget: false,
        recommendations: [
          'Track sleep stages using a wearable device',
          'Deep sleep typically comprises 13-23% of total sleep',
          'REM sleep typically comprises 20-25% of total sleep'
        ]
      };
    }

    const avgDeepSleep = recordsWithStages.reduce((sum, r) => sum + (r.deepSleep || 0), 0) / recordsWithStages.length;
    const avgLightSleep = recordsWithStages.reduce((sum, r) => sum + (r.lightSleep || 0), 0) / recordsWithStages.length;
    const avgRemSleep = recordsWithStages.reduce((sum, r) => sum + (r.remSleep || 0), 0) / recordsWithStages.length;

    const recommendations: string[] = [];
    let deepSleepTarget = true;
    let remSleepTarget = true;

    const avgTotal = avgDeepSleep + avgLightSleep + avgRemSleep;
    const deepSleepPct = avgTotal > 0 ? (avgDeepSleep / avgTotal) * 100 : 0;
    const remSleepPct = avgTotal > 0 ? (avgRemSleep / avgTotal) * 100 : 0;

    if (deepSleepPct < 10) {
      recommendations.push('Increase deep sleep by maintaining consistent sleep schedule');
      deepSleepTarget = false;
    }
    if (deepSleepPct > 30) {
      recommendations.push('Deep sleep is unusually high, which may indicate recovery needs');
    }
    if (remSleepPct < 15) {
      recommendations.push('Increase REM sleep by avoiding alcohol and ensuring 7+ hours');
      remSleepTarget = false;
    }
    if (remSleepPct > 30) {
      recommendations.push('REM sleep is high, which may indicate good dream recall');
    }

    return {
      avgDeepSleep: Number(avgDeepSleep.toFixed(2)),
      avgLightSleep: Number(avgLightSleep.toFixed(2)),
      avgRemSleep: Number(avgRemSleep.toFixed(2)),
      deepSleepTarget,
      remSleepTarget,
      recommendations
    };
  }

  // Helper methods
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private findMode(values: string[]): string | null {
    const frequency: Record<string, number> = {};
    for (const v of values) {
      frequency[v] = (frequency[v] || 0) + 1;
    }
    let maxFreq = 0;
    let mode: string | null = null;
    for (const [v, freq] of Object.entries(frequency)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = v;
      }
    }
    return maxFreq >= 2 ? mode : null;
  }

  private formatDisorderName(type: SleepDisorderType): string {
    const names: Record<SleepDisorderType, string> = {
      insomnia: 'Insomnia',
      sleep_apnea: 'Sleep Apnea',
      restless_leg: 'Restless Leg Syndrome',
      narcolepsy: 'Narcolepsy',
      parasomnia: 'Parasomnia'
    };
    return names[type];
  }
}

export const sleepAnalysisService = new SleepAnalysisService();
