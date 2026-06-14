import { z } from 'zod';

// Types
export interface WorkoutRecommendation {
  workoutId: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'recovery';
  duration: number; // minutes
  intensity: 'low' | 'medium' | 'high';
  muscleGroups: string[];
  caloriesBurn: number;
  description: string;
  aiRationale: string;
}

export interface ClassSuggestion {
  classId: string;
  name: string;
  instructor: string;
  schedule: string;
  matchScore: number;
  reason: string;
}

export interface TrainerMatch {
  trainerId: string;
  name: string;
  specializations: string[];
  rating: number;
  availability: string[];
  matchReason: string;
}

// Member profile schema for recommendations
const MemberProfileSchema = z.object({
  memberId: z.string(),
  fitnessGoals: z.array(z.string()),
  preferredWorkoutTypes: z.array(z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'recovery'])),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  availableDays: z.array(z.number().min(0).max(6)),
  preferredTimeSlots: z.array(z.enum(['morning', 'afternoon', 'evening'])),
  workoutHistory: z.array(z.object({
    type: z.string(),
    frequency: z.number(),
    lastPerformed: z.string()
  })).optional(),
  injuries: z.array(z.string()).optional(),
  classHistory: z.array(z.object({
    classId: z.string(),
    attendedCount: z.number()
  })).optional()
});

export type MemberProfile = z.infer<typeof MemberProfileSchema>;

export class FitnessRecommendationsService {
  private workoutDatabase: WorkoutRecommendation[];

  constructor() {
    this.workoutDatabase = this.initializeWorkoutDatabase();
  }

  private initializeWorkoutDatabase(): WorkoutRecommendation[] {
    return [
      {
        workoutId: 'wr-001',
        name: 'Full Body Strength Circuit',
        type: 'strength',
        duration: 45,
        intensity: 'high',
        muscleGroups: ['chest', 'back', 'legs', 'core'],
        caloriesBurn: 350,
        description: 'A comprehensive strength workout targeting all major muscle groups',
        aiRationale: 'Balanced strength training based on your fitness goals'
      },
      {
        workoutId: 'wr-002',
        name: 'Morning Cardio Blast',
        type: 'cardio',
        duration: 30,
        intensity: 'medium',
        muscleGroups: ['full body'],
        caloriesBurn: 280,
        description: 'Wake up with an energizing cardio session',
        aiRationale: 'Cardio recommendation for heart health and calorie burn'
      },
      {
        workoutId: 'wr-003',
        name: 'Power Yoga Flow',
        type: 'flexibility',
        duration: 60,
        intensity: 'low',
        muscleGroups: ['full body'],
        caloriesBurn: 180,
        description: 'Dynamic yoga sequence improving flexibility and mindfulness',
        aiRationale: 'Flexibility work to complement your strength training'
      },
      {
        workoutId: 'wr-004',
        name: 'HIIT Inferno',
        type: 'hiit',
        duration: 25,
        intensity: 'high',
        muscleGroups: ['full body'],
        caloriesBurn: 400,
        description: 'High-intensity interval training for maximum calorie burn',
        aiRationale: 'Efficient fat-burning workout based on your fitness level'
      },
      {
        workoutId: 'wr-005',
        name: 'Active Recovery Session',
        type: 'recovery',
        duration: 40,
        intensity: 'low',
        muscleGroups: ['full body'],
        caloriesBurn: 120,
        description: 'Light movement and stretching for muscle recovery',
        aiRationale: 'Recovery recommendation to prevent overtraining'
      },
      {
        workoutId: 'wr-006',
        name: 'Upper Body Power',
        type: 'strength',
        duration: 40,
        intensity: 'high',
        muscleGroups: ['chest', 'back', 'shoulders', 'arms'],
        caloriesBurn: 320,
        description: 'Focused upper body strength training',
        aiRationale: 'Upper body emphasis based on your workout history'
      },
      {
        workoutId: 'wr-007',
        name: 'Lower Body Blast',
        type: 'strength',
        duration: 45,
        intensity: 'high',
        muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
        caloriesBurn: 380,
        description: 'Comprehensive lower body strength workout',
        aiRationale: 'Lower body focus for balanced development'
      },
      {
        workoutId: 'wr-008',
        name: 'Spin & Burn',
        type: 'cardio',
        duration: 45,
        intensity: 'high',
        muscleGroups: ['legs', 'core'],
        caloriesBurn: 450,
        description: 'Intense cycling session for endurance and leg strength',
        aiRationale: 'High-intensity cardio based on your preference for morning sessions'
      }
    ];
  }

  async getWorkoutRecommendations(profile: MemberProfile, limit: number = 5): Promise<WorkoutRecommendation[]> {
    try {
      const validatedProfile = MemberProfileSchema.parse(profile);

      const scoredWorkouts = this.workoutDatabase.map(workout => {
        let score = 0;
        const reasons: string[] = [];

        // Match fitness level with intensity
        if (validatedProfile.fitnessLevel === 'advanced' && workout.intensity === 'high') {
          score += 30;
          reasons.push('Matches your advanced fitness level');
        } else if (validatedProfile.fitnessLevel === 'intermediate' && workout.intensity === 'medium') {
          score += 30;
          reasons.push('Appropriate intensity for your level');
        } else if (validatedProfile.fitnessLevel === 'beginner' && workout.intensity !== 'high') {
          score += 30;
          reasons.push('Beginner-friendly workout');
        }

        // Match preferred workout types
        if (validatedProfile.preferredWorkoutTypes.includes(workout.type)) {
          score += 25;
          reasons.push(`Matches your preference for ${workout.type} workouts`);
        }

        // Match fitness goals
        validatedProfile.fitnessGoals.forEach(goal => {
          if (goal.toLowerCase().includes('strength') && workout.type === 'strength') score += 10;
          if (goal.toLowerCase().includes('cardio') || goal.toLowerCase().includes('endurance')) {
            if (workout.type === 'cardio' || workout.type === 'hiit') score += 10;
          }
          if (goal.toLowerCase().includes('flexibility') || goal.toLowerCase().includes('stretch')) {
            if (workout.type === 'flexibility') score += 10;
          }
        });

        // Account for injuries
        if (validatedProfile.injuries) {
          validatedProfile.injuries.forEach(injury => {
            if (!workout.muscleGroups.some(mg => mg.toLowerCase().includes(injury.toLowerCase()))) {
              score += 5;
            }
          });
        }

        return { ...workout, score, aiRationale: reasons.join('. ') || workout.aiRationale };
      });

      return scoredWorkouts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error}`);
    }
  }

  async getClassSuggestions(profile: MemberProfile, availableClasses: unknown[]): Promise<ClassSuggestion[]> {
    try {
      const validatedProfile = MemberProfileSchema.parse(profile);

      const scoredClasses = availableClasses.map(cls => {
        let score = 0;
        const reasons: string[] = [];

        // Match class type with preferences
        if (validatedProfile.preferredWorkoutTypes.includes(cls.type)) {
          score += 40;
          reasons.push(`Matches your ${cls.type} preference`);
        }

        // Match instructor specializations with goals
        if (cls.instructorSpecializations) {
          validatedProfile.fitnessGoals.forEach(goal => {
            cls.instructorSpecializations.forEach((spec: string) => {
              if (goal.toLowerCase().includes(spec.toLowerCase())) {
                score += 15;
              }
            });
          });
        }

        // Check scheduling compatibility
        const classDay = new Date(cls.schedule).getDay();
        if (validatedProfile.availableDays.includes(classDay)) {
          score += 25;
          reasons.push('Fits your schedule');
        }

        // Match time slot preference
        const classHour = new Date(cls.schedule).getHours();
        const timeSlot = classHour < 12 ? 'morning' : classHour < 17 ? 'afternoon' : 'evening';
        if (validatedProfile.preferredTimeSlots.includes(timeSlot)) {
          score += 20;
          reasons.push(`Preferred ${timeSlot} time`);
        }

        return {
          classId: cls.classId,
          name: cls.name,
          instructor: cls.instructor,
          schedule: cls.schedule,
          matchScore: Math.min(score, 100),
          reason: reasons.join('. ') || 'Good match for your profile'
        };
      });

      return scoredClasses.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      throw new Error(`Failed to generate class suggestions: ${error}`);
    }
  }

  async getTrainerMatches(profile: MemberProfile, trainers: unknown[]): Promise<TrainerMatch[]> {
    try {
      const validatedProfile = MemberProfileSchema.parse(profile);

      const scoredTrainers = trainers.map(trainer => {
        let score = 0;
        const matchReasons: string[] = [];

        // Match specializations with fitness goals
        trainer.specializations.forEach((spec: string) => {
          validatedProfile.fitnessGoals.forEach(goal => {
            if (goal.toLowerCase().includes(spec.toLowerCase())) {
              score += 25;
              matchReasons.push(`Specializes in ${spec} (your goal)`);
            }
          });
        });

        // Match preferred workout types
        validatedProfile.preferredWorkoutTypes.forEach(type => {
          if (trainer.specializations.includes(type)) {
            score += 20;
            matchReasons.push(`Expert in ${type}`);
          }
        });

        // Account for injuries
        if (validatedProfile.injuries && trainer.certifications) {
          validatedProfile.injuries.forEach(injury => {
            if (trainer.certifications.includes(`injury rehabilitation`)) {
              score += 15;
              matchReasons.push('Certified in injury rehabilitation');
            }
          });
        }

        return {
          trainerId: trainer.trainerId,
          name: trainer.name,
          specializations: trainer.specializations,
          rating: trainer.rating || 0,
          availability: trainer.availability || [],
          matchReason: matchReasons.slice(0, 3).join('. ') || 'General fitness match'
        };
      });

      return scoredTrainers
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
    } catch (error) {
      throw new Error(`Failed to match trainers: ${error}`);
    }
  }
}

export const fitnessRecommendationsService = new FitnessRecommendationsService();
