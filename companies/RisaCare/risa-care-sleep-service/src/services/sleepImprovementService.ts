import { sleepStorage } from '../models/sleep';
import { sleepTrackingService } from './sleepTrackingService';
import { sleepAnalysisService } from './sleepAnalysisService';

export interface Recommendation { category: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; impact: string; effort: 'low' | 'medium' | 'high'; }
export interface SleepTip { id: string; title: string; content: string; category: 'environment' | 'routine' | 'lifestyle' | 'technology' | 'nutrition'; effectiveness: number; }

export class SleepImprovementService {
  private tips: SleepTip[] = [
    { id: '1', title: 'Keep a Consistent Schedule', content: 'Go to bed and wake up at the same time every day, even on weekends.', category: 'routine', effectiveness: 95 },
    { id: '2', title: 'Create a Relaxing Bedtime Routine', content: 'Develop calming activities before bed like reading, gentle stretching, or meditation.', category: 'routine', effectiveness: 90 },
    { id: '3', title: 'Optimize Your Sleep Environment', content: 'Keep your bedroom cool (65-68F), dark, and quiet.', category: 'environment', effectiveness: 85 },
    { id: '4', title: 'Limit Screen Time Before Bed', content: 'Avoid screens at least 1 hour before bed. Blue light suppresses melatonin.', category: 'technology', effectiveness: 88 },
    { id: '5', title: 'Watch Your Caffeine Intake', content: 'Avoid caffeine after 2 PM. It stays in your system for 6-8 hours.', category: 'nutrition', effectiveness: 82 },
    { id: '6', title: 'Exercise Regularly', content: 'Regular physical activity improves sleep quality. Avoid vigorous exercise within 3 hours of bedtime.', category: 'lifestyle', effectiveness: 80 },
    { id: '7', title: 'Avoid Large Meals at Night', content: 'Finish eating 2-3 hours before bed.', category: 'nutrition', effectiveness: 75 },
    { id: '8', title: 'Limit Alcohol Consumption', content: 'Alcohol disrupts REM sleep later in the night.', category: 'nutrition', effectiveness: 78 },
    { id: '9', title: 'Use Your Bed Only for Sleep', content: 'Train your brain to associate bed with sleep only.', category: 'environment', effectiveness: 85 },
    { id: '10', title: 'Manage Stress and Anxiety', content: 'Practice relaxation techniques like deep breathing or journaling.', category: 'lifestyle', effectiveness: 88 },
    { id: '11', title: 'Get Natural Light Exposure', content: 'Get 30 minutes of natural sunlight daily, especially in the morning.', category: 'lifestyle', effectiveness: 82 },
    { id: '12', title: 'Limit Naps', content: 'If you must nap, keep it under 20 minutes and before 3 PM.', category: 'routine', effectiveness: 70 },
  ];

  getRecommendations(userId: string): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const patterns = sleepAnalysisService.analyzePatterns(userId, 14);
    const summary = sleepTrackingService.getWeeklySummary(userId);
    const factors = this.getRecentFactors(userId);
    if (!patterns && summary.totalNights === 0) {
      recommendations.push({ category: 'start', title: 'Start Tracking Your Sleep', description: 'Log your first sleep record to receive personalized recommendations.', priority: 'high', impact: 'Get started with personalized insights', effort: 'low' });
      return recommendations;
    }
    if (summary.avgDuration < 7) recommendations.push({ category: 'duration', title: 'Increase Sleep Duration', description: `You're averaging ${summary.avgDuration.toFixed(1)} hours. Aim for 7-9 hours.`, priority: 'high', impact: 'Better recovery', effort: 'medium' });
    if (patterns) {
      if (patterns.consistencyScore < 70) recommendations.push({ category: 'consistency', title: 'Improve Sleep Consistency', description: 'Your sleep schedule varies significantly. Try consistent bedtimes.', priority: 'high', impact: 'Improved sleep quality', effort: 'medium' });
      if (patterns.trend === 'declining') recommendations.push({ category: 'trend', title: 'Address Sleep Decline', description: 'Your sleep quality has been declining.', priority: 'high', impact: 'Prevent further deterioration', effort: 'low' });
    }
    const negativeFactors = factors.filter(f => f.impact === 'negative');
    if (negativeFactors.some(f => f.type === 'caffeine')) recommendations.push({ category: 'caffeine', title: 'Limit Afternoon Caffeine', description: 'Your caffeine intake may be affecting your sleep.', priority: 'medium', impact: 'Faster sleep onset', effort: 'low' });
    if (negativeFactors.some(f => f.type === 'screen_time')) recommendations.push({ category: 'screens', title: 'Reduce Evening Screen Time', description: 'Screen exposure before bed is affecting your sleep.', priority: 'medium', impact: 'Better melatonin production', effort: 'medium' });
    if (negativeFactors.some(f => f.type === 'stress')) recommendations.push({ category: 'stress', title: 'Manage Stress Before Bed', description: 'Stress appears to be impacting your sleep.', priority: 'high', impact: 'Easier sleep onset', effort: 'medium' });
    return recommendations;
  }

  private getRecentFactors(userId: string): { type: string; impact: string }[] {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    const factors: { type: string; impact: string }[] = [];
    for (const factor of sleepStorage.factors.values()) {
      if (factor.userId === userId && factor.date >= startDate.toISOString().split('T')[0] && factor.date <= endDate.toISOString().split('T')[0]) {
        factors.push({ type: factor.type, impact: factor.impact });
      }
    }
    return factors;
  }

  getSleepTips(category?: string): SleepTip[] {
    return category ? this.tips.filter(t => t.category === category) : this.tips;
  }

  getSleepHygieneScore(userId: string): { score: number; maxScore: number; factors: { name: string; score: number; maxScore: number; tip: string }[]; overallRating: string } {
    const patterns = sleepAnalysisService.analyzePatterns(userId, 14);
    const summary = sleepTrackingService.getWeeklySummary(userId);
    const sleepFactors = this.getRecentFactors(userId);
    const durationScore = Math.min(25, (summary.avgDuration / 9) * 25);
    const consistencyScore = patterns ? Math.min(25, (patterns.consistencyScore / 100) * 25) : 12.5;
    const qualityScore = (summary.avgQuality / 10) * 25;
    const caffeineScore = sleepFactors.some(f => f.type === 'caffeine' && f.impact === 'negative') ? 0 : 12.5;
    const screenScore = sleepFactors.some(f => f.type === 'screen_time' && f.impact === 'negative') ? 0 : 12.5;
    const totalScore = durationScore + consistencyScore + qualityScore + caffeineScore + screenScore;
    let rating = 'Poor';
    if (totalScore >= 90) rating = 'Excellent';
    else if (totalScore >= 75) rating = 'Good';
    else if (totalScore >= 60) rating = 'Fair';
    return {
      score: Number(totalScore.toFixed(1)), maxScore: 100,
      factors: [
        { name: 'Sleep Duration', score: Number(durationScore.toFixed(1)), maxScore: 25, tip: summary.avgDuration < 7 ? 'Aim for 7-9 hours' : 'Great duration!' },
        { name: 'Sleep Consistency', score: Number(consistencyScore.toFixed(1)), maxScore: 25, tip: patterns && patterns.consistencyScore < 70 ? 'Maintain consistent bedtimes' : 'Good consistency!' },
        { name: 'Sleep Quality', score: Number(qualityScore.toFixed(1)), maxScore: 25, tip: summary.avgQuality < 7 ? 'Focus on sleep hygiene' : 'Good quality!' },
        { name: 'Caffeine Habits', score: caffeineScore, maxScore: 12.5, tip: caffeineScore < 12.5 ? 'Limit caffeine after 2 PM' : 'Good caffeine management!' },
        { name: 'Screen Time', score: screenScore, maxScore: 12.5, tip: screenScore < 12.5 ? 'Reduce screen time before bed' : 'Good screen habits!' }
      ],
      overallRating: rating
    };
  }

  suggestBedtime(userId: string, wakeTime?: string): { suggestedBedtime: string; recommendedWakeTime: string; sleepDuration: number; reasoning: string } {
    const targetWakeTime = wakeTime || '07:00';
    const [wakeH, wakeM] = targetWakeTime.split(':').map(Number);
    const targetDuration = 8;
    let bedtimeMinutes = wakeH * 60 + wakeM - targetDuration * 60;
    if (bedtimeMinutes < 0) bedtimeMinutes += 24 * 60;
    const bedH = Math.floor(bedtimeMinutes / 60);
    const bedM = Math.round(bedtimeMinutes % 60);
    const suggestedBedtime = `${bedH.toString().padStart(2, '0')}:${bedM.toString().padStart(2, '0')}`;
    const patterns = sleepAnalysisService.analyzePatterns(userId, 14);
    let reasoning = 'Based on the recommended 8 hours of sleep for adults.';
    if (patterns) {
      const actualH = parseInt(patterns.averageBedtime.split(':')[0]);
      reasoning = actualH >= 23 || actualH < 2 ? 'Your schedule is later than ideal. Try this earlier bedtime.' : 'This bedtime aligns well with healthy sleep patterns.';
    }
    return { suggestedBedtime, recommendedWakeTime: targetWakeTime, sleepDuration: targetDuration, reasoning };
  }

  getImprovementPlan(userId: string): { weekly: { goal: string; action: string; expectedImpact: string }[]; monthly: { goal: string; action: string; expectedImpact: string }[] } {
    const recommendations = this.getRecommendations(userId);
    const weekly = recommendations.filter(r => r.priority === 'high').slice(0, 3).map(r => ({ goal: r.title, action: r.description, expectedImpact: r.impact }));
    if (weekly.length === 0) weekly.push({ goal: 'Maintain Good Sleep', action: 'Continue following your current healthy sleep habits', expectedImpact: 'Consistent quality sleep' });
    return {
      weekly,
      monthly: [
        { goal: 'Establish Consistent Schedule', action: 'Sleep and wake at the same times daily for 4 weeks', expectedImpact: 'Improved circadian rhythm' },
        { goal: 'Optimize Sleep Environment', action: 'Adjust bedroom temperature, lighting, and noise levels', expectedImpact: 'Easier sleep onset' },
        { goal: 'Build Relaxation Routine', action: 'Develop a 30-minute pre-sleep relaxation ritual', expectedImpact: 'Better sleep quality' }
      ]
    };
  }
}

export const sleepImprovementService = new SleepImprovementService();
