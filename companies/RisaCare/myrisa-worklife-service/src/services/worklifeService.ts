/**
 * MyRisa Work-Life Balance Service
 * Burnout, Energy, Productivity, Work-Life Balance
 */

import { v4 as uuidv4 } from 'uuid';
import { parseISO, subDays, differenceInDays, startOfYear, format } from 'date-fns';
import {
  WorkRecord,
  PTORecord,
  WorkLifeSettings,
  WorkLifeScore,
  BurnoutAssessment,
  PTOBalance
} from '../models/worklife.js';

// In-memory storage
class WorkLifeStore {
  private workRecords: Map<string, WorkRecord[]> = new Map();
  private ptoRecords: Map<string, PTORecord[]> = new Map();
  private settings: Map<string, WorkLifeSettings> = new Map();

  // Work Records
  getWorkRecords(userId: string): WorkRecord[] {
    return this.workRecords.get(userId) || [];
  }

  addWorkRecord(record: WorkRecord): void {
    const records = this.getWorkRecords(record.userId);
    records.push(record);
    this.workRecords.set(record.userId, records);
  }

  // PTO Records
  getPTORecords(userId: string): PTORecord[] {
    return this.ptoRecords.get(userId) || [];
  }

  addPTORecord(record: PTORecord): void {
    const records = this.getPTORecords(record.userId);
    records.push(record);
    this.ptoRecords.set(record.userId, records);
  }

  // Settings
  getSettings(userId: string): WorkLifeSettings | undefined {
    return this.settings.get(userId);
  }

  setSettings(settings: WorkLifeSettings): void {
    this.settings.set(settings.userId, settings);
  }
}

export class WorkLifeService {
  private store: WorkLifeStore = new WorkLifeStore();

  // ============================================
  // WORK RECORDS
  // ============================================

  logWorkRecord(userId: string, data: {
    date: string;
    workHours: number;
    meetingHours?: number;
    deepWorkHours?: number;
    overtimeHours?: number;
    tasksCompleted?: number;
    contextSwitches?: number;
    workFromHome?: boolean;
    stressLevel?: number;
    energyLevel?: number;
    productivityScore?: number;
    notes?: string;
  }): WorkRecord {
    const record: WorkRecord = {
      id: uuidv4(),
      userId,
      date: data.date,
      workHours: data.workHours,
      meetingHours: data.meetingHours || 0,
      deepWorkHours: data.deepWorkHours || 0,
      overtimeHours: data.overtimeHours || 0,
      productivity: data.tasksCompleted ? (data.tasksCompleted / 10) * 10 : data.productivityScore || 0,
      energy: data.energyLevel || 5,
      breaksTaken: 0,
      overtimeHours: data.overtimeHours || 0,
      tasksCompleted: data.tasksCompleted || 0,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addWorkRecord(record);
    return record;
  }

  getWorkRecords(userId: string, days?: number): WorkRecord[] {
    let records = this.store.getWorkRecords(userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (days) {
      const cutoff = subDays(new Date(), days).toISOString().split('T')[0];
      records = records.filter(r => r.date >= cutoff);
    }

    return records;
  }

  // ============================================
  // WORK-LIFE SETTINGS
  // ============================================

  getOrCreateSettings(userId: string): WorkLifeSettings {
    let settings = this.store.getSettings(userId);
    if (!settings) {
      settings = {
        userId,
        standardWorkHours: { start: '09:00', end: '18:00' },
        workDays: [1, 2, 3, 4, 5],
        preferredPTOUsage: 'moderate',
        maxWeeklyHours: 50,
        allowOvertime: false,
        lastUpdated: new Date().toISOString()
      };
      this.store.setSettings(settings);
    }
    return settings;
  }

  updateSettings(userId: string, data: Partial<WorkLifeSettings>): WorkLifeSettings {
    const settings = this.getOrCreateSettings(userId);
    const updated = { ...settings, ...data, lastUpdated: new Date().toISOString() };
    this.store.setSettings(updated);
    return updated;
  }

  // ============================================
  // WORK-LIFE SCORE
  // ============================================

  getWorkLifeScore(userId: string): WorkLifeScore {
    const records = this.getWorkRecords(userId, 30);
    const ptoRecords = this.store.getPTORecords(userId);
    const settings = this.getOrCreateSettings(userId);

    // Calculate work hours score
    const avgWorkHours = records.length > 0
      ? records.reduce((sum, r) => sum + r.workHours, 0) / records.length
      : 8;
    const workHoursScore = avgWorkHours <= 8 ? 100
      : avgWorkHours <= 10 ? 80
      : avgWorkHours <= 12 ? 50
      : 20;

    // Calculate meeting score
    const avgMeetingHours = records.length > 0
      ? records.reduce((sum, r) => sum + r.meetingHours, 0) / records.length
      : 2;
    const meetingScore = avgMeetingHours <= 2 ? 100
      : avgMeetingHours <= 4 ? 80
      : avgMeetingHours <= 6 ? 50
      : 20;

    // Calculate energy score
    const avgEnergy = records.length > 0
      ? records.reduce((sum, r) => sum + (r.energy || 5), 0) / records.length
      : 5;
    const energyScore = avgEnergy * 10;

    // Calculate PTO usage
    const thisYear = new Date().getFullYear();
    const ptoThisYear = ptoRecords.filter(p => {
      const ptoYear = new Date(p.startDate).getFullYear();
      return ptoYear === thisYear;
    });
    const ptoDaysUsed = ptoThisYear.reduce((sum, p) => sum + p.totalDays, 0);
    const recoveryScore = ptoDaysUsed >= 15 ? 100
      : ptoDaysUsed >= 10 ? 80
      : ptoDaysUsed >= 5 ? 50
      : 20;

    // Calculate deep work score
    const avgDeepWork = records.length > 0
      ? records.reduce((sum, r) => sum + r.deepWorkHours, 0) / records.length
      : 2;
    const deepWorkScore = avgDeepWork >= 3 ? 100
      : avgDeepWork >= 2 ? 80
      : avgDeepWork >= 1 ? 50
      : 20;

    // Calculate overall
    const overall = Math.round(
      (workHoursScore * 0.3) +
      (meetingScore * 0.15) +
      (energyScore * 0.2) +
      (recoveryScore * 0.2) +
      (deepWorkScore * 0.15)
    );

    // Determine trends
    const recentRecords = records.slice(0, 7);
    const olderRecords = records.slice(7, 14);
    const recentAvgHours = recentRecords.length > 0
      ? recentRecords.reduce((sum, r) => sum + r.workHours, 0) / recentRecords.length
      : 0;
    const olderAvgHours = olderRecords.length > 0
      ? olderRecords.reduce((sum, r) => sum + r.workHours, 0) / olderRecords.length
      : recentAvgHours;

    return {
      userId,
      overall,
      workHours: workHoursScore,
      meetingHours: meetingScore,
      deepWork: deepWorkScore,
      energy: energyScore,
      recovery: recoveryScore,
      PTOUsed: ptoDaysUsed,
      workHoursTrend: recentAvgHours > olderAvgHours + 0.5 ? 'increasing'
        : recentAvgHours < olderAvgHours - 0.5 ? 'decreasing'
        : 'stable',
      recoveryTrend: recoveryScore > 60 ? 'improving'
        : recoveryScore < 40 ? 'worsening'
        : 'stable',
      recommendations: this.generateRecommendations(workHoursScore, energyScore, recoveryScore, deepWorkScore),
      lastUpdated: new Date().toISOString()
    };
  }

  private generateRecommendations(
    workHoursScore: number,
    energyScore: number,
    recoveryScore: number,
    deepWorkScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (workHoursScore < 50) {
      recommendations.push('Your work hours are consistently high. Consider setting boundaries or discussing workload with your manager.');
    }

    if (energyScore < 50) {
      recommendations.push('Your energy levels are low. Prioritize sleep, exercise, and recovery activities.');
    }

    if (recoveryScore < 50) {
      recommendations.push('Consider taking more time off to recharge and prevent burnout.');
    }

    if (deepWorkScore < 50) {
      recommendations.push('Try to block 2-3 hours daily for deep, focused work without meetings.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your work-life balance looks healthy. Keep maintaining these habits.');
    }

    return recommendations;
  }

  // ============================================
  // BURNOUT ASSESSMENT
  // ============================================

  assessBurnoutRisk(userId: string): BurnoutAssessment {
    const records = this.getWorkRecords(userId, 30);
    const score = this.getWorkLifeScore(userId);

    // Calculate exhaustion (based on work hours and energy)
    const avgWorkHours = records.length > 0
      ? records.reduce((sum, r) => sum + r.workHours, 0) / records.length
      : 8;
    const avgEnergy = records.length > 0
      ? records.reduce((sum, r) => sum + (r.energy || 5), 0) / records.length
      : 5;

    const exhaustionScore = Math.min(10,
      ((avgWorkHours / 12) * 5) + ((10 - avgEnergy) / 2)
    );

    // Calculate cynicism (based on declining productivity)
    const recentProductivity = records.slice(0, 7).reduce((sum, r) => sum + (r.productivity || 50), 0) / Math.max(records.slice(0, 7).length, 1);
    const olderProductivity = records.slice(14, 21).reduce((sum, r) => sum + (r.productivity || 50), 0) / Math.max(records.slice(14, 21).length, 1);
    const productivityDecline = recentProductivity < olderProductivity ? (olderProductivity - recentProductivity) / 10 : 0;

    const cynicismScore = Math.min(10,
      exhaustionScore / 3 + productivityDecline
    );

    // Calculate inefficacy
    const inefficacyScore = Math.min(10,
      exhaustionScore / 2 + (10 - avgEnergy) / 2
    );

    // Determine overall risk
    const totalScore = exhaustionScore + cynicismScore + inefficacyScore;
    const overallRisk: 'low' | 'moderate' | 'high' | 'severe' =
      totalScore >= 22 ? 'severe'
      : totalScore >= 16 ? 'high'
      : totalScore >= 10 ? 'moderate'
      : 'low';

    // Contributing factors
    const contributingFactors: string[] = [];
    if (avgWorkHours > 10) contributingFactors.push('High work hours');
    if (avgEnergy < 4) contributingFactors.push('Low energy levels');
    if (productivityDecline > 2) contributingFactors.push('Declining productivity');
    if (records.some(r => r.overtimeHours > 2)) contributingFactors.push('Regular overtime');

    // Protective factors
    const protectiveFactors: string[] = [];
    if (avgEnergy > 6) protectiveFactors.push('Good energy levels');
    if (records.some(r => r.breaksTaken > 2)) protectiveFactors.push('Taking regular breaks');
    if (score.PTOUsed >= 10) protectiveFactors.push('Adequate time off');

    return {
      userId,
      overallRisk,
      exhaustionScore: Math.round(exhaustionScore * 10) / 10,
      cynicismScore: Math.round(cynicismScore * 10) / 10,
      inefficacyScore: Math.round(inefficacyScore * 10) / 10,
      contributingFactors,
      protectiveFactors,
      recommendations: this.generateBurnoutRecommendations(overallRisk, exhaustionScore),
      nextAssessmentDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      assessedAt: new Date().toISOString()
    };
  }

  private generateBurnoutRecommendations(risk: string, exhaustion: number): string[] {
    const recommendations: string[] = [];

    if (risk === 'severe' || risk === 'high') {
      recommendations.push('Consider taking immediate steps to reduce workload');
      recommendations.push('Talk to your manager about your capacity');
      recommendations.push('Prioritize sleep and self-care activities');
    }

    if (exhaustion > 7) {
      recommendations.push('Your exhaustion levels are high. Focus on recovery and avoid new commitments.');
    }

    recommendations.push('Maintain regular exercise and sleep schedule');
    recommendations.push('Stay connected with friends and family');
    recommendations.push('Consider talking to a mental health professional if symptoms persist');

    return recommendations;
  }

  // ============================================
  // PTO MANAGEMENT
  // ============================================

  logPTO(userId: string, data: {
    type: 'vacation' | 'sick' | 'personal' | 'parental' | 'bereavement' | 'other';
    startDate: string;
    endDate: string;
    reason?: string;
    planned?: boolean;
  }): PTORecord {
    const record: PTORecord = {
      id: uuidv4(),
      userId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: differenceInDays(parseISO(data.endDate), parseISO(data.startDate)) + 1,
      reason: data.reason,
      planned: data.planned ?? true,
      createdAt: new Date().toISOString()
    };

    this.store.addPTORecord(record);
    return record;
  }

  getPTORecords(userId: string, year?: number): PTORecord[] {
    let records = this.store.getPTORecords(userId);

    if (year) {
      records = records.filter(r => new Date(r.startDate).getFullYear() === year);
    }

    return records.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  getPTOBalance(userId: string, year?: number): PTOBalance {
    const targetYear = year || new Date().getFullYear();
    const records = this.getPTORecords(userId, targetYear);

    const allocation = 24; // Standard allocation
    const used = records.reduce((sum, r) => sum + r.totalDays, 0);

    return {
      userId,
      year: targetYear,
      allocation,
      used,
      pending: 0,
      remaining: allocation - used,
      carryOver: 0,
      breakdown: {
        vacation: records.filter(r => r.type === 'vacation').reduce((sum, r) => sum + r.totalDays, 0),
        sick: records.filter(r => r.type === 'sick').reduce((sum, r) => sum + r.totalDays, 0),
        personal: records.filter(r => r.type === 'personal').reduce((sum, r) => sum + r.totalDays, 0)
      }
    };
  }

  // ============================================
  // WORK INSIGHTS
  // ============================================

  getWorkInsights(userId: string): {
    summary: string;
    burnoutRisk: BurnoutAssessment;
    workLifeScore: WorkLifeScore;
    ptoBalance: PTOBalance;
    insights: string[];
  } {
    const burnoutRisk = this.assessBurnoutRisk(userId);
    const workLifeScore = this.getWorkLifeScore(userId);
    const ptoBalance = this.getPTOBalance(userId);
    const records = this.getWorkRecords(userId, 7);

    const insights: string[] = [];

    if (burnoutRisk.overallRisk === 'high' || burnoutRisk.overallRisk === 'severe') {
      insights.push('🚨 Your burnout risk is elevated. Consider taking action soon.');
    }

    if (workLifeScore.workHoursTrend === 'increasing') {
      insights.push('📈 Your work hours have been increasing. Watch for signs of overwork.');
    }

    if (workLifeScore.recoveryTrend === 'worsening') {
      insights.push('📉 Your recovery time is decreasing. Plan some time off.');
    }

    if (ptoBalance.remaining < 5) {
      insights.push('🏖️ Your PTO balance is low. Consider scheduling some time off.');
    }

    if (records.length === 0) {
      insights.push('📝 No work records logged this week. Start tracking to get insights.');
    }

    if (insights.length === 0) {
      insights.push('✨ Your work patterns look healthy. Keep it up!');
    }

    return {
      summary: `Overall work-life balance: ${workLifeScore.overall}/100. Burnout risk: ${burnoutRisk.overallRisk}`,
      burnoutRisk,
      workLifeScore,
      ptoBalance,
      insights
    };
  }
}

export const worklifeService = new WorkLifeService();

// Helper function
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}