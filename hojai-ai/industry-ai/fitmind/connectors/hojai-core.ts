/**
 * HOJAI Core Connector
 * Connects FITMIND to HOJAI Core AI infrastructure
 * Fitness AI Recommendations and Personalization
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, unknown>;
}

export interface FitnessContext {
  memberId?: string;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[];
  injuries?: string[];
  availableEquipment?: string[];
}

export interface WorkoutRecommendation {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    duration?: number;
    restSeconds: number;
    targetMuscles: string[];
    alternatives?: string[];
  }>;
  warmup: string[];
  cooldown: string[];
  estimatedDuration: number;
  caloriesBurn: number;
  difficulty: string;
}

export interface NutritionRecommendation {
  meals: Array<{
    name: string;
    time: string;
    calories: number;
    macros: { protein: number; carbs: number; fat: number };
    foods: string[];
  }>;
  totalCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  hydration: number;
}

export interface ProgressAnalysis {
  weeklyWorkouts: number;
  consistencyScore: number;
  strengthProgress: { exercise: string; change: string }[];
  cardioProgress: { metric: string; change: string }[];
  streakDays: number;
  recommendations: string[];
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze member intent from text
   */
  async analyzeIntent(
    text: string,
    context?: FitnessContext
  ): Promise<IntentResult> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/intent/analyze`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text, context })
        }
      );

      if (!response.ok) {
        return { intent: 'unknown', confidence: 0, entities: {} };
      }

      return await response.json();
    } catch {
      return { intent: 'unknown', confidence: 0, entities: {} };
    }
  }

  /**
   * Generate personalized workout recommendation
   */
  async getWorkoutRecommendation(
    memberId: string,
    options: {
      type: 'strength' | 'cardio' | 'hiit' | 'flexibility' | 'full-body';
      duration?: number;
      equipment?: string[];
    }
  ): Promise<WorkoutRecommendation | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/workout/${memberId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(options)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Generate nutrition recommendation
   */
  async getNutritionRecommendation(
    memberId: string,
    options: {
      goal: 'weight-loss' | 'muscle-gain' | 'maintenance' | 'endurance';
      calorieTarget?: number;
      restrictions?: string[];
    }
  ): Promise<NutritionRecommendation | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/nutrition/${memberId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(options)
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Analyze member progress
   */
  async analyzeProgress(memberId: string): Promise<ProgressAnalysis | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/analytics/progress/${memberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Generate exercise form tips
   */
  async getExerciseFormTips(
    exerciseName: string,
    memberFitnessLevel?: string
  ): Promise<{
    tips: string[];
    commonMistakes: string[];
    alternatives: string[];
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/fitness/exercise-tips`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ exerciseName, fitnessLevel: memberFitnessLevel })
        }
      );

      if (!response.ok) {
        return {
          tips: [],
          commonMistakes: [],
          alternatives: []
        };
      }

      return await response.json();
    } catch {
      return {
        tips: [],
        commonMistakes: [],
        alternatives: []
      };
    }
  }

  /**
   * Calculate optimal rest periods
   */
  async calculateRestPeriods(
    workoutType: 'strength' | 'hypertrophy' | 'endurance',
    exercises: string[]
  ): Promise<{ exercise: string; restSeconds: number }[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/fitness/rest-calculator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ workoutType, exercises })
        }
      );

      if (!response.ok) {
        return exercises.map(e => ({ exercise: e, restSeconds: 60 }));
      }

      return await response.json();
    } catch {
      return exercises.map(e => ({ exercise: e, restSeconds: 60 }));
    }
  }

  /**
   * Generate motivational message
   */
  async generateMotivationalMessage(
    memberName: string,
    context: 'workout-complete' | 'streak' | 'goal-achieved' | 'encouragement'
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/motivation`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memberName, context })
        }
      );

      if (!response.ok) {
        return 'Keep pushing yourself! Every workout counts.';
      }

      const data = await response.json();
      return data.message;
    } catch {
      return 'Keep pushing yourself! Every workout counts.';
    }
  }

  /**
   * Get member memory/preferences
   */
  async getMemory(
    memberId: string,
    key?: string
  ): Promise<{ key: string; value: unknown } | { key: string; value: unknown }[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${memberId}/${key}`
        : `${this.config.baseUrl}/api/memory/${memberId}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Store member memory/preferences
   */
  async setMemory(
    memberId: string,
    data: { key: string; value: unknown; ttl?: number }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${memberId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Log workout session
   */
  async logWorkoutSession(
    memberId: string,
    workout: {
      type: string;
      duration: number;
      exercises: { name: string; sets: number; reps: number; weight?: number }[];
      caloriesBurned?: number;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/fitness/workouts/${memberId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workout)
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get AI agent response
   */
  async getAgentResponse(
    agentId: string,
    message: string,
    context?: FitnessContext
  ): Promise<{ response: string; actions?: unknown[] } | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/agents/${agentId}/chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message, context })
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Check connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.ok;
    } catch {
      return false;
    }
  }
}

export default HOJAIConnector;
