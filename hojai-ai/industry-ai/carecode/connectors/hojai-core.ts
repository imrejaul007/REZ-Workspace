/**
 * HOJAI Core Connector
 * Connects CARECODE to HOJAI Core AI infrastructure
 * Healthcare AI Analysis and Recommendations
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

export interface MedicalContext {
  patientId?: string;
  symptoms?: string[];
  conditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

export interface SymptomAnalysis {
  possibleConditions: Array<{
    condition: string;
    probability: number;
    urgency: 'low' | 'medium' | 'high' | 'emergency';
    recommendation: string;
  }>;
  suggestedQuestions: string[];
  recommendedSpecialist?: string;
}

export interface HealthRiskScore {
  score: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
}

export class HOJAIConnector {
  private config: HOJAIConfig;

  constructor(config: HOJAIConfig) {
    this.config = config;
  }

  /**
   * Analyze patient intent from text
   */
  async analyzeIntent(
    text: string,
    context?: MedicalContext
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
   * Analyze symptoms and provide possible conditions
   */
  async analyzeSymptoms(
    symptoms: string[],
    patientContext?: MedicalContext
  ): Promise<SymptomAnalysis> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/medical/symptom-analysis`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ symptoms, context: patientContext })
        }
      );

      if (!response.ok) {
        return {
          possibleConditions: [],
          suggestedQuestions: [],
          recommendedSpecialist: undefined
        };
      }

      return await response.json();
    } catch {
      return {
        possibleConditions: [],
        suggestedQuestions: [],
        recommendedSpecialist: undefined
      };
    }
  }

  /**
   * Generate personalized health recommendations
   */
  async getHealthRecommendations(
    patientId: string,
    type: 'lifestyle' | 'diet' | 'exercise' | 'medication' | 'preventive'
  ): Promise<{ recommendations: string[]; urgency: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/recommendations/health/${patientId}`,
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
        return { recommendations: [], urgency: 'normal' };
      }

      return await response.json();
    } catch {
      return { recommendations: [], urgency: 'normal' };
    }
  }

  /**
   * Calculate health risk score
   */
  async calculateHealthRisk(
    patientId: string,
    factors: {
      age?: number;
      bmi?: number;
      bloodPressure?: { systolic: number; diastolic: number };
      conditions?: string[];
      lifestyle?: string[];
    }
  ): Promise<HealthRiskScore> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/medical/risk-assessment/${patientId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(factors)
        }
      );

      if (!response.ok) {
        return {
          score: 0,
          riskLevel: 'low',
          factors: [],
          recommendations: []
        };
      }

      return await response.json();
    } catch {
      return {
        score: 0,
        riskLevel: 'low',
        factors: [],
        recommendations: []
      };
    }
  }

  /**
   * Generate appointment reminder message
   */
  async generateAppointmentReminder(
    patientName: string,
    doctorName: string,
    dateTime: string,
    instructions?: string[]
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/appointment-reminder`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ patientName, doctorName, dateTime, instructions })
        }
      );

      if (!response.ok) {
        return `Reminder: Your appointment with ${doctorName} is scheduled for ${dateTime}.`;
      }

      const data = await response.json();
      return data.message;
    } catch {
      return `Reminder: Your appointment with ${doctorName} is scheduled for ${dateTime}.`;
    }
  }

  /**
   * Generate follow-up instructions
   */
  async generateFollowUpInstructions(
    patientName: string,
    prescription: { medications: string[]; duration: string },
    lifestyleAdvice?: string[]
  ): Promise<string> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/narrative/follow-up`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ patientName, prescription, lifestyleAdvice })
        }
      );

      if (!response.ok) {
        return `Dear ${patientName}, please follow your prescribed medications for ${prescription.duration}.`;
      }

      const data = await response.json();
      return data.message;
    } catch {
      return `Dear ${patientName}, please follow your prescribed medications for ${prescription.duration}.`;
    }
  }

  /**
   * Get patient memory/preferences
   */
  async getMemory(
    patientId: string,
    key?: string
  ): Promise<{ key: string; value: unknown } | { key: string; value: unknown }[] | null> {
    try {
      const url = key
        ? `${this.config.baseUrl}/api/memory/${patientId}/${key}`
        : `${this.config.baseUrl}/api/memory/${patientId}`;

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
   * Store patient memory/preferences
   */
  async setMemory(
    patientId: string,
    data: { key: string; value: unknown; ttl?: number }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/memory/${patientId}`,
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
   * Log patient interaction
   */
  async logInteraction(
    patientId: string,
    interaction: {
      type: string;
      channel: string;
      message: string;
      response?: string;
      outcome?: string;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/interactions/${patientId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(interaction)
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
    context?: MedicalContext
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
