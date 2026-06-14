import { z } from 'zod';
import { SeverityLevel } from './DiagnosisHelper';

// Treatment type categories
export enum TreatmentType {
  MEDICATION = 'medication',
  THERAPY = 'therapy',
  LIFESTYLE = 'lifestyle',
  PROCEDURE = 'procedure',
  REFERRAL = 'referral',
  HOME_CARE = 'home_care'
}

// Treatment recommendation interface
export interface TreatmentRecommendation {
  id: string;
  type: TreatmentType;
  name: string;
  description: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  duration: string;
  contraindications: string[];
  sideEffects: string[];
  effectiveness: number; // 0-100%
  costLevel: 'low' | 'medium' | 'high';
  followUpRequired: boolean;
  followUpTimeline?: string;
}

// Treatment request schema
export const TreatmentRequestSchema = z.object({
  condition: z.string().min(1, 'Condition is required'),
  diagnosisId: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']),
  patientFactors: z.object({
    age: z.number().optional(),
    allergies: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    pregnancyStatus: z.boolean().optional(),
    chronicConditions: z.array(z.string()).optional()
  }).optional()
});

export type TreatmentRequest = z.infer<typeof TreatmentRequestSchema>;

// Evidence-based treatment protocols (simplified medical knowledge base)
interface TreatmentProtocol {
  condition: string[];
  recommendations: Omit<TreatmentRecommendation, 'id'>[];
}

const treatmentProtocols: TreatmentProtocol[] = [
  {
    condition: ['Common Cold', 'Upper Respiratory Infection', 'Viral Infection'],
    recommendations: [
      {
        type: TreatmentType.MEDICATION,
        name: 'Acetaminophen/Ibuprofen',
        description: 'Over-the-counter pain relievers and fever reducers',
        priority: 'immediate',
        duration: '7-10 days',
        contraindications: ['Liver disease (acetaminophen)', 'Kidney disease (ibuprofen)', 'Stomach ulcers'],
        sideEffects: ['Nausea', 'Stomach upset', 'Drowsiness (some formulations)'],
        effectiveness: 75,
        costLevel: 'low',
        followUpRequired: false
      },
      {
        type: TreatmentType.HOME_CARE,
        name: 'Rest and Hydration',
        description: 'Adequate rest and fluid intake to support immune system',
        priority: 'immediate',
        duration: 'Until symptoms resolve',
        contraindications: [],
        sideEffects: [],
        effectiveness: 80,
        costLevel: 'low',
        followUpRequired: false
      },
      {
        type: TreatmentType.LIFESTYLE,
        name: 'Honey and Warm Liquids',
        description: 'Soothing remedies for sore throat and cough',
        priority: 'short_term',
        duration: 'Until symptoms resolve',
        contraindications: ['Honey allergy', 'Infants under 1 year'],
        sideEffects: [],
        effectiveness: 60,
        costLevel: 'low',
        followUpRequired: false
      }
    ]
  },
  {
    condition: ['Migraine', 'Tension Headache'],
    recommendations: [
      {
        type: TreatmentType.MEDICATION,
        name: 'Triptans or NSAIDs',
        description: 'Prescription or OTC migraine-specific medications',
        priority: 'immediate',
        duration: 'As needed during episodes',
        contraindications: ['Cardiovascular disease', 'Pregnancy', 'Liver/kidney impairment'],
        sideEffects: ['Dizziness', 'Nausea', 'Chest tightness (triptans)'],
        effectiveness: 85,
        costLevel: 'medium',
        followUpRequired: true,
        followUpTimeline: 'If headaches occur more than 4 times per month'
      },
      {
        type: TreatmentType.THERAPY,
        name: 'Cognitive Behavioral Therapy',
        description: 'Stress management and headache trigger identification',
        priority: 'long_term',
        duration: '8-12 sessions',
        contraindications: [],
        sideEffects: ['Initial emotional discomfort'],
        effectiveness: 70,
        costLevel: 'high',
        followUpRequired: true,
        followUpTimeline: 'After completion of therapy program'
      },
      {
        type: TreatmentType.LIFESTYLE,
        name: 'Trigger Avoidance',
        description: 'Identify and avoid personal migraine triggers',
        priority: 'long_term',
        duration: 'Ongoing',
        contraindications: [],
        sideEffects: [],
        effectiveness: 50,
        costLevel: 'low',
        followUpRequired: false
      }
    ]
  },
  {
    condition: ['Hypertension', 'High Blood Pressure'],
    recommendations: [
      {
        type: TreatmentType.MEDICATION,
        name: 'ACE Inhibitors/ARBs or Calcium Channel Blockers',
        description: 'First-line antihypertensive medications',
        priority: 'immediate',
        duration: 'Long-term/ongoing',
        contraindications: ['Pregnancy (some)', 'Kidney disease', 'Heart failure'],
        sideEffects: ['Cough (ACE-I)', 'Dizziness', 'Fatigue', 'Swelling'],
        effectiveness: 80,
        costLevel: 'medium',
        followUpRequired: true,
        followUpTimeline: '1-2 weeks after starting, then monthly until stable'
      },
      {
        type: TreatmentType.LIFESTYLE,
        name: 'DASH Diet',
        description: 'Dietary Approaches to Stop Hypertension eating plan',
        priority: 'short_term',
        duration: 'Ongoing',
        contraindications: [],
        sideEffects: [],
        effectiveness: 65,
        costLevel: 'medium',
        followUpRequired: false
      },
      {
        type: TreatmentType.LIFESTYLE,
        name: 'Regular Exercise',
        description: '150 minutes of moderate aerobic activity per week',
        priority: 'long_term',
        duration: 'Ongoing',
        contraindications: ['Uncontrolled hypertension'],
        sideEffects: [],
        effectiveness: 60,
        costLevel: 'low',
        followUpRequired: false
      },
      {
        type: TreatmentType.REFERRAL,
        name: 'Cardiology Consultation',
        description: 'Specialist evaluation for comprehensive management',
        priority: 'short_term',
        duration: 'One-time assessment',
        contraindications: [],
        sideEffects: [],
        effectiveness: 90,
        costLevel: 'high',
        followUpRequired: true,
        followUpTimeline: 'As recommended by cardiologist'
      }
    ]
  },
  {
    condition: ['Diabetes', 'Type 2 Diabetes', 'Pre-diabetes'],
    recommendations: [
      {
        type: TreatmentType.MEDICATION,
        name: 'Metformin or GLP-1 Agonists',
        description: 'First-line diabetes medications for blood sugar control',
        priority: 'immediate',
        duration: 'Long-term/ongoing',
        contraindications: ['Kidney disease (Metformin)', 'Pancreatitis history'],
        sideEffects: ['Nausea', 'Diarrhea', 'Weight loss (GLP-1)'],
        effectiveness: 85,
        costLevel: 'medium',
        followUpRequired: true,
        followUpTimeline: 'Every 3 months for HbA1c monitoring'
      },
      {
        type: TreatmentType.LIFESTYLE,
        name: 'Carbohydrate Counting and Diet Management',
        description: 'Structured meal planning with glycemic index awareness',
        priority: 'immediate',
        duration: 'Ongoing',
        contraindications: [],
        sideEffects: [],
        effectiveness: 75,
        costLevel: 'low',
        followUpRequired: false
      },
      {
        type: TreatmentType.REFERRAL,
        name: 'Endocrinology Consultation',
        description: 'Specialist for complex diabetes management',
        priority: 'short_term',
        duration: 'Ongoing care',
        contraindications: [],
        sideEffects: [],
        effectiveness: 90,
        costLevel: 'high',
        followUpRequired: true,
        followUpTimeline: 'Initial consultation, then as needed'
      },
      {
        type: TreatmentType.THERAPY,
        name: 'Diabetes Education Program',
        description: 'Self-management training and support',
        priority: 'short_term',
        duration: 'Initial program plus ongoing',
        contraindications: [],
        sideEffects: [],
        effectiveness: 70,
        costLevel: 'medium',
        followUpRequired: true,
        followUpTimeline: 'Annual refresher'
      }
    ]
  },
  {
    condition: ['Anxiety', 'Generalized Anxiety Disorder'],
    recommendations: [
      {
        type: TreatmentType.MEDICATION,
        name: 'SSRIs or SNRIs',
        description: 'First-line antidepressants for anxiety management',
        priority: 'short_term',
        duration: '6-12 months minimum, may be longer',
        contraindications: ['MAOIs concurrent use', 'Bipolar disorder', 'Pregnancy (some)'],
        sideEffects: ['Nausea', 'Insomnia', 'Sexual dysfunction', 'Initial anxiety increase'],
        effectiveness: 75,
        costLevel: 'medium',
        followUpRequired: true,
        followUpTimeline: 'Weekly for first month, then monthly'
      },
      {
        type: TreatmentType.THERAPY,
        name: 'Cognitive Behavioral Therapy (CBT)',
        description: 'Evidence-based psychotherapy for anxiety',
        priority: 'short_term',
        duration: '12-16 sessions',
        contraindications: [],
        sideEffects: [],
        effectiveness: 80,
        costLevel: 'high',
        followUpRequired: true,
        followUpTimeline: 'After completion, as needed'
      },
      {
        type: TreatmentType.LIFESTYLE,
        name: 'Mindfulness and Relaxation Techniques',
        description: 'Daily meditation, deep breathing, progressive muscle relaxation',
        priority: 'long_term',
        duration: 'Ongoing daily practice',
        contraindications: [],
        sideEffects: [],
        effectiveness: 55,
        costLevel: 'low',
        followUpRequired: false
      }
    ]
  }
];

// Generate unique ID
function generateId(): string {
  return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Check contraindications based on patient factors
function checkContraindications(
  recommendation: Omit<TreatmentRecommendation, 'id'>,
  patientFactors?: TreatmentRequest['patientFactors']
): string[] {
  const warnings: string[] = [];

  if (!patientFactors) return warnings;

  // Check allergies
  if (patientFactors.allergies) {
    for (const allergy of patientFactors.allergies) {
      if (recommendation.contraindications.some(c =>
        c.toLowerCase().includes(allergy.toLowerCase())
      )) {
        warnings.push(`Allergy concern: ${allergy}`);
      }
    }
  }

  // Check pregnancy
  if (patientFactors.pregnancyStatus && recommendation.contraindications.includes('Pregnancy (some)')) {
    warnings.push('Consult physician before use during pregnancy');
  }

  // Check chronic conditions
  if (patientFactors.chronicConditions) {
    for (const condition of patientFactors.chronicConditions) {
      if (recommendation.contraindications.some(c =>
        c.toLowerCase().includes(condition.toLowerCase())
      )) {
        warnings.push(`Contraindicated with: ${condition}`);
      }
    }
  }

  return warnings;
}

// Main treatment recommendation function
export function getTreatmentRecommendations(request: TreatmentRequest): TreatmentRecommendation[] {
  const { condition, severity, patientFactors } = request;
  const lowerCondition = condition.toLowerCase();

  let matchedProtocols = treatmentProtocols.filter(protocol =>
    protocol.condition.some(c => lowerCondition.includes(c.toLowerCase()))
  );

  // If no exact match, return general wellness recommendations
  if (matchedProtocols.length === 0) {
    matchedProtocols = [treatmentProtocols[0]]; // Default to general wellness
  }

  const recommendations: TreatmentRecommendation[] = [];

  for (const protocol of matchedProtocols) {
    for (const rec of protocol.recommendations) {
      const contraindications = [
        ...rec.contraindications,
        ...checkContraindications(rec, patientFactors)
      ];

      // Adjust priority based on severity
      let adjustedPriority = rec.priority;
      if (severity === 'severe' || severity === 'critical') {
        if (rec.priority === 'long_term') {
          adjustedPriority = 'short_term';
        }
      }

      recommendations.push({
        id: generateId(),
        type: rec.type,
        name: rec.name,
        description: rec.description,
        priority: adjustedPriority,
        duration: rec.duration,
        contraindications,
        sideEffects: rec.sideEffects,
        effectiveness: rec.effectiveness,
        costLevel: rec.costLevel,
        followUpRequired: rec.followUpRequired,
        followUpTimeline: rec.followUpTimeline
      });
    }
  }

  // Sort by priority and effectiveness
  const priorityOrder = { immediate: 0, short_term: 1, long_term: 2 };
  return recommendations.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.effectiveness - a.effectiveness;
  });
}

// Generate medication schedule
export interface MedicationSchedule {
  medication: string;
  dosage: string;
  frequency: string;
  times: string[];
  withFood: boolean;
  notes: string;
}

export function generateMedicationSchedule(
  recommendation: TreatmentRecommendation
): MedicationSchedule | null {
  if (recommendation.type !== TreatmentType.MEDICATION) {
    return null;
  }

  const schedules: Record<string, { frequency: string; times: string[]; withFood: boolean }> = {
    'once daily': { frequency: 'Once daily', times: ['Morning'], withFood: true },
    'twice daily': { frequency: 'Twice daily', times: ['Morning', 'Evening'], withFood: true },
    'three times daily': { frequency: 'Three times daily', times: ['Morning', 'Afternoon', 'Evening'], withFood: true },
    'as needed': { frequency: 'As needed', times: [], withFood: false }
  };

  const scheduleKey = recommendation.duration.toLowerCase().includes('as needed')
    ? 'as needed'
    : 'once daily';

  const schedule = schedules[scheduleKey] || schedules['once daily'];

  return {
    medication: recommendation.name,
    dosage: 'As prescribed',
    frequency: schedule.frequency,
    times: schedule.times,
    withFood: schedule.withFood,
    notes: recommendation.sideEffects.length > 0
      ? `Watch for: ${recommendation.sideEffects.join(', ')}`
      : 'Follow prescribing physician instructions'
  };
}

// Treatment adherence tracking
export interface AdherenceMetrics {
  medicationId: string;
  dosesTaken: number;
  dosesMissed: number;
  adherenceRate: number;
  lastTaken: Date | null;
}

export function calculateAdherence(
  medicationId: string,
  dosesTaken: number,
  totalDoses: number
): AdherenceMetrics {
  const dosesMissed = totalDoses - dosesTaken;
  const adherenceRate = totalDoses > 0 ? (dosesTaken / totalDoses) * 100 : 0;

  return {
    medicationId,
    dosesTaken,
    dosesMissed,
    adherenceRate: Math.round(adherenceRate * 10) / 10,
    lastTaken: dosesTaken > 0 ? new Date() : null
  };
}

export const TreatmentRecommendations = {
  getTreatmentRecommendations,
  generateMedicationSchedule,
  calculateAdherence,
  TreatmentRequestSchema,
  TreatmentType
};
