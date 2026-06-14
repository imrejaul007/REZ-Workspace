import { Router, Request, Response } from 'express';
import {
  DiagnosisHelper,
  SymptomInputSchema,
  RiskFactor
} from '../services/DiagnosisHelper';
import {
  TreatmentRecommendations,
  TreatmentRequestSchema,
  TreatmentRecommendation,
  MedicationSchedule,
  AdherenceMetrics
} from '../services/TreatmentRecommendations';
import {
  PatientInsights,
  RiskScoreInputSchema,
  PatientInsight,
  RiskScore,
  AppointmentReminder,
  HealthTrend,
  HealthMetric,
  InsightType,
  RiskCategory
} from '../services/PatientInsights';

const router = Router();

// ==================== SYMPTOM ANALYSIS ====================

/**
 * POST /api/insights/analyze-symptoms
 * Analyze symptoms and provide diagnosis suggestions
 */
router.post('/analyze-symptoms', async (req: Request, res: Response) => {
  try {
    const validationResult = SymptomInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const diagnoses = DiagnosisHelper.analyzeSymptoms(validationResult.data);

    res.json({
      success: true,
      data: {
        count: diagnoses.length,
        diagnoses,
        patientFactors: {
          age: validationResult.data.age,
          gender: validationResult.data.gender
        }
      }
    });
  } catch (error) {
    console.error('Symptom analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze symptoms'
    });
  }
});

/**
 * POST /api/insights/risk-factors
 * Analyze health risk factors
 */
router.post('/risk-factors', async (req: Request, res: Response) => {
  try {
    const { medicalHistory = [], lifestyleFactors = [] } = req.body;

    const factors = DiagnosisHelper.analyzeRiskFactors({
      medicalHistory,
      lifestyleFactors
    });

    res.json({
      success: true,
      data: {
        factors,
        summary: {
          positive: factors.filter(f => f.impact === 'positive').length,
          negative: factors.filter(f => f.impact === 'negative').length,
          neutral: factors.filter(f => f.impact === 'neutral').length
        }
      }
    });
  } catch (error) {
    console.error('Risk factors analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze risk factors'
    });
  }
});

// ==================== TREATMENT RECOMMENDATIONS ====================

/**
 * POST /api/insights/treatments
 * Get treatment recommendations for a condition
 */
router.post('/treatments', async (req: Request, res: Response) => {
  try {
    const validationResult = TreatmentRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const recommendations = TreatmentRecommendations.getTreatmentRecommendations(validationResult.data);

    // Group by type and priority
    const grouped = {
      immediate: recommendations.filter(r => r.priority === 'immediate'),
      short_term: recommendations.filter(r => r.priority === 'short_term'),
      long_term: recommendations.filter(r => r.priority === 'long_term')
    };

    res.json({
      success: true,
      data: {
        recommendations,
        grouped,
        totalCount: recommendations.length
      }
    });
  } catch (error) {
    console.error('Treatment recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate treatment recommendations'
    });
  }
});

/**
 * GET /api/insights/treatments/:id/medication-schedule
 * Get medication schedule for a treatment recommendation
 */
router.get('/treatments/:id/medication-schedule', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // In production, this would fetch the actual recommendation from storage
    // For now, return a mock response structure
    res.json({
      success: true,
      data: {
        recommendationId: id,
        schedule: null,
        message: 'Provide recommendation from previous endpoint'
      }
    });
  } catch (error) {
    console.error('Medication schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate medication schedule'
    });
  }
});

/**
 * POST /api/insights/treatments/medication-schedule
 * Generate medication schedule from a recommendation
 */
router.post('/treatments/medication-schedule', async (req: Request, res: Response) => {
  try {
    const { recommendation } = req.body;

    if (!recommendation) {
      return res.status(400).json({
        success: false,
        error: 'Recommendation object is required'
      });
    }

    const schedule = TreatmentRecommendations.generateMedicationSchedule(recommendation);

    if (!schedule) {
      return res.status(400).json({
        success: false,
        error: 'Recommendation is not a medication type'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Medication schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate medication schedule'
    });
  }
});

// ==================== PATIENT RISK SCORING ====================

/**
 * POST /api/insights/risk-score
 * Calculate patient risk score
 */
router.post('/risk-score', async (req: Request, res: Response) => {
  try {
    const validationResult = RiskScoreInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const riskScore = PatientInsights.calculateRiskScore(validationResult.data);

    res.json({
      success: true,
      data: riskScore
    });
  } catch (error) {
    console.error('Risk score calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate risk score'
    });
  }
});

/**
 * POST /api/insights/insights
 * Generate comprehensive patient insights
 */
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const validationResult = RiskScoreInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const insights = PatientInsights.generatePatientInsights(validationResult.data);

    // Categorize insights
    const categorized = {
      urgent: insights.filter(i => i.priority === 'urgent'),
      high: insights.filter(i => i.priority === 'high'),
      medium: insights.filter(i => i.priority === 'medium'),
      low: insights.filter(i => i.priority === 'low')
    };

    res.json({
      success: true,
      data: {
        insights,
        categorized,
        totalCount: insights.length,
        actionRequired: insights.filter(i => i.actionRequired).length
      }
    });
  } catch (error) {
    console.error('Insights generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

// ==================== APPOINTMENT REMINDERS ====================

/**
 * POST /api/insights/appointment-reminders
 * Generate appointment reminders based on patient profile
 */
router.post('/appointment-reminders', async (req: Request, res: Response) => {
  try {
    const validationResult = RiskScoreInputSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: validationResult.error.errors
      });
    }

    const reminders = PatientInsights.generateAppointmentReminders(validationResult.data);

    res.json({
      success: true,
      data: {
        reminders,
        totalCount: reminders.length
      }
    });
  } catch (error) {
    console.error('Appointment reminders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate appointment reminders'
    });
  }
});

// ==================== HEALTH TRENDS ====================

/**
 * POST /api/insights/health-trends
 * Analyze health metric trends
 */
router.post('/health-trends', async (req: Request, res: Response) => {
  try {
    const { historicalMetrics = [], currentMetrics = [] } = req.body;

    if (!Array.isArray(historicalMetrics) || !Array.isArray(currentMetrics)) {
      return res.status(400).json({
        success: false,
        error: 'historicalMetrics and currentMetrics must be arrays'
      });
    }

    const trends = PatientInsights.analyzeHealthTrends(historicalMetrics, currentMetrics);

    // Summary statistics
    const summary = {
      improving: trends.filter(t => t.direction === 'improving').length,
      stable: trends.filter(t => t.direction === 'stable').length,
      worsening: trends.filter(t => t.direction === 'worsening').length
    };

    res.json({
      success: true,
      data: {
        trends,
        summary
      }
    });
  } catch (error) {
    console.error('Health trends analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze health trends'
    });
  }
});

// ==================== COMPREHENSIVE ASSESSMENT ====================

/**
 * POST /api/insights/comprehensive
 * Run a comprehensive health assessment combining all insights
 */
router.post('/comprehensive', async (req: Request, res: Response) => {
  try {
    const { symptoms, patientData } = req.body;

    // Validate inputs
    const symptomValidation = symptoms ? SymptomInputSchema.safeParse(symptoms) : null;
    const patientValidation = patientData ? RiskScoreInputSchema.safeParse({
      patientId: patientData.patientId || `temp-${Date.now()}`,
      age: patientData.age || 30,
      gender: patientData.gender || 'other',
      vitals: patientData.vitals,
      medicalHistory: patientData.medicalHistory?.map((c: string) => ({ condition: c, status: 'active' as const })),
      familyHistory: patientData.familyHistory,
      lifestyleFactors: patientData.lifestyleFactors,
      labResults: patientData.labResults
    }) : null;

    const response: Record<string, unknown> = {};

    // Symptom analysis
    if (symptomValidation?.success) {
      response.symptomAnalysis = {
        diagnoses: DiagnosisHelper.analyzeSymptoms(symptomValidation.data)
      };
    }

    // Risk factors
    if (patientValidation?.success) {
      const patientInput = patientValidation.data;
      response.riskScore = PatientInsights.calculateRiskScore(patientInput);
      response.insights = PatientInsights.generatePatientInsights(patientInput);
      response.appointmentReminders = PatientInsights.generateAppointmentReminders(patientInput);
      response.riskFactors = DiagnosisHelper.analyzeRiskFactors({
        medicalHistory: patientInput.medicalHistory?.map(m => m.condition) || [],
        lifestyleFactors: patientData.lifestyleFactors ? [patientData.lifestyleFactors] : []
      });
    }

    // Treatment recommendations (if condition identified)
    if (symptomValidation?.success) {
      const diagnoses = DiagnosisHelper.analyzeSymptoms(symptomValidation.data);
      if (diagnoses.length > 0) {
        response.treatments = {
          recommendations: TreatmentRecommendations.getTreatmentRecommendations({
            condition: diagnoses[0].primaryCondition,
            severity: diagnoses[0].severity.toString() as 'mild' | 'moderate' | 'severe' | 'critical',
            patientFactors: patientData
          })
        };
      }
    }

    res.json({
      success: true,
      data: response,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Comprehensive assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run comprehensive assessment'
    });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/insights/health
 * Service health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'rez-mind-healthcare-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    capabilities: [
      'Symptom Analysis',
      'Treatment Recommendations',
      'Patient Risk Scoring',
      'Appointment Reminders',
      'Health Insights',
      'Health Trend Analysis'
    ]
  });
});

export default router;
