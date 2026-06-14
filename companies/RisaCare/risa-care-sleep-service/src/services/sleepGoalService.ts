import { v4 as uuidv4 } from 'uuid';
import { SleepGoal, SetGoalInput, UpdateGoalInput, sleepStorage } from '../models/sleep';
import { sleepTrackingService } from './sleepTrackingService';

export class SleepGoalService {
  setGoal(input: SetGoalInput): SleepGoal {
    // Remove existing goal for user
    for (const [id, goal] of sleepStorage.goals.entries()) {
      if (goal.userId === input.userId) sleepStorage.goals.delete(id);
    }
    const goalId = uuidv4();
    const now = new Date().toISOString();
    const goal: SleepGoal = {
      goalId, userId: input.userId, targetDuration: input.targetDuration,
      targetBedtime: input.targetBedtime, targetWakeTime: input.targetWakeTime,
      days: input.days, createdAt: now, updatedAt: now
    };
    sleepStorage.goals.set(goalId, goal);
    return goal;
  }

  getGoal(userId: string): SleepGoal | undefined {
    for (const goal of sleepStorage.goals.values()) {
      if (goal.userId === userId) return goal;
    }
    return undefined;
  }

  updateGoal(goalId: string, input: UpdateGoalInput): SleepGoal | null {
    const existing = sleepStorage.goals.get(goalId);
    if (!existing) return null;
    const updated: SleepGoal = { ...existing, ...input, updatedAt: new Date().toISOString() };
    sleepStorage.goals.set(goalId, updated);
    return updated;
  }

  deleteGoal(goalId: string): boolean {
    return sleepStorage.goals.delete(goalId);
  }

  trackGoalProgress(userId: string, days: number = 30): {
    goal: SleepGoal | null;
    totalDays: number;
    achievedDays: number;
    achievementRate: number;
    avgDuration: number;
    avgBedtime: string;
    avgWakeTime: string;
    durationCompliance: number;
    bedtimeCompliance: number;
    streak: number;
    dailyProgress: { date: string; achieved: boolean; durationDiff: number; bedtimeDiff: number }[];
  } {
    const goal = this.getGoal(userId);
    if (!goal) {
      return { goal: null, totalDays: 0, achievedDays: 0, achievementRate: 0, avgDuration: 0, avgBedtime: '', avgWakeTime: '', durationCompliance: 0, bedtimeCompliance: 0, streak: 0, dailyProgress: [] };
    }
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const records = sleepTrackingService.getSleepHistory(userId, startStr, endStr, days);
    const goalRecords = records.filter(r => goal.days.includes(new Date(r.date).getDay()));
    const dailyProgress = goalRecords.map(r => {
      const durationDiff = r.duration - goal.targetDuration;
      const [targetH, targetM] = goal.targetBedtime.split(':').map(Number);
      const [actualH, actualM] = r.bedtime.split(':').map(Number);
      const targetMin = targetH * 60 + targetM;
      const actualMin = actualH < 12 ? actualH * 60 + actualM + 24 * 60 : actualH * 60 + actualM;
      const bedtimeDiff = (targetMin - actualMin) / 60;
      const achieved = r.duration >= goal.targetDuration - 0.5 && bedtimeDiff >= -1 && bedtimeDiff <= 0.5;
      return { date: r.date, achieved, durationDiff: Number(durationDiff.toFixed(2)), bedtimeDiff: Number(bedtimeDiff.toFixed(2)) };
    });
    const achievedDays = dailyProgress.filter(d => d.achieved).length;
    const achievementRate = goalRecords.length > 0 ? (achievedDays / goalRecords.length) * 100 : 0;
    const avgDuration = goalRecords.length > 0 ? goalRecords.reduce((sum, r) => sum + r.duration, 0) / goalRecords.length : 0;
    const avgBedtime = goalRecords.length > 0 ? this.calculateAverageTime(goalRecords.map(r => r.bedtime)) : '00:00';
    const avgWakeTime = goalRecords.length > 0 ? this.calculateAverageTime(goalRecords.map(r => r.wakeTime)) : '00:00';
    const durationCompliance = goalRecords.length > 0 ? (goalRecords.filter(r => r.duration >= goal.targetDuration - 0.5).length / goalRecords.length) * 100 : 0;
    const bedtimeCompliance = goalRecords.length > 0 ? (goalRecords.filter(r => {
      const [targetH, targetM] = goal.targetBedtime.split(':').map(Number);
      const [actualH, actualM] = r.bedtime.split(':').map(Number);
      const targetMin = targetH * 60 + targetM;
      const actualMin = actualH < 12 ? actualH * 60 + actualM + 24 * 60 : actualH * 60 + actualM;
      return Math.abs(targetMin - actualMin) <= 30;
    }).length / goalRecords.length) * 100 : 0;
    let streak = 0;
    for (const d of [...dailyProgress].reverse()) {
      if (d.achieved) streak++;
      else break;
    }
    return { goal, totalDays: goalRecords.length, achievedDays, achievementRate: Number(achievementRate.toFixed(1)), avgDuration: Number(avgDuration.toFixed(2)), avgBedtime, avgWakeTime, durationCompliance: Number(durationCompliance.toFixed(1)), bedtimeCompliance: Number(bedtimeCompliance.toFixed(1)), streak, dailyProgress };
  }

  private calculateAverageTime(times: string[]): string {
    if (times.length === 0) return '00:00';
    const minutes = times.map(t => {
      const [h, m] = t.split(':').map(Number);
      return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
    });
    const avgMin = minutes.reduce((a, b) => a + b, 0) / minutes.length;
    const h = Math.floor(avgMin / 60) % 24;
    const m = Math.round(avgMin % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

export const sleepGoalService = new SleepGoalService();
