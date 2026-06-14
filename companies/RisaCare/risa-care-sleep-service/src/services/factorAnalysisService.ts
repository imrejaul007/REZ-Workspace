import { v4 as uuidv4 } from 'uuid';
import { SleepFactor, LogFactorInput, sleepStorage, SleepFactorType } from '../models/sleep';
import { sleepTrackingService } from './sleepTrackingService';

export interface FactorCorrelation { factorType: SleepFactorType; avgQualityWithFactor: number; avgQualityWithoutFactor: number; impactScore: number; sampleSize: number; significance: 'high' | 'medium' | 'low'; }
export interface FactorImpactAnalysis { factorType: SleepFactorType; positiveDays: number; negativeDays: number; neutralDays: number; avgDurationOnPositive: number; avgDurationOnNegative: number; avgQualityOnPositive: number; avgQualityOnNegative: number; correlation: FactorCorrelation | null; recommendations: string[]; }

export class FactorAnalysisService {
  logFactor(input: LogFactorInput): SleepFactor {
    const factorId = uuidv4();
    const now = new Date().toISOString();
    const factor: SleepFactor = { factorId, userId: input.userId, date: input.date, type: input.type, impact: input.impact, notes: input.notes, createdAt: now };
    sleepStorage.factors.set(factorId, factor);
    return factor;
  }

  getFactors(userId: string, startDate?: string, endDate?: string, limit: number = 30): SleepFactor[] {
    const factors: SleepFactor[] = [];
    for (const factor of sleepStorage.factors.values()) {
      if (factor.userId !== userId) continue;
      if (startDate && factor.date < startDate) continue;
      if (endDate && factor.date > endDate) continue;
      factors.push(factor);
    }
    factors.sort((a, b) => b.date.localeCompare(a.date));
    return factors.slice(0, limit);
  }

  getFactorsByType(userId: string, type: SleepFactorType, days: number = 30): SleepFactor[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.getFactors(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]).filter(f => f.type === type);
  }

  analyzeFactorImpact(userId: string): FactorImpactAnalysis[] {
    const factors = this.getFactors(userId);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const records = sleepTrackingService.getSleepHistory(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 30);
    const analyses: FactorImpactAnalysis[] = [];
    const factorTypes: SleepFactorType[] = ['caffeine', 'exercise', 'screen_time', 'stress', 'meals', 'alcohol'];
    for (const type of factorTypes) {
      const typeFactors = factors.filter(f => f.type === type);
      const positiveDays = typeFactors.filter(f => f.impact === 'positive');
      const negativeDays = typeFactors.filter(f => f.impact === 'negative');
      const neutralDays = typeFactors.filter(f => f.impact === 'neutral');
      const getAvgDuration = (days: { date: string }[]) => {
        if (days.length === 0) return 0;
        const durations = days.map(d => records.find(r => r.date === d.date)?.duration || 0).filter(d => d > 0);
        return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      };
      const getAvgQuality = (days: { date: string }[]) => {
        if (days.length === 0) return 0;
        const qualities = days.map(d => records.find(r => r.date === d.date)?.quality || 0).filter(q => q > 0);
        return qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0;
      };
      const avgDurationOnPositive = getAvgDuration(positiveDays);
      const avgDurationOnNegative = getAvgDuration(negativeDays);
      const avgQualityOnPositive = getAvgQuality(positiveDays);
      const avgQualityOnNegative = getAvgQuality(negativeDays);
      const correlation = this.calculateCorrelation(userId, type, records, typeFactors);
      const recommendations = this.getFactorRecommendations(type, avgQualityOnPositive, avgQualityOnNegative, correlation);
      analyses.push({
        factorType: type, positiveDays: positiveDays.length, negativeDays: negativeDays.length, neutralDays: neutralDays.length,
        avgDurationOnPositive: Number(avgDurationOnPositive.toFixed(2)), avgDurationOnNegative: Number(avgDurationOnNegative.toFixed(2)),
        avgQualityOnPositive: Number(avgQualityOnPositive.toFixed(1)), avgQualityOnNegative: Number(avgQualityOnNegative.toFixed(1)),
        correlation, recommendations
      });
    }
    return analyses;
  }

  getFactorCorrelation(userId: string, factorType: SleepFactorType): FactorCorrelation | null {
    const factors = this.getFactorsByType(userId, factorType);
    if (factors.length < 3) return null;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const records = sleepTrackingService.getSleepHistory(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 30);
    return this.calculateCorrelation(userId, factorType, records, factors);
  }

  private calculateCorrelation(userId: string, type: SleepFactorType, records: { date: string; quality: number; duration: number }[], factors: SleepFactor[]): FactorCorrelation | null {
    const withFactor = factors.filter(f => f.impact !== 'neutral');
    if (withFactor.length < 2) return null;
    const datesWithFactor = new Set(withFactor.map(f => f.date));
    const recordsWithFactor = records.filter(r => datesWithFactor.has(r.date));
    const recordsWithoutFactor = records.filter(r => !datesWithFactor.has(r.date));
    if (recordsWithFactor.length < 2 || recordsWithoutFactor.length < 2) return null;
    const avgQualityWith = recordsWithFactor.reduce((a, b) => a + b.quality, 0) / recordsWithFactor.length;
    const avgQualityWithout = recordsWithoutFactor.reduce((a, b) => a + b.quality, 0) / recordsWithoutFactor.length;
    const positiveFactors = withFactor.filter(f => f.impact === 'positive').length;
    const totalWithFactor = withFactor.length;
    const impactScore = ((positiveFactors / totalWithFactor) * 100 - 50) * 2 * (avgQualityWith - avgQualityWithout);
    const significance: 'high' | 'medium' | 'low' = recordsWithFactor.length >= 10 ? 'high' : recordsWithFactor.length >= 5 ? 'medium' : 'low';
    return { factorType: type, avgQualityWithFactor: Number(avgQualityWith.toFixed(1)), avgQualityWithoutFactor: Number(avgQualityWithout.toFixed(1)), impactScore: Number(impactScore.toFixed(1)), sampleSize: recordsWithFactor.length, significance };
  }

  private getFactorRecommendations(type: SleepFactorType, avgQualityPositive: number, avgQualityNegative: number, correlation: FactorCorrelation | null): string[] {
    const recommendations: string[] = [];
    const descriptions: Record<SleepFactorType, string> = { caffeine: 'caffeine intake', exercise: 'exercise', screen_time: 'screen time', stress: 'stress levels', meals: 'eating late', alcohol: 'alcohol' };
    if (correlation && correlation.avgQualityWithFactor > correlation.avgQualityWithoutFactor + 1) recommendations.push(`Your ${descriptions[type]} correlates with better sleep quality. Continue this habit.`);
    else if (correlation && correlation.avgQualityWithFactor < correlation.avgQualityWithoutFactor - 1) recommendations.push(`Your ${descriptions[type]} appears to negatively impact your sleep. Consider adjusting.`);
    switch (type) {
      case 'caffeine': recommendations.push('Limit caffeine to before 2 PM'); break;
      case 'exercise': recommendations.push('Exercise at least 30 minutes most days', 'Avoid vigorous exercise within 3 hours of bedtime'); break;
      case 'screen_time': recommendations.push('Use night mode on devices after 8 PM'); break;
      case 'stress': recommendations.push('Practice relaxation techniques before bed'); break;
      case 'meals': recommendations.push('Finish eating at least 2-3 hours before bed'); break;
      case 'alcohol': recommendations.push('Limit alcohol and stop drinking at least 3 hours before bed'); break;
    }
    return recommendations;
  }

  getDailyFactorSummary(userId: string, date: string): { date: string; factors: SleepFactor[]; overallImpact: 'positive' | 'negative' | 'neutral'; notes: string[] } {
    const factors = this.getFactors(userId, date, date);
    let overallImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
    const positiveCount = factors.filter(f => f.impact === 'positive').length;
    const negativeCount = factors.filter(f => f.impact === 'negative').length;
    if (positiveCount > negativeCount) overallImpact = 'positive';
    else if (negativeCount > positiveCount) overallImpact = 'negative';
    const notes = factors.filter(f => f.notes).map(f => f.notes as string);
    return { date, factors, overallImpact, notes };
  }

  deleteFactor(factorId: string): boolean { return sleepStorage.factors.delete(factorId); }
}

export const factorAnalysisService = new FactorAnalysisService();
