import { v4 as uuidv4 } from 'uuid';
import {
  SelfHarmLog,
  SelfHarmLogSchema,
  ApiResponse
} from '../models/mentalHealth.js';

// In-memory storage
const selfHarmLogs: Map<string, SelfHarmLog[]> = new Map();

// Safety plan template
const safetyPlanTemplate = {
  warningSigns: [
    'Feeling overwhelmed or unable to cope',
    'Isolating from others',
    'Changes in sleep patterns',
    'Increased anxiety or agitation',
    'Negative self-talk or hopelessness'
  ],
  copingStrategies: [
    'Call a friend or family member',
    'Practice deep breathing exercises',
    'Take a walk or engage in physical activity',
    'Listen to calming music',
    'Use grounding techniques (5-4-3-2-1)',
    'Write in a journal',
    'Take a shower or bath',
    'Engage in a hobby or creative activity'
  ],
  reasonsToLive: [
    'My pets need me',
    'I have goals I want to achieve',
    'My family and friends care about me',
    'There are experiences I want to have',
    'I want to see how my life improves'
  ],
  safePlaces: [
    'My home',
    'A friend\'s house',
    'A public place like a library or park',
    'A healthcare facility'
  ],
  whoICanCall: [
    'Crisis helpline: 9152987821 (iCall)',
    'Vandrevala Foundation: 1860-2662-345',
    'Trusted friend or family member'
  ],
  professionalHelp: [
    'Schedule appointment with therapist',
    'Contact psychiatrist for medication review',
    'Visit nearest hospital emergency room if needed'
  ]
};

/**
 * Self-Harm Service
 * Handles self-harm incident logging and safety planning
 */
export class SelfHarmService {
  /**
   * Log a self-harm incident
   */
  async logIncident(data: Omit<SelfHarmLog, 'id' | 'createdAt'>): Promise<ApiResponse<SelfHarmLog>> {
    try {
      const validationResult = SelfHarmLogSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error.errors[0]?.message || 'Validation failed'
        };
      }

      const log: SelfHarmLog = {
        ...validationResult.data,
        id: uuidv4(),
        createdAt: new Date()
      };

      const userLogs = selfHarmLogs.get(data.userId) || [];
      userLogs.push(log);
      selfHarmLogs.set(data.userId, userLogs);

      return {
        success: true,
        data: log,
        message: 'Incident logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log incident'
      };
    }
  }

  /**
   * Get history of self-harm incidents for a user
   */
  async getHistory(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<ApiResponse<SelfHarmLog[]>> {
    try {
      let userLogs = selfHarmLogs.get(userId) || [];

      if (options.startDate) {
        userLogs = userLogs.filter(l => l.date >= options.startDate!);
      }
      if (options.endDate) {
        userLogs = userLogs.filter(l => l.date <= options.endDate!);
      }

      // Sort by date descending
      userLogs.sort((a, b) => b.date.getTime() - a.date.getTime());

      const page = options.page || 1;
      const limit = options.limit || 20;
      const start = (page - 1) * limit;
      const paginated = userLogs.slice(start, start + limit);

      return {
        success: true,
        data: paginated,
        message: `Retrieved ${paginated.length} incidents`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get history'
      };
    }
  }

  /**
   * Get safety plan for a user
   */
  async getSafetyPlan(userId: string): Promise<ApiResponse<typeof safetyPlanTemplate & { customStrategies?: string[]; customReasons?: string[] }>> {
    try {
      // Get user's crisis plan if exists
      const userLogs = selfHarmLogs.get(userId) || [];

      // Analyze patterns from past incidents
      const triggerPatterns = this.analyzeTriggerPatterns(userLogs);
      const copingSuccess = this.analyzeCopingSuccess(userLogs);

      const plan = {
        ...safetyPlanTemplate,
        warningSigns: [
          ...safetyPlanTemplate.warningSigns,
          ...triggerPatterns.map(t => `History of: ${t.trigger}`)
        ],
        copingStrategies: [
          ...copingSuccess.map(c => c.copingStrategy),
          ...safetyPlanTemplate.copingStrategies.slice(0, 5)
        ],
        customStrategies: copingSuccess.filter(c => c.successRate > 0.5).map(c => c.copingStrategy),
        customReasons: []
      };

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get safety plan'
      };
    }
  }

  /**
   * Mark user as safe
   */
  async markSafe(userId: string, incidentId?: string): Promise<ApiResponse<SelfHarmLog | null>> {
    try {
      let logToUpdate: SelfHarmLog | null = null;

      if (incidentId) {
        const userLogs = selfHarmLogs.get(userId) || [];
        const index = userLogs.findIndex(l => l.id === incidentId);

        if (index !== -1) {
          userLogs[index].isSafeNow = true;
          logToUpdate = userLogs[index];
          selfHarmLogs.set(userId, userLogs);
        }
      } else {
        // Find most recent unresolved incident
        const userLogs = selfHarmLogs.get(userId) || [];
        const unresolved = userLogs
          .filter(l => !l.isSafeNow)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        if (unresolved.length > 0) {
          unresolved[0].isSafeNow = true;
          logToUpdate = unresolved[0];
          selfHarmLogs.set(userId, userLogs);
        }
      }

      return {
        success: true,
        data: logToUpdate,
        message: logToUpdate ? 'Marked as safe' : 'No incident to update'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark safe'
      };
    }
  }

  /**
   * Update an incident with follow-up actions
   */
  async updateIncident(
    userId: string,
    incidentId: string,
    data: Partial<SelfHarmLog>
  ): Promise<ApiResponse<SelfHarmLog>> {
    try {
      const userLogs = selfHarmLogs.get(userId) || [];
      const index = userLogs.findIndex(l => l.id === incidentId);

      if (index === -1) {
        return {
          success: false,
          error: 'Incident not found'
        };
      }

      const updated: SelfHarmLog = {
        ...userLogs[index],
        ...data,
        id: userLogs[index].id // Preserve original ID
      };

      userLogs[index] = updated;
      selfHarmLogs.set(userId, userLogs);

      return {
        success: true,
        data: updated,
        message: 'Incident updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update incident'
      };
    }
  }

  /**
   * Get statistics for a user
   */
  async getStatistics(userId: string): Promise<ApiResponse<{
    totalIncidents: number;
    incidentsThisMonth: number;
    incidentsThisWeek: number;
    averageSeverity: number;
    mostCommonTriggers: { trigger: string; count: number }[];
    mostEffectiveCoping: { copingStrategy: string; timesUsed: number }[];
    safetyRate: number;
    streak: number;
  }>> {
    try {
      const userLogs = selfHarmLogs.get(userId) || [];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const thisMonth = userLogs.filter(l => l.date >= monthStart);
      const thisWeek = userLogs.filter(l => l.date >= weekStart);

      // Calculate average severity
      const severityMap: Record<string, number> = {
        'thoughts': 1,
        'urges': 2,
        'minor': 3,
        'moderate': 4,
        'severe': 5
      };
      const avgSeverity = userLogs.length > 0
        ? userLogs.reduce((sum, l) => sum + (severityMap[l.severity] || 3), 0) / userLogs.length
        : 0;

      // Trigger analysis
      const triggerCounts = new Map<string, number>();
      userLogs.forEach(log => {
        log.triggers.forEach(t => {
          triggerCounts.set(t, (triggerCounts.get(t) || 0) + 1);
        });
      });
      const mostCommonTriggers = Array.from(triggerCounts.entries())
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Coping analysis
      const copingCounts = new Map<string, number>();
      userLogs.forEach(log => {
        log.usedCoping.forEach(c => {
          copingCounts.set(c, (copingCounts.get(c) || 0) + 1);
        });
      });
      const mostEffectiveCoping = Array.from(copingCounts.entries())
        .map(([copingStrategy, timesUsed]) => ({ copingStrategy, timesUsed }))
        .sort((a, b) => b.timesUsed - a.timesUsed)
        .slice(0, 5);

      // Safety rate
      const safeCount = userLogs.filter(l => l.isSafeNow).length;
      const safetyRate = userLogs.length > 0 ? safeCount / userLogs.length : 1;

      // Calculate streak (days without incident)
      const sortedLogs = [...userLogs].sort((a, b) => b.date.getTime() - a.date.getTime());
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i <= 365; i++) {
        const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const hasIncident = sortedLogs.some(l => {
          const logDate = new Date(l.date);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === checkDate.getTime();
        });

        if (hasIncident) {
          break;
        }
        streak++;
      }

      return {
        success: true,
        data: {
          totalIncidents: userLogs.length,
          incidentsThisMonth: thisMonth.length,
          incidentsThisWeek: thisWeek.length,
          averageSeverity: Math.round(avgSeverity * 10) / 10,
          mostCommonTriggers,
          mostEffectiveCoping,
          safetyRate: Math.round(safetyRate * 100),
          streak
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      };
    }
  }

  /**
   * Get crisis resources specific to self-harm
   */
  async getCrisisResources(): Promise<ApiResponse<{
    hotlines: { name: string; phone: string; description: string }[];
    onlineResources: { name: string; url: string; description: string }[];
    safetyMessage: string;
  }>> {
    try {
      const resources = {
        hotlines: [
          {
            name: 'iCall (TISS)',
            phone: '9152987821',
            description: 'Psychosocial helpline - Mon-Sat, 8am-10pm'
          },
          {
            name: 'Vandrevala Foundation',
            phone: '1860-2662-345',
            description: '24/7 Free Mental Health Helpline'
          },
          {
            name: 'NIMHANS',
            phone: '+91-80-4611 0000',
            description: 'National Institute of Mental Health - 24/7'
          }
        ],
        onlineResources: [
          {
            name: 'YourDOST',
            url: 'https://www.yourdost.com',
            description: 'Online counseling and emotional support'
          },
          {
            name: 'Mann Talks',
            url: 'https://manntalks.org',
            description: 'Mental health awareness and support'
          }
        ],
        safetyMessage: 'You deserve help and support. Please reach out to a professional or crisis line.'
      };

      return {
        success: true,
        data: resources
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get resources'
      };
    }
  }

  /**
   * Delete an incident
   */
  async deleteIncident(userId: string, incidentId: string): Promise<ApiResponse<boolean>> {
    try {
      const userLogs = selfHarmLogs.get(userId) || [];
      const index = userLogs.findIndex(l => l.id === incidentId);

      if (index === -1) {
        return {
          success: false,
          error: 'Incident not found'
        };
      }

      userLogs.splice(index, 1);
      selfHarmLogs.set(userId, userLogs);

      return {
        success: true,
        data: true,
        message: 'Incident deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete incident'
      };
    }
  }

  /**
   * Analyze trigger patterns from history
   */
  private analyzeTriggerPatterns(logs: SelfHarmLog[]): { trigger: string; count: number }[] {
    const triggerCounts = new Map<string, number>();

    logs.forEach(log => {
      log.triggers.forEach(trigger => {
        triggerCounts.set(trigger, (triggerCounts.get(trigger) || 0) + 1);
      });
    });

    return Array.from(triggerCounts.entries())
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Analyze coping strategy effectiveness
   */
  private analyzeCopingSuccess(logs: SelfHarmLog[]): { copingStrategy: string; successRate: number }[] {
    const strategyMap = new Map<string, { used: number; successful: number }>();

    logs.forEach(log => {
      log.usedCoping.forEach(strategy => {
        const existing = strategyMap.get(strategy) || { used: 0, successful: 0 };
        existing.used++;
        if (log.isSafeNow) {
          existing.successful++;
        }
        strategyMap.set(strategy, existing);
      });
    });

    return Array.from(strategyMap.entries())
      .map(([strategy, data]) => ({
        copingStrategy: strategy,
        successRate: data.used > 0 ? data.successful / data.used : 0
      }))
      .filter(s => s.successRate > 0)
      .sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Get the most recent incident
   */
  async getMostRecentIncident(userId: string): Promise<ApiResponse<SelfHarmLog | null>> {
    try {
      const userLogs = selfHarmLogs.get(userId) || [];
      const sorted = userLogs.sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        success: true,
        data: sorted[0] || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get recent incident'
      };
    }
  }
}

export const selfHarmService = new SelfHarmService();
