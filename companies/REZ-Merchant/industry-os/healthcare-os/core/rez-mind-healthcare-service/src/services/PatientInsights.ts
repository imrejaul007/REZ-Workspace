import { z } from 'zod';
import { addDays, subDays, format, differenceInDays } from 'date-fns';

// Risk score categories
export enum RiskCategory {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Insight types
export enum InsightType {
  RISK_ASSESSMENT = 'risk_assessment',
  TREND_ANALYSIS = 'trend_analysis',
  PREVENTIVE_CARE = 'preventive_care',
  MEDICATION_ALERT = 'medication_alert',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  WELLNESS_SUGGESTION = 'wellness_suggestion',
  LAB_RESULT_ALERT = 'lab_result_alert',
  HEALTH_ALERT = 'health_alert'
}

// Patient insight interface
export interface PatientInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  riskCategory: RiskCategory;
  actionRequired: boolean;
  recommendedAction?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  generatedAt: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

// Patient risk score interface
export interface RiskScore {
  overallScore: number; // 0-100
  category: RiskCategory;
  factors: {
    name: string;
    contribution: number;
    trend: 'improving' | 'stable' | 'worsening';
  }[];
  lastUpdated: Date;
  nextReviewDate: Date;
}

// Health metrics tracking
export interface HealthMetric {
  type: string;
  value: number;
  unit: string;
  recordedAt: Date;
  source: 'manual' | 'device' | 'lab';
}

// Vital signs interface
export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

// BMI calculation
function calculateBMI(weight: number, height: number): number {
  // Height in cm, weight in kg
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
}

// Risk score input schema
export const RiskScoreInputSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  age: z.number().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']),
  vitals: z.object({
    bloodPressureSystolic: z.number().optional(),
    bloodPressureDiastolic: z.number().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  medicalHistory: z.array(z.object({
    condition: z.string(),
    diagnosedDate: z.string().optional(),
    status: z.enum(['active', 'managed', 'resolved'])
  })).optional(),
  familyHistory: z.array(z.string()).optional(),
  lifestyleFactors: z.object({
    smokingStatus: z.enum(['never', 'former', 'current']).optional(),
    alcoholUse: z.enum(['none', 'moderate', 'heavy']).optional(),
    exerciseFrequency: z.enum(['sedentary', 'light', 'moderate', 'active']).optional(),
    sleepHours: z.number().optional()
  }).optional(),
  labResults: z.object({
    cholesterolTotal: z.number().optional(),
    cholesterolLDL: z.number().optional(),
    cholesterolHDL: z.number().optional(),
    triglycerides: z.number().optional(),
    fastingGlucose: z.number().optional(),
    hba1c: z.number().optional()
  }).optional()
});

export type RiskScoreInput = z.infer<typeof RiskScoreInputSchema>;

// Calculate cardiovascular risk score
function calculateCardiovascularRisk(input: RiskScoreInput): { score: number; factors: RiskScore['factors'] } {
  let score = 0;
  const factors: RiskScore['factors'] = [];

  // Age factor
  let ageScore = 0;
  if (input.age > 65) ageScore = 25;
  else if (input.age > 55) ageScore = 15;
  else if (input.age > 45) ageScore = 10;
  else ageScore = 5;
  score += ageScore;
  factors.push({ name: 'Age', contribution: ageScore, trend: 'stable' });

  // Blood pressure factor
  if (input.vitals?.bloodPressureSystolic) {
    let bpScore = 0;
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';

    if (input.vitals.bloodPressureSystolic > 180) {
      bpScore = 30;
      trend = 'worsening';
    } else if (input.vitals.bloodPressureSystolic > 140) {
      bpScore = 20;
      trend = 'worsening';
    } else if (input.vitals.bloodPressureSystolic > 130) {
      bpScore = 10;
      trend = 'stable';
    } else if (input.vitals.bloodPressureSystolic > 90) {
      bpScore = 0;
      trend = 'improving';
    }

    score += bpScore;
    factors.push({ name: 'Blood Pressure', contribution: bpScore, trend });
  }

  // Cholesterol factor
  if (input.labResults?.cholesterolTotal && input.labResults?.cholesterolHDL) {
    const ratio = input.labResults.cholesterolTotal / input.labResults.cholesterolHDL;
    let cholScore = 0;

    if (ratio > 6) cholScore = 20;
    else if (ratio > 5) cholScore = 15;
    else if (ratio > 4) cholScore = 10;
    else cholScore = 5;

    score += cholScore;
    factors.push({ name: 'Cholesterol Ratio', contribution: cholScore, trend: 'stable' });
  }

  // Diabetes risk
  if (input.labResults?.hba1c && input.labResults.hba1c > 6.5) {
    score += 25;
    factors.push({ name: 'Diabetes (HbA1c)', contribution: 25, trend: 'stable' });
  } else if (input.labResults?.fastingGlucose && input.labResults.fastingGlucose > 126) {
    score += 20;
    factors.push({ name: 'Prediabetes', contribution: 20, trend: 'stable' });
  }

  // BMI factor
  if (input.vitals?.weight && input.vitals?.height) {
    const bmi = calculateBMI(input.vitals.weight, input.vitals.height);
    let bmiScore = 0;

    if (bmi > 35) bmiScore = 15;
    else if (bmi > 30) bmiScore = 10;
    else if (bmi > 25) bmiScore = 5;

    if (bmiScore > 0) {
      score += bmiScore;
      factors.push({ name: 'BMI', contribution: bmiScore, trend: 'stable' });
    }
  }

  // Lifestyle factors
  if (input.lifestyleFactors) {
    const { smokingStatus, exerciseFrequency } = input.lifestyleFactors;

    if (smokingStatus === 'current') {
      score += 20;
      factors.push({ name: 'Smoking', contribution: 20, trend: 'worsening' });
    } else if (smokingStatus === 'former') {
      score += 10;
      factors.push({ name: 'Smoking History', contribution: 10, trend: 'improving' });
    }

    if (exerciseFrequency === 'sedentary') {
      score += 10;
      factors.push({ name: 'Physical Inactivity', contribution: 10, trend: 'stable' });
    }
  }

  // Family history factor
  if (input.familyHistory) {
    const cardiovascularHistory = input.familyHistory.filter(h =>
      h.toLowerCase().includes('heart') ||
      h.toLowerCase().includes('cardiac') ||
      h.toLowerCase().includes('stroke')
    );
    if (cardiovascularHistory.length > 0) {
      score += 15;
      factors.push({ name: 'Family History (Cardiovascular)', contribution: 15, trend: 'stable' });
    }
  }

  return { score: Math.min(100, score), factors };
}

// Get risk category from score
function getRiskCategory(score: number): RiskCategory {
  if (score < 25) return RiskCategory.LOW;
  if (score < 50) return RiskCategory.MODERATE;
  if (score < 75) return RiskCategory.HIGH;
  return RiskCategory.CRITICAL;
}

// Calculate overall risk score
export function calculateRiskScore(input: RiskScoreInput): RiskScore {
  const cvRisk = calculateCardiovascularRisk(input);

  const overallScore = Math.min(100, cvRisk.score);
  const category = getRiskCategory(overallScore);

  return {
    overallScore,
    category,
    factors: cvRisk.factors,
    lastUpdated: new Date(),
    nextReviewDate: addDays(new Date(), category === RiskCategory.LOW ? 90 : 30)
  };
}

// Generate patient insights based on risk score and health data
export function generatePatientInsights(input: RiskScoreInput): PatientInsight[] {
  const insights: PatientInsight[] = [];
  const riskScore = calculateRiskScore(input);

  // Risk assessment insight
  if (riskScore.category !== RiskCategory.LOW) {
    insights.push({
      id: `insight-${Date.now()}-risk`,
      type: InsightType.RISK_ASSESSMENT,
      title: `Overall ${riskScore.category.toUpperCase()} Risk Profile`,
      description: `Based on ${riskScore.factors.length} contributing factors, your overall health risk score is ${riskScore.overallScore}/100.`,
      riskCategory: riskScore.category,
      actionRequired: riskScore.category === RiskCategory.HIGH || riskScore.category === RiskCategory.CRITICAL,
      recommendedAction: riskScore.category === RiskCategory.CRITICAL
        ? 'Schedule immediate consultation with primary care physician'
        : 'Consider scheduling a comprehensive health evaluation',
      priority: riskScore.category === RiskCategory.CRITICAL ? 'urgent'
        : riskScore.category === RiskCategory.HIGH ? 'high' : 'medium',
      generatedAt: new Date(),
      validUntil: addDays(new Date(), 30)
    });
  }

  // Blood pressure insights
  if (input.vitals?.bloodPressureSystolic) {
    const systolic = input.vitals.bloodPressureSystolic;
    const diastolic = input.vitals.bloodPressureDiastolic;

    if (systolic > 140 || (diastolic && diastolic > 90)) {
      insights.push({
        id: `insight-${Date.now()}-bp`,
        type: InsightType.HEALTH_ALERT || InsightType.RISK_ASSESSMENT,
        title: 'Elevated Blood Pressure Detected',
        description: `Your blood pressure reading of ${systolic}/${diastolic || '?'} mmHg is above normal range.`,
        riskCategory: systolic > 180 ? RiskCategory.CRITICAL : RiskCategory.HIGH,
        actionRequired: true,
        recommendedAction: 'Monitor daily and consult physician if consistently elevated',
        priority: systolic > 180 ? 'urgent' : 'high',
        generatedAt: new Date(),
        validUntil: addDays(new Date(), 7)
      });
    }
  }

  // Preventive care reminders based on age
  if (input.age > 50) {
    insights.push({
      id: `insight-${Date.now()}-preventive`,
      type: InsightType.PREVENTIVE_CARE,
      title: 'Colorectal Cancer Screening Due',
      description: 'Regular screening is recommended for adults aged 50-75.',
      riskCategory: RiskCategory.MODERATE,
      actionRequired: true,
      recommendedAction: 'Discuss screening options with your physician',
      priority: 'medium',
      generatedAt: new Date(),
      validUntil: addDays(new Date(), 60)
    });
  }

  // Heart health insights
  if (riskScore.factors.some(f => f.name === 'Physical Inactivity')) {
    insights.push({
      id: `insight-${Date.now()}-exercise`,
      type: InsightType.WELLNESS_SUGGESTION,
      title: 'Increase Physical Activity',
      description: 'Regular exercise can reduce cardiovascular risk by up to 30%.',
      riskCategory: RiskCategory.MODERATE,
      actionRequired: false,
      recommendedAction: 'Start with 150 minutes of moderate exercise per week',
      priority: 'low',
      generatedAt: new Date(),
      validUntil: addDays(new Date(), 90)
    });
  }

  // Diabetes screening reminder
  if (input.age > 45 && !input.labResults?.hba1c && !input.labResults?.fastingGlucose) {
    insights.push({
      id: `insight-${Date.now()}-diabetes-screen`,
      type: InsightType.PREVENTIVE_CARE,
      title: 'Diabetes Screening Recommended',
      description: 'Adults aged 45+ should be screened for diabetes every 3 years.',
      riskCategory: RiskCategory.MODERATE,
      actionRequired: true,
      recommendedAction: 'Request HbA1c or fasting glucose test at your next visit',
      priority: 'medium',
      generatedAt: new Date(),
      validUntil: addDays(new Date(), 180)
    });
  }

  // Lifestyle insights
  if (input.lifestyleFactors?.smokingStatus === 'current') {
    insights.push({
      id: `insight-${Date.now()}-smoking`,
      type: InsightType.WELLNESS_SUGGESTION,
      title: 'Smoking Cessation Support',
      description: 'Quitting smoking is the single most effective way to improve your health.',
      riskCategory: RiskCategory.HIGH,
      actionRequired: true,
      recommendedAction: 'Consider nicotine replacement therapy or cessation programs',
      priority: 'high',
      generatedAt: new Date(),
      validUntil: addDays(new Date(), 365)
    });
  }

  return insights;
}

// Appointment reminder interface
export interface AppointmentReminder {
  id: string;
  patientId: string;
  appointmentType: string;
  recommendedTiming: 'immediate' | 'soon' | 'routine';
  reason: string;
  suggestedSpecialist?: string;
  generatedAt: Date;
  reminderDate: Date;
}

export function generateAppointmentReminders(input: RiskScoreInput): AppointmentReminder[] {
  const reminders: AppointmentReminder[] = [];
  const riskScore = calculateRiskScore(input);

  // Primary care checkup based on risk
  const timing: 'immediate' | 'soon' | 'routine' =
    riskScore.category === RiskCategory.CRITICAL ? 'immediate' :
    riskScore.category === RiskCategory.HIGH ? 'soon' : 'routine';

  reminders.push({
    id: `reminder-${Date.now()}-pcp`,
    patientId: input.patientId,
    appointmentType: 'Primary Care Checkup',
    recommendedTiming: timing,
    reason: riskScore.category === RiskCategory.LOW
      ? 'Routine preventive care'
      : `Follow-up for ${riskScore.category} risk factors`,
    generatedAt: new Date(),
    reminderDate: riskScore.category === RiskCategory.LOW
      ? addDays(new Date(), 90)
      : addDays(new Date(), 7)
  });

  // Cardiology referral for high cardiovascular risk
  if (riskScore.factors.some(f => f.name === 'Blood Pressure' && f.contribution > 15)) {
    reminders.push({
      id: `reminder-${Date.now()}-cardio`,
      patientId: input.patientId,
      appointmentType: 'Cardiology Consultation',
      recommendedTiming: riskScore.factors.find(f => f.name === 'Blood Pressure')?.trend === 'worsening'
        ? 'immediate' : 'soon',
      reason: 'Elevated blood pressure requires cardiac evaluation',
      suggestedSpecialist: 'Cardiologist',
      generatedAt: new Date(),
      reminderDate: riskScore.factors.find(f => f.name === 'Blood Pressure')?.trend === 'worsening'
        ? new Date()
        : addDays(new Date(), 14)
    });
  }

  return reminders;
}

// Health trend analysis
export interface HealthTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'worsening';
  change: number;
  period: string;
  notes: string;
}

export function analyzeHealthTrends(
  historicalMetrics: HealthMetric[],
  currentMetrics: HealthMetric[]
): HealthTrend[] {
  const trends: HealthTrend[] = [];

  const groupedHistorical = historicalMetrics.reduce((acc, metric) => {
    if (!acc[metric.type]) acc[metric.type] = [];
    acc[metric.type].push(metric);
    return acc;
  }, {} as Record<string, HealthMetric[]>);

  for (const current of currentMetrics) {
    const historical = groupedHistorical[current.type];
    if (!historical || historical.length === 0) continue;

    const oldest = historical[0];
    const daysDiff = differenceInDays(current.recordedAt, oldest.recordedAt);

    if (daysDiff < 7) continue; // Need at least a week of data

    const avgHistorical = historical.reduce((sum, m) => sum + m.value, 0) / historical.length;
    const change = ((current.value - avgHistorical) / avgHistorical) * 100;

    let direction: 'improving' | 'stable' | 'worsening';
    if (Math.abs(change) < 5) {
      direction = 'stable';
    } else if (change < 0) {
      // For most metrics, lower is better
      direction = current.type.includes('weight') || current.type.includes('bloodPressure')
        ? 'improving' : 'worsening';
    } else {
      direction = current.type.includes('weight') || current.type.includes('bloodPressure')
        ? 'worsening' : 'improving';
    }

    trends.push({
      metric: current.type,
      direction,
      change: Math.round(change * 10) / 10,
      period: `${daysDiff} days`,
      notes: direction === 'stable'
        ? 'Values are within normal variation'
        : direction === 'improving'
        ? `Improved by ${Math.abs(change).toFixed(1)}%`
        : `Worsened by ${Math.abs(change).toFixed(1)}%`
    });
  }

  return trends;
}

export const PatientInsights = {
  calculateRiskScore,
  generatePatientInsights,
  generateAppointmentReminders,
  analyzeHealthTrends,
  RiskScoreInputSchema,
  RiskCategory,
  InsightType
};
