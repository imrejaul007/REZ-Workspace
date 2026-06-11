/**
 * HOJAI Core Connector
 * Connects TEAMMIND to HOJAI Core AI infrastructure
 * HR AI Analysis and Team Management
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

export interface HRContext {
  employeeId?: string;
  department?: string;
  role?: string;
  tenure?: number;
}

export interface SentimentAnalysis {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  keyPhrases: string[];
  concerns: string[];
  suggestions: string[];
}

export interface TeamHealthMetrics {
  engagementScore: number;
  satisfactionScore: number;
  turnoverRisk: 'low' | 'medium' | 'high';
  collaborationScore: number;
  stressLevel: 'low' | 'moderate' | 'high';
  factors: string[];
}

export interface PerformanceInsight {
  strengths: string[];
  areasForImprovement: string[];
  recommendedTraining: string[];
  promotionReadiness: 'not-ready' | 'almost-ready' | 'ready' | 'exceeds';
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze HR intent from text
   */
  async analyzeIntent(
    text: string,
    context?: HRContext
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
   * Analyze employee feedback sentiment
   */
  async analyzeSentiment(
    feedback: string,
    employeeContext?: HRContext
  ): Promise<SentimentAnalysis> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/hr/sentiment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ feedback, context: employeeContext })
        }
      );

      if (!response.ok) {
        return {
          overallSentiment: 'neutral',
          score: 0,
          keyPhrases: [],
          concerns: [],
          suggestions: []
        };
      }

      return await response.json();
    } catch {
      return {
        overallSentiment: 'neutral',
        score: 0,
        keyPhrases: [],
        concerns: [],
        suggestions: []
      };
    }
  }

  /**
   * Get team health metrics
   */
  async getTeamHealthMetrics(teamId: string): Promise<TeamHealthMetrics | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/hr/team-health/${teamId}`,
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
   * Generate performance insights
   */
  async getPerformanceInsights(employeeId: string): Promise<PerformanceInsight | null> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/hr/performance/${employeeId}`,
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
   * Get HR recommendations
   */
  async getHRRecommendations(
    employeeId: string,
    type: 'engagement' | 'retention' | 'development' | 'workload'
  ): Promise<{ recommendations: string[]; priority: 'low' | 'medium' | 'high' }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/hr/${employeeId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type })
        }
      );

      if (!response.ok) {
        return { recommendations: [], priority: 'medium' };
      }

      return await response.json();
    } catch {
      return { recommendations: [], priority: 'medium' };
    }
  }

  /**
   * Generate job description
   */
  async generateJobDescription(
    role: string,
    department: string,
    requirements: string[],
    seniority: 'entry' | 'mid' | 'senior' | 'lead'
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/job-description`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role, department, requirements, seniority })
        }
      );

      if (!response.ok) {
        return `${role} - ${department}\n\nRequirements:\n${requirements.join('\n')}`;
      }

      const data = await response.json();
      return data.description;
    } catch {
      return `${role} - ${department}\n\nRequirements:\n${requirements.join('\n')}`;
    }
  }

  /**
   * Generate performance review summary
   */
  async generatePerformanceSummary(
    employeeName: string,
    achievements: string[],
    areasForGrowth: string[],
    overallRating: number
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/performance-review`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ employeeName, achievements, areasForGrowth, overallRating })
        }
      );

      if (!response.ok) {
        return `Performance Review - ${employeeName}\nRating: ${overallRating}/5`;
      }

      const data = await response.json();
      return data.summary;
    } catch {
      return `Performance Review - ${employeeName}\nRating: ${overallRating}/5`;
    }
  }

  /**
   * Predict attrition risk
   */
  async predictAttritionRisk(employeeId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    probability: number;
    factors: string[];
    retentionSuggestions: string[];
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/hr/attrition-risk/${employeeId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      if (!response.ok) {
        return {
          riskLevel: 'low',
          probability: 0,
          factors: [],
          retentionSuggestions: []
        };
      }

      return await response.json();
    } catch {
      return {
        riskLevel: 'low',
        probability: 0,
        factors: [],
        retentionSuggestions: []
      };
    }
  }

  /**
   * Generate onboarding plan
   */
  async generateOnboardingPlan(
    role: string,
    department: string,
    experienceLevel: string
  ): Promise<{
    week1: string[];
    week2: string[];
    week3: string[];
    week4: string[];
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/hr/onboarding-plan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role, department, experienceLevel })
        }
      );

      if (!response.ok) {
        return { week1: [], week2: [], week3: [], week4: [] };
      }

      return await response.json();
    } catch {
      return { week1: [], week2: [], week3: [], week4: [] };
    }
  }

  /**
   * Get employee memory/preferences
   */
  async getMemory(
    employeeId: string,
    key?: string
  ): Promise<{ key: string; value: unknown } | { key: string; value: unknown }[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${employeeId}/${key}`
        : `${this.config.baseUrl}/api/memory/${employeeId}`;

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
   * Store employee memory/preferences
   */
  async setMemory(
    employeeId: string,
    data: { key: string; value: unknown; ttl?: number }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${employeeId}`,
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
   * Get AI agent response
   */
  async getAgentResponse(
    agentId: string,
    message: string,
    context?: HRContext
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