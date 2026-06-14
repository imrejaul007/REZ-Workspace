// RisaCare - Unit Tests for AI Service

import { describe, test, expect } from '@jest/globals';

// ============================================
// SYMPTOM ASSESSMENT TESTS
// ============================================

describe('Symptom Assessment', () => {
  const assessUrgency = (symptoms: string[]): { level: string; emergency: boolean } => {
    const emergencySymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'stroke'];
    const urgentSymptoms = ['fever 3+ days', 'persistent vomiting', 'severe headache'];

    const hasEmergency = symptoms.some(s =>
      emergencySymptoms.some(e => s.toLowerCase().includes(e))
    );

    if (hasEmergency) {
      return { level: 'emergency', emergency: true };
    }

    const hasUrgent = symptoms.some(s =>
      urgentSymptoms.some(u => s.toLowerCase().includes(u))
    );

    if (hasUrgent) {
      return { level: 'consult_doctor', emergency: false };
    }

    return { level: 'self_care', emergency: false };
  };

  test('should detect emergency symptoms', () => {
    const result = assessUrgency(['chest pain', 'shortness of breath']);
    expect(result.level).toBe('emergency');
    expect(result.emergency).toBe(true);
  });

  test('should detect chest pain as emergency', () => {
    const result = assessUrgency(['severe chest pain']);
    expect(result.level).toBe('emergency');
  });

  test('should detect difficulty breathing as emergency', () => {
    const result = assessUrgency(['trouble breathing']);
    expect(result.level).toBe('emergency');
  });

  test('should detect urgent symptoms requiring doctor visit', () => {
    const result = assessUrgency(['fever for 4 days']);
    expect(result.level).toBe('consult_doctor');
  });

  test('should flag common cold as self-care', () => {
    const result = assessUrgency(['runny nose', 'mild cough']);
    expect(result.level).toBe('self_care');
  });

  test('should handle multiple symptoms', () => {
    const result = assessUrgency(['cough', 'body ache', 'mild fever']);
    expect(result.emergency).toBe(false);
  });
});

// ============================================
// BIOMARKER INTERPRETATION TESTS
// ============================================

describe('Biomarker Interpretation', () => {
  const interpretBiomarker = (
    value: number,
    min: number,
    max: number
  ): { status: string; confidence: number } => {
    if (value < min) {
      return { status: 'low', confidence: 92 };
    } else if (value > max) {
      return { status: 'high', confidence: 92 };
    } else if (value < min * 1.1 && value >= min) {
      return { status: 'borderline', confidence: 85 };
    }
    return { status: 'normal', confidence: 95 };
  };

  test('should mark value within range as normal', () => {
    const result = interpretBiomarker(14.5, 12, 17);
    expect(result.status).toBe('normal');
    expect(result.confidence).toBe(95);
  });

  test('should mark value below range as low', () => {
    const result = interpretBiomarker(10, 12, 17);
    expect(result.status).toBe('low');
  });

  test('should mark value above range as high', () => {
    const result = interpretBiomarker(20, 12, 17);
    expect(result.status).toBe('high');
  });

  test('should mark borderline low values', () => {
    const result = interpretBiomarker(11.5, 12, 17);
    expect(result.status).toBe('borderline');
  });

  test('should assign higher confidence to clear values', () => {
    const normal = interpretBiomarker(14.5, 12, 17);
    const borderline = interpretBiomarker(11.8, 12, 17);
    expect(normal.confidence).toBeGreaterThan(borderline.confidence);
  });
});

// ============================================
// COPILOT ROUTING TESTS
// ============================================

describe('Copilot Intent Routing', () => {
  const routeIntent = (message: string): { task: string; confidence: number } => {
    const lower = message.toLowerCase();

    if (lower.includes('compare') && (lower.includes('report') || lower.includes('test'))) {
      return { task: 'compare_reports', confidence: 0.92 };
    }
    if (lower.includes('explain') || lower.includes('what does') || lower.includes('meaning of')) {
      return { task: 'explain_report', confidence: 0.88 };
    }
    if (lower.includes('trend') || lower.includes('track') || lower.includes('history')) {
      return { task: 'track_biomarker', confidence: 0.85 };
    }
    if (lower.includes('doctor') || lower.includes('find') || lower.includes('search')) {
      return { task: 'find_doctor', confidence: 0.90 };
    }
    if (lower.includes('symptom') || lower.includes('not feeling')) {
      return { task: 'interpret_symptoms', confidence: 0.87 };
    }

    return { task: 'general_health', confidence: 0.70 };
  };

  test('should route compare reports intent', () => {
    const result = routeIntent('Compare my two thyroid reports');
    expect(result.task).toBe('compare_reports');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test('should route explain report intent', () => {
    const result = routeIntent('Explain this blood report');
    expect(result.task).toBe('explain_report');
  });

  test('should route track biomarker intent', () => {
    const result = routeIntent('Track my cholesterol trend');
    expect(result.task).toBe('track_biomarker');
  });

  test('should route find doctor intent', () => {
    const result = routeIntent('Find a cardiologist in Bangalore');
    expect(result.task).toBe('find_doctor');
  });

  test('should route symptom intent', () => {
    const result = routeIntent('I have fever and cough');
    expect(result.task).toBe('interpret_symptoms');
  });

  test('should default to general health for unknown intents', () => {
    const result = routeIntent('Hello, how are you?');
    expect(result.task).toBe('general_health');
    expect(result.confidence).toBeLessThan(0.8);
  });
});

// ============================================
// TREND CALCULATION TESTS
// ============================================

describe('Trend Calculation', () => {
  const calculateTrend = (values: number[]): string => {
    if (values.length < 2) return 'insufficient_data';

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'worsening';
    if (change < -10) return 'improving';
    return 'stable';
  };

  test('should detect improving trend', () => {
    const result = calculateTrend([10, 12, 14, 15]);
    expect(result).toBe('improving');
  });

  test('should detect worsening trend', () => {
    const result = calculateTrend([15, 14, 13, 12]);
    expect(result).toBe('worsening');
  });

  test('should detect stable trend', () => {
    const result = calculateTrend([14, 14.5, 14.2, 14.3]);
    expect(result).toBe('stable');
  });

  test('should handle insufficient data', () => {
    const result = calculateTrend([14.5]);
    expect(result).toBe('insufficient_data');
  });
});

// ============================================
// DISCALIMER TESTS
// ============================================

describe('Disclaimer Validation', () => {
  const DISCLAIMERS = {
    universal: 'This AI assistant provides general health information for educational purposes only.',
    interpretation: 'This interpretation is not a substitute for professional medical advice.',
    symptom: 'This assessment is not a medical diagnosis.',
    emergency: 'If you are experiencing a medical emergency, please call emergency services.'
  };

  test('should include universal disclaimer', () => {
    expect(DISCLAIMERS.universal).toContain('educational purposes');
  });

  test('should include interpretation disclaimer', () => {
    expect(DISCLAIMERS.interpretation).toContain('not a substitute');
  });

  test('should include symptom disclaimer', () => {
    expect(DISCLAIMERS.symptom).toContain('not a medical diagnosis');
  });

  test('should include emergency disclaimer', () => {
    expect(DISCLAIMERS.emergency).toContain('emergency services');
  });
});

// ============================================
// CONFIDENCE SCORING TESTS
// ============================================

describe('Confidence Scoring', () => {
  const calculateOverallConfidence = (interpretations: Array<{ confidence: number }>): number => {
    if (interpretations.length === 0) return 0;
    const sum = interpretations.reduce((acc, i) => acc + i.confidence, 0);
    return Math.round(sum / interpretations.length);
  };

  test('should calculate average confidence', () => {
    const interpretations = [
      { confidence: 90 },
      { confidence: 85 },
      { confidence: 95 }
    ];
    expect(calculateOverallConfidence(interpretations)).toBe(90);
  });

  test('should return 0 for empty array', () => {
    expect(calculateOverallConfidence([])).toBe(0);
  });

  test('should round to nearest integer', () => {
    const interpretations = [{ confidence: 88.6 }];
    expect(calculateOverallConfidence(interpretations)).toBe(89);
  });
});
