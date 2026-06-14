/**
 * MyRisa Universal Memory Service
 *
 * Human Intelligence OS - All 7 Domains
 * Following RTNM Doctrine: Identity → Memory → Knowledge → Twin → Agent → Intelligence
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Person, LifeEvent,
  MoodEntry, StressRecord, TherapySession, MentalWellnessGoal, MentalWellnessSummary,
  SexualHealthRecord, SexualActivity, LibidoRecord, FertilityRecord, Contraception,
  SleepRecord, NutritionRecord, ExerciseRecord, Habit, HabitRecord,
  WorkRecord, BurnoutAssessment, PTORecord, WorkLifeBalanceScore,
  FamilyMember, FamilyHealthRecord, CareTask, CareCircle,
  Relationship, InteractionRecord, RelationshipHealthScore,
  Consultation, HumanTwinState, DomainSummary, HumanMemorySummary,
  VitalRecord, PhysicalHealthRecord
} from '../types/index.js';

// ============================================
// IN-MEMORY STORAGE (Replace with PostgreSQL in production)
// ============================================

class MemoryStore {
  private data: Map<string, Map<string, any[]>> = new Map();

  private getCollection(domain: string, type: string): Map<string, any[]> {
    const key = `${domain}:${type}`;
    if (!this.data.has(key)) {
      this.data.set(key, new Map());
    }
    return this.data.get(key)!;
  }

  async save(domain: string, type: string, personId: string, record: any): Promise<any> {
    const collection = this.getCollection(domain, type);
    if (!collection.has(personId)) {
      collection.set(personId, []);
    }
    const records = collection.get(personId)!;

    // Check if record already exists (by id)
    const existingIndex = records.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    return record;
  }

  async get(domain: string, type: string, personId: string, filter?: (r: any) => boolean): Promise<any[]> {
    const collection = this.getCollection(domain, type);
    let records = collection.get(personId) || [];
    if (filter) {
      records = records.filter(filter);
    }
    return records;
  }

  async getOne(domain: string, type: string, personId: string, id: string): Promise<any | null> {
    const records = await this.get(domain, type, personId);
    return records.find(r => r.id === id) || null;
  }

  async delete(domain: string, type: string, personId: string, id: string): Promise<boolean> {
    const collection = this.getCollection(domain, type);
    const records = collection.get(personId) || [];
    const index = records.findIndex(r => r.id === id);
    if (index >= 0) {
      records.splice(index, 1);
      return true;
    }
    return false;
  }

  async query(domain: string, type: string, personId: string, options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any[]> {
    let records = await this.get(domain, type, personId);

    if (options.startDate) {
      records = records.filter(r => r.date >= options.startDate || r.createdAt >= options.startDate);
    }
    if (options.endDate) {
      records = records.filter(r => r.date <= options.endDate || r.createdAt <= options.endDate);
    }

    // Sort
    if (options.sortBy) {
      records.sort((a, b) => {
        const aVal = a[options.sortBy!] || a.createdAt;
        const bVal = b[options.sortBy!] || b.createdAt;
        return options.sortOrder === 'desc' ? (aVal > bVal ? -1 : 1) : (aVal < bVal ? -1 : 1);
      });
    }

    if (options.limit) {
      records = records.slice(0, options.limit);
    }

    return records;
  }
}

// ============================================
// UNIVERSAL MEMORY SERVICE
// ============================================

export class UniversalMemoryService {
  private store: MemoryStore = new MemoryStore();

  // ============================================
  // PERSON MANAGEMENT
  // ============================================

  async getOrCreatePerson(corpId: string): Promise<Person> {
    const persons = this.store.data.get('core:person') || new Map();
    const existing = Array.from(persons.values()).flat().find(p => p.corpId === corpId);

    if (existing) return existing;

    const person: Person = {
      id: uuidv4(),
      corpId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const collection = this.store.getCollection('core', 'person');
    if (!collection.has(corpId)) {
      collection.set(corpId, []);
    }
    collection.get(corpId)!.push(person);
    return person;
  }

  async getPerson(corpId: string): Promise<Person | null> {
    const persons = this.store.data.get('core:person') || new Map();
    return Array.from(persons.values()).flat().find(p => p.corpId === corpId) || null;
  }

  async updatePerson(corpId: string, data: Partial<Person>): Promise<Person | null> {
    const person = await this.getPerson(corpId);
    if (!person) return null;

    const updated = { ...person, ...data, updatedAt: new Date().toISOString() };
    const persons = this.store.data.get('core:person');
    const records = persons?.get(corpId) || [];
    const index = records.findIndex(p => p.id === person.id);
    if (index >= 0) {
      records[index] = updated;
    }
    return updated;
  }

  // ============================================
  // LIFE EVENTS (Cross-domain)
  // ============================================

  async recordLifeEvent(personId: string, event: Omit<LifeEvent, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<LifeEvent> {
    const record: LifeEvent = {
      id: uuidv4(),
      personId,
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('core', 'life_events', personId, record);
    return record;
  }

  async getLifeEvents(personId: string, options?: { startDate?: string; endDate?: string; type?: string }): Promise<LifeEvent[]> {
    return this.store.query('core', 'life_events', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      sortBy: 'eventDate',
      sortOrder: 'desc'
    });
  }

  // ============================================
  // DOMAIN 1: PHYSICAL HEALTH
  // ============================================

  async logVital(personId: string, vital: Omit<VitalRecord, 'personId'>): Promise<PhysicalHealthRecord> {
    const record: PhysicalHealthRecord = {
      id: uuidv4(),
      personId,
      type: 'vital',
      date: vital.date,
      data: vital as any,
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('physical', 'vitals', personId, record);
    return record;
  }

  async logMedicalRecord(personId: string, record: Omit<PhysicalHealthRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<PhysicalHealthRecord> {
    const fullRecord: PhysicalHealthRecord = {
      id: uuidv4(),
      personId,
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('physical', 'records', personId, fullRecord);
    return fullRecord;
  }

  async getVitals(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<PhysicalHealthRecord[]> {
    return this.store.query('physical', 'vitals', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async getMedicalRecords(personId: string, options?: { type?: string; limit?: number }): Promise<PhysicalHealthRecord[]> {
    return this.store.query('physical', 'records', personId, {
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  // ============================================
  // DOMAIN 2: MENTAL WELLNESS
  // ============================================

  async logMood(personId: string, mood: Omit<MoodEntry, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<MoodEntry> {
    const record: MoodEntry = {
      id: uuidv4(),
      personId,
      ...mood,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('mental', 'mood', personId, record);
    return record;
  }

  async getMoods(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<MoodEntry[]> {
    return this.store.query('mental', 'mood', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async logStress(personId: string, stress: Omit<StressRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<StressRecord> {
    const record: StressRecord = {
      id: uuidv4(),
      personId,
      ...stress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('mental', 'stress', personId, record);
    return record;
  }

  async getStressRecords(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<StressRecord[]> {
    return this.store.query('mental', 'stress', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async logTherapySession(personId: string, session: Omit<TherapySession, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<TherapySession> {
    const record: TherapySession = {
      id: uuidv4(),
      personId,
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('mental', 'therapy', personId, record);
    return record;
  }

  async getTherapySessions(personId: string): Promise<TherapySession[]> {
    return this.store.get('mental', 'therapy', personId);
  }

  async setMentalWellnessGoal(personId: string, goal: Omit<MentalWellnessGoal, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<MentalWellnessGoal> {
    const record: MentalWellnessGoal = {
      id: uuidv4(),
      personId,
      ...goal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('mental', 'goals', personId, record);
    return record;
  }

  async getMentalWellnessGoals(personId: string): Promise<MentalWellnessGoal[]> {
    return this.store.get('mental', 'goals', personId, g => g.status === 'active');
  }

  async getMentalWellnessSummary(personId: string): Promise<MentalWellnessSummary> {
    const moods = await this.getMoods(personId, { limit: 30 });
    const stressRecords = await this.getStressRecords(personId, { limit: 30 });
    const therapySessions = await this.getTherapySessions(personId);

    // Calculate averages
    const avgMood = moods.length > 0 ? moods.reduce((sum, m) => sum + m.intensity, 0) / moods.length : 5;
    const avgAnxiety = moods.length > 0 ? moods.reduce((sum, m) => sum + m.anxietyLevel, 0) / moods.length : 5;

    // Determine trends
    const recentMoods = moods.slice(0, 7);
    const olderMoods = moods.slice(7, 14);
    const recentAvg = recentMoods.length > 0 ? recentMoods.reduce((sum, m) => sum + m.intensity, 0) / recentMoods.length : 5;
    const olderAvg = olderMoods.length > 0 ? olderMoods.reduce((sum, m) => sum + m.intensity, 0) / olderMoods.length : 5;

    const moodTrend = recentAvg > olderAvg + 0.5 ? 'improving' : recentAvg < olderAvg - 0.5 ? 'worsening' : 'stable';

    // Calculate burnout risk
    const avgStress = stressRecords.length > 0 ? stressRecords.reduce((sum, s) => sum + s.stressLevel, 0) / stressRecords.length : 5;
    const burnoutRisk: 'low' | 'moderate' | 'high' = avgStress > 7 ? 'high' : avgStress > 5 ? 'moderate' : 'low';

    // Sleep quality
    const sleepQualityScores: Record<string, number> = { terrible: 1, poor: 2, okay: 3, good: 4, excellent: 5 };
    const avgSleepQuality = moods.length > 0
      ? moods.reduce((sum, m) => sum + (sleepQualityScores[m.sleepQuality] || 3), 0) / moods.length
      : 3;

    return {
      overallMood: Math.round(avgMood * 10) / 10,
      anxietyTrend: moodTrend,
      stressTrend: avgStress > 6 ? 'worsening' : avgStress < 4 ? 'improving' : 'stable',
      sleepQuality: Math.round(avgSleepQuality * 10) / 10,
      burnoutRisk,
      socialConnection: Math.round((moods.reduce((sum, m) => {
        const scores: Record<string, number> = { none: 1, few: 2, moderate: 5, many: 8 };
        return sum + (scores[m.socialInteractions] || 3);
      }, 0) / (moods.length || 1)) * 10) / 10,
      therapyEngagement: therapySessions.length === 0 ? 'none' : therapySessions.length < 4 ? 'occasional' : 'regular',
      recentInsights: this.generateMentalInsights(moods, stressRecords),
      recommendations: this.generateMentalRecommendations(burnoutRisk, avgMood, avgAnxiety)
    };
  }

  private generateMentalInsights(moods: MoodEntry[], stressRecords: StressRecord[]): string[] {
    const insights: string[] = [];

    if (moods.length >= 7) {
      const recent = moods.slice(0, 7);
      const negativeCount = recent.filter(m => ['very_sad', 'sad', 'anxious', 'stressed', 'angry', 'frustrated'].includes(m.primaryMood)).length;
      if (negativeCount > 4) {
        insights.push('Your mood has been predominantly negative this week. Consider talking to someone or engaging in relaxing activities.');
      }
    }

    if (stressRecords.length > 0) {
      const workStress = stressRecords.filter(s => s.sources.includes('work')).length;
      if (workStress > stressRecords.length / 2) {
        insights.push('Work appears to be a major source of stress. Consider setting boundaries or discussing workload with your manager.');
      }
    }

    return insights;
  }

  private generateMentalRecommendations(burnoutRisk: string, avgMood: number, avgAnxiety: number): string[] {
    const recommendations: string[] = [];

    if (burnoutRisk === 'high') {
      recommendations.push('Consider taking a break or vacation to recover.');
      recommendations.push('Prioritize sleep and reduce work hours if possible.');
    }

    if (avgMood < 4) {
      recommendations.push('Your mood has been low. Consider reaching out to friends, family, or a therapist.');
    }

    if (avgAnxiety > 6) {
      recommendations.push('Your anxiety levels are elevated. Try deep breathing exercises or meditation.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the good work! Continue maintaining healthy habits.');
    }

    return recommendations;
  }

  // ============================================
  // DOMAIN 3: SEXUAL WELLNESS
  // ============================================

  async logSexualActivity(personId: string, activity: Omit<SexualActivity, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<SexualActivity> {
    const record: SexualActivity = {
      id: uuidv4(),
      personId,
      ...activity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('sexual', 'activity', personId, record);
    return record;
  }

  async getSexualActivities(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<SexualActivity[]> {
    return this.store.query('sexual', 'activity', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async logLibido(personId: string, record: Omit<LibidoRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<LibidoRecord> {
    const fullRecord: LibidoRecord = {
      id: uuidv4(),
      personId,
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('sexual', 'libido', personId, fullRecord);
    return fullRecord;
  }

  async logFertility(personId: string, record: Omit<FertilityRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<FertilityRecord> {
    const fullRecord: FertilityRecord = {
      id: uuidv4(),
      personId,
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('sexual', 'fertility', personId, fullRecord);
    return fullRecord;
  }

  async setContraception(personId: string, contraception: Omit<Contraception, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Contraception> {
    const record: Contraception = {
      id: uuidv4(),
      personId,
      ...contraception,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('sexual', 'contraception', personId, record);
    return record;
  }

  async getContraception(personId: string): Promise<Contraception[]> {
    return this.store.get('sexual', 'contraception', personId, c => c.isActive);
  }

  // ============================================
  // DOMAIN 4: LIFESTYLE
  // ============================================

  async logSleep(personId: string, sleep: Omit<SleepRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<SleepRecord> {
    const record: SleepRecord = {
      id: uuidv4(),
      personId,
      ...sleep,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('lifestyle', 'sleep', personId, record);
    return record;
  }

  async getSleepRecords(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<SleepRecord[]> {
    return this.store.query('lifestyle', 'sleep', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async logNutrition(personId: string, nutrition: Omit<NutritionRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<NutritionRecord> {
    const record: NutritionRecord = {
      id: uuidv4(),
      personId,
      ...nutrition,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('lifestyle', 'nutrition', personId, record);
    return record;
  }

  async getNutritionRecords(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<NutritionRecord[]> {
    return this.store.query('lifestyle', 'nutrition', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async logExercise(personId: string, exercise: Omit<ExerciseRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<ExerciseRecord> {
    const record: ExerciseRecord = {
      id: uuidv4(),
      personId,
      ...exercise,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('lifestyle', 'exercise', personId, record);
    return record;
  }

  async getExerciseRecords(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<ExerciseRecord[]> {
    return this.store.query('lifestyle', 'exercise', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async createHabit(personId: string, habit: Omit<Habit, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Habit> {
    const record: Habit = {
      id: uuidv4(),
      personId,
      ...habit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('lifestyle', 'habits', personId, record);
    return record;
  }

  async getHabits(personId: string): Promise<Habit[]> {
    return this.store.get('lifestyle', 'habits', personId, h => h.isActive);
  }

  async logHabitCompletion(personId: string, habitId: string, date: string, completed: boolean, value?: number): Promise<HabitRecord> {
    const record: HabitRecord = {
      id: uuidv4(),
      personId,
      habitId,
      date,
      completed,
      value,
      createdAt: new Date().toISOString()
    };
    await this.store.save('lifestyle', 'habit_records', personId, record);

    // Update habit streak
    const habits = await this.getHabits(personId);
    const habit = habits.find(h => h.id === habitId);
    if (habit && completed) {
      habit.streak++;
      if (habit.streak > habit.bestStreak) {
        habit.bestStreak = habit.streak;
      }
    }

    return record;
  }

  // ============================================
  // DOMAIN 5: WORK-LIFE BALANCE
  // ============================================

  async logWorkRecord(personId: string, work: Omit<WorkRecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<WorkRecord> {
    const record: WorkRecord = {
      id: uuidv4(),
      personId,
      ...work,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('worklife', 'records', personId, record);
    return record;
  }

  async getWorkRecords(personId: string, options?: { startDate?: string; endDate?: string; limit?: number }): Promise<WorkRecord[]> {
    return this.store.query('worklife', 'records', personId, {
      startDate: options?.startDate,
      endDate: options?.endDate,
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async logPTO(personId: string, pto: Omit<PTORecord, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<PTORecord> {
    const record: PTORecord = {
      id: uuidv4(),
      personId,
      ...pto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('worklife', 'pto', personId, record);
    return record;
  }

  async getPTO(personId: string): Promise<PTORecord[]> {
    return this.store.get('worklife', 'pto', personId);
  }

  async getWorkLifeBalanceScore(personId: string): Promise<WorkLifeBalanceScore> {
    const workRecords = await this.getWorkRecords(personId, { limit: 30 });
    const ptoRecords = await this.getPTO(personId);

    // Calculate work hours score
    const avgWorkHours = workRecords.length > 0
      ? workRecords.reduce((sum, w) => sum + w.workHours, 0) / workRecords.length
      : 8;
    const workHoursScore = avgWorkHours <= 8 ? 10 : avgWorkHours <= 10 ? 7 : avgWorkHours <= 12 ? 4 : 2;

    // Calculate meeting load
    const avgMeetingHours = workRecords.length > 0
      ? workRecords.reduce((sum, w) => sum + (w.meetingHours || 0), 0) / workRecords.length
      : 2;
    const meetingScore = avgMeetingHours <= 2 ? 10 : avgMeetingHours <= 4 ? 7 : avgMeetingHours <= 6 ? 4 : 2;

    // Calculate energy score
    const avgEnergy = workRecords.length > 0
      ? workRecords.reduce((sum, w) => sum + (w.energyLevel || 5), 0) / workRecords.length
      : 5;
    const energyScore = avgEnergy * 2;

    // Calculate recovery (PTO usage)
    const thisYear = new Date().getFullYear();
    const ptoThisYear = ptoRecords.filter(p => new Date(p.startDate).getFullYear() === thisYear);
    const ptoDays = ptoThisYear.reduce((sum, p) => sum + p.totalDays, 0);
    const recoveryScore = ptoDays >= 15 ? 10 : ptoDays >= 10 ? 8 : ptoDays >= 5 ? 5 : 2;

    const overall = Math.round((workHoursScore + meetingScore + energyScore + recoveryScore) / 4);

    return {
      overall,
      workHours: workHoursScore,
      recoveryTime: recoveryScore,
      boundarySetting: energyScore > 6 ? 8 : 5,
      socialLife: 5, // Would be derived from relationship data
      personalTime: recoveryScore,
      trends: {
        workHoursTrend: avgWorkHours > 9 ? 'increasing' : avgWorkHours < 8 ? 'decreasing' : 'stable',
        recoveryTrend: ptoDays > 10 ? 'improving' : ptoDays < 5 ? 'worsening' : 'stable'
      },
      recommendations: this.generateWorkLifeRecommendations(avgWorkHours, avgMeetingHours, avgEnergy, ptoDays)
    };
  }

  private generateWorkLifeRecommendations(workHours: number, meetingHours: number, energy: number, ptoDays: number): string[] {
    const recommendations: string[] = [];

    if (workHours > 10) {
      recommendations.push('Your work hours are consistently high. Consider setting boundaries or discussing workload with your manager.');
    }

    if (meetingHours > 4) {
      recommendations.push('You have many meetings. Try blocking focus time for deep work.');
    }

    if (energy < 4) {
      recommendations.push('Your energy levels are low. Prioritize sleep, exercise, and recovery activities.');
    }

    if (ptoDays < 5) {
      recommendations.push('Consider taking more time off to recharge and prevent burnout.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Your work-life balance looks healthy. Keep maintaining these habits.');
    }

    return recommendations;
  }

  async assessBurnoutRisk(personId: string): Promise<BurnoutAssessment> {
    const workRecords = await this.getWorkRecords(personId, { limit: 30 });
    const mentalSummary = await this.getMentalWellnessSummary(personId);

    // Calculate exhaustion score
    const avgWorkHours = workRecords.length > 0
      ? workRecords.reduce((sum, w) => sum + w.workHours, 0) / workRecords.length
      : 8;
    const avgEnergy = workRecords.length > 0
      ? workRecords.reduce((sum, w) => sum + (w.energyLevel || 5), 0) / workRecords.length
      : 5;

    const exhaustionScore = Math.min(10, (avgWorkHours / 12) * 10 + (10 - avgEnergy) / 2);

    // Calculate cynicism score (based on stress and mood)
    const cynicismScore = Math.min(10, (10 - mentalSummary.overallMood) + mentalSummary.burnoutRisk === 'high' ? 3 : 0);

    // Calculate inefficacy score
    const avgProductivity = workRecords.length > 0
      ? workRecords.reduce((sum, w) => sum + (w.productivityScore || 5), 0) / workRecords.length
      : 5;
    const inefficacyScore = Math.min(10, 10 - avgProductivity);

    const overallRisk: 'low' | 'moderate' | 'high' | 'severe' =
      exhaustionScore + cynicismScore + inefficacyScore > 22 ? 'severe' :
      exhaustionScore + cynicismScore + inefficacyScore > 16 ? 'high' :
      exhaustionScore + cynicismScore + inefficacyScore > 10 ? 'moderate' : 'low';

    return {
      overallRisk,
      exhaustionScore: Math.round(exhaustionScore * 10) / 10,
      cynicismScore: Math.round(cynicismScore * 10) / 10,
      inefficacyScore: Math.round(inefficacyScore * 10) / 10,
      contributingFactors: [
        avgWorkHours > 10 ? 'High work hours' : '',
        mentalSummary.burnoutRisk === 'high' ? 'Elevated stress levels' : '',
        mentalSummary.overallMood < 4 ? 'Low mood' : ''
      ].filter(Boolean),
      protectiveFactors: [
        mentalSummary.therapyEngagement !== 'none' ? 'Engaged in therapy' : '',
        avgEnergy > 6 ? 'Good energy levels' : ''
      ].filter(Boolean),
      recommendations: this.generateBurnoutRecommendations(overallRisk, exhaustionScore),
      nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  private generateBurnoutRecommendations(risk: string, exhaustion: number): string[] {
    const recommendations: string[] = [];

    if (risk === 'severe' || risk === 'high') {
      recommendations.push('Consider taking a break from work to recover.');
      recommendations.push('Talk to your manager about workload reduction.');
      recommendations.push('Prioritize sleep and self-care activities.');
    }

    if (exhaustion > 7) {
      recommendations.push('Your exhaustion levels are high. Focus on recovery and avoid taking on new commitments.');
    }

    recommendations.push('Maintain regular exercise and sleep schedule.');
    recommendations.push('Stay connected with friends and family.');

    return recommendations;
  }

  // ============================================
  // DOMAIN 6: FAMILY
  // ============================================

  async addFamilyMember(personId: string, member: Omit<FamilyMember, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<FamilyMember> {
    const record: FamilyMember = {
      id: uuidv4(),
      personId,
      ...member,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('family', 'members', personId, record);
    return record;
  }

  async getFamilyMembers(personId: string): Promise<FamilyMember[]> {
    return this.store.get('family', 'members', personId);
  }

  async logFamilyHealthRecord(personId: string, familyMemberId: string, record: Omit<FamilyHealthRecord, 'id' | 'personId' | 'familyMemberId' | 'createdAt' | 'updatedAt'>): Promise<FamilyHealthRecord> {
    const fullRecord: FamilyHealthRecord = {
      id: uuidv4(),
      personId,
      familyMemberId,
      ...record,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('family', 'health_records', personId, fullRecord);
    return fullRecord;
  }

  async createCareTask(personId: string, task: Omit<CareTask, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<CareTask> {
    const record: CareTask = {
      id: uuidv4(),
      personId,
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('family', 'care_tasks', personId, record);
    return record;
  }

  async getCareTasks(personId: string, options?: { status?: string; familyMemberId?: string }): Promise<CareTask[]> {
    const tasks = await this.store.get('family', 'care_tasks', personId);
    return tasks.filter(t => {
      if (options?.status && t.status !== options.status) return false;
      if (options?.familyMemberId && t.familyMemberId !== options.familyMemberId) return false;
      return true;
    });
  }

  async addToCareCircle(personId: string, member: Omit<CareCircle, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<CareCircle> {
    const record: CareCircle = {
      id: uuidv4(),
      personId,
      ...member,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('family', 'care_circle', personId, record);
    return record;
  }

  async getCareCircle(personId: string): Promise<CareCircle[]> {
    return this.store.get('family', 'care_circle', personId, c => c.isActive);
  }

  // ============================================
  // DOMAIN 7: RELATIONSHIPS
  // ============================================

  async addRelationship(personId: string, relationship: Omit<Relationship, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Relationship> {
    const record: Relationship = {
      id: uuidv4(),
      personId,
      ...relationship,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('relationships', 'list', personId, record);
    return record;
  }

  async getRelationships(personId: string): Promise<Relationship[]> {
    return this.store.get('relationships', 'list', personId, r => r.status === 'active');
  }

  async logInteraction(relationshipId: string, interaction: Omit<InteractionRecord, 'id' | 'relationshipId' | 'createdAt'>): Promise<InteractionRecord> {
    const record: InteractionRecord = {
      id: uuidv4(),
      relationshipId,
      ...interaction,
      createdAt: new Date().toISOString()
    };
    // Store by person ID (would need to look up person from relationship)
    await this.store.save('relationships', 'interactions', relationshipId, record);
    return record;
  }

  async getRelationshipHealthScore(personId: string): Promise<RelationshipHealthScore> {
    const relationships = await this.getRelationships(personId);
    const primaryRelationship = relationships.find(r => r.type === 'partner' || r.type === 'spouse');

    if (!primaryRelationship) {
      return {
        overall: 7,
        communication: 5,
        qualityTime: 5,
        conflictResolution: 5,
        emotionalSupport: 5,
        intimacy: 5,
        sharedActivities: 5,
        trends: {
          communicationTrend: 'stable',
          qualityTrend: 'stable'
        },
        insights: ['No primary relationship on record. Focus on building social connections.'],
        recommendations: ['Consider reaching out to friends or family more often.', 'Join social groups or communities to expand your social network.']
      };
    }

    return {
      overall: primaryRelationship.quality || 7,
      communication: primaryRelationship.quality || 7,
      qualityTime: 7,
      conflictResolution: 7,
      emotionalSupport: 7,
      intimacy: 7,
      sharedActivities: 6,
      trends: {
        communicationTrend: 'stable',
        qualityTrend: 'stable'
      },
      insights: [`Your relationship with ${primaryRelationship.partnerName || 'your partner'} is on record.`],
      recommendations: ['Continue investing time and effort in your relationship.', 'Schedule regular quality time together.']
    };
  }

  // ============================================
  // CONSULTATIONS
  // ============================================

  async scheduleConsultation(personId: string, consultation: Omit<Consultation, 'id' | 'personId' | 'createdAt' | 'updatedAt'>): Promise<Consultation> {
    const record: Consultation = {
      id: uuidv4(),
      personId,
      ...consultation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.store.save('consultations', 'list', personId, record);
    return record;
  }

  async getConsultations(personId: string, options?: { status?: string; limit?: number }): Promise<Consultation[]> {
    return this.store.query('consultations', 'list', personId, {
      limit: options?.limit,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  }

  async updateConsultation(personId: string, consultationId: string, data: Partial<Consultation>): Promise<Consultation | null> {
    const consultation = await this.store.getOne('consultations', 'list', personId, consultationId);
    if (!consultation) return null;

    const updated = { ...consultation, ...data, updatedAt: new Date().toISOString() };
    await this.store.save('consultations', 'list', personId, updated);
    return updated;
  }

  async generatePreVisitSummary(personId: string, consultationId: string): Promise<string> {
    const consultation = await this.store.getOne('consultations', 'list', personId, consultationId);
    if (!consultation) return '';

    // Gather relevant information
    const [mentalSummary, physicalRecords] = await Promise.all([
      this.getMentalWellnessSummary(personId),
      this.getMedicalRecords(personId, { limit: 5 })
    ]);

    let summary = `Pre-visit Summary for ${consultation.providerName}\n`;
    summary += `Date: ${consultation.date}\n`;
    summary += `Reason for visit: ${consultation.reason}\n\n`;

    summary += `Recent Mental Wellness:\n`;
    summary += `- Overall mood: ${mentalSummary.overallMood}/10\n`;
    summary += `- Stress trend: ${mentalSummary.stressTrend}\n`;
    summary += `- Burnout risk: ${mentalSummary.burnoutRisk}\n\n`;

    if (mentalSummary.recentInsights.length > 0) {
      summary += `Key insights:\n`;
      mentalSummary.recentInsights.forEach(insight => {
        summary += `- ${insight}\n`;
      });
    }

    return summary;
  }

  // ============================================
  // HUMAN TWIN
  // ============================================

  async getHumanTwin(personId: string): Promise<HumanTwinState> {
    const [
      mentalSummary,
      workLifeScore,
      relationshipScore,
      familyMembers,
      careTasks
    ] = await Promise.all([
      this.getMentalWellnessSummary(personId),
      this.getWorkLifeBalanceScore(personId),
      this.getRelationshipHealthScore(personId),
      this.getFamilyMembers(personId),
      this.getCareTasks(personId, { status: 'pending' })
    ]);

    return {
      personId,
      lastUpdated: new Date().toISOString(),
      domains: {
        physical: {
          healthScore: 75, // Would be calculated from physical health data
          conditions: [],
          medications: [],
          allergies: [],
          lastCheckup: undefined,
          riskFactors: [],
          recommendations: []
        },
        mental: {
          wellnessScore: Math.round(mentalSummary.overallMood * 10),
          moodTrend: mentalSummary.anxietyTrend,
          stressLevel: mentalSummary.stressTrend === 'worsening' ? 7 : mentalSummary.stressTrend === 'improving' ? 4 : 5,
          burnoutRisk: mentalSummary.burnoutRisk,
          therapyStatus: mentalSummary.therapyEngagement === 'none' ? 'considering' : mentalSummary.therapyEngagement === 'occasional' ? 'searching' : 'engaged',
          recommendations: mentalSummary.recommendations
        },
        sexual: {
          sexualWellnessScore: 75,
          fertilityStatus: 'unknown',
          contraception: [],
          sexualHealthConcerns: [],
          recommendations: []
        },
        lifestyle: {
          lifestyleScore: Math.round((workLifeScore.overall + mentalSummary.sleepQuality * 2) / 2),
          sleepQuality: mentalSummary.sleepQuality > 3 ? 'good' : mentalSummary.sleepQuality > 2 ? 'okay' : 'poor',
          nutritionQuality: 'okay',
          exerciseFrequency: 'occasional',
          habitAdherence: 50,
          recommendations: []
        },
        worklife: {
          workLifeBalanceScore: workLifeScore.overall,
          burnoutRisk: workLifeScore.overall < 40 ? 'high' : workLifeScore.overall < 60 ? 'moderate' : 'low',
          workHoursTrend: workLifeScore.trends.workHoursTrend,
          recoveryScore: workLifeScore.recoveryTime,
          recommendations: workLifeScore.recommendations
        },
        family: {
          familyHealthScore: 75,
          dependentsCount: familyMembers.filter(m => ['child', 'elder'].includes(m.healthContext)).length,
          caregiversAssigned: [],
          upcomingCareTasks: careTasks.length,
          recommendations: []
        },
        relationships: {
          relationshipScore: relationshipScore.overall,
          primaryRelationshipStatus: 'none',
          socialConnectionScore: relationshipScore.socialConnection,
          lonelyDays: 0,
          recommendations: relationshipScore.recommendations
        }
      },
      overallScore: Math.round(
        (mentalSummary.overallMood * 10 +
         workLifeScore.overall +
         relationshipScore.overall +
         mentalSummary.sleepQuality * 2) / 4
      ),
      insights: [
        ...mentalSummary.recentInsights,
        ...workLifeScore.recommendations.slice(0, 2),
        ...relationshipScore.recommendations.slice(0, 2)
      ],
      predictions: [],
      lifeEvents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // ============================================
  // HUMAN MEMORY SUMMARY
  // ============================================

  async getHumanMemorySummary(personId: string): Promise<HumanMemorySummary> {
    const twin = await this.getHumanTwin(personId);
    const lifeEvents = await this.getLifeEvents(personId, { limit: 10 });

    const domains: DomainSummary[] = [
      { domain: 'physical', score: twin.domains.physical.healthScore, trend: 'stable', highlights: [], concerns: [], recommendations: twin.domains.physical.recommendations },
      { domain: 'mental', score: twin.domains.mental.wellnessScore, trend: twin.domains.mental.moodTrend, highlights: [], concerns: [], recommendations: twin.domains.mental.recommendations },
      { domain: 'sexual', score: twin.domains.sexual.sexualWellnessScore, trend: 'stable', highlights: [], concerns: [], recommendations: twin.domains.sexual.recommendations },
      { domain: 'lifestyle', score: twin.domains.lifestyle.lifestyleScore, trend: 'stable', highlights: [], concerns: [], recommendations: twin.domains.lifestyle.recommendations },
      { domain: 'worklife', score: twin.domains.worklife.workLifeBalanceScore, trend: twin.domains.worklife.workHoursTrend === 'increasing' ? 'worsening' : twin.domains.worklife.workHoursTrend === 'decreasing' ? 'improving' : 'stable', highlights: [], concerns: [], recommendations: twin.domains.worklife.recommendations },
      { domain: 'family', score: twin.domains.family.familyHealthScore, trend: 'stable', highlights: [], concerns: [], recommendations: twin.domains.family.recommendations },
      { domain: 'relationships', score: twin.domains.relationships.relationshipScore, trend: 'stable', highlights: [], concerns: [], recommendations: twin.domains.relationships.recommendations }
    ];

    return {
      personId,
      overallScore: twin.overallScore,
      domains,
      recentInsights: twin.insights,
      upcomingReminders: twin.domains.family.upcomingCareTasks > 0
        ? [`You have ${twin.domains.family.upcomingCareTasks} upcoming care tasks`]
        : [],
      lifeEvents,
      lastUpdated: twin.lastUpdated
    };
  }
}

export const universalMemoryService = new UniversalMemoryService();