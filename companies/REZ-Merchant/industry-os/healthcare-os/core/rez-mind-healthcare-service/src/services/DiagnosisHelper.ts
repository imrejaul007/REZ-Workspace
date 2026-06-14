import { z } from 'zod';

// Symptom severity levels
export enum SeverityLevel {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical'
}

// Common symptom patterns for diagnosis
interface SymptomPattern {
  symptoms: string[];
  possibleConditions: string[];
  severity: SeverityLevel;
  recommendedActions: string[];
}

// Symptom input validation schema
export const SymptomInputSchema = z.object({
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
  duration: z.enum(['hours', 'days', 'weeks', 'months']).optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
  patientHistory: z.array(z.string()).optional(),
  age: z.number().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional()
});

export type SymptomInput = z.infer<typeof SymptomInputSchema>;

// Diagnosis result interface
export interface DiagnosisResult {
  id: string;
  primaryCondition: string;
  confidence: number;
  differentialDiagnoses: string[];
  severity: SeverityLevel;
  recommendedActions: string[];
  urgencyLevel: 'routine' | 'soon' | 'urgent' | 'emergency';
  createdAt: Date;
}

// Symptom to condition mapping (simplified medical knowledge base)
const symptomConditionMap: Map<string, SymptomPattern[]> = new Map([
  ['fever', [
    {
      symptoms: ['fever', 'cough', 'fatigue'],
      possibleConditions: ['Common Cold', 'Flu', 'COVID-19'],
      severity: SeverityLevel.MODERATE,
      recommendedActions: ['Rest', 'Hydration', 'Monitor temperature', 'Consider COVID test']
    },
    {
      symptoms: ['fever', 'headache', 'stiff neck'],
      possibleConditions: ['Meningitis', 'Encephalitis'],
      severity: SeverityLevel.CRITICAL,
      recommendedActions: ['Seek immediate medical attention', 'Emergency evaluation']
    }
  ]],
  ['headache', [
    {
      symptoms: ['headache', 'nausea', 'sensitivity to light'],
      possibleConditions: ['Migraine', 'Tension Headache'],
      severity: SeverityLevel.MILD,
      recommendedActions: ['Rest in dark room', 'Over-counter pain relief', 'Hydration']
    },
    {
      symptoms: ['headache', 'sudden onset', 'confusion'],
      possibleConditions: ['Stroke', 'Brain Hemorrhage'],
      severity: SeverityLevel.CRITICAL,
      recommendedActions: ['Call emergency services', 'Do not delay']
    }
  ]],
  ['chest pain', [
    {
      symptoms: ['chest pain', 'shortness of breath', 'arm pain'],
      possibleConditions: ['Heart Attack', 'Angina'],
      severity: SeverityLevel.CRITICAL,
      recommendedActions: ['Call emergency services', 'Chew aspirin if not allergic', 'Stay calm']
    },
    {
      symptoms: ['chest pain', 'cough', 'fever'],
      possibleConditions: ['Pneumonia', 'Pleurisy'],
      severity: SeverityLevel.SEVERE,
      recommendedActions: ['Chest X-ray', 'Immediate doctor visit', 'Monitor oxygen levels']
    }
  ]],
  ['fatigue', [
    {
      symptoms: ['fatigue', 'weight gain', 'cold sensitivity'],
      possibleConditions: ['Hypothyroidism', 'Anemia'],
      severity: SeverityLevel.MODERATE,
      recommendedActions: ['Blood tests', 'Thyroid panel', 'Iron levels check']
    },
    {
      symptoms: ['fatigue', 'muscle weakness', 'joint pain'],
      possibleConditions: ['Fibromyalgia', 'Chronic Fatigue Syndrome'],
      severity: SeverityLevel.MODERATE,
      recommendedActions: ['Rheumatology referral', 'Lifestyle assessment']
    }
  ]]
]);

// Calculate confidence score based on symptom matching
function calculateConfidence(matchedSymptoms: number, totalPatterns: number): number {
  if (totalPatterns === 0) return 0;
  return Math.min(0.95, (matchedSymptoms / totalPatterns) * 0.8 + 0.2);
}

// Determine urgency level based on severity
function determineUrgency(severity: SeverityLevel): DiagnosisResult['urgencyLevel'] {
  switch (severity) {
    case SeverityLevel.CRITICAL:
      return 'emergency';
    case SeverityLevel.SEVERE:
      return 'urgent';
    case SeverityLevel.MODERATE:
      return 'soon';
    default:
      return 'routine';
  }
}

// Main diagnosis analysis function
export function analyzeSymptoms(input: SymptomInput): DiagnosisResult[] {
  const { symptoms, patientHistory = [], age, gender } = input;

  // Normalize symptoms to lowercase for matching
  const normalizedSymptoms = symptoms.map(s => s.toLowerCase().trim());

  const results: DiagnosisResult[] = [];
  const matchedConditions = new Set<string>();

  // Search symptom patterns
  for (const [keySymptom, patterns] of symptomConditionMap) {
    for (const pattern of patterns) {
      const matchedSymptoms = pattern.symptoms.filter(s =>
        normalizedSymptoms.some(ns => ns.includes(s) || s.includes(ns))
      );

      if (matchedSymptoms.length > 0) {
        for (const condition of pattern.possibleConditions) {
          if (!matchedConditions.has(condition)) {
            matchedConditions.add(condition);

            // Adjust severity based on patient factors
            let adjustedSeverity = pattern.severity;
            if (age && (age < 5 || age > 65) && pattern.severity === SeverityLevel.MODERATE) {
              adjustedSeverity = SeverityLevel.SEVERE;
            }

            results.push({
              id: `dx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              primaryCondition: condition,
              confidence: calculateConfidence(matchedSymptoms.length, pattern.symptoms.length),
              differentialDiagnoses: pattern.possibleConditions.filter(c => c !== condition),
              severity: adjustedSeverity,
              recommendedActions: pattern.recommendedActions,
              urgencyLevel: determineUrgency(adjustedSeverity),
              createdAt: new Date()
            });
          }
        }
      }
    }
  }

  // If no specific patterns matched, return general assessment
  if (results.length === 0) {
    const generalSeverity = input.severity
      ? SeverityLevel[input.severity.toUpperCase() as keyof typeof SeverityLevel]
      : SeverityLevel.MODERATE;

    results.push({
      id: `dx-${Date.now()}-general`,
      primaryCondition: 'General Assessment Required',
      confidence: 0.3,
      differentialDiagnoses: [],
      severity: generalSeverity,
      recommendedActions: ['Consult with healthcare provider', 'Document all symptoms', 'Monitor condition'],
      urgencyLevel: determineUrgency(generalSeverity),
      createdAt: new Date()
    });
  }

  // Sort by confidence (highest first)
  return results.sort((a, b) => b.confidence - a.confidence);
}

// Get symptom synonyms for better matching
export function getSymptomSynonyms(symptom: string): string[] {
  const synonyms: Record<string, string[]> = {
    'fever': ['high temperature', 'pyrexia', 'febrile', 'elevated temperature'],
    'headache': ['head pain', 'cephalgia', 'migraine', 'head ache'],
    'cough': ['coughing', 'dry cough', 'productive cough'],
    'fatigue': ['tiredness', 'exhaustion', 'lethargy', 'weakness', 'malaise'],
    'nausea': ['feeling sick', 'queasy', 'upset stomach'],
    'chest pain': ['chest discomfort', 'angina', 'tightness in chest'],
    'shortness of breath': ['dyspnea', 'breathlessness', 'difficulty breathing'],
    'dizziness': ['vertigo', 'lightheaded', 'giddiness']
  };

  const lowerSymptom = symptom.toLowerCase();
  return synonyms[lowerSymptom] || [];
}

// Health risk factor analysis
export interface RiskFactor {
  category: string;
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export function analyzeRiskFactors(patientData: {
  age?: number;
  gender?: string;
  medicalHistory: string[];
  lifestyleFactors: string[];
}): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Age-based risk factors
  if (patientData.age) {
    if (patientData.age > 65) {
      factors.push({
        category: 'Age',
        factor: 'Senior Citizen',
        impact: 'negative',
        description: 'Increased risk for cardiovascular and respiratory conditions'
      });
    } else if (patientData.age < 18) {
      factors.push({
        category: 'Age',
        factor: 'Minor',
        impact: 'negative',
        description: 'Pediatric care considerations required'
      });
    }
  }

  // Medical history factors
  for (const history of patientData.medicalHistory) {
    const lowerHistory = history.toLowerCase();
    if (lowerHistory.includes('diabetes')) {
      factors.push({
        category: 'Medical History',
        factor: 'Diabetes',
        impact: 'negative',
        description: 'Increased infection risk, wound healing complications'
      });
    }
    if (lowerHistory.includes('hypertension') || lowerHistory.includes('high blood pressure')) {
      factors.push({
        category: 'Medical History',
        factor: 'Hypertension',
        impact: 'negative',
        description: 'Cardiovascular risk factor, monitor regularly'
      });
    }
    if (lowerHistory.includes('asthma')) {
      factors.push({
        category: 'Medical History',
        factor: 'Asthma',
        impact: 'negative',
        description: 'Respiratory sensitivity, emergency inhaler recommended'
      });
    }
  }

  // Lifestyle factors
  for (const lifestyle of patientData.lifestyleFactors) {
    const lowerLifestyle = lifestyle.toLowerCase();
    if (lowerLifestyle.includes('smoking')) {
      factors.push({
        category: 'Lifestyle',
        factor: 'Smoking',
        impact: 'negative',
        description: 'Increased respiratory and cardiovascular risk'
      });
    }
    if (lowerLifestyle.includes('exercise') || lowerLifestyle.includes('active')) {
      factors.push({
        category: 'Lifestyle',
        factor: 'Regular Exercise',
        impact: 'positive',
        description: 'Reduces overall health risk factors'
      });
    }
  }

  return factors;
}

export const DiagnosisHelper = {
  analyzeSymptoms,
  getSymptomSynonyms,
  analyzeRiskFactors,
  SymptomInputSchema
};
