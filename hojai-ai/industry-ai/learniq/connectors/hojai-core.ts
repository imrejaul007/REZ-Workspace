/**
 * HOJAI Core Connector
 * Connects LEARNIQ to HOJAI Core AI infrastructure
 */

export interface HOJAIConfig {
  baseUrl: string;
  apiKey: string;
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  async analyzeIntent(text: string, context?: { userId?: string; courseId?: string }): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, unknown>;
  }> {
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

  async getLearningPath(userId: string, currentLevel: string): Promise<{
    recommendedCourses: string[];
    nextSteps: string[];
    estimatedDuration: number;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/learning/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ currentLevel })
        }
      );

      if (!response.ok) {
        return {
          recommendedCourses: ['web-dev', 'data-science'],
          nextSteps: ['Complete basics', 'Build projects'],
          estimatedDuration: 120
        };
      }

      return await response.json();
    } catch {
      return {
        recommendedCourses: [],
        nextSteps: [],
        estimatedDuration: 0
      };
    }
  }

  async generateStudyPlan(courseId: string, targetCompletion: string): Promise<{
    dailyTasks: { day: number; tasks: string[]; duration: number }[];
    milestones: { week: number; milestone: string }[];
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/study-plan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ courseId, targetCompletion })
        }
      );

      if (!response.ok) {
        return {
          dailyTasks: Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            tasks: ['Watch video', 'Complete quiz'],
            duration: 60
          })),
          milestones: [
            { week: 1, milestone: 'Complete Module 1' },
            { week: 2, milestone: 'Complete Module 2' }
          ]
        };
      }

      return await response.json();
    } catch {
      return {
        dailyTasks: [],
        milestones: []
      };
    }
  }

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