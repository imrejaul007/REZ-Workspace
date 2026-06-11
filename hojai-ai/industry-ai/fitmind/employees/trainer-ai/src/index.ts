/**
 * Trainer AI - Workout Plans & Form Tips Agent
 * Part of FITMIND - Fitness AI Operating System
 */

import { v4 as uuidv4 } from 'uuid';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  restSeconds: number;
  equipment: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  formTips: string[];
  commonMistakes: string[];
  videoUrl?: string;
}

export interface WorkoutDay {
  day: number;
  focus: string;
  exercises: WorkoutExercise[];
  warmup: string[];
  cooldown: string[];
  duration: number;
  intensity: 'low' | 'medium' | 'high';
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  rest: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  memberId: string;
  memberName: string;
  trainer: string;
  title: string;
  focus: string[];
  duration: number;
  daysPerWeek: number;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  days: WorkoutDay[];
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'paused' | 'completed';
}

export interface WorkoutRequest {
  memberId: string;
  memberName: string;
  goals: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  equipment: string[];
  injuries?: string[];
  preferences?: string[];
}

export class TrainerAI {
  private exerciseLibrary: Exercise[] = [];
  private workoutPlans: Map<string, WorkoutPlan> = new Map();

  constructor() {
    this.initializeExerciseLibrary();
  }

  private initializeExerciseLibrary(): void {
    this.exerciseLibrary = [
      // Chest
      {
        id: 'bench-press',
        name: 'Bench Press',
        muscleGroup: 'chest',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        equipment: 'Barbell',
        difficulty: 'intermediate',
        formTips: ['Keep feet flat on floor', 'Retract shoulder blades', 'Lower bar to mid-chest', 'Keep wrists straight'],
        commonMistakes: ['Bouncing bar off chest', 'Flaring elbows too wide', 'Arching back excessively', 'Lifting hips']
      },
      {
        id: 'push-ups',
        name: 'Push-Ups',
        muscleGroup: 'chest',
        sets: 3,
        reps: 15,
        restSeconds: 60,
        equipment: 'None',
        difficulty: 'beginner',
        formTips: ['Keep body in straight line', 'Hands shoulder-width apart', 'Lower chest to floor', 'Push through palms'],
        commonMistakes: ['Sagging hips', 'Flaring elbows', 'Incomplete range of motion', 'Looking up']
      },
      {
        id: 'chest-fly',
        name: 'Chest Fly',
        muscleGroup: 'chest',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        equipment: 'Dumbbells',
        difficulty: 'intermediate',
        formTips: ['Slight bend in elbows', 'Lower until stretch felt', 'Squeeze chest to return', 'Control the movement'],
        commonMistakes: ['Straight arms', 'Going too heavy', 'Bouncing at bottom', 'Jerky movements']
      },
      // Back
      {
        id: 'deadlift',
        name: 'Deadlift',
        muscleGroup: 'back',
        sets: 4,
        reps: 8,
        restSeconds: 120,
        equipment: 'Barbell',
        difficulty: 'advanced',
        formTips: ['Bar close to shins', 'Hinge at hips first', 'Keep chest up', 'Drive through heels'],
        commonMistakes: ['Rounding lower back', 'Bar drifting forward', 'Hyperextending at top', 'Locking knees early']
      },
      {
        id: 'lat-pulldown',
        name: 'Lat Pulldown',
        muscleGroup: 'back',
        sets: 3,
        reps: 12,
        restSeconds: 90,
        equipment: 'Cable Machine',
        difficulty: 'beginner',
        formTips: ['Grip slightly wider than shoulders', 'Pull to upper chest', 'Squeeze shoulder blades', 'Control the negative'],
        commonMistakes: ['Pulling behind neck', 'Using momentum', 'Leaning back too far', 'Incomplete range']
      },
      {
        id: 'bent-over-row',
        name: 'Bent Over Row',
        muscleGroup: 'back',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        equipment: 'Barbell',
        difficulty: 'intermediate',
        formTips: ['Hinge forward at hips', 'Keep back neutral', 'Pull to lower chest', 'Squeeze lats at top'],
        commonMistakes: ['Rounding back', 'Standing too upright', 'Using momentum', 'Jerking weight']
      },
      // Legs
      {
        id: 'squat',
        name: 'Barbell Squat',
        muscleGroup: 'legs',
        sets: 4,
        reps: 10,
        restSeconds: 120,
        equipment: 'Barbell',
        difficulty: 'intermediate',
        formTips: ['Feet shoulder-width', 'Knees track over toes', 'Break at hips and knees', 'Chest up throughout'],
        commonMistakes: ['Knees caving inward', 'Rising on toes', 'Not hitting depth', 'Rounding back']
      },
      {
        id: 'leg-press',
        name: 'Leg Press',
        muscleGroup: 'legs',
        sets: 3,
        reps: 12,
        restSeconds: 90,
        equipment: 'Leg Press Machine',
        difficulty: 'beginner',
        formTips: ['Feet hip-width apart', 'Lower until 90 degrees', 'Keep lower back pressed', 'Push through heels'],
        commonMistakes: ['Locking knees at top', 'Lifting hips off pad', 'Knees caving', 'Going too deep']
      },
      {
        id: 'lunges',
        name: 'Walking Lunges',
        muscleGroup: 'legs',
        sets: 3,
        reps: 20,
        restSeconds: 60,
        equipment: 'None',
        difficulty: 'intermediate',
        formTips: ['Step forward with control', 'Lower until back knee nearly touches', 'Keep front knee over ankle', 'Alternate legs'],
        commonMistakes: ['Taking too long steps', 'Knee past toe', 'Leaning forward', 'Rushing']
      },
      {
        id: 'calf-raise',
        name: 'Calf Raises',
        muscleGroup: 'legs',
        sets: 4,
        reps: 15,
        restSeconds: 45,
        equipment: 'Machine',
        difficulty: 'beginner',
        formTips: ['Rise onto balls of feet', 'Squeeze at top', 'Lower slowly', 'Keep legs straight'],
        commonMistakes: ['Bouncing', 'Incomplete range', 'Using momentum', 'Bent knees']
      },
      // Shoulders
      {
        id: 'overhead-press',
        name: 'Overhead Press',
        muscleGroup: 'shoulders',
        sets: 4,
        reps: 10,
        restSeconds: 90,
        equipment: 'Barbell',
        difficulty: 'intermediate',
        formTips: ['Bar at collarbone', 'Press straight up', 'Lock out at top', 'Lower with control'],
        commonMistakes: ['Back arching', 'Pressing forward', 'Incomplete lockout', 'Going too heavy']
      },
      {
        id: 'lateral-raise',
        name: 'Lateral Raises',
        muscleGroup: 'shoulders',
        sets: 3,
        reps: 15,
        restSeconds: 45,
        equipment: 'Dumbbells',
        difficulty: 'beginner',
        formTips: ['Slight bend in elbows', 'Raise to shoulder height', 'Lead with elbows', 'Control the descent'],
        commonMistakes: ['Swinging weight', 'Raising too high', 'Shrugging shoulders', 'Using momentum']
      },
      // Arms
      {
        id: 'bicep-curl',
        name: 'Bicep Curls',
        muscleGroup: 'arms',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        equipment: 'Dumbbells',
        difficulty: 'beginner',
        formTips: ['Keep elbows at sides', 'Squeeze at top', 'Lower slowly', 'Wrist neutral'],
        commonMistakes: ['Swinging body', 'Moving elbows', 'Half reps', 'Going too heavy']
      },
      {
        id: 'tricep-dips',
        name: 'Tricep Dips',
        muscleGroup: 'arms',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        equipment: 'Parallel Bars',
        difficulty: 'intermediate',
        formTips: ['Keep elbows tucked back', 'Lower until 90 degrees', 'Push through palms', 'Keep body upright'],
        commonMistakes: ['Flaring elbows', 'Going too deep', 'Shoulders too high', 'Bouncing']
      },
      // Core
      {
        id: 'plank',
        name: 'Plank Hold',
        muscleGroup: 'core',
        sets: 3,
        reps: 60,
        restSeconds: 45,
        equipment: 'None',
        difficulty: 'beginner',
        formTips: ['Body in straight line', 'Engage core', 'Don't let hips sag', 'Breathe steadily'],
        commonMistakes: ['Sagging hips', 'Raising hips too high', 'Holding breath', 'Looking up']
      },
      {
        id: 'russian-twist',
        name: 'Russian Twists',
        muscleGroup: 'core',
        sets: 3,
        reps: 20,
        restSeconds: 45,
        equipment: 'None',
        difficulty: 'beginner',
        formTips: ['Lean back slightly', 'Rotate from core', 'Touch floor each side', 'Keep feet elevated'],
        commonMistakes: ['Moving only arms', 'Rounding back', 'Going too fast', 'Feet on floor']
      },
      // HIIT
      {
        id: 'burpees',
        name: 'Burpees',
        muscleGroup: 'full-body',
        sets: 3,
        reps: 15,
        restSeconds: 60,
        equipment: 'None',
        difficulty: 'intermediate',
        formTips: ['Squat and place hands', 'Jump feet back to plank', 'Jump feet forward', 'Jump with arms overhead'],
        commonMistakes: ['Skipping the push-up', 'Feet not jumping together', 'Not fully extending', 'Holding breath']
      },
      {
        id: 'mountain-climbers',
        name: 'Mountain Climbers',
        muscleGroup: 'full-body',
        sets: 3,
        reps: 30,
        restSeconds: 30,
        equipment: 'None',
        difficulty: 'beginner',
        formTips: ['Hands under shoulders', 'Drive knee to chest', 'Keep hips level', 'Maintain fast pace'],
        commonMistakes: ['Hips too high', 'Slow pace', 'Not driving knee fully', 'Lower back sagging']
      },
      {
        id: 'jump-squats',
        name: 'Jump Squats',
        muscleGroup: 'legs',
        sets: 4,
        reps: 12,
        restSeconds: 45,
        equipment: 'None',
        difficulty: 'intermediate',
        formTips: ['Squat to 90 degrees', 'Explode upward', 'Land softly', 'Keep core tight'],
        commonMistakes: ['Landing hard', 'Knees caving', 'Not squatting deep', 'Not fully extending']
      },
      {
        id: 'battle-ropes',
        name: 'Battle Ropes',
        muscleGroup: 'full-body',
        sets: 4,
        reps: 30,
        restSeconds: 45,
        equipment: 'Battle Ropes',
        difficulty: 'intermediate',
        formTips: ['Anchor point at sides', 'Alternate arms fast', 'Keep arms straight', 'Engage core'],
        commonMistakes: ['Using arms only', 'Standing too upright', 'Ropes hitting ground', 'Inconsistent rhythm']
      }
    ];
  }

  /**
   * Generate a personalized workout plan
   */
  async createWorkoutPlan(request: WorkoutRequest): Promise<WorkoutPlan> {
    const days = this.generateWorkoutDays(request);

    const plan: WorkoutPlan = {
      id: uuidv4(),
      memberId: request.memberId,
      memberName: request.memberName,
      trainer: 'Trainer AI',
      title: this.generatePlanTitle(request.goals),
      focus: request.goals,
      duration: 8,
      daysPerWeek: request.daysPerWeek,
      fitnessLevel: request.fitnessLevel,
      days,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    this.workoutPlans.set(plan.id, plan);
    return plan;
  }

  private generatePlanTitle(goals: string[]): string {
    const goalLabels: Record<string, string> = {
      'weight-loss': 'Fat Burn & Tone',
      'muscle-gain': 'Muscle Builder Pro',
      'strength': 'Strength Foundation',
      'toning': 'Body Toning',
      'flexibility': 'Flex & Flow',
      'endurance': 'Endurance Builder',
      'general-fitness': 'Total Fitness'
    };

    const goalsStr = goals.map(g => goalLabels[g] || g).join(' + ');
    return `${goalsStr} Program`;
  }

  private generateWorkoutDays(request: WorkoutRequest): WorkoutDay[] {
    const { daysPerWeek, fitnessLevel, goals, equipment } = request;
    const days: WorkoutDay[] = [];

    const splitTypes = this.getSplitType(daysPerWeek);
    const intensityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'beginner': 'low',
      'intermediate': 'medium',
      'advanced': 'high'
    };

    splitTypes.forEach((focus, index) => {
      days.push({
        day: index + 1,
        focus,
        exercises: this.getExercisesForFocus(focus, fitnessLevel, equipment, goals),
        warmup: this.getWarmup(focus),
        cooldown: this.getCooldown(),
        duration: this.getDuration(focus, fitnessLevel),
        intensity: intensityMap[fitnessLevel]
      });
    });

    return days;
  }

  private getSplitType(daysPerWeek: number): string[] {
    switch (daysPerWeek) {
      case 3:
        return ['Full Body', 'Full Body', 'Full Body'];
      case 4:
        return ['Upper Body', 'Lower Body', 'Upper Body', 'Lower Body'];
      case 5:
        return ['Push', 'Pull', 'Legs', 'Push', 'Core'];
      case 6:
        return ['Chest/Triceps', 'Back/Biceps', 'Legs', 'Shoulders', 'Legs', 'Full Body'];
      default:
        return ['Full Body'];
    }
  }

  private getExercisesForFocus(
    focus: string,
    level: string,
    availableEquipment: string[],
    goals: string[]
  ): WorkoutExercise[] {
    const isHiit = goals.includes('weight-loss') || goals.includes('endurance');
    const availableExercises = this.exerciseLibrary.filter(e => {
      if (e.difficulty === 'advanced' && level !== 'advanced') return false;
      if (availableEquipment.length > 0 && !availableEquipment.includes(e.equipment) && e.equipment !== 'None') {
        return false;
      }
      return true;
    });

    let exercises: Exercise[] = [];

    if (isHiit) {
      exercises = availableExercises.filter(e =>
        ['full-body', 'legs'].includes(e.muscleGroup) && e.difficulty !== 'advanced'
      ).slice(0, 5);
    } else {
      switch (focus.toLowerCase()) {
        case 'push':
          exercises = availableExercises.filter(e => ['chest', 'shoulders', 'arms'].includes(e.muscleGroup)).slice(0, 5);
          break;
        case 'pull':
          exercises = availableExercises.filter(e => ['back', 'arms'].includes(e.muscleGroup)).slice(0, 5);
          break;
        case 'chest/triceps':
        case 'chest':
          exercises = availableExercises.filter(e => ['chest', 'arms'].includes(e.muscleGroup) && e.muscleGroup !== 'arms' || e.muscleGroup === 'chest').slice(0, 4);
          break;
        case 'back/biceps':
        case 'back':
          exercises = availableExercises.filter(e => ['back', 'arms'].includes(e.muscleGroup) && e.muscleGroup !== 'arms' || e.muscleGroup === 'back').slice(0, 4);
          break;
        case 'legs':
          exercises = availableExercises.filter(e => e.muscleGroup === 'legs').slice(0, 4);
          break;
        case 'shoulders':
          exercises = availableExercises.filter(e => e.muscleGroup === 'shoulders').slice(0, 3);
          exercises.push(availableExercises.find(e => e.name === 'Lateral Raises')!);
          break;
        case 'core':
          exercises = availableExercises.filter(e => e.muscleGroup === 'core').slice(0, 3);
          break;
        default:
          exercises = availableExercises.slice(0, 5);
      }
    }

    return exercises.map(e => ({
      exerciseId: e.id,
      exercise: e,
      sets: level === 'beginner' ? e.sets - 1 : e.sets,
      reps: level === 'advanced' ? `${e.reps}-12` : `${e.reps}`,
      rest: e.restSeconds,
      notes: this.getExerciseNote(e, level)
    }));
  }

  private getExerciseNote(exercise: Exercise, level: string): string {
    if (level === 'beginner') {
      return `Focus on form over weight. If ${exercise.name} is too challenging, try the regressed version.`;
    }
    if (level === 'advanced') {
      return `Add progressive overload. Try drop sets or pause reps for added challenge.`;
    }
    return `Maintain controlled tempo - 2 seconds up, 2 seconds down.`;
  }

  private getWarmup(focus: string): string[] {
    return [
      '5 min light cardio (jumping jacks, high knees)',
      'Dynamic stretches for target muscles',
      `Specific warm-up sets for ${focus} exercises`
    ];
  }

  private getCooldown(): string[] {
    return [
      'Static stretching (hold 30 sec each)',
      'Foam rolling (if available)',
      'Deep breathing exercises'
    ];
  }

  private getDuration(focus: string, level: string): number {
    const baseDuration: Record<string, number> = {
      'Full Body': 60,
      'Upper Body': 50,
      'Lower Body': 55,
      'Push': 45,
      'Pull': 45,
      'Legs': 50,
      'Shoulders': 40,
      'Core': 30,
      'Chest/Triceps': 45,
      'Back/Biceps': 45
    };

    let duration = baseDuration[focus] || 45;
    if (level === 'advanced') duration += 15;
    if (level === 'beginner') duration -= 10;

    return duration;
  }

  /**
   * Get exercise demonstration details
   */
  async getExerciseDemo(exerciseName: string): Promise<Exercise | null> {
    return this.exerciseLibrary.find(e =>
      e.name.toLowerCase().includes(exerciseName.toLowerCase())
    ) || null;
  }

  /**
   * Generate form tips for an exercise
   */
  async getFormTips(exerciseName: string): Promise<{ tips: string[]; mistakes: string[]; videoSuggestion?: string }> {
    const exercise = this.exerciseLibrary.find(e =>
      e.name.toLowerCase().includes(exerciseName.toLowerCase())
    );

    if (!exercise) {
      return {
        tips: ['Keep proper posture', 'Control the movement', 'Breathe correctly'],
        mistakes: ['Using momentum', 'Incomplete range of motion', 'Poor form']
      };
    }

    return {
      tips: exercise.formTips,
      mistakes: exercise.commonMistakes,
      videoSuggestion: exercise.videoUrl
    };
  }

  /**
   * Get progress tracking data
   */
  async getProgress(memberId: string): Promise<{
    plans: WorkoutPlan[];
    totalWorkouts: number;
    consistencyScore: number;
    strengthGains: string[];
  }> {
    const memberPlans = Array.from(this.workoutPlans.values())
      .filter(p => p.memberId === memberId);

    const totalWorkouts = memberPlans.reduce((sum, plan) =>
      sum + plan.days.length * 3, 0
    );

    const consistencyScore = Math.min(100, totalWorkouts * 2);

    return {
      plans: memberPlans,
      totalWorkouts,
      consistencyScore,
      strengthGains: ['Bench Press +10kg', 'Squat +15kg', 'Deadlift +20kg']
    };
  }

  /**
   * Modify an existing plan
   */
  async modifyPlan(planId: string, modifications: Partial<WorkoutRequest>): Promise<WorkoutPlan | null> {
    const plan = this.workoutPlans.get(planId);
    if (!plan) return null;

    const updatedPlan: WorkoutPlan = {
      ...plan,
      ...(modifications.goals && { focus: modifications.goals }),
      ...(modifications.fitnessLevel && { fitnessLevel: modifications.fitnessLevel }),
      ...(modifications.daysPerWeek && { daysPerWeek: modifications.daysPerWeek }),
      days: modifications.fitnessLevel || modifications.goals
        ? this.generateWorkoutDays({
            memberId: plan.memberId,
            memberName: plan.memberName,
            goals: modifications.goals || plan.focus,
            fitnessLevel: modifications.fitnessLevel || plan.fitnessLevel,
            daysPerWeek: modifications.daysPerWeek || plan.daysPerWeek,
            equipment: []
          })
        : plan.days,
      updatedAt: new Date().toISOString()
    };

    this.workoutPlans.set(planId, updatedPlan);
    return updatedPlan;
  }
}

export default TrainerAI;
