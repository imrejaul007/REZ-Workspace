import { v4 as uuidv4 } from 'uuid';
import {
  MoodEntry,
  MoodEntrySchema,
  MoodTrends,
  MoodInsights,
  ApiResponse
} from '../models/mentalHealth.js';

// In-memory storage (replace with database in production)
const moodEntries: Map<string, MoodEntry[]> = new Map();

/**
 * Mood Tracking Service
 * Handles all mood-related operations including logging, history, trends, and insights
 */
export class MoodTrackingService {
  /**
   * Log a new mood entry
   */
  async logMood(data: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<ApiResponse<MoodEntry>> {
    try {
      const validationResult = MoodEntrySchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed'
        };
      }

      const entry: MoodEntry = {
        ...validationResult.data,
        id: uuidv4(),
        createdAt: new Date()
      };

      const userEntries = moodEntries.get(data.userId) || [];
      userEntries.push(entry);
      moodEntries.set(data.userId, userEntries);

      return {
        success: true,
        data: entry,
        message: 'Mood entry logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log mood entry'
      };
    }
  }

  /**
   * Get mood history for a user
   */
  async getMoodHistory(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<ApiResponse<MoodEntry[]>> {
    try {
      const userEntries = moodEntries.get(userId) || [];

      let filtered = userEntries;

      if (options.startDate) {
        filtered = filtered.filter(e => e.date >= options.startDate!);
      }
      if (options.endDate) {
        filtered = filtered.filter(e => e.date <= options.endDate!);
      }

      // Sort by date descending (most recent first)
      filtered.sort((a, b) => b.date.getTime() - a.date.getTime());

      const total = filtered.length;
      const page = options.page || 1;
      const limit = options.limit || 20;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        message: `Retrieved ${paginated.length} of ${total} entries`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get mood history'
      };
    }
  }

  /**
   * Get mood trends over a specified period
   */
  async getMoodTrends(
    userId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'week'
  ): Promise<ApiResponse<MoodTrends>> {
    try {
      const userEntries = moodEntries.get(userId) || [];

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const filtered = userEntries.filter(e => e.date >= startDate);

      if (filtered.length === 0) {
        return {
          success: true,
          data: {
            period,
            averageMood: 0,
            averageEnergy: 0,
            averageAnxiety: 0,
            averageSleep: 0,
            averageStress: 0,
            trend: 'stable' as const,
            dataPoints: 0,
            entries: []
          }
        };
      }

      // Calculate averages
      const sum = filtered.reduce(
        (acc, entry) => ({
          mood: acc.mood + entry.mood,
          energy: acc.energy + entry.energy,
          anxiety: acc.anxiety + entry.anxiety,
          sleep: acc.sleep + entry.sleep,
          stress: acc.stress + entry.stress
        }),
        { mood: 0, energy: 0, anxiety: 0, sleep: 0, stress: 0 }
      );

      const count = filtered.length;
      const averages = {
        averageMood: Math.round((sum.mood / count) * 10) / 10,
        averageEnergy: Math.round((sum.energy / count) * 10) / 10,
        averageAnxiety: Math.round((sum.anxiety / count) * 10) / 10,
        averageSleep: Math.round((sum.sleep / count) * 10) / 10,
        averageStress: Math.round((sum.stress / count) * 10) / 10
      };

      // Calculate trend by comparing first half to second half
      const midpoint = Math.floor(filtered.length / 2);
      const firstHalf = filtered.slice(midpoint);
      const secondHalf = filtered.slice(0, midpoint);

      const firstAvg = firstHalf.reduce((sum, e) => sum + e.mood, 0) / (firstHalf.length || 1);
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.mood, 0) / (secondHalf.length || 1);

      let trend: 'improving' | 'stable' | 'declining';
      const diff = secondAvg - firstAvg;
      if (diff > 0.5) trend = 'improving';
      else if (diff < -0.5) trend = 'declining';
      else trend = 'stable';

      return {
        success: true,
        data: {
          period,
          ...averages,
          trend,
          dataPoints: count,
          entries: filtered
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get mood trends'
      };
    }
  }

  /**
   * Get common triggers for a user
   */
  async getTriggers(userId: string): Promise<ApiResponse<{ trigger: string; count: number; avgMood: number }[]>> {
    try {
      const userEntries = moodEntries.get(userId) || [];

      const triggerMap = new Map<string, { count: number; totalMood: number }>();

      userEntries.forEach(entry => {
        entry.triggers.forEach(trigger => {
          const existing = triggerMap.get(trigger) || { count: 0, totalMood: 0 };
          existing.count++;
          existing.totalMood += entry.mood;
          triggerMap.set(trigger, existing);
        });
      });

      const triggers = Array.from(triggerMap.entries())
        .map(([trigger, data]) => ({
          trigger,
          count: data.count,
          avgMood: Math.round((data.totalMood / data.count) * 10) / 10
        }))
        .sort((a, b) => b.count - a.count);

      return {
        success: true,
        data: triggers
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get triggers'
      };
    }
  }

  /**
   * Get personalized insights based on mood data
   */
  async getInsights(userId: string): Promise<ApiResponse<MoodInsights>> {
    try {
      const userEntries = moodEntries.get(userId) || [];

      if (userEntries.length < 3) {
        return {
          success: true,
          data: {
            dominantTriggers: [],
            helpfulActivities: [],
            weeklyPattern: [],
            correlationAnalysis: {
              exercise: { impact: 'neutral' as const, avgDiff: 0 },
              social: { impact: 'neutral' as const, avgDiff: 0 },
              medication: { impact: 'neutral' as const, avgDiff: 0 }
            },
            recommendations: ['Keep logging your mood to get personalized insights']
          }
        };
      }

      // Analyze triggers
      const triggerMap = new Map<string, { count: number; totalMood: number }>();
      userEntries.forEach(entry => {
        entry.triggers.forEach(trigger => {
          const existing = triggerMap.get(trigger) || { count: 0, totalMood: 0 };
          existing.count++;
          existing.totalMood += entry.mood;
          triggerMap.set(trigger, existing);
        });
      });

      const dominantTriggers = Array.from(triggerMap.entries())
        .map(([trigger, data]) => ({
          trigger,
          count: data.count,
          avgMood: Math.round((data.totalMood / data.count) * 10) / 10
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Analyze activities
      const activityMap = new Map<string, { count: number; totalMood: number }>();
      userEntries.forEach(entry => {
        entry.activities.forEach(activity => {
          const existing = activityMap.get(activity) || { count: 0, totalMood: 0 };
          existing.count++;
          existing.totalMood += entry.mood;
          activityMap.set(activity, existing);
        });
      });

      const helpfulActivities = Array.from(activityMap.entries())
        .map(([activity, data]) => ({
          activity,
          count: data.count,
          avgMood: Math.round((data.totalMood / data.count) * 10) / 10
        }))
        .sort((a, b) => b.avgMood - a.avgMood)
        .slice(0, 5);

      // Weekly pattern
      const dayMap = new Map<number, { count: number; totalMood: number }>();
      userEntries.forEach(entry => {
        const day = entry.date.getDay();
        const existing = dayMap.get(day) || { count: 0, totalMood: 0 };
        existing.count++;
        existing.totalMood += entry.mood;
        dayMap.set(day, existing);
      });

      const weeklyPattern = Array.from(dayMap.entries())
        .map(([dayOfWeek, data]) => ({
          dayOfWeek,
          avgMood: Math.round((data.totalMood / data.count) * 10) / 10
        }))
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      // Correlation analysis
      const withExercise = userEntries.filter(e => e.exerciseDone);
      const withoutExercise = userEntries.filter(e => !e.exerciseDone);
      const exerciseImpact = this.calculateImpact(withExercise, withoutExercise);

      const withSocial = userEntries.filter(e => e.socialInteraction);
      const withoutSocial = userEntries.filter(e => !e.socialInteraction);
      const socialImpact = this.calculateImpact(withSocial, withoutSocial);

      const withMed = userEntries.filter(e => e.medicationTaken);
      const withoutMed = userEntries.filter(e => !e.medicationTaken);
      const medImpact = this.calculateImpact(withMed, withoutMed);

      // Generate recommendations
      const recommendations: string[] = [];

      if (exerciseImpact.avgDiff > 0.5) {
        recommendations.push('Exercise seems to improve your mood. Try to maintain a regular exercise routine.');
      }

      if (socialImpact.avgDiff > 0.5) {
        recommendations.push('Social interactions appear to boost your mood. Consider scheduling regular social activities.');
      }

      if (dominantTriggers.length > 0) {
        const topTriggers = dominantTriggers.slice(0, 2);
        recommendations.push(`Consider addressing these common triggers: ${topTriggers.map(t => t.trigger).join(', ')}`);
      }

      const lowSleepDays = userEntries.filter(e => e.sleep <= 4);
      if (lowSleepDays.length > userEntries.length * 0.3) {
        recommendations.push('Poor sleep appears frequently in your entries. Consider improving your sleep hygiene.');
      }

      if (recommendations.length === 0) {
        recommendations.push('Your mood patterns look stable. Keep up the good work!');
      }

      return {
        success: true,
        data: {
          dominantTriggers,
          helpfulActivities,
          weeklyPattern,
          correlationAnalysis: {
            exercise: exerciseImpact,
            social: socialImpact,
            medication: medImpact
          },
          recommendations
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get insights'
      };
    }
  }

  /**
   * Helper to calculate impact of a factor
   */
  private calculateImpact(
    withFactor: MoodEntry[],
    withoutFactor: MoodEntry[]
  ): { impact: 'positive' | 'negative' | 'neutral'; avgDiff: number } {
    if (withFactor.length === 0 || withoutFactor.length === 0) {
      return { impact: 'neutral', avgDiff: 0 };
    }

    const withAvg = withFactor.reduce((sum, e) => sum + e.mood, 0) / withFactor.length;
    const withoutAvg = withoutFactor.reduce((sum, e) => sum + e.mood, 0) / withoutFactor.length;
    const diff = Math.round((withAvg - withoutAvg) * 10) / 10;

    let impact: 'positive' | 'negative' | 'neutral';
    if (diff > 0.5) impact = 'positive';
    else if (diff < -0.5) impact = 'negative';
    else impact = 'neutral';

    return { impact, avgDiff: diff };
  }

  /**
   * Get latest mood entry for a user
   */
  async getLatestMood(userId: string): Promise<ApiResponse<MoodEntry | null>> {
    try {
      const userEntries = moodEntries.get(userId) || [];
      const sorted = userEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
      return {
        success: true,
        data: sorted[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get latest mood'
      };
    }
  }

  /**
   * Delete a mood entry
   */
  async deleteMoodEntry(userId: string, entryId: string): Promise<ApiResponse<boolean>> {
    try {
      const userEntries = moodEntries.get(userId) || [];
      const index = userEntries.findIndex(e => e.id === entryId);

      if (index === -1) {
        return {
          success: false,
          error: 'Mood entry not found'
        };
      }

      userEntries.splice(index, 1);
      moodEntries.set(userId, userEntries);

      return {
        success: true,
        data: true,
        message: 'Mood entry deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete mood entry'
      };
    }
  }
}

export const moodTrackingService = new MoodTrackingService();
