// RisaCare - REZ Intelligence Integration Client

import { generateId, logger } from '../../shared/utils';

export const REZ_INTELLIGENCE = {
  BASE_URL: process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018',
  HEALTH_EXPERT_URL: process.env.HEALTH_EXPERT_URL || 'http://localhost:3011',
  MEMORY_LAYER_URL: process.env.MEMORY_LAYER_URL || 'http://localhost:4201',
  SIGNAL_AGGREGATOR_URL: process.env.SIGNAL_AGGREGATOR_URL || 'http://localhost:4142',
  API_KEY: process.env.REZ_INTELLIGENCE_API_KEY || 'dev-api-key'
};

export interface HealthContext {
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  recentSymptoms?: string[];
  lastCheckup?: string;
  familyHistory?: string[];
  age?: number;
  gender?: string;
}

export interface BiomarkerInterpretation {
  biomarker: string;
  value: string;
  unit?: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'borderline' | 'critical';
  explanation: string;
  confidence: number;
  needsAttention: boolean;
}

export interface ReportInterpretationRequest {
  recordType: string;
  reportDate: string;
  rawText: string;
  extractedBiomarkers: Array<{
    name: string;
    value: string | number;
    unit?: string;
    referenceRange?: { min?: number; max?: number };
    status?: 'normal' | 'low' | 'high' | 'borderline' | 'critical';
  }>;
  userContext: HealthContext;
}

export interface ReportInterpretationResponse {
  interpretations: BiomarkerInterpretation[];
  overallAssessment: {
    summary: string;
    needsDoctorConsult: boolean;
    urgency: 'low' | 'medium' | 'high';
  };
  riskSignals: Array<{ indicator: string; action: string }>;
  confidence: number;
}

export interface SymptomInput {
  name: string;
  duration?: string;
  severity?: 'minor' | 'moderate' | 'severe';
}

export interface SymptomAssessmentRequest {
  symptoms: SymptomInput[];
  patient?: {
    name: string;
    existingConditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
}

export interface SymptomAssessmentResponse {
  urgencyLevel: 'self_care' | 'consult_doctor' | 'urgent_care' | 'emergency';
  reasoning: string;
  recommendedSpecialties: string[];
  recommendedTests?: string[];
  selfCareGuidance?: string;
  confidence: number;
}

export interface IntentPrediction {
  intent: string;
  confidence: number;
  entities?: Record<string, unknown>;
}

async function callService<T>(url: string, body?: unknown, method = 'POST'): Promise<T | null> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': REZ_INTELLIGENCE.API_KEY
      }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      logger.error('API error: ' + response.status);
      return null;
    }
    return await response.json() as T;
  } catch (error) {
    logger.error('Failed to call service: ' + url, error as Error);
    return null;
  }
}

export async function interpretReport(request: ReportInterpretationRequest): Promise<ReportInterpretationResponse | null> {
  const url = REZ_INTELLIGENCE.HEALTH_EXPERT_URL + '/api/v1/health/health/interpret';
  const result = await callService<ReportInterpretationResponse>(url, {
    recordType: request.recordType,
    reportDate: request.reportDate,
    rawText: request.rawText,
    extractedBiomarkers: request.extractedBiomarkers,
    userContext: request.userContext,
    sessionId: generateId('sess')
  });
  if (!result) {
    return generateMockInterpretation(request);
  }
  return result;
}

export async function assessSymptoms(request: SymptomAssessmentRequest): Promise<SymptomAssessmentResponse | null> {
  const url = REZ_INTELLIGENCE.HEALTH_EXPERT_URL + '/api/v1/health/symptoms';
  const result = await callService<{urgency: string; recommendations?: string[]; specialties?: string[]}>(url, {
    symptoms: request.symptoms.map(s => ({ name: s.name, duration: s.duration, severity: s.severity })),
    patient: request.patient
  });
  if (!result) {
    return generateMockSymptomAssessment(request);
  }
  const urgencyMap: Record<string, SymptomAssessmentResponse['urgencyLevel']> = {
    'low': 'self_care',
    'medium': 'consult_doctor',
    'high': 'urgent_care',
    'critical': 'emergency'
  };
  return {
    urgencyLevel: urgencyMap[result.urgency] || 'self_care',
    reasoning: result.recommendations?.join('. ') || 'Assessment complete',
    recommendedSpecialties: result.specialties || [],
    confidence: 80
  };
}

export async function predictIntent(userId: string, message: string): Promise<IntentPrediction | null> {
  const url = REZ_INTELLIGENCE.HEALTH_EXPERT_URL + '/api/v1/health/intent/' + encodeURIComponent(message);
  const result = await callService<{intent?: string}>(url, {});
  return {
    intent: result?.intent || 'general',
    confidence: 0.8
  };
}

export async function storeHealthMemory(userId: string, eventType: string, data: Record<string, unknown>): Promise<{success: boolean} | null> {
  const url = REZ_INTELLIGENCE.MEMORY_LAYER_URL + '/api/memory/store';
  return callService<{success: boolean}>(url, {
    userId,
    eventType,
    data,
    timestamp: new Date().toISOString()
  });
}

export async function getHealthHistory(userId: string, eventType?: string, limit = 50): Promise<Array<{eventType: string; data: Record<string, unknown>; timestamp: string}> | null> {
  const base = REZ_INTELLIGENCE.MEMORY_LAYER_URL + '/api/timeline/' + userId;
  const url = eventType ? base + '?eventType=' + eventType + '&limit=' + limit : base + '?limit=' + limit;
  return callService<Array<{eventType: string; data: Record<string, unknown>; timestamp: string}>>(url, undefined, 'GET');
}

export async function trackUserSignal(userId: string, signalType: string, properties: Record<string, unknown>): Promise<{success: boolean} | null> {
  const url = REZ_INTELLIGENCE.SIGNAL_AGGREGATOR_URL + '/api/signals/track';
  return callService<{success: boolean}>(url, {
    userId,
    signalType,
    properties,
    timestamp: new Date().toISOString()
  });
}

export async function getUserSignals(userId: string, signalTypes?: string[]): Promise<Array<{signalType: string; count: number; lastSeen: string}>> {
  const url = REZ_INTELLIGENCE.SIGNAL_AGGREGATOR_URL + '/api/signals/user/' + userId;
  const result = await callService<Array<{signalType: string; count: number; lastSeen: string}>>(url, undefined, 'GET');
  if (!result) return [];
  if (signalTypes && signalTypes.length > 0) {
    return result.filter(s => signalTypes.includes(s.signalType));
  }
  return result;
}

export async function analyzeHealthBehavior(userId: string): Promise<{engagementScore: number; riskLevel: 'low' | 'medium' | 'high'; insights: string[]; recommendations: string[]} | null> {
  const signals = await getUserSignals(userId);
  const engagementScore = Math.min(100, signals.length * 10);
  const riskLevel: 'low' | 'medium' | 'high' = engagementScore < 30 ? 'high' : engagementScore < 70 ? 'medium' : 'low';
  return {
    engagementScore,
    riskLevel,
    insights: signals.map(s => s.signalType + ': ' + s.count + ' interactions'),
    recommendations: riskLevel === 'high' ? ['Increase health tracking engagement', 'Set regular checkup reminders'] : ['Maintain current engagement', 'Continue regular monitoring']
  };
}

function generateMockInterpretation(request: ReportInterpretationRequest): ReportInterpretationResponse {
  const refs = request.extractedBiomarkers.map(b => {
    const min = b.referenceRange?.min || 0;
    const max = b.referenceRange?.max || 100;
    return {
      biomarker: b.name,
      value: String(b.value),
      unit: b.unit,
      referenceRange: min + '-' + max,
      status: b.status || 'normal',
      explanation: b.name + ' is ' + (b.status || 'normal') + '. Please consult your doctor for personalized advice.',
      confidence: 75,
      needsAttention: (b.status || 'normal') !== 'normal'
    };
  });
  const needsDoctor = refs.some(r => r.needsAttention);
  const hasExtreme = refs.some(r => r.status === 'high' || r.status === 'low');
  return {
    interpretations: refs,
    overallAssessment: {
      summary: 'Analyzed ' + request.extractedBiomarkers.length + ' biomarkers from ' + request.recordType,
      needsDoctorConsult: needsDoctor,
      urgency: hasExtreme ? 'medium' : 'low'
    },
    riskSignals: [],
    confidence: 75
  };
}

function generateMockSymptomAssessment(request: SymptomAssessmentRequest): SymptomAssessmentResponse {
  const hasSevere = request.symptoms.some(s => s.severity === 'severe');
  return {
    urgencyLevel: hasSevere ? 'urgent_care' : 'consult_doctor',
    reasoning: 'Based on your symptoms, professional consultation is recommended',
    recommendedSpecialties: ['General Physician'],
    confidence: 70
  };
}

export const rezIntelligenceClient = {
  health: { interpret: interpretReport, symptoms: assessSymptoms, predictIntent },
  intent: { predict: predictIntent },
  memory: { store: storeHealthMemory, history: getHealthHistory },
  signals: { track: trackUserSignal, get: getUserSignals },
  behavior: { analyze: analyzeHealthBehavior }
};

export default rezIntelligenceClient;
