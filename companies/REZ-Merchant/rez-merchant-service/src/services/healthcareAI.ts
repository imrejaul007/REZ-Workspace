/**
 * Healthcare AI Service
 *
 * Extends AIService with healthcare-specific AI capabilities:
 * - Diagnosis suggestions based on symptoms
 * - Patient risk scoring
 * - Appointment optimization
 * - Treatment recommendations
 */

import axios from 'axios';
import { logger } from '../config/logger';
import { aiService, AIService } from './aiService';

// ML Service URL for healthcare endpoints
const HEALTHCARE_ML_URL = process.env.HEALTHCARE_ML_SERVICE_URL || process.env.ML_SERVICE_URL || 'http://localhost:4001';

// ── Healthcare-Specific Types ───────────────────────────────────────────────────

export interface SymptomInput {
  symptom: string;
  severity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  bodyArea?: string;
}

export interface DiagnosisSuggestion {
  condition: string;
  probability: number;
  urgency: 'routine' | 'urgent' | 'emergency';
  recommendedAction: string;
  specialistReferral?: string;
  additionalTests?: string[];
}

export interface RiskAssessment {
  patientId: string;
  overallRiskScore: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    contribution: number;
    description: string;
  }>;
  recommendations: string[];
  followUpRecommended: boolean;
  followUpTimeframe?: string;
}

export interface AppointmentSlot {
  startTime: Date;
  endTime: Date;
  doctorId?: string;
  doctorName?: string;
  department: string;
  duration: number;
  isAvailable: boolean;
  slotType: 'in_person' | 'telehealth' | 'home_visit';
}

export interface AppointmentOptimization {
  optimizedSchedule: AppointmentSlot[];
  totalDuration: number;
  conflicts: string[];
  suggestions: string[];
}

// ── Service Class ─────────────────────────────────────────────────────────────────

export class HealthcareAIService extends AIService {
  private healthcareMlUrl = HEALTHCARE_ML_URL;

  /**
   * Get diagnosis suggestions based on symptoms
   */
  async getDiagnosisSuggestions(symptoms: string[]): Promise<DiagnosisSuggestion[]> {
    try {
      const symptomInputs: SymptomInput[] = symptoms.map(s => ({
        symptom: s,
        severity: 'moderate',
      }));

      const res = await axios.post(
        `${this.healthcareMlUrl}/api/healthcare/diagnosis`,
        { symptoms: symptomInputs },
        { timeout: 10000 }
      );

      return res.data.diagnoses || [];
    } catch (error) {
      logger.error('[HealthcareAI] getDiagnosisSuggestions failed:', {
        symptoms,
        error: error.message,
      });

      // Return basic suggestions based on symptom matching
      return this.generateBasicDiagnosisSuggestions(symptoms);
    }
  }

  /**
   * Get patient risk score
   */
  async getPatientRiskScore(patientId: string): Promise<RiskAssessment> {
    try {
      const res = await axios.get(
        `${this.healthcareMlUrl}/api/healthcare/risk/${patientId}`,
        { timeout: 5000 }
      );

      return res.data;
    } catch (error) {
      logger.error('[HealthcareAI] getPatientRiskScore failed:', {
        patientId,
        error: error.message,
      });

      // Return basic risk assessment
      return this.generateBasicRiskAssessment(patientId);
    }
  }

  /**
   * Get appointment optimization for a schedule
   */
  async getAppointmentOptimization(
    schedule: Array<{
      date: Date;
      duration: number;
      type: string;
      department?: string;
    }>
  ): Promise<AppointmentOptimization> {
    try {
      const res = await axios.post(
        `${this.healthcareMlUrl}/api/healthcare/appointments/optimize`,
        { schedule },
        { timeout: 8000 }
      );

      return res.data;
    } catch (error) {
      logger.error('[HealthcareAI] getAppointmentOptimization failed:', {
        scheduleLength: schedule.length,
        error: error.message,
      });

      // Return basic optimization
      return this.generateBasicAppointmentOptimization(schedule);
    }
  }

  /**
   * Get treatment recommendations based on diagnosis
   */
  async getTreatmentRecommendations(
    diagnosis: string,
    patientHistory?: unknown
  ): Promise<Array<{
    treatment: string;
    description: string;
    efficacy: number;
    sideEffects?: string[];
    alternatives?: string[];
  }>> {
    try {
      const res = await axios.post(
        `${this.healthcareMlUrl}/api/healthcare/treatments`,
        { diagnosis, patientHistory },
        { timeout: 8000 }
      );

      return res.data.treatments || [];
    } catch (error) {
      logger.error('[HealthcareAI] getTreatmentRecommendations failed:', {
        diagnosis,
        error: error.message,
      });

      return [];
    }
  }

  /**
   * Get drug interaction check
   */
  async checkDrugInteractions(
    medications: string[]
  ): Promise<Array<{
    drug1: string;
    drug2: string;
    severity: 'low' | 'moderate' | 'high';
    description: string;
    recommendation: string;
  }>> {
    try {
      const res = await axios.post(
        `${this.healthcareMlUrl}/api/healthcare/drug-interactions`,
        { medications },
        { timeout: 5000 }
      );

      return res.data.interactions || [];
    } catch (error) {
      logger.error('[HealthcareAI] checkDrugInteractions failed:', {
        medications,
        error: error.message,
      });

      return [];
    }
  }

  /**
   * Predict patient no-show probability
   */
  async predictNoShowProbability(
    patientId: string,
    appointmentDate: Date
  ): Promise<{
    probability: number;
    riskFactors: string[];
    recommendedActions: string[];
  }> {
    try {
      const res = await axios.post(
        `${this.healthcareMlUrl}/api/healthcare/no-show-predict`,
        { patientId, appointmentDate },
        { timeout: 5000 }
      );

      return res.data;
    } catch (error) {
      logger.error('[HealthcareAI] predictNoShowProbability failed:', {
        patientId,
        error: error.message,
      });

      return {
        probability: 0.1,
        riskFactors: [],
        recommendedActions: ['Send reminder 24 hours before appointment'],
      };
    }
  }

  /**
   * Get readmission risk prediction
   */
  async predictReadmissionRisk(patientId: string): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'moderate' | 'high';
    factors: string[];
    interventions: string[];
  }> {
    try {
      const res = await axios.get(
        `${this.healthcareMlUrl}/api/healthcare/readmission-risk/${patientId}`,
        { timeout: 5000 }
      );

      return res.data;
    } catch (error) {
      logger.error('[HealthcareAI] predictReadmissionRisk failed:', {
        patientId,
        error: error.message,
      });

      return {
        riskScore: 0,
        riskLevel: 'low',
        factors: [],
        interventions: [],
      };
    }
  }

  /**
   * Generate basic diagnosis suggestions without ML service
   */
  private generateBasicDiagnosisSuggestions(symptoms: string[]): DiagnosisSuggestion[] {
    const symptomLower = symptoms.map(s => s.toLowerCase());

    // Basic symptom-to-condition mapping
    const mappings: Record<string, DiagnosisSuggestion> = {
      fever: {
        condition: 'Viral Infection',
        probability: 0.7,
        urgency: 'routine',
        recommendedAction: 'Rest and hydration. Consult if fever exceeds 101F for more than 3 days.',
        additionalTests: ['CBC', '体温监测'],
      },
      cough: {
        condition: 'Upper Respiratory Infection',
        probability: 0.6,
        urgency: 'routine',
        recommendedAction: 'Rest, warm fluids. Consult if persistent beyond 2 weeks.',
        additionalTests: ['Chest X-ray if persistent'],
      },
      headache: {
        condition: 'Tension Headache',
        probability: 0.5,
        urgency: 'routine',
        recommendedAction: 'Rest, over-the-counter pain relief. Consult if severe or persistent.',
        additionalTests: ['Blood pressure check'],
      },
      fatigue: {
        condition: 'General Fatigue',
        probability: 0.5,
        urgency: 'routine',
        recommendedAction: 'Evaluate sleep patterns, diet, and stress levels.',
        additionalTests: ['CBC', 'Thyroid function tests'],
      },
      chest_pain: {
        condition: 'Chest Discomfort',
        probability: 0.4,
        urgency: 'emergency',
        recommendedAction: 'Seek immediate medical attention to rule out cardiac issues.',
        specialistReferral: 'Cardiology',
        additionalTests: ['ECG', 'Cardiac enzymes'],
      },
      abdominal_pain: {
        condition: 'Gastrointestinal Issue',
        probability: 0.5,
        urgency: 'urgent',
        recommendedAction: 'Monitor symptoms. Seek care if severe or persistent.',
        additionalTests: ['Abdominal examination'],
      },
    };

    const suggestions: DiagnosisSuggestion[] = [];

    for (const symptom of symptomLower) {
      for (const [key, suggestion] of Object.entries(mappings)) {
        if (symptom.includes(key) || key.includes(symptom)) {
          suggestions.push({ ...suggestion });
          break;
        }
      }
    }

    if (suggestions.length === 0) {
      suggestions.push({
        condition: 'General Consultation Recommended',
        probability: 0.3,
        urgency: 'routine',
        recommendedAction: 'Schedule an appointment for proper evaluation.',
      });
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Generate basic risk assessment without ML service
   */
  private generateBasicRiskAssessment(patientId: string): RiskAssessment {
    return {
      patientId,
      overallRiskScore: 25,
      riskCategory: 'low',
      riskFactors: [
        {
          factor: 'General Health',
          contribution: 25,
          description: 'No significant risk factors identified',
        },
      ],
      recommendations: [
        'Maintain regular checkups',
        'Follow preventive health guidelines',
      ],
      followUpRecommended: false,
    };
  }

  /**
   * Generate basic appointment optimization without ML service
   */
  private generateBasicAppointmentOptimization(
    schedule: Array<{
      date: Date;
      duration: number;
      type: string;
      department?: string;
    }>
  ): AppointmentOptimization {
    const optimizedSchedule: AppointmentSlot[] = [];
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    // Sort by date and group by department
    const sorted = [...schedule].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      const appointment = sorted[i];

      // Check for same-day conflicts
      if (i > 0) {
        const prev = sorted[i - 1];
        if (
          appointment.date.toDateString() === prev.date.toDateString() &&
          appointment.department !== prev.department
        ) {
          conflicts.push(
            `Consider consolidating appointments on ${appointment.date.toLocaleDateString()}`
          );
        }
      }

      optimizedSchedule.push({
        startTime: appointment.date,
        endTime: new Date(appointment.date.getTime() + appointment.duration * 60000),
        department: appointment.department || 'General',
        duration: appointment.duration,
        isAvailable: true,
        slotType: appointment.type.includes('tele')
          ? 'telehealth'
          : appointment.type.includes('home')
          ? 'home_visit'
          : 'in_person',
      });
    }

    // Add suggestions
    if (optimizedSchedule.length > 5) {
      suggestions.push('Consider spacing out multiple appointments over several days');
    }

    const totalDuration = schedule.reduce((sum, s) => sum + s.duration, 0);
    if (totalDuration > 240) {
      suggestions.push('Total appointment time exceeds 4 hours - consider splitting across days');
    }

    return {
      optimizedSchedule,
      totalDuration,
      conflicts,
      suggestions,
    };
  }
}

// ── Singleton Export ─────────────────────────────────────────────────────────────

export const healthcareAIService = new HealthcareAIService();
export default healthcareAIService;
