/**
 * Dental Twin Models
 *
 * Mongoose schemas for dental-specific health records
 */

const mongoose = require('mongoose');

// Tooth numbering: Universal Numbering System (1-32)
const TOOTH_POSITIONS = [
  // Upper right (from patient's perspective)
  '1', '2', '3', '4', '5', '6', '7', '8', // wisdom to central
  // Upper left
  '9', '10', '11', '12', '13', '14', '15', '16',
  // Lower left
  '17', '18', '19', '20', '21', '22', '23', '24',
  // Lower right
  '25', '26', '27', '28', '29', '30', '31', '32'
];

/**
 * Treatment Schema
 */
const treatmentSchema = new mongoose.Schema({
  treatmentType: {
    type: String,
    enum: [
      'filling', 'root_canal', 'extraction', 'crown', 'bridge',
      'implant', 'veneer', 'inlay', 'onlay', 'bonding',
      'fluoride', 'sealant', 'whitening', 'orthodontic', 'periodontal'
    ],
    required: true
  },
  toothNumber: {
    type: String,
    enum: TOOTH_POSITIONS,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  diagnosis: String,
  procedure: String,
  materials: [String],
  cost: Number,
  dentist: {
    name: String,
    registrationNumber: String
  },
  clinic: {
    name: String,
    address: String
  },
  notes: String,
  outcome: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'failed', 'needs_follow_up'],
    default: 'good'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  attachments: [{
    type: { type: String }, // 'xray', 'photo', 'document'
    url: String,
    description: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
});

/**
 * Dental Condition Schema
 */
const conditionSchema = new mongoose.Schema({
  condition: {
    type: String,
    enum: [
      'caries', 'cavity', 'crack', 'fracture', 'discoloration',
      'gum_disease', 'gingivitis', 'periodontitis',
      'sensitivity', 'bad_breath', 'grinding', 'tmj',
      'oral_cancer', 'leukoplakia', 'candidiasis',
      'abscess', 'infection', 'cyst', 'tumor'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['none', 'mild', 'moderate', 'severe'],
    default: 'mild'
  },
  toothNumber: {
    type: String,
    enum: [...TOOTH_POSITIONS, 'multiple', 'general'],
    required: true
  },
  diagnosedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'treated', 'monitoring', 'resolved', 'recurring'],
    default: 'active'
  },
  notes: String,
  treatmentPlan: String
});

/**
 * X-Ray Schema
 */
const xraySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  xrayType: {
    type: String,
    enum: [
      'bitewing', 'periapical', 'panoramic', 'cephalometric',
      'cone_beam_ct', 'occlusal', 'full_mouth_series'
    ],
    required: true
  },
  toothNumbers: [{
    type: String,
    enum: TOOTH_POSITIONS
  }],
  takenDate: {
    type: Date,
    default: Date.now
  },
  takenBy: {
    name: String,
    registrationNumber: String
  },
  clinic: {
    name: String,
    address: String
  },
  findings: {
    type: String,
    enum: ['normal', 'caries', 'infection', 'bone_loss', 'impacted', 'cyst', 'tumor', 'other']
  },
  findingsDetail: String,
  severity: {
    type: String,
    enum: ['none', 'mild', 'moderate', 'severe']
  },
  imageUrl: String,
  aiAnalysis: {
    performed: { type: Boolean, default: false },
    findings: [String],
    confidence: Number,
    recommendations: [String]
  },
  dentistReview: {
    reviewed: { type: Boolean, default: false },
    reviewedBy: String,
    reviewedAt: Date,
    notes: String
  }
});

/**
 * Oral Health Assessment Schema
 */
const oralHealthSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  assessedBy: {
    name: String,
    registrationNumber: String
  },
  overallHealth: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    required: true
  },
  gumHealth: {
    bleeding: { type: Boolean, default: false },
    swelling: { type: Boolean, default: false },
    recession: { type: Boolean, default: false },
    pocketDepth: {
      type: Map,
      of: Number // tooth number -> pocket depth in mm
    },
    overallStatus: {
      type: String,
      enum: ['healthy', 'mild', 'moderate', 'severe'],
      default: 'healthy'
    }
  },
  cavityRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  gumDiseaseRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  oralCancerRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  hygiene: {
    brushingFrequency: Number, // times per day
    flossingFrequency: String, // 'daily', 'occasionally', 'rarely', 'never'
    lastCleaning: Date
  },
  habits: {
    smoking: { type: Boolean, default: false },
    tobacco: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    grinding: { type: Boolean, default: false },
    nailBiting: { type: Boolean, default: false }
  },
  diet: {
    sugarIntake: { type: String, enum: ['low', 'medium', 'high'] },
    acidicFoods: { type: String, enum: ['low', 'medium', 'high'] }
  },
  recommendations: [String],
  nextCleaningDate: Date,
  nextCheckupDate: Date,
  notes: String
});

/**
 * Per-Tooth Record Schema
 */
const toothRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  toothNumber: {
    type: String,
    enum: TOOTH_POSITIONS,
    required: true
  },
  position: {
    type: String,
    enum: ['upper_right', 'upper_left', 'lower_right', 'lower_left']
  },
  quadrant: Number, // 1-4
  quadrantName: String,
  present: {
    type: Boolean,
    default: true
  },
  extractedDate: Date,
  extractedReason: String,
  artificial: {
    type: Boolean,
    default: false
  },
  artificialType: {
    type: String,
    enum: ['filling', 'crown', 'bridge', 'implant', 'denture', ' veneer', 'inlay', 'onlay']
  },
  conditions: [conditionSchema],
  treatments: [treatmentSchema],
  xrays: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'XRay'
  }],
  sensitivity: {
    type: String,
    enum: ['none', 'hot', 'cold', 'sweet', 'pressure', 'spontaneous'],
    default: 'none'
  },
  mobility: {
    type: Number,
    min: 0,
    max: 3,
    default: 0
  },
  prognosis: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'questionable', 'hopeless'],
    default: 'good'
  },
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for patient + tooth
toothRecordSchema.index({ patientId: 1, toothNumber: 1 }, { unique: true });

/**
 * Patient Dental Summary Schema
 */
const dentalSummarySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  lastVisit: Date,
  nextAppointment: Date,
  totalTreatments: {
    type: Number,
    default: 0
  },
  totalXrays: {
    type: Number,
    default: 0
  },
  activeConditions: {
    type: Number,
    default: 0
  },
  cavityRisk: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  gumHealth: {
    type: String,
    enum: ['healthy', 'mild', 'moderate', 'severe'],
    default: 'healthy'
  },
  missingTeeth: {
    type: Number,
    default: 0
  },
  filledTeeth: {
    type: Number,
    default: 0
  },
  crownedTeeth: {
    type: Number,
    default: 0
  },
  implantedTeeth: {
    type: Number,
    default: 0
  },
  rootCanals: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Export models
const Treatment = mongoose.model('Treatment', treatmentSchema);
const Condition = mongoose.model('Condition', conditionSchema);
const XRay = mongoose.model('XRay', xraySchema);
const OralHealth = mongoose.model('OralHealth', oralHealthSchema);
const ToothRecord = mongoose.model('ToothRecord', toothRecordSchema);
const DentalSummary = mongoose.model('DentalSummary', dentalSummarySchema);

module.exports = {
  Treatment,
  Condition,
  XRay,
  OralHealth,
  ToothRecord,
  DentalSummary,
  TOOTH_POSITIONS
};
