export declare const REZ_INTELLIGENCE: {
    BASE_URL: string;
    HEALTH_EXPERT_URL: string;
    MEMORY_LAYER_URL: string;
    SIGNAL_AGGREGATOR_URL: string;
    API_KEY: string;
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
        referenceRange?: {
            min?: number;
            max?: number;
        };
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
    riskSignals: Array<{
        indicator: string;
        action: string;
    }>;
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
export declare function interpretReport(request: ReportInterpretationRequest): Promise<ReportInterpretationResponse | null>;
export declare function assessSymptoms(request: SymptomAssessmentRequest): Promise<SymptomAssessmentResponse | null>;
export declare function predictIntent(userId: string, message: string): Promise<IntentPrediction | null>;
export declare function storeHealthMemory(userId: string, eventType: string, data: Record<string, unknown>): Promise<{
    success: boolean;
} | null>;
export declare function getHealthHistory(userId: string, eventType?: string, limit?: number): Promise<Array<{
    eventType: string;
    data: Record<string, unknown>;
    timestamp: string;
}> | null>;
export declare function trackUserSignal(userId: string, signalType: string, properties: Record<string, unknown>): Promise<{
    success: boolean;
} | null>;
export declare function getUserSignals(userId: string, signalTypes?: string[]): Promise<Array<{
    signalType: string;
    count: number;
    lastSeen: string;
}>>;
export declare function analyzeHealthBehavior(userId: string): Promise<{
    engagementScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
    recommendations: string[];
} | null>;
export declare const rezIntelligenceClient: {
    health: {
        interpret: typeof interpretReport;
        symptoms: typeof assessSymptoms;
        predictIntent: typeof predictIntent;
    };
    intent: {
        predict: typeof predictIntent;
    };
    memory: {
        store: typeof storeHealthMemory;
        history: typeof getHealthHistory;
    };
    signals: {
        track: typeof trackUserSignal;
        get: typeof getUserSignals;
    };
    behavior: {
        analyze: typeof analyzeHealthBehavior;
    };
};
export default rezIntelligenceClient;
