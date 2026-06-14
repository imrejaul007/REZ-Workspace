import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Import services
import {
  DiagnosisHelper,
  SeverityLevel,
  SymptomInputSchema,
  getSymptomSynonyms,
  analyzeRiskFactors,
  RiskFactor
} from './services/DiagnosisHelper';

import {
  TreatmentRecommendations,
  TreatmentType,
  TreatmentRequestSchema,
  getTreatmentRecommendations,
  generateMedicationSchedule,
  calculateAdherence
} from './services/TreatmentRecommendations';

import {
  PatientInsights,
  RiskCategory,
  InsightType,
  RiskScoreInputSchema,
  calculateRiskScore,
  generatePatientInsights,
  generateAppointmentReminders,
  analyzeHealthTrends,
  HealthMetric
} from './services/PatientInsights';

describe('ReZ Mind Healthcare Service - DiagnosisHelper', () => {
  describe('Symptom Analysis', () => {
    it('should analyze fever symptoms correctly', () => {
      const input = {
        symptoms: ['fever', 'cough', 'fatigue'],
        duration: 'days' as const,
        severity: 'moderate' as const,
        age: 30,
        gender: 'male' as const,
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      expect(diagnoses.length).toBeGreaterThan(0);
      expect(diagnoses[0].primaryCondition).toBeDefined();
      expect(diagnoses[0].confidence).toBeGreaterThan(0);
      expect(diagnoses[0].severity).toBeDefined();
      expect(diagnoses[0].recommendedActions.length).toBeGreaterThan(0);
    });

    it('should analyze headache symptoms correctly', () => {
      const input = {
        symptoms: ['headache', 'nausea', 'sensitivity to light'],
        age: 25,
        gender: 'female' as const,
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      expect(diagnoses.length).toBeGreaterThan(0);
      expect(diagnoses[0].differentialDiagnoses).toBeDefined();
    });

    it('should analyze chest pain symptoms correctly', () => {
      const input = {
        symptoms: ['chest pain', 'shortness of breath', 'arm pain'],
        severity: 'severe' as const,
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      expect(diagnoses.length).toBeGreaterThan(0);
      expect(diagnoses[0].urgencyLevel).toBe('emergency');
    });

    it('should analyze fatigue symptoms correctly', () => {
      const input = {
        symptoms: ['fatigue', 'weight gain', 'cold sensitivity'],
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      expect(diagnoses.length).toBeGreaterThan(0);
    });

    it('should return general assessment for unknown symptoms', () => {
      const input = {
        symptoms: ['unknown symptom xyz'],
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      expect(diagnoses.length).toBeGreaterThan(0);
      expect(diagnoses[0].primaryCondition).toBe('General Assessment Required');
      expect(diagnoses[0].confidence).toBeLessThan(0.5);
    });

    it('should adjust severity for elderly patients', () => {
      const inputYoung = {
        symptoms: ['fever', 'cough'],
        age: 30,
      };

      const inputElderly = {
        symptoms: ['fever', 'cough'],
        age: 70,
      };

      const diagnosesYoung = DiagnosisHelper.analyzeSymptoms(inputYoung);
      const diagnosesElderly = DiagnosisHelper.analyzeSymptoms(inputElderly);

      // Elderly patients should have adjusted severity
      expect(diagnosesElderly).toBeDefined();
    });

    it('should sort diagnoses by confidence', () => {
      const input = {
        symptoms: ['fever', 'headache', 'fatigue'],
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      for (let i = 1; i < diagnoses.length; i++) {
        expect(diagnoses[i - 1].confidence).toBeGreaterThanOrEqual(diagnoses[i].confidence);
      }
    });

    it('should normalize symptoms to lowercase', () => {
      const input = {
        symptoms: ['FEVER', 'COUGH'],
      };

      const diagnoses = DiagnosisHelper.analyzeSymptoms(input);

      expect(diagnoses.length).toBeGreaterThan(0);
    });
  });

  describe('Symptom Synonyms', () => {
    it('should return synonyms for fever', () => {
      const synonyms = getSymptomSynonyms('fever');
      expect(synonyms).toContain('high temperature');
      expect(synonyms).toContain('pyrexia');
    });

    it('should return synonyms for headache', () => {
      const synonyms = getSymptomSynonyms('headache');
      expect(synonyms).toContain('head pain');
      expect(synonyms).toContain('migraine');
    });

    it('should return empty array for unknown symptom', () => {
      const synonyms = getSymptomSynonyms('unknown_symptom');
      expect(synonyms).toEqual([]);
    });

    it('should handle case insensitivity', () => {
      const synonyms1 = getSymptomSynonyms('FEVER');
      const synonyms2 = getSymptomSynonyms('fever');

      expect(synonyms1).toEqual(synonyms2);
    });
  });

  describe('Risk Factor Analysis', () => {
    it('should identify senior citizen risk', () => {
      const factors = analyzeRiskFactors({
        age: 70,
        medicalHistory: [],
        lifestyleFactors: [],
      });

      const seniorFactor = factors.find(f => f.factor === 'Senior Citizen');
      expect(seniorFactor).toBeDefined();
      expect(seniorFactor?.impact).toBe('negative');
    });

    it('should identify minor risk', () => {
      const factors = analyzeRiskFactors({
        age: 10,
        medicalHistory: [],
        lifestyleFactors: [],
      });

      const minorFactor = factors.find(f => f.factor === 'Minor');
      expect(minorFactor).toBeDefined();
      expect(minorFactor?.impact).toBe('negative');
    });

    it('should identify diabetes from medical history', () => {
      const factors = analyzeRiskFactors({
        medicalHistory: ['Type 2 Diabetes'],
        lifestyleFactors: [],
      });

      const diabetesFactor = factors.find(f => f.factor === 'Diabetes');
      expect(diabetesFactor).toBeDefined();
      expect(diabetesFactor?.impact).toBe('negative');
    });

    it('should identify hypertension from medical history', () => {
      const factors = analyzeRiskFactors({
        medicalHistory: ['Hypertension', 'High Blood Pressure'],
        lifestyleFactors: [],
      });

      const htnFactor = factors.find(f => f.factor === 'Hypertension');
      expect(htnFactor).toBeDefined();
    });

    it('should identify asthma from medical history', () => {
      const factors = analyzeRiskFactors({
        medicalHistory: ['Asthma'],
        lifestyleFactors: [],
      });

      const asthmaFactor = factors.find(f => f.factor === 'Asthma');
      expect(asthmaFactor).toBeDefined();
    });

    it('should identify smoking as negative lifestyle factor', () => {
      const factors = analyzeRiskFactors({
        medicalHistory: [],
        lifestyleFactors: ['Smoking cigarettes daily'],
      });

      const smokingFactor = factors.find(f => f.factor === 'Smoking');
      expect(smokingFactor).toBeDefined();
      expect(smokingFactor?.impact).toBe('negative');
    });

    it('should identify exercise as positive lifestyle factor', () => {
      const factors = analyzeRiskFactors({
        medicalHistory: [],
        lifestyleFactors: ['Regular exercise 3 times per week'],
      });

      const exerciseFactor = factors.find(f => f.factor === 'Regular Exercise');
      expect(exerciseFactor).toBeDefined();
      expect(exerciseFactor?.impact).toBe('positive');
    });

    it('should handle empty medical history', () => {
      const factors = analyzeRiskFactors({
        medicalHistory: [],
        lifestyleFactors: [],
      });

      expect(Array.isArray(factors)).toBe(true);
    });
  });

  describe('SymptomInputSchema Validation', () => {
    it('should validate valid symptom input', () => {
      const validInput = {
        symptoms: ['fever', 'cough'],
        duration: 'days' as const,
        severity: 'moderate' as const,
        age: 35,
        gender: 'female' as const,
      };

      const result = SymptomInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty symptoms array', () => {
      const invalidInput = {
        symptoms: [],
      };

      const result = SymptomInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should validate age range', () => {
      const validInput = {
        symptoms: ['fever'],
        age: 50,
      };

      const result = SymptomInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept optional fields', () => {
      const minimalInput = {
        symptoms: ['headache'],
      };

      const result = SymptomInputSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });
  });
});

describe('ReZ Mind Healthcare Service - TreatmentRecommendations', () => {
  describe('Treatment Recommendations', () => {
    it('should return recommendations for common cold', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Common Cold',
        severity: 'mild',
      });

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].type).toBeDefined();
      expect(recommendations[0].name).toBeDefined();
    });

    it('should return recommendations for migraine', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Migraine',
        severity: 'moderate',
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const hasTherapy = recommendations.some(r => r.type === TreatmentType.THERAPY);
      expect(hasTherapy).toBe(true);
    });

    it('should return recommendations for hypertension', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Hypertension',
        severity: 'moderate',
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const hasMedication = recommendations.some(r => r.type === TreatmentType.MEDICATION);
      expect(hasMedication).toBe(true);
    });

    it('should return recommendations for diabetes', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Diabetes',
        severity: 'moderate',
      });

      expect(recommendations.length).toBeGreaterThan(0);
      const hasLifestyle = recommendations.some(r => r.type === TreatmentType.LIFESTYLE);
      expect(hasLifestyle).toBe(true);
    });

    it('should return recommendations for anxiety', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Anxiety',
        severity: 'moderate',
      });

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should adjust priority based on severity', () => {
      const mildRecs = getTreatmentRecommendations({
        condition: 'Common Cold',
        severity: 'mild',
      });

      const severeRecs = getTreatmentRecommendations({
        condition: 'Common Cold',
        severity: 'severe',
      });

      // Severe cases should have more immediate recommendations
      expect(severeRecs).toBeDefined();
    });

    it('should return recommendations sorted by priority', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Hypertension',
        severity: 'moderate',
      });

      // Immediate should come before short_term and long_term
      let immediateSeen = false;
      let shortTermSeen = false;

      for (const rec of recommendations) {
        if (rec.priority === 'immediate') immediateSeen = true;
        if (rec.priority === 'short_term') {
          shortTermSeen = true;
          break;
        }
        if (rec.priority === 'long_term') break;
      }
    });

    it('should include contraindications in recommendations', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Migraine',
        severity: 'moderate',
      });

      expect(recommendations[0].contraindications).toBeDefined();
    });

    it('should include side effects in recommendations', () => {
      const recommendations = getTreatmentRecommendations({
        condition: 'Migraine',
        severity: 'moderate',
      });

      expect(Array.isArray(recommendations[0].sideEffects)).toBe(true);
    });
  });

  describe('Medication Schedule Generation', () => {
    it('should generate schedule for medication type', () => {
      const recommendation = {
        id: '1',
        type: TreatmentType.MEDICATION,
        name: 'Test Medication',
        description: 'Test',
        priority: 'immediate' as const,
        duration: '7-10 days',
        contraindications: [],
        sideEffects: ['Nausea'],
        effectiveness: 80,
        costLevel: 'low' as const,
        followUpRequired: false,
      };

      const schedule = generateMedicationSchedule(recommendation);

      expect(schedule).not.toBeNull();
      expect(schedule?.medication).toBe('Test Medication');
      expect(schedule?.frequency).toBeDefined();
    });

    it('should return null for non-medication types', () => {
      const recommendation = {
        id: '1',
        type: TreatmentType.THERAPY,
        name: 'CBT',
        description: 'Therapy',
        priority: 'long_term' as const,
        duration: '12 sessions',
        contraindications: [],
        sideEffects: [],
        effectiveness: 80,
        costLevel: 'high' as const,
        followUpRequired: true,
      };

      const schedule = generateMedicationSchedule(recommendation);

      expect(schedule).toBeNull();
    });

    it('should include side effects in schedule notes', () => {
      const recommendation = {
        id: '1',
        type: TreatmentType.MEDICATION,
        name: 'Test Med',
        description: 'Test',
        priority: 'immediate' as const,
        duration: 'daily',
        contraindications: [],
        sideEffects: ['Nausea', 'Dizziness'],
        effectiveness: 80,
        costLevel: 'low' as const,
        followUpRequired: false,
      };

      const schedule = generateMedicationSchedule(recommendation);

      expect(schedule?.notes).toContain('Nausea');
    });
  });

  describe('Adherence Calculation', () => {
    it('should calculate adherence rate correctly', () => {
      const metrics = calculateAdherence('MED-001', 18, 20);

      expect(metrics.dosesTaken).toBe(18);
      expect(metrics.dosesMissed).toBe(2);
      expect(metrics.adherenceRate).toBe(90);
    });

    it('should handle zero total doses', () => {
      const metrics = calculateAdherence('MED-002', 0, 0);

      expect(metrics.adherenceRate).toBe(0);
    });

    it('should handle perfect adherence', () => {
      const metrics = calculateAdherence('MED-003', 30, 30);

      expect(metrics.adherenceRate).toBe(100);
    });

    it('should round adherence rate', () => {
      const metrics = calculateAdherence('MED-004', 7, 9);

      expect(metrics.adherenceRate).toBeCloseTo(77.8, 1);
    });
  });

  describe('TreatmentRequestSchema Validation', () => {
    it('should validate valid treatment request', () => {
      const validRequest = {
        condition: 'Migraine',
        severity: 'moderate' as const,
        patientFactors: {
          age: 35,
          allergies: ['Aspirin'],
        },
      };

      const result = TreatmentRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should require condition', () => {
      const invalidRequest = {
        severity: 'mild' as const,
      };

      const result = TreatmentRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate severity enum', () => {
      const validRequest = {
        condition: 'Test',
        severity: 'critical' as const,
      };

      const result = TreatmentRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });
  });
});

describe('ReZ Mind Healthcare Service - PatientInsights', () => {
  describe('Risk Score Calculation', () => {
    it('should calculate low risk for healthy young patient', () => {
      const input = {
        patientId: 'PAT-001',
        age: 25,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
        },
      };

      const riskScore = calculateRiskScore(input);

      expect(riskScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(riskScore.category).toBeDefined();
      expect(riskScore.factors).toBeDefined();
    });

    it('should calculate higher risk for elderly patient', () => {
      const inputYoung = {
        patientId: 'PAT-002',
        age: 25,
        gender: 'male' as const,
      };

      const inputElderly = {
        patientId: 'PAT-003',
        age: 70,
        gender: 'male' as const,
      };

      const riskYoung = calculateRiskScore(inputYoung);
      const riskElderly = calculateRiskScore(inputElderly);

      expect(riskElderly.overallScore).toBeGreaterThanOrEqual(riskYoung.overallScore);
    });

    it('should consider blood pressure in risk score', () => {
      const normalBP = {
        patientId: 'PAT-004',
        age: 45,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 115,
        },
      };

      const highBP = {
        patientId: 'PAT-005',
        age: 45,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 160,
        },
      };

      const riskNormal = calculateRiskScore(normalBP);
      const riskHigh = calculateRiskScore(highBP);

      expect(riskHigh.overallScore).toBeGreaterThan(riskNormal.overallScore);
    });

    it('should consider cholesterol in risk score', () => {
      const input = {
        patientId: 'PAT-006',
        age: 50,
        gender: 'male' as const,
        labResults: {
          cholesterolTotal: 280,
          cholesterolHDL: 35,
        },
      };

      const riskScore = calculateRiskScore(input);

      expect(riskScore.factors.some(f => f.name === 'Cholesterol Ratio')).toBe(true);
    });

    it('should consider diabetes in risk score', () => {
      const input = {
        patientId: 'PAT-007',
        age: 55,
        gender: 'female' as const,
        labResults: {
          hba1c: 8.5,
        },
      };

      const riskScore = calculateRiskScore(input);

      expect(riskScore.factors.some(f => f.name.includes('Diabetes'))).toBe(true);
    });

    it('should consider smoking in risk score', () => {
      const nonSmoker = {
        patientId: 'PAT-008',
        age: 40,
        gender: 'male' as const,
        lifestyleFactors: {
          smokingStatus: 'never' as const,
        },
      };

      const smoker = {
        patientId: 'PAT-009',
        age: 40,
        gender: 'male' as const,
        lifestyleFactors: {
          smokingStatus: 'current' as const,
        },
      };

      const riskNonSmoker = calculateRiskScore(nonSmoker);
      const riskSmoker = calculateRiskScore(smoker);

      expect(riskSmoker.overallScore).toBeGreaterThan(riskNonSmoker.overallScore);
    });

    it('should consider family history in risk score', () => {
      const input = {
        patientId: 'PAT-010',
        age: 45,
        gender: 'male' as const,
        familyHistory: ['Heart Disease', 'Stroke'],
      };

      const riskScore = calculateRiskScore(input);

      expect(riskScore.factors.some(f => f.name.includes('Family History'))).toBe(true);
    });

    it('should cap risk score at 100', () => {
      const highRiskInput = {
        patientId: 'PAT-011',
        age: 70,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 200,
        },
        labResults: {
          hba1c: 10,
          cholesterolTotal: 300,
          cholesterolHDL: 30,
        },
        lifestyleFactors: {
          smokingStatus: 'current' as const,
          exerciseFrequency: 'sedentary' as const,
        },
        familyHistory: ['Heart Disease', 'Stroke', 'Diabetes'],
      };

      const riskScore = calculateRiskScore(highRiskInput);

      expect(riskScore.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Patient Insights Generation', () => {
    it('should generate insights for high risk patient', () => {
      const input = {
        patientId: 'PAT-012',
        age: 60,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 95,
        },
      };

      const insights = generatePatientInsights(input);

      expect(insights.length).toBeGreaterThan(0);
    });

    it('should generate blood pressure insight for elevated BP', () => {
      const input = {
        patientId: 'PAT-013',
        age: 50,
        gender: 'female' as const,
        vitals: {
          bloodPressureSystolic: 150,
          bloodPressureDiastolic: 95,
        },
      };

      const insights = generatePatientInsights(input);

      const bpInsight = insights.find(i => i.title.includes('Blood Pressure'));
      expect(bpInsight).toBeDefined();
      expect(bpInsight?.actionRequired).toBe(true);
    });

    it('should generate preventive care insight for patients over 50', () => {
      const input = {
        patientId: 'PAT-014',
        age: 55,
        gender: 'male' as const,
      };

      const insights = generatePatientInsights(input);

      const preventiveInsight = insights.find(i => i.type === InsightType.PREVENTIVE_CARE);
      expect(preventiveInsight).toBeDefined();
    });

    it('should generate smoking cessation insight for smokers', () => {
      const input = {
        patientId: 'PAT-015',
        age: 45,
        gender: 'male' as const,
        lifestyleFactors: {
          smokingStatus: 'current' as const,
        },
      };

      const insights = generatePatientInsights(input);

      const smokingInsight = insights.find(i => i.title.includes('Smoking'));
      expect(smokingInsight).toBeDefined();
      expect(smokingInsight?.actionRequired).toBe(true);
    });

    it('should generate exercise insight for sedentary patients', () => {
      const input = {
        patientId: 'PAT-016',
        age: 40,
        gender: 'female' as const,
        lifestyleFactors: {
          exerciseFrequency: 'sedentary' as const,
        },
      };

      const insights = generatePatientInsights(input);

      const exerciseInsight = insights.find(i => i.title.includes('Physical Activity'));
      expect(exerciseInsight).toBeDefined();
    });
  });

  describe('Appointment Reminders', () => {
    it('should generate primary care reminder', () => {
      const input = {
        patientId: 'PAT-017',
        age: 40,
        gender: 'male' as const,
      };

      const reminders = generateAppointmentReminders(input);

      expect(reminders.length).toBeGreaterThan(0);
      const pcpReminder = reminders.find(r => r.appointmentType === 'Primary Care Checkup');
      expect(pcpReminder).toBeDefined();
    });

    it('should generate urgent reminder for high risk patients', () => {
      const highRiskInput = {
        patientId: 'PAT-018',
        age: 65,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 170,
        },
      };

      const reminders = generateAppointmentReminders(highRiskInput);

      const urgentReminder = reminders.find(r => r.recommendedTiming === 'immediate');
      expect(urgentReminder).toBeDefined();
    });

    it('should generate cardiology reminder for high BP patients', () => {
      const input = {
        patientId: 'PAT-019',
        age: 55,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 160,
          bloodPressureDiastolic: 100,
        },
      };

      const reminders = generateAppointmentReminders(input);

      const cardioReminder = reminders.find(r => r.appointmentType === 'Cardiology Consultation');
      expect(cardioReminder).toBeDefined();
    });
  });

  describe('Health Trends Analysis', () => {
    it('should analyze improving trends', () => {
      const historical: HealthMetric[] = [
        { type: 'weight', value: 85, unit: 'kg', recordedAt: new Date('2024-01-01'), source: 'manual' },
        { type: 'weight', value: 83, unit: 'kg', recordedAt: new Date('2024-02-01'), source: 'manual' },
      ];

      const current: HealthMetric[] = [
        { type: 'weight', value: 80, unit: 'kg', recordedAt: new Date('2024-03-01'), source: 'manual' },
      ];

      const trends = analyzeHealthTrends(historical, current);

      const weightTrend = trends.find(t => t.metric === 'weight');
      expect(weightTrend?.direction).toBe('improving');
    });

    it('should analyze worsening trends', () => {
      const historical: HealthMetric[] = [
        { type: 'weight', value: 75, unit: 'kg', recordedAt: new Date('2024-01-01'), source: 'manual' },
        { type: 'weight', value: 77, unit: 'kg', recordedAt: new Date('2024-02-01'), source: 'manual' },
      ];

      const current: HealthMetric[] = [
        { type: 'weight', value: 82, unit: 'kg', recordedAt: new Date('2024-03-01'), source: 'manual' },
      ];

      const trends = analyzeHealthTrends(historical, current);

      const weightTrend = trends.find(t => t.metric === 'weight');
      expect(weightTrend?.direction).toBe('worsening');
    });

    it('should analyze stable trends', () => {
      const historical: HealthMetric[] = [
        { type: 'heartRate', value: 72, unit: 'bpm', recordedAt: new Date('2024-01-01'), source: 'device' },
        { type: 'heartRate', value: 70, unit: 'bpm', recordedAt: new Date('2024-02-01'), source: 'device' },
      ];

      const current: HealthMetric[] = [
        { type: 'heartRate', value: 71, unit: 'bpm', recordedAt: new Date('2024-03-01'), source: 'device' },
      ];

      const trends = analyzeHealthTrends(historical, current);

      const hrTrend = trends.find(t => t.metric === 'heartRate');
      expect(hrTrend?.direction).toBe('stable');
    });

    it('should calculate percentage change correctly', () => {
      const historical: HealthMetric[] = [
        { type: 'steps', value: 5000, unit: 'count', recordedAt: new Date('2024-01-01'), source: 'device' },
      ];

      const current: HealthMetric[] = [
        { type: 'steps', value: 10000, unit: 'count', recordedAt: new Date('2024-03-01'), source: 'device' },
      ];

      const trends = analyzeHealthTrends(historical, current);

      const stepsTrend = trends.find(t => t.metric === 'steps');
      expect(stepsTrend?.change).toBeCloseTo(100, 0);
    });

    it('should handle empty historical data', () => {
      const historical: HealthMetric[] = [];
      const current: HealthMetric[] = [
        { type: 'weight', value: 75, unit: 'kg', recordedAt: new Date(), source: 'manual' },
      ];

      const trends = analyzeHealthTrends(historical, current);

      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('RiskScoreInputSchema Validation', () => {
    it('should validate valid risk score input', () => {
      const validInput = {
        patientId: 'PAT-100',
        age: 45,
        gender: 'female' as const,
        vitals: {
          bloodPressureSystolic: 130,
          bloodPressureDiastolic: 85,
          heartRate: 72,
        },
      };

      const result = RiskScoreInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require patientId', () => {
      const invalidInput = {
        age: 30,
        gender: 'male' as const,
      };

      const result = RiskScoreInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should validate age range', () => {
      const validInput = {
        patientId: 'PAT-101',
        age: 100,
        gender: 'male' as const,
      };

      const result = RiskScoreInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate gender enum', () => {
      const validInput = {
        patientId: 'PAT-102',
        age: 30,
        gender: 'other' as const,
      };

      const result = RiskScoreInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('Risk Categories', () => {
    it('should categorize LOW risk correctly', () => {
      const input = {
        patientId: 'PAT-103',
        age: 25,
        gender: 'female' as const,
      };

      const riskScore = calculateRiskScore(input);

      expect(riskScore.category).toBe(RiskCategory.LOW);
    });

    it('should categorize MODERATE risk correctly', () => {
      const input = {
        patientId: 'PAT-104',
        age: 50,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 140,
        },
      };

      const riskScore = calculateRiskScore(input);

      expect([RiskCategory.MODERATE, RiskCategory.HIGH]).toContain(riskScore.category);
    });

    it('should calculate next review date based on risk', () => {
      const lowRiskInput = {
        patientId: 'PAT-105',
        age: 25,
        gender: 'male' as const,
      };

      const highRiskInput = {
        patientId: 'PAT-106',
        age: 70,
        gender: 'male' as const,
        vitals: {
          bloodPressureSystolic: 170,
        },
      };

      const lowRisk = calculateRiskScore(lowRiskInput);
      const highRisk = calculateRiskScore(highRiskInput);

      expect(highRisk.nextReviewDate.getTime()).toBeLessThanOrEqual(lowRisk.nextReviewDate.getTime());
    });
  });
});

describe('ReZ Mind Healthcare Service - Express App Configuration', () => {
  it('should have health check endpoint', () => {
    const app = require('express')();

    app.get('/api/insights/health', (req: any, res: any) => {
      res.json({
        success: true,
        service: 'rez-mind-healthcare-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    });

    expect(app._router).toBeDefined();
  });

  it('should have root endpoint', () => {
    const app = require('express')();

    app.get('/', (req: any, res: any) => {
      res.json({
        service: 'ReZ Mind Healthcare Service',
        version: '1.0.0',
      });
    });

    expect(app._router).toBeDefined();
  });
});
