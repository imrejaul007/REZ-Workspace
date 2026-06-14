/**
 * MyRisa Sexual Wellness Service
 * Libido, Contraception, Reproductive Health, Intimacy
 */

import { v4 as uuidv4 } from 'uuid';
import { parseISO, subDays, differenceInDays } from 'date-fns';
import {
  SexualActivity, LibidoRecord, Contraception,
  ReproductiveHealth, IntimacyJournal, STDScreening,
  SexualWellnessProfile, SexualWellnessInsights,
  LibidoAnalytics, IntimacyAnalytics
} from '../models/sexualWellness.js';

class SexualWellnessStore {
  private activities: Map<string, SexualActivity[]> = new Map();
  private libidoRecords: Map<string, LibidoRecord[]> = new Map();
  private contraception: Map<string, Contraception[]> = new Map();
  private reproductiveHealth: Map<string, ReproductiveHealth[]> = new Map();
  private intimacyJournals: Map<string, IntimacyJournal[]> = new Map();
  private stdScreenings: Map<string, STDScreening[]> = new Map();
  private profiles: Map<string, SexualWellnessProfile> = new Map();

  // Activities
  getActivities(userId: string): SexualActivity[] {
    return this.activities.get(userId) || [];
  }
  addActivity(activity: SexualActivity): void {
    const activities = this.getActivities(activity.userId);
    activities.push(activity);
    this.activities.set(activity.userId, activities);
  }

  // Libido
  getLibidoRecords(userId: string): LibidoRecord[] {
    return this.libidoRecords.get(userId) || [];
  }
  addLibidoRecord(record: LibidoRecord): void {
    const records = this.getLibidoRecords(record.userId);
    records.push(record);
    this.libidoRecords.set(record.userId, records);
  }

  // Contraception
  getContraception(userId: string): Contraception[] {
    return this.contraception.get(userId) || [];
  }
  addContraception(contraception: Contraception): void {
    const records = this.getContraception(contraception.userId);
    records.push(contraception);
    this.contraception.set(contraception.userId, records);
  }
  updateContraception(contraception: Contraception): void {
    const records = this.getContraception(contraception.userId);
    const index = records.findIndex(c => c.id === contraception.id);
    if (index >= 0) records[index] = contraception;
  }

  // Reproductive Health
  getReproductiveHealth(userId: string): ReproductiveHealth[] {
    return this.reproductiveHealth.get(userId) || [];
  }
  addReproductiveHealth(record: ReproductiveHealth): void {
    const records = this.getReproductiveHealth(record.userId);
    records.push(record);
    this.reproductiveHealth.set(record.userId, records);
  }

  // Intimacy Journals
  getIntimacyJournals(userId: string): IntimacyJournal[] {
    return this.intimacyJournals.get(userId) || [];
  }
  addIntimacyJournal(journal: IntimacyJournal): void {
    const journals = this.getIntimacyJournals(journal.userId);
    journals.push(journal);
    this.intimacyJournals.set(journal.userId, journals);
  }

  // STD Screenings
  getSTDScreenings(userId: string): STDScreening[] {
    return this.stdScreenings.get(userId) || [];
  }
  addSTDScreening(screening: STDScreening): void {
    const screenings = this.getSTDScreenings(screening.userId);
    screenings.push(screening);
    this.stdScreenings.set(screening.userId, screenings);
  }

  // Profiles
  getProfile(userId: string): SexualWellnessProfile | undefined {
    return this.profiles.get(userId);
  }
  setProfile(profile: SexualWellnessProfile): void {
    this.profiles.set(profile.userId, profile);
  }
}

export class SexualWellnessService {
  private store: SexualWellnessStore = new SexualWellnessStore();

  // ============================================
  // PROFILE
  // ============================================

  getOrCreateProfile(userId: string): SexualWellnessProfile {
    let profile = this.store.getProfile(userId);
    if (!profile) {
      profile = {
        userId,
        gender: undefined,
        sexualOrientation: undefined,
        relationshipStatus: 'single',
        sexuallyActive: false,
        partnerCount: 0,
        lastSTDTest: undefined,
        preferences: { communication: true, exploration: true, privacy: true },
        concerns: [],
        lastUpdated: new Date().toISOString()
      };
      this.store.setProfile(profile);
    }
    return profile;
  }

  updateProfile(userId: string, data: Partial<SexualWellnessProfile>): SexualWellnessProfile {
    const profile = this.getOrCreateProfile(userId);
    const updated = { ...profile, ...data, lastUpdated: new Date().toISOString() };
    this.store.setProfile(updated);
    return updated;
  }

  // ============================================
  // SEXUAL ACTIVITY
  // ============================================

  logActivity(userId: string, data: {
    date: string;
    partnerId?: string;
    type?: 'solo' | 'partner' | 'group';
    protectionUsed?: boolean;
    contraceptionUsed?: string[];
    satisfaction?: number;
    painLevel?: number;
    arousalLevel?: number;
    orgasm?: boolean;
    notes?: string;
  }): SexualActivity {
    const activity: SexualActivity = {
      id: uuidv4(),
      userId,
      date: data.date,
      partnerId: data.partnerId,
      type: data.type || 'partner',
      protectionUsed: data.protectionUsed || false,
      contraceptionUsed: data.contraceptionUsed || [],
      satisfaction: data.satisfaction,
      painLevel: data.painLevel,
      arousalLevel: data.arousalLevel,
      orgasm: data.orgasm,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addActivity(activity);

    // Update profile
    this.updateProfile(userId, {
      sexuallyActive: true,
      partnerCount: data.partnerId ? this.getActivities(userId).length + 1 : undefined
    });

    return activity;
  }

  getActivities(userId: string, limit?: number): SexualActivity[] {
    const activities = this.store.getActivities(userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? activities.slice(0, limit) : activities;
  }

  // ============================================
  // LIBIDO
  // ============================================

  logLibido(userId: string, data: {
    date: string;
    level: number;
    factors?: string[];
    notes?: string;
  }): LibidoRecord {
    const record: LibidoRecord = {
      id: uuidv4(),
      userId,
      date: data.date,
      level: data.level,
      factors: data.factors || [],
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addLibidoRecord(record);
    return record;
  }

  getLibidoRecords(userId: string, days?: number): LibidoRecord[] {
    let records = this.store.getLibidoRecords(userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (days) {
      const cutoff = subDays(new Date(), days).toISOString();
      records = records.filter(r => r.date >= cutoff);
    }

    return records;
  }

  getLibidoAnalytics(userId: string): LibidoAnalytics | null {
    const records = this.getLibidoRecords(userId, 90);
    if (records.length < 2) return null;

    const levels = records.map(r => r.level);
    const average = levels.reduce((a, b) => a + b, 0) / levels.length;

    // Count factors
    const factorCounts: Record<string, number> = {};
    records.forEach(r => {
      r.factors.forEach(f => {
        factorCounts[f] = (factorCounts[f] || 0) + 1;
      });
    });

    const commonFactors = Object.entries(factorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));

    // Determine trend (compare last 2 weeks vs previous 2 weeks)
    const recent = records.slice(0, 14).reduce((a, b) => a + b.level, 0) / Math.min(records.slice(0, 14).length, 14);
    const older = records.slice(14, 28).reduce((a, b) => a + b.level, 0) / Math.min(records.slice(14, 28).length, 14);
    const trend = recent > older + 0.5 ? 'increasing' : recent < older - 0.5 ? 'decreasing' : 'stable';

    return {
      averageLevel: Math.round(average * 10) / 10,
      highestLevel: Math.max(...levels),
      lowestLevel: Math.min(...levels),
      trend,
      commonFactors,
      recommendedFactors: this.getRecommendedLibidoFactors(factorCounts)
    };
  }

  private getRecommendedLibidoFactors(currentFactors: Record<string, number>): string[] {
    const recommendations: string[] = [];

    if (!currentFactors.sleep) recommendations.push('Improve sleep quality - it directly affects libido');
    if (!currentFactors.exercise) recommendations.push('Regular exercise boosts testosterone and libido');
    if (!currentFactors.stress) recommendations.push('Stress management can improve sexual desire');

    return recommendations;
  }

  // ============================================
  // CONTRACEPTION
  // ============================================

  addContraception(userId: string, data: {
    method: string;
    brand?: string;
    startDate: string;
    reminderTime?: string;
    notes?: string;
  }): Contraception {
    // Deactivate current method of same type
    const current = this.store.getContraception(userId);
    current.forEach(c => {
      if (c.method === data.method && c.isActive) {
        c.isActive = false;
        c.endDate = data.startDate;
        c.updatedAt = new Date().toISOString();
        this.store.updateContraception(c);
      }
    });

    const contraception: Contraception = {
      id: uuidv4(),
      userId,
      method: data.method as any,
      brand: data.brand,
      startDate: data.startDate,
      reminderTime: data.reminderTime,
      reminderEnabled: !!data.reminderTime,
      sideEffects: [],
      effectiveness: this.getMethodEffectiveness(data.method),
      notes: data.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.addContraception(contraception);
    return contraception;
  }

  private getMethodEffectiveness(method: string): number {
    const effectiveness: Record<string, number> = {
      'iud': 99,
      'implant': 99,
      'injection': 96,
      'pill': 93,
      'patch': 93,
      'ring': 93,
      'condom': 85,
      'diaphragm': 88,
      'fertility_awareness': 76,
      'withdrawal': 78,
      'none': 0
    };
    return effectiveness[method] || 0;
  }

  getContraception(userId: string): Contraception[] {
    return this.store.getContraception(userId);
  }

  getActiveContraception(userId: string): Contraception | null {
    return this.store.getContraception(userId).find(c => c.isActive) || null;
  }

  updateContraception(userId: string, contraceptionId: string, data: Partial<Contraception>): Contraception | null {
    const records = this.store.getContraception(userId);
    const index = records.findIndex(c => c.id === contraceptionId);
    if (index < 0) return null;

    const updated: Contraception = { ...records[index], ...data, updatedAt: new Date().toISOString() };
    this.store.updateContraception(updated);
    return updated;
  }

  addContraceptionSideEffect(userId: string, contraceptionId: string, sideEffect: string): Contraception | null {
    const records = this.store.getContraception(userId);
    const contraception = records.find(c => c.id === contraceptionId);
    if (!contraception) return null;

    contraception.sideEffects.push(sideEffect);
    contraception.updatedAt = new Date().toISOString();
    this.store.updateContraception(contraception);
    return contraception;
  }

  // ============================================
  // REPRODUCTIVE HEALTH
  // ============================================

  logReproductiveHealth(userId: string, data: {
    date: string;
    type: 'period' | 'spotting' | 'discharge' | 'pain' | 'infection' | 'std_test' | 'pap_smear' | 'mammogram' | 'breast_exam' | 'pelvic_exam';
    result?: 'normal' | 'abnormal' | 'positive' | 'negative' | 'pending';
    details?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    notes?: string;
  }): ReproductiveHealth {
    const record: ReproductiveHealth = {
      id: uuidv4(),
      userId,
      date: data.date,
      type: data.type,
      result: data.result,
      details: data.details,
      followUpRequired: data.followUpRequired || false,
      followUpDate: data.followUpDate,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addReproductiveHealth(record);
    return record;
  }

  getReproductiveHealth(userId: string): ReproductiveHealth[] {
    return this.store.getReproductiveHealth(userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ============================================
  // INTIMACY JOURNAL
  // ============================================

  logIntimacy(userId: string, data: {
    date: string;
    emotionalIntimacy: number;
    physicalIntimacy: number;
    communicationScore: number;
    affection: number;
    qualityTime: number;
    thingsGratified?: string[];
    thingsToImprove?: string[];
    notes?: string;
  }): IntimacyJournal {
    const journal: IntimacyJournal = {
      id: uuidv4(),
      userId,
      date: data.date,
      emotionalIntimacy: data.emotionalIntimacy,
      physicalIntimacy: data.physicalIntimacy,
      communicationScore: data.communicationScore,
      affection: data.affection,
      qualityTime: data.qualityTime,
      thingsGratified: data.thingsGratified || [],
      thingsToImprove: data.thingsToImprove || [],
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addIntimacyJournal(journal);
    return journal;
  }

  getIntimacyJournals(userId: string): IntimacyJournal[] {
    return this.store.getIntimacyJournals(userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getIntimacyAnalytics(userId: string): IntimacyAnalytics | null {
    const journals = this.getIntimacyJournals(userId);
    if (journals.length < 2) return null;

    const recent = journals.slice(0, Math.min(journals.length, 4));
    const older = journals.slice(Math.min(journals.length, 4), Math.min(journals.length, 8));

    const avgQuality = recent.reduce((sum, j) => sum + (
      j.emotionalIntimacy + j.physicalIntimacy + j.communicationScore +
      j.affection + j.qualityTime
    ) / 5, 0) / recent.length;

    const olderAvg = older.length > 0
      ? older.reduce((sum, j) => sum + (
          j.emotionalIntimacy + j.physicalIntimacy + j.communicationScore +
          j.affection + j.qualityTime
        ) / 5, 0) / older.length
      : avgQuality;

    const trend = avgQuality > olderAvg + 0.5 ? 'improving'
      : avgQuality < olderAvg - 0.5 ? 'worsening' : 'stable';

    // Calculate frequency from activities
    const activities = this.getActivities(userId, 90);
    const frequencyPerMonth = (activities.length / 3);

    return {
      averageQuality: Math.round(avgQuality * 10) / 10,
      frequencyPerMonth: Math.round(frequencyPerMonth * 10) / 10,
      satisfactionAverage: Math.round(
        activities.reduce((sum, a) => sum + (a.satisfaction || 5), 0) / activities.length * 10
      ) / 10,
      qualityTrend: trend,
      partnerConnection: Math.round(
        recent.reduce((sum, j) => sum + (
          j.emotionalIntimacy + j.communicationScore
        ) / 2, 0) / recent.length * 10
      ) / 10
    };
  }

  // ============================================
  // STD SCREENING
  // ============================================

  logSTDScreening(userId: string, data: {
    date: string;
    tests: Array<{ name: string; result: 'positive' | 'negative' | 'pending'; date: string }>;
    nextScreeningDate?: string;
    partnerTested?: boolean;
    notes?: string;
  }): STDScreening {
    const screening: STDScreening = {
      id: uuidv4(),
      userId,
      date: data.date,
      tests: data.tests,
      nextScreeningDate: data.nextScreeningDate,
      partnerTested: data.partnerTested || false,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addSTDScreening(screening);

    // Update profile
    this.updateProfile(userId, { lastSTDTest: data.date });

    return screening;
  }

  getSTDScreenings(userId: string): STDScreening[] {
    return this.store.getSTDScreenings(userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ============================================
  // COMPREHENSIVE INSIGHTS
  // ============================================

  getInsights(userId: string): SexualWellnessInsights {
    const profile = this.getOrCreateProfile(userId);
    const activities = this.getActivities(userId, 30);
    const contraception = this.getActiveContraception(userId);
    const reproductiveHealth = this.getReproductiveHealth(userId);
    const intimacyAnalytics = this.getIntimacyAnalytics(userId);
    const libidoAnalytics = this.getLibidoAnalytics(userId);

    // Calculate overall wellness score
    let wellnessScore = 75;

    if (profile.sexuallyActive && activities.length > 0) {
      const avgSatisfaction = activities.reduce((sum, a) => sum + (a.satisfaction || 5), 0) / activities.length;
      wellnessScore += (avgSatisfaction - 5) * 3;
    }

    if (profile.lastSTDTest) {
      const daysSinceTest = differenceInDays(new Date(), parseISO(profile.lastSTDTest));
      if (daysSinceTest > 365) {
        wellnessScore -= 10;
      }
    }

    if (contraception?.sideEffects && contraception.sideEffects.length > 3) {
      wellnessScore -= 5;
    }

    wellnessScore = Math.max(0, Math.min(100, Math.round(wellnessScore)));

    const status = wellnessScore >= 80 ? 'excellent'
      : wellnessScore >= 60 ? 'good'
      : wellnessScore >= 40 ? 'fair' : 'needs_attention';

    // Reproductive health status
    const lastCheckup = reproductiveHealth.length > 0 ? reproductiveHealth[0].date : null;
    const upcomingScreenings = reproductiveHealth.filter(r =>
      r.followUpDate && new Date(r.followUpDate) > new Date()
    );
    const nextDue = upcomingScreenings.length > 0 ? upcomingScreenings[0].followUpDate : null;

    let reproductiveStatus: 'up_to_date' | 'due_soon' | 'overdue' = 'up_to_date';
    if (nextDue) {
      const daysUntil = differenceInDays(parseISO(nextDue), new Date());
      if (daysUntil < 0) reproductiveStatus = 'overdue';
      else if (daysUntil < 30) reproductiveStatus = 'due_soon';
    }

    const recommendations: string[] = [];

    if (wellnessScore < 60) {
      recommendations.push('Consider discussing sexual health with a healthcare provider');
    }

    if (profile.sexuallyActive && !profile.lastSTDTest) {
      recommendations.push('STD testing is recommended for sexually active individuals');
    }

    if (intimacyAnalytics?.qualityTrend === 'worsening') {
      recommendations.push('Your intimacy quality has been declining. Consider open communication with your partner');
    }

    if (libidoAnalytics?.trend === 'decreasing') {
      recommendations.push('Your libido has been lower than usual. Sleep, exercise, and stress management may help');
    }

    if (contraception?.sideEffects && contraception.sideEffects.length > 2) {
      recommendations.push('You have reported side effects from your contraception. Consider discussing alternatives');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your sexual wellness looks healthy. Keep maintaining open communication and regular check-ups');
    }

    return {
      overall: { wellnessScore, status },
      libido: {
        averageLevel: libidoAnalytics?.averageLevel || 5,
        trend: libidoAnalytics?.trend || 'stable',
        factors: (libidoAnalytics?.commonFactors || []).slice(0, 3).map(f => ({ factor: f.factor, impact: 'common' }))
      },
      intimacy: {
        qualityScore: intimacyAnalytics?.averageQuality || 5,
        frequencyScore: intimacyAnalytics?.frequencyPerMonth || 0,
        satisfactionTrend: intimacyAnalytics?.qualityTrend || 'stable'
      },
      contraception: {
        activeMethod: contraception?.method || null,
        adherenceRate: 90, // Placeholder
        nextReviewDate: contraception?.startDate || new Date().toISOString()
      },
      reproductiveHealth: {
        lastCheckup,
        nextDue,
        status: reproductiveStatus
      },
      recommendations
    };
  }
}

export const sexualWellnessService = new SexualWellnessService();