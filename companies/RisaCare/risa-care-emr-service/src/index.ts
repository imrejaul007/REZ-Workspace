/**
 * RisaCare EMR/EHR Service
 * Electronic Medical Records - Full EHR System
 *
 * Features:
 * - Patient demographics
 * - Medical history
 * - Vitals management
 * - Diagnoses (ICD-10)
 * - Medications
 * - Allergies
 * - Lab results
 * - Clinical notes
 * - Immunizations
 * - FHIR export
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();

const PORT = parseInt(process.env.PORT || '4778', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_emr';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

const PatientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true, index: true },
  mrn: String, // Medical Record Number
  demographics: {
    firstName: String,
    lastName: String,
    middleName: String,
    suffix: String,
    dateOfBirth: Date,
    gender: String,
    maritalStatus: String,
    ssn: String,
    preferredLanguage: String
  },
  contact: {
    phone: String,
    alternatePhone: String,
    email: String,
    address: {
      line1: String, line2: String,
      city: String, state: String, postalCode: String, country: String
    },
    emergencyContact: {
      name: String, relationship: String, phone: String
    }
  },
  insurance: {
    primary: { payer: String, policyNumber: String, groupNumber: String },
    secondary: { payer: String, policyNumber: String, groupNumber: String }
  },
  primaryProvider: String,
  status: { type: String, enum: ['active', 'inactive', 'deceased'], default: 'active' },
  registrationDate: Date
}, { timestamps: true });

const EncounterSchema = new mongoose.Schema({
  encounterId: { type: String, required: true, unique: true, index: true },
  patientId: { type: String, required: true, index: true },
  providerId: String,
  type: { type: String, enum: ['office', 'telehealth', 'inpatient', 'emergency', 'home'] },
  status: { type: String, enum: ['planned', 'in-progress', 'finished', 'cancelled'] },
  dateTime: Date,
  reason: String,
  chiefComplaint: String,
  notes: String,
  diagnosis: [{
    code: String, description: String, type: String, date: Date
  }],
  procedures: [{
    code: String, description: String, date: Date, performer: String
  }],
  vitals: mongoose.Schema.Types.Mixed,
  plan: String
}, { timestamps: true });

const DiagnosisSchema = new mongoose.Schema({
  diagnosisId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  encounterId: String,
  code: String,
  description: String,
  type: { type: String, enum: ['primary', 'secondary', 'differential', 'rule-out'] },
  status: { type: String, enum: ['active', 'resolved', 'chronic', 'inactive'] },
  onsetDate: Date,
  resolvedDate: Date,
  severity: String,
  notes: String
}, { timestamps: true });

const MedicationSchema = new mongoose.Schema({
  medicationId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  encounterId: String,
  name: String,
  genericName: String,
  dosage: String,
  route: String,
  frequency: String,
  instructions: String,
  prescribedBy: String,
  prescribedDate: Date,
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active', 'completed', 'discontinued', 'on-hold'] },
  refillsRemaining: Number,
  pharmacy: {
    name: String, address: String, phone: String
  }
}, { timestamps: true });

const AllergySchema = new mongoose.Schema({
  allergyId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  allergen: String,
  type: { type: String, enum: ['medication', 'food', 'environmental', 'other'] },
  reaction: String,
  severity: { type: String, enum: ['mild', 'moderate', 'severe', 'life-threatening'] },
  onsetDate: Date,
  status: { type: String, enum: ['active', 'inactive', 'resolved'] },
  verifiedBy: String,
  verifiedDate: Date
}, { timestamps: true });

const VitalSchema = new mongoose.Schema({
  vitalId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  encounterId: String,
  dateTime: Date,
  type: String,
  value: mongoose.Schema.Types.Mixed,
  unit: String,
  normalRange: {
    low: Number, high: Number
  },
  flag: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
  recordedBy: String
}, { timestamps: true });

const ImmunizationSchema = new mongoose.Schema({
  immunizationId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  vaccine: String,
  code: String,
  manufacturer: String,
  lotNumber: String,
  expirationDate: Date,
  date: Date,
  site: String,
  route: String,
  doseNumber: Number,
  series: String,
  administeredBy: String,
  location: String
}, { timestamps: true });

const ClinicalNoteSchema = new mongoose.Schema({
  noteId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  encounterId: String,
  authorId: String,
  authorName: String,
  type: { type: String, enum: ['progress', 'admission', 'discharge', 'consultation', 'procedure', 'nursing', 'other'] },
  template: String,
  content: String,
  signed: { type: Boolean, default: false },
  signedAt: Date,
  signedBy: String
}, { timestamps: true });

const LabResultSchema = new mongoose.Schema({
  resultId: { type: String, required: true, unique: true, index: true },
  patientId: String,
  encounterId: String,
  orderId: String,
  testName: String,
  code: String,
  category: String,
  result: String,
  value: Number,
  unit: String,
  referenceRange: {
    low: Number, high: Number, text: String
  },
  flag: { type: String, enum: ['normal', 'low', 'high', 'critical'] },
  specimenType: String,
  collectedAt: Date,
  reportedAt: Date,
  status: { type: String, enum: ['preliminary', 'final', 'corrected', 'cancelled'] },
  interpretation: String
}, { timestamps: true });

// Models
const Patient = mongoose.model('Patient', PatientSchema);
const Encounter = mongoose.model('Encounter', EncounterSchema);
const Diagnosis = mongoose.model('Diagnosis', DiagnosisSchema);
const Medication = mongoose.model('Medication', MedicationSchema);
const Allergy = mongoose.model('Allergy', AllergySchema);
const Vital = mongoose.model('Vital', VitalSchema);
const Immunization = mongoose.model('Immunization', ImmunizationSchema);
const ClinicalNote = mongoose.model('ClinicalNote', ClinicalNoteSchema);
const LabResult = mongoose.model('LabResult', LabResultSchema);

// ============================================
// ROUTES
// ============================================

app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'emr-service',
    version: '1.0.0',
    database: dbState === 1 ? 'connected' : 'disconnected'
  });
});

// ===== PATIENTS =====

app.post('/api/patients', async (req, res) => {
  const patient = await Patient.create({
    patientId: `pat_${uuidv4()}`,
    mrn: `MRN${Date.now()}`,
    registrationDate: new Date(),
    ...req.body
  });

  ecosystem.rez.emitIntent({
    intent: 'patient_registered',
    entities: { patientId: patient.patientId },
    confidence: 1.0,
    userId: patient.patientId,
    timestamp: new Date()
  }).catch(() => {});

  res.status(201).json({ success: true, patient });
});

app.get('/api/patients', async (req, res) => {
  const { search, status, limit = '50' } = req.query;
  const query: any = {};

  if (status) query.status = status;
  if (search) {
    query.$or = [
      { 'demographics.firstName': { $regex: search, $options: 'i' } },
      { 'demographics.lastName': { $regex: search, $options: 'i' } },
      { mrn: { $regex: search, $options: 'i' } }
    ];
  }

  const patients = await Patient.find(query).limit(parseInt(limit as string));
  res.json({ success: true, patients, total: patients.length });
});

app.get('/api/patients/:id', async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.id });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Get related records
  const [diagnoses, medications, allergies, encounters, vitals, immunizations] = await Promise.all([
    Diagnosis.find({ patientId: req.params.id }),
    Medication.find({ patientId: req.params.id }),
    Allergy.find({ patientId: req.params.id }),
    Encounter.find({ patientId: req.params.id }).sort({ dateTime: -1 }).limit(10),
    Vital.find({ patientId: req.params.id }).sort({ dateTime: -1 }).limit(20),
    Immunization.find({ patientId: req.params.id }).sort({ date: -1 })
  ]);

  res.json({
    success: true,
    patient,
    summary: {
      diagnoses: diagnoses.filter(d => d.status === 'active'),
      currentMedications: medications.filter(m => m.status === 'active'),
      allergies: allergies.filter(a => a.status === 'active'),
      recentEncounters: encounters,
      recentVitals: vitals,
      immunizations
    }
  });
});

app.patch('/api/patients/:id', async (req, res) => {
  const patient = await Patient.findOneAndUpdate(
    { patientId: req.params.id },
    req.body,
    { new: true }
  );
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json({ success: true, patient });
});

// ===== ENCOUNTERS =====

app.post('/api/encounters', async (req, res) => {
  const encounter = await Encounter.create({
    encounterId: `enc_${uuidv4()}`,
    dateTime: new Date(),
    ...req.body
  });
  res.status(201).json({ success: true, encounter });
});

app.get('/api/patients/:id/encounters', async (req, res) => {
  const encounters = await Encounter.find({ patientId: req.params.id })
    .sort({ dateTime: -1 }).limit(50);
  res.json({ success: true, encounters });
});

app.get('/api/encounters/:id', async (req, res) => {
  const encounter = await Encounter.findOne({ encounterId: req.params.id });
  if (!encounter) return res.status(404).json({ error: 'Encounter not found' });
  res.json({ success: true, encounter });
});

// ===== DIAGNOSES =====

app.post('/api/diagnoses', async (req, res) => {
  const diagnosis = await Diagnosis.create({
    diagnosisId: `diag_${uuidv4()}`,
    ...req.body
  });
  res.status(201).json({ success: true, diagnosis });
});

app.get('/api/patients/:id/diagnoses', async (req, res) => {
  const { status } = req.query;
  const query: any = { patientId: req.params.id };
  if (status) query.status = status;

  const diagnoses = await Diagnosis.find(query).sort({ onsetDate: -1 });
  res.json({ success: true, diagnoses });
});

// ===== MEDICATIONS =====

app.post('/api/medications', async (req, res) => {
  const medication = await Medication.create({
    medicationId: `med_${uuidv4()}`,
    prescribedDate: new Date(),
    ...req.body
  });
  res.status(201).json({ success: true, medication });
});

app.get('/api/patients/:id/medications', async (req, res) => {
  const { status } = req.query;
  const query: any = { patientId: req.params.id };
  if (status) query.status = status;

  const medications = await Medication.find(query).sort({ prescribedDate: -1 });
  res.json({ success: true, medications });
});

app.patch('/api/medications/:id', async (req, res) => {
  const medication = await Medication.findOneAndUpdate(
    { medicationId: req.params.id },
    req.body,
    { new: true }
  );
  if (!medication) return res.status(404).json({ error: 'Medication not found' });
  res.json({ success: true, medication });
});

// ===== ALLERGIES =====

app.post('/api/allergies', async (req, res) => {
  const allergy = await Allergy.create({
    allergyId: `allergy_${uuidv4()}`,
    ...req.body
  });
  res.status(201).json({ success: true, allergy });
});

app.get('/api/patients/:id/allergies', async (req, res) => {
  const allergies = await Allergy.find({ patientId: req.params.id });
  res.json({ success: true, allergies });
});

// ===== VITALS =====

app.post('/api/vitals', async (req, res) => {
  const { value, normalRange } = req.body;

  let flag = 'normal';
  if (normalRange && value) {
    if (value < normalRange.low) flag = 'low';
    else if (value > normalRange.high) flag = 'high';
  }

  const vital = await Vital.create({
    vitalId: `vital_${uuidv4()}`,
    dateTime: new Date(),
    flag,
    ...req.body
  });
  res.status(201).json({ success: true, vital });
});

app.get('/api/patients/:id/vitals', async (req, res) => {
  const { type, limit = '50' } = req.query;
  const query: any = { patientId: req.params.id };
  if (type) query.type = type;

  const vitals = await Vital.find(query).sort({ dateTime: -1 }).limit(parseInt(limit as string));
  res.json({ success: true, vitals });
});

// ===== IMMUNIZATIONS =====

app.post('/api/immunizations', async (req, res) => {
  const immunization = await Immunization.create({
    immunizationId: `imm_${uuidv4()}`,
    ...req.body
  });
  res.status(201).json({ success: true, immunization });
});

app.get('/api/patients/:id/immunizations', async (req, res) => {
  const immunizations = await Immunization.find({ patientId: req.params.id }).sort({ date: -1 });
  res.json({ success: true, immunizations });
});

// ===== CLINICAL NOTES =====

app.post('/api/notes', async (req, res) => {
  const note = await ClinicalNote.create({
    noteId: `note_${uuidv4()}`,
    ...req.body
  });
  res.status(201).json({ success: true, note });
});

app.get('/api/patients/:id/notes', async (req, res) => {
  const notes = await ClinicalNote.find({ patientId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, notes });
});

app.patch('/api/notes/:id/sign', async (req, res) => {
  const note = await ClinicalNote.findOneAndUpdate(
    { noteId: req.params.id },
    { signed: true, signedAt: new Date(), signedBy: req.body.signedBy },
    { new: true }
  );
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json({ success: true, note });
});

// ===== LAB RESULTS =====

app.post('/api/lab-results', async (req, res) => {
  const { value, referenceRange } = req.body;

  let flag = 'normal';
  if (value !== undefined && referenceRange) {
    if (value < referenceRange.low) flag = 'low';
    else if (value > referenceRange.high) flag = 'high';
  }

  const result = await LabResult.create({
    resultId: `lab_${uuidv4()}`,
    reportedAt: new Date(),
    flag,
    ...req.body
  });

  // Alert on critical values
  if (flag === 'critical') {
    ecosystem.rabtul.sendPushNotification(
      req.body.patientId,
      'Critical Lab Result',
      `${req.body.testName}: ${value} ${req.body.unit}`
    ).catch(() => {});
  }

  res.status(201).json({ success: true, result });
});

app.get('/api/patients/:id/lab-results', async (req, res) => {
  const results = await LabResult.find({ patientId: req.params.id }).sort({ reportedAt: -1 });
  res.json({ success: true, results });
});

// ===== SUMMARY =====

app.get('/api/patients/:id/summary', async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.id });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const [diagnoses, medications, allergies, recentVitals] = await Promise.all([
    Diagnosis.find({ patientId: req.params.id, status: 'active' }),
    Medication.find({ patientId: req.params.id, status: 'active' }),
    Allergy.find({ patientId: req.params.id, status: 'active' }),
    Vital.find({ patientId: req.params.id }).sort({ dateTime: -1 }).limit(10)
  ]);

  res.json({
    success: true,
    summary: {
      patient: {
        patientId: patient.patientId,
        name: `${patient.demographics.firstName} ${patient.demographics.lastName}`,
        age: patient.demographics.dateOfBirth
          ? Math.floor((Date.now() - new Date(patient.demographics.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null
      },
      activeDiagnoses: diagnoses,
      currentMedications: medications,
      allergies: allergies.map(a => ({ allergen: a.allergen, severity: a.severity, reaction: a.reaction })),
      latestVitals: recentVitals[0] || null,
      problems: diagnoses.filter(d => d.status === 'active' && d.type === 'primary').map(d => d.description)
    }
  });
});

// ===== FHIR EXPORT =====

app.get('/api/patients/:id/fhir', async (req, res) => {
  const patient = await Patient.findOne({ patientId: req.params.id });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const [conditions, medications, observations] = await Promise.all([
    Diagnosis.find({ patientId: req.params.id }),
    Medication.find({ patientId: req.params.id }),
    Vital.find({ patientId: req.params.id })
  ]);

  const fhirBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: patient.patientId,
          identifier: [{ value: patient.mrn }],
          name: [{ family: patient.demographics.lastName, given: [patient.demographics.firstName] }],
          gender: patient.demographics.gender,
          birthDate: patient.demographics.dateOfBirth?.toISOString().split('T')[0]
        }
      },
      ...conditions.map(c => ({
        resource: {
          resourceType: 'Condition',
          id: c.diagnosisId,
          clinicalStatus: { text: c.status },
          code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: c.code, display: c.description }] }
        }
      })),
      ...medications.map(m => ({
        resource: {
          resourceType: 'MedicationRequest',
          id: m.medicationId,
          medicationCodeableConcept: { text: m.name },
          dosageInstruction: [{ text: `${m.dosage} ${m.frequency}` }]
        }
      })),
      ...observations.map(o => ({
        resource: {
          resourceType: 'Observation',
          id: o.vitalId,
          code: { text: o.type },
          valueQuantity: { value: o.value, unit: o.unit }
        }
      }))
    ]
  };

  res.json(fhirBundle);
});

// ============================================
// SERVER STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('EMR Service connected to MongoDB');
    app.listen(PORT, () => {
      logger.info(`RisaCare EMR Service started on port ${PORT}`);
      logger.info('Features: Patient, Encounter, Diagnosis, Medication, Allergy, Vitals, Immunization, Notes, Labs');
    });
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

start();
export default app;
