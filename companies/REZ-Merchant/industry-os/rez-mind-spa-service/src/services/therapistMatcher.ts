import {
  Therapist,
  TherapistMatch,
  Treatment,
  CustomerPreferences,
  TreatmentCategory,
} from '../types';
import { TREATMENTS_DATABASE, TIME_OF_DAY_PREFERENCES } from '../config/knowledge';
import { logger } from '../utils/logger';

// Sample therapist database (in production, this would come from a database)
const THERAPIST_DATABASE: Therapist[] = [
  {
    therapistId: 'th_jane_doe',
    name: 'Jane Doe',
    specialties: ['massage', 'swedish', 'hot-stone', 'aromatherapy'],
    certifications: ['LMT', 'Certified Aromatherapist', 'Hot Stone Certified'],
    experience: 8,
    rating: 4.9,
    availability: [
      { dayOfWeek: 1, startHour: 9, endHour: 17 },
      { dayOfWeek: 2, startHour: 9, endHour: 17 },
      { dayOfWeek: 3, startHour: 9, endHour: 17 },
      { dayOfWeek: 4, startHour: 9, endHour: 17 },
      { dayOfWeek: 5, startHour: 9, endHour: 15 },
    ],
    customerRatings: [],
    languages: ['English', 'Spanish'],
    gender: 'female',
  },
  {
    therapistId: 'th_john_smith',
    name: 'John Smith',
    specialties: ['massage', 'deep-tissue', 'thai', 'bali'],
    certifications: ['LMT', 'Thai Massage Certified', 'Sports Massage'],
    experience: 12,
    rating: 4.8,
    availability: [
      { dayOfWeek: 1, startHour: 10, endHour: 18 },
      { dayOfWeek: 2, startHour: 10, endHour: 18 },
      { dayOfWeek: 3, startHour: 10, endHour: 18 },
      { dayOfWeek: 4, startHour: 10, endHour: 18 },
      { dayOfWeek: 5, startHour: 10, endHour: 18 },
      { dayOfWeek: 6, startHour: 10, endHour: 16 },
    ],
    customerRatings: [],
    languages: ['English'],
    gender: 'male',
  },
  {
    therapistId: 'th_sarah_johnson',
    name: 'Sarah Johnson',
    specialties: ['facial', 'body-treatment', 'aromatherapy'],
    certifications: ['Esthetician', 'Advanced Facial Certified', 'Body Treatment Specialist'],
    experience: 6,
    rating: 4.7,
    availability: [
      { dayOfWeek: 1, startHour: 8, endHour: 16 },
      { dayOfWeek: 2, startHour: 8, endHour: 16 },
      { dayOfWeek: 3, startHour: 8, endHour: 16 },
      { dayOfWeek: 4, startHour: 8, endHour: 16 },
      { dayOfWeek: 5, startHour: 8, endHour: 14 },
    ],
    customerRatings: [],
    languages: ['English', 'French'],
    gender: 'female',
  },
  {
    therapistId: 'th_michael_chen',
    name: 'Michael Chen',
    specialties: ['reflexology', 'acupressure', 'massage'],
    certifications: ['Reflexologist', 'Acupressure Certified', 'LMT'],
    experience: 10,
    rating: 4.6,
    availability: [
      { dayOfWeek: 2, startHour: 9, endHour: 17 },
      { dayOfWeek: 3, startHour: 9, endHour: 17 },
      { dayOfWeek: 4, startHour: 9, endHour: 17 },
      { dayOfWeek: 5, startHour: 9, endHour: 17 },
      { dayOfWeek: 6, startHour: 9, endHour: 17 },
    ],
    customerRatings: [],
    languages: ['English', 'Mandarin'],
    gender: 'male',
  },
  {
    therapistId: 'th_emily_brown',
    name: 'Emily Brown',
    specialties: ['hydrotherapy', 'body-treatment', 'facial'],
    certifications: ['Hydrotherapist', 'Body Treatment Specialist', 'Esthetician'],
    experience: 5,
    rating: 4.8,
    availability: [
      { dayOfWeek: 1, startHour: 11, endHour: 19 },
      { dayOfWeek: 2, startHour: 11, endHour: 19 },
      { dayOfWeek: 4, startHour: 11, endHour: 19 },
      { dayOfWeek: 5, startHour: 11, endHour: 19 },
      { dayOfWeek: 6, startHour: 10, endHour: 18 },
    ],
    customerRatings: [],
    languages: ['English'],
    gender: 'female',
  },
  {
    therapistId: 'th_raj_patel',
    name: 'Raj Patel',
    specialties: ['ayurvedic', 'massage', 'aromatherapy'],
    certifications: ['Ayurvedic Practitioner', 'LMT', 'Certified Aromatherapist'],
    experience: 15,
    rating: 4.9,
    availability: [
      { dayOfWeek: 1, startHour: 10, endHour: 18 },
      { dayOfWeek: 2, startHour: 10, endHour: 18 },
      { dayOfWeek: 3, startHour: 10, endHour: 18 },
      { dayOfWeek: 5, startHour: 10, endHour: 18 },
      { dayOfWeek: 6, startHour: 9, endHour: 15 },
    ],
    customerRatings: [],
    languages: ['English', 'Hindi', 'Gujarati'],
    gender: 'male',
  },
];

export class TherapistMatcher {
  /**
   * Match customers to therapists based on treatment and preferences
   */
  static async matchTherapists(
    treatmentId: string,
    customerPreferences: CustomerPreferences,
    limit: number = 3
  ): Promise<TherapistMatch[]> {
    logger.debug('Matching therapists', { treatmentId, preferences: customerPreferences });

    const treatment = TREATMENTS_DATABASE.find((t) => t.treatmentId === treatmentId);
    if (!treatment) {
      logger.warn('Treatment not found for therapist matching', { treatmentId });
      return [];
    }

    const matches: TherapistMatch[] = [];

    for (const therapist of THERAPIST_DATABASE) {
      let matchScore = 50; // Base score
      const matchReasons: string[] = [];

      // Specialty match
      if (therapist.specialties.includes(treatment.category)) {
        matchScore += 30;
        matchReasons.push(`Specializes in ${treatment.category} treatments`);
      } else if (this.isRelatedSpecialty(therapist.specialties, treatment.category)) {
        matchScore += 15;
        matchReasons.push('Has related experience');
      }

      // Rating contribution
      matchScore += therapist.rating * 5; // 0-5 rating -> 0-25 points

      // Experience contribution
      if (therapist.experience >= 10) {
        matchScore += 15;
        matchReasons.push(`${therapist.experience} years of experience`);
      } else if (therapist.experience >= 5) {
        matchScore += 8;
        matchReasons.push(`${therapist.experience} years of experience`);
      }

      // Gender preference match
      if (customerPreferences.preferredTherapistGender) {
        if (customerPreferences.preferredTherapistGender === 'no-preference') {
          // No penalty
        } else if (therapist.gender === customerPreferences.preferredTherapistGender) {
          matchScore += 10;
          matchReasons.push(`Matches ${customerPreferences.preferredTherapistGender} therapist preference`);
        } else {
          matchScore -= 20;
          matchReasons.push('Gender preference not matched');
        }
      }

      // Language match
      // In production, would check customer preferred language
      // For now, assume English is default

      // Time preference match
      if (customerPreferences.preferredTime) {
        const availableForTime = this.checkTimePreference(therapist, customerPreferences.preferredTime);
        if (availableForTime) {
          matchScore += 5;
          matchReasons.push(`Available for ${customerPreferences.preferredTime} appointments`);
        }
      }

      // Calculate availability score (simplified)
      const availabilityScore = this.calculateAvailabilityScore(therapist);

      // Customer satisfaction prediction (based on rating and match)
      const customerSatisfactionPrediction = Math.min(
        5,
        (matchScore / 100) * 4.5 + therapist.rating * 0.5
      );

      matches.push({
        therapist,
        matchScore: Math.min(100, Math.max(0, matchScore)),
        matchReasons,
        availabilityScore,
        customerSatisfactionPrediction: Math.round(customerSatisfactionPrediction * 10) / 10,
      });
    }

    // Sort by match score and return top matches
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Match therapists for multiple treatments (combo)
   */
  static matchTherapistsForCombo(
    treatmentIds: string[],
    customerPreferences: CustomerPreferences,
    limit: number = 3
  ): TherapistMatch[] {
    logger.debug('Matching therapists for combo', { treatmentIds });

    // Find therapists who can handle all or most treatments
    const matches: TherapistMatch[] = [];

    for (const therapist of THERAPIST_DATABASE) {
      let matchScore = 50;
      const matchReasons: string[] = [];
      let coveredTreatments = 0;

      for (const treatmentId of treatmentIds) {
        const treatment = TREATMENTS_DATABASE.find((t) => t.treatmentId === treatmentId);
        if (!treatment) continue;

        if (therapist.specialties.includes(treatment.category)) {
          coveredTreatments++;
        } else if (this.isRelatedSpecialty(therapist.specialties, treatment.category)) {
          coveredTreatments += 0.5;
        }
      }

      // Calculate coverage percentage
      const coverage = coveredTreatments / treatmentIds.length;
      matchScore += coverage * 30;
      matchReasons.push(`Can perform ${Math.round(coverage * 100)}% of treatments`);

      // Add base qualifications
      matchScore += therapist.rating * 5;
      matchScore += Math.min(15, therapist.experience);

      // Time preference
      if (customerPreferences.preferredTime) {
        const available = this.checkTimePreference(therapist, customerPreferences.preferredTime);
        if (available) matchScore += 5;
      }

      const availabilityScore = this.calculateAvailabilityScore(therapist);

      matches.push({
        therapist,
        matchScore: Math.min(100, matchScore),
        matchReasons,
        availabilityScore,
        customerSatisfactionPrediction: Math.round(((matchScore / 100) * 4.5 + therapist.rating * 0.5) * 10) / 10,
      });
    }

    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Check if specialty is related to category
   */
  private static isRelatedSpecialty(
    specialties: string[],
    category: string
  ): boolean {
    const relatedMap: Record<string, string[]> = {
      massage: ['swedish', 'deep-tissue', 'hot-stone', 'aromatherapy', 'thai', 'bali', 'ayurvedic'],
      facial: ['body-treatment', 'aromatherapy'],
      'body-treatment': ['facial', 'hydrotherapy'],
      swedish: ['massage', 'aromatherapy'],
      'deep-tissue': ['massage', 'swedish'],
      'hot-stone': ['massage', 'swedish'],
      aromatherapy: ['massage', 'facial'],
      reflexology: ['massage'],
      hydrotherapy: ['body-treatment'],
    };

    const related = relatedMap[category] || [];
    return specialties.some((s) => related.includes(s));
  }

  /**
   * Check if therapist is available for preferred time
   */
  private static checkTimePreference(
    therapist: Therapist,
    preferredTime: string
  ): boolean {
    const timeHours: Record<string, { start: number; end: number }> = {
      morning: { start: 8, end: 12 },
      afternoon: { start: 12, end: 17 },
      evening: { start: 17, end: 20 },
      any: { start: 0, end: 24 },
    };

    const preferred = timeHours[preferredTime] || timeHours.any;

    return therapist.availability.some(
      (slot) =>
        slot.startHour <= preferred.end && slot.endHour >= preferred.start
    );
  }

  /**
   * Calculate availability score (0-100)
   */
  private static calculateAvailabilityScore(therapist: Therapist): number {
    // Base on number of available days
    const availableDays = therapist.availability.length;
    const dayScore = Math.min(40, availableDays * 10);

    // Base on average hours per day
    const avgHours =
      therapist.availability.reduce(
        (sum, slot) => sum + (slot.endHour - slot.startHour),
        0
      ) / Math.max(1, therapist.availability.length);
    const hourScore = Math.min(30, avgHours * 5);

    // Base on weekend availability
    const weekendSlots = therapist.availability.filter(
      (slot) => slot.dayOfWeek === 6 || slot.dayOfWeek === 0
    );
    const weekendScore = weekendSlots.length > 0 ? 20 : 10;

    return Math.round(dayScore + hourScore + weekendScore);
  }

  /**
   * Get therapists by specialty
   */
  static getTherapistsBySpecialty(specialty: TreatmentCategory): Therapist[] {
    return THERAPIST_DATABASE.filter((t) =>
      t.specialties.includes(specialty)
    );
  }

  /**
   * Get all therapists
   */
  static getAllTherapists(): Therapist[] {
    return THERAPIST_DATABASE;
  }

  /**
   * Get therapist by ID
   */
  static getTherapistById(therapistId: string): Therapist | undefined {
    return THERAPIST_DATABASE.find((t) => t.therapistId === therapistId);
  }
}

export default TherapistMatcher;