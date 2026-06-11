/**
 * CARECODE - Diagnosis AI Employee
 * AI-powered diagnosis assistance, symptom analysis, and treatment recommendations
 * "AI That Assists Clinical Decision Making"
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4853;

app.use(express.json());

// ============================================
// TYPES
// ============================================

interface Symptom {
  code: string;
  name: string;
  severity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  notes?: string;
}

interface Diagnosis {
  code: string;
  name: string;
  confidence: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  icdCode?: string;
}

interface DiagnosisRequest {
  patientId?: string;
  symptoms: Symptom[];
  age?: number;
  gender?: 'male' | 'female' | 'other';
  medicalHistory?: string[];
  vitals?: {
    temperature?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
}

interface TreatmentPlan {
  diagnosis: Diagnosis;
  recommendations: string[];
  medications?: string[];
  lifestyle?: string[];
  followUp?: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
}

// ============================================
// MEDICAL KNOWLEDGE BASE (Simplified)
// ============================================

interface Condition {
  name: string;
  code: string;
  symptoms: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  icdCode: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
}

const conditions: Condition[] = [
  {
    name: 'Common Cold',
    code: 'COLD-001',
    symptoms: ['runny nose', 'sneezing', 'sore throat', 'cough', 'congestion', 'mild fever', 'headache'],
    severity: 'low',
    category: 'Respiratory',
    icdCode: 'J00',
    urgency: 'routine'
  },
  {
    name: 'Seasonal Flu (Influenza)',
    code: 'FLU-001',
    symptoms: ['fever', 'body aches', 'fatigue', 'cough', 'sore throat', 'headache', 'chills'],
    severity: 'medium',
    category: 'Respiratory',
    icdCode: 'J10',
    urgency: 'soon'
  },
  {
    name: 'Acute Bronchitis',
    code: 'BRON-001',
    symptoms: ['cough', 'chest discomfort', 'fatigue', 'shortness of breath', 'sore throat', 'fever'],
    severity: 'medium',
    category: 'Respiratory',
    icdCode: 'J20',
    urgency: 'routine'
  },
  {
    name: 'Pneumonia',
    code: 'PNEU-001',
    symptoms: ['cough', 'fever', 'chills', 'shortness of breath', 'chest pain', 'fatigue', 'confusion'],
    severity: 'high',
    category: 'Respiratory',
    icdCode: 'J18',
    urgency: 'urgent'
  },
  {
    name: 'Gastroenteritis',
    code: 'GAST-001',
    symptoms: ['nausea', 'vomiting', 'diarrhea', 'stomach pain', 'fever', 'headache', 'dehydration'],
    severity: 'medium',
    category: 'Gastrointestinal',
    icdCode: 'K52',
    urgency: 'routine'
  },
  {
    name: 'Hypertension',
    code: 'HTN-001',
    symptoms: ['headache', 'dizziness', 'shortness of breath', 'fatigue', 'chest pain'],
    severity: 'medium',
    category: 'Cardiovascular',
    icdCode: 'I10',
    urgency: 'soon'
  },
  {
    name: 'Type 2 Diabetes',
    code: 'DM2-001',
    symptoms: ['increased thirst', 'frequent urination', 'fatigue', 'blurred vision', 'slow healing', 'hunger'],
    severity: 'high',
    category: 'Endocrine',
    icdCode: 'E11',
    urgency: 'soon'
  },
  {
    name: 'Migraine',
    code: 'MIG-001',
    symptoms: ['severe headache', 'nausea', 'vomiting', 'sensitivity to light', 'sensitivity to sound', 'visual disturbances'],
    severity: 'medium',
    category: 'Neurological',
    icdCode: 'G43',
    urgency: 'routine'
  },
  {
    name: 'Urinary Tract Infection',
    code: 'UTI-001',
    symptoms: ['painful urination', 'frequent urination', 'blood in urine', 'lower abdominal pain', 'fever'],
    severity: 'medium',
    category: 'Urological',
    icdCode: 'N39',
    urgency: 'routine'
  },
  {
    name: 'Acute Appendicitis',
    code: 'APPD-001',
    symptoms: ['abdominal pain', 'nausea', 'vomiting', 'fever', 'loss of appetite', 'abdominal tenderness'],
    severity: 'critical',
    category: 'Gastrointestinal',
    icdCode: 'K35',
    urgency: 'emergency'
  },
  {
    name: 'Anemia',
    code: 'ANEM-001',
    symptoms: ['fatigue', 'pallor', 'shortness of breath', 'dizziness', 'fast heartbeat', 'headache'],
    severity: 'medium',
    category: 'Hematological',
    icdCode: 'D64',
    urgency: 'routine'
  },
  {
    name: 'Allergic Rhinitis',
    code: 'RHIN-001',
    symptoms: ['sneezing', 'runny nose', 'itchy eyes', 'congestion', 'postnasal drip', 'headache'],
    severity: 'low',
    category: 'Immunological',
    icdCode: 'J30',
    urgency: 'routine'
  }
];

// Symptom to condition mapping
const symptomConditions: Map<string, string[]> = new Map();

conditions.forEach(condition => {
  condition.symptoms.forEach(symptom => {
    const key = symptom.toLowerCase();
    if (!symptomConditions.has(key)) {
      symptomConditions.set(key, []);
    }
    symptomConditions.get(key)!.push(condition.code);
  });
});

// ============================================
// AI DIAGNOSIS ENGINE
// ============================================

interface DiagnosisResult {
  diagnoses: Diagnosis[];
  differentialDiagnoses: Diagnosis[];
  confidenceLevel: 'low' | 'medium' | 'high';
  reasoning: string;
  recommendations: string[];
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  referralNeeded: boolean;
  followUpTimeframe: string;
}

function analyzeSymptoms(request: DiagnosisRequest): DiagnosisResult {
  const { symptoms, age, gender, medicalHistory, vitals } = request;

  // Build symptom set
  const symptomSet = symptoms.map(s => s.name.toLowerCase());
  const severityMap = new Map(symptoms.map(s => [s.name.toLowerCase(), s.severity || 'moderate']));

  // Score each condition
  const conditionScores: Map<string, { score: number; matchedSymptoms: string[] }> = new Map();

  conditions.forEach(condition => {
    let score = 0;
    const matched: string[] = [];

    symptomSet.forEach(symptom => {
      if (condition.symptoms.some(cs => cs.toLowerCase().includes(symptom) || symptom.includes(cs.toLowerCase()))) {
        score += 1;
        matched.push(symptom);
      }
    });

    // Additional scoring based on severity
    matched.forEach(m => {
      const severity = severityMap.get(m);
      if (severity === 'severe') score += 2;
      if (severity === 'moderate') score += 1;
    });

    // Age-adjusted scoring
    if (age) {
      if ((condition.code === 'DM2-001' || condition.code === 'HTN-001') && age > 45) score += 1;
      if (condition.code === 'ANEM-001' && gender === 'female') score += 1;
    }

    conditionScores.set(condition.code, { score, matchedSymptoms: matched });
  });

  // Sort by score
  const sortedConditions = Array.from(conditionScores.entries())
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5);

  // Build diagnoses
  const diagnoses: Diagnosis[] = sortedConditions.map(([code, data], index) => {
    const condition = conditions.find(c => c.code === code)!;
    const confidence = Math.min(95, Math.round((data.score / symptomSet.length) * 100 + (index === 0 ? 10 : 0)));

    return {
      code: condition.code,
      name: condition.name,
      confidence,
      category: condition.category,
      severity: condition.severity,
      description: `Primary diagnosis based on ${data.matchedSymptoms.length} matching symptoms: ${data.matchedSymptoms.join(', ')}`,
      icdCode: condition.icdCode
    };
  });

  // Generate recommendations based on top diagnosis
  const topCondition = diagnoses[0] ? conditions.find(c => c.code === diagnoses[0].code) : null;

  const recommendations: string[] = [];
  let urgency: DiagnosisResult['urgency'] = 'routine';
  let referralNeeded = false;
  let followUpTimeframe = '1 week';

  if (topCondition) {
    urgency = topCondition.urgency;
    followUpTimeframe = urgency === 'emergency' ? 'Immediate' :
      urgency === 'urgent' ? '24-48 hours' :
        urgency === 'soon' ? '3-5 days' : '1-2 weeks';

    // Generate condition-specific recommendations
    switch (topCondition.code) {
      case 'COLD-001':
        recommendations.push('Rest and stay hydrated');
        recommendations.push('Use over-the-counter cold remedies for symptom relief');
        recommendations.push('If symptoms persist beyond 10 days, consult physician');
        break;
      case 'FLU-001':
        recommendations.push('Rest and adequate fluid intake');
        recommendations.push('Consider antiviral medication within 48 hours of symptom onset');
        recommendations.push('Monitor temperature - seek care if fever exceeds 103°F');
        recommendations.push('Isolation recommended to prevent spread');
        break;
      case 'PNEU-001':
        recommendations.push('Urgent medical consultation required');
        recommendations.push('Chest X-ray recommended');
        recommendations.push('Antibiotics may be required');
        recommendations.push('Rest and follow-up in 48 hours');
        referralNeeded = true;
        break;
      case 'HTN-001':
        recommendations.push('Schedule appointment with primary care physician');
        recommendations.push('Monitor blood pressure regularly');
        recommendations.push('Reduce sodium intake');
        recommendations.push('Consider stress management techniques');
        break;
      case 'DM2-001':
        recommendations.push('Fasting blood glucose and HbA1c tests recommended');
        recommendations.push('Dietary consultation advised');
        recommendations.push('Schedule with endocrinologist');
        referralNeeded = true;
        break;
      case 'APPD-001':
        recommendations.push('Seek emergency care immediately');
        recommendations.push('Do not eat or drink anything');
        recommendations.push('Abdominal pain with fever requires urgent evaluation');
        urgency = 'emergency';
        referralNeeded = true;
        break;
      default:
        recommendations.push('Monitor symptoms');
        recommendations.push('Consult healthcare provider if symptoms worsen');
        recommendations.push('Maintain adequate hydration and rest');
    }
  }

  // Check vitals for red flags
  if (vitals) {
    if (vitals.temperature && vitals.temperature > 39) {
      recommendations.push('High fever detected - monitor closely and seek care if persistent');
    }
    if (vitals.bloodPressure) {
      if (vitals.bloodPressure.systolic > 180 || vitals.bloodPressure.diastolic > 120) {
        recommendations.push('Hypertensive crisis indicators - seek immediate care');
        urgency = 'urgent';
      }
    }
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 92) {
      recommendations.push('Low oxygen saturation - supplemental oxygen may be needed');
      urgency = 'urgent';
    }
  }

  // Check medical history for context
  if (medicalHistory && medicalHistory.length > 0) {
    recommendations.push(`Note: Patient has history of ${medicalHistory.join(', ')} - factor into treatment decisions`);
  }

  // Confidence level
  const avgConfidence = diagnoses.length > 0
    ? diagnoses.reduce((sum, d) => sum + d.confidence, 0) / diagnoses.length
    : 0;
  const confidenceLevel: DiagnosisResult['confidenceLevel'] =
    avgConfidence >= 80 ? 'high' :
    avgConfidence >= 50 ? 'medium' : 'low';

  return {
    diagnoses,
    differentialDiagnoses: diagnoses.slice(1),
    confidenceLevel,
    reasoning: diagnoses.length > 0
      ? `Based on ${symptoms.length} reported symptoms, ${diagnoses.length} potential conditions identified. Top diagnosis has ${diagnoses[0].confidence}% confidence.`
      : 'Insufficient symptoms for reliable diagnosis',
    recommendations,
    urgency,
    referralNeeded,
    followUpTimeframe
  };
}

// ============================================
// API ROUTES
// ============================================

/**
 * Submit symptoms for AI diagnosis
 */
app.post('/api/diagnosis/analyze', (req: Request, res: Response) => {
  try {
    const request: DiagnosisRequest = req.body;

    if (!request.symptoms || request.symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one symptom is required'
      });
    }

    const result = analyzeSymptoms(request);

    console.log(`[${new Date().toISOString()}] Diagnosis analysis for ${request.patientId || 'unknown'}`);
    console.log(`  Top diagnosis: ${result.diagnoses[0]?.name || 'None'}`);
    console.log(`  Urgency: ${result.urgency}`);

    res.json({
      success: true,
      ...result,
      disclaimer: 'This AI diagnosis is for assistance only. Always consult a qualified healthcare professional for medical decisions.'
    });
  } catch (error) {
    console.error('Diagnosis error:', error);
    res.status(500).json({ success: false, error: 'Diagnosis analysis failed' });
  }
});

/**
 * Get all conditions
 */
app.get('/api/conditions', (req: Request, res: Response) => {
  try {
    const { category, severity, search } = req.query;
    let result = conditions;

    if (category) {
      result = result.filter(c => c.category.toLowerCase() === String(category).toLowerCase());
    }
    if (severity) {
      result = result.filter(c => c.severity === severity);
    }
    if (search) {
      const searchLower = String(search).toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.symptoms.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      conditions: result.map(c => ({
        code: c.code,
        name: c.name,
        category: c.category,
        severity: c.severity,
        symptoms: c.symptoms,
        icdCode: c.icdCode
      })),
      total: result.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get conditions' });
  }
});

/**
 * Get condition by code
 */
app.get('/api/conditions/:code', (req: Request, res: Response) => {
  try {
    const condition = conditions.find(c => c.code === req.params.code);
    if (!condition) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    res.json({
      success: true,
      condition
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get condition' });
  }
});

/**
 * Get symptoms for condition
 */
app.get('/api/conditions/:code/symptoms', (req: Request, res: Response) => {
  try {
    const condition = conditions.find(c => c.code === req.params.code);
    if (!condition) {
      return res.status(404).json({ error: 'Condition not found' });
    }

    res.json({
      success: true,
      condition: condition.name,
      symptoms: condition.symptoms,
      severity: condition.severity
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get symptoms' });
  }
});

/**
 * Check symptom severity
 */
app.post('/api/symptoms/check', (req: Request, res: Response) => {
  try {
    const { symptoms, vitals } = req.body;

    const alerts: string[] = [];
    const warnings: string[] = [];

    // Check symptom combinations
    const symptomSet = symptoms.map((s: any) => s.name.toLowerCase());

    if (symptomSet.includes('chest pain') && symptomSet.includes('shortness of breath')) {
      alerts.push('CHEST PAIN + SHORTNESS OF BREATH - Possible cardiac event. Seek immediate care.');
    }
    if (symptomSet.includes('confusion') && symptomSet.includes('fever')) {
      alerts.push('CONFUSION + FEVER - Possible serious infection. Urgent evaluation needed.');
    }
    if (symptomSet.includes('severe headache') && symptomSet.includes('stiff neck')) {
      alerts.push('SEVERE HEADACHE + STIFF NECK - Possible meningitis. Seek immediate care.');
    }
    if (symptomSet.includes('vomiting') && symptomSet.includes('headache')) {
      warnings.push('VOMITING + HEADACHE - Monitor for neurological issues.');
    }

    // Check vitals
    if (vitals) {
      if (vitals.temperature > 40) {
        alerts.push(`HIGH FEVER (${vitals.temperature}°C) - Seek medical attention immediately.`);
      }
      if (vitals.bloodPressure?.systolic > 180) {
        alerts.push(`SEVERE HYPERTENSION (${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}) - Urgent care needed.`);
      }
      if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) {
        alerts.push(`LOW OXYGEN (${vitals.oxygenSaturation}%) - Seek immediate medical attention.`);
      }
    }

    res.json({
      success: true,
      alerts,
      warnings,
      assessment: alerts.length > 0 ? 'CRITICAL' : warnings.length > 0 ? 'REQUIRES_ATTENTION' : 'STABLE'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check symptoms' });
  }
});

/**
 * Get diagnosis history
 */
app.get('/api/diagnosis/history/:patientId', (req: Request, res: Response) => {
  try {
    // In a real system, this would fetch from database
    res.json({
      success: true,
      patientId: req.params.patientId,
      diagnoses: [],
      message: 'Diagnosis history feature - requires database integration'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'diagnosis-ai',
    version: '1.0.0',
    port: PORT,
    capabilities: [
      'Symptom analysis',
      'Differential diagnosis',
      'ICD code mapping',
      'Treatment recommendations',
      'Urgency assessment'
    ],
    stats: {
      conditionsInDB: conditions.length,
      symptomMappings: symptomConditions.size
    }
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'CARECODE Diagnosis AI',
    description: 'AI-powered clinical decision support for diagnosis',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/diagnosis/analyze',
      conditions: 'GET /api/conditions',
      symptoms: 'POST /api/symptoms/check',
      history: 'GET /api/diagnosis/history/:patientId'
    },
    disclaimer: 'For clinical assistance only. Not a substitute for professional medical advice.'
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CARECODE DIAGNOSIS AI v1.0.0              ║
║                                                         ║
║  Tagline: "AI That Assists Clinical Decision Making"   ║
║  Port: ${PORT}                                               ║
║                                                         ║
║  Capabilities:                                         ║
║  • Symptom Analysis                                    ║
║  • Differential Diagnosis                              ║
║  • ICD Code Mapping                                    ║
║  • Urgency Assessment                                  ║
║  • Treatment Recommendations                           ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export { app, analyzeSymptoms, conditions };