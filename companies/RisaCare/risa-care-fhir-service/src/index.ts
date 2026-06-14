/**
 * RisaCare FHIR R4 Service
 * Healthcare interoperability standard
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const PORT = parseInt(process.env.PORT || '4761', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_fhir';
const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// FHIR Resource Schemas
const PatientSchema = new mongoose.Schema({
  resourceId: String,
  resourceType: { type: String, default: 'Patient' },
  identifier: [{
    system: String, value: String
  }],
  active: { type: Boolean, default: true },
  name: [{
    use: String, family: String, given: [String]
  }],
  telecom: [{
    system: String, value: String, use: String
  }],
  gender: String,
  birthDate: String,
  address: [{
    use: String, line: [String], city: String, state: String, postalCode: String, country: String
  }]
}, { timestamps: true });

const ObservationSchema = new mongoose.Schema({
  resourceId: String,
  resourceType: { type: String, default: 'Observation' },
  status: String,
  category: String,
  code: { coding: [{ system: String, code: String, display: String }] },
  subject: { reference: String },
  effectiveDateTime: Date,
  valueQuantity: { value: Number, unit: String },
  interpretation: [{ coding: [{ code: String, display: String }] }],
  referenceRange: [{ low: Number, high: Number, unit: String }]
}, { timestamps: true });

const ConditionSchema = new mongoose.Schema({
  resourceId: String,
  resourceType: { type: String, default: 'Condition' },
  clinicalStatus: String,
  verificationStatus: String,
  category: [{ coding: [{ code: String, display: String }] }],
  code: { coding: [{ system: String, code: String, display: String }] },
  subject: { reference: String },
  onsetDateTime: Date,
  recordedDate: Date
}, { timestamps: true });

const MedicationRequestSchema = new mongoose.Schema({
  resourceId: String,
  resourceType: { type: String, default: 'MedicationRequest' },
  status: String,
  intent: String,
  medication: { coding: [{ system: String, code: String, display: String }] },
  subject: { reference: String },
  authoredOn: Date,
  dosageInstruction: [{
    text: String, timing: { repeat: { frequency: Number, period: Number } },
    route: { coding: [{ code: String }] },
    doseAndRate: [{ doseQuantity: { value: Number, unit: String } }]
  }]
}, { timestamps: true });

const Patient = mongoose.model('FHIRPatient', PatientSchema);
const Observation = mongoose.model('FHIRObservation', ObservationSchema);
const Condition = mongoose.model('FHIRCondition', ConditionSchema);
const MedicationRequest = mongoose.model('FHIRMedicationRequest', MedicationRequestSchema);

// FHIR Bundle
interface FHIRBundle {
  resourceType: 'Bundle';
  type: 'searchset' | 'collection' | 'transaction';
  total?: number;
  entry: { resource: any }[];
}

// Health check
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: 'healthy',
    service: 'risa-care-fhir',
    version: '1.0.0',
    fhirVersion: 'R4',
    database: dbState === 1 ? 'connected' : 'disconnected'
  });
});

// Metadata
app.get('/metadata', (req, res) => {
  res.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        { type: 'Patient', interaction: [{ code: 'read' }, { code: 'search-type' }, { code: 'create' }] },
        { type: 'Observation', interaction: [{ code: 'read' }, { code: 'search-type' }, { code: 'create' }] },
        { type: 'Condition', interaction: [{ code: 'read' }, { code: 'search-type' }, { code: 'create' }] },
        { type: 'MedicationRequest', interaction: [{ code: 'read' }, { code: 'search-type' }, { code: 'create' }] }
      ]
    }]
  });
});

// Patient endpoints
app.post('/Patient', async (req, res) => {
  const patient = new Patient({
    resourceId: uuidv4(),
    ...req.body
  });
  await patient.save();
  logger.info('Patient created', { resourceId: patient.resourceId });
  res.status(201).json({ ...patient.toObject(), id: patient.resourceId });
});

app.get('/Patient/:id', async (req, res) => {
  const patient = await Patient.findOne({ resourceId: req.params.id });
  if (!patient) return res.status(404).json({ resourceType: 'OperationOutcome', issue: [{ severity: 'error', code: 'not-found' }] });
  res.json({ ...patient.toObject(), id: patient.resourceId });
});

app.get('/Patient', async (req, res) => {
  const { name, gender, birthdate } = req.query;
  const query: any = {};
  if (name) query['name.family'] = { $regex: name, $options: 'i' };
  if (gender) query.gender = gender;
  if (birthdate) query.birthDate = birthdate;

  const patients = await Patient.find(query).limit(50);
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: patients.length,
    entry: patients.map(p => ({ resource: { ...p.toObject(), id: p.resourceId } }))
  };
  res.json(bundle);
});

// Observation endpoints
app.post('/Observation', async (req, res) => {
  const obs = new Observation({
    resourceId: uuidv4(),
    ...req.body
  });
  await obs.save();
  logger.info('Observation created', { resourceId: obs.resourceId });
  res.status(201).json({ ...obs.toObject(), id: obs.resourceId });
});

app.get('/Observation/:id', async (req, res) => {
  const obs = await Observation.findOne({ resourceId: req.params.id });
  if (!obs) return res.status(404).json({ resourceType: 'OperationOutcome' });
  res.json({ ...obs.toObject(), id: obs.resourceId });
});

app.get('/Observation', async (req, res) => {
  const { patient, category, code, date } = req.query;
  const query: any = {};
  if (patient) query['subject.reference'] = `Patient/${patient}`;
  if (category) query.category = category;
  if (code) query['code.coding.code'] = code;
  if (date) query.effectiveDateTime = { $gte: new Date(date as string) };

  const observations = await Observation.find(query).sort({ effectiveDateTime: -1 }).limit(100);
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: observations.length,
    entry: observations.map(o => ({ resource: { ...o.toObject(), id: o.resourceId } }))
  };
  res.json(bundle);
});

// Condition endpoints
app.post('/Condition', async (req, res) => {
  const condition = new Condition({
    resourceId: uuidv4(),
    ...req.body
  });
  await condition.save();
  logger.info('Condition created', { resourceId: condition.resourceId });
  res.status(201).json({ ...condition.toObject(), id: condition.resourceId });
});

app.get('/Condition', async (req, res) => {
  const { patient, 'clinical-status': clinicalStatus } = req.query;
  const query: any = {};
  if (patient) query['subject.reference'] = `Patient/${patient}`;
  if (clinicalStatus) query.clinicalStatus = clinicalStatus;

  const conditions = await Condition.find(query);
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: conditions.length,
    entry: conditions.map(c => ({ resource: { ...c.toObject(), id: c.resourceId } }))
  };
  res.json(bundle);
});

// MedicationRequest endpoints
app.post('/MedicationRequest', async (req, res) => {
  const med = new MedicationRequest({
    resourceId: uuidv4(),
    ...req.body
  });
  await med.save();
  logger.info('MedicationRequest created', { resourceId: med.resourceId });
  res.status(201).json({ ...med.toObject(), id: med.resourceId });
});

app.get('/MedicationRequest', async (req, res) => {
  const { patient, status } = req.query;
  const query: any = {};
  if (patient) query['subject.reference'] = `Patient/${patient}`;
  if (status) query.status = status;

  const meds = await MedicationRequest.find(query);
  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'searchset',
    total: meds.length,
    entry: meds.map(m => ({ resource: { ...m.toObject(), id: m.resourceId } }))
  };
  res.json(bundle);
});

// Patient summary (all data)
app.get('/Patient/:id/$everything', async (req, res) => {
  const patientId = req.params.id;
  const patient = await Patient.findOne({ resourceId: patientId });
  if (!patient) return res.status(404).json({ resourceType: 'OperationOutcome' });

  const observations = await Observation.find({ 'subject.reference': `Patient/${patientId}` });
  const conditions = await Condition.find({ 'subject.reference': `Patient/${patientId}` });
  const medications = await MedicationRequest.find({ 'subject.reference': `Patient/${patientId}` });

  const bundle: FHIRBundle = {
    resourceType: 'Bundle',
    type: 'collection',
    entry: [
      { resource: { ...patient.toObject(), id: patient.resourceId } },
      ...observations.map(o => ({ resource: { ...o.toObject(), id: o.resourceId } })),
      ...conditions.map(c => ({ resource: { ...c.toObject(), id: c.resourceId } })),
      ...medications.map(m => ({ resource: { ...m.toObject(), id: m.resourceId } }))
    ]
  };
  res.json(bundle);
});

// Sync to external FHIR server
app.post('/$sync', async (req, res) => {
  const { targetUrl, patientId } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'targetUrl required' });

  const patient = await Patient.findOne({ resourceId: patientId });
  const observations = await Observation.find({ 'subject.reference': `Patient/${patientId}` });
  const conditions = await Condition.find({ 'subject.reference': `Patient/${patientId}` });

  // In production, POST each resource to target FHIR server
  logger.info('Syncing to external FHIR server', { targetUrl, patientId });

  res.json({ success: true, synced: { patient: !!patient, observations: observations.length, conditions: conditions.length } });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  logger.info('FHIR R4 Service started on port', PORT);
  app.listen(PORT, () => logger.info(`FHIR R4 started on port ${PORT}`));
}

start().catch(e => { logger.error(e); process.exit(1); });
export default app;
