import { logger } from '../../shared/logger';
/**
 * RisaCare LLM Client
 * Connects to HOJAI LLM Service (port 4730) for real AI capabilities
 */

import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';

// ============================================
// TYPES
// ============================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

export interface LLMChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  provider?: 'openai' | 'anthropic' | 'gemini';
}

export interface LLMChatResponse {
  success: boolean;
  data?: {
    content: string;
    role: string;
    finishReason: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
    provider: string;
  };
  error?: string;
}

export interface LLMHealthStatus {
  status: string;
  providers: {
    name: string;
    type: string;
    available: boolean;
    status: string;
  }[];
}

// ============================================
// ZOD SCHEMAS
// ============================================

const chatRequestSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini']).default('openai'),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'function']),
    content: z.string(),
    name: z.string().optional()
  })),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  stop: z.array(z.string()).optional(),
  taskType: z.enum(['chat', 'analysis', 'classification', 'reasoning', 'creative']).optional()
});

// ============================================
// LLM CLIENT CLASS
// ============================================

export class LLMRisaCareClient {
  private client: AxiosInstance;
  private defaultProvider: 'openai' | 'anthropic' | 'gemini';
  private defaultModel: string;
  private fallbackEnabled: boolean;

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    defaultProvider?: 'openai' | 'anthropic' | 'gemini';
    defaultModel?: string;
    fallbackEnabled?: boolean;
  }) {
    const baseUrl = options?.baseUrl || process.env.LLM_SERVICE_URL || 'http://localhost:4730';

    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 60000, // 60 seconds for complex medical analysis
      headers: {
        'Content-Type': 'application/json',
        ...(options?.apiKey && { 'Authorization': `Bearer ${options.apiKey}` })
      }
    });

    this.defaultProvider = options?.defaultProvider || 'anthropic';
    this.defaultModel = options?.defaultModel || 'claude-3-5-sonnet-20241022';
    this.fallbackEnabled = options?.fallbackEnabled ?? true;
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): Promise<LLMChatResponse> {
    try {
      const request = {
        provider: options?.provider || this.defaultProvider,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          ...(m.name && { name: m.name })
        })),
        model: options?.model || this.defaultModel,
        temperature: options?.temperature ?? 0.3, // Lower temp for medical accuracy
        maxTokens: options?.maxTokens || 4000,
        ...(options?.topP && { topP: options.topP }),
        ...(options?.stop && { stop: options.stop }),
        taskType: 'analysis'
      };

      const response = await this.client.post('/api/chat', request);
      return response.data;
    } catch (error: any) {
      logger.error('LLM chat error:', error.message);

      if (this.fallbackEnabled) {
        return {
          success: false,
          error: `LLM service unavailable: ${error.message}. Fallback enabled.`
        };
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if LLM service is healthy
   */
  async healthCheck(): Promise<LLMHealthStatus | null> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('LLM health check failed:', error);
      return null;
    }
  }

  /**
   * Generate medical report interpretation
   */
  async interpretReport(reportText: string, reportType: string): Promise<LLMChatResponse> {
    const systemPrompt = `You are an expert medical AI assistant for RisaCare. Your role is to analyze and interpret medical reports for patients and healthcare providers.

IMPORTANT GUIDELINES:
1. Always provide accurate, evidence-based interpretations
2. Use simple, clear language that patients can understand
3. Include relevant medical context without being alarmist
4. Recommend follow-up actions when appropriate
5. Always include a disclaimer that this is AI-assisted and not a substitute for medical advice
6. Flag critical values that require immediate attention
7. Provide lifestyle recommendations when relevant

Response format:
- Summary in plain language
- Key findings with explanations
- What the numbers mean
- Next steps/recommendations
- Disclaimer`;

    const userPrompt = `Please analyze this ${reportType} report:

${reportText}

Provide a comprehensive interpretation following the format guidelines.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.3,
      maxTokens: 3000
    });
  }

  /**
   * Generate symptom analysis
   */
  async analyzeSymptoms(
    symptoms: string[],
    duration: string,
    severity: 'mild' | 'moderate' | 'severe',
    patientContext?: {
      age?: number;
      gender?: string;
      medicalHistory?: string[];
      currentMedications?: string[];
    }
  ): Promise<LLMChatResponse> {
    let contextPrompt = '';
    if (patientContext) {
      contextPrompt = `\n\nPatient Context:
- Age: ${patientContext.age || 'Not provided'}
- Gender: ${patientContext.gender || 'Not provided'}
- Medical History: ${patientContext.medicalHistory?.join(', ') || 'None reported'}
- Current Medications: ${patientContext.currentMedications?.join(', ') || 'None'}`;
    }

    const systemPrompt = `You are a medical triage AI assistant for RisaCare. Your role is to help users understand their symptoms and guide them to appropriate care.

IMPORTANT:
1. NEVER diagnose - always recommend consulting a healthcare provider
2. Provide self-care suggestions for minor conditions
3. Recommend appropriate care levels (self-care, pharmacy, GP, urgent care, emergency)
4. Flag symptoms that require immediate medical attention
5. Be empathetic and reassuring
6. Consider patient context for personalized guidance

Response format:
- Likely causes (with probabilities)
- Self-care recommendations
- Red flags to watch for
- Recommended next steps
- When to seek immediate care`;

    const userPrompt = `Analyze these symptoms:
- Symptoms: ${symptoms.join(', ')}
- Duration: ${duration}
- Severity: ${severity}${contextPrompt}

Provide triage guidance following the format guidelines.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.4,
      maxTokens: 2500
    });
  }

  /**
   * Generate health recommendations
   */
  async generateHealthRecommendations(
    healthData: {
      vitals?: Record<string, number>;
      labResults?: Record<string, { value: number; unit: string; reference: string }>;
      conditions?: string[];
      age?: number;
      gender?: string;
    }
  ): Promise<LLMChatResponse> {
    const systemPrompt = `You are a preventive health AI specialist for RisaCare. Your role is to provide personalized health recommendations based on user health data.

IMPORTANT:
1. Base recommendations on actual health data provided
2. Prioritize actionable, specific recommendations
3. Consider age, gender, and existing conditions
4. Include preventive health measures
5. Suggest relevant screenings based on guidelines
6. Recommend lifestyle modifications when appropriate
7. Always include a disclaimer about consulting healthcare providers`;

    const userPrompt = `Generate personalized health recommendations based on:

Health Data:
${healthData.vitals ? `Vitals: ${JSON.stringify(healthData.vitals)}` : 'No vitals data'}
${healthData.labResults ? `Lab Results: ${JSON.stringify(healthData.labResults)}` : 'No lab results'}
${healthData.conditions ? `Existing Conditions: ${healthData.conditions.join(', ')}` : 'No known conditions'}
${healthData.age ? `Age: ${healthData.age}` : ''}
${healthData.gender ? `Gender: ${healthData.gender}` : ''}

Provide personalized, actionable recommendations.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.5,
      maxTokens: 2500
    });
  }

  /**
   * Generate medication explanation
   */
  async explainMedication(
    medicationName: string,
    dosage: string,
    frequency: string,
    patientContext?: {
      age?: number;
      conditions?: string[];
      otherMedications?: string[];
    }
  ): Promise<LLMChatResponse> {
    let contextPrompt = '';
    if (patientContext) {
      contextPrompt = `\n\nPatient Context:
- Age: ${patientContext.age || 'Not provided'}
- Other Conditions: ${patientContext.conditions?.join(', ') || 'None'}
- Other Medications: ${patientContext.otherMedications?.join(', ') || 'None'}`;
    }

    const systemPrompt = `You are a pharmacist AI assistant for RisaCare. Your role is to explain medications clearly to patients.

IMPORTANT:
1. Explain what the medication does in simple terms
2. Describe how and when to take it
3. List common and serious side effects
4. Mention important precautions and interactions
5. Provide storage instructions
6. Explain what to do if a dose is missed
7. Always recommend consulting a pharmacist or doctor for medical questions`;

    const userPrompt = `Explain this medication:
- Name: ${medicationName}
- Dosage: ${dosage}
- Frequency: ${frequency}${contextPrompt}

Provide a clear, patient-friendly explanation.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.4,
      maxTokens: 2000
    });
  }

  /**
   * Generate care plan
   */
  async generateCarePlan(
    diagnosis: string,
    patientContext: {
      age: number;
      gender: string;
      medicalHistory: string[];
      currentMedications: string[];
      lifestyle: {
        exercise: string;
        diet: string;
        smoking: boolean;
        alcohol: string;
      };
    },
    goals?: string[]
  ): Promise<LLMChatResponse> {
    const systemPrompt = `You are a care coordination AI assistant for RisaCare. Your role is to help create comprehensive care plans.

IMPORTANT:
1. Create realistic, achievable goals
2. Consider the patient's full context
3. Include medication management
4. Add lifestyle modifications
5. Schedule follow-up actions
6. Include warning signs to watch for
7. Recommend relevant resources
8. Always involve healthcare providers in final decisions`;

    const userPrompt = `Create a comprehensive care plan for:

Diagnosis: ${diagnosis}

Patient Profile:
- Age: ${patientContext.age}
- Gender: ${patientContext.gender}
- Medical History: ${patientContext.medicalHistory.join(', ')}
- Current Medications: ${patientContext.currentMedications.join(', ')}

Lifestyle:
- Exercise: ${patientContext.lifestyle.exercise}
- Diet: ${patientContext.lifestyle.diet}
- Smoking: ${patientContext.lifestyle.smoking ? 'Yes' : 'No'}
- Alcohol: ${patientContext.lifestyle.alcohol}

${goals ? `Patient Goals: ${goals.join(', ')}` : ''}

Provide a structured care plan.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      temperature: 0.5,
      maxTokens: 3000
    });
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export const llmClient = new LLMRisaCareClient({
  baseUrl: process.env.LLM_SERVICE_URL || 'http://localhost:4730',
  defaultProvider: 'anthropic',
  defaultModel: 'claude-3-5-sonnet-20241022'
});

export default llmClient;
