import { v4 as uuidv4 } from 'uuid';
import {
  SleepRecord,
  LogSleepInput,
  sleepStorage
} from '../models/sleep';

export class SleepTrackingService {
  private calculateDuration(bedtime: string, wakeTime: string): number {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    let bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;
    if (wakeMinutes < bedMinutes) wakeMinutes += 24 * 60;
    return Number(((wakeMinutes - bedMinutes) / 60).toFixed(2));
  }

  calculateSleepEfficiency(record: SleepRecord): number {
    if (!record.awakenings || record.awakenings === 0) return 100;
    const totalAwakeningsMinutes = record.awakenings * 5;
    const timeAsleep = record.duration * 60 - totalAwakeningsMinutes;
    const efficiency = (timeAsleep / (record.duration * 60)) * 100;
    return Math.max(0, Math.min(100, Number(efficiency.toFixed(1))));
  }

  getAverageSleep(records: SleepRecord[]): {
    avgDuration: number; avgQuality: number; avgDeepSleep: number;
    avgLightSleep: number; avgRemSleep: number; avgAwakenings: number; avgEfficiency: number;
  } {
    if (records.length === 0) {
      return { avgDuration: 0, avgQuality: 0, avgDeepSleep: 0, avgLightSleep: 0, avgRemSleep: 0, avgAwakenings: 0, avgEfficiency: 0 };
    }
    const avgDuration = records.reduce((sum, r) => sum + r.duration, 0) / records.length;
    const avgQuality = records.reduce((sum, r) => sum + r.quality, 0) / records.length;
    const avgDeepSleep = records.reduce((sum, r) => sum + (r.deepSleep || 0), 0) / records.length;
    const avgLightSleep = records.reduce((sum, r) => sum + (r.lightSleep || 0), 0) / records.length;
    const avgRemSleep = records.reduce((sum, r) => sum + (r.remSleep || 0), 0) / records.length;
    const avgAwakenings = records.reduce((sum, r) => sum + (r.awakenings || 0), 0) / records.length;
    const efficiencies = records.map(r => this.calculateSleepEfficiency(r));
    const avgEfficiency = efficiencies.reduce((sum, e) => sum + e, 0) / records.length;
    return {
      avgDuration: Number(avgDuration.toFixed(2)), avgQuality: Number(avgQuality.toFixed(1)),
      avgDeepSleep: Number(avgDeepSleep.toFixed(2)), avgLightSleep: Number(avgLightSleep.toFixed(2)),
      avgRemSleep: Number(avgRemSleep.toFixed(2)), avgAwakenings: Number(avgAwakenings.toFixed(1)),
      avgEfficiency: Number(avgEfficiency.toFixed(1))
    };
  }

  logSleep(input: LogSleepInput): SleepRecord {
    const recordId = uuidv4();
    const now = new Date().toISOString();
    const duration = this.calculateDuration(input.bedtime, input.wakeTime);
    const record: SleepRecord = {
      recordId, userId: input.userId, date: input.date, bedtime: input.bedtime,
      wakeTime: input.wakeTime, duration, quality: input.quality,
      deepSleep: input.deepSleep, lightSleep: input.lightSleep, remSleep: input.remSleep,
      awakenings: input.awakenings, sleepStages: input.sleepStages, notes: input.notes,
      createdAt: now, updatedAt: now
    };
    sleepStorage.records.set(recordId, record);
    return record;
  }

  getSleepRecord(userId: string, date: string): SleepRecord | undefined {
    for (const record of sleepStorage.records.values()) {
      if (record.userId === userId && record.date === date) return record;
    }
    return undefined;
  }

  getSleepHistory(userId: string, startDate?: string, endDate?: string, limit: number = 30): SleepRecord[] {
    const records: SleepRecord[] = [];
    for (const record of sleepStorage.records.values()) {
      if (record.userId !== userId) continue;
      if (startDate && record.date < startDate) continue;
      if (endDate && record.date > endDate) continue;
      records.push(record);
    }
    records.sort((a, b) => b.date.localeCompare(a.date));
    return records.slice(0, limit);
  }

  getSleepTrend(userId: string, days: number = 7): { dates: string[]; durations: number[]; qualities: number[]; efficiencies: number[] } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const records = this.getSleepHistory(userId, startStr, endStr, days);
    const dates: string[] = [], durations: number[] = [], qualities: number[] = [], efficiencies: number[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      const record = records.find(r => r.date === dateStr);
      durations.push(record?.duration || 0);
      qualities.push(record?.quality || 0);
      efficiencies.push(record ? this.calculateSleepEfficiency(record) : 0);
    }
    return { dates, durations, qualities, efficiencies };
  }

  getWeeklySummary(userId: string): {
    totalNights: number; avgDuration: number; avgQuality: number;
    bestNight: SleepRecord | null; worstNight: SleepRecord | null;
    totalHoursSlept: number; nightsWith7Hours: number; nightsWith8Hours: number;
  } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const records = this.getSleepHistory(userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 7);
    if (records.length === 0) {
      return { totalNights: 0, avgDuration: 0, avgQuality: 0, bestNight: null, worstNight: null, totalHoursSlept: 0, nightsWith7Hours: 0, nightsWith8Hours: 0 };
    }
    const avgDuration = records.reduce((sum, r) => sum + r.duration, 0) / records.length;
    const avgQuality = records.reduce((sum, r) => sum + r.quality, 0) / records.length;
    const sorted = [...records].sort((a, b) => b.quality - a.quality);
    const totalHoursSlept = records.reduce((sum, r) => sum + r.duration, 0);
    return {
      totalNights: records.length, avgDuration: Number(avgDuration.toFixed(2)), avgQuality: Number(avgQuality.toFixed(1)),
      bestNight: sorted[0], worstNight: sorted[sorted.length - 1], totalHoursSlept: Number(totalHoursSlept.toFixed(1)),
      nightsWith7Hours: records.filter(r => r.duration >= 7).length, nightsWith8Hours: records.filter(r => r.duration >= 8).length
    };
  }

  updateSleepRecord(recordId: string, updates: Partial<LogSleepInput>): SleepRecord | null {
    const existing = sleepStorage.records.get(recordId);
    if (!existing) return null;
    const duration = updates.bedtime && updates.wakeTime ? this.calculateDuration(updates.bedtime, updates.wakeTime) : existing.duration;
    const updated: SleepRecord = { ...existing, ...updates, duration: duration || existing.duration, updatedAt: new Date().toISOString() };
    sleepStorage.records.set(recordId, updated);
    return updated;
  }

  deleteSleepRecord(recordId: string): boolean {
    return sleepStorage.records.delete(recordId);
  }
}

export const sleepTrackingService = new SleepTrackingService();
