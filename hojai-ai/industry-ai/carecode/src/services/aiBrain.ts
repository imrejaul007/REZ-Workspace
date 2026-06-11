/**
 * CARECODE AI BRAIN - Healthcare AI Intelligence Layer
 * Port: 4102
 * Provides: Patient Triage, Appointment Suggestions, Prescription Analysis, Lab Interpretation, Patient Education
 */

import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'carecode-ai-brain' },
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
const HOJAI_BRAIN_URL = process.env.HOJAI_BRAIN_URL || 'http://localhost:4800';

// ============================================
// URGENCY LEVELS & TRIAGE LOGIC
// ============================================

const URGENCY_LEVELS = {
  ER: {
    level: 1,
    label: 'Emergency - Seek Immediate Care',
    color: 'red',
    timeLimit: 'Immediately',
    examples: ['chest pain', 'stroke symptoms', 'severe bleeding', 'unconsciousness', 'Difficulty breathing', 'severe allergic reaction'],
  },
  URGENT: {
    level: 2,
    label: 'Urgent Care - Within 1-2 Hours',
    color: 'orange',
    timeLimit: '1-2 hours',
    examples: ['high fever', 'broken bones', 'severe burns', 'head injury', 'persistent vomiting'],
  },
  SAME_DAY: {
    level: 3,
    label: 'Same Day Appointment Recommended',
    color: 'yellow',
    timeLimit: 'Same day',
    examples: ['moderate pain', 'infection symptoms', 'cut requiring stitches', 'fever over 101°F'],
  },
  SCHEDULED: {
    level: 4,
    label: 'Schedule Appointment Within 1-3 Days',
    color: 'green',
    timeLimit: '1-3 days',
    examples: ['mild symptoms', 'chronic condition follow-up', 'prescription refill', 'routine checkup'],
  },
  ROUTINE: {
    level: 5,
    label: 'Routine - Schedule Within 1-2 Weeks',
    color: 'blue',
    timeLimit: '1-2 weeks',
    examples: ['general consultation', 'second opinion', 'preventive care', 'non-urgent concerns'],
  },
};

// ============================================
// DOCTOR TYPES BY CONDITION
// ============================================

const DOCTOR_TYPES: Record<string, { specialty: string; duration: number; description: string }> = {
  'chest pain': { specialty: 'Cardiology', duration: 30, description: 'Heart and cardiovascular system' },
  'shortness of breath': { specialty: 'Pulmonology', duration: 30, description: 'Lungs and respiratory system' },
  'fever': { specialty: 'General Medicine', duration: 15, description: 'Primary care for infections' },
  'headache': { specialty: 'Neurology', duration: 20, description: 'Brain and nervous system' },
  'stomach pain': { specialty: 'Gastroenterology', duration: 20, description: 'Digestive system' },
  'diabetes': { specialty: 'Endocrinology', duration: 30, description: 'Hormonal and metabolic disorders' },
  'hypertension': { specialty: 'Cardiology', duration: 20, description: 'Blood pressure management' },
  'skin rash': { specialty: 'Dermatology', duration: 15, description: 'Skin conditions' },
  'joint pain': { specialty: 'Orthopedics', duration: 20, description: 'Bones, joints, and muscles' },
  'mental health': { specialty: 'Psychiatry', duration: 45, description: 'Mental health and wellness' },
  'eye problems': { specialty: 'Ophthalmology', duration: 20, description: 'Eye care' },
  'ear pain': { specialty: 'ENT', duration: 15, description: 'Ear, nose, and throat' },
  'pregnancy': { specialty: 'Obstetrics', duration: 30, description: 'Pregnancy and maternal care' },
  'children': { specialty: 'Pediatrics', duration: 20, description: 'Child healthcare' },
  'default': { specialty: 'General Medicine', duration: 15, description: 'Primary care physician' },
};

// ============================================
// COMMON DRUG INTERACTIONS
// ============================================

const DRUG_INTERACTIONS: Record<string, { interactsWith: string[]; severity: 'high' | 'moderate' | 'low'; description: string }[]> = {
  warfarin: [
    { interactsWith: ['aspirin', 'ibuprofen', 'naproxen'], severity: 'high', description: 'Increased bleeding risk' },
    { interactsWith: ['metronidazole', 'fluconazole'], severity: 'high', description: 'Increased warfarin effect' },
    { interactsWith: ['vitamin K'], severity: 'high', description: 'Decreased warfarin effect' },
  ],
  metformin: [
    { interactsWith: ['contrast dye'], severity: 'high', description: 'Risk of lactic acidosis' },
    { interactsWith: ['alcohol'], severity: 'moderate', description: 'Increased hypoglycemia risk' },
  ],
  lisinopril: [
    { interactsWith: ['potassium supplements', 'spironolactone'], severity: 'moderate', description: 'Risk of hyperkalemia' },
    { interactsWith: ['ibuprofen', 'naproxen'], severity: 'moderate', description: 'Reduced blood pressure effect' },
  ],
  amlodipine: [
    { interactsWith: ['simvastatin'], severity: 'moderate', description: 'Increased statin levels' },
  ],
  aspirin: [
    { interactsWith: ['ibuprofen', 'naproxen'], severity: 'moderate', description: 'Reduced cardioprotective effect' },
    { interactsWith: ['warfarin'], severity: 'high', description: 'Increased bleeding risk' },
  ],
  omeprazole: [
    { interactsWith: ['clopidogrel'], severity: 'high', description: 'Reduced antiplatelet effect' },
    { interactsWith: ['methotrexate'], severity: 'moderate', description: 'Increased methotrexate levels' },
  ],
  levothyroxine: [
    { interactsWith: ['calcium', 'iron', 'antacids'], severity: 'moderate', description: 'Reduced thyroid absorption' },
 ],
  digoxin: [
    { interactsWith: ['amiodarone', 'verapamil'], severity: 'high', description: 'Increased digoxin levels' },
    { interactsWith: ['thiazide diuretics'], severity: 'moderate', description: 'Increased digoxin toxicity risk' },
  ],
  clopidogrel: [
    { interactsWith: ['omeprazole', 'esomeprazole'], severity: 'high', description: 'Reduced antiplatelet effect' },
  ],
};

// ============================================
// LAB REFERENCE RANGES
// ============================================

const LAB_REFERENCES: Record<string, Record<string, { normal: [number, number]; unit: string; interpretation: string }>> = {
  CBC: {
    hemoglobin: { normal: [12.0, 17.5], unit: 'g/dL', interpretation: 'Oxygen-carrying protein in red blood cells' },
    hematocrit: { normal: [36, 50], unit: '%', interpretation: 'Percentage of red blood cells in blood' },
    WBC: { normal: [4.5, 11.0], unit: 'K/uL', interpretation: 'White blood cells - infection fighting' },
    platelets: { normal: [150, 400], unit: 'K/uL', interpretation: 'Blood clotting cells' },
    RBC: { normal: [4.5, 5.5], unit: 'M/uL', interpretation: 'Red blood cell count' },
  },
  LIPID: {
    totalCholesterol: { normal: [0, 200], unit: 'mg/dL', interpretation: 'Total cholesterol level' },
    LDL: { normal: [0, 100], unit: 'mg/dL', interpretation: 'Bad cholesterol' },
    HDL: { normal: [40, 60], unit: 'mg/dL', interpretation: 'Good cholesterol' },
    triglycerides: { normal: [0, 150], unit: 'mg/dL', interpretation: 'Fat in the blood' },
  },
  LFT: {
    ALT: { normal: [7, 56], unit: 'U/L', interpretation: 'Liver enzyme - ALT' },
    AST: { normal: [10, 40], unit: 'U/L', interpretation: 'Liver enzyme - AST' },
    bilirubin: { normal: [0.1, 1.2], unit: 'mg/dL', interpretation: 'Liver function marker' },
    albumin: { normal: [3.5, 5.5], unit: 'g/dL', interpretation: 'Liver protein production' },
  },
  renal: {
    creatinine: { normal: [0.7, 1.3], unit: 'mg/dL', interpretation: 'Kidney function marker' },
    BUN: { normal: [7, 20], unit: 'mg/dL', interpretation: 'Blood urea nitrogen' },
    eGFR: { normal: [90, 120], unit: 'mL/min/1.73m²', interpretation: 'Estimated kidney filtration' },
  },
  metabolic: {
    glucose: { normal: [70, 100], unit: 'mg/dL', interpretation: 'Blood sugar level' },
    HbA1c: { normal: [4.0, 5.6], unit: '%', interpretation: 'Average blood sugar over 3 months' },
    sodium: { normal: [136, 145], unit: 'mEq/L', interpretation: 'Electrolyte balance' },
    potassium: { normal: [3.5, 5.0], unit: 'mEq/L', interpretation: 'Heart and muscle function' },
  },
};

// ============================================
// PATIENT EDUCATION TEMPLATES
// ============================================

const EDUCATION_TEMPLATES: Record<string, { general: string; diet: string[]; lifestyle: string[]; warnings: string[]; followUp: string }> = {
  diabetes: {
    general: 'Diabetes is a chronic condition affecting how your body processes blood sugar (glucose). Type 2 diabetes, the most common form, occurs when your body resists insulin or does not produce enough insulin.',
    diet: [
      'Focus on complex carbohydrates (whole grains, vegetables, legumes)',
      'Limit simple sugars and refined carbohydrates',
      'Include lean proteins and healthy fats',
      'Eat regular meals to avoid blood sugar spikes',
      'Monitor carbohydrate intake per meal',
    ],
    lifestyle: [
      'Exercise at least 150 minutes per week',
      'Monitor blood glucose levels regularly',
      'Maintain a healthy weight',
      'Get adequate sleep (7-8 hours)',
      'Manage stress through relaxation techniques',
    ],
    warnings: [
      'Watch for signs of hypoglycemia (shakiness, sweating, confusion)',
      'Seek immediate care for extreme hyperglycemia',
      'Regular foot exams to prevent complications',
      'Annual eye exams to check for diabetic retinopathy',
    ],
    followUp: 'Schedule HbA1c test every 3 months. Target HbA1c < 7% for most adults.',
  },
  hypertension: {
    general: 'High blood pressure (hypertension) means the force of blood against your artery walls is consistently too high. Over time, this can damage blood vessels and increase risk of heart disease, stroke, and kidney problems.',
    diet: [
      'Follow DASH diet (low sodium, high potassium)',
      'Limit sodium to < 2,300mg per day',
      'Increase potassium-rich foods (bananas, leafy greens)',
      'Limit alcohol consumption',
      'Reduce processed and restaurant foods',
    ],
    lifestyle: [
      'Regular aerobic exercise (30 minutes,5 days/week)',
      'Maintain healthy weight',
      'Quit smoking if applicable',
      'Manage stress levels',
      'Limit caffeine intake',
    ],
    warnings: [
      'BP > 180/120 requires immediate medical attention',
      'Report severe headaches or vision changes',
      'Chest pain or shortness of breath is an emergency',
      'Some BP medications may cause dizziness',
    ],
    followUp: 'Monitor BP at home regularly. Follow-up every 1-3 months until controlled.',
  },
  'common cold': {
    general: 'The common cold is a viral infection of your nose and throat (upper respiratory tract). While most people recover within 7-10 days, symptoms can significantly impact daily life.',
    diet: [
      'Stay well hydrated with water and warm fluids',
      'Eat chicken soup for its anti-inflammatory benefits',
      'Include vitamin C-rich foods (citrus, berries)',
      'Avoid dairy if it increases mucus production',
      'Honey can soothe sore throat',
    ],
    lifestyle: [
      'Get plenty of rest',
      'Use humidifier to ease congestion',
      'Gargle with warm salt water',
      'Stay home to prevent spreading',
      'Wash hands frequently',
    ],
    warnings: [
      'Fever > 103°F or lasting > 3 days needs evaluation',
      'Difficulty breathing requires urgent care',
      'Symptoms lasting > 10 days, see doctor',
      'Severe headache or sinus pain may indicate sinus infection',
    ],
    followUp: 'Most colds resolve in 7-10 days. Seek care if symptoms worsen or do not improve.',
  },
  default: {
    general: 'Please follow your healthcare provider\'s recommendations and attend all scheduled appointments.',
    diet: ['Maintain a balanced, nutritious diet', 'Stay well hydrated', 'Limit processed foods and sugars'],
    lifestyle: ['Get adequate sleep', 'Exercise regularly', 'Manage stress', 'Attend preventive care appointments'],
    warnings: ['Complete all prescribed tests and follow-ups', 'Report any new or worsening symptoms'],
    followUp: 'Follow up as directed by your healthcare provider.',
  },
};

// ============================================
// MEDICAL BILLING CODES SUGGESTIONS
// ============================================

const BILLING_CODES: Record<string, { cpt: { code: string; description: string }[]; icd10: { code: string; description: string }[] }> = {
  'routine checkup': {
    cpt: [
      { code: '99213', description: 'Office visit, established patient, low complexity' },
      { code: '99214', description: 'Office visit, established patient, moderate complexity' },
    ],
    icd10: [{ code: 'Z00.00', description: 'Encounter for general adult medical examination' }],
  },
  'annual wellness': {
    cpt: [
      { code: '99385', description: 'Initial preventive medicine, 18-39 years' },
      { code: '99395', description: 'Periodic preventive medicine, 18-39 years' },
    ],
    icd10: [{ code: 'Z00.00', description: 'Encounter for general adult medical examination' }],
  },
  'follow-up': {
    cpt: [
      { code: '99211', description: 'Office visit, minimal complexity' },
      { code: '99212', description: 'Office visit, straightforward' },
    ],
    icd10: [{ code: 'Z09', description: 'Encounter for follow-up examination after completed treatment' }],
  },
  'urgent care': {
    cpt: [
      { code: '99281', description: 'Emergency department visit, straightforward' },
      { code: '99282', description: 'Emergency department visit, low complexity' },
    ],
    icd10: [{ code: 'R51', description: 'Headache' }],
  },
};

// ============================================
// AI BRAIN CLASS
// ============================================

export class CareCodeAIBrain {
  private anthropicKey: string | undefined;
  private hojaiUrl: string;

  constructor() {
    this.anthropicKey = ANTHROPIC_API_KEY;
    this.hojaiUrl = HOJAI_BRAIN_URL;
  }

  /**
   * Call Claude AI for advanced medical reasoning
   */
  private async callClaude(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.anthropicKey) {
      logger.warn('Claude API key not configured, using fallback logic');
      return 'AI analysis unavailable - please consult healthcare provider';
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
          system: systemPrompt || 'You are a medical AI assistant. Provide helpful, accurate health information while always recommending professional medical consultation for serious concerns.',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );
      return response.data.content[0].text;
    } catch (error: any) {
      logger.error('Claude API error:', error.message);
      return 'AI analysis unavailable - please consult healthcare provider';
    }
  }

  /**
   * Analyze symptoms and determine urgency level
   */
  async triage(symptoms: string[], patientHistory?: any): Promise<{
    urgency: string;
    urgencyDetails: any;
    recommendations: string[];
    suggestedActions: string[];
    symptomsAnalyzed: string[];
  }> {
    const symptomString = symptoms.join(', ').toLowerCase();

    // Check for emergency symptoms
    const emergencyKeywords = ['chest pain', 'stroke', 'unconscious', 'severe bleeding', 'can\'t breathe', 'difficulty breathing', 'severe allergic reaction', 'anaphylaxis'];
    const urgentKeywords = ['high fever', 'broken bone', 'severe burn', 'head injury', 'persistent vomiting blood'];

    let urgency = 'SCHEDULED';
    let recommendations: string[] = [];
 let suggestedActions: string[] = [];

    for (const symptom of symptoms) {
      const lowerSymptom = symptom.toLowerCase();

      if (emergencyKeywords.some(k => lowerSymptom.includes(k))) {
        urgency = 'ER';
        recommendations.push('Call emergency services (911) immediately');
        recommendations.push('Do not drive yourself to the hospital');
        suggestedActions.push('Call911 or have someone call for you');
        suggestedActions.push('Stay calm and remain still if experiencing chest pain or stroke symptoms');
        break;
      }

      if (urgentKeywords.some(k => lowerSymptom.includes(k))) {
        urgency = 'URGENT';
        recommendations.push('Seek urgent care or emergency room within 1-2 hours');
        suggestedActions.push('Contact nearest urgent care or emergency department');
      }
    }

    if (urgency === 'SCHEDULED') {
      // Use Claude for nuanced triage
      const aiAnalysis = await this.callClaude(
        `Analyze these symptoms for triage urgency: ${symptomString}. Patient history: ${JSON.stringify(patientHistory || {})}.
 Determine if same-day appointment is needed or if scheduling within 1-3 days is appropriate.`,
        'You are a medical triage assistant. Analyze symptoms and recommend urgency level: ER (immediate), URGENT (1-2 hours), SAME_DAY, SCHEDULED (1-3 days), or ROUTINE (1-2 weeks).'
      );

      if (aiAnalysis.toLowerCase().includes('same day')) {
        urgency = 'SAME_DAY';
        recommendations.push('Schedule appointment for today if possible');
        suggestedActions.push('Call clinic for same-day availability');
      }
    }

    if (urgency === 'SCHEDULED') {
      recommendations.push('Schedule appointment within 1-3 days');
      recommendations.push('Monitor symptoms and seek immediate care if they worsen');
      suggestedActions.push('Use online booking or call clinic for appointment');
    }

    return {
      urgency,
      urgencyDetails: URGENCY_LEVELS[urgency as keyof typeof URGENCY_LEVELS],
      recommendations,
      suggestedActions,
      symptomsAnalyzed: symptoms,
    };
  }

  /**
   * Suggest appointment details based on condition
   */
  async suggestAppointment(patientId: string, condition: string, urgency: string): Promise<{
    suggestedTime: string;
    doctorType: string;
    duration: number;
    specialty: string;
    preparation: string[];
    estimatedCost: string;
  }> {
    const lowerCondition = condition.toLowerCase();
    let doctorInfo = DOCTOR_TYPES['default'];

    // Match condition to specialty
    for (const [key, value] of Object.entries(DOCTOR_TYPES)) {
      if (lowerCondition.includes(key)) {
        doctorInfo = value;
        break;
      }
    }

    // Calculate suggested time based on urgency
    const now = new Date();
    let suggestedTime: string;

    switch (urgency) {
      case 'ER':
        suggestedTime = 'Immediately - Go to Emergency Room';
        break;
      case 'URGENT':
        now.setHours(now.getHours() + 2);
        suggestedTime = now.toISOString();
        break;
      case 'SAME_DAY':
        suggestedTime = new Date(now.setHours(now.getHours() + 4)).toISOString();
        break;
      case 'SCHEDULED':
        now.setDate(now.getDate() + 1);
        suggestedTime = now.toISOString();
        break;
      default:
        now.setDate(now.getDate() + 3);
        suggestedTime = now.toISOString();
    }

    // Prepare instructions based on condition
    const preparation: string[] = [];
    if (lowerCondition.includes('blood') || lowerCondition.includes('test')) {
      preparation.push('Fast for 8-12 hours if fasting blood work ordered');
      preparation.push('Bring list of current medications');
    }
    if (lowerCondition.includes('stomach') || lowerCondition.includes('digestive')) {
      preparation.push('Note any foods that trigger symptoms');
      preparation.push('Bring3-day food diary if available');
    }

    return {
      suggestedTime,
      doctorType: doctorInfo.specialty,
      duration: doctorInfo.duration,
      specialty: doctorInfo.description,
      preparation,
      estimatedCost: `$${20 + (doctorInfo.duration * 5)} - $${50 + (doctorInfo.duration * 10)}`,
    };
  }

  /**
   * Analyze prescriptions for drug interactions
   */
  async analyzePrescription(medications: string[]): Promise<{
    interactions: { drug1: string; drug2: string; severity: string; description: string }[];
    warnings: string[];
    recommendations: string[];
    safeMedications: string[];
  }> {
    const interactions: { drug1: string; drug2: string; severity: string; description: string }[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const safeMedications: string[] = [];

    for (let i = 0; i < medications.length; i++) {
      const med1 = medications[i].toLowerCase();
      let foundInteraction = false;

      for (let j = i + 1; j < medications.length; j++) {
        const med2 = medications[j].toLowerCase();

        // Check if med1 has known interactions
        const med1Interactions = DRUG_INTERACTIONS[med1];
        if (med1Interactions) {
          for (const interaction of med1Interactions) {
            if (interaction.interactsWith.some(iw => med2.includes(iw))) {
              interactions.push({
                drug1: medications[i],
                drug2: medications[j],
                severity: interaction.severity,
                description: interaction.description,
              });
              foundInteraction = true;

              if (interaction.severity === 'high') {
                warnings.push(`HIGH RISK: ${medications[i]} + ${medications[j]} - ${interaction.description}`);
                recommendations.push('Consult pharmacist before taking together');
              }
            }
          }
        }

        // Check if med2 has known interactions
        const med2Interactions = DRUG_INTERACTIONS[med2];
        if (med2Interactions) {
          for (const interaction of med2Interactions) {
            if (interaction.interactsWith.some(iw => med1.includes(iw))) {
              interactions.push({
                drug1: medications[j],
                drug2: medications[i],
                severity: interaction.severity,
                description: interaction.description,
              });
              foundInteraction = true;
            }
          }
        }
      }

      if (!foundInteraction) {
        safeMedications.push(medications[i]);
      }
    }

    if (interactions.length === 0) {
      recommendations.push('No significant interactions found');
      recommendations.push('Always inform your healthcare provider of all medications including OTC and supplements');
    } else {
      recommendations.push('Discuss these interactions with your prescribing physician');
      recommendations.push('Never stop prescribed medications without consulting your doctor');
    }

    return { interactions, warnings, recommendations, safeMedications };
  }

  /**
   * Interpret lab results
   */
  async interpretLabs(labType: string, values: Record<string, number>): Promise<{
    interpretation: string;
    findings: { parameter: string; value: number; normal: string; status: string; interpretation: string }[];
    recommendations: string[];
    followUp: string;
  }> {
    const labRef = LAB_REFERENCES[labType.toUpperCase()];
    const findings: { parameter: string; value: number; normal: string; status: string; interpretation: string }[] = [];

    if (!labRef) {
      return {
        interpretation: `Lab type "${labType}" not in standard reference database. Please consult healthcare provider.`,
        findings: [],
        recommendations: ['Consult with ordering physician for interpretation'],
        followUp: 'Discuss results with your healthcare provider within 1 week.',
      };
    }

    for (const [param, value] of Object.entries(values)) {
      const paramLower = param.toLowerCase();
      const ref = labRef[paramLower];

      if (ref) {
        const [min, max] = ref.normal;
        let status = 'Normal';
        if (value < min) status = 'Low';
        else if (value > max) status = 'High';

        findings.push({
          parameter: param,
          value,
          normal: `${min} - ${max} ${ref.unit}`,
          status,
          interpretation: ref.interpretation,
        });
      }
    }

    const abnormalCount = findings.filter(f => f.status !== 'Normal').length;
    let interpretation = '';
    let recommendations: string[] = [];
    let followUp = '';

    if (abnormalCount === 0) {
      interpretation = 'All values within normal range';
      followUp = 'Continue routine screening as recommended by your healthcare provider';
    } else {
      const highResults = findings.filter(f => f.status === 'High');
      const lowResults = findings.filter(f => f.status === 'Low');

      if (highResults.length > 0) {
        interpretation += `Elevated values: ${highResults.map(r => r.parameter).join(', ')}. `;
        recommendations.push('Discuss elevated values with your healthcare provider');
 }

      if (lowResults.length > 0) {
        interpretation += `Low values: ${lowResults.map(r => r.parameter).join(', ')}. `;
        recommendations.push('Review low values with your healthcare provider');
      }

      recommendations.push('Follow any dietary or lifestyle recommendations provided');
      recommendations.push('Schedule follow-up testing as directed');
 followUp = abnormalCount > 2
        ? 'Multiple abnormal values - follow up within 1 week'
        : 'Follow up within 2-4 weeks to review results';
    }

    return { interpretation, findings, recommendations, followUp };
  }

  /**
   * Generate patient education
   */
  async educatePatient(condition: string, patientAge?: number, additionalContext?: any): Promise<{
    education: string;
    diet: string[];
    lifestyle: string[];
    warnings: string[];
    followUp: string;
    resources: { title: string; url: string }[];
  }> {
    const lowerCondition = condition.toLowerCase();
    let template = EDUCATION_TEMPLATES['default'];

    // Match condition to education template
    for (const [key, value] of Object.entries(EDUCATION_TEMPLATES)) {
      if (lowerCondition.includes(key)) {
        template = value;
        break;
      }
    }

    // Age-specific modifications
    let ageAdjustedDiet = [...template.diet];
    let ageAdjustedLifestyle = [...template.lifestyle];

    if (patientAge && patientAge > 65) {
      ageAdjustedDiet.push('Ensure adequate protein intake for muscle maintenance');
      ageAdjustedLifestyle.push('Use fall prevention measures');
      ageAdjustedLifestyle.push('Regular bone density screening');
    } else if (patientAge && patientAge < 18) {
      ageAdjustedDiet.push('Age-appropriate portion sizes');
      ageAdjustedLifestyle.push('Limit screen time');
      ageAdjustedLifestyle.push('Ensure adequate physical activity');
    }

    // Generate AI-enhanced education
    const aiEducation = await this.callClaude(
      `Provide patient education for: ${condition}. Patient age: ${patientAge || 'not specified'}. Context: ${JSON.stringify(additionalContext || {})}.
 Generate a clear, empathetic explanation that a patient can understand.`,
      'You are a patient education specialist. Create clear, jargon-free health education content that empowers patients to manage their health.'
    );

    return {
      education: aiEducation !== 'AI analysis unavailable' ? aiEducation : template.general,
      diet: ageAdjustedDiet,
      lifestyle: ageAdjustedLifestyle,
      warnings: template.warnings,
      followUp: template.followUp,
      resources: [
        { title: 'MedlinePlus Health Information', url: 'https://medlineplus.gov/' },
        { title: 'CDC Health Information', url: 'https://www.cdc.gov/' },
      ],
    };
  }

  /**
   * Suggest medical billing codes
   */
  async suggestBillingCodes(visitType: string, diagnosis: string, complexity: 'low' | 'moderate' | 'high'): Promise<{
    cptCodes: { code: string; description: string; charge: string }[];
    icd10Codes: { code: string; description: string }[];
    modifiers: string[];
    notes: string[];
  }> {
    const lowerVisitType = visitType.toLowerCase();
    let billingInfo = BILLING_CODES['routine checkup'];

    for (const [key, value] of Object.entries(BILLING_CODES)) {
      if (lowerVisitType.includes(key)) {
        billingInfo = value;
        break;
      }
    }

    // Adjust CPT based on complexity
    let cptCodes = billingInfo.cpt.map(c => ({
      ...c,
      charge: complexity === 'high' ? `$${200 + Math.floor(Math.random() * 100)}` :
             complexity === 'moderate' ? `$${100 + Math.floor(Math.random() * 50)}` :
             `$${50 + Math.floor(Math.random() * 30)}`,
    }));

    // Add complexity modifier
    const modifiers: string[] = [];
    if (complexity === 'high') {
      modifiers.push('25 - Significant, separate E/M service');
 }

    const notes: string[] = [
      'Verify insurance coverage before providing service',
      'Document medical necessity in chart notes',
      'Ensure proper ICD-10 coding for claim submission',
    ];

    return {
      cptCodes,
      icd10Codes: billingInfo.icd10,
      modifiers,
      notes,
    };
  }

  /**
   * Sync with HOJAI Brain for enterprise intelligence
   */
  async syncToHOJAI(event: string, data: any): Promise<void> {
    try {
      await axios.post(
        `${this.hojaiUrl}/api/sync`,
        { entityType: 'carecode', event, data, timestamp: new Date().toISOString() },
        { headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token' } }
      );
      logger.info(`Synced to HOJAI: carecode/${event}`);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        logger.error(`HOJAI sync error:`, error.message);
      }
    }
  }
}

export const careCodeAIBrain = new CareCodeAIBrain();
export default careCodeAIBrain;
