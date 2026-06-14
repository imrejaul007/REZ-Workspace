/**
 * MyRisa Women's Health Service
 * Cycle, Fertility, Pregnancy, PCOS, Menopause
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, differenceInDays, format, subDays, parseISO } from 'date-fns';
import {
  MenstrualCycle, CycleSettings, CyclePrediction, CycleAnalytics,
  FertilityRecord, FertilityStatus, HealthInsights,
  Pregnancy, PregnancyWeek, PregnancyMilestone,
  PCOSRecord, PCOSManagementPlan,
  MenopauseRecord,
  WomensHealthProfile,
  Reminder
} from '../models/womensHealth.js';

// In-memory storage
class WomensHealthStore {
  private cycles: Map<string, MenstrualCycle[]> = new Map();
  private settings: Map<string, CycleSettings> = new Map();
  private fertilityRecords: Map<string, FertilityRecord[]> = new Map();
  private fertilityStatus: Map<string, FertilityStatus> = new Map();
  private pregnancies: Map<string, Pregnancy[]> = new Map();
  private pcosRecords: Map<string, PCOSRecord[]> = new Map();
  private menopauseRecords: Map<string, MenopauseRecord[]> = new Map();
  private profiles: Map<string, WomensHealthProfile> = new Map();
  private reminders: Map<string, Reminder[]> = new Map();

  // Cycles
  getCycles(userId: string): MenstrualCycle[] {
    return this.cycles.get(userId) || [];
  }

  addCycle(cycle: MenstrualCycle): void {
    const cycles = this.getCycles(cycle.userId);
    cycles.push(cycle);
    this.cycles.set(cycle.userId, cycles);
  }

  getSettings(userId: string): CycleSettings | undefined {
    return this.settings.get(userId);
  }

  setSettings(settings: CycleSettings): void {
    this.settings.set(settings.userId, settings);
  }

  // Fertility
  getFertilityRecords(userId: string): FertilityRecord[] {
    return this.fertilityRecords.get(userId) || [];
  }

  addFertilityRecord(record: FertilityRecord): void {
    const records = this.getFertilityRecords(record.userId);
    records.push(record);
    this.fertilityRecords.set(record.userId, records);
  }

  getFertilityStatus(userId: string): FertilityStatus | undefined {
    return this.fertilityStatus.get(userId);
  }

  setFertilityStatus(status: FertilityStatus): void {
    this.fertilityStatus.set(status.userId, status);
  }

  // Pregnancies
  getPregnancies(userId: string): Pregnancy[] {
    return this.pregnancies.get(userId) || [];
  }

  addPregnancy(pregnancy: Pregnancy): void {
    const pregnancies = this.getPregnancies(pregnancy.userId);
    pregnancies.push(pregnancy);
    this.pregnancies.set(pregnancy.userId, pregnancies);
  }

  updatePregnancy(pregnancy: Pregnancy): void {
    const pregnancies = this.getPregnancies(pregnancy.userId);
    const index = pregnancies.findIndex(p => p.id === pregnancy.id);
    if (index >= 0) {
      pregnancies[index] = pregnancy;
    }
  }

  // PCOS
  getPCOSRecords(userId: string): PCOSRecord[] {
    return this.pcosRecords.get(userId) || [];
  }

  addPCOSRecord(record: PCOSRecord): void {
    const records = this.getPCOSRecords(record.userId);
    records.push(record);
    this.pcosRecords.set(record.userId, records);
  }

  // Menopause
  getMenopauseRecords(userId: string): MenopauseRecord[] {
    return this.menopauseRecords.get(userId) || [];
  }

  addMenopauseRecord(record: MenopauseRecord): void {
    const records = this.getMenopauseRecords(record.userId);
    records.push(record);
    this.menopauseRecords.set(record.userId, records);
  }

  // Profile
  getProfile(userId: string): WomensHealthProfile | undefined {
    return this.profiles.get(userId);
  }

  setProfile(profile: WomensHealthProfile): void {
    this.profiles.set(profile.userId, profile);
  }

  // Reminders
  getReminders(userId: string): Reminder[] {
    return this.reminders.get(userId) || [];
  }

  addReminder(reminder: Reminder): void {
    const reminders = this.getReminders(reminder.userId);
    reminders.push(reminder);
    this.reminders.set(reminder.userId, reminders);
  }

  updateReminder(reminder: Reminder): void {
    const reminders = this.getReminders(reminder.userId);
    const index = reminders.findIndex(r => r.id === reminder.id);
    if (index >= 0) {
      reminders[index] = reminder;
    }
  }

  deleteReminder(userId: string, reminderId: string): void {
    const reminders = this.getReminders(userId);
    const filtered = reminders.filter(r => r.id !== reminderId);
    this.reminders.set(userId, filtered);
  }
}

export class WomensHealthService {
  private store: WomensHealthStore = new WomensHealthStore();

  // ============================================
  // PROFILE
  // ============================================

  getOrCreateProfile(userId: string): WomensHealthProfile {
    let profile = this.store.getProfile(userId);
    if (!profile) {
      profile = {
        userId,
        dateOfBirth: undefined,
        ageAtMenarche: undefined,
        cycleLength: 28,
        periodLength: 5,
        lastPeriodDate: undefined,
        flow: 'medium',
        menstrualStatus: 'unknown',
        conditions: ['none'],
        pregnancyHistory: { pregnancies: 0, liveBirths: 0, miscarriages: 0, abortions: 0 },
        contraceptiveHistory: [],
        lastUpdated: new Date().toISOString()
      };
      this.store.setProfile(profile);
    }
    return profile;
  }

  updateProfile(userId: string, data: Partial<WomensHealthProfile>): WomensHealthProfile {
    const profile = this.getOrCreateProfile(userId);
    const updated = { ...profile, ...data, lastUpdated: new Date().toISOString() };
    this.store.setProfile(updated);
    return updated;
  }

  // ============================================
  // MENSTRUAL CYCLE
  // ============================================

  logCycle(userId: string, data: {
    startDate: string;
    endDate?: string;
    flowIntensity?: 'light' | 'medium' | 'heavy';
    symptoms?: Array<{ name: string; severity?: 'mild' | 'moderate' | 'severe' }>;
    notes?: string;
  }): MenstrualCycle {
    const cycle: MenstrualCycle = {
      id: uuidv4(),
      userId,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: data.endDate ? differenceInDays(parseISO(data.endDate), parseISO(data.startDate)) + 1 : undefined,
      flowIntensity: data.flowIntensity,
      symptoms: data.symptoms || [],
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.addCycle(cycle);

    // Update profile with last period
    this.updateProfile(userId, { lastPeriodDate: data.startDate });

    return cycle;
  }

  getCycles(userId: string, limit?: number): MenstrualCycle[] {
    const cycles = this.store.getCycles(userId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return limit ? cycles.slice(0, limit) : cycles;
  }

  // ============================================
  // CYCLE SETTINGS
  // ============================================

  updateSettings(userId: string, data: Partial<CycleSettings>): CycleSettings {
    let settings = this.store.getSettings(userId);
    if (!settings) {
      settings = {
        userId,
        averageCycleLength: 28,
        averagePeriodLength: 5,
        cycleGoal: 'track_only',
        lastUpdated: new Date().toISOString()
      };
    }

    const updated: CycleSettings = {
      ...settings,
      ...data,
      lastUpdated: new Date().toISOString()
    };

    this.store.setSettings(updated);
    return updated;
  }

  // ============================================
  // CYCLE PREDICTION
  // ============================================

  predictNextCycle(userId: string): CyclePrediction | null {
    const cycles = this.getCycles(userId, 6);
    if (cycles.length < 2) return null;

    // Calculate average cycle length
    const cycleLengths: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      const diff = differenceInDays(
        parseISO(cycles[i].startDate),
        parseISO(cycles[i + 1].startDate)
      );
      cycleLengths.push(diff);
    }

    const settings = this.store.getSettings(userId);
    const avgCycleLength = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : (settings?.averageCycleLength || 28);

    const lastCycle = cycles[0];
    const nextPeriodStart = addDays(parseISO(lastCycle.startDate), avgCycleLength);
    const avgPeriodLength = settings?.averagePeriodLength || 5;

    // Ovulation is typically 14 days before next period
    const ovulationDate = subDays(nextPeriodStart, 14);
    const fertileWindowStart = subDays(ovulationDate, 5);
    const fertileWindowEnd = addDays(ovulationDate, 1);

    // Confidence based on regularity
    const cycleVariance = Math.max(...cycleLengths) - Math.min(...cycleLengths);
    const confidence = Math.max(0, 100 - (cycleVariance * 5));

    return {
      nextPeriodStart: format(nextPeriodStart, 'yyyy-MM-dd'),
      nextPeriodEnd: format(addDays(nextPeriodStart, avgPeriodLength - 1), 'yyyy-MM-dd'),
      fertileWindowStart: format(fertileWindowStart, 'yyyy-MM-dd'),
      fertileWindowEnd: format(fertileWindowEnd, 'yyyy-MM-dd'),
      ovulationDate: format(ovulationDate, 'yyyy-MM-dd'),
      confidence,
      cycleLength: avgCycleLength
    };
  }

  // ============================================
  // CYCLE ANALYTICS
  // ============================================

  getCycleAnalytics(userId: string): CycleAnalytics | null {
    const cycles = this.getCycles(userId, 12);
    if (cycles.length < 2) return null;

    const profile = this.store.getProfile(userId);

    // Calculate averages
    const cycleLengths: number[] = [];
    const periodLengths: number[] = [];
    const symptomCounts: Record<string, number> = {};

    for (let i = 0; i < cycles.length - 1; i++) {
      const cycleLength = differenceInDays(
        parseISO(cycles[i].startDate),
        parseISO(cycles[i + 1].startDate)
      );
      cycleLengths.push(cycleLength);

      if (cycles[i].duration) {
        periodLengths.push(cycles[i].duration);
      }

      cycles[i].symptoms.forEach(s => {
        symptomCounts[s.name] = (symptomCounts[s.name] || 0) + 1;
      });
    }

    const avgCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const avgPeriodLength = periodLengths.length > 0
      ? periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
      : profile?.periodLength || 5;

    // Calculate regularity (lower variance = higher regularity)
    const variance = cycleLengths.reduce((sum, len) => sum + Math.pow(len - avgCycleLength, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);
    const cycleRegularity = Math.max(0, Math.min(100, 100 - (stdDev * 10)));

    // Most common symptoms
    const mostCommonSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, frequency]) => ({ symptom, frequency }));

    // Flow pattern
    const flowCounts = { light: 0, medium: 0, heavy: 0 };
    cycles.forEach(c => {
      if (c.flowIntensity) flowCounts[c.flowIntensity]++;
    });
    const flowPattern = Object.entries(flowCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Pain level (from symptoms)
    const painSymptoms = ['cramps', 'back pain', 'abdominal pain'];
    let painLevel = 0;
    let painCount = 0;
    cycles.forEach(c => {
      c.symptoms.forEach(s => {
        if (painSymptoms.includes(s.name.toLowerCase())) {
          const severityScore = { mild: 1, moderate: 5, severe: 10 }[s.severity || 'moderate'] || 5;
          painLevel += severityScore;
          painCount++;
        }
      });
    });
    const avgPain = painCount > 0 ? painLevel / painCount : 0;

    const prediction = this.predictNextCycle(userId);

    return {
      averageCycleLength: Math.round(avgCycleLength * 10) / 10,
      averagePeriodLength: Math.round(avgPeriodLength * 10) / 10,
      cycleRegularity: Math.round(cycleRegularity),
      mostCommonSymptoms,
      flowPattern,
      painLevel: Math.round(avgPain),
      nextPeriodConfidence: prediction?.confidence || 0
    };
  }

  // ============================================
  // FERTILITY
  // ============================================

  logFertility(userId: string, data: {
    date: string;
    cycleDay?: number;
    bbt?: number;
    cervicalMucus?: 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg_white';
    cervixPosition?: 'low' | 'medium' | 'high';
    ovulationTest?: 'negative' | 'positive' | 'invalid';
    lhSurge?: boolean;
    spotting?: boolean;
    notes?: string;
  }): FertilityRecord {
    const record: FertilityRecord = {
      id: uuidv4(),
      userId,
      date: data.date,
      cycleDay: data.cycleDay,
      bbt: data.bbt,
      cervicalMucus: data.cervicalMucus,
      cervixPosition: data.cervixPosition,
      ovulationTest: data.ovulationTest,
      lhSurge: data.lhSurge,
      spotting: data.spotting,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addFertilityRecord(record);
    return record;
  }

  getFertilityRecords(userId: string, startDate?: string, endDate?: string): FertilityRecord[] {
    let records = this.store.getFertilityRecords(userId);

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  updateFertilityStatus(userId: string, data: Partial<FertilityStatus>): FertilityStatus {
    let status = this.store.getFertilityStatus(userId);
    if (!status) {
      status = {
        userId,
        intention: 'neither',
        conceptionAttempts: 0,
        fertilityFactors: [],
        recommendations: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const updated: FertilityStatus = {
      ...status,
      ...data,
      lastUpdated: new Date().toISOString()
    };

    this.store.setFertilityStatus(updated);
    return updated;
  }

  // ============================================
  // PREGNANCY
  // ============================================

  startPregnancy(userId: string, data: {
    conceptionDate?: string;
    dueDate: string;
    notes?: string;
  }): Pregnancy {
    const pregnancy: Pregnancy = {
      id: uuidv4(),
      userId,
      conceptionDate: data.conceptionDate,
      dueDate: data.dueDate,
      status: 'confirmed',
      trimester: 1,
      outcomes: undefined,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.store.addPregnancy(pregnancy);

    // Update profile
    this.updateProfile(userId, {
      menstrualStatus: 'pregnant',
      pregnancyHistory: {
        ...this.getOrCreateProfile(userId).pregnancyHistory,
        pregnancies: this.getOrCreateProfile(userId).pregnancyHistory.pregnancies + 1
      }
    });

    return pregnancy;
  }

  getActivePregnancy(userId: string): Pregnancy | null {
    const pregnancies = this.store.getPregnancies(userId);
    return pregnancies.find(p =>
      p.status === 'confirmed' || p.status === 'planning'
    ) || null;
  }

  getPregnancyHistory(userId: string): Pregnancy[] {
    return this.store.getPregnancies(userId);
  }

  updatePregnancy(userId: string, pregnancyId: string, data: Partial<Pregnancy>): Pregnancy | null {
    const pregnancies = this.store.getPregnancies(userId);
    const index = pregnancies.findIndex(p => p.id === pregnancyId);

    if (index < 0) return null;

    const updated: Pregnancy = {
      ...pregnancies[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.store.updatePregnancy(updated);
    return updated;
  }

  // ============================================
  // PREGNANCY WEEK TRACKING
  // ============================================

  getPregnancyWeek(userId: string): PregnancyWeek | null {
    const pregnancy = this.getActivePregnancy(userId);
    if (!pregnancy) return null;

    const dueDate = parseISO(pregnancy.dueDate);
    const today = new Date();
    const weeksPregnant = Math.floor(differenceInDays(today, pregnancy.conceptionDate
      ? parseISO(pregnancy.conceptionDate)
      : subDays(dueDate, 280)) / 7);

    const weekStart = addDays(parseISO(pregnancy.conceptionDate || subDays(dueDate, 280).toISOString()), weeksPregnant * 7);
    const weekEnd = subDays(addDays(weekStart, 7), 1);

    // Baby size by week
    const babySizes: Record<number, { size: string; weight: string }> = {
      8: { size: 'Raspberry', weight: '1 gram' },
      12: { size: 'Plum', weight: '14 grams' },
      16: { size: 'Avocado', weight: '100 grams' },
      20: { size: 'Banana', weight: '300 grams' },
      24: { size: 'Cantaloupe', weight: '600 grams' },
      28: { size: 'Eggplant', weight: '1 kg' },
      32: { size: 'Coconut', weight: '1.7 kg' },
      36: { size: 'Romaine Lettuce', weight: '2.5 kg' },
      40: { size: 'Pumpkin', weight: '3.3 kg' }
    };

    const weekInfo = babySizes[weeksPregnant] || { size: 'Poppy Seed', weight: 'Negligible' };

    return {
      week: weeksPregnant,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
      trimester: Math.ceil(weeksPregnant / 13),
      babySize: weekInfo.size,
      babyWeight: weekInfo.weight,
      development: this.getWeekDevelopment(weeksPregnant),
      motherSymptoms: this.getWeekSymptoms(weeksPregnant),
      recommendations: this.getWeekRecommendations(weeksPregnant),
      weekNumber: `Week ${weeksPregnant}`
    };
  }

  private getWeekDevelopment(week: number): string[] {
    const developments: Record<number, string[]> = {
      4: ['Heart begins to beat', 'Neural tube forms'],
      8: ['All organs forming', 'Fingers and toes appear'],
      12: ['Organs fully formed', 'Can swallow'],
      16: ['Skeleton hardening', 'Facial features forming'],
      20: ['Halfway there!', 'Can hear sounds'],
      24: ['Lungs developing', 'Brain growing rapidly'],
      28: ['Eyes can open', 'Dreaming may begin'],
      32: ['Skin smoothing out', 'Ready for practice breaths'],
      36: ['Head engaged', 'Organs fully mature'],
      40: ['Full term', 'Ready for birth']
    };
    return developments[week] || ['Growing and developing'];
  }

  private getWeekSymptoms(week: number): string[] {
    const symptoms: Record<number, string[]> = {
      6: ['Nausea', 'Fatigue', 'Breast tenderness'],
      12: ['Less nausea', 'Increased energy', 'Visible bump'],
      20: ['Quickening (baby movements)', 'Heartburn', 'Leg cramps'],
      28: ['Braxton Hicks', 'Backache', 'Frequent urination'],
      36: ['Shortness of breath', 'Heartburn', 'Difficulty sleeping'],
      40: ['Lightning (baby drops)', 'Increased contractions', 'Nesting instinct']
    };
    return symptoms[week] || ['Pregnancy symptoms vary'];
  }

  private getWeekRecommendations(week: number): string[] {
    const recommendations: Record<number, string[]> = {
      8: ['Book first prenatal visit', 'Start prenatal vitamins'],
      12: ['Announce pregnancy', 'Consider first trimester screening'],
      20: ['Schedule anatomy scan', 'Start maternity clothes'],
      28: ['Schedule glucose test', 'Prepare hospital bag list'],
      36: ['Finalize birth plan', 'Install car seat'],
      40: ['Watch for labor signs', 'Rest and conserve energy']
    };
    return recommendations[week] || ['Continue prenatal care'];
  }

  // ============================================
  // PCOS
  // ============================================

  logPCOS(userId: string, data: {
    date: string;
    symptoms?: Array<{ name: string; severity: 'mild' | 'moderate' | 'severe' }>;
    weight?: number;
    bmi?: number;
    acneSeverity?: 'none' | 'mild' | 'moderate' | 'severe';
    hairLoss?: 'none' | 'mild' | 'moderate' | 'severe';
    notes?: string;
  }): PCOSRecord {
    const record: PCOSRecord = {
      id: uuidv4(),
      userId,
      date: data.date,
      symptoms: data.symptoms || [],
      weight: data.weight,
      bmi: data.bmi,
      hirsutismScore: undefined,
      acneSeverity: data.acneSeverity,
      hairLoss: data.hairLoss,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addPCOSRecord(record);

    // Update profile
    this.updateProfile(userId, { conditions: ['pcos'] });

    return record;
  }

  getPCOSRecords(userId: string): PCOSRecord[] {
    return this.store.getPCOSRecords(userId);
  }

  getPCOSManagementPlan(userId: string): PCOSManagementPlan {
    return {
      userId,
      diagnosisDate: new Date().toISOString(),
      treatmentGoals: [
        'Regulate menstrual cycles',
        'Manage weight',
        'Reduce androgen symptoms',
        'Prevent endometrial hyperplasia',
        'Support fertility if desired'
      ],
      lifestyleRecommendations: {
        nutrition: [
          'Balanced diet with low glycemic index',
          'Regular meal times',
          'Reduce processed foods',
          'Adequate protein intake',
          'Anti-inflammatory foods'
        ],
        exercise: [
          '150 minutes moderate exercise weekly',
          'Include strength training',
          'Consistency over intensity',
          'Low-impact exercises if needed'
        ],
        weightManagement: [
          '5-10% weight loss can restore cycles',
          'Set realistic goals',
          'Track progress',
          'Consider dietitian support'
        ]
      },
      medicationRecommendations: [
        'Birth control pills for cycle regulation',
        'Metformin for insulin resistance',
        'Anti-androgens for hirsutism',
        'Fertility medications if trying to conceive'
      ],
      monitoringSchedule: [
        'BMI monthly',
        'Blood pressure monthly',
        'Lipid panel every 6 months',
        'Glucose/insulin every 6 months',
        'Ultrasound annually'
      ],
      followUpFrequency: 'Every 3-6 months'
    };
  }

  // ============================================
  // MENOPAUSE
  // ============================================

  logMenopause(userId: string, data: {
    date: string;
    type: 'perimenopause' | 'menopause' | 'postmenopause';
    symptoms?: Array<{ name: string; severity: 'mild' | 'moderate' | 'severe'; frequency: 'rarely' | 'sometimes' | 'often' | 'always' }>;
    lastPeriodDate?: string;
    hormoneTherapy?: {
      type?: string;
      dosage?: string;
      startDate?: string;
    };
    notes?: string;
  }): MenopauseRecord {
    const record: MenopauseRecord = {
      id: uuidv4(),
      userId,
      date: data.date,
      type: data.type,
      symptoms: data.symptoms || [],
      lastPeriodDate: data.lastPeriodDate,
      hormoneTherapy: data.hormoneTherapy,
      notes: data.notes,
      createdAt: new Date().toISOString()
    };

    this.store.addMenopauseRecord(record);

    // Update profile
    this.updateProfile(userId, {
      menstrualStatus: data.type === 'postmenopause' ? 'menopause' : 'irregular'
    });

    return record;
  }

  getMenopauseRecords(userId: string): MenopauseRecord[] {
    return this.store.getMenopauseRecords(userId);
  }

  // ============================================
  // REMINDERS
  // ============================================

  createReminder(userId: string, data: {
    type: 'period' | 'ovulation' | 'contraception' | 'medication' | 'appointment' | 'custom';
    title: string;
    description?: string;
    time: string;
    days?: number[];
    leadTime?: number;
  }): Reminder {
    const reminder: Reminder = {
      id: uuidv4(),
      userId,
      type: data.type,
      title: data.title,
      description: data.description,
      time: data.time,
      days: data.days || [],
      enabled: true,
      leadTime: data.leadTime || 0,
      lastTriggered: undefined,
      createdAt: new Date().toISOString()
    };

    this.store.addReminder(reminder);
    return reminder;
  }

  getReminders(userId: string): Reminder[] {
    return this.store.getReminders(userId);
  }

  updateReminder(userId: string, reminderId: string, data: Partial<Reminder>): Reminder | null {
    const reminders = this.store.getReminders(userId);
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return null;

    const updated: Reminder = { ...reminder, ...data };
    this.store.updateReminder(updated);
    return updated;
  }

  deleteReminder(userId: string, reminderId: string): boolean {
    const before = this.store.getReminders(userId).length;
    this.store.deleteReminder(userId, reminderId);
    return this.store.getReminders(userId).length < before;
  }

  // ============================================
  // COMPREHENSIVE INSIGHTS
  // ============================================

  getHealthInsights(userId: string): HealthInsights {
    const profile = this.getOrCreateProfile(userId);
    const cycles = this.getCycles(userId);
    const prediction = this.predictNextCycle(userId);
    const analytics = this.getCycleAnalytics(userId);
    const pregnancy = this.getActivePregnancy(userId);

    // Cycle Health Score
    let cycleHealthScore = 75;
    const concerns: string[] = [];

    if (analytics) {
      if (analytics.cycleRegularity < 70) {
        concerns.push('Irregular cycles detected');
        cycleHealthScore -= 15;
      }
      if (analytics.painLevel > 7) {
        concerns.push('High pain levels reported');
        cycleHealthScore -= 10;
      }
      if (analytics.averagePeriodLength > 7) {
        concerns.push('Long periods may indicate concerns');
        cycleHealthScore -= 5;
      }
    }

    if (profile.conditions.includes('pcos')) {
      concerns.push('PCOS detected - may affect fertility');
      cycleHealthScore -= 10;
    }

    cycleHealthScore = Math.max(0, Math.min(100, cycleHealthScore));

    const cycleStatus = cycleHealthScore >= 80 ? 'excellent'
      : cycleHealthScore >= 60 ? 'good'
      : cycleHealthScore >= 40 ? 'fair' : 'needs_attention';

    // Current phase detection
    let currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
    if (prediction) {
      const today = new Date();
      const nextPeriod = parseISO(prediction.nextPeriodStart);
      const ovulation = parseISO(prediction.ovulationDate);

      const daysToNext = differenceInDays(nextPeriod, today);
      const daysToOvulation = differenceInDays(ovulation, today);

      if (daysToNext < 0 || daysToNext <= profile.periodLength) {
        currentPhase = 'menstrual';
      } else if (daysToOvulation >= -2 && daysToOvulation <= 2) {
        currentPhase = 'ovulation';
      } else if (daysToNext <= 14) {
        currentPhase = 'luteal';
      }
    }

    return {
      cycleHealth: {
        score: cycleHealthScore,
        status: cycleStatus,
        concerns,
        recommendations: this.getRecommendations(concerns, profile, pregnancy)
      },
      fertilityWindow: prediction ? {
        daysUntilNext: differenceInDays(parseISO(prediction.fertileWindowStart), new Date()),
        optimalDays: this.getOptimalDays(prediction)
      } : {
        daysUntilNext: 0,
        optimalDays: []
      },
      hormonalBalance: {
        score: cycleHealthScore,
        phase: currentPhase,
        recommendations: this.getPhaseRecommendations(currentPhase)
      }
    };
  }

  private getOptimalDays(prediction: CyclePrediction): number[] {
    const fertileStart = parseISO(prediction.fertileWindowStart);
    const fertileEnd = parseISO(prediction.fertileWindowEnd);
    const days: number[] = [];

    let current = fertileStart;
    while (current <= fertileEnd) {
      days.push(current.getDate());
      current = addDays(current, 1);
    }

    return days;
  }

  private getRecommendations(concerns: string[], profile: WomensHealthProfile, pregnancy: Pregnancy | null): string[] {
    const recommendations: string[] = [];

    if (pregnancy) {
      recommendations.push('Follow prenatal care schedule');
      recommendations.push('Take prenatal vitamins daily');
      return recommendations;
    }

    if (concerns.includes('Irregular cycles detected')) {
      recommendations.push('Consider consulting a gynecologist');
      recommendations.push('Track cycles consistently for 3 months');
    }

    if (concerns.includes('High pain levels reported')) {
      recommendations.push('Try heat therapy for cramps');
      recommendations.push('Consider pain management options');
    }

    if (profile.cycleGoal === 'try_conceive') {
      recommendations.push('Track ovulation signs');
      recommendations.push('Optimal conception window is 2-3 days before ovulation');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue maintaining healthy habits');
      recommendations.push('Regular exercise supports cycle health');
    }

    return recommendations;
  }

  private getPhaseRecommendations(phase: string): string[] {
    const phaseRecs: Record<string, string[]> = {
      menstrual: [
        'Rest and prioritize self-care',
        'Stay hydrated',
        'Light exercise if feeling well'
      ],
      follicular: [
        'Energy levels rising - great time for exercise',
        'Focus on nutrient-rich foods',
        'Hair and skin often look best during this phase'
      ],
      ovulation: [
        'Peak energy and confidence',
        'Great time for important meetings',
        'Stay hydrated and protect skin from sun'
      ],
      luteal: [
        'Practice self-care',
        'Reduce caffeine and salt if experiencing PMS',
        'Prepare for potential mood changes'
      ]
    };
    return phaseRecs[phase] || [];
  }
}

export const womensHealthService = new WomensHealthService();