import {
  Specialist,
  SpecialistAvailability,
  DataStore
} from '../models/secondOpinion.js';

export class SpecialistService {
  private store: DataStore;

  constructor() {
    this.store = DataStore.getInstance();
  }

  async listSpecialists(filters?: {
    specialty?: string;
    minRating?: number;
    maxFee?: number;
    language?: string;
    availableOnly?: boolean;
  }): Promise<Specialist[]> {
    const specialists: Specialist[] = [];

    this.store.specialists.forEach(spec => {
      if (filters) {
        if (filters.specialty) {
          const hasSpecialty = spec.specializations.some(
            s => s.toLowerCase().includes(filters.specialty!.toLowerCase())
          );
          if (!hasSpecialty) return;
        }
        if (filters.minRating && spec.rating < filters.minRating) return;
        if (filters.maxFee && spec.consultationFee > filters.maxFee) return;
        if (filters.language) {
          const hasLanguage = spec.languages.some(
            l => l.toLowerCase() === filters.language!.toLowerCase()
          );
          if (!hasLanguage) return;
        }
        if (filters.availableOnly && !spec.availableForNewCases) return;
      }
      specialists.push(spec);
    });

    return specialists.sort((a, b) => b.rating - a.rating);
  }

  async findSpecialists(query: string): Promise<Specialist[]> {
    const lowerQuery = query.toLowerCase();
    const specialists: Specialist[] = [];

    this.store.specialists.forEach(spec => {
      const matchesName = spec.name.toLowerCase().includes(lowerQuery);
      const matchesSpecialty = spec.specializations.some(s => s.toLowerCase().includes(lowerQuery));
      const matchesCredentials = spec.credentials.toLowerCase().includes(lowerQuery);

      if (matchesName || matchesSpecialty || matchesCredentials) {
        specialists.push(spec);
      }
    });

    return specialists.sort((a, b) => b.rating - a.rating);
  }

  async getSpecialist(specialistId: string): Promise<Specialist | null> {
    return this.store.specialists.get(specialistId) || null;
  }

  async getSpecialistAvailability(specialistId: string): Promise<SpecialistAvailability[] | null> {
    const specialist = this.store.specialists.get(specialistId);
    return specialist ? specialist.availability : null;
  }

  async getAvailableSlots(specialistId: string, dayOfWeek?: number): Promise<{
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    slotsAvailable: number;
  }[]> {
    const specialist = this.store.specialists.get(specialistId);
    if (!specialist) return [];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return specialist.availability
      .filter(slot => !dayOfWeek || slot.dayOfWeek === dayOfWeek)
      .filter(slot => slot.slotsAvailable > 0)
      .map(slot => ({
        dayOfWeek: slot.dayOfWeek,
        dayName: dayNames[slot.dayOfWeek],
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotsAvailable: slot.slotsAvailable
      }));
  }

  async matchSpecialist(specialty: string, preferences?: {
    language?: string;
    maxFee?: number;
    minRating?: number;
  }): Promise<Specialist[]> {
    const specialists = await this.listSpecialists({
      specialty,
      availableOnly: true,
      ...preferences
    });
    return specialists.slice(0, 5);
  }

  async getSpecialistStats(specialistId: string): Promise<{
    totalCases: number;
    completedCases: number;
    averageRating: number;
    averageResponseTime: string;
  } | null> {
    const specialist = this.store.specialists.get(specialistId);
    if (!specialist) return null;

    return {
      totalCases: specialist.caseCount,
      completedCases: Math.floor(specialist.caseCount * 0.95),
      averageRating: specialist.rating,
      averageResponseTime: '24-48 hours'
    };
  }

  async updateAvailability(
    specialistId: string,
    availability: SpecialistAvailability[]
  ): Promise<Specialist | null> {
    const specialist = this.store.specialists.get(specialistId);
    if (!specialist) return null;

    specialist.availability = availability;
    this.store.specialists.set(specialistId, specialist);
    return specialist;
  }

  async getSpecialistsBySpecialty(): Promise<Record<string, Specialist[]>> {
    const result: Record<string, Specialist[]> = {};

    this.store.specialists.forEach(spec => {
      spec.specializations.forEach(specialty => {
        if (!result[specialty]) {
          result[specialty] = [];
        }
        result[specialty].push(spec);
      });
    });

    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => b.rating - a.rating);
    });

    return result;
  }
}

export const specialistService = new SpecialistService();
