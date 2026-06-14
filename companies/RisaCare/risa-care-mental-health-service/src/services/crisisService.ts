import { v4 as uuidv4 } from 'uuid';
import {
  CrisisPlan,
  CrisisPlanSchema,
  CrisisAlert,
  CrisisAlertSchema,
  ApiResponse
} from '../models/mentalHealth.js';

// In-memory storage
const crisisPlans: Map<string, CrisisPlan> = new Map();
const crisisAlerts: CrisisAlert[] = [];

// Crisis resources
const crisisResources = {
  india: {
    helplines: [
      {
        name: 'iCall',
        phone: '9152987821',
        description: 'Psychosocial helpline by TISS',
        available: 'Mon-Sat, 8am-10pm'
      },
      {
        name: 'Vandrevala Foundation',
        phone: '1860-2662-345',
        description: '24/7 Free Helpline',
        available: '24/7'
      },
      {
        name: 'NIMHANS',
        phone: '+91-80-4611 0000',
        description: 'National Institute of Mental Health',
        available: '24/7'
      },
      {
        name: 'COOJ Mental Health',
        phone: '0832-2548449',
        description: 'Goa-based helpline',
        available: '24/7'
      },
      {
        name: 'Roshni Trust',
        phone: '040-6620 2000',
        description: 'Hyderabad-based crisis helpline',
        available: '24/7'
      }
    ],
    emergencyServices: [
      {
        name: 'National Emergency Number',
        phone: '112'
      },
      {
        name: 'Police',
        phone: '100'
      },
      {
        name: 'Ambulance',
        phone: '102'
      }
    ],
    onlineResources: [
      {
        name: 'Mann Talks',
        url: 'https://manntalks.org',
        description: 'Mental health support and awareness'
      },
      {
        name: 'Mindler',
        url: 'https://www.mindler.com',
        description: 'Career and mental health guidance'
      },
      {
        name: 'YourDOST',
        url: 'https://www.yourdost.com',
        description: 'Online counseling platform'
      }
    ]
  },
  global: {
    resources: [
      {
        name: 'International Association for Suicide Prevention',
        url: 'https://www.iasp.info/resources/Crisis_Centres/',
        description: 'Global crisis center directory'
      },
      {
        name: 'Befrienders Worldwide',
        url: 'https://www.befrienders.org',
        description: 'Emotional support helplines worldwide'
      },
      {
        name: 'Crisis Text Line',
        url: 'https://www.crisistextline.org',
        description: 'Text-based crisis support'
      }
    ]
  }
};

// Safety tips
const safetyTips = [
  'Remove access to means (medications, weapons, etc.)',
  'Stay in a safe place if possible',
  'Contact a trusted friend or family member',
  'Call a helpline for immediate support',
  'Practice grounding techniques: 5-4-3-2-1 (5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste)',
  'Take slow, deep breaths',
  'Remind yourself that this crisis will pass',
  'Stay away from alcohol and drugs',
  'Try to talk to someone face-to-face if possible'
];

/**
 * Crisis Service
 * Handles crisis planning, alerts, and emergency resources
 */
export class CrisisService {
  /**
   * Create or update a crisis plan
   */
  async createCrisisPlan(data: Omit<CrisisPlan, 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CrisisPlan>> {
    try {
      const validationResult = CrisisPlanSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed'
        };
      }

      const existingPlan = crisisPlans.get(data.userId);

      const plan: CrisisPlan = {
        ...validationResult.data,
        createdAt: existingPlan?.createdAt || new Date(),
        updatedAt: new Date()
      };

      crisisPlans.set(data.userId, plan);

      return {
        success: true,
        data: plan,
        message: 'Crisis plan saved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create crisis plan'
      };
    }
  }

  /**
   * Get crisis plan for a user
   */
  async getCrisisPlan(userId: string): Promise<ApiResponse<CrisisPlan | null>> {
    try {
      const plan = crisisPlans.get(userId);

      if (!plan) {
        return {
          success: true,
          data: null,
          message: 'No crisis plan found. Please create one.'
        };
      }

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get crisis plan'
      };
    }
  }

  /**
   * Update crisis plan
   */
  async updateCrisisPlan(
    userId: string,
    data: Partial<Omit<CrisisPlan, 'userId' | 'createdAt'>>
  ): Promise<ApiResponse<CrisisPlan>> {
    try {
      const existingPlan = crisisPlans.get(userId);

      if (!existingPlan) {
        return {
          success: false,
          error: 'No crisis plan found. Please create one first.'
        };
      }

      const updatedPlan: CrisisPlan = {
        ...existingPlan,
        ...data,
        updatedAt: new Date()
      };

      const validationResult = CrisisPlanSchema.safeParse(updatedPlan);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed'
        };
      }

      crisisPlans.set(userId, validationResult.data);

      return {
        success: true,
        data: validationResult.data,
        message: 'Crisis plan updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update crisis plan'
      };
    }
  }

  /**
   * Trigger a crisis alert
   */
  async triggerCrisisAlert(data: {
    userId: string;
    type: 'immediate' | 'escalating' | 'check_in';
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    location?: string;
  }): Promise<ApiResponse<CrisisAlert & { resources: typeof crisisResources; safetyTips: string[] }>> {
    try {
      const alert: CrisisAlert = {
        id: uuidv4(),
        userId: data.userId,
        type: data.type,
        severity: data.severity,
        triggeredAt: new Date(),
        reason: data.reason,
        location: data.location,
        isResolved: false,
        resourcesProvided: [],
        emergencyServicesNotified: false
      };

      // Determine which resources to provide based on severity
      let resources: string[] = [];

      if (data.severity === 'critical' || data.severity === 'high') {
        resources = [
          ...crisisResources.india.helplines.map(h => `${h.name}: ${h.phone}`),
          'Emergency Services: 112'
        ];
      } else {
        resources = crisisResources.india.helplines.slice(0, 2).map(h => `${h.name}: ${h.phone}`);
      }

      alert.resourcesProvided = resources;

      // For critical cases, recommend emergency services
      if (data.severity === 'critical') {
        alert.emergencyServicesNotified = false; // Would integrate with actual emergency services
      }

      crisisAlerts.push(alert);

      return {
        success: true,
        data: {
          ...alert,
          resources: crisisResources,
          safetyTips
        },
        message: 'Crisis alert triggered. Resources and support have been provided.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger crisis alert'
      };
    }
  }

  /**
   * Get crisis alerts for a user
   */
  async getCrisisAlerts(userId: string): Promise<ApiResponse<CrisisAlert[]>> {
    try {
      const userAlerts = crisisAlerts
        .filter(a => a.userId === userId)
        .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

      return {
        success: true,
        data: userAlerts
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get crisis alerts'
      };
    }
  }

  /**
   * Resolve a crisis alert
   */
  async resolveCrisisAlert(
    alertId: string,
    resolvedBy: string
  ): Promise<ApiResponse<CrisisAlert>> {
    try {
      const alertIndex = crisisAlerts.findIndex(a => a.id === alertId);

      if (alertIndex === -1) {
        return {
          success: false,
          error: 'Crisis alert not found'
        };
      }

      crisisAlerts[alertIndex].isResolved = true;
      crisisAlerts[alertIndex].resolvedAt = new Date();
      crisisAlerts[alertIndex].resolvedBy = resolvedBy;

      return {
        success: true,
        data: crisisAlerts[alertIndex],
        message: 'Crisis alert resolved'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve crisis alert'
      };
    }
  }

  /**
   * Get crisis resources
   */
  async getCrisisResources(country?: 'india' | 'global'): Promise<ApiResponse<typeof crisisResources | typeof crisisResources.india>> {
    try {
      if (country === 'global') {
        return {
          success: true,
          data: crisisResources.global
        };
      }

      return {
        success: true,
        data: crisisResources
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get crisis resources'
      };
    }
  }

  /**
   * Get safety tips
   */
  async getSafetyTips(): Promise<ApiResponse<string[]>> {
    try {
      return {
        success: true,
        data: safetyTips
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get safety tips'
      };
    }
  }

  /**
   * Get breathing exercises for crisis
   */
  async getBreathingExercises(): Promise<ApiResponse<{ name: string; description: string; duration: string; steps: string[] }[]>> {
    try {
      const exercises = [
        {
          name: '4-7-8 Breathing',
          description: 'A calming technique to reduce anxiety',
          duration: '4 minutes',
          steps: [
            'Exhale completely through your mouth',
            'Close your mouth and inhale through your nose for 4 seconds',
            'Hold your breath for 7 seconds',
            'Exhale completely through your mouth for 8 seconds',
            'Repeat 3-4 times'
          ]
        },
        {
          name: 'Box Breathing',
          description: 'Equal breathing pattern used by Navy SEALs',
          duration: '4 minutes',
          steps: [
            'Exhale completely',
            'Inhale through your nose for 4 seconds',
            'Hold your breath for 4 seconds',
            'Exhale through your mouth for 4 seconds',
            'Hold empty for 4 seconds',
            'Repeat 4-6 times'
          ]
        },
        {
          name: 'Deep Belly Breathing',
          description: 'Simple diaphragmatic breathing',
          duration: '5 minutes',
          steps: [
            'Sit or lie down comfortably',
            'Place one hand on your chest, one on your belly',
            'Breathe in slowly through your nose, feeling your belly rise',
            'Breathe out slowly through your mouth',
            'Continue for 5-10 breaths'
          ]
        }
      ];

      return {
        success: true,
        data: exercises
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get exercises'
      };
    }
  }

  /**
   * Get grounding techniques
   */
  async getGroundingTechniques(): Promise<ApiResponse<{ name: string; description: string; steps: string[] }[]>> {
    try {
      const techniques = [
        {
          name: '5-4-3-2-1 Sensory Grounding',
          description: 'Use your senses to ground yourself in the present moment',
          steps: [
            'Name 5 things you can SEE around you',
            'Name 4 things you can TOUCH',
            'Name 3 things you can HEAR',
            'Name 2 things you can SMELL',
            'Name 1 thing you can TASTE'
          ]
        },
        {
          name: 'Body Scan',
          description: 'Bring awareness to each part of your body',
          steps: [
            'Close your eyes and take a deep breath',
            'Focus on your feet - notice any sensations',
            'Move your attention up to your legs',
            'Notice your stomach, chest, arms',
            'Finally, relax your face and jaw'
          ]
        },
        {
          name: 'Safe Place Visualization',
          description: 'Imagine a peaceful, safe place',
          steps: [
            'Close your eyes and take slow breaths',
            'Imagine a place where you feel completely safe',
            'It could be real or imaginary',
            'Notice the colors, sounds, smells of this place',
            'Stay there for a few minutes, breathing deeply'
          ]
        }
      ];

      return {
        success: true,
        data: techniques
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get techniques'
      };
    }
  }

  /**
   * Delete crisis plan
   */
  async deleteCrisisPlan(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const deleted = crisisPlans.delete(userId);

      return {
        success: true,
        data: deleted,
        message: deleted ? 'Crisis plan deleted' : 'No crisis plan found'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete crisis plan'
      };
    }
  }
}

export const crisisService = new CrisisService();
